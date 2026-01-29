"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType } from "@/types/form-builder";
import { useDraggable } from "@dnd-kit/core";
import { FormElements } from "./FormElements";
import { motion } from "@/lib/animations";

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
        <div className="h-full bg-base-100 flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="p-4 border-b border-base-200 shrink-0">
                <p className="text-xs text-base-content/50">Drag and drop to add to canvas</p>
            </div>

            <div className="p-4 flex flex-col gap-3 flex-1">
                {elementTypes.map((type, index) => (
                    <motion.div
                        key={type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                        <SidebarBtnElement
                            type={type}
                            label={FormElements[type].label}
                            onAdd={() => {
                                const newElement = FormElements[type].construct(crypto.randomUUID());
                                addElement(elements.length, newElement);
                            }}
                        />
                    </motion.div>
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
