"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
} from "react";
import { FormElementInstance, FormSection, FormContent, createSection, FormStyle, CanvasTab, FormDesignSettings, DEFAULT_DESIGN_SETTINGS, FormRow, createRow, getSectionElements, ThankYouPageSettings, DEFAULT_THANK_YOU_PAGE } from "@/types/form-builder";

// Published snapshot for diff comparison
interface PublishedSnapshot {
    content: FormContent | null;
    style: FormStyle | null;
    designSettings: FormDesignSettings | null;
    thankYouPage: ThankYouPageSettings | null;
}

// Drop position for elements - 'before', 'after', or 'side' (add to same row)
export type DropPosition = 'before' | 'after' | 'side';

type FormBuilderContextType = {
    // Section management
    sections: FormSection[];
    setSections: Dispatch<SetStateAction<FormSection[]>>;
    currentSectionId: string | null;
    setCurrentSectionId: Dispatch<SetStateAction<string | null>>;
    
    // Section CRUD
    addSection: (index: number, section?: FormSection) => FormSection;
    removeSection: (sectionId: string) => void;
    updateSection: (sectionId: string, updates: Partial<Omit<FormSection, "id" | "rows">>) => void;
    reorderSections: (sectionIds: string[]) => void;
    
    // Row-based element management
    selectedElement: FormElementInstance | null;
    setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;
    
    // Add element to a new row at index, or add to existing row
    addElement: (sectionId: string, rowIndex: number, element: FormElementInstance, position?: DropPosition, targetRowId?: string) => void;
    // Add element to the side of an existing element (same row)
    addElementToRow: (sectionId: string, rowId: string, element: FormElementInstance, position: 'left' | 'right') => void;
    // Remove element from its row (and remove row if empty)
    removeElement: (sectionId: string, elementId: string) => void;
    updateElement: (sectionId: string, elementId: string, updates: Partial<FormElementInstance>) => void;
    updateElementById: (elementId: string, updates: Partial<FormElementInstance>) => void;
    removeElementById: (elementId: string) => void;
    // Move element between rows/sections
    moveElement: (
        fromSectionId: string, 
        toSectionId: string, 
        elementId: string, 
        toRowIndex: number, 
        position?: DropPosition,
        targetRowId?: string
    ) => void;
    // Find section and row for an element
    findElementLocation: (elementId: string) => { sectionId: string; rowId: string; rowIndex: number } | null;
    findElementSection: (elementId: string) => string | null;
    
    // Get all elements from a section (flattened from rows) - for backward compatibility
    getSectionElements: (sectionId: string) => FormElementInstance[];

    // Form Metadata
    formId: string | null;
    isPublished: boolean;
    shareUrl: string | null;
    setFormMetadata: (
        id: string, 
        published: boolean, 
        shareUrl: string | null, 
        style?: FormStyle, 
        designSettings?: FormDesignSettings, 
        thankYouPage?: ThankYouPageSettings,
        versionInfo?: { currentVersion: number; publishedAt: string | null },
        publishedSnapshot?: PublishedSnapshot
    ) => void;
    
    // Form Style
    formStyle: FormStyle;
    setFormStyle: Dispatch<SetStateAction<FormStyle>>;
    
    // Design Settings
    designSettings: FormDesignSettings;
    setDesignSettings: Dispatch<SetStateAction<FormDesignSettings>>;
    updateDesignSetting: <K extends keyof FormDesignSettings>(key: K, value: FormDesignSettings[K]) => void;
    
    // Thank You Page Settings
    thankYouPage: ThankYouPageSettings;
    setThankYouPage: Dispatch<SetStateAction<ThankYouPageSettings>>;
    updateThankYouPage: <K extends keyof ThankYouPageSettings>(key: K, value: ThankYouPageSettings[K]) => void;
    
    // Canvas Tab (form | design | logic)
    canvasTab: CanvasTab;
    setCanvasTab: Dispatch<SetStateAction<CanvasTab>>;
    
    // Selected Thank You Page (for properties panel)
    isThankYouPageSelected: boolean;
    setIsThankYouPageSelected: Dispatch<SetStateAction<boolean>>;
    
    // Versioning
    currentVersion: number;
    hasUnpublishedChanges: boolean;
    publishedAt: string | null;
    setVersionInfo: (version: number, publishedAt: string | null) => void;
    
    // Published snapshot management
    updatePublishedSnapshot: (snapshot: PublishedSnapshot) => void;
    
    // Selected section for properties panel
    selectedSection: FormSection | null;
    setSelectedSection: Dispatch<SetStateAction<FormSection | null>>;
};

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
    undefined
);

// Helper to create a stable string representation for comparison
function createFormSnapshot(
    content: FormContent | null,
    style: FormStyle | null,
    designSettings: FormDesignSettings | null,
    thankYouPage: ThankYouPageSettings | null
): string {
    return JSON.stringify({ content, style, designSettings, thankYouPage });
}

export function FormBuilderProvider({ children }: { children: ReactNode }) {
    const [sections, setSections] = useState<FormSection[]>([]);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [selectedElement, setSelectedElement] = useState<FormElementInstance | null>(null);
    const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
    const [isThankYouPageSelected, setIsThankYouPageSelected] = useState(false);
    const [formId, setFormId] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [formStyle, setFormStyle] = useState<FormStyle>('classic');
    const [designSettings, setDesignSettings] = useState<FormDesignSettings>(DEFAULT_DESIGN_SETTINGS);
    const [thankYouPage, setThankYouPage] = useState<ThankYouPageSettings>(DEFAULT_THANK_YOU_PAGE);
    const [canvasTab, setCanvasTab] = useState<CanvasTab>('form');
    
    // Versioning state
    const [currentVersion, setCurrentVersion] = useState<number>(0);
    const [publishedAt, setPublishedAt] = useState<string | null>(null);
    
    // Published snapshot for diff-based comparison
    const [publishedSnapshot, setPublishedSnapshot] = useState<PublishedSnapshot>({
        content: null,
        style: null,
        designSettings: null,
        thankYouPage: null,
    });

    // Compute hasUnpublishedChanges by comparing current state with published snapshot
    const hasUnpublishedChanges = useMemo(() => {
        // If never published, no "unpublished changes" concept applies
        if (!isPublished) {
            return false;
        }
        
        // If published snapshot is empty (no published content), consider no changes
        if (publishedSnapshot.content === null) {
            return false;
        }
        
        // Create string representations for comparison
        const currentSnapshot = createFormSnapshot(sections, formStyle, designSettings, thankYouPage);
        const publishedSnapshotStr = createFormSnapshot(
            publishedSnapshot.content,
            publishedSnapshot.style,
            publishedSnapshot.designSettings,
            publishedSnapshot.thankYouPage
        );
        
        // Compare the two snapshots
        return currentSnapshot !== publishedSnapshotStr;
    }, [isPublished, sections, formStyle, designSettings, thankYouPage, publishedSnapshot]);

    const updatePublishedSnapshot = useCallback((snapshot: PublishedSnapshot) => {
        setPublishedSnapshot(snapshot);
    }, []);

    const setFormMetadata = useCallback((
        id: string, 
        published: boolean, 
        url: string | null, 
        style?: FormStyle,
        designSettingsData?: FormDesignSettings,
        thankYouPageData?: ThankYouPageSettings,
        versionInfo?: { currentVersion: number; publishedAt: string | null },
        snapshot?: PublishedSnapshot
    ) => {
        setFormId(id);
        setIsPublished(published);
        setShareUrl(url);
        if (style) {
            setFormStyle(style);
        }
        if (designSettingsData) {
            setDesignSettings({ ...DEFAULT_DESIGN_SETTINGS, ...designSettingsData });
        }
        if (thankYouPageData) {
            setThankYouPage({ ...DEFAULT_THANK_YOU_PAGE, ...thankYouPageData });
        }
        if (versionInfo) {
            setCurrentVersion(versionInfo.currentVersion);
            setPublishedAt(versionInfo.publishedAt);
        }
        if (snapshot) {
            setPublishedSnapshot(snapshot);
        }
    }, []);

    // Helper to update a single design setting
    const updateDesignSetting = useCallback(<K extends keyof FormDesignSettings>(
        key: K, 
        value: FormDesignSettings[K]
    ) => {
        setDesignSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    // Helper to update a single thank you page setting
    const updateThankYouPage = useCallback(<K extends keyof ThankYouPageSettings>(
        key: K, 
        value: ThankYouPageSettings[K]
    ) => {
        setThankYouPage(prev => ({ ...prev, [key]: value }));
    }, []);

    const setVersionInfo = useCallback((version: number, pubAt: string | null) => {
        setCurrentVersion(version);
        setPublishedAt(pubAt);
    }, []);

    // Section CRUD operations
    const addSection = useCallback((index: number, section?: FormSection): FormSection => {
        const newSection = section || createSection(crypto.randomUUID());
        setSections((prev) => {
            const newSections = [...prev];
            newSections.splice(index, 0, newSection);
            return newSections;
        });
        setCurrentSectionId(newSection.id);
        setSelectedSection(newSection);
        setSelectedElement(null);
        return newSection;
    }, []);

    const removeSection = useCallback((sectionId: string) => {
        setSections((prev) => {
            const filtered = prev.filter((s) => s.id !== sectionId);
            // If removing current section, switch to another
            if (currentSectionId === sectionId && filtered.length > 0) {
                setCurrentSectionId(filtered[0].id);
            } else if (filtered.length === 0) {
                setCurrentSectionId(null);
            }
            return filtered;
        });
        if (selectedSection?.id === sectionId) {
            setSelectedSection(null);
        }
    }, [currentSectionId, selectedSection]);

    const updateSection = useCallback((sectionId: string, updates: Partial<Omit<FormSection, "id" | "rows">>) => {
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
        );
        if (selectedSection?.id === sectionId) {
            setSelectedSection((prev) => prev ? { ...prev, ...updates } : null);
        }
    }, [selectedSection]);

    const reorderSections = useCallback((sectionIds: string[]) => {
        setSections((prev) => {
            const sectionMap = new Map(prev.map((s) => [s.id, s]));
            return sectionIds.map((id) => sectionMap.get(id)!).filter(Boolean);
        });
    }, []);

    // Helper to get all elements from a section (flattened from rows)
    const getSectionElementsHelper = useCallback((sectionId: string): FormElementInstance[] => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return [];
        return getSectionElements(section);
    }, [sections]);

    // Row-based element operations
    const addElement = useCallback((
        sectionId: string, 
        rowIndex: number, 
        element: FormElementInstance, 
        position: DropPosition = 'after',
        targetRowId?: string
    ) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const newRows = [...section.rows];
                
                // If adding to the side of an existing row
                if (position === 'side' && targetRowId) {
                    const targetRowIdx = newRows.findIndex(r => r.id === targetRowId);
                    if (targetRowIdx !== -1 && newRows[targetRowIdx].elements.length < 2) {
                        newRows[targetRowIdx] = {
                            ...newRows[targetRowIdx],
                            elements: [...newRows[targetRowIdx].elements, element]
                        };
                        return { ...section, rows: newRows };
                    }
                }
                
                // Create a new row and insert at position
                const newRow = createRow(crypto.randomUUID(), element);
                newRows.splice(rowIndex, 0, newRow);
                return { ...section, rows: newRows };
            })
        );
        setSelectedElement(element);
        setSelectedSection(null);
    }, []);

    // Add element to the side of an existing element (same row)
    const addElementToRow = useCallback((
        sectionId: string, 
        rowId: string, 
        element: FormElementInstance, 
        position: 'left' | 'right'
    ) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const newRows = section.rows.map(row => {
                    if (row.id !== rowId) return row;
                    // Max 2 elements per row
                    if (row.elements.length >= 2) return row;
                    
                    const newElements = position === 'left' 
                        ? [element, ...row.elements]
                        : [...row.elements, element];
                    return { ...row, elements: newElements };
                });
                
                return { ...section, rows: newRows };
            })
        );
        setSelectedElement(element);
        setSelectedSection(null);
    }, []);

    const removeElement = useCallback((sectionId: string, elementId: string) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;

                const newRows = section.rows
                    .map(row => ({
                        ...row,
                        elements: row.elements.filter(el => el.id !== elementId)
                    }))
                    .filter(row => row.elements.length > 0); // Remove empty rows

                return { ...section, rows: newRows };
            })
        );
        if (selectedElement?.id === elementId) {
            setSelectedElement(null);
        }
    }, [selectedElement]);

    const updateElement = useCallback((sectionId: string, elementId: string, updates: Partial<FormElementInstance>) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) return section;
                
                return {
                    ...section,
                    rows: section.rows.map(row => ({
                        ...row,
                        elements: row.elements.map(el =>
                            el.id === elementId ? { ...el, ...updates } : el
                        )
                    }))
                };
            })
        );
        if (selectedElement?.id === elementId) {
            setSelectedElement((prev) => prev ? { ...prev, ...updates } : null);
        }
    }, [selectedElement]);

    const moveElement = useCallback((
        fromSectionId: string, 
        toSectionId: string, 
        elementId: string, 
        toRowIndex: number,
        position: DropPosition = 'after',
        targetRowId?: string
    ) => {
        setSections((prev) => {
            // Find the element
            let element: FormElementInstance | undefined;
            for (const section of prev) {
                for (const row of section.rows) {
                    element = row.elements.find(el => el.id === elementId);
                    if (element) break;
                }
                if (element) break;
            }
            if (!element) return prev;

            return prev.map((section) => {
                // Remove from source section
                if (section.id === fromSectionId) {
                    const newRows = section.rows
                        .map(row => ({
                            ...row,
                            elements: row.elements.filter(el => el.id !== elementId)
                        }))
                        .filter(row => row.elements.length > 0);

                    // If same section, also add to target position
                    if (fromSectionId === toSectionId) {
                        // Adding to the side of an existing row
                        if (position === 'side' && targetRowId) {
                            const targetRowIdx = newRows.findIndex(r => r.id === targetRowId);
                            if (targetRowIdx !== -1 && newRows[targetRowIdx].elements.length < 2) {
                                newRows[targetRowIdx] = {
                                    ...newRows[targetRowIdx],
                                    elements: [...newRows[targetRowIdx].elements, element]
                                };
                                return { ...section, rows: newRows };
                            }
                        }
                        // Create new row
                        const newRow = createRow(crypto.randomUUID(), element);
                        newRows.splice(toRowIndex, 0, newRow);
                    }

                    return { ...section, rows: newRows };
                }
                
                // Add to target section (different from source)
                if (section.id === toSectionId && fromSectionId !== toSectionId) {
                    const newRows = [...section.rows];
                    
                    // Adding to the side of an existing row
                    if (position === 'side' && targetRowId) {
                        const targetRowIdx = newRows.findIndex(r => r.id === targetRowId);
                        if (targetRowIdx !== -1 && newRows[targetRowIdx].elements.length < 2) {
                            newRows[targetRowIdx] = {
                                ...newRows[targetRowIdx],
                                elements: [...newRows[targetRowIdx].elements, element]
                            };
                            return { ...section, rows: newRows };
                        }
                    }
                    
                    // Create new row
                    const newRow = createRow(crypto.randomUUID(), element);
                    newRows.splice(toRowIndex, 0, newRow);
                    return { ...section, rows: newRows };
                }
                
                return section;
            });
        });
    }, []);

    // Helper to find section and row for an element
    const findElementLocation = useCallback((elementId: string): { sectionId: string; rowId: string; rowIndex: number } | null => {
        for (const section of sections) {
            for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
                const row = section.rows[rowIndex];
                if (row.elements.some(el => el.id === elementId)) {
                    return { sectionId: section.id, rowId: row.id, rowIndex };
                }
            }
        }
        return null;
    }, [sections]);

    // Helper to find which section contains an element
    const findElementSection = useCallback((elementId: string): string | null => {
        const location = findElementLocation(elementId);
        return location?.sectionId ?? null;
    }, [findElementLocation]);

    // Convenience method that finds section automatically
    const updateElementById = useCallback((elementId: string, updates: Partial<FormElementInstance>) => {
        const location = findElementLocation(elementId);
        if (location) {
            updateElement(location.sectionId, elementId, updates);
        }
    }, [findElementLocation, updateElement]);

    // Convenience method that finds section automatically
    const removeElementById = useCallback((elementId: string) => {
        const location = findElementLocation(elementId);
        if (location) {
            removeElement(location.sectionId, elementId);
        }
    }, [findElementLocation, removeElement]);

    return (
        <FormBuilderContext.Provider
            value={{
                sections,
                setSections,
                currentSectionId,
                setCurrentSectionId,
                addSection,
                removeSection,
                updateSection,
                reorderSections,
                selectedElement,
                setSelectedElement,
                addElement,
                addElementToRow,
                removeElement,
                updateElement,
                updateElementById,
                removeElementById,
                moveElement,
                findElementLocation,
                findElementSection,
                getSectionElements: getSectionElementsHelper,
                formId,
                isPublished,
                shareUrl,
                setFormMetadata,
                formStyle,
                setFormStyle,
                designSettings,
                setDesignSettings,
                updateDesignSetting,
                thankYouPage,
                setThankYouPage,
                updateThankYouPage,
                canvasTab,
                setCanvasTab,
                isThankYouPageSelected,
                setIsThankYouPageSelected,
                currentVersion,
                hasUnpublishedChanges,
                publishedAt,
                setVersionInfo,
                updatePublishedSnapshot,
                selectedSection,
                setSelectedSection,
            }}
        >
            {children}
        </FormBuilderContext.Provider>
    );
}

export const useFormBuilder = () => {
    const context = useContext(FormBuilderContext);
    if (!context) {
        throw new Error("useFormBuilder must be used within a FormBuilderProvider");
    }
    return context;
};
