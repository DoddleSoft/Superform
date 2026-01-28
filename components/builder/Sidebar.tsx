"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType } from "@/types/form-builder";

export function Sidebar() {
    const { addElement } = useFormBuilder();

    const elementTypes = [
        { type: FormElementType.TEXT_FIELD, label: "Text Field" },
        { type: FormElementType.NUMBER, label: "Number" },
        { type: FormElementType.TEXTAREA, label: "Text Area" },
        { type: FormElementType.CHECKBOX, label: "Checkbox" },
        { type: FormElementType.DATE, label: "Date" },
        { type: FormElementType.SELECT, label: "Select" },
    ];

    return (
        <div className="w-64 border-r border-base-300 h-full p-4 overflow-y-auto bg-base-100">
            <h3 className="font-bold text-lg mb-4">Elements</h3>
            <div className="flex flex-col gap-2">
                {elementTypes.map((el) => (
                    <button
                        key={el.type}
                        className="btn btn-outline btn-sm justify-start"
                        onClick={() => addElement(el.type)}
                    >
                        + {el.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
