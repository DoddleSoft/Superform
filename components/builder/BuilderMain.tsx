"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { LeftPanel } from "./LeftPanel";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { useState, useEffect } from "react";
import { FormElementInstance, FormElementType, FormSection, createSection } from "@/types/form-builder";
import { FormSubmission } from "@/types/submission";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { arrayMove } from "@dnd-kit/sortable";
import { BuilderHeader } from "./BuilderHeader";
import { FormElements } from "./FormElements";
import { ResultsView } from "./ResultsView";
import { AIChatProvider } from "@/context/AIChatContext";
import { useAutoSave, SaveStatus } from "@/hooks/useAutoSave";
import { motion, AnimatePresence, tabContentVariants } from "@/lib/animations";

export function BuilderMain({ form, submissions }: { form: any, submissions: FormSubmission[] }) {
    const { sections, addElement, setSections, setFormMetadata, formId, addSection, moveElement } = useFormBuilder();
    const [activeSidebarElement, setActiveSidebarElement] = useState<FormElementType | null>(null);
    const [activeCanvasElement, setActiveCanvasElement] = useState<FormElementInstance | null>(null);
    const [activeElementSectionId, setActiveElementSectionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"build" | "results">("build");

    // Auto-save hook - now saves sections instead of elements
    const { saveStatus, lastSavedAt, error: saveError } = useAutoSave({
        formId,
        elements: sections, // Now sections array
        debounceMs: 1500,
    });

    useEffect(() => {
        if (form) {
            // Handle both old format (flat array) and new format (sections)
            const content = form.content || [];
            if (Array.isArray(content) && content.length > 0) {
                // Check if it's the new section format
                if (content[0]?.elements !== undefined) {
                    // New section format
                    setSections(content);
                } else {
                    // Old flat array format - migrate to section format
                    const defaultSection = createSection(crypto.randomUUID(), "Section 1");
                    defaultSection.elements = content;
                    setSections([defaultSection]);
                }
            } else {
                // Empty content - create a default section
                const defaultSection = createSection(crypto.randomUUID(), "Section 1");
                setSections([defaultSection]);
            }
            setFormMetadata(form.id, form.published, form.share_url);
        }
    }, [form, setSections, setFormMetadata]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 300,
                tolerance: 5,
            },
        })
    );

    function onDragStart(event: DragStartEvent) {
        // If dragging from sidebar
        if (event.active.data.current?.isDesignerBtnElement) {
            setActiveSidebarElement(event.active.data.current.type);
            return;
        }

        // If dragging canvas element
        if (event.active.data.current?.isDesignerElement) {
            setActiveCanvasElement(event.active.data.current.element);
            setActiveElementSectionId(event.active.data.current.sectionId);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveSidebarElement(null);
        setActiveCanvasElement(null);
        setActiveElementSectionId(null);

        if (!over) return;

        const overId = String(over.id);
        
        // Drop Sidebar Element -> Section Drop Area
        if (active.data.current?.isDesignerBtnElement && over.data.current?.isDesignerDropArea) {
            const type = active.data.current.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = over.data.current.sectionId;
            
            if (sectionId) {
                const section = sections.find(s => s.id === sectionId);
                addElement(sectionId, section?.elements.length || 0, newElement);
            }
            return;
        }

        // Drop Sidebar Element -> Over another Element in a section
        if (active.data.current?.isDesignerBtnElement && over.data.current?.isDesignerElement) {
            const type = active.data.current.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = over.data.current.sectionId;
            
            if (sectionId) {
                const section = sections.find(s => s.id === sectionId);
                const overElementIndex = section?.elements.findIndex(el => el.id === over.id) ?? -1;
                
                if (overElementIndex !== -1) {
                    addElement(sectionId, overElementIndex, newElement);
                } else {
                    addElement(sectionId, section?.elements.length || 0, newElement);
                }
            }
            return;
        }

        // Reordering Elements within/between sections
        if (active.data.current?.isDesignerElement && over.data.current?.isDesignerElement) {
            const activeId = active.id;
            const overId = over.id;
            const fromSectionId = active.data.current.sectionId;
            const toSectionId = over.data.current.sectionId;

            if (activeId !== overId || fromSectionId !== toSectionId) {
                if (fromSectionId === toSectionId) {
                    // Same section reorder
                    setSections(prev => prev.map(section => {
                        if (section.id === fromSectionId) {
                            const oldIndex = section.elements.findIndex(el => el.id === activeId);
                            const newIndex = section.elements.findIndex(el => el.id === overId);
                            return {
                                ...section,
                                elements: arrayMove(section.elements, oldIndex, newIndex)
                            };
                        }
                        return section;
                    }));
                } else {
                    // Cross-section move
                    const toSection = sections.find(s => s.id === toSectionId);
                    const newIndex = toSection?.elements.findIndex(el => el.id === overId) ?? 0;
                    moveElement(fromSectionId, toSectionId, String(activeId), newIndex);
                }
            }
            return;
        }

        // Drop element onto section drop area (cross-section move)
        if (active.data.current?.isDesignerElement && over.data.current?.isDesignerDropArea) {
            const fromSectionId = active.data.current.sectionId;
            const toSectionId = over.data.current.sectionId;
            
            if (fromSectionId !== toSectionId && toSectionId) {
                const toSection = sections.find(s => s.id === toSectionId);
                moveElement(fromSectionId, toSectionId, String(active.id), toSection?.elements.length || 0);
            }
        }
    }

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-4 w-full h-full flex items-center justify-center">Loading...</div>;
    }

    return (
        <AIChatProvider formId={form.id}>
            <BuilderContent
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                activeSidebarElement={activeSidebarElement}
                activeCanvasElement={activeCanvasElement}
                submissions={submissions}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                formName={form.name}
            />
        </AIChatProvider>
    );
}

// Separate component to access AI Chat context
function BuilderContent({
    activeTab,
    setActiveTab,
    sensors,
    onDragStart,
    onDragEnd,
    activeSidebarElement,
    activeCanvasElement,
    submissions,
    saveStatus,
    lastSavedAt,
    formName,
}: {
    activeTab: "build" | "results";
    setActiveTab: (tab: "build" | "results") => void;
    sensors: ReturnType<typeof useSensors>;
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
    activeSidebarElement: FormElementType | null;
    activeCanvasElement: FormElementInstance | null;
    submissions: FormSubmission[];
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
    formName?: string;
}) {
    return (
        <div className="flex flex-col h-screen w-full bg-base-200">
            <BuilderHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                formName={formName}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === "build" && (
                        <motion.div
                            key="build"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 flex h-full"
                        >
                            <DndContext
                                sensors={sensors}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                            >
                                <div
                                    className="flex-1 grid transition-all duration-300 ease-out"
                                    style={{
                                        gridTemplateColumns: "320px 1fr 320px",
                                    }}
                                >
                                    <LeftPanel />
                                    <Canvas />
                                    <PropertiesPanel />
                                </div>
                                <DragOverlay>
                                    {activeSidebarElement && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="btn btn-neutral w-full justify-start cursor-grabbing shadow-xl ring-2 ring-primary"
                                        >
                                            {FormElements[activeSidebarElement].label}
                                        </motion.div>
                                    )}
                                    {activeCanvasElement && (
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0.5 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-4 rounded-xl shadow-2xl bg-base-100 ring-2 ring-primary w-[300px] pointer-events-none"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">
                                                    {activeCanvasElement.extraAttributes?.label ||
                                                        FormElements[activeCanvasElement.type].label}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        </motion.div>
                    )}

                    {activeTab === "results" && (
                        <motion.div
                            key="results"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 h-full"
                        >
                            <ResultsView submissions={submissions} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
