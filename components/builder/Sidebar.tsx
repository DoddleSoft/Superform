"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType } from "@/types/form-builder";
import { useDraggable } from "@dnd-kit/core";
import { FormElements } from "./FormElements";

export function Sidebar() {
    const { addElement, elements } = useFormBuilder();

    const elementTypes = [
        FormElementType.TEXT_FIELD,
        FormElementType.NUMBER,
        FormElementType.TEXTAREA,
        FormElementType.CHECKBOX,
        FormElementType.DATE,
        FormElementType.SELECT,
    ];

    return (
        <div className="w-64 border-r border-base-300 h-full p-4 overflow-y-auto bg-base-100">
            <h3 className="font-bold text-lg mb-4">Elements</h3>
            <div className="flex flex-col gap-2">
                {elementTypes.map((type) => (
                    <SidebarBtnElement
                        key={type}
                        type={type}
                        label={FormElements[type].label}
                        onAdd={() => {
                            const newElement = FormElements[type].construct(crypto.randomUUID());
                            addElement(elements.length, newElement);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function SidebarBtnElement({ type, label, onAdd }: { type: FormElementType; label: string, onAdd: () => void }) {
    const { setNodeRef, listeners, attributes } = useDraggable({
        id: `sidebar-btn-${type}`,
        data: {
            type,
            isDesignerBtnElement: true,
        },
    });

    return (
        <button
            ref={setNodeRef}
            className="btn btn-outline btn-sm justify-start cursor-grab active:cursor-grabbing"
            onClick={onAdd}
            {...listeners}
            {...attributes}
        >
            + {label}
        </button>
    );
}
