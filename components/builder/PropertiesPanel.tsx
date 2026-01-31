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
    LuToggleLeft,
    LuPalette,
    LuMousePointer2,
    LuLayoutGrid,
    LuPartyPopper,
    LuLink,
    LuCheck
} from "react-icons/lu";
import { motion, AnimatePresence, scaleIn } from "@/lib/animations";
import { FormSection, FormStyle, FormElementType, FormDesignSettings, FormFontFamily, ButtonCornerRadius, DEFAULT_DESIGN_SETTINGS, getSectionElements, ThankYouPageSettings } from "@/types/form-builder";
import { saveFormStyle, saveFormDesignSettings, saveThankYouPage } from "@/actions/form";
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
import { PropertySection, PropertyField, PropertyTextarea, PropertySelect, PropertyColorPicker, PropertyToggle } from "./properties";
import { useCallback, useRef, useState } from "react";

type RightPanelTab = "properties" | "style";

// Form style options with labels and descriptions
const FORM_STYLE_OPTIONS: { value: FormStyle; label: string; description: string }[] = [
    { 
        value: 'classic', 
        label: 'Classic', 
        description: 'All sections visible on one scrollable page',
    },
    { 
        value: 'typeform', 
        label: 'Typeform', 
        description: 'Step-by-step with slide animations',
    },
];

// Font family options
const FONT_FAMILY_OPTIONS: { value: FormFontFamily; label: string }[] = [
    { value: 'system', label: 'System Default' },
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'poppins', label: 'Poppins' },
    { value: 'open-sans', label: 'Open Sans' },
    { value: 'lato', label: 'Lato' },
    { value: 'montserrat', label: 'Montserrat' },
    { value: 'playfair', label: 'Playfair Display' },
    { value: 'merriweather', label: 'Merriweather' },
];

// Button corner radius options
const BUTTON_RADIUS_OPTIONS: { value: ButtonCornerRadius; label: string }[] = [
    { value: 'none', label: 'None (Square)' },
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'full', label: 'Full (Pill)' },
];

// Question spacing options
const QUESTION_SPACING_OPTIONS: { value: FormDesignSettings['questionSpacing']; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'normal', label: 'Normal' },
    { value: 'relaxed', label: 'Relaxed' },
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
        removeSection,
        reorderSections,
        formStyle,
        setFormStyle,
        designSettings,
        updateDesignSetting,
        formId,
        thankYouPage,
        updateThankYouPage,
        isThankYouPageSelected,
        setIsThankYouPageSelected,
    } = useFormBuilder();

    // Local state for right panel tab
    const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');

    // Find which section contains the selected element
    const findElementSection = () => {
        for (const section of sections) {
            if (getSectionElements(section).some(el => el.id === selectedElement?.id)) {
                return section.id;
            }
        }
        return null;
    };

    const elementSectionId = selectedElement ? findElementSection() : null;

    // Debounce timer ref for design settings
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Handle design setting change with debounce
    const handleDesignSettingChange = useCallback(<K extends keyof FormDesignSettings>(
        key: K, 
        value: FormDesignSettings[K]
    ) => {
        updateDesignSetting(key, value);
        
        // Debounce save to prevent too many API calls
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
            if (formId) {
                try {
                    const updatedSettings = { ...designSettings, [key]: value };
                    await saveFormDesignSettings(formId, updatedSettings);
                } catch (error) {
                    console.error("Failed to save design settings:", error);
                }
            }
        }, 500);
    }, [formId, designSettings, updateDesignSetting]);

    return (
        <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full bg-base-100 border-l border-base-200 flex flex-col overflow-hidden"
        >
            {/* Tab Switcher */}
            <div className="p-3 border-b border-base-200 shrink-0">
                <div className="flex items-center bg-base-200/80 rounded-full p-1 gap-0.5">
                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium
                            rounded-full transition-all duration-200
                            ${activeTab === 'properties'
                                ? "bg-base-100 text-base-content shadow-sm"
                                : "text-base-content/50 hover:text-base-content"
                            }
                        `}
                    >
                        <LuSettings className="w-3.5 h-3.5" />
                        <span>Properties</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium
                            rounded-full transition-all duration-200
                            ${activeTab === 'style'
                                ? "bg-base-100 text-base-content shadow-sm"
                                : "text-base-content/50 hover:text-base-content"
                            }
                        `}
                    >
                        <LuPaintbrush className="w-3.5 h-3.5" />
                        <span>Style</span>
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Style Tab */}
                {activeTab === 'style' ? (
                    <DesignSettingsView 
                        formStyle={formStyle} 
                        onStyleChange={handleStyleChange}
                        designSettings={designSettings}
                        onDesignSettingChange={handleDesignSettingChange}
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
                        onDelete={() => {
                            removeSection(selectedSection.id);
                            setSelectedSection(null);
                        }}
                        canDelete={sections.length > 1}
                    />
                ) : isThankYouPageSelected ? (
                    // Thank You Page Properties View
                    <ThankYouPagePropertiesView 
                        settings={thankYouPage}
                        onClose={() => setIsThankYouPageSelected(false)}
                        onUpdate={updateThankYouPage}
                        formId={formId}
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
    onUpdate,
    onDelete,
    canDelete,
}: { 
    section: FormSection; 
    onClose: () => void;
    onUpdate: (updates: Partial<Omit<FormSection, "id" | "elements">>) => void;
    onDelete: () => void;
    canDelete: boolean;
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

                <PropertySection title="Display" icon={<LuSettings className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertyToggle
                        label="Show Section Title"
                        description="Display the section title to form respondents"
                        checked={section.showTitle ?? false}
                        onChange={(e) => onUpdate({ showTitle: e.target.checked })}
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

            {/* Footer Actions */}
            {canDelete && (
                <div className="p-3 border-t border-base-200 bg-base-100/80 backdrop-blur shrink-0">
                    <button
                        className="btn btn-ghost btn-sm w-full gap-2 text-error hover:bg-error/10"
                        onClick={onDelete}
                    >
                        <LuTrash2 className="w-4 h-4" />
                        Delete Section
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// Design Settings View - shown when Style tab is active
function DesignSettingsView({ 
    formStyle, 
    onStyleChange,
    designSettings,
    onDesignSettingChange,
}: { 
    formStyle: FormStyle; 
    onStyleChange: (style: FormStyle) => void;
    designSettings: FormDesignSettings;
    onDesignSettingChange: <K extends keyof FormDesignSettings>(key: K, value: FormDesignSettings[K]) => void;
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
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Layout Section */}
                <PropertySection title="Layout" icon={<LuLayoutGrid className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertySelect
                        label="Form Layout Style"
                        description="How your form is presented to respondents"
                        value={formStyle}
                        onChange={(e) => onStyleChange(e.target.value as FormStyle)}
                        options={FORM_STYLE_OPTIONS}
                    />

                    <PropertySelect
                        label="Question Spacing"
                        description="Space between form questions"
                        value={designSettings.questionSpacing}
                        onChange={(e) => onDesignSettingChange('questionSpacing', e.target.value as FormDesignSettings['questionSpacing'])}
                        options={QUESTION_SPACING_OPTIONS}
                    />

                    {formStyle === 'classic' && (
                        <PropertyToggle
                            label="Show Sections"
                            description="Display section cards with headers. When off, shows all fields in a flat layout."
                            checked={designSettings.showSections}
                            onChange={(e) => onDesignSettingChange('showSections', e.target.checked)}
                        />
                    )}
                </PropertySection>

                {/* Colors Section */}
                <PropertySection title="Colors" icon={<LuPalette className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertyColorPicker
                        label="Background Color"
                        description="Form page background"
                        value={designSettings.backgroundColor}
                        onChange={(value) => onDesignSettingChange('backgroundColor', value)}
                    />
                    
                    <PropertyColorPicker
                        label="Primary Color"
                        description="Used for focus states and highlights"
                        value={designSettings.primaryColor}
                        onChange={(value) => onDesignSettingChange('primaryColor', value)}
                    />

                    <PropertyColorPicker
                        label="Text Color"
                        description="Main text and labels"
                        value={designSettings.textColor}
                        onChange={(value) => onDesignSettingChange('textColor', value)}
                    />
                </PropertySection>

                {/* Typography Section */}
                <PropertySection title="Typography" icon={<LuType className="w-3.5 h-3.5" />} defaultOpen={false}>
                    <PropertySelect
                        label="Font Family"
                        description="Primary font for the form"
                        value={designSettings.fontFamily}
                        onChange={(e) => onDesignSettingChange('fontFamily', e.target.value as FormFontFamily)}
                        options={FONT_FAMILY_OPTIONS}
                    />
                </PropertySection>

                {/* Buttons Section */}
                <PropertySection title="Buttons" icon={<LuMousePointer2 className="w-3.5 h-3.5" />} defaultOpen={false}>
                    <PropertyColorPicker
                        label="Button Color"
                        description="Background color for buttons"
                        value={designSettings.buttonColor}
                        onChange={(value) => onDesignSettingChange('buttonColor', value)}
                    />

                    <PropertyColorPicker
                        label="Button Text Color"
                        description="Text color on buttons"
                        value={designSettings.buttonTextColor}
                        onChange={(value) => onDesignSettingChange('buttonTextColor', value)}
                    />

                    <PropertySelect
                        label="Button Corner Radius"
                        description="How rounded the button corners are"
                        value={designSettings.buttonCornerRadius}
                        onChange={(e) => onDesignSettingChange('buttonCornerRadius', e.target.value as ButtonCornerRadius)}
                        options={BUTTON_RADIUS_OPTIONS}
                    />
                </PropertySection>

                {/* Reset to Defaults */}
                <div className="px-4 py-3">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm w-full text-base-content/60 hover:text-base-content"
                        onClick={() => {
                            // Reset all design settings to defaults
                            Object.entries(DEFAULT_DESIGN_SETTINGS).forEach(([key, value]) => {
                                onDesignSettingChange(key as keyof FormDesignSettings, value);
                            });
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function SectionListView() {
    const { 
        sections, 
        reorderSections, 
        setSelectedSection, 
        addSection,
        setIsThankYouPageSelected,
        setSelectedElement,
    } = useFormBuilder();
    
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

    const handleThankYouPageClick = () => {
        setSelectedElement(null);
        setSelectedSection(null);
        setIsThankYouPageSelected(true);
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
            {/* Sections Header */}
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

                {/* Thank You Page Section */}
                <div className="mt-4 pt-4 border-t border-base-200">
                    <p className="text-[10px] text-base-content/50 uppercase tracking-wide font-medium mb-2 px-1">
                        Thank You Page
                    </p>
                    <div
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-base-100 cursor-pointer transition-all group border-base-200 hover:border-primary/40 hover:shadow-sm"
                        onClick={handleThankYouPageClick}
                    >
                        <div className="w-6 h-6 rounded bg-success/10 flex items-center justify-center shrink-0">
                            <LuPartyPopper className="w-3.5 h-3.5 text-success" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-base-content truncate">
                                Thank You
                            </p>
                            <p className="text-[10px] text-base-content/50">
                                Shown after submission
                            </p>
                        </div>
                        
                        <LuSettings className="w-3.5 h-3.5 text-base-content/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
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
    onClick,
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
                    {getSectionElements(section).length} {getSectionElements(section).length === 1 ? 'field' : 'fields'}
                </p>
            </div>

            <LuSettings className="w-3.5 h-3.5 text-base-content/30 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

// Thank You Page Properties View
function ThankYouPagePropertiesView({ 
    settings, 
    onClose, 
    onUpdate,
    formId,
}: { 
    settings: ThankYouPageSettings; 
    onClose: () => void;
    onUpdate: <K extends keyof ThankYouPageSettings>(key: K, value: ThankYouPageSettings[K]) => void;
    formId: string | null;
}) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle setting change with debounce
    const handleSettingChange = useCallback(<K extends keyof ThankYouPageSettings>(
        key: K, 
        value: ThankYouPageSettings[K]
    ) => {
        onUpdate(key, value);
        
        // Debounce save to prevent too many API calls
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(async () => {
            if (formId) {
                try {
                    const updatedSettings = { ...settings, [key]: value };
                    await saveThankYouPage(formId, updatedSettings);
                } catch (error) {
                    console.error("Failed to save thank you page settings:", error);
                }
            }
        }, 500);
    }, [formId, settings, onUpdate]);

    return (
        <motion.div
            key="thank-you-page-properties"
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
                        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                            <LuPartyPopper className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-base-content">
                                Thank You Page
                            </h3>
                            <p className="text-[10px] text-base-content/50 uppercase tracking-wide">
                                Success Screen
                            </p>
                        </div>
                    </div>
                    <button
                        className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content"
                        onClick={onClose}
                        aria-label="Close thank you page properties"
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
                        value={settings.title}
                        onChange={(e) => handleSettingChange('title', e.target.value)}
                        placeholder="Thank You!"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                        }}
                    />
                    
                    <PropertyTextarea
                        label="Message"
                        value={settings.description}
                        onChange={(e) => handleSettingChange('description', e.target.value)}
                        placeholder="Your response has been submitted successfully."
                        description="Shown below the title on the success screen."
                    />
                </PropertySection>

                <PropertySection title="Effects" icon={<LuPartyPopper className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertyToggle
                        label="Show Confetti"
                        description="Celebrate with confetti animation"
                        checked={settings.showConfetti}
                        onChange={(e) => handleSettingChange('showConfetti', e.target.checked)}
                    />
                </PropertySection>

                <PropertySection title="Button" icon={<LuMousePointer2 className="w-3.5 h-3.5" />} defaultOpen={true}>
                    <PropertyToggle
                        label="Show Button"
                        description="Display a call-to-action button"
                        checked={settings.showButton}
                        onChange={(e) => handleSettingChange('showButton', e.target.checked)}
                    />
                    
                    {settings.showButton && (
                        <>
                            <PropertyField
                                label="Button Text"
                                value={settings.buttonText}
                                onChange={(e) => handleSettingChange('buttonText', e.target.value)}
                                placeholder="Submit another response"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") e.currentTarget.blur();
                                }}
                            />
                            
                            <PropertyField
                                label="Button URL (optional)"
                                value={settings.buttonUrl}
                                onChange={(e) => handleSettingChange('buttonUrl', e.target.value)}
                                placeholder="https://example.com"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") e.currentTarget.blur();
                                }}
                            />
                            
                            <p className="text-[10px] text-base-content/50 px-0.5">
                                Leave empty to reload the form for another submission.
                            </p>
                        </>
                    )}
                </PropertySection>

                <div className="px-4 py-3">
                    <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                        <p className="text-xs text-info/80">
                            <strong className="font-medium">Tip:</strong> Preview your Thank You page in the Design tab to see how it will look to respondents.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
