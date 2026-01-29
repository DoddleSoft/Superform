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
import { FormElementInstance, FormElementType } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { arrayMove } from "@dnd-kit/sortable";
import { BuilderHeader } from "./BuilderHeader";
import { FormElements } from "./FormElements";
import { ResultsView } from "./ResultsView";
import { AIChatProvider } from "@/context/AIChatContext";
import { useAutoSave, SaveStatus } from "@/hooks/useAutoSave";
import { motion, AnimatePresence, tabContentVariants } from "@/lib/animations";

export function BuilderMain({ form, submissions }: { form: any, submissions: any[] }) {
    const { elements, addElement, setElements, setFormMetadata, formId } = useFormBuilder();
    const [activeSidebarElement, setActiveSidebarElement] = useState<FormElementType | null>(null);
    const [activeCanvasElement, setActiveCanvasElement] = useState<FormElementInstance | null>(null);
    const [activeTab, setActiveTab] = useState<"build" | "results">("build");

    // Auto-save hook
    const { saveStatus, lastSavedAt, error: saveError } = useAutoSave({
        formId,
        elements,
        debounceMs: 1500,
    });

    useEffect(() => {
        if (form) {
            setElements(form.content || []);
            setFormMetadata(form.id, form.published, form.share_url);
        }
    }, [form, setElements, setFormMetadata]);

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
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveSidebarElement(null);
        setActiveCanvasElement(null);

        if (!over) return;

        // Drop Sidebar Element -> Canvas
        if (active.data.current?.isDesignerBtnElement && over.id === "canvas-droppable") {
            const type = active.data.current.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            addElement(elements.length, newElement);
            return;
        }

        // Drop Sidebar Element -> Over another Element (Sortable)
        if (active.data.current?.isDesignerBtnElement && over.data.current?.isDesignerElement) {
            const type = active.data.current.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());

            // Find index of over element
            const overElementIndex = elements.findIndex(el => el.id === over.id);
            if (overElementIndex === -1) {
                addElement(elements.length, newElement);
                return;
            }

            // Insert at the new index
            addElement(overElementIndex, newElement);
            return;
        }


        // Reordering Canvas Elements
        if (active.data.current?.isDesignerElement && over.data.current?.isDesignerElement) {
            const activeId = active.id;
            const overId = over.id;

            if (activeId !== overId) {
                const oldIndex = elements.findIndex((el) => el.id === activeId);
                const newIndex = elements.findIndex((el) => el.id === overId);
                setElements((prev) => arrayMove(prev, oldIndex, newIndex));
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
}: {
    activeTab: "build" | "results";
    setActiveTab: (tab: "build" | "results") => void;
    sensors: ReturnType<typeof useSensors>;
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
    activeSidebarElement: FormElementType | null;
    activeCanvasElement: FormElementInstance | null;
    submissions: any[];
    saveStatus: SaveStatus;
    lastSavedAt: Date | null;
}) {
    return (
        <div className="flex flex-col h-screen w-full bg-base-200">
            <BuilderHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
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
