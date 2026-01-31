import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, UIMessage } from "ai";
import {
    generateFormSchema,
    deleteFieldsSchema,
    updateFieldSchema,
    replaceFormSchema,
    reorderFieldsSchema,
    reorderSectionsSchema,
    addSectionSchema,
    updateSectionSchema,
    deleteSectionSchema,
    addElementsToRowSchema,
    updateFormStyleSchema,
    updateDesignSettingsSchema,
    updateThankYouPageSchema,
} from "@/lib/formElementSchema";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an AI assistant specialized in helping users build forms. You work within a form builder application where users can create forms with various field types, organize them into sections, customize the design, and create personalized thank you pages.

## Your Capabilities
You can help users by:
1. **Field Management**: Add, delete, update, and reorder form fields
2. **Section Management**: Create, update, delete, and reorder sections (pages in typeform mode)
3. **Layout**: Place fields side-by-side for multi-column layouts
4. **Form Style**: Switch between 'classic' (scrollable) and 'typeform' (one question at a time) layouts
5. **Design Settings**: Customize colors, fonts, button styles, and spacing
6. **Thank You Page**: Customize the confirmation page shown after submission
7. Suggesting improvements to form structure and design best practices

## Available Form Field Types

### Input Fields
- **TextField**: Single-line text input (label, placeholder, helperText, required)
- **Number**: Numeric input (label, placeholder, helperText, required)
- **TextArea**: Multi-line text (label, placeholder, helperText, required, rows: 1-20)
- **Email**: Email input with validation (label, placeholder, helperText, required)
- **Phone**: Phone number input (label, placeholder, helperText, required)
- **Date**: Date picker (label, helperText, required, includeTime)

### Selection Fields
- **Select**: Dropdown selection (label, placeholder, helperText, required, options: string[])
- **RadioGroup**: Single choice from options (label, helperText, required, options: string[])
- **CheckboxGroup**: Multiple choice (label, helperText, required, options, minSelect, maxSelect)
- **Checkbox**: Single checkbox for agreements (label, helperText, required)
- **YesNo**: Yes/No buttons (label, helperText, required, yesLabel, noLabel)
- **Rating**: Star or number rating (label, helperText, required, maxRating: 3-10, ratingStyle: 'stars'|'numbers')

### Display Elements (Non-input)
- **Heading**: Section headers (title, subtitle, level: 'h1'|'h2'|'h3'|'h4', align)
- **RichText**: Formatted text/paragraphs (content with markdown, align)
- **Image**: Display images (imageUrl, altText, caption, width, align, borderRadius, aspectRatio, shadow, linkUrl)

### File Fields
- **FileUpload**: File upload area (label, helperText, required, acceptedTypes: 'all'|'images'|'documents'|'pdf', maxFileSizeMB: 1-50, allowMultiple)

## Tool Selection Guidelines

### Field Operations
- **addFields**: Add new fields. Use insertAfterFieldId to position them. Use sectionId to specify target section.
- **deleteFields**: Remove fields by their IDs.
- **updateField**: Modify a field's properties (label, placeholder, required, options, etc.).
- **reorderFields**: Change field order within a section. Provide ALL field IDs in new order.

### Section Operations
- **addSection**: Create a new section with optional initial elements.
- **updateSection**: Change section title, description, or showTitle setting.
- **deleteSection**: Remove a section and all its fields.
- **reorderSections**: Change the order of sections.

### Layout Operations
- **addElementToRow**: Add a field side-by-side with an existing field (max 2 per row).
- **replaceForm**: Completely rebuild the form. Use sparingly - only for full restructuring.

### Style & Design Operations
- **updateFormStyle**: Switch between 'classic' and 'typeform' layouts.
- **updateDesignSettings**: Customize colors, fonts, button styles, and spacing.
- **updateThankYouPage**: Customize the confirmation page (title, description, confetti, button).

## Form Styles
- **classic**: Traditional scrollable form with all sections visible. Good for short forms.
- **typeform**: One question/section at a time with smooth animations. Great for longer forms and better completion rates.

## Design Settings Available
- Colors: backgroundColor, primaryColor, textColor, buttonColor, buttonTextColor (hex codes like '#6366f1')
- Font: fontFamily ('system', 'inter', 'roboto', 'poppins', 'open-sans', 'lato', 'montserrat', 'playfair', 'merriweather')
- Buttons: buttonCornerRadius ('none', 'sm', 'md', 'lg', 'full')
- Layout: questionSpacing ('compact', 'normal', 'relaxed'), showSections (true/false for classic mode)

## Thank You Page Settings
- title: Heading shown after submission (e.g., "Thank You!")
- description: Message below the title
- showConfetti: Enable/disable confetti animation
- showButton: Show a redirect button
- buttonText: Text for the redirect button
- buttonUrl: URL to redirect to

## Critical Rules
1. Always reference existing fields/sections by their ID when modifying or deleting
2. When replacing a field, use deleteFields first, then addFields with insertAfterFieldId
3. For side-by-side layouts, use addElementToRow (max 2 fields per row)
4. Section IDs are required for reorderFields and addElementToRow operations
5. Provide brief explanations of your changes
6. Be conversational and helpful in responses

## Examples
- "Add first name and last name side by side" → Use addFields for first field, then addElementToRow to place second next to it
- "Make it look more modern" → Use updateDesignSettings with modern colors and 'typeform' style
- "Add a file upload for resume" → Use addFields with FileUpload type and acceptedTypes: 'documents'
- "Create sections for personal info and work experience" → Use addSection for each section`;

export async function POST(req: Request) {
    const {
        messages,
        formId,
        currentFormState,
    }: {
        messages: UIMessage[];
        formId: string;
        currentFormState?: Array<{
            id: string;
            title: string;
            description?: string;
            showTitle?: boolean;
            elements: Array<{
                id: string;
                type: string;
                extraAttributes: Record<string, unknown>;
                rowId?: string;
                rowPosition?: number;
            }>;
        }>;
    } = await req.json();

    // Build a context message about the current form state
    let formStateContext = "";
    if (currentFormState && currentFormState.length > 0) {
        const sectionsList = currentFormState.map((section, sectionIndex) => {
            const fieldList = section.elements
                .map((field, fieldIndex) => {
                    const label = (field.extraAttributes?.label as string) || (field.extraAttributes?.title as string) || "Untitled";
                    const required = field.extraAttributes?.required ? " [Required]" : "";
                    const rowInfo = field.rowId && field.rowPosition !== undefined && field.rowPosition > 0 
                        ? ` (side-by-side in row ${field.rowId})` 
                        : "";
                    return `    ${fieldIndex + 1}. "${label}" (ID: ${field.id}, Type: ${field.type})${required}${rowInfo}`;
                })
                .join("\n");
            
            return `Section ${sectionIndex + 1}: "${section.title}" (ID: ${section.id})${section.showTitle ? " [Title visible]" : ""}\n${section.description ? `  Description: ${section.description}\n` : ""}  Fields:\n${fieldList || "    (no fields)"}`;
        }).join("\n\n");

        const totalFields = currentFormState.reduce((sum, s) => sum + s.elements.length, 0);
        formStateContext = `\n\n## Current Form Structure\nThe form has ${currentFormState.length} section(s) with ${totalFields} total field(s):\n\n${sectionsList}\n\nFull state for reference:\n${JSON.stringify(currentFormState, null, 2)}`;
    } else {
        formStateContext = "\n\n## Current Form State\nThe form is currently empty. No sections or fields have been added yet.";
    }

    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_PROMPT + formStateContext,
        messages: await convertToModelMessages(messages),
        tools: {
            // Field Operations
            addFields: tool({
                description: `Add new form fields to the form. Use insertAfterFieldId to specify position (ID of the field after which to insert). Use sectionId to target a specific section. If neither is provided, fields are added to the end of the current/first section.`,
                inputSchema: generateFormSchema,
                execute: async (input) => {
                    return { success: true, action: "addFields", count: input.elements.length };
                },
            }),
            deleteFields: tool({
                description: `Delete one or more fields from the form by their IDs. When replacing fields, call this first, then call addFields with insertAfterFieldId to add new fields in the same position.`,
                inputSchema: deleteFieldsSchema,
                execute: async (input) => {
                    return { success: true, action: "deleteFields", count: input.fieldIds.length };
                },
            }),
            updateField: tool({
                description: `Update an existing field's properties. Use this to change label, placeholder, required status, options, styling, or any other attribute. Only include properties that need to change.`,
                inputSchema: updateFieldSchema,
                execute: async (input) => {
                    return { success: true, action: "updateField", fieldId: input.fieldId };
                },
            }),
            reorderFields: tool({
                description: `Reorder fields within a section. Provide the section ID and ALL field IDs in the new desired order.`,
                inputSchema: reorderFieldsSchema,
                execute: async (input) => {
                    return { success: true, action: "reorderFields", sectionId: input.sectionId, count: input.fieldIds.length };
                },
            }),

            // Section Operations
            addSection: tool({
                description: `Create a new section (page in typeform mode). Sections help organize form fields into logical groups. Use insertAfterSectionId to position it.`,
                inputSchema: addSectionSchema,
                execute: async (input) => {
                    return { success: true, action: "addSection", title: input.title };
                },
            }),
            updateSection: tool({
                description: `Update a section's title, description, or showTitle setting.`,
                inputSchema: updateSectionSchema,
                execute: async (input) => {
                    return { success: true, action: "updateSection", sectionId: input.sectionId };
                },
            }),
            deleteSection: tool({
                description: `Delete a section and all fields within it.`,
                inputSchema: deleteSectionSchema,
                execute: async (input) => {
                    return { success: true, action: "deleteSection", sectionId: input.sectionId };
                },
            }),
            reorderSections: tool({
                description: `Reorder sections. Provide ALL section IDs in the new desired order.`,
                inputSchema: reorderSectionsSchema,
                execute: async (input) => {
                    return { success: true, action: "reorderSections", count: input.sectionIds.length };
                },
            }),

            // Layout Operations
            addElementToRow: tool({
                description: `Add a field side-by-side with an existing field. Maximum 2 fields per row. Use this for multi-column layouts like "First Name | Last Name".`,
                inputSchema: addElementsToRowSchema,
                execute: async (input) => {
                    return { success: true, action: "addElementToRow", targetElementId: input.targetElementId, position: input.position };
                },
            }),
            replaceForm: tool({
                description: `Replace the entire form structure with new sections and fields. Use this ONLY for complete form rebuilds. All existing content will be removed.`,
                inputSchema: replaceFormSchema,
                execute: async (input) => {
                    return { success: true, action: "replaceForm", sectionCount: input.sections.length };
                },
            }),

            // Style & Design Operations
            updateFormStyle: tool({
                description: `Change the form layout style. 'classic' shows all sections on one scrollable page. 'typeform' shows one section/question at a time with smooth animations.`,
                inputSchema: updateFormStyleSchema,
                execute: async (input) => {
                    return { success: true, action: "updateFormStyle", style: input.style };
                },
            }),
            updateDesignSettings: tool({
                description: `Update the form's visual design: colors (backgroundColor, primaryColor, textColor, buttonColor, buttonTextColor), font (fontFamily), button style (buttonCornerRadius), and layout (questionSpacing, showSections).`,
                inputSchema: updateDesignSettingsSchema,
                execute: async (input) => {
                    return { success: true, action: "updateDesignSettings", settings: Object.keys(input.settings) };
                },
            }),
            updateThankYouPage: tool({
                description: `Customize the thank you/confirmation page shown after form submission. Can set title, description, confetti animation, and optional redirect button.`,
                inputSchema: updateThankYouPageSchema,
                execute: async (input) => {
                    return { success: true, action: "updateThankYouPage", settings: Object.keys(input.settings) };
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}
