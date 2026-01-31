"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementType } from "@/types/form-builder";
import { useDraggable } from "@dnd-kit/core";
import { FormElements } from "./FormElements";
import { motion } from "@/lib/animations";
import { 
    LuType, 
    LuAlignLeft, 
    LuMail, 
    LuPhone, 
    LuHash, 
    LuCircleDot, 
    LuChevronDown, 
    LuToggleLeft, 
    LuStar, 
    LuCalendar, 
    LuSquareCheck,
    LuHeading,
    LuFileText,
    LuGripVertical,
    LuListChecks,
    LuUpload,
    LuImage
} from "react-icons/lu";
import { ReactNode } from "react";

// Element icons mapping
const ELEMENT_ICONS: Record<FormElementType, ReactNode> = {
    [FormElementType.TEXT_FIELD]: <LuType className="w-4 h-4" />,
    [FormElementType.TEXTAREA]: <LuAlignLeft className="w-4 h-4" />,
    [FormElementType.EMAIL]: <LuMail className="w-4 h-4" />,
    [FormElementType.PHONE]: <LuPhone className="w-4 h-4" />,
    [FormElementType.NUMBER]: <LuHash className="w-4 h-4" />,
    [FormElementType.RADIO_GROUP]: <LuCircleDot className="w-4 h-4" />,
    [FormElementType.CHECKBOX_GROUP]: <LuListChecks className="w-4 h-4" />,
    [FormElementType.SELECT]: <LuChevronDown className="w-4 h-4" />,
    [FormElementType.YES_NO]: <LuToggleLeft className="w-4 h-4" />,
    [FormElementType.RATING]: <LuStar className="w-4 h-4" />,
    [FormElementType.DATE]: <LuCalendar className="w-4 h-4" />,
    [FormElementType.CHECKBOX]: <LuSquareCheck className="w-4 h-4" />,
    [FormElementType.HEADING]: <LuHeading className="w-4 h-4" />,
    [FormElementType.RICH_TEXT]: <LuFileText className="w-4 h-4" />,
    [FormElementType.FILE_UPLOAD]: <LuUpload className="w-4 h-4" />,
    [FormElementType.IMAGE]: <LuImage className="w-4 h-4" />,
};

// Element categories for organization
const elementCategories = [
    {
        name: "Text Inputs",
        description: "Collect text responses",
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
        description: "Selection options",
        elements: [
            FormElementType.RADIO_GROUP,
            FormElementType.CHECKBOX_GROUP,
            FormElementType.SELECT,
            FormElementType.YES_NO,
        ],
    },
    {
        name: "Other Inputs",
        description: "Special input types",
        elements: [
            FormElementType.RATING,
            FormElementType.DATE,
            FormElementType.CHECKBOX,
            FormElementType.FILE_UPLOAD,
        ],
    },
    {
        name: "Display",
        description: "Text & media",
        elements: [
            FormElementType.HEADING,
            FormElementType.RICH_TEXT,
            FormElementType.IMAGE,
        ],
    },
];

export function Sidebar() {
    const { addElement, sections, currentSectionId } = useFormBuilder();

    // Get the section to add to - use current section or first section as fallback
    const targetSectionId = currentSectionId ?? sections[0]?.id ?? "";
    const targetSection = sections.find(s => s.id === targetSectionId);
    const currentRowCount = targetSection?.rows.length ?? 0;

    return (
        <div className="h-full bg-base-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-200 shrink-0">
                <div className="flex items-center gap-2 text-base-content/50">
                    <LuGripVertical className="w-3.5 h-3.5" />
                    <p className="text-xs">Drag to add or click to insert</p>
                </div>
            </div>

            {/* Components List */}
            <div className="flex-1 overflow-y-auto">
                {elementCategories.map((category, categoryIndex) => (
                    <div key={category.name} className="border-b border-base-200 last:border-b-0">
                        {/* Category Header */}
                        <div className="px-4 py-2.5 bg-base-200/30">
                            <h3 className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                                {category.name}
                            </h3>
                        </div>
                        
                        {/* Category Elements */}
                        <div className="p-2 space-y-1">
                            {category.elements.map((type, index) => (
                                <motion.div
                                    key={type}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (categoryIndex * 0.05) + (index * 0.02), duration: 0.15 }}
                                >
                                    <SidebarBtnElement
                                        type={type}
                                        label={FormElements[type].label}
                                        icon={ELEMENT_ICONS[type]}
                                        onAdd={() => {
                                            if (!targetSectionId) return;
                                            const newElement = FormElements[type].construct(crypto.randomUUID());
                                            addElement(targetSectionId, currentRowCount, newElement);
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

function SidebarBtnElement({ 
    type, 
    label, 
    icon,
    onAdd 
}: { 
    type: FormElementType; 
    label: string;
    icon: ReactNode;
    onAdd: () => void;
}) {
    const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
        id: `sidebar-btn-${type}`,
        data: {
            type,
            isDesignerBtnElement: true,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg
                border border-transparent
                hover:bg-base-200/50 hover:border-base-300
                cursor-grab active:cursor-grabbing
                transition-all duration-150 group
                ${isDragging ? "opacity-50 shadow-lg" : ""}
            `}
            onClick={onAdd}
            {...listeners}
            {...attributes}
        >
            <div className="w-8 h-8 rounded-lg bg-base-200 text-base-content/60 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                {icon}
            </div>
            <span className="text-sm font-medium text-base-content/80 group-hover:text-base-content transition-colors truncate">
                {label}
            </span>
        </div>
    );
}
