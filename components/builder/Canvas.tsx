"use client";

import { useRef, useState } from "react";
import { useFormBuilder } from "@/context/FormBuilderContext";
import { FormElementInstance, FormSection, CanvasTab } from "@/types/form-builder";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormElements } from "./FormElements";
import { LuPlus, LuTrash2, LuSmartphone, LuTablet, LuMonitor, LuChevronRight, LuCheck } from "react-icons/lu";
import { motion, AnimatePresence, elementVariants } from "@/lib/animations";

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
    } = useFormBuilder();
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

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
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Canvas Tabs */}
            <div className="bg-base-100 border-b border-base-200 px-4 py-2 flex justify-center shrink-0">
                <div className="inline-flex bg-base-200 rounded-lg p-1 gap-1">
                    {CANVAS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCanvasTab(tab.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all
                                ${canvasTab === tab.id 
                                    ? 'bg-base-100 text-base-content shadow-sm' 
                                    : 'text-base-content/60 hover:text-base-content hover:bg-base-100/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas Content */}
            <div
                ref={containerRef}
                className={`flex-1 bg-base-200 overflow-y-auto overflow-x-hidden flex justify-center relative px-8 pt-8 transition-all
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
                    </div>
                )}

                {/* Design Tab Content - Form Preview */}
                {canvasTab === 'design' && (
                    <FormPreview 
                        sections={sections} 
                        formStyle={formStyle} 
                        previewDevice={previewDevice}
                        setPreviewDevice={setPreviewDevice}
                    />
                )}

                {/* Logic Tab Content - Placeholder for future conditional logic */}
                {canvasTab === 'logic' && (
                    <div className="w-full max-w-3xl flex flex-col items-center justify-center py-16 z-10">
                        <div className="text-center text-base-content/50">
                            <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium mb-2">Conditional Logic</h3>
                            <p className="text-sm max-w-sm">
                                Coming soon! Add conditional rules to show or hide questions based on user responses.
                            </p>
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

// Form Preview Component for Design Tab
import { FormStyle } from "@/types/form-builder";

interface FormPreviewProps {
    sections: FormSection[];
    formStyle: FormStyle;
    previewDevice: DeviceType;
    setPreviewDevice: (device: DeviceType) => void;
}

function FormPreview({ sections, formStyle, previewDevice, setPreviewDevice }: FormPreviewProps) {
    const [previewSection, setPreviewSection] = useState(0);
    const deviceConfig = DEVICE_SIZES.find(d => d.id === previewDevice) || DEVICE_SIZES[2];
    
    const currentSection = sections[previewSection];
    const isFirstSection = previewSection === 0;
    const isLastSection = previewSection === sections.length - 1;

    if (sections.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-16 z-10">
                <div className="text-center text-base-content/50">
                    <div className="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LuMonitor className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Form Content</h3>
                    <p className="text-sm max-w-sm">
                        Add some fields to your form to see a preview here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center z-10 pb-8">
            {/* Device Toggle */}
            <div className="bg-base-100 rounded-lg shadow-sm border border-base-200 p-1 flex gap-1 mb-6">
                {DEVICE_SIZES.map((device) => {
                    const Icon = device.icon;
                    return (
                        <button
                            key={device.id}
                            onClick={() => setPreviewDevice(device.id)}
                            className={`btn btn-sm gap-2 ${
                                previewDevice === device.id
                                    ? 'btn-primary'
                                    : 'btn-ghost'
                            }`}
                            title={device.label}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{device.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Device Frame */}
            <motion.div
                layout
                className="bg-base-100 rounded-2xl shadow-2xl overflow-hidden border-4 border-base-300"
                style={{ 
                    width: Math.min(deviceConfig.width, typeof window !== 'undefined' ? window.innerWidth - 100 : deviceConfig.width),
                    maxWidth: '100%',
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {/* Browser Chrome */}
                <div className="bg-base-200 px-4 py-2 flex items-center gap-2 border-b border-base-300">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-error/60" />
                        <div className="w-3 h-3 rounded-full bg-warning/60" />
                        <div className="w-3 h-3 rounded-full bg-success/60" />
                    </div>
                    <div className="flex-1 bg-base-300 rounded-md px-3 py-1 text-xs text-base-content/50 truncate">
                        yourdomain.com/form
                    </div>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto max-h-[60vh]">
                    {formStyle === 'classic' ? (
                        <ClassicPreview sections={sections} />
                    ) : (
                        <TypeformPreview 
                            section={currentSection} 
                            sectionIndex={previewSection}
                            totalSections={sections.length}
                            isFirst={isFirstSection}
                            isLast={isLastSection}
                            onNext={() => !isLastSection && setPreviewSection(prev => prev + 1)}
                            onPrev={() => !isFirstSection && setPreviewSection(prev => prev - 1)}
                        />
                    )}
                </div>
            </motion.div>

            {/* Style indicator */}
            <div className="mt-4 text-xs text-base-content/50 flex items-center gap-2">
                <span className="badge badge-ghost badge-sm">
                    {formStyle === 'classic' ? 'Classic' : 'Typeform'} style
                </span>
            </div>
        </div>
    );
}

// Classic style preview - All sections visible
function ClassicPreview({ sections }: { sections: FormSection[] }) {
    return (
        <div className="bg-gradient-to-br from-base-200 to-base-300 py-6 px-4">
            <div className="space-y-6">
                {sections.map((section, sectionIndex) => (
                    <div
                        key={section.id}
                        className="bg-base-100 rounded-xl shadow-lg p-6"
                    >
                        {/* Section Header */}
                        <div className="mb-6">
                            <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">
                                Section {sectionIndex + 1}
                            </span>
                            <h2 className="text-xl font-bold mt-1">
                                {section.title}
                            </h2>
                            {section.description && (
                                <p className="text-sm text-base-content/60 mt-1">
                                    {section.description}
                                </p>
                            )}
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            {section.elements.map((element) => (
                                <PreviewField key={element.id} element={element} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Submit Button */}
                <div className="flex justify-center pt-2">
                    <button className="btn btn-primary gap-2 pointer-events-none">
                        Submit
                        <LuCheck className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Typeform style preview - One section at a time
function TypeformPreview({ 
    section, 
    sectionIndex,
    totalSections,
    isFirst, 
    isLast,
    onNext,
    onPrev,
}: { 
    section: FormSection;
    sectionIndex: number;
    totalSections: number;
    isFirst: boolean;
    isLast: boolean;
    onNext: () => void;
    onPrev: () => void;
}) {
    return (
        <div className="min-h-[400px] flex flex-col bg-gradient-to-br from-base-200 to-base-300">
            {/* Progress Bar */}
            <div className="h-1 bg-base-300">
                <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((sectionIndex + 1) / totalSections) * 100}%` }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Section Number */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-bold text-primary">
                            {sectionIndex + 1}
                        </span>
                        <LuChevronRight className="w-4 h-4 text-primary" />
                    </div>

                    {/* Section Title */}
                    <h2 className="text-2xl font-bold mb-2">
                        {section.title}
                    </h2>
                    {section.description && (
                        <p className="text-base-content/60 mb-6">
                            {section.description}
                        </p>
                    )}

                    {/* Fields */}
                    <div className="space-y-4">
                        {section.elements.map((element) => (
                            <PreviewField key={element.id} element={element} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-4 bg-base-100 border-t border-base-200 flex items-center justify-between">
                <button 
                    onClick={onPrev}
                    className={`btn btn-ghost btn-sm gap-1 ${isFirst ? 'invisible' : ''}`}
                >
                    <LuChevronRight className="w-4 h-4 rotate-180" />
                    Back
                </button>

                {/* Dots */}
                <div className="flex gap-1.5">
                    {Array.from({ length: totalSections }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                i === sectionIndex
                                    ? 'bg-primary'
                                    : i < sectionIndex
                                        ? 'bg-primary/50'
                                        : 'bg-base-300'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={onNext}
                    className="btn btn-primary btn-sm gap-1"
                >
                    {isLast ? 'Submit' : 'Next'}
                    {isLast ? <LuCheck className="w-4 h-4" /> : <LuChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// Preview field component - renders a read-only version of form fields
function PreviewField({ element }: { element: FormElementInstance }) {
    const label = element.extraAttributes?.label || FormElements[element.type]?.label || 'Field';
    const required = element.extraAttributes?.required;
    const placeholder = element.extraAttributes?.placeholder || '';
    const helperText = element.extraAttributes?.helperText;

    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1">
                {label}
                {required && <span className="text-error">*</span>}
            </label>
            
            {/* Render different field types */}
            {element.type === 'TextField' && (
                <input
                    type="text"
                    placeholder={placeholder}
                    className="input input-bordered w-full input-sm"
                    disabled
                />
            )}
            {element.type === 'TextArea' && (
                <textarea
                    placeholder={placeholder}
                    className="textarea textarea-bordered w-full textarea-sm"
                    rows={3}
                    disabled
                />
            )}
            {element.type === 'Number' && (
                <input
                    type="number"
                    placeholder={placeholder}
                    className="input input-bordered w-full input-sm"
                    disabled
                />
            )}
            {element.type === 'Date' && (
                <input
                    type="date"
                    className="input input-bordered w-full input-sm"
                    disabled
                />
            )}
            {element.type === 'Checkbox' && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        disabled
                    />
                    <span className="text-sm text-base-content/70">{placeholder || 'Check this option'}</span>
                </div>
            )}
            {element.type === 'Select' && (
                <select className="select select-bordered w-full select-sm" disabled>
                    <option>{placeholder || 'Select an option'}</option>
                    {element.extraAttributes?.options?.map((opt: string, i: number) => (
                        <option key={i}>{opt}</option>
                    ))}
                </select>
            )}
            
            {helperText && (
                <p className="text-xs text-base-content/50">{helperText}</p>
            )}
        </div>
    );
}
