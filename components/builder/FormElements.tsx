"use client";

import { FormElementInstance, FormElementType } from "@/types/form-builder";
import { TextFieldFormElement } from "./fields/TextField";
import { TextAreaFormElement } from "./fields/TextArea";
import { NumberFormElement } from "./fields/NumberField";

export type FormElementHelper = {
    type: FormElementType;
    construct: (id: string) => FormElementInstance;
    designerComponent: React.FC<{ element: FormElementInstance }>;
    formComponent: React.FC<{ element: FormElementInstance; submitValue?: (key: string, value: string) => void; isInvalid?: boolean; defaultValue?: string }>;
    propertiesComponent: React.FC<{ element: FormElementInstance }>;
    validate: (formElement: FormElementInstance, currentValue: string) => boolean;
    label: string;
};

// Helper to create placeholders reusing TextField
const createPlaceholder = (type: FormElementType, label: string): FormElementHelper => ({
    ...TextFieldFormElement,
    type,
    label,
    construct: (id: string) => ({
        ...TextFieldFormElement.construct(id),
        type,
        label,
    }),
    validate: () => true, // Placeholder validation always passes
});

export const FormElements: Record<FormElementType, FormElementHelper> = {
    [FormElementType.TEXT_FIELD]: TextFieldFormElement,
    [FormElementType.NUMBER]: NumberFormElement,
    [FormElementType.TEXTAREA]: TextAreaFormElement,
    [FormElementType.DATE]: createPlaceholder(FormElementType.DATE, "Date Field"),
    [FormElementType.CHECKBOX]: createPlaceholder(FormElementType.CHECKBOX, "Checkbox"),
    [FormElementType.SELECT]: createPlaceholder(FormElementType.SELECT, "Select Field"),
};
