"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElements } from "./FormElements";
import { LuX, LuSettings, LuGripVertical, LuLayers } from "react-icons/lu";
import { motion, AnimatePresence, scaleIn } from "@/lib/animations";
import { FormSection } from "@/types/form-builder";
import {
    DndContext,
    DragEndEvent,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function PropertiesPanel() {
    const { 
        selectedElement, 
        removeElement, 
        setSelectedElement, 
        sections,
        selectedSection,
        setSelectedSection,
        updateSection,
        reorderSections
    } = useFormBuilder();

    // Find which section contains the selected element
    const findElementSection = () => {
        for (const section of sections) {
            if (section.elements.some(el => el.id === selectedElement?.id)) {
                return section.id;
            }
        }
        return null;
    };

    const elementSectionId = selectedElement ? findElementSection() : null;

    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-base-100 border-l border-base-200 flex flex-col overflow-hidden"
        >
            <AnimatePresence mode="wait">
                {selectedElement ? (
                    // Element Properties View
                    <motion.div
                        key={selectedElement.id}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-50/50 shrink-0">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                                    Properties
                                </h3>
                                <p className="text-xs text-base-content/50 truncate w-[180px]">
                                    {FormElements[selectedElement.type].label}
                                </p>
                            </div>
                            <button
                                className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
                                onClick={() => setSelectedElement(null)}
                            >
                                <LuX />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            {(() => {
                                const PropertiesComponent = FormElements[selectedElement.type].propertiesComponent;
                                return <PropertiesComponent element={selectedElement} />;
                            })()}

                            <div className="divider my-6"></div>

                            <button
                                className="btn btn-error btn-outline btn-sm w-full gap-2"
                                onClick={() => {
                                    if (elementSectionId) {
                                        removeElement(elementSectionId, selectedElement.id);
                                    }
                                }}
                            >
                                Delete Element
                            </button>
                        </div>
                    </motion.div>
                ) : selectedSection ? (
                    // Section Properties View
                    <SectionPropertiesView 
                        section={selectedSection} 
                        onClose={() => setSelectedSection(null)}
                        onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                    />
                ) : (
                    // Section List View (when nothing selected)
                    <SectionListView />
                )}
            </AnimatePresence>
        </motion.aside>
    );
}

function SectionPropertiesView({ 
    section, 
    onClose, 
    onUpdate 
}: { 
    section: FormSection; 
    onClose: () => void;
    onUpdate: (updates: Partial<Omit<FormSection, "id" | "elements">>) => void;
}) {
    return (
        <motion.div
            key="section-properties"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col overflow-hidden"
        >
            <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-50/50 shrink-0">
                <div className="flex flex-col">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                        Section Properties
                    </h3>
                    <p className="text-xs text-base-content/50 truncate w-[180px]">
                        {section.title}
                    </p>
                </div>
                <button
                    className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-base-content"
                    onClick={onClose}
                >
                    <LuX />
                </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text font-medium">Section Title</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        value={section.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        placeholder="Enter section title"
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">Description</span>
                        <span className="label-text-alt text-base-content/50">Optional</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        value={section.description || ""}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Add a description for this section"
                        rows={3}
                    />
                </div>

                <div className="mt-4 p-3 bg-base-200/50 rounded-lg">
                    <p className="text-xs text-base-content/60">
                        <strong>Tip:</strong> Each section will be displayed as a full-screen page when the form is published.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

function SectionListView() {
    const { sections, reorderSections, setSelectedSection, addSection } = useFormBuilder();
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (over && active.id !== over.id) {
            const oldIndex = sections.findIndex((s) => s.id === active.id);
            const newIndex = sections.findIndex((s) => s.id === over.id);
            const newOrder = arrayMove(sections, oldIndex, newIndex);
            reorderSections(newOrder.map((s) => s.id));
        }
    };

    return (
        <motion.div
            key="section-list"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col overflow-hidden"
        >
            <div className="p-4 border-b border-base-200 bg-base-50/50 shrink-0">
                <div className="flex items-center gap-2">
                    <LuLayers className="w-4 h-4 text-base-content/50" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-base-content/70">
                        Sections
                    </h3>
                </div>
                <p className="text-xs text-base-content/50 mt-1">
                    Drag to reorder sections
                </p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mb-3">
                            <LuSettings className="w-6 h-6 opacity-40" />
                        </div>
                        <p className="text-sm text-base-content/50">No sections yet</p>
                        <p className="text-xs text-base-content/40 mt-1">
                            Add a section from the canvas to get started
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sections.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-2">
                                {sections.map((section, index) => (
                                    <SortableSectionItem 
                                        key={section.id} 
                                        section={section} 
                                        index={index}
                                        onClick={() => setSelectedSection(section)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </motion.div>
    );
}

function SortableSectionItem({ 
    section, 
    index,
    onClick
}: { 
    section: FormSection; 
    index: number;
    onClick: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-3 rounded-lg border bg-base-100 cursor-pointer transition-all
                ${isDragging ? 'opacity-50 shadow-lg border-primary' : 'border-base-200 hover:border-primary/50'}
            `}
            onClick={onClick}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-base-content/40 hover:text-base-content/70"
            >
                <LuGripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{section.title}</p>
                <p className="text-xs text-base-content/50">
                    {section.elements.length} {section.elements.length === 1 ? 'element' : 'elements'}
                </p>
            </div>
            <span className="text-xs font-bold text-base-content/30">
                {index + 1}
            </span>
        </div>
    );
}
