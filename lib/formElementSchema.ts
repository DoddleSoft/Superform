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
    includeTime: z.boolean().optional().describe("Whether to include a time picker"),
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

// New field schemas
export const emailFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the email input"),
    helperText: z.string().optional().describe("Helper text shown below the input"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text (e.g., 'name@example.com')"),
});

export const phoneFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the phone input"),
    helperText: z.string().optional().describe("Helper text shown below the input"),
    required: z.boolean().describe("Whether this field is required"),
    placeholder: z.string().optional().describe("Placeholder text (e.g., '+1 (555) 000-0000')"),
});

export const radioGroupAttributesSchema = z.object({
    label: z.string().describe("The question or label for the single choice field"),
    helperText: z.string().optional().describe("Helper text shown below the options"),
    required: z.boolean().describe("Whether selecting an option is required"),
    options: z.array(z.string()).min(2).describe("Array of option values to choose from"),
});

export const checkboxGroupAttributesSchema = z.object({
    label: z.string().describe("The question or label for the multiple choice field"),
    helperText: z.string().optional().describe("Helper text shown below the options"),
    required: z.boolean().describe("Whether at least one selection is required"),
    minSelect: z.number().min(0).optional().describe("Minimum number of selections (0 = no minimum)"),
    maxSelect: z.number().min(0).optional().describe("Maximum number of selections (0 = no limit)"),
    options: z.array(z.string()).min(2).describe("Array of option values to choose from"),
});

export const ratingFieldAttributesSchema = z.object({
    label: z.string().describe("The label text for the rating field"),
    helperText: z.string().optional().describe("Helper text shown below the rating"),
    required: z.boolean().describe("Whether a rating is required"),
    maxRating: z.number().min(3).max(10).describe("Maximum rating value (3-10)"),
    ratingStyle: z.enum(["stars", "numbers"]).describe("Display style: 'stars' for star icons, 'numbers' for numeric buttons"),
});

export const yesNoFieldAttributesSchema = z.object({
    label: z.string().describe("The question or label for the yes/no field"),
    helperText: z.string().optional().describe("Helper text shown below the buttons"),
    required: z.boolean().describe("Whether an answer is required"),
    yesLabel: z.string().optional().describe("Custom label for the Yes button (default: 'Yes')"),
    noLabel: z.string().optional().describe("Custom label for the No button (default: 'No')"),
});

export const headingFieldAttributesSchema = z.object({
    title: z.string().describe("The heading text to display"),
    subtitle: z.string().optional().describe("Optional subtitle or description text"),
    level: z.enum(["h1", "h2", "h3", "h4"]).describe("Heading level for semantic HTML and sizing"),
    align: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
});

export const richTextFieldAttributesSchema = z.object({
    content: z.string().describe("The rich text content. Supports markdown: **bold**, *italic*, [links](url)"),
    align: z.enum(["left", "center", "right"]).optional().describe("Text alignment"),
});

export const fileUploadFieldAttributesSchema = z.object({
    label: z.string().describe("The label text shown above the file upload area"),
    helperText: z.string().optional().describe("Helper text shown below the upload area"),
    required: z.boolean().describe("Whether a file must be uploaded"),
    acceptedTypes: z.enum(["all", "images", "documents", "pdf"]).optional().describe("Type of files allowed: 'all', 'images', 'documents', or 'pdf'"),
    maxFileSizeMB: z.number().min(1).max(50).optional().describe("Maximum file size in MB (1-50)"),
    allowMultiple: z.boolean().optional().describe("Whether multiple files can be uploaded"),
});

export const imageFieldAttributesSchema = z.object({
    imageUrl: z.string().describe("The URL of the image to display"),
    altText: z.string().optional().describe("Alt text for accessibility"),
    caption: z.string().optional().describe("Optional caption below the image"),
    width: z.enum(["small", "medium", "large", "full"]).optional().describe("Image width: 'small', 'medium', 'large', or 'full'"),
    align: z.enum(["left", "center", "right"]).optional().describe("Image alignment"),
    borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).optional().describe("Corner roundness"),
    aspectRatio: z.enum(["auto", "16:9", "4:3", "1:1", "3:2", "2:3", "21:9"]).optional().describe("Force a specific aspect ratio"),
    shadow: z.enum(["none", "sm", "md", "lg", "xl"]).optional().describe("Shadow size"),
    linkUrl: z.string().optional().describe("Optional URL to link the image to"),
    linkNewTab: z.boolean().optional().describe("Whether to open link in new tab"),
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
    z.object({
        type: z.literal("Email"),
        extraAttributes: emailFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Phone"),
        extraAttributes: phoneFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("RadioGroup"),
        extraAttributes: radioGroupAttributesSchema,
    }),
    z.object({
        type: z.literal("CheckboxGroup"),
        extraAttributes: checkboxGroupAttributesSchema,
    }),
    z.object({
        type: z.literal("Rating"),
        extraAttributes: ratingFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("YesNo"),
        extraAttributes: yesNoFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Heading"),
        extraAttributes: headingFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("RichText"),
        extraAttributes: richTextFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("FileUpload"),
        extraAttributes: fileUploadFieldAttributesSchema,
    }),
    z.object({
        type: z.literal("Image"),
        extraAttributes: imageFieldAttributesSchema,
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
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Email"),
        extraAttributes: emailFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Phone"),
        extraAttributes: phoneFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("RadioGroup"),
        extraAttributes: radioGroupAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("CheckboxGroup"),
        extraAttributes: checkboxGroupAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Rating"),
        extraAttributes: ratingFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("YesNo"),
        extraAttributes: yesNoFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Heading"),
        extraAttributes: headingFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("RichText"),
        extraAttributes: richTextFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("FileUpload"),
        extraAttributes: fileUploadFieldAttributesSchema,
    }),
    z.object({
        id: z.string().describe("The unique identifier of the existing field"),
        type: z.literal("Image"),
        extraAttributes: imageFieldAttributesSchema,
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
        type: z.enum(["TextField", "Number", "TextArea", "Date", "Checkbox", "Select", "Email", "Phone", "RadioGroup", "CheckboxGroup", "Rating", "YesNo", "Heading", "RichText", "FileUpload", "Image"]).optional().describe("New field type (optional - only if changing the type)"),
        extraAttributes: z.object({
            // Common attributes
            label: z.string().optional(),
            helperText: z.string().optional(),
            required: z.boolean().optional(),
            placeholder: z.string().optional(),
            // TextArea specific
            rows: z.number().min(1).max(20).optional(),
            // Select/Radio/Checkbox group specific
            options: z.array(z.string()).optional(),
            // Date specific
            includeTime: z.boolean().optional(),
            // Checkbox group specific
            minSelect: z.number().min(0).optional(),
            maxSelect: z.number().min(0).optional(),
            // Rating specific
            maxRating: z.number().min(3).max(10).optional(),
            ratingStyle: z.enum(["stars", "numbers"]).optional(),
            // YesNo specific
            yesLabel: z.string().optional(),
            noLabel: z.string().optional(),
            // Heading specific
            title: z.string().optional(),
            subtitle: z.string().optional(),
            level: z.enum(["h1", "h2", "h3", "h4"]).optional(),
            // Rich text specific
            content: z.string().optional(),
            // Common layout
            align: z.enum(["left", "center", "right"]).optional(),
            // FileUpload specific
            acceptedTypes: z.enum(["all", "images", "documents", "pdf"]).optional(),
            maxFileSizeMB: z.number().min(1).max(50).optional(),
            allowMultiple: z.boolean().optional(),
            // Image specific
            imageUrl: z.string().optional(),
            altText: z.string().optional(),
            caption: z.string().optional(),
            width: z.enum(["small", "medium", "large", "full"]).optional(),
            borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).optional(),
            aspectRatio: z.enum(["auto", "16:9", "4:3", "1:1", "3:2", "2:3", "21:9"]).optional(),
            shadow: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
            linkUrl: z.string().optional(),
            linkNewTab: z.boolean().optional(),
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

// Schema for creating a new section
export const addSectionSchema = z.object({
    title: z.string().describe("The title of the new section"),
    description: z.string().optional().describe("Optional description for the section"),
    showTitle: z.boolean().optional().describe("Whether to show the section title to end users"),
    insertAfterSectionId: z.string().optional().describe("ID of section after which to insert. If not provided, section is added at the end."),
    elements: z.array(formElementSchema).optional().describe("Optional initial elements to add to the section"),
});

// Schema for updating a section
export const updateSectionSchema = z.object({
    sectionId: z.string().describe("The ID of the section to update"),
    updates: z.object({
        title: z.string().optional().describe("New title for the section"),
        description: z.string().optional().describe("New description for the section"),
        showTitle: z.boolean().optional().describe("Whether to show the section title to end users"),
    }).describe("Partial updates to apply to the section"),
});

// Schema for deleting a section
export const deleteSectionSchema = z.object({
    sectionId: z.string().describe("The ID of the section to delete. All fields in the section will also be deleted."),
});

// Schema for adding elements side-by-side in a row
export const addElementsToRowSchema = z.object({
    sectionId: z.string().describe("The ID of the section containing the target row"),
    targetElementId: z.string().describe("The ID of an existing element. The new element will be placed next to it."),
    position: z.enum(["left", "right"]).describe("Where to place the new element relative to the target: 'left' or 'right'"),
    element: formElementSchema.describe("The new element to add side-by-side"),
});

// Schema for updating form style (layout mode)
export const updateFormStyleSchema = z.object({
    style: z.enum(["classic", "typeform"]).describe("Form layout style: 'classic' (traditional scrollable form) or 'typeform' (one question at a time with animations)"),
});

// Schema for updating form design settings
export const updateDesignSettingsSchema = z.object({
    settings: z.object({
        backgroundColor: z.string().optional().describe("Background color hex code (e.g., '#ffffff')"),
        primaryColor: z.string().optional().describe("Primary/accent color hex code (e.g., '#6366f1')"),
        textColor: z.string().optional().describe("Text color hex code (e.g., '#1f2937')"),
        buttonColor: z.string().optional().describe("Button background color hex code"),
        buttonTextColor: z.string().optional().describe("Button text color hex code"),
        fontFamily: z.enum(["system", "inter", "roboto", "poppins", "open-sans", "lato", "montserrat", "playfair", "merriweather"]).optional().describe("Font family for the form"),
        buttonCornerRadius: z.enum(["none", "sm", "md", "lg", "full"]).optional().describe("Button corner roundness"),
        questionSpacing: z.enum(["compact", "normal", "relaxed"]).optional().describe("Spacing between questions"),
        showSections: z.boolean().optional().describe("Whether to show section cards (classic layout only)"),
    }).describe("Partial design settings to update"),
});

// Schema for updating thank you page
export const updateThankYouPageSchema = z.object({
    settings: z.object({
        title: z.string().optional().describe("Thank you page title (e.g., 'Thank You!')"),
        description: z.string().optional().describe("Thank you message shown after submission"),
        showConfetti: z.boolean().optional().describe("Whether to show confetti animation"),
        buttonText: z.string().optional().describe("Text for the optional button"),
        buttonUrl: z.string().optional().describe("URL to redirect when button is clicked"),
        showButton: z.boolean().optional().describe("Whether to show the redirect button"),
    }).describe("Partial thank you page settings to update"),
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
export type AddSectionInput = z.infer<typeof addSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type DeleteSectionInput = z.infer<typeof deleteSectionSchema>;
export type AddElementsToRowInput = z.infer<typeof addElementsToRowSchema>;
export type UpdateFormStyleInput = z.infer<typeof updateFormStyleSchema>;
export type UpdateDesignSettingsInput = z.infer<typeof updateDesignSettingsSchema>;
export type UpdateThankYouPageInput = z.infer<typeof updateThankYouPageSchema>;
