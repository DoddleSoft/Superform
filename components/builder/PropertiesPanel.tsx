"use client";

import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElements } from "./FormElements";
import { 
    LuX, 
    LuSettings, 
    LuGripVertical, 
    LuLayers, 
    LuPaintbrush, 
    LuType, 
    LuTrash2,
    LuFileText,
    LuToggleLeft
} from "react-icons/lu";
import { motion, AnimatePresence, scaleIn } from "@/lib/animations";
import { FormSection, FormStyle, FormElementType } from "@/types/form-builder";
import { saveFormStyle } from "@/actions/form";
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
import { PropertySection, PropertyField, PropertyTextarea } from "./properties";

// Form style options with labels and descriptions
const FORM_STYLE_OPTIONS: { value: FormStyle; label: string; description: string; icon: React.ReactNode }[] = [
    { 
        value: 'classic', 
        label: 'Classic', 
        description: 'All sections visible on one scrollable page',
        icon: <LuFileText className="w-5 h-5" />,
    },
    { 
        value: 'typeform', 
        label: 'Typeform', 
        description: 'Step-by-step with slide animations',
        icon: <LuToggleLeft className="w-5 h-5" />,
    },
];

// Element type icons for the header
const ELEMENT_TYPE_ICONS: Partial<Record<FormElementType, React.ReactNode>> = {
    [FormElementType.TEXT_FIELD]: <LuType className="w-4 h-4" />,
    [FormElementType.TEXTAREA]: <LuFileText className="w-4 h-4" />,
};

export function PropertiesPanel() {
    const { 
        selectedElement, 
        removeElement, 
        setSelectedElement, 
        sections,
        selectedSection,
        setSelectedSection,
        updateSection,
        reorderSections,
        canvasTab,
        formStyle,
        setFormStyle,
        formId,
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

    // Handle style change
    const handleStyleChange = async (newStyle: FormStyle) => {
        setFormStyle(newStyle);
        if (formId) {
            try {
                await saveFormStyle(formId, newStyle);
            } catch (error) {
                console.error("Failed to save form style:", error);
            }
        }
    };

    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-base-100 border-l border-base-200 flex flex-col overflow-hidden"
        >
            <AnimatePresence mode="wait">
                {/* Design Tab - Show style settings */}
                {canvasTab === 'design' ? (
                    <DesignSettingsView 
                        formStyle={formStyle} 
                        onStyleChange={handleStyleChange} 
                    />
                ) : selectedElement ? (
                    // Element Properties View
                    <motion.div
                        key={selectedElement.id}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-base-200 bg-base-100 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        {ELEMENT_TYPE_ICONS[selectedElement.type] || <LuSettings className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-base-content">
                                            {FormElements[selectedElement.type].label}
                                        </h3>
                                        <p className="text-[10px] text-base-content/50 uppercase tracking-wide">
                                            Properties
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content"
                                    onClick={() => setSelectedElement(null)}
                                    aria-label="Close properties"
                                >
                                    <LuX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Properties Content */}
                        <div className="flex-1 overflow-y-auto">
                            {(() => {
                                const PropertiesComponent = FormElements[selectedElement.type].propertiesComponent;
                                return <PropertiesComponent element={selectedElement} />;
                            })()}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-3 border-t border-base-200 bg-base-100/80 backdrop-blur shrink-0">
                            <button
                                className="btn btn-ghost btn-sm w-full gap-2 text-error hover:bg-error/10"
                                onClick={() => {
                                    if (elementSectionId) {
                                        removeElement(elementSectionId, selectedElement.id);
                                    }
                                }}
                            >
                                <LuTrash2 className="w-4 h-4" />
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
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-200 bg-base-100 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                            <LuLayers className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-base-content truncate max-w-[140px]">
                                {section.title}
                            </h3>
                            <p className="text-[10px] text-base-content/50 uppercase tracking-wide">
                                Section
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content"
                        onClick={onClose}
                        aria-label="Close section properties"
                    >
                        <LuX className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <PropertySection title="Content" icon={<LuType className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertyField
                        label="Title"
                        value={section.title}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        placeholder="Enter section title"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                    
                    <PropertyTextarea
                        label="Description"
                        value={section.description || ""}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="Add a description for this section..."
                        description="Optional. Shown below the section title."
                    />
                </PropertySection>

                <div className="px-4 py-3">
                    <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                        <p className="text-xs text-info/80">
                            <strong className="font-medium">Tip:</strong> In Typeform style, each section displays as a full-screen slide.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Design Settings View - shown when Design tab is active
function DesignSettingsView({ 
    formStyle, 
    onStyleChange 
}: { 
    formStyle: FormStyle; 
    onStyleChange: (style: FormStyle) => void;
}) {
    return (
        <motion.div
            key="design-settings"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-200 bg-base-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <LuPaintbrush className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-base-content">
                            Design
                        </h3>
                        <p className="text-[10px] text-base-content/50 uppercase tracking-wide">
                            Form Appearance
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <PropertySection title="Layout Style" icon={<LuLayers className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <p className="text-xs text-base-content/60 -mt-1 mb-3">
                        Choose how your form is presented to respondents
                    </p>
                    
                    <div className="space-y-2">
                        {FORM_STYLE_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className={`
                                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${formStyle === option.value 
                                        ? 'border-primary bg-primary/5 shadow-sm' 
                                        : 'border-base-200 hover:border-base-300 hover:bg-base-100'
                                    }
                                `}
                            >
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                    ${formStyle === option.value 
                                        ? 'bg-primary text-primary-content' 
                                        : 'bg-base-200 text-base-content/50'
                                    }
                                `}>
                                    {option.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{option.label}</span>
                                        {formStyle === option.value && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-primary text-primary-content rounded">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-base-content/60 mt-0.5">
                                        {option.description}
                                    </p>
                                </div>
                                <input
                                    type="radio"
                                    name="formStyle"
                                    value={option.value}
                                    checked={formStyle === option.value}
                                    onChange={() => onStyleChange(option.value)}
                                    className="radio radio-primary radio-sm mt-1"
                                />
                            </label>
                        ))}
                    </div>
                </PropertySection>

                <div className="px-4 py-3">
                    <div className="p-3 bg-base-200/50 rounded-lg border border-base-200">
                        <p className="text-xs text-base-content/60">
                            <strong className="font-medium">Coming soon:</strong> Custom colors, fonts, themes, and branding options.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function SectionListView() {
    const { sections, reorderSections, setSelectedSection, addSection } = useFormBuilder();
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-200 bg-base-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <LuLayers className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-base-content">
                            Sections
                        </h3>
                        <p className="text-[10px] text-base-content/50 uppercase tracking-wide">
                            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {sections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-base-200/50 flex items-center justify-center mb-4">
                            <LuLayers className="w-7 h-7 text-base-content/30" />
                        </div>
                        <p className="text-sm font-medium text-base-content/60">No sections yet</p>
                        <p className="text-xs text-base-content/40 mt-1 max-w-[180px]">
                            Add a section from the canvas to organize your form
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
                            <div className="space-y-2">
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

            {/* Footer hint */}
            {sections.length > 1 && (
                <div className="px-4 py-2 border-t border-base-200 bg-base-100/50 shrink-0">
                    <p className="text-[10px] text-base-content/40 text-center">
                        Drag sections to reorder
                    </p>
                </div>
            )}
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
            className={`
                flex items-center gap-2 p-2.5 rounded-lg border bg-base-100 cursor-pointer transition-all group
                ${isDragging 
                    ? 'opacity-50 shadow-lg border-primary ring-2 ring-primary/20' 
                    : 'border-base-200 hover:border-primary/40 hover:shadow-sm'
                }
            `}
            onClick={onClick}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-base-content/30 hover:text-base-content/60 p-0.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                <LuGripVertical className="w-3.5 h-3.5" />
            </button>
            
            <div className="w-6 h-6 rounded bg-secondary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-secondary">
                    {index + 1}
                </span>
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-base-content truncate">
                    {section.title}
                </p>
                <p className="text-[10px] text-base-content/50">
                    {section.elements.length} {section.elements.length === 1 ? 'field' : 'fields'}
                </p>
            </div>
            
            <LuSettings className="w-3.5 h-3.5 text-base-content/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
