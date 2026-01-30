export enum FormElementType {
    TEXT_FIELD = "TextField",
    NUMBER = "Number",
    TEXTAREA = "TextArea",
    DATE = "Date",
    CHECKBOX = "Checkbox",
    SELECT = "Select",
    EMAIL = "Email",
    PHONE = "Phone",
    RADIO_GROUP = "RadioGroup",
    CHECKBOX_GROUP = "CheckboxGroup",
    RATING = "Rating",
    YES_NO = "YesNo",
    HEADING = "Heading",
    RICH_TEXT = "RichText",
}

// Form display styles
// 'classic' - One page sectioned form (all sections visible vertically)
// 'typeform' - Typeform-like step-by-step experience with slide animations
export type FormStyle = 'classic' | 'typeform';

// Canvas tabs in builder
export type CanvasTab = 'form' | 'design' | 'logic';

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
    content: FormContent; // Draft content (auto-saved)
    published: boolean;
    style: FormStyle; // Draft style
    share_url: string | null;
    created_at: string;
    updated_at: string;
    submission_count?: number; // Computed field from aggregation
    // Versioning fields
    published_content: FormContent | null; // Content shown to end users
    published_style: FormStyle | null; // Style used for published form
    published_at: string | null; // When last published
    current_version: number; // Current published version (0 = never published)
    has_unpublished_changes: boolean; // True if draft differs from published
}

// Form version for version history
export interface FormVersion {
    id: string;
    form_id: string;
    version: number;
    content: FormContent;
    style: FormStyle;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string;
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
