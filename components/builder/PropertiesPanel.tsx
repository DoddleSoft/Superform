"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";

export function PropertiesPanel() {
    const { selectedElement, updateElement, removeElement } = useFormBuilder();

    if (!selectedElement) {
        return (
            <div className="w-80 border-l border-base-300 h-full p-4 bg-base-100 flex items-center justify-center text-base-content/50">
                Select an element to edit properties
            </div>
        );
    }

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

            <div className="form-control w-full mb-4">
                <label className="label">
                    <span className="label-text">Label</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={selectedElement.label}
                    onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
                />
            </div>

            <div className="form-control w-full mb-4">
                <label className="label">
                    <span className="label-text">Placeholder</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={selectedElement.placeholder || ""}
                    onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })}
                />
            </div>

            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                    <span className="label-text">Required</span>
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedElement.required}
                        onChange={(e) => updateElement(selectedElement.id, { required: e.target.checked })}
                    />
                </label>
            </div>
        </div>
    );
}
