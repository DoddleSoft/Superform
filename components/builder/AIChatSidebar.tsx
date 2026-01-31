"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIChat, FormToolAction } from "@/context/AIChatContext";
import { 
    LuSend, 
    LuCheck, 
    LuPlus, 
    LuPenLine, 
    LuTrash2, 
    LuSparkles, 
    LuArrowRight, 
    LuSquare,
    LuLayoutGrid,
    LuPalette,
    LuHeart,
    LuType,
    LuHash,
    LuMail,
    LuPhone,
    LuCalendar,
    LuSquareCheck,
    LuCircleDot,
    LuStar,
    LuToggleLeft,
    LuHeading,
    LuFileText,
    LuUpload,
    LuImage,
    LuChevronDown,
    LuColumns2,
    LuLayers,
    LuArrowUpDown,
    LuShuffle,
    LuMessageSquare,
    LuWand,
    LuZap,
    LuListChecks,
    LuAlignLeft,
} from "react-icons/lu";

// Field type icon mapping
const FIELD_TYPE_ICONS: Record<string, React.ElementType> = {
    TextField: LuType,
    Number: LuHash,
    TextArea: LuAlignLeft,
    Email: LuMail,
    Phone: LuPhone,
    Date: LuCalendar,
    Select: LuChevronDown,
    RadioGroup: LuCircleDot,
    CheckboxGroup: LuListChecks,
    Checkbox: LuSquareCheck,
    YesNo: LuToggleLeft,
    Rating: LuStar,
    Heading: LuHeading,
    RichText: LuFileText,
    FileUpload: LuUpload,
    Image: LuImage,
};

// Action category colors
const ACTION_COLORS = {
    add: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", icon: "text-emerald-500" },
    delete: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20", icon: "text-rose-500" },
    update: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", icon: "text-amber-500" },
    layout: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20", icon: "text-violet-500" },
    style: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500/20", icon: "text-sky-500" },
    section: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20", icon: "text-indigo-500" },
};

// Get action category
function getActionCategory(action: FormToolAction): keyof typeof ACTION_COLORS {
    switch (action.type) {
        case "addFields":
        case "addSection":
        case "addElementToRow":
            return "add";
        case "deleteFields":
        case "deleteSection":
            return "delete";
        case "updateField":
        case "updateSection":
            return "update";
        case "replaceForm":
        case "reorderFields":
        case "reorderSections":
            return "layout";
        case "updateFormStyle":
        case "updateDesignSettings":
        case "updateThankYouPage":
            return "style";
        default:
            return "section";
    }
}

// Action preview component
function ActionPreview({ action }: { action: FormToolAction }) {
    const category = getActionCategory(action);
    const colors = ACTION_COLORS[category];

    switch (action.type) {
        case "addFields":
            return (
                <div className="space-y-1.5">
                    {action.elements.map((el, i) => {
                        const attrs = el?.extraAttributes as Record<string, unknown>;
                        const displayLabel = attrs?.label || attrs?.title || (el.type === "RichText" ? "Rich Text Block" : el.type);
                        const Icon = FIELD_TYPE_ICONS[el.type] || LuType;
                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-2.5 text-xs ${colors.bg} border ${colors.border} px-3 py-2 rounded-xl`}
                            >
                                <div className={`w-6 h-6 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                    <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium ${colors.text} truncate`}>{String(displayLabel)}</div>
                                    <div className="text-[10px] opacity-60">{el.type}</div>
                                </div>
                                <LuPlus className={`w-4 h-4 ${colors.icon} shrink-0`} />
                            </div>
                        );
                    })}
                </div>
            );

        case "deleteFields":
            return (
                <div className={`flex items-center gap-3 ${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center`}>
                        <LuTrash2 className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>Remove {action.fieldIds.length} field{action.fieldIds.length > 1 ? 's' : ''}</div>
                        <div className="text-[10px] opacity-60">Fields will be deleted from the form</div>
                    </div>
                </div>
            );

        case "updateField":
            const updateKeys = Object.keys(action.updates?.extraAttributes || {});
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center`}>
                            <LuPenLine className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Update Field</div>
                            <div className="text-[10px] opacity-60">
                                {action.updates?.type && `Type → ${action.updates.type}`}
                                {updateKeys.length > 0 && (action.updates?.type ? ', ' : '') + updateKeys.join(', ')}
                            </div>
                        </div>
                    </div>
                </div>
            );

        case "addSection":
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center`}>
                            <LuLayers className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Add Section</div>
                            <div className="text-[10px] opacity-60">"{action.title}"</div>
                        </div>
                        <LuPlus className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    {action.elements && action.elements.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-emerald-500/10 space-y-1">
                            {action.elements.slice(0, 3).map((el, i) => {
                                const Icon = FIELD_TYPE_ICONS[el.type] || LuType;
                                const attrs = el?.extraAttributes as Record<string, unknown>;
                                return (
                                    <div key={i} className="flex items-center gap-2 text-[10px] opacity-70">
                                        <Icon className="w-3 h-3" />
                                        <span>{(attrs?.label || attrs?.title || el.type) as string}</span>
                                    </div>
                                );
                            })}
                            {action.elements.length > 3 && (
                                <div className="text-[10px] opacity-50">+{action.elements.length - 3} more fields</div>
                            )}
                        </div>
                    )}
                </div>
            );

        case "updateSection":
            return (
                <div className={`flex items-center gap-3 ${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center`}>
                        <LuLayers className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>Update Section</div>
                        <div className="text-[10px] opacity-60">
                            {Object.keys(action.updates || {}).join(', ')}
                        </div>
                    </div>
                </div>
            );

        case "deleteSection":
            return (
                <div className={`flex items-center gap-3 ${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center`}>
                        <LuLayers className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>Delete Section</div>
                        <div className="text-[10px] opacity-60">Section and all fields will be removed</div>
                    </div>
                </div>
            );

        case "reorderSections":
            return (
                <div className={`flex items-center gap-3 ${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center`}>
                        <LuShuffle className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>Reorder Sections</div>
                        <div className="text-[10px] opacity-60">{action.sectionIds.length} sections</div>
                    </div>
                </div>
            );

        case "addElementToRow":
            const elAttrs = action.element?.extraAttributes as Record<string, unknown>;
            const elLabel = String(elAttrs?.label || elAttrs?.title || action.element?.type || "field");
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center`}>
                            <LuColumns2 className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Side-by-Side Layout</div>
                            <div className="text-[10px] opacity-60">Add &quot;{elLabel}&quot; to the {action.position}</div>
                        </div>
                    </div>
                </div>
            );

        case "replaceForm":
            return (
                <div className={`${colors.bg} border ${colors.border} rounded-xl overflow-hidden`}>
                    <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center`}>
                            <LuLayoutGrid className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Replace Entire Form</div>
                            <div className="text-[10px] opacity-60">{action.sections?.length || 0} sections</div>
                        </div>
                    </div>
                    <div className="px-3 pb-2.5 space-y-1">
                        {action.sections?.slice(0, 3).map((section: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-white/50 dark:bg-black/20 px-2 py-1.5 rounded-lg">
                                <LuLayers className="w-3 h-3 opacity-60" />
                                <span className="truncate opacity-80">{section.title}</span>
                                <span className="text-[10px] opacity-50 ml-auto">{section.elements?.length || 0} fields</span>
                            </div>
                        ))}
                        {(action.sections?.length || 0) > 3 && (
                            <div className="text-[10px] opacity-50 px-2">+{action.sections!.length - 3} more sections</div>
                        )}
                    </div>
                </div>
            );

        case "reorderFields":
            return (
                <div className={`flex items-center gap-3 ${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className={`w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center`}>
                        <LuArrowUpDown className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium ${colors.text}`}>Reorder Fields</div>
                        <div className="text-[10px] opacity-60">{action.fieldIds.length} fields rearranged</div>
                    </div>
                </div>
            );

        case "updateFormStyle":
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center`}>
                            <LuLayoutGrid className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Change Form Style</div>
                            <div className="text-[10px] opacity-60">
                                Switch to <span className="font-medium">{action.style}</span> layout
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-sky-500/10">
                        <div className="flex gap-2">
                            <div className={`flex-1 px-2 py-1.5 rounded-lg text-center text-[10px] ${action.style === 'classic' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-medium' : 'bg-white/30 dark:bg-black/20 opacity-50'}`}>
                                Classic
                            </div>
                            <div className={`flex-1 px-2 py-1.5 rounded-lg text-center text-[10px] ${action.style === 'typeform' ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 font-medium' : 'bg-white/30 dark:bg-black/20 opacity-50'}`}>
                                Typeform
                            </div>
                        </div>
                    </div>
                </div>
            );

        case "updateDesignSettings":
            const designKeys = Object.keys(action.settings || {});
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center`}>
                            <LuPalette className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Update Design</div>
                            <div className="text-[10px] opacity-60">{designKeys.length} setting{designKeys.length > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-sky-500/10 flex flex-wrap gap-1.5">
                        {designKeys.slice(0, 4).map((key) => {
                            const value = (action.settings as Record<string, unknown>)?.[key];
                            const isColor = typeof value === 'string' && value.startsWith('#');
                            return (
                                <div key={key} className="flex items-center gap-1.5 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md text-[10px]">
                                    {isColor && (
                                        <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: value as string }} />
                                    )}
                                    <span className="opacity-70">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </div>
                            );
                        })}
                        {designKeys.length > 4 && (
                            <div className="text-[10px] opacity-50 px-2 py-1">+{designKeys.length - 4} more</div>
                        )}
                    </div>
                </div>
            );

        case "updateThankYouPage":
            const tySettings = action.settings as Record<string, unknown>;
            return (
                <div className={`${colors.bg} border ${colors.border} px-3 py-2.5 rounded-xl`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center`}>
                            <LuHeart className={`w-4 h-4 ${colors.icon}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${colors.text}`}>Thank You Page</div>
                            <div className="text-[10px] opacity-60">Customize confirmation</div>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-sky-500/10 space-y-1">
                        {tySettings?.title ? (
                            <div className="text-xs opacity-80">Title: &quot;{String(tySettings.title)}&quot;</div>
                        ) : null}
                        {tySettings?.description ? (
                            <div className="text-[10px] opacity-60 truncate">&quot;{String(tySettings.description)}&quot;</div>
                        ) : null}
                        {tySettings?.showConfetti !== undefined ? (
                            <div className="flex items-center gap-1.5 text-[10px]">
                                <span>🎉</span>
                                <span className="opacity-60">Confetti: {tySettings.showConfetti ? 'On' : 'Off'}</span>
                            </div>
                        ) : null}
                    </div>
                </div>
            );

        default:
            return null;
    }
}

export function AIChatSidebar() {
    const {
        messages,
        sendMessage,
        status,
        error,
        stop,
        isLoadingSession,
        applyMultipleActions,
        appliedMessageIds,
        markMessageApplied,
    } = useAIChat();

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && status === "ready") {
            sendMessage({ text: input });
            setInput("");
        }
    };

    // Extract ALL tool actions from parts
    const extractAllToolActions = (parts: any[]): FormToolAction[] => {
        const actions: FormToolAction[] = [];
        for (const part of parts) {
            // Field Operations
            if (part.type === "tool-addFields" && part.input?.elements) {
                actions.push({
                    type: "addFields",
                    elements: part.input.elements,
                    insertAfterFieldId: part.input.insertAfterFieldId,
                    sectionId: part.input.sectionId,
                });
            }
            if (part.type === "tool-deleteFields" && part.input?.fieldIds) {
                actions.push({ type: "deleteFields", fieldIds: part.input.fieldIds });
            }
            if (part.type === "tool-updateField" && part.input?.fieldId) {
                actions.push({ type: "updateField", fieldId: part.input.fieldId, updates: part.input.updates });
            }
            if (part.type === "tool-reorderFields" && part.input?.fieldIds) {
                actions.push({ type: "reorderFields", sectionId: part.input.sectionId, fieldIds: part.input.fieldIds });
            }
            // Section Operations
            if (part.type === "tool-addSection" && part.input?.title) {
                actions.push({
                    type: "addSection",
                    title: part.input.title,
                    description: part.input.description,
                    showTitle: part.input.showTitle,
                    insertAfterSectionId: part.input.insertAfterSectionId,
                    elements: part.input.elements,
                });
            }
            if (part.type === "tool-updateSection" && part.input?.sectionId) {
                actions.push({ type: "updateSection", sectionId: part.input.sectionId, updates: part.input.updates });
            }
            if (part.type === "tool-deleteSection" && part.input?.sectionId) {
                actions.push({ type: "deleteSection", sectionId: part.input.sectionId });
            }
            if (part.type === "tool-reorderSections" && part.input?.sectionIds) {
                actions.push({ type: "reorderSections", sectionIds: part.input.sectionIds });
            }
            // Layout Operations
            if (part.type === "tool-addElementToRow" && part.input?.targetElementId) {
                actions.push({
                    type: "addElementToRow",
                    sectionId: part.input.sectionId,
                    targetElementId: part.input.targetElementId,
                    position: part.input.position,
                    element: part.input.element,
                });
            }
            if (part.type === "tool-replaceForm" && part.input?.sections) {
                actions.push({ type: "replaceForm", sections: part.input.sections });
            }
            // Style & Design Operations
            if (part.type === "tool-updateFormStyle" && part.input?.style) {
                actions.push({ type: "updateFormStyle", style: part.input.style });
            }
            if (part.type === "tool-updateDesignSettings" && part.input?.settings) {
                actions.push({ type: "updateDesignSettings", settings: part.input.settings });
            }
            if (part.type === "tool-updateThankYouPage" && part.input?.settings) {
                actions.push({ type: "updateThankYouPage", settings: part.input.settings });
            }
        }
        return actions;
    };

    // Get action summary
    const getActionSummary = (actions: FormToolAction[]): string => {
        if (actions.length === 1) {
            const action = actions[0];
            switch (action.type) {
                case "addFields": return `Adding ${action.elements.length} field${action.elements.length > 1 ? 's' : ''}`;
                case "deleteFields": return `Removing ${action.fieldIds.length} field${action.fieldIds.length > 1 ? 's' : ''}`;
                case "updateField": return "Updating field";
                case "replaceForm": return `Building form with ${action.sections.length} section${action.sections.length > 1 ? 's' : ''}`;
                case "addSection": return `Adding section "${action.title}"`;
                case "updateSection": return "Updating section";
                case "deleteSection": return "Removing section";
                case "reorderFields": return "Reordering fields";
                case "reorderSections": return "Reordering sections";
                case "addElementToRow": return "Creating side-by-side layout";
                case "updateFormStyle": return `Switching to ${action.style} style`;
                case "updateDesignSettings": return "Updating design";
                case "updateThankYouPage": return "Customizing thank you page";
                default: return "Making changes";
            }
        }
        return `${actions.length} changes`;
    };

    // Apply all actions
    const handleApplyActions = async (actions: FormToolAction[], messageId: string) => {
        applyMultipleActions(actions);
        await markMessageApplied(messageId);
    };

    // Quick suggestions
    const suggestions = [
        { icon: LuFileText, text: "Create a contact form", color: "text-emerald-500" },
        { icon: LuWand, text: "Build a survey with ratings", color: "text-violet-500" },
        { icon: LuZap, text: "Make it look modern", color: "text-amber-500" },
    ];

    return (
        <div className="h-full bg-gradient-to-b from-base-100 to-base-200/30 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                {isLoadingSession ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-3">
                            <span className="loading loading-spinner loading-md text-primary"></span>
                            <span className="text-sm text-base-content/50">Loading chat...</span>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col h-full">
                        {/* Hero section */}
                        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
                                    <LuSparkles className="w-10 h-10 text-primary" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                                    <LuWand className="w-3.5 h-3.5 text-primary-content" />
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-base-content text-center mb-2">
                                AI Form Builder
                            </h3>
                            <p className="text-sm text-base-content/50 text-center max-w-[200px] leading-relaxed">
                                Describe your form in plain language and watch the magic happen
                            </p>
                        </div>

                        {/* Suggestions */}
                        <div className="px-4 pb-4">
                            <p className="text-[10px] uppercase tracking-widest text-base-content/30 font-semibold mb-3 px-1">
                                Try these
                            </p>
                            <div className="space-y-2">
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(suggestion.text);
                                            inputRef.current?.focus();
                                        }}
                                        className="group flex items-center gap-3 w-full text-left px-4 py-3 bg-base-100 hover:bg-base-200/80 border border-base-200 hover:border-base-300 rounded-2xl transition-all duration-200 hover:shadow-sm"
                                    >
                                        <div className={`w-8 h-8 rounded-xl bg-base-200 group-hover:bg-base-300 flex items-center justify-center transition-colors`}>
                                            <suggestion.icon className={`w-4 h-4 ${suggestion.color}`} />
                                        </div>
                                        <span className="text-sm text-base-content/70 group-hover:text-base-content transition-colors flex-1">
                                            {suggestion.text}
                                        </span>
                                        <LuArrowRight className="w-4 h-4 text-base-content/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {messages.map((message: any) => {
                            const toolActions = message.role === "assistant"
                                ? extractAllToolActions(message.parts || [])
                                : [];
                            const isApplied = appliedMessageIds.has(message.id);

                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[92%] ${
                                            message.role === "user"
                                                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-content rounded-2xl rounded-br-md shadow-md shadow-primary/20"
                                                : "bg-base-100 border border-base-200 rounded-2xl rounded-bl-md shadow-sm"
                                        }`}
                                    >
                                        {/* Text content */}
                                        <div className="px-4 py-3">
                                            {(message.parts || []).map((part: any, index: number) => {
                                                if (part.type === "text" && part.text?.trim()) {
                                                    return (
                                                        <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
                                                            {part.text}
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>

                                        {/* Tool actions */}
                                        {toolActions.length > 0 && (
                                            <div className="border-t border-base-200">
                                                {/* Actions header */}
                                                <div className="px-4 py-2 bg-base-200/30">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                                                            <LuSparkles className="w-3 h-3 text-primary" />
                                                        </div>
                                                        <span className="text-xs font-medium text-base-content/70">
                                                            {getActionSummary(toolActions)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action previews */}
                                                <div className="px-3 py-3 space-y-2">
                                                    {toolActions.map((action, i) => (
                                                        <ActionPreview key={i} action={action} />
                                                    ))}
                                                </div>

                                                {/* Apply button */}
                                                <div className="px-3 pb-3">
                                                    {isApplied ? (
                                                        <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                <LuCheck className="w-3 h-3 text-white" />
                                                            </div>
                                                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Applied successfully</span>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleApplyActions(toolActions, message.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-content rounded-xl font-medium text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 active:scale-[0.98]"
                                                        >
                                                            <LuCheck className="w-4 h-4" />
                                                            Apply Changes
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Streaming indicator */}
                        {(status === "submitted" || status === "streaming") && (
                            <div className="flex justify-start">
                                <div className="bg-base-100 border border-base-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <LuSparkles className="w-4 h-4 text-primary animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-base-content">
                                                {status === "submitted" ? "Thinking..." : "Creating your form..."}
                                            </span>
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error display */}
                        {error && (
                            <div className="mx-2 p-4 rounded-2xl bg-error/10 border border-error/20">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-error/20 flex items-center justify-center shrink-0">
                                        <LuMessageSquare className="w-4 h-4 text-error" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-error">Something went wrong</p>
                                        <p className="text-xs text-error/70 mt-0.5">Please try again or rephrase your request</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-base-200 bg-base-100/95 backdrop-blur-lg shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your form..."
                        className="w-full pl-4 pr-12 py-3 bg-base-200/50 border border-base-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-base-content/30"
                        disabled={status !== "ready"}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                        {status === "streaming" || status === "submitted" ? (
                            <button
                                type="button"
                                onClick={stop}
                                className="w-9 h-9 rounded-xl bg-error/10 hover:bg-error/20 flex items-center justify-center transition-colors"
                                title="Stop generating"
                            >
                                <LuSquare className="w-4 h-4 text-error" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    input.trim()
                                        ? "bg-primary text-primary-content shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                                        : "bg-base-300 text-base-content/30"
                                }`}
                                disabled={!input.trim() || status !== "ready"}
                            >
                                <LuSend className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
