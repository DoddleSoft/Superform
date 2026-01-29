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
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { useState } from "react";
import { FormElementInstance, FormElementType } from "@/types/form-builder";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { arrayMove } from "@dnd-kit/sortable";
import { BuilderHeader } from "./BuilderHeader";
import { useEffect } from "react";
import { FormElements } from "./FormElements";
import { ResultsView } from "./ResultsView";
import { AIChatProvider } from "@/context/AIChatContext";
import { AIChatSidebar } from "./AIChatSidebar";

export function BuilderMain({ form, submissions }: { form: any, submissions: any[] }) {
    const { elements, addElement, setElements, setFormMetadata } = useFormBuilder();
    const [activeSidebarElement, setActiveSidebarElement] = useState<FormElementType | null>(null);
    const [activeCanvasElement, setActiveCanvasElement] = useState<FormElementInstance | null>(null);
    const [activeTab, setActiveTab] = useState<"build" | "results">("build");

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
            <div className="flex flex-col h-screen w-full">
                <BuilderHeader activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "build" && (
                    <DndContext
                        sensors={sensors}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    >
                        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full">
                            <Sidebar />
                            <Canvas />
                            <PropertiesPanel />
                        </div>
                        <DragOverlay>
                            {activeSidebarElement && (
                                <div className="btn btn-neutral w-full justify-start cursor-grabbing shadow-xl ring-2 ring-primary">
                                    {FormElements[activeSidebarElement].label}
                                </div>
                            )}
                            {activeCanvasElement && (
                                <div className="p-4 rounded-xl shadow-2xl bg-base-100 ring-2 ring-primary w-[300px] pointer-events-none">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{activeCanvasElement.extraAttributes?.label || FormElements[activeCanvasElement.type].label}</span>
                                    </div>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                {activeTab === "results" && (
                    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full">
                        <ResultsView submissions={submissions} />
                    </div>
                )}

                {/* AI Chat Sidebar */}
                <AIChatSidebar />
            </div>
        </AIChatProvider>
    );
}

// Removing DndContext from wrapping the Header allows Header to exist outside the drag context
// which is actually fine.
