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
    FILE_UPLOAD = "FileUpload",
}

// Form display styles
// 'classic' - One page sectioned form (all sections visible vertically)
// 'typeform' - Typeform-like step-by-step experience with slide animations
export type FormStyle = 'classic' | 'typeform';

// Thank You Page Settings - customizable success/confirmation page
export interface ThankYouPageSettings {
    title: string;
    description: string;
    showConfetti: boolean;
    buttonText: string;
    buttonUrl: string; // Optional redirect URL
    showButton: boolean;
}

// Default Thank You page settings
export const DEFAULT_THANK_YOU_PAGE: ThankYouPageSettings = {
    title: "Thank You!",
    description: "Your response has been submitted successfully. You can close this page now.",
    showConfetti: true,
    buttonText: "Submit another response",
    buttonUrl: "",
    showButton: false,
};

// Font family options for forms
export type FormFontFamily = 
    | 'system' 
    | 'inter' 
    | 'roboto' 
    | 'poppins' 
    | 'open-sans' 
    | 'lato' 
    | 'montserrat'
    | 'playfair'
    | 'merriweather';

// Button corner radius options
export type ButtonCornerRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

// Global design settings for forms
export interface FormDesignSettings {
    // Colors
    backgroundColor: string;
    primaryColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    
    // Typography
    fontFamily: FormFontFamily;
    
    // Button styling
    buttonCornerRadius: ButtonCornerRadius;
    
    // Layout
    questionSpacing: 'compact' | 'normal' | 'relaxed';
    
    // Classic layout specific
    showSections: boolean; // If false, shows all fields in a single page without section cards
}

// Default design settings
export const DEFAULT_DESIGN_SETTINGS: FormDesignSettings = {
    backgroundColor: '#ffffff',
    primaryColor: '#6366f1',
    textColor: '#1f2937',
    buttonColor: '#6366f1',
    buttonTextColor: '#ffffff',
    fontFamily: 'system',
    buttonCornerRadius: 'md',
    questionSpacing: 'normal',
    showSections: true,
};

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

// Row represents a horizontal container for 1-2 elements (allows side-by-side layout)
export interface FormRow {
    id: string;
    elements: FormElementInstance[]; // 1-2 elements per row
}

// Section represents a full-screen page in Typeform-like experience
export interface FormSection {
    id: string;
    title: string;
    description?: string;
    showTitle?: boolean; // Whether to show section title to end users (default: false)
    rows: FormRow[]; // Changed from elements to rows
}

// Helper to create a new row with an element
export function createRow(id: string, element?: FormElementInstance): FormRow {
    return {
        id,
        elements: element ? [element] : [],
    };
}

// Legacy compatibility - get all elements from a section (flattened from rows)
export function getSectionElements(section: FormSection): FormElementInstance[] {
    return section.rows.flatMap(row => row.elements);
}

// Helper to migrate old section format (elements) to new format (rows)
export function migrateToRowFormat(section: any): FormSection {
    // If already has rows, return as-is
    if (section.rows && Array.isArray(section.rows)) {
        return section as FormSection;
    }
    // Migrate from old elements array to rows (one element per row)
    const elements: FormElementInstance[] = section.elements || [];
    return {
        id: section.id,
        title: section.title || "Untitled Section",
        description: section.description,
        showTitle: section.showTitle,
        rows: elements.map(element => createRow(crypto.randomUUID(), element)),
    };
}

// Form content is now an array of sections
export type FormContent = FormSection[];

// Helper to create a new section with defaults
export function createSection(id: string, title?: string): FormSection {
    return {
        id,
        title: title || "Untitled Section",
        description: "",
        showTitle: false,
        rows: [], // Use rows instead of elements
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
    design_settings: FormDesignSettings; // Draft design settings
    thank_you_page: ThankYouPageSettings; // Thank you page settings
    share_url: string | null;
    created_at: string;
    updated_at: string;
    submission_count?: number; // Computed field from aggregation
    // Versioning fields
    published_content: FormContent | null; // Content shown to end users
    published_style: FormStyle | null; // Style used for published form
    published_design_settings: FormDesignSettings | null; // Design settings for published form
    published_thank_you_page: ThankYouPageSettings | null; // Thank you page for published form
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
    design_settings: FormDesignSettings;
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
