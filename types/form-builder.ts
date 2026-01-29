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

// Section represents a full-screen page in Typeform-like experience
export interface FormSection {
    id: string;
    title: string;
    description?: string;
    elements: FormElementInstance[];
}

// Form content is now an array of sections
export type FormContent = FormSection[];

// Helper to create a new section with defaults
export function createSection(id: string, title?: string): FormSection {
    return {
        id,
        title: title || "Untitled Section",
        description: "",
        elements: [],
    };
}

// Form types for dashboard
export interface Form {
    id: string;
    user_id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    content: FormContent; // Changed from FormElementInstance[] to FormContent (Section[])
    published: boolean;
    share_url: string | null;
    created_at: string;
    updated_at: string;
    submission_count?: number; // Computed field from aggregation
}

export interface FormWithStats extends Form {
    submission_count: number;
}

// Workspace type
export interface Workspace {
    id: string;
    user_id: string;
    name: string;
    is_default: boolean;
    created_at: string;
}

// Pagination types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface GetFormsParams {
    workspaceId: string;
    page?: number;
    pageSize?: number;
    search?: string;
}
