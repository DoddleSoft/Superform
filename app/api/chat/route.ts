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

const SYSTEM_PROMPT = `You are an AI form builder assistant. Help users create beautiful, functional forms step by step.

## Workflow

1. **Brief announcement** (1 sentence): State what you'll do
2. **Execute ONE tool**: Call a single tool to make the change
3. **Short confirmation**: "Click Apply to continue, or tell me what to adjust."

## Task Order (when building new forms)
1. Form structure (replaceForm) → 2. Style (updateFormStyle) → 3. Design (updateDesignSettings) → 4. Thank you page (updateThankYouPage)

When user clicks Apply, proceed to the next logical step automatically.

## Design Palettes (hex codes)
- Professional: bg '#f8fafc', primary '#3b82f6', text '#1e293b', button '#2563eb'
- Indigo: bg '#faf5ff', primary '#6366f1', text '#1e1b4b', button '#4f46e5'  
- Emerald: bg '#f0fdf4', primary '#10b981', text '#064e3b', button '#059669'
- Rose: bg '#fdf2f8', primary '#ec4899', text '#500724', button '#db2777'
- Dark: bg '#18181b', primary '#a78bfa', text '#fafafa', button '#8b5cf6'

Fonts: 'inter'/'system' (business), 'poppins'/'montserrat' (modern), 'playfair' (elegant)
Buttons: 'lg'/'full' (modern), 'md' (professional), 'sm' (corporate)

## Field Types
**Inputs**: TextField, Number, TextArea, Email, Phone, Date
**Selection**: Select, RadioGroup, CheckboxGroup, Checkbox, YesNo, Rating
**Display**: Heading, RichText, Image
**Files**: FileUpload

## Tools
- **replaceForm**: Build entire form structure
- **addFields/deleteFields/updateField**: Modify fields
- **addSection/updateSection/deleteSection**: Manage sections  
- **updateFormStyle**: Set 'classic' or 'typeform' layout
- **updateDesignSettings**: Colors, fonts, buttons
- **updateThankYouPage**: Confirmation page settings

## Rules
- ONE tool per response
- Be opinionated — make beautiful forms
- Keep messages concise (1-2 sentences)
- Reference field/section IDs when modifying existing elements`;

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
            pendingStep?: "style" | "design" | "thankYou";
            formStyle?: string;
            designApplied?: boolean;
            thankYouApplied?: boolean;
        };
    } = await req.json();

    // Build form state context
    let formStateContext = "";
    if (currentFormState && currentFormState.length > 0) {
        const sectionsList = currentFormState.map((section, i) => {
            const fields = section.elements
                .map((f, j) => {
                    const label = (f.extraAttributes?.label as string) || (f.extraAttributes?.title as string) || f.type;
                    return `  ${j + 1}. ${label} (${f.type}, ID: ${f.id})`;
                })
                .join("\n");
            return `${i + 1}. "${section.title}" (ID: ${section.id})\n${fields || "  (empty)"}`;
        }).join("\n\n");

        formStateContext = `\n\n## Current Form\n${currentFormState.length} section(s):\n\n${sectionsList}`;
    } else {
        formStateContext = "\n\n## Current Form\nEmpty — no sections or fields yet.";
    }

    // Add workflow context for continuation
    let workflowInfo = "";
    if (workflowContext?.pendingStep) {
        const stepMap = {
            style: "Now set the form style (typeform or classic).",
            design: "Now apply the design settings (colors, fonts, buttons).",
            thankYou: "Now customize the thank you page.",
        };
        workflowInfo = `\n\n## Next Step\nUser applied changes. ${stepMap[workflowContext.pendingStep]}`;
    }
    if (workflowContext?.formStyle) {
        workflowInfo += `\nCurrent style: ${workflowContext.formStyle}`;
    }

    const result = streamText({
        model: openai("gpt-5-mini"),
        system: SYSTEM_PROMPT + formStateContext + workflowInfo,
        messages: await convertToModelMessages(messages),
        providerOptions: {
            openai: {
                reasoningSummary: "auto",
            },
        },
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
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
}
