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
    extraAttributes?: Record<string, any>;
}

export type FormElementInstance = FormElement & {
    id: string; // Instance ID (unique in the form)
};

export type FormElementHelper = {
    type: FormElementType;
    construct: (id: string) => FormElementInstance;
    designerComponent: React.FC<{ element: FormElementInstance }>;
    formComponent: React.FC<{ element: FormElementInstance; submitValue?: (key: string, value: string) => void; isInvalid?: boolean; defaultValue?: string }>;
    propertiesComponent: React.FC<{ element: FormElementInstance }>;
    validate: (formElement: FormElementInstance, currentValue: string) => boolean;
    label: string;
};
