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
        <aside className="w-[280px] h-full bg-base-100 border-r border-base-200 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-base-200">
                <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/70">Components</h3>
                <p className="text-xs text-base-content/50 mt-1">Drag and drop to add to canvas</p>
            </div>

            <div className="p-4 flex flex-col gap-3">
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
        </aside>
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
        <div
            ref={setNodeRef}
            className="card card-compact bg-base-100 border border-base-200 hover:border-primary hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
            onClick={onAdd}
            {...listeners}
            {...attributes}
        >
            <div className="card-body flex-row items-center gap-3 py-3">
                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="font-bold text-xs">{label.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className="font-medium text-sm">{label}</span>
            </div>
        </div>
    );
}
