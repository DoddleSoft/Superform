"use client";

import { useRef, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance } from "@/types/form-builder";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormElements } from "./FormElements";
import { LuMousePointerClick } from "react-icons/lu";
import { motion, AnimatePresence, elementVariants, scaleIn } from "@/lib/animations";

export function Canvas() {
    const { elements, setSelectedElement } = useFormBuilder();
    const { setNodeRef, isOver } = useDroppable({
        id: "canvas-droppable",
        data: {
            isDesignerDropArea: true,
        },
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevent drag if clicking on an interactive element or if it's not the main background
        // We check if the target or its parents have data-designer-element attribute
        const target = e.target as HTMLElement;
        if (target.closest('[data-designer-element]')) return;

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
        const walk = (y - startY) * 1.5; // Scroll speed multiplier
        containerRef.current.scrollTop = scrollTop - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                // @ts-ignore
                containerRef.current = node;
            }}
            className={`flex-1 bg-base-200 h-full overflow-y-auto overflow-x-hidden flex justify-center relative px-8 pt-8 transition-all
                ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
            `}
            style={{
                backgroundImage: "radial-gradient(#000000 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundAttachment: "local" // This makes the background scroll with content but we actually want it to cover everything. 
                // Actually for "infinite" feeling, default is fine if it covers the scrollable area.
                // But overflow-y-auto is on this div. So background will scroll WITH content by default? 
                // No, on a scroll container, background usually stays fixed to the "padding box" unless attachment is local.
                // Wait, if we want infinite canvas feel, the background usually stays fixed relative to viewport or scrolls?
                // Usually it scrolls. 
                // Let's stick to simple background image on the scrolling container.
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                // Only deselect if we didn't drag (click vs drag distinction)
                if (!isDragging) {
                    setSelectedElement(null);
                }
            }}
        >
            <div
                className={`w-full max-w-3xl flex flex-col gap-4 pb-[120px] transition-colors z-10 ${isOver ? "ring-2 ring-primary ring-inset rounded-xl p-4 bg-base-100/50" : ""
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="popLayout">
                    {elements.length === 0 ? (
                        <motion.div
                            key="empty-state"
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 flex flex-col items-center justify-center text-base-content/30 border-2 border-dashed border-base-200 rounded-xl bg-base-50/50 hover:border-primary/50 transition-colors p-8 gap-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center">
                                <LuMousePointerClick className="w-8 h-8 opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-lg">Your form is empty</p>
                                <p className="text-sm">Drag and drop elements from the sidebar to start building</p>
                            </div>
                        </motion.div>
                    ) : (
                        <SortableContext items={elements.map((el) => el.id)} strategy={verticalListSortingStrategy}>
                            {elements.map((el) => (
                                <SortableElement key={el.id} element={el} />
                            ))}
                        </SortableContext>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function SortableElement({ element }: { element: FormElementInstance }) {
    const { selectedElement, setSelectedElement } = useFormBuilder();
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
            isDesignerElement: true,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const DesignerComponent = FormElements[element.type].designerComponent;

    // While dragging, we show a simplified placeholder
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 p-6 rounded-xl border-2 border-primary bg-base-100 h-[120px] shadow-lg"
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
            className={`p-6 rounded-xl border transition-all relative group bg-base-100 shadow-sm
                ${isSelected
                    ? "border-primary shadow-md ring-1 ring-primary"
                    : "border-base-300 hover:border-primary/50"
                }
            `}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
            }}
        >
            {/* Overlay to prevent interaction with form fields during design */}
            <div className="absolute inset-0 w-full h-full z-10" />

            {/* Hover Actions (could be added here later like duplicate/delete shortcuts) */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -5 }}
                        className="absolute -top-3 -right-3 bg-primary text-primary-content text-xs px-2 py-1 rounded badge badge-primary shadow-sm z-20"
                    >
                        Selected
                    </motion.div>
                )}
            </AnimatePresence>

            <DesignerComponent element={element} />
        </motion.div>
    );
}
