"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    pointerWithin,
    rectIntersection,
} from "@dnd-kit/core";
import { LeftPanel } from "./LeftPanel";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { useState, useEffect } from "react";
import { FormElementInstance, FormElementType, FormSection, createSection, FormStyle, DEFAULT_DESIGN_SETTINGS, DEFAULT_THANK_YOU_PAGE, migrateToRowFormat, FormRow, createRow } from "@/types/form-builder";
import { FormSubmission } from "@/types/submission";
import { useFormBuilder, DropPosition } from "@/context/FormBuilderContext";
import { arrayMove } from "@dnd-kit/sortable";
import { BuilderHeader } from "./BuilderHeader";
import { FormElements } from "./FormElements";
import { ResultsView } from "./ResultsView";
import { SettingsView } from "./SettingsView";
import { AnalyticsView } from "./AnalyticsView";
import { AIChatProvider } from "@/context/AIChatContext";
import { useAutoSave, SaveStatus } from "@/hooks/useAutoSave";
import { motion, AnimatePresence, tabContentVariants } from "@/lib/animations";
import { FormSetupModal } from "./FormSetupModal";
import { useSearchParams } from "next/navigation";

export function BuilderMain({ form, submissions }: { form: any, submissions: FormSubmission[] }) {
    const { sections, addElement, addElementToRow, setSections, setFormMetadata, setFormStyle, formId, addSection, moveElement } = useFormBuilder();
    const [activeSidebarElement, setActiveSidebarElement] = useState<FormElementType | null>(null);
    const [activeCanvasElement, setActiveCanvasElement] = useState<FormElementInstance | null>(null);
    const [activeElementSectionId, setActiveElementSectionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"build" | "settings" | "analytics" | "results">("build");
    const [localFormName, setLocalFormName] = useState(form.name);

    // Only verify "new" param once to prevent modal loops
    const searchParams = useSearchParams();
    const shouldShowSetup = searchParams.get("new") === "true";
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [hasCheckedNewParam, setHasCheckedNewParam] = useState(false);

    useEffect(() => {
        if (!hasCheckedNewParam && shouldShowSetup) {
            setIsSetupModalOpen(true);
            setHasCheckedNewParam(true);
        }
    }, [shouldShowSetup, hasCheckedNewParam]);

    const handleFormUpdate = (name: string, description: string) => {
        // Update local context state
        // The setFormMetadata update happens in the modal via action, 
        // but we can force a refresh if needed or trust the action to handle database
        // and let auto-save pick up subsequent changes.
        // Actually, for immediate UI feedback we should rely on the action's success.
        // But we might want to update the header title immediately.
        // The BuilderHeader likely reads from form context or prop.
        // If it reads from context, we need to update context.
        setFormMetadata(
            form.id,
            form.published,
            form.short_code,
            form.style || 'classic',
            form.design_settings ? { ...DEFAULT_DESIGN_SETTINGS, ...form.design_settings } : DEFAULT_DESIGN_SETTINGS,
            form.thank_you_page ? { ...DEFAULT_THANK_YOU_PAGE, ...form.thank_you_page } : DEFAULT_THANK_YOU_PAGE,
            {
                currentVersion: form.current_version || 1,
                publishedAt: form.published_at || null,
            },
            // Just pass existing snapshot as we didn't change content
            {
                content: form.published_content,
                style: form.published_style,
                designSettings: form.published_design_settings
                    ? { ...DEFAULT_DESIGN_SETTINGS, ...form.published_design_settings }
                    : null,
                thankYouPage: form.published_thank_you_page
                    ? { ...DEFAULT_THANK_YOU_PAGE, ...form.published_thank_you_page }
                    : null,
            }
        );
        // FORCE RELOAD to get new name in server component wrapper if needed, 
        // but better to update client state if possible.
        // For now, let's just close modal. The header might not update immediately if it uses prop.
        // Let's pass the new name to BuilderContent or update it via router.refresh() 
        // but router.refresh() might be heavy.

        // Actually, BuilderMain takes `form` as prop. 
        // We might need strict local state for the name if we want instant update without refresh.
    };

    // Auto-save hook - now saves sections instead of elements
    const { saveStatus, lastSavedAt, error: saveError } = useAutoSave({
        formId,
        elements: sections, // Now sections array
        debounceMs: 1500,
    });

    useEffect(() => {
        if (form) {
            // Handle both old format (flat array) and new format (sections with rows)
            const content = form.content || [];
            let sectionsToSet: FormSection[];

            if (Array.isArray(content) && content.length > 0) {
                // Check if it's the new section format
                if (content[0]?.rows !== undefined || content[0]?.elements !== undefined) {
                    // Migrate each section to row format if needed
                    sectionsToSet = content.map((s: any) => migrateToRowFormat(s));
                } else {
                    // Old flat array format - migrate to section with rows format
                    const defaultSection = createSection(crypto.randomUUID(), "Section 1");
                    // Convert each element to its own row
                    defaultSection.rows = (content as FormElementInstance[]).map(
                        (el: FormElementInstance) => createRow(crypto.randomUUID(), el)
                    );
                    sectionsToSet = [defaultSection];
                }
            } else {
                // Empty content - create a default section
                const defaultSection = createSection(crypto.randomUUID(), "Section 1");
                sectionsToSet = [defaultSection];
            }

            setSections(sectionsToSet);

            // Build published snapshot for diff comparison
            const publishedSnapshot = form.published ? {
                content: form.published_content,
                style: form.published_style,
                designSettings: form.published_design_settings
                    ? { ...DEFAULT_DESIGN_SETTINGS, ...form.published_design_settings }
                    : null,
                thankYouPage: form.published_thank_you_page
                    ? { ...DEFAULT_THANK_YOU_PAGE, ...form.published_thank_you_page }
                    : null,
            } : {
                content: null,
                style: null,
                designSettings: null,
                thankYouPage: null,
            };

            // Set form metadata including style, versioning info, and published snapshot
            setFormMetadata(
                form.id,
                form.published,
                form.short_code,
                form.style || 'classic',
                form.design_settings ? { ...DEFAULT_DESIGN_SETTINGS, ...form.design_settings } : DEFAULT_DESIGN_SETTINGS,
                form.thank_you_page ? { ...DEFAULT_THANK_YOU_PAGE, ...form.thank_you_page } : DEFAULT_THANK_YOU_PAGE,
                {
                    currentVersion: form.current_version || 1,
                    publishedAt: form.published_at || null,
                },
                publishedSnapshot,
                form.settings || null
            );
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

        // If dragging a row
        if (event.active.data.current?.isDesignerRow) {
            // Could set active row state here if needed
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveSidebarElement(null);
        setActiveCanvasElement(null);
        setActiveElementSectionId(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Drop Sidebar Element -> Section Drop Area (empty section)
        if (activeData?.isDesignerBtnElement && overData?.isDesignerDropArea) {
            const type = activeData.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = overData.sectionId;

            if (sectionId) {
                const section = sections.find(s => s.id === sectionId);
                addElement(sectionId, section?.rows.length || 0, newElement);
            }
            return;
        }

        // Drop Sidebar Element -> Side drop area (add to existing row)
        if (activeData?.isDesignerBtnElement && overData?.isSideDropArea) {
            const type = activeData.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = overData.sectionId;
            const rowId = overData.rowId;

            if (sectionId && rowId) {
                addElementToRow(sectionId, rowId, newElement, 'right');
            }
            return;
        }

        // Drop Sidebar Element -> Over another Element in a section
        if (activeData?.isDesignerBtnElement && overData?.isDesignerElement) {
            const type = activeData.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = overData.sectionId;
            const rowIndex = overData.rowIndex ?? 0;

            if (sectionId) {
                // Add above the hovered element's row
                addElement(sectionId, rowIndex, newElement);
            }
            return;
        }

        // Drop Sidebar Element -> Over a Row
        if (activeData?.isDesignerBtnElement && overData?.isDesignerRow) {
            const type = activeData.type as FormElementType;
            const newElement = FormElements[type].construct(crypto.randomUUID());
            const sectionId = overData.sectionId;
            const rowIndex = overData.rowIndex ?? 0;

            if (sectionId) {
                addElement(sectionId, rowIndex, newElement);
            }
            return;
        }

        // Reordering Rows within same section
        if (activeData?.isDesignerRow && overData?.isDesignerRow) {
            const fromSectionId = activeData.sectionId;
            const toSectionId = overData.sectionId;
            const activeRowId = active.id;
            const overRowId = over.id;

            if (fromSectionId === toSectionId && activeRowId !== overRowId) {
                setSections(prev => prev.map(section => {
                    if (section.id !== fromSectionId) return section;

                    const oldIndex = section.rows.findIndex(r => r.id === activeRowId);
                    const newIndex = section.rows.findIndex(r => r.id === overRowId);

                    if (oldIndex === -1 || newIndex === -1) return section;

                    return {
                        ...section,
                        rows: arrayMove(section.rows, oldIndex, newIndex)
                    };
                }));
            }
            return;
        }

        // Reordering Elements - move to different row position
        if (activeData?.isDesignerElement && overData?.isDesignerElement) {
            const activeId = active.id;
            const overId = over.id;
            const fromSectionId = activeData.sectionId;
            const toSectionId = overData.sectionId;
            const toRowIndex = overData.rowIndex ?? 0;

            if (activeId !== overId) {
                moveElement(fromSectionId, toSectionId, String(activeId), toRowIndex);
            }
            return;
        }

        // Move element to side drop zone (add side-by-side)
        if (activeData?.isDesignerElement && overData?.isSideDropArea) {
            const elementId = String(active.id);
            const fromSectionId = activeData.sectionId;
            const toSectionId = overData.sectionId;
            const targetRowId = overData.rowId;
            const toRowIndex = overData.rowIndex ?? 0;

            // Move element to side of existing row
            moveElement(fromSectionId, toSectionId, elementId, toRowIndex, 'side', targetRowId);
            return;
        }

        // Drop element onto section drop area (cross-section move or to empty section)
        if (activeData?.isDesignerElement && overData?.isDesignerDropArea) {
            const fromSectionId = activeData.sectionId;
            const toSectionId = overData.sectionId;

            if (toSectionId) {
                const toSection = sections.find(s => s.id === toSectionId);
                moveElement(fromSectionId, toSectionId, String(active.id), toSection?.rows.length || 0);
            }
        }

        // Move element to a row
        if (activeData?.isDesignerElement && overData?.isDesignerRow) {
            const fromSectionId = activeData.sectionId;
            const toSectionId = overData.sectionId;
            const toRowIndex = overData.rowIndex ?? 0;

            moveElement(fromSectionId, toSectionId, String(active.id), toRowIndex);
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
                formName={localFormName} // Use local state for immediate updates
            />
            {isSetupModalOpen && (
                <FormSetupModal
                    formId={form.id}
                    defaultName={form.name}
                    onClose={() => setIsSetupModalOpen(false)}
                    onUpdate={(name, desc) => {
                        setLocalFormName(name);
                    }}
                />
            )}
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
    activeTab: "build" | "settings" | "analytics" | "results";
    setActiveTab: (tab: "build" | "settings" | "analytics" | "results") => void;
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

            <div className="flex-1 flex overflow-hidden relative min-w-0">
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

                    {activeTab === "settings" && (
                        <motion.div
                            key="settings"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 h-full min-w-0"
                        >
                            <SettingsView />
                        </motion.div>
                    )}

                    {activeTab === "analytics" && (
                        <motion.div
                            key="analytics"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 h-full min-w-0"
                        >
                            <AnalyticsView submissions={submissions} />
                        </motion.div>
                    )}

                    {activeTab === "results" && (
                        <motion.div
                            key="results"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex-1 h-full min-w-0"
                        >
                            <ResultsView submissions={submissions} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
