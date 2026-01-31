"use client";

import { useRef, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance, FormSection, FormRow, CanvasTab, getSectionElements, ThankYouPageSettings, FormDesignSettings } from "@/types/form-builder";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormElements } from "./FormElements";
import { DragIndicator, DropZoneOverlay } from "./DragIndicator";
import { 
    LuPlus, 
    LuTrash2, 
    LuSmartphone, 
    LuTablet, 
    LuMonitor, 
    LuChevronRight, 
    LuCheck, 
    LuZap,
    LuLayers,
    LuGripVertical,
    LuSparkles,
    LuColumns2,
    LuPartyPopper
} from "react-icons/lu";
import { motion, AnimatePresence, elementVariants } from "@/lib/animations";
import { ClassicRenderer } from "@/components/renderers/ClassicRenderer";
import { TypeformRenderer } from "@/components/renderers/TypeformRenderer";

// Canvas tab configuration
const CANVAS_TABS: { id: CanvasTab; label: string }[] = [
    { id: 'form', label: 'Form' },
    { id: 'design', label: 'Design' },
    { id: 'logic', label: 'Logic' },
];

// Device preview sizes
type DeviceType = 'phone' | 'tablet' | 'desktop';
const DEVICE_SIZES: { id: DeviceType; label: string; icon: typeof LuSmartphone; width: number }[] = [
    { id: 'phone', label: 'Phone', icon: LuSmartphone, width: 375 },
    { id: 'tablet', label: 'Tablet', icon: LuTablet, width: 768 },
    { id: 'desktop', label: 'Desktop', icon: LuMonitor, width: 1024 },
];

export function Canvas() {
    const {
        sections,
        addSection,
        setSelectedElement,
        setSelectedSection,
        selectedSection,
        canvasTab,
        setCanvasTab,
        formStyle,
        designSettings,
        thankYouPage,
        isThankYouPageSelected,
        setIsThankYouPageSelected,
    } = useFormBuilder();

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-designer-element]') || target.closest('[data-section]') || target.closest('[data-row]')) return;

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
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-base-200">
            {/* Canvas Header */}
            <div className="bg-base-100 border-b border-base-200 px-4 py-3 flex items-center justify-center shrink-0 relative">
                {/* Canvas Tabs - Pill Style (always centered) */}
                <div className="inline-flex bg-base-200/80 rounded-full p-1 gap-0.5">
                    {CANVAS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCanvasTab(tab.id)}
                            className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200
                                ${canvasTab === tab.id
                                    ? 'bg-base-100 text-base-content shadow-sm'
                                    : 'text-base-content/50 hover:text-base-content hover:bg-base-100/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Device Switcher - Absolute positioned on right, only for Design Tab */}
                {canvasTab === 'design' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center bg-base-200/80 rounded-full p-1 gap-0.5">
                        {DEVICE_SIZES.map((device) => {
                            const Icon = device.icon;
                            const isActive = previewDevice === device.id;
                            return (
                                <button
                                    key={device.id}
                                    onClick={() => setPreviewDevice(device.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-base-100 text-base-content shadow-sm'
                                            : 'text-base-content/50 hover:text-base-content hover:bg-base-100/50'
                                        }`}
                                    title={device.label}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">{device.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Canvas Content */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-y-auto overflow-x-hidden flex justify-center relative px-6 py-6 transition-all
                    ${isDragging ? 'cursor-grabbing select-none' : 'cursor-default'}
                `}
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                    if (!isDragging) {
                        setSelectedElement(null);
                        setSelectedSection(null);
                        setIsThankYouPageSelected(false);
                    }
                }}
            >
                {/* Form Tab Content */}
                {canvasTab === 'form' && (
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

                        {/* Thank You Page Card */}
                        <ThankYouPageCard
                            isSelected={isThankYouPageSelected}
                            onClick={() => {
                                setSelectedElement(null);
                                setSelectedSection(null);
                                setIsThankYouPageSelected(true);
                            }}
                            thankYouPage={thankYouPage}
                            designSettings={designSettings}
                        />
                    </div>
                )}

                {/* Design Tab Content - Form Preview */}
                {canvasTab === 'design' && (
                    <FormPreview
                        sections={sections}
                        formStyle={formStyle}
                        designSettings={designSettings}
                        thankYouPage={thankYouPage}
                        previewDevice={previewDevice}
                        setPreviewDevice={setPreviewDevice}
                    />
                )}

                {/* Logic Tab Content - Placeholder for future conditional logic */}
                {canvasTab === 'logic' && (
                    <div className="w-full max-w-xl flex flex-col items-center justify-center py-20 z-10">
                        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8 text-center">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <LuZap className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-base-content mb-2">Conditional Logic</h3>
                            <p className="text-sm text-base-content/60 max-w-sm mb-6">
                                Add conditional rules to show or hide questions based on user responses.
                            </p>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                <LuSparkles className="w-3.5 h-3.5" />
                                Coming Soon
                            </span>
                        </div>
                    </div>
                )}
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
    const { active } = useDndContext();
    const isDraggingOver = !!active;

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

    // Get element count from rows
    const elementCount = getSectionElements(section).length;

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
                {isHovering && !isDraggingOver && (
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
                className={`relative rounded-2xl border bg-base-100 shadow-sm transition-all duration-200 overflow-hidden
                    ${isSelected ? 'border-primary shadow-md ring-2 ring-primary/10' : 'border-base-200 hover:border-base-300'}
                    ${isOver ? 'ring-2 ring-primary/30 border-primary/50' : ''}
                `}
                onClick={handleSectionClick}
            >
                {/* Section Header */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-base-50/50 border-base-100'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-colors
                            ${isSelected ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/60'}`}>
                            {index + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate text-base-content">
                                {section.title || 'Untitled Section'}
                            </span>
                            <span className="text-xs text-base-content/50">
                                {elementCount} {elementCount === 1 ? 'field' : 'fields'}
                            </span>
                        </div>
                    </div>

                    {/* Section Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {sections.length > 1 && (
                            <button
                                className="p-1.5 rounded-lg text-base-content/40 hover:text-error hover:bg-error/10 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSection(section.id);
                                }}
                            >
                                <LuTrash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Section Content - Rows */}
                <div className="p-4 min-h-[100px]">
                    {section.rows.length === 0 ? (
                        <EmptyDropZone sectionId={section.id} isOver={isOver} />
                    ) : (
                        <SortableContext
                            items={section.rows.map((row) => row.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-3">
                                {section.rows.map((row, rowIndex) => (
                                    <SortableRow
                                        key={row.id}
                                        row={row}
                                        rowIndex={rowIndex}
                                        sectionId={section.id}
                                        isLast={rowIndex === section.rows.length - 1}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    )}
                </div>
            </div>

            {/* Add Section Below Button (on hover) */}
            <AnimatePresence>
                {isHovering && !isDraggingOver && (
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

// Thank You Page Card Component
function ThankYouPageCard({
    isSelected,
    onClick,
    thankYouPage,
    designSettings,
}: {
    isSelected: boolean;
    onClick: () => void;
    thankYouPage: ThankYouPageSettings;
    designSettings: FormDesignSettings;
}) {
    return (
        <motion.div
            layout
            variants={elementVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
            data-section
        >
            {/* Thank You Page Card */}
            <div
                className={`relative rounded-2xl border bg-base-100 shadow-sm transition-all duration-200 overflow-hidden cursor-pointer
                    ${isSelected ? 'border-success shadow-md ring-2 ring-success/10' : 'border-base-200 hover:border-success/40'}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                {/* Card Header */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 transition-colors ${isSelected ? 'bg-success/5 border-success/20' : 'bg-base-50/50 border-base-100'}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-colors
                            ${isSelected ? 'bg-success text-success-content' : 'bg-success/20 text-success'}`}>
                            <LuPartyPopper className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate text-base-content">
                                Thank You Page
                            </span>
                            <span className="text-xs text-base-content/50">
                                Shown after submission
                            </span>
                        </div>
                    </div>
                </div>

                {/* Thank You Page Preview */}
                <div className="p-6 min-h-[150px] flex flex-col items-center justify-center text-center">
                    <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${designSettings.primaryColor}20` }}
                    >
                        <LuCheck className="w-6 h-6" style={{ color: designSettings.primaryColor }} />
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: designSettings.textColor }}>
                        {thankYouPage.title || "Thank You!"}
                    </h3>
                    <p className="text-sm max-w-xs" style={{ color: designSettings.textColor, opacity: 0.6 }}>
                        {thankYouPage.description || "Your response has been submitted successfully."}
                    </p>
                    {thankYouPage.showButton && (
                        <button
                            className="mt-4 px-4 py-2 text-sm font-medium rounded-lg"
                            style={{ 
                                backgroundColor: designSettings.buttonColor, 
                                color: designSettings.buttonTextColor 
                            }}
                        >
                            {thankYouPage.buttonText || "Submit another response"}
                        </button>
                    )}
                    {thankYouPage.showConfetti && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-warning/10 text-warning text-[10px] font-medium rounded-full flex items-center gap-1">
                            <LuSparkles className="w-3 h-3" />
                            Confetti
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Empty drop zone when section has no rows
function EmptyDropZone({ sectionId, isOver }: { sectionId: string; isOver: boolean }) {
    return (
        <motion.div 
            className={`flex flex-col items-center justify-center text-base-content/40 border-2 border-dashed rounded-xl p-8 transition-all group
                ${isOver ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-primary/40 hover:bg-primary/5'}
            `}
            animate={isOver ? { scale: 1.02 } : { scale: 1 }}
        >
            <LuLayers className={`w-6 h-6 mb-2 transition-opacity ${isOver ? 'opacity-80 text-primary' : 'opacity-40 group-hover:opacity-60'}`} />
            <p className={`text-sm font-medium ${isOver ? 'text-primary' : ''}`}>
                {isOver ? 'Release to drop' : 'Drop fields here'}
            </p>
            <p className="text-xs text-base-content/30 mt-1">Drag elements from the sidebar</p>
        </motion.div>
    );
}

// Sortable Row component
function SortableRow({ 
    row, 
    rowIndex, 
    sectionId, 
    isLast 
}: { 
    row: FormRow; 
    rowIndex: number; 
    sectionId: string;
    isLast: boolean;
}) {
    const { active } = useDndContext();
    const [dropIndicator, setDropIndicator] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: row.id,
        data: {
            type: 'row',
            row,
            rowIndex,
            sectionId,
            isDesignerRow: true,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    // Determine if we can add element to this row (max 2 elements)
    const canAddToRow = row.elements.length < 2;
    const isBeingDraggedOver = isOver && !!active;

    // Show drag placeholder when this row is being dragged
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 p-4 rounded-lg border-2 border-dashed border-primary bg-primary/5 min-h-[80px]"
            />
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            data-row
            layout
            variants={elementVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
        >
            {/* Top drop indicator */}
            <AnimatePresence>
                {isBeingDraggedOver && (
                    <DragIndicator position="top" isVisible={true} isRow />
                )}
            </AnimatePresence>

            {/* Row Container */}
            <div className={`flex gap-3 ${row.elements.length === 2 ? '' : ''}`}>
                {row.elements.map((element, elementIndex) => (
                    <RowElement
                        key={element.id}
                        element={element}
                        sectionId={sectionId}
                        rowId={row.id}
                        rowIndex={rowIndex}
                        elementIndex={elementIndex}
                        isOnlyElement={row.elements.length === 1}
                        canAddSide={canAddToRow}
                        dragHandleProps={{ ...attributes, ...listeners }}
                    />
                ))}
            </div>

            {/* Side-by-side hint for single elements */}
            {row.elements.length === 1 && active && (
                <SideDropTarget 
                    sectionId={sectionId} 
                    rowId={row.id} 
                    rowIndex={rowIndex}
                />
            )}
        </motion.div>
    );
}

// Side drop target component for adding element side-by-side
function SideDropTarget({ 
    sectionId, 
    rowId, 
    rowIndex 
}: { 
    sectionId: string; 
    rowId: string; 
    rowIndex: number;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `side-drop-${rowId}`,
        data: {
            isSideDropArea: true,
            sectionId,
            rowId,
            rowIndex,
            position: 'side',
        },
    });

    return (
        <div 
            ref={setNodeRef}
            className={`absolute right-0 top-0 bottom-0 w-1/3 z-10 transition-all duration-200 ${
                isOver ? 'opacity-100' : 'opacity-0 hover:opacity-50'
            }`}
        >
            <motion.div
                initial={false}
                animate={isOver ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.98 }}
                className={`absolute inset-1 rounded-xl border-2 border-dashed flex items-center justify-center ${
                    isOver 
                        ? 'border-secondary bg-secondary/10' 
                        : 'border-base-300 bg-base-200/50'
                }`}
            >
                <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                    <LuColumns2 className="w-4 h-4" />
                    <span>{isOver ? 'Add side-by-side' : ''}</span>
                </div>
            </motion.div>
        </div>
    );
}

// Element within a row
function RowElement({ 
    element, 
    sectionId, 
    rowId,
    rowIndex,
    elementIndex,
    isOnlyElement,
    canAddSide,
    dragHandleProps,
}: { 
    element: FormElementInstance; 
    sectionId: string;
    rowId: string;
    rowIndex: number;
    elementIndex: number;
    isOnlyElement: boolean;
    canAddSide: boolean;
    dragHandleProps: any;
}) {
    const { selectedElement, setSelectedElement, setSelectedSection } = useFormBuilder();
    const { active } = useDndContext();
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id: element.id,
        data: {
            type: element.type,
            element,
            sectionId,
            rowId,
            rowIndex,
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
                className={`opacity-50 p-4 rounded-lg border-2 border-primary bg-base-100 h-[100px] shadow-lg ${
                    isOnlyElement ? 'w-full' : 'flex-1'
                }`}
            />
        );
    }

    const isSelected = selectedElement?.id === element.id;
    const isBeingDraggedOver = isOver && !!active;

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
            className={`relative group bg-base-100 rounded-xl border transition-all duration-200 ${
                isOnlyElement ? 'w-full' : 'flex-1'
            } ${
                isSelected
                    ? "border-primary shadow-md ring-2 ring-primary/10"
                    : "border-base-200 hover:border-base-300 hover:shadow-sm"
            } ${
                isBeingDraggedOver ? 'ring-2 ring-primary/30' : ''
            }`}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
                setSelectedSection(null);
            }}
        >
            {/* Drop indicator when hovering */}
            <AnimatePresence>
                {isBeingDraggedOver && (
                    <DragIndicator position="top" isVisible={true} />
                )}
            </AnimatePresence>

            {/* Drag handle indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab
                ${isSelected ? 'opacity-100' : ''}`}>
                <LuGripVertical className="w-4 h-4 text-base-content/30" />
            </div>

            {/* Content with left padding for drag handle */}
            <div className="pl-8 pr-4 py-4">
                {/* Overlay to prevent interaction with form fields during design */}
                <div className="absolute inset-0 w-full h-full z-10" />
                <DesignerComponent element={element} />
            </div>

            {/* Selection indicator */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute -top-2 -right-2 flex items-center gap-1 bg-primary text-primary-content text-xs font-medium px-2 py-1 rounded-lg shadow-sm z-20"
                    >
                        <LuCheck className="w-3 h-3" />
                        Selected
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Multi-column indicator for side-by-side elements */}
            {!isOnlyElement && (
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-base-200/80 rounded text-[10px] font-medium text-base-content/50">
                    <LuColumns2 className="w-3 h-3" />
                    {elementIndex === 0 ? 'L' : 'R'}
                </div>
            )}
        </motion.div>
    );
}

// Legacy SortableElement - Keep for backward compatibility during transition
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
            className={`relative group bg-base-100 rounded-xl border transition-all duration-200
                ${isSelected
                    ? "border-primary shadow-md ring-2 ring-primary/10"
                    : "border-base-200 hover:border-base-300 hover:shadow-sm"
                }
            `}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedElement(element);
                setSelectedSection(null);
            }}
        >
            {/* Drag handle indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab
                ${isSelected ? 'opacity-100' : ''}`}>
                <LuGripVertical className="w-4 h-4 text-base-content/30" />
            </div>

            {/* Content with left padding for drag handle */}
            <div className="pl-8 pr-4 py-4">
                {/* Overlay to prevent interaction with form fields during design */}
                <div className="absolute inset-0 w-full h-full z-10" />
                <DesignerComponent element={element} />
            </div>

            {/* Selection indicator */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute -top-2 -right-2 flex items-center gap-1 bg-primary text-primary-content text-xs font-medium px-2 py-1 rounded-lg shadow-sm z-20"
                    >
                        <LuCheck className="w-3 h-3" />
                        Selected
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Form Preview Component for Design Tab
import { FormStyle } from "@/types/form-builder";

interface FormPreviewProps {
    sections: FormSection[];
    formStyle: FormStyle;
    designSettings: FormDesignSettings;
    thankYouPage: ThankYouPageSettings;
    previewDevice: DeviceType;
    setPreviewDevice: (device: DeviceType) => void;
}

function FormPreview({ sections, formStyle, designSettings, thankYouPage, previewDevice, setPreviewDevice }: FormPreviewProps) {
    const [previewSection, setPreviewSection] = useState(0);
    const [showThankYouPage, setShowThankYouPage] = useState(false);
    const deviceConfig = DEVICE_SIZES.find(d => d.id === previewDevice) || DEVICE_SIZES[2];

    const currentSection = sections[previewSection];
    const isFirstSection = previewSection === 0;
    const isLastSection = previewSection === sections.length - 1;

    if (sections.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-20 z-10">
                <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-base-200 to-base-300 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <LuMonitor className="w-7 h-7 text-base-content/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-base-content mb-2">No Form Content</h3>
                    <p className="text-sm text-base-content/60 max-w-sm">
                        Add some fields to your form to see a preview here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center z-10 pb-8">
            {/* Device Frame */}
            <motion.div
                layout
                className="bg-base-100 rounded-2xl shadow-xl overflow-hidden border border-base-200"
                style={{
                    width: Math.min(deviceConfig.width, typeof window !== 'undefined' ? window.innerWidth - 100 : deviceConfig.width),
                    maxWidth: '100%',
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {/* Browser Chrome */}
                <div className="bg-base-100 px-4 py-2.5 flex items-center gap-3 border-b border-base-200">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-error/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                    </div>
                    <div className="flex-1 bg-base-200 rounded-full px-4 py-1.5 text-xs text-base-content/40 truncate text-center">
                        yourdomain.com/form
                    </div>
                </div>

                {/* Form Content */}
                {/* Form Content */}
                <div className="relative h-[650px] bg-base-100 overflow-hidden form-preview-container">
                    {showThankYouPage ? (
                        <ThankYouPagePreview 
                            thankYouPage={thankYouPage} 
                            designSettings={designSettings} 
                        />
                    ) : formStyle === 'classic' ? (
                        <div className="h-full overflow-y-auto">
                            <ClassicRenderer
                                sections={sections}
                                formValues={{ current: {} }}
                                formErrors={{ current: {} }}
                                renderKey={0}
                                pending={false}
                                submitValue={() => { }}
                                handleSubmit={() => { }}
                                validateAllSections={() => true}
                                setRenderKey={() => { }}
                                designSettings={designSettings}
                            />
                        </div>
                    ) : (
                        <TypeformRenderer
                            sections={sections}
                            formValues={{ current: {} }}
                            formErrors={{ current: {} }}
                            renderKey={0}
                            pending={false}
                            submitValue={() => { }}
                            handleSubmit={() => { }}
                            validateSection={() => true}
                            setRenderKey={() => { }}
                            currentSectionIndex={
                                // If current section is deleted/out of bounds, fallback to 0
                                sections[previewSection] ? previewSection : 0
                            }
                            onSectionChange={setPreviewSection}
                            designSettings={designSettings}
                        />
                    )}
                </div>
            </motion.div>

            {/* Preview Toggle and Style indicator */}
            <div className="mt-5 flex items-center gap-3">
                {/* Thank You Page Toggle */}
                <button
                    onClick={() => setShowThankYouPage(!showThankYouPage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-full shadow-sm transition-all
                        ${showThankYouPage 
                            ? 'bg-success text-success-content border-success' 
                            : 'bg-base-100 text-base-content/60 border-base-200 hover:border-success/50'
                        }`}
                >
                    <LuPartyPopper className="w-3 h-3" />
                    Thank You Page
                </button>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-base-100 border border-base-200 text-base-content/60 text-xs font-medium rounded-full shadow-sm">
                    <LuSparkles className="w-3 h-3" />
                    {formStyle === 'classic' ? 'Classic' : 'Typeform'} Style
                </span>
            </div>
        </div>
    );
}

// Thank You Page Preview Component
function ThankYouPagePreview({
    thankYouPage,
    designSettings,
}: {
    thankYouPage: ThankYouPageSettings;
    designSettings: FormDesignSettings;
}) {
    const { getButtonStyle } = require("@/lib/designUtils");
    const buttonStyle = getButtonStyle(designSettings);

    return (
        <div 
            className="h-full flex items-center justify-center p-4"
            style={{ backgroundColor: designSettings.backgroundColor }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full rounded-2xl shadow-xl p-8 text-center relative"
                style={{ backgroundColor: 'white' }}
            >
                {thankYouPage.showConfetti && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-warning/10 text-warning text-[10px] font-medium rounded-full flex items-center gap-1 shadow">
                        <LuSparkles className="w-3 h-3" />
                        Confetti enabled
                    </div>
                )}
                <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${designSettings.primaryColor}20` }}
                >
                    <LuCheck className="w-8 h-8" style={{ color: designSettings.primaryColor }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: designSettings.textColor }}>
                    {thankYouPage.title || "Thank You!"}
                </h1>
                <p style={{ color: designSettings.textColor, opacity: 0.6 }}>
                    {thankYouPage.description || "Your response has been submitted successfully."}
                </p>
                {thankYouPage.showButton && (
                    <button
                        className="mt-6 px-6 py-2.5 font-medium rounded-lg transition-transform hover:scale-105"
                        style={buttonStyle}
                    >
                        {thankYouPage.buttonText || "Submit another response"}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
