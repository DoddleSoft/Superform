import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, UIMessage, stepCountIs } from "ai";
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

const SYSTEM_PROMPT = `You are an AI form builder agent. You work autonomously to build complete, beautiful forms for users in a single response.

## Your Workflow

When a user asks you to build or modify a form:

1. **Brief Explanation**: Start with a short message (1-2 sentences) explaining what you'll create.

2. **Build Everything at Once**: Use the replaceForm tool to create the complete form with:
   - All sections organized logically
   - All fields with proper types and attributes
   - This is the most efficient approach for new forms

3. **Apply Styling**: Use updateFormStyle to set the layout (typeform or classic)

4. **Apply Design**: Use updateDesignSettings for colors, fonts, and styling

5. **Customize Thank You Page**: Use updateThankYouPage for the confirmation message

## IMPORTANT: Call ALL tools in a single response!

When building a complete form, call these tools together:
- replaceForm (with all sections and fields)
- updateFormStyle (typeform or classic)
- updateDesignSettings (colors, fonts, button style)
- updateThankYouPage (title, description, confetti)

Do NOT wait for user confirmation between steps. Generate all tool calls at once.

## When to Use Which Tools

**For new forms or complete rebuilds**: Use replaceForm with all sections/fields in one call.

**For modifications to existing forms**:
- addFields / deleteFields / updateField - for individual field changes
- addSection / updateSection / deleteSection - for section changes
- addElementToRow - for side-by-side layouts
- reorderFields / reorderSections - for reordering

## Communication Style

- Be brief and decisive
- Don't ask for permission - make good design choices
- If user denies changes, ask what they'd prefer

## Design Guidelines

### Modern Color Palettes (use hex codes)
- **Professional Blue**: backgroundColor: '#f8fafc', primaryColor: '#3b82f6', textColor: '#1e293b', buttonColor: '#2563eb', buttonTextColor: '#ffffff'
- **Elegant Indigo**: backgroundColor: '#faf5ff', primaryColor: '#6366f1', textColor: '#1e1b4b', buttonColor: '#4f46e5', buttonTextColor: '#ffffff'
- **Fresh Emerald**: backgroundColor: '#f0fdf4', primaryColor: '#10b981', textColor: '#064e3b', buttonColor: '#059669', buttonTextColor: '#ffffff'
- **Warm Coral**: backgroundColor: '#fff7ed', primaryColor: '#f97316', textColor: '#431407', buttonColor: '#ea580c', buttonTextColor: '#ffffff'
- **Modern Rose**: backgroundColor: '#fdf2f8', primaryColor: '#ec4899', textColor: '#500724', buttonColor: '#db2777', buttonTextColor: '#ffffff'
- **Sleek Dark**: backgroundColor: '#18181b', primaryColor: '#a78bfa', textColor: '#fafafa', buttonColor: '#8b5cf6', buttonTextColor: '#ffffff'
- **Ocean Teal**: backgroundColor: '#f0fdfa', primaryColor: '#14b8a6', textColor: '#134e4a', buttonColor: '#0d9488', buttonTextColor: '#ffffff'
- **Sunset Orange**: backgroundColor: '#fffbeb', primaryColor: '#f59e0b', textColor: '#451a03', buttonColor: '#d97706', buttonTextColor: '#ffffff'

### Font Recommendations
- **Business/Professional**: 'inter', 'system'
- **Creative/Modern**: 'poppins', 'montserrat'
- **Elegant/Formal**: 'playfair', 'merriweather'
- **Friendly/Casual**: 'open-sans', 'lato'

### Button Styles
- Modern minimal: buttonCornerRadius: 'lg' or 'full'
- Professional: buttonCornerRadius: 'md'
- Sharp/Corporate: buttonCornerRadius: 'sm' or 'none'

## Available Field Types

### Input Fields
- **TextField**: Single-line text (label, placeholder, helperText, required)
- **Number**: Numeric input (label, placeholder, helperText, required)
- **TextArea**: Multi-line text (label, placeholder, helperText, required, rows: 1-20)
- **Email**: Email with validation (label, placeholder, helperText, required)
- **Phone**: Phone number (label, placeholder, helperText, required)
- **Date**: Date picker (label, helperText, required, includeTime)

### Selection Fields
- **Select**: Dropdown (label, placeholder, helperText, required, options: string[])
- **RadioGroup**: Single choice (label, helperText, required, options: string[])
- **CheckboxGroup**: Multiple choice (label, helperText, required, options, minSelect, maxSelect)
- **Checkbox**: Agreement checkbox (label, helperText, required)
- **YesNo**: Yes/No buttons (label, helperText, required, yesLabel, noLabel)
- **Rating**: Star/number rating (label, helperText, required, maxRating: 3-10, ratingStyle)

### Display Elements
- **Heading**: Section headers (title, subtitle, level: 'h1'|'h2'|'h3'|'h4', align)
- **RichText**: Formatted text (content with markdown, align)
- **Image**: Display images (imageUrl, altText, caption, width, align, borderRadius, aspectRatio, shadow, linkUrl)

### File Fields
- **FileUpload**: File upload (label, helperText, required, acceptedTypes, maxFileSizeMB, allowMultiple)

## Tool Selection Guidelines

### Field Operations
- **addFields**: Add new fields. Use insertAfterFieldId to position them. Use sectionId to specify target section.
- **deleteFields**: Remove fields by their IDs.
- **updateField**: Modify a field's properties.
- **reorderFields**: Change field order within a section.

### Section Operations
- **addSection**: Create a new section with optional initial elements.
- **updateSection**: Change section title, description, or showTitle setting.
- **deleteSection**: Remove a section and all fields within it.
- **reorderSections**: Change the order of sections.

### Layout Operations
- **addElementToRow**: Add a field side-by-side with an existing field (max 2 per row).
- **replaceForm**: Completely rebuild the form with new sections and fields.

### Style & Design Operations
- **updateFormStyle**: Switch between 'classic' and 'typeform' layouts.
- **updateDesignSettings**: Customize colors, fonts, button styles, and spacing.
- **updateThankYouPage**: Customize the confirmation page.

## Critical Rules
1. Call ALL necessary tools in a SINGLE response - don't wait between steps
2. For new forms: use replaceForm + updateFormStyle + updateDesignSettings + updateThankYouPage together
3. Be opinionated about design choices - make the form beautiful
4. Use modern, sophisticated color palettes (not basic red/blue/green)
5. Create complete forms - don't leave out important fields
6. When user denies changes, ask what they'd prefer instead
7. Reference existing fields/sections by their ID when modifying
8. For side-by-side layouts, use addElementToRow (max 2 per row)`;

export async function POST(req: Request) {
    const {
        messages,
        formId,
        currentFormState,
        workflowContext,
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
        workflowContext?: {
            lastAppliedStep?: string;
            deniedStep?: string;
            formStyle?: string;
            designApplied?: boolean;
            thankYouApplied?: boolean;
        };
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
        formStateContext = `\n\n## Current Form Structure\nThe form has ${currentFormState.length} section(s) with ${totalFields} total field(s):\n\n${sectionsList}`;
    } else {
        formStateContext = "\n\n## Current Form State\nThe form is currently empty. No sections or fields have been added yet.";
    }

    // Add workflow context
    let workflowInfo = "";
    if (workflowContext) {
        if (workflowContext.lastAppliedStep) {
            workflowInfo += `\n\n## Workflow Progress\nThe user just applied: ${workflowContext.lastAppliedStep}. Continue with the next step in your workflow.`;
        }
        if (workflowContext.deniedStep) {
            workflowInfo += `\n\n## User Feedback\nThe user denied the changes for: ${workflowContext.deniedStep}. Ask what they would prefer instead.`;
        }
        if (workflowContext.formStyle) {
            workflowInfo += `\nCurrent form style: ${workflowContext.formStyle}`;
        }
        if (workflowContext.designApplied) {
            workflowInfo += `\nDesign settings have been applied.`;
        }
        if (workflowContext.thankYouApplied) {
            workflowInfo += `\nThank you page has been customized.`;
        }
    }

    const result = streamText({
        model: openai("gpt-5-mini"),
        system: SYSTEM_PROMPT + formStateContext + workflowInfo,
        messages: await convertToModelMessages(messages),
        tools: {
            // Field Operations
            addFields: tool({
                description: `Add new form fields to the form. Use insertAfterFieldId to specify position. Use sectionId to target a specific section.`,
                inputSchema: generateFormSchema,
                execute: async (input) => {
                    return { success: true, action: "addFields", count: input.elements.length };
                },
            }),
            deleteFields: tool({
                description: `Delete one or more fields from the form by their IDs.`,
                inputSchema: deleteFieldsSchema,
                execute: async (input) => {
                    return { success: true, action: "deleteFields", count: input.fieldIds.length };
                },
            }),
            updateField: tool({
                description: `Update an existing field's properties. Only include properties that need to change.`,
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
                description: `Create a new section. Sections help organize form fields into logical groups.`,
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
                description: `Add a field side-by-side with an existing field. Maximum 2 fields per row.`,
                inputSchema: addElementsToRowSchema,
                execute: async (input) => {
                    return { success: true, action: "addElementToRow", targetElementId: input.targetElementId, position: input.position };
                },
            }),
            replaceForm: tool({
                description: `Replace the entire form structure with new sections and fields. Use for complete form rebuilds.`,
                inputSchema: replaceFormSchema,
                execute: async (input) => {
                    return { success: true, action: "replaceForm", sectionCount: input.sections.length };
                },
            }),

            // Style & Design Operations
            updateFormStyle: tool({
                description: `Change the form layout style. 'classic' = scrollable, 'typeform' = one question at a time.`,
                inputSchema: updateFormStyleSchema,
                execute: async (input) => {
                    return { success: true, action: "updateFormStyle", style: input.style };
                },
            }),
            updateDesignSettings: tool({
                description: `Update the form's visual design: colors, font, button style, and layout spacing.`,
                inputSchema: updateDesignSettingsSchema,
                execute: async (input) => {
                    return { success: true, action: "updateDesignSettings", settings: Object.keys(input.settings) };
                },
            }),
            updateThankYouPage: tool({
                description: `Customize the thank you/confirmation page shown after form submission.`,
                inputSchema: updateThankYouPageSchema,
                execute: async (input) => {
                    return { success: true, action: "updateThankYouPage", settings: Object.keys(input.settings) };
                },
            }),
        },
        // Enable multi-step tool calling - AI can call multiple tools in sequence
        stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
}
