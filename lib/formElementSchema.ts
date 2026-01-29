import { z } from "zod";

// Schema for form elements that AI can generate
export const textFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the input field"),
    helperText: z.string().optional().describe("Helper text shown below the input"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text inside the input"),
});

export const numberFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the input field"),
    helperText: z.string().optional().describe("Helper text shown below the input"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text inside the input"),
});

export const textAreaAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the textarea"),
    helperText: z.string().optional().describe("Helper text shown below the textarea"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text inside the textarea"),
    rows: z.number().min(1).max(20).optional().describe("Number of visible rows (1-20)"),
});

export const dateFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the date picker"),
    helperText: z.string().optional().describe("Helper text shown below the input"),
    required: z.boolean().describe("Whether this field is required"),
});

export const checkboxFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown next to the checkbox"),
    helperText: z.string().optional().describe("Helper text shown below the checkbox"),
    required: z.boolean().describe("Whether this checkbox must be checked"),
});

export const selectFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the select dropdown"),
    helperText: z.string().optional().describe("Helper text shown below the select"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text when nothing is selected"),
    options: z.array(z.string()).min(1).describe("Array of option values for the dropdown"),
});

// Union schema for all form element types
export const formElementSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("TextField"),
        extraAttributes: textFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Number"),
        extraAttributes: numberFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("TextArea"),
        extraAttributes: textAreaAttributesSchema,
    }),
    z.object({
        type: z.literal("Date"),
        extraAttributes: dateFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Checkbox"),
        extraAttributes: checkboxFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Select"),
        extraAttributes: selectFieldAttributesSchema,
    }),
]);

export const formElementsArraySchema = z.array(formElementSchema).describe(
    "Array of form elements to add to the form. Each element will be added in order."
);

// Wrapper schema for OpenAI which requires object type at root
export const generateFormSchema = z.object({
    elements: formElementsArraySchema,
});

export type GeneratedFormElement = z.infer<typeof formElementSchema>;
export type GenerateFormInput = z.infer<typeof generateFormSchema>;
