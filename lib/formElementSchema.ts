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

// Union schema for all form element types (without id - for new elements)
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

// Form element with ID (for existing elements)
export const formElementWithIdSchema = z.discriminatedUnion("type", [
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("TextField"),
        extraAttributes: textFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Number"),
        extraAttributes: numberFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("TextArea"),
        extraAttributes: textAreaAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Date"),
        extraAttributes: dateFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Checkbox"),
        extraAttributes: checkboxFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Select"),
        extraAttributes: selectFieldAttributesSchema,
    }),
]);

// Section schema for AI to understand the section structure
export const sectionSchema = z.object({
    id: z.string().optional().describe("Optional section ID. Will be generated if not provided."),
    title: z.string().describe("The title of the section displayed at the top"),
    description: z.string().optional().describe("Optional description shown below the title"),
    elements: z.array(formElementSchema).describe("Array of form elements in this section"),
});

export const sectionWithIdSchema = z.object({
    id: z.string().describe("The unique identifier of the existing section"),
    title: z.string().describe("The title of the section displayed at the top"),
    description: z.string().optional().describe("Optional description shown below the title"),
    elements: z.array(formElementWithIdSchema).describe("Array of form elements in this section"),
});

export const formElementsArraySchema = z.array(formElementSchema).describe(
    "Array of form elements to add to the form. Each element will be added in order."
);

// Schema for adding elements to a specific section
export const addElementsToSectionSchema = z.object({
    sectionId: z.string().describe("The ID of the section to add elements to"),
    elements: formElementsArraySchema,
    insertAfterFieldId: z.string().optional().describe("Optional: ID of the field after which to insert the new fields. If not provided, fields are added at the end of the section."),
});

// Schema for creating a new section with elements
export const createSectionSchema = z.object({
    section: sectionSchema.describe("The section to create with its elements"),
    insertAfterSectionId: z.string().optional().describe("Optional: ID of the section after which to insert. If not provided, section is added at the end."),
});

// Wrapper schema for OpenAI which requires object type at root
export const generateFormSchema = z.object({
    elements: formElementsArraySchema,
    insertAfterFieldId: z.string().optional().describe("Optional: ID of the field after which to insert the new fields. If not provided, fields are added at the end."),
});

// Schema for generating a complete form with sections
export const generateFormWithSectionsSchema = z.object({
    sections: z.array(sectionSchema).describe("Array of sections, each containing form elements. Each section will be displayed as a full-screen page."),
});

// Schema for deleting fields
export const deleteFieldsSchema = z.object({
    fieldIds: z.array(z.string()).describe("Array of field IDs to delete from the form"),
});

// Schema for updating a single field
export const updateFieldSchema = z.object({
    fieldId: z.string().describe("The ID of the field to update"),
    updates: z.object({
        type: z.enum(["TextField", "Number", "TextArea", "Date", "Checkbox", "Select"]).optional().describe("New field type (optional - only if changing the type)"),
        extraAttributes: z.object({
            label: z.string().optional(),
            helperText: z.string().optional(),
            required: z.boolean().optional(),
            placeholder: z.string().optional(),
            rows: z.number().min(1).max(20).optional(),
            options: z.array(z.string()).optional(),
        }).describe("Partial attributes to update - only include fields you want to change"),
    }),
});

// Schema for replacing the entire form with sections
export const replaceFormSchema = z.object({
    sections: z.array(sectionWithIdSchema).describe("The complete new form structure with sections. All existing sections will be replaced with this."),
});

// Schema for reordering fields within a section
export const reorderFieldsSchema = z.object({
    sectionId: z.string().describe("The ID of the section containing the fields to reorder"),
    fieldIds: z.array(z.string()).describe("Array of field IDs in the new desired order. Must include all field IDs in the section."),
});

// Schema for reordering sections
export const reorderSectionsSchema = z.object({
    sectionIds: z.array(z.string()).describe("Array of section IDs in the new desired order. Must include all section IDs."),
});

// Type exports
export type GeneratedFormElement = z.infer<typeof formElementSchema>;
export type GeneratedFormElementWithId = z.infer<typeof formElementWithIdSchema>;
export type GeneratedSection = z.infer<typeof sectionSchema>;
export type GeneratedSectionWithId = z.infer<typeof sectionWithIdSchema>;
export type GenerateFormInput = z.infer<typeof generateFormSchema>;
export type GenerateFormWithSectionsInput = z.infer<typeof generateFormWithSectionsSchema>;
export type DeleteFieldsInput = z.infer<typeof deleteFieldsSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type ReplaceFormInput = z.infer<typeof replaceFormSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
export type AddElementsToSectionInput = z.infer<typeof addElementsToSectionSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
