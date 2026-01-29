"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
    useCallback,
} from "react";
import { FormElementInstance, FormSection, FormContent, createSection } from "@/types/form-builder";

type FormBuilderContextType = {
    // Section management
    sections: FormSection[];
    setSections: Dispatch<SetStateAction<FormSection[]>>;
    currentSectionId: string | null;
    setCurrentSectionId: Dispatch<SetStateAction<string | null>>;
    
    // Section CRUD
    addSection: (index: number, section?: FormSection) => FormSection;
    removeSection: (sectionId: string) => void;
    updateSection: (sectionId: string, updates: Partial<Omit<FormSection, "id" | "elements">>) => void;
    reorderSections: (sectionIds: string[]) => void;
    
    // Element management (now section-aware)
    selectedElement: FormElementInstance | null;
    setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;
    addElement: (sectionId: string, index: number, element: FormElementInstance) => void;
    removeElement: (sectionId: string, elementId: string) => void;
    updateElement: (sectionId: string, elementId: string, updates: Partial<FormElementInstance>) => void;
    updateElementById: (elementId: string, updates: Partial<FormElementInstance>) => void; // Convenience method that finds section automatically
    removeElementById: (elementId: string) => void; // Convenience method that finds section automatically
    moveElement: (fromSectionId: string, toSectionId: string, elementId: string, newIndex: number) => void;
    findElementSection: (elementId: string) => string | null; // Helper to find which section contains an element

    // Form Metadata
    formId: string | null;
    isPublished: boolean;
    shareUrl: string | null;
    setFormMetadata: (id: string, published: boolean, shareUrl: string | null) => void;
    
    // Selected section for properties panel
    selectedSection: FormSection | null;
    setSelectedSection: Dispatch<SetStateAction<FormSection | null>>;
};

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
    undefined
);

export function FormBuilderProvider({ children }: { children: ReactNode }) {
    const [sections, setSections] = useState<FormSection[]>([]);
    const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
    const [selectedElement, setSelectedElement] = useState<FormElementInstance | null>(null);
    const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
    const [formId, setFormId] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    const setFormMetadata = useCallback((id: string, published: boolean, url: string | null) => {
        setFormId(id);
        setIsPublished(published);
        setShareUrl(url);
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

    const updateSection = useCallback((sectionId: string, updates: Partial<Omit<FormSection, "id" | "elements">>) => {
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

    // Element operations (section-aware)
    const addElement = useCallback((sectionId: string, index: number, element: FormElementInstance) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id === sectionId) {
                    const newElements = [...section.elements];
                    newElements.splice(index, 0, element);
                    return { ...section, elements: newElements };
                }
                return section;
            })
        );
        setSelectedElement(element);
        setSelectedSection(null);
    }, []);

    const removeElement = useCallback((sectionId: string, elementId: string) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        elements: section.elements.filter((el) => el.id !== elementId),
                    };
                }
                return section;
            })
        );
        if (selectedElement?.id === elementId) {
            setSelectedElement(null);
        }
    }, [selectedElement]);

    const updateElement = useCallback((sectionId: string, elementId: string, updates: Partial<FormElementInstance>) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id === sectionId) {
                    return {
                        ...section,
                        elements: section.elements.map((el) =>
                            el.id === elementId ? { ...el, ...updates } : el
                        ),
                    };
                }
                return section;
            })
        );
        if (selectedElement?.id === elementId) {
            setSelectedElement((prev) => prev ? { ...prev, ...updates } : null);
        }
    }, [selectedElement]);

    const moveElement = useCallback((fromSectionId: string, toSectionId: string, elementId: string, newIndex: number) => {
        setSections((prev) => {
            // Find the element
            const fromSection = prev.find((s) => s.id === fromSectionId);
            const element = fromSection?.elements.find((el) => el.id === elementId);
            if (!element) return prev;

            return prev.map((section) => {
                if (section.id === fromSectionId && fromSectionId !== toSectionId) {
                    // Remove from source
                    return {
                        ...section,
                        elements: section.elements.filter((el) => el.id !== elementId),
                    };
                }
                if (section.id === toSectionId) {
                    // Add to target
                    const newElements = section.elements.filter((el) => el.id !== elementId);
                    newElements.splice(newIndex, 0, element);
                    return { ...section, elements: newElements };
                }
                return section;
            });
        });
    }, []);

    // Helper to find which section contains an element
    const findElementSection = useCallback((elementId: string): string | null => {
        for (const section of sections) {
            if (section.elements.some(el => el.id === elementId)) {
                return section.id;
            }
        }
        return null;
    }, [sections]);

    // Convenience method that finds section automatically
    const updateElementById = useCallback((elementId: string, updates: Partial<FormElementInstance>) => {
        const sectionId = findElementSection(elementId);
        if (sectionId) {
            updateElement(sectionId, elementId, updates);
        }
    }, [findElementSection, updateElement]);

    // Convenience method that finds section automatically
    const removeElementById = useCallback((elementId: string) => {
        const sectionId = findElementSection(elementId);
        if (sectionId) {
            removeElement(sectionId, elementId);
        }
    }, [findElementSection, removeElement]);

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
                removeElement,
                updateElement,
                updateElementById,
                removeElementById,
                moveElement,
                findElementSection,
                formId,
                isPublished,
                shareUrl,
                setFormMetadata,
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
