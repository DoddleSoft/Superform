import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, tool, UIMessage } from "ai";
import {
    generateFormSchema,
    deleteFieldsSchema,
    updateFieldSchema,
    replaceFormSchema,
    reorderFieldsSchema,
} from "@/lib/formElementSchema";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an AI assistant specialized in helping users build forms. You work within a form builder application where users can create forms with various field types.

## Your Capabilities
You can help users by:
1. Creating new forms from scratch using the addFields tool
2. Adding new fields to existing forms using the addFields tool
3. Deleting specific fields using the deleteFields tool
4. Updating/editing existing fields using the updateField tool
5. Replacing the entire form structure using the replaceForm tool
6. Reordering fields using the reorderFields tool
7. Suggesting improvements to form structure
8. Answering questions about form design best practices

## Available Form Field Types
You can create the following field types:

### TextField
A single-line text input field.
- label (required): The label shown above the field
- placeholder (optional): Placeholder text inside the input
- helperText (optional): Descriptive text below the field
- required: Whether the field must be filled out

### Number
A numeric input field.
- label (required): The label shown above the field
- placeholder (optional): Placeholder text inside the input
- helperText (optional): Descriptive text below the field
- required: Whether the field must be filled out

### TextArea
A multi-line text input field.
- label (required): The label shown above the field
- placeholder (optional): Placeholder text inside the textarea
- helperText (optional): Descriptive text below the field
- required: Whether the field must be filled out
- rows (optional): Number of visible text rows (1-20)

### Date
A date picker field.
- label (required): The label shown above the field
- helperText (optional): Descriptive text below the field
- required: Whether the field must be filled out

### Checkbox
A single checkbox for yes/no or agreement fields.
- label (required): The label shown next to the checkbox
- helperText (optional): Descriptive text below the checkbox
- required: Whether the checkbox must be checked

### Select
A dropdown selection field.
- label (required): The label shown above the dropdown
- placeholder (optional): Text shown when nothing is selected
- helperText (optional): Descriptive text below the dropdown
- options (required): Array of string options to choose from
- required: Whether a selection must be made

## Tool Selection Guidelines
- **addFields**: Use to add NEW fields. You can specify insertAfterFieldId to position them.
- **deleteFields**: Use to remove fields by their IDs.
- **updateField**: Use to modify a single field's properties (label, placeholder, required, etc.).
- **replaceForm**: Use ONLY when the user wants to completely rebuild the entire form from scratch. This replaces ALL fields.
- **reorderFields**: Use to change the order of fields. Provide ALL field IDs in the new order.

## CRITICAL: How to Replace/Substitute a Field
When the user asks to "replace X with Y" or "change X to Y", you should:
1. First call deleteFields to remove the old field(s)
2. Then call addFields to add the new field(s), using insertAfterFieldId to position them correctly

For example, to "replace Full Name with First Name and Last Name":
1. Note the field BEFORE "Full Name" (or null if it's the first field)
2. Call deleteFields with the Full Name field ID
3. Call addFields with First Name and Last Name, setting insertAfterFieldId to the field before Full Name

## Important Rules
- Always reference existing fields by their ID when modifying or deleting
- When replacing a field, use BOTH deleteFields AND addFields
- Always provide a brief explanation of what you're doing
- Be conversational and helpful in your responses`;

export async function POST(req: Request) {
    const {
        messages,
        formId,
        currentFormState,
    }: {
        messages: UIMessage[];
        formId: string;
        currentFormState?: Array<{ id: string; type: string; extraAttributes: any }>;
    } = await req.json();

    // Build a context message about the current form state
    let formStateContext = "";
    if (currentFormState && currentFormState.length > 0) {
        const fieldList = currentFormState
            .map(
                (field, index) =>
                    `${index + 1}. "${field.extraAttributes?.label || "Untitled"}" (ID: ${field.id}, Type: ${field.type})${
                        field.extraAttributes?.required ? " [Required]" : ""
                    }`
            )
            .join("\n");
        formStateContext = `\n\n## Current Form Fields\nThe form currently has ${currentFormState.length} field(s):\n${fieldList}\n\nFull field details (use these IDs for editing/deleting):\n${JSON.stringify(currentFormState, null, 2)}`;
    } else {
        formStateContext = "\n\n## Current Form State\nThe form is currently empty. No fields have been added yet.";
    }

    const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_PROMPT + formStateContext,
        messages: await convertToModelMessages(messages),
        tools: {
            addFields: tool({
                description: `Add new form fields. Use insertAfterFieldId to specify position (ID of the field BEFORE which to insert, or omit to append at end). When replacing a field, call deleteFields first, then addFields with insertAfterFieldId set to the field that was BEFORE the deleted field.`,
                inputSchema: generateFormSchema,
                execute: async (input) => {
                    return { success: true, action: "addFields", count: input.elements.length };
                },
            }),
            deleteFields: tool({
                description: `Delete one or more fields from the form by their IDs. When replacing fields, call this first to remove the old field(s), then call addFields with insertAfterFieldId to add new fields in the same position.`,
                inputSchema: deleteFieldsSchema,
                execute: async (input) => {
                    return { success: true, action: "deleteFields", count: input.fieldIds.length };
                },
            }),
            updateField: tool({
                description: `Update/edit an existing field's properties. Use this when users want to change a field's label, placeholder, required status, or other attributes. Only include the properties that need to change.`,
                inputSchema: updateFieldSchema,
                execute: async (input) => {
                    return { success: true, action: "updateField", fieldId: input.fieldId };
                },
            }),
            replaceForm: tool({
                description: `Replace the entire form with a new structure. Use this ONLY when the user wants to completely rebuild the entire form from scratch. All existing sections and fields will be removed and replaced with the new sections. For replacing just one or a few fields, use deleteFields + addFields instead.`,
                inputSchema: replaceFormSchema,
                execute: async (input) => {
                    return { success: true, action: "replaceForm", count: input.sections.length };
                },
            }),
            reorderFields: tool({
                description: `Reorder the fields within a specific section. Provide the section ID and ALL field IDs in the new desired order. The array must contain every field ID in that section exactly once.`,
                inputSchema: reorderFieldsSchema,
                execute: async (input) => {
                    return { success: true, action: "reorderFields", sectionId: input.sectionId, count: input.fieldIds.length };
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}
