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
import { FormElementInstance, FormElementType } from "@/types/form-builder";

type FormBuilderContextType = {
    elements: FormElementInstance[];
    setElements: Dispatch<SetStateAction<FormElementInstance[]>>;
    selectedElement: FormElementInstance | null;
    setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;
    addElement: (index: number, element: FormElementInstance) => void;
    removeElement: (id: string) => void;
    updateElement: (id: string, updates: Partial<FormElementInstance>) => void;

    // Form Metadata
    formId: string | null;
    isPublished: boolean;
    shareUrl: string | null;
    setFormMetadata: (id: string, published: boolean, shareUrl: string | null) => void;
};

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
    undefined
);

export function FormBuilderProvider({ children }: { children: ReactNode }) {
    const [elements, setElements] = useState<FormElementInstance[]>([]);
    const [selectedElement, setSelectedElement] = useState<FormElementInstance | null>(
        null
    );
    const [formId, setFormId] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);

    const setFormMetadata = useCallback((id: string, published: boolean, url: string | null) => {
        setFormId(id);
        setIsPublished(published);
        setShareUrl(url);
    }, []);

    const addElement = useCallback((index: number, element: FormElementInstance) => {
        setElements((prev) => {
            const newElements = [...prev];
            newElements.splice(index, 0, element);
            return newElements;
        });
        setSelectedElement(element);
    }, []);

    const removeElement = useCallback((id: string) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        if (selectedElement?.id === id) {
            setSelectedElement(null);
        }
    }, [selectedElement]);

    const updateElement = useCallback((id: string, updates: Partial<FormElementInstance>) => {
        setElements((prev) =>
            prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
        );
        // Update selected element ref if matches
        if (selectedElement?.id === id) {
            setSelectedElement((prev) => prev ? { ...prev, ...updates } : null);
        }
    }, [selectedElement]);

    return (
        <FormBuilderContext.Provider
            value={{
                elements,
                setElements,
                selectedElement,
                setSelectedElement,
                addElement,
                removeElement,
                updateElement,
                formId,
                isPublished,
                shareUrl,
                setFormMetadata,
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
