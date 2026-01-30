"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType } from "@/types/form-builder";
import { useDraggable } from "@dnd-kit/core";
import { FormElements } from "./FormElements";
import { motion } from "@/lib/animations";

// Element categories for organization
const elementCategories = [
    {
        name: "Text Inputs",
        elements: [
            FormElementType.TEXT_FIELD,
            FormElementType.TEXTAREA,
            FormElementType.EMAIL,
            FormElementType.PHONE,
            FormElementType.NUMBER,
        ],
    },
    {
        name: "Choice",
        elements: [
            FormElementType.RADIO_GROUP,
            FormElementType.CHECKBOX_GROUP,
            FormElementType.SELECT,
            FormElementType.YES_NO,
        ],
    },
    {
        name: "Other Inputs",
        elements: [
            FormElementType.RATING,
            FormElementType.DATE,
            FormElementType.CHECKBOX,
        ],
    },
    {
        name: "Display",
        elements: [
            FormElementType.HEADING,
            FormElementType.RICH_TEXT,
        ],
    },
];

export function Sidebar() {
    const { addElement, sections, currentSectionId } = useFormBuilder();

    // Get the section to add to - use current section or first section as fallback
    const targetSectionId = currentSectionId ?? sections[0]?.id ?? "";
    const targetSection = sections.find(s => s.id === targetSectionId);
    const currentElementCount = targetSection?.elements.length ?? 0;

    return (
        <div className="h-full bg-base-100 flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="p-4 border-b border-base-200 shrink-0">
                <p className="text-xs text-base-content/50">Drag and drop to add to canvas</p>
            </div>

            <div className="p-4 flex flex-col gap-6 flex-1">
                {elementCategories.map((category, categoryIndex) => (
                    <div key={category.name} className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide">
                            {category.name}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {category.elements.map((type, index) => (
                                <motion.div
                                    key={type}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (categoryIndex * 0.1) + (index * 0.03), duration: 0.2 }}
                                >
                                    <SidebarBtnElement
                                        type={type}
                                        label={FormElements[type].label}
                                        onAdd={() => {
                                            if (!targetSectionId) return;
                                            const newElement = FormElements[type].construct(crypto.randomUUID());
                                            addElement(targetSectionId, currentElementCount, newElement);
                                        }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
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
