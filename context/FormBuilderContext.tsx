"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
} from "react";
import { FormElementInstance, FormElementType } from "@/types/form-builder";

type FormBuilderContextType = {
    elements: FormElementInstance[];
    setElements: Dispatch<SetStateAction<FormElementInstance[]>>;
    selectedElement: FormElementInstance | null;
    setSelectedElement: Dispatch<SetStateAction<FormElementInstance | null>>;
    addElement: (type: FormElementType) => void;
    removeElement: (id: string) => void;
    updateElement: (id: string, updates: Partial<FormElementInstance>) => void;
};

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
    undefined
);

export function FormBuilderProvider({ children }: { children: ReactNode }) {
    const [elements, setElements] = useState<FormElementInstance[]>([]);
    const [selectedElement, setSelectedElement] = useState<FormElementInstance | null>(
        null
    );

    const addElement = (type: FormElementType) => {
        const newElement: FormElementInstance = {
            id: crypto.randomUUID(),
            type,
            label: `New ${type}`,
            placeholder: "",
            required: false,
            properties: {},
        };
        setElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
    };

    const removeElement = (id: string) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        if (selectedElement?.id === id) {
            setSelectedElement(null);
        }
    };

    const updateElement = (id: string, updates: Partial<FormElementInstance>) => {
        setElements((prev) =>
            prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
        );
        // Update selected element ref if matches
        if (selectedElement?.id === id) {
            setSelectedElement((prev) => prev ? { ...prev, ...updates } : null);
        }
    };

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
