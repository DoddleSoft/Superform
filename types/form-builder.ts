export enum FormElementType {
    TEXT_FIELD = "TextField",
    NUMBER = "Number",
    TEXTAREA = "TextArea",
    DATE = "Date",
    CHECKBOX = "Checkbox",
    SELECT = "Select",
}

export interface FormElement {
    id: string;
    type: FormElementType;
    label: string;
    placeholder?: string;
    required: boolean;
    properties?: Record<string, any>; // For type-specific props (e.g. options for select)
}

export type FormElementInstance = FormElement & {
    id: string; // Instance ID (unique in the form)
};
