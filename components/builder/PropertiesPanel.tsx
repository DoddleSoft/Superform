"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElements } from "./FormElements";

export function PropertiesPanel() {
    const { selectedElement, removeElement } = useFormBuilder();

    if (!selectedElement) {
        return (
            <div className="w-80 border-l border-base-300 h-full p-4 bg-base-100 flex items-center justify-center text-base-content/50">
                Select an element to edit properties
            </div>
        );
    }

    const PropertiesComponent = FormElements[selectedElement.type].propertiesComponent;

    return (
        <div className="w-80 border-l border-base-300 h-full p-4 overflow-y-auto bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Properties</h3>
                <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => removeElement(selectedElement.id)}
                >
                    Delete
                </button>
            </div>

            <PropertiesComponent element={selectedElement} />
        </div>
    );
}
