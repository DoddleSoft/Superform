"use client";

import { useRef, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance, FormSection } from "@/types/form-builder";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormElements } from "./FormElements";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { motion, AnimatePresence, elementVariants } from "@/lib/animations";

export function Canvas() {
    const { 
        sections, 
        addSection, 
        setSelectedElement, 
        setSelectedSection,
        selectedSection 
    } = useFormBuilder();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-designer-element]') || target.closest('[data-section]')) return;

        setIsDragging(true);
        setStartY(e.clientY);
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
        const y = e.clientY;
        const walk = (y - startY) * 1.5;
        containerRef.current.scrollTop = scrollTop - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleAddSection = (index: number) => {
        addSection(index);
    };

    return (
        <div
            ref={containerRef}
            className={`flex-1 bg-base-200 h-full overflow-y-auto overflow-x-hidden flex justify-center relative px-8 pt-8 transition-all
                ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
            `}
            style={{
                backgroundImage: "radial-gradient(#000000 1px, transparent 1px)",
                backgroundSize: "20px 20px",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                if (!isDragging) {
                    setSelectedElement(null);
                    setSelectedSection(null);
                }
            }}
        >
            <div
                className="w-full max-w-3xl flex flex-col gap-4 pb-[120px] z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="popLayout">
                    {sections.map((section, index) => (
                        <SectionCard 
                            key={section.id} 
                            section={section} 
                            index={index}
                            isSelected={selectedSection?.id === section.id}
                            onAddSectionAbove={() => handleAddSection(index)}
                            onAddSectionBelow={() => handleAddSection(index + 1)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function SectionCard({ 
    section, 
    index,
    isSelected,
    onAddSectionAbove,
    onAddSectionBelow 
}: { 
    section: FormSection; 
    index: number;
    isSelected: boolean;
    onAddSectionAbove: () => void;
    onAddSectionBelow: () => void;
}) {
    const { 
        setSelectedElement, 
        setSelectedSection, 
        selectedElement,
        removeSection,
        sections
    } = useFormBuilder();
    const [isHovering, setIsHovering] = useState(false);
    
    const { setNodeRef, isOver } = useDroppable({
        id: `section-droppable-${section.id}`,
        data: {
            isDesignerDropArea: true,
            sectionId: section.id,
        },
    });

    const handleSectionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedElement(null);
        setSelectedSection(section);
    };

    return (
        <motion.div
            layout
            variants={elementVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            data-section
        >
            {/* Add Section Above Button (on hover) */}
            <AnimatePresence>
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                        <button
                            className="btn btn-circle btn-sm btn-primary shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddSectionAbove();
                            }}
                        >
                            <LuPlus className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Card */}
            <div
                ref={setNodeRef}
                className={`relative rounded-xl border-2 bg-base-100 shadow-sm transition-all overflow-hidden
                    ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-base-300'}
                    ${isOver ? 'ring-2 ring-primary' : ''}
                `}
                onClick={handleSectionClick}
            >
                {/* Section Header */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 bg-base-50/50 ${isSelected ? 'border-primary/30' : 'border-base-200'}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider shrink-0">
                            Section {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate">
                            {section.title}
                        </span>
                    </div>
                    
                    {/* Section Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                        {sections.length > 1 && (
                            <button
                                className="btn btn-ghost btn-xs btn-square text-error/70 hover:text-error hover:bg-error/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSection(section.id);
                                }}
                            >
                                <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Section Content - Elements */}
                <div className="p-4 min-h-[120px]">
                    {section.elements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-base-content/30 border-2 border-dashed border-base-200 rounded-lg p-6 hover:border-primary/50 transition-colors">
                            <p className="text-sm">Drag and drop elements here</p>
                        </div>
                    ) : (
                        <SortableContext 
                            items={section.elements.map((el) => el.id)} 
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-3">
                                {section.elements.map((element) => (
                                    <SortableElement 
                                        key={element.id} 
                                        element={element} 
                                        sectionId={section.id}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    )}
                </div>
            </div>

            {/* Add Section Below Button (on hover) */}
            <AnimatePresence>
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20"
                    >
                        <button
                            className="btn btn-circle btn-sm btn-primary shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddSectionBelow();
                            }}
                        >
                            <LuPlus className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function SortableElement({ element, sectionId }: { element: FormElementInstance; sectionId: string }) {
    const { selectedElement, setSelectedElement, setSelectedSection } = useFormBuilder();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: element.id,
        data: {
            type: element.type,
            element,
            sectionId,
            isDesignerElement: true,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const DesignerComponent = FormElements[element.type].designerComponent;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 p-4 rounded-lg border-2 border-primary bg-base-100 h-[100px] shadow-lg"
            />
        );
    }

    const isSelected = selectedElement?.id === element.id;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            data-designer-element
            layout
            variants={elementVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`p-4 rounded-lg border transition-all relative group bg-base-100
                ${isSelected
                    ? "border-primary shadow-md ring-1 ring-primary"
                    : "border-base-200 hover:border-primary/50"
                }
            `}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
                setSelectedSection(null);
            }}
        >
            {/* Overlay to prevent interaction with form fields during design */}
            <div className="absolute inset-0 w-full h-full z-10" />

            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -5 }}
                        className="absolute -top-2 -right-2 bg-primary text-primary-content text-xs px-2 py-0.5 rounded badge badge-primary shadow-sm z-20"
                    >
                        Selected
                    </motion.div>
                )}
            </AnimatePresence>

            <DesignerComponent element={element} />
        </motion.div>
    );
}
