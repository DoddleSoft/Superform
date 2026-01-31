"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIChat, FormToolAction } from "@/context/AIChatContext";
import { LuSend, LuX, LuCheck, LuPlus, LuPenLine, LuList, LuTrash2, LuSparkles, LuArrowRight, LuSquare } from "react-icons/lu";
import { GeneratedFormElement } from "@/lib/formElementSchema";

export function AIChatSidebar() {
    const {
        messages,
        sendMessage,
        status,
        error,
        stop,
        isLoadingSession,
        applyGeneratedForm,
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

    // Extract ALL tool actions from parts (AI may call multiple tools)
    const extractAllToolActions = (parts: any[]): FormToolAction[] => {
        const actions: FormToolAction[] = [];
        for (const part of parts) {
            if (part.type === "tool-addFields" && part.input?.elements) {
                actions.push({
                    type: "addFields",
                    elements: part.input.elements,
                    insertAfterFieldId: part.input.insertAfterFieldId,
                });
            }
            if (part.type === "tool-deleteFields" && part.input?.fieldIds) {
                actions.push({
                    type: "deleteFields",
                    fieldIds: part.input.fieldIds,
                });
            }
            if (part.type === "tool-updateField" && part.input?.fieldId) {
                actions.push({
                    type: "updateField",
                    fieldId: part.input.fieldId,
                    updates: part.input.updates,
                });
            }
            if (part.type === "tool-replaceForm" && part.input?.sections) {
                actions.push({
                    type: "replaceForm",
                    sections: part.input.sections,
                });
            }
            if (part.type === "tool-reorderFields" && part.input?.fieldIds) {
                actions.push({
                    type: "reorderFields",
                    sectionId: part.input.sectionId,
                    fieldIds: part.input.fieldIds,
                });
            }
        }
        return actions;
    };

    // Get human-readable description for all actions
    const getActionsDescription = (actions: FormToolAction[]): string => {
        return actions.map((action) => {
            switch (action.type) {
                case "addFields":
                    return `Add ${action.elements.length} field(s)`;
                case "deleteFields":
                    return `Delete ${action.fieldIds.length} field(s)`;
                case "updateField":
                    return `Update field`;
                case "replaceForm":
                    return `Replace with ${action.sections.length} section(s)`;
                case "reorderFields":
                    return `Reorder fields`;
                default:
                    return "Unknown action";
            }
        }).join(", ");
    };

    // Get icon for action type
    const getActionIcon = (action: FormToolAction) => {
        switch (action.type) {
            case "addFields":
                return <LuPlus className="w-3.5 h-3.5" />;
            case "deleteFields":
                return <LuTrash2 className="w-3.5 h-3.5" />;
            case "updateField":
                return <LuPenLine className="w-3.5 h-3.5" />;
            case "replaceForm":
                return <LuList className="w-3.5 h-3.5" />;
            case "reorderFields":
                return <LuList className="w-3.5 h-3.5" />;
            default:
                return <LuCheck className="w-3.5 h-3.5" />;
        }
    };

    // Apply all actions in sequence
    const handleApplyActions = async (actions: FormToolAction[], messageId: string) => {
        applyMultipleActions(actions);
        await markMessageApplied(messageId);
    };

    return (
        <div className="h-full bg-base-100 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingSession ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        {/* Empty State */}
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                            <LuSparkles className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-base-content text-center">AI Form Builder</h3>
                        <p className="text-sm text-base-content/60 text-center mt-1 mb-6">
                            Describe your form and I'll create it for you
                        </p>
                        
                        {/* Suggestions */}
                        <div className="w-full space-y-2">
                            <p className="text-[10px] uppercase tracking-wider text-base-content/40 font-medium px-1">
                                Try saying
                            </p>
                            {[
                                "Create a contact form",
                                "Build a job application form",
                                "Make a feedback survey",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                    className="group flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm bg-base-200/50 hover:bg-base-200 rounded-lg transition-colors"
                                >
                                    <LuArrowRight className="w-3.5 h-3.5 text-base-content/40 group-hover:text-primary transition-colors" />
                                    <span className="text-base-content/70 group-hover:text-base-content transition-colors">
                                        {suggestion}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message: any) => {
                        const toolActions = message.role === "assistant"
                            ? extractAllToolActions(message.parts || [])
                            : [];

                        return (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[90%] rounded-2xl px-4 py-2.5 ${
                                        message.role === "user"
                                            ? "bg-primary text-primary-content rounded-br-md"
                                            : "bg-base-200/70 rounded-bl-md"
                                    }`}
                                >
                                    {/* Render text parts */}
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

                                    {/* Render tool actions preview */}
                                    {toolActions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-base-content/10">
                                            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2 opacity-60">
                                                {getActionsDescription(toolActions)}
                                            </div>
                                            
                                            {/* Show preview for each action */}
                                            <div className="space-y-1.5 mb-3">
                                                {toolActions.map((action, actionIndex) => (
                                                    <div key={actionIndex} className="space-y-1">
                                                        {/* Add fields preview */}
                                                        {action.type === "addFields" && (
                                                            <div className="space-y-1">
                                                                {action.elements
                                                                    .map((el, i) => {
                                                                        // Get display label based on field type
                                                                        const attrs = el?.extraAttributes as Record<string, unknown>;
                                                                        const displayLabel = attrs?.label || attrs?.title || (el.type === "RichText" ? "Rich Text Block" : el.type);
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className="flex items-center gap-2 text-xs bg-success/10 px-2.5 py-1.5 rounded-lg"
                                                                            >
                                                                                <LuPlus className="w-3 h-3 text-success shrink-0" />
                                                                                <span className="badge badge-xs bg-success/20 text-success border-0">
                                                                                    {el.type}
                                                                                </span>
                                                                                <span className="truncate text-success/80">
                                                                                    {String(displayLabel)}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        )}

                                                        {/* Delete fields preview */}
                                                        {action.type === "deleteFields" && (
                                                            <div className="flex items-center gap-2 text-xs bg-error/10 px-2.5 py-1.5 rounded-lg text-error">
                                                                <LuTrash2 className="w-3 h-3 shrink-0" />
                                                                <span>{action.fieldIds.length} field(s) will be removed</span>
                                                            </div>
                                                        )}

                                                        {/* Update field preview */}
                                                        {action.type === "updateField" && action.updates && (
                                                            <div className="flex items-center gap-2 text-xs bg-warning/10 px-2.5 py-1.5 rounded-lg text-warning">
                                                                <LuPenLine className="w-3 h-3 shrink-0" />
                                                                <span>
                                                                    Updating: {Object.keys(action.updates.extraAttributes || {}).join(", ")}
                                                                    {action.updates.type && ` (type → ${action.updates.type})`}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Replace form preview */}
                                                        {action.type === "replaceForm" && (
                                                            <div className="space-y-1">
                                                                {action.sections?.map((section: any, i: number) => (
                                                                    <div
                                                                        key={i}
                                                                        className="flex items-center gap-2 text-xs bg-info/10 px-2.5 py-1.5 rounded-lg"
                                                                    >
                                                                        <LuList className="w-3 h-3 text-info shrink-0" />
                                                                        <span className="badge badge-xs bg-info/20 text-info border-0">
                                                                            Section
                                                                        </span>
                                                                        <span className="truncate text-info/80">
                                                                            {section.title} ({section.elements?.length || 0} fields)
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Reorder preview */}
                                                        {action.type === "reorderFields" && (
                                                            <div className="flex items-center gap-2 text-xs bg-base-300/50 px-2.5 py-1.5 rounded-lg">
                                                                <LuList className="w-3 h-3 shrink-0" />
                                                                <span>Reordering {action.fieldIds.length} field(s)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {appliedMessageIds.has(message.id) ? (
                                                <button
                                                    disabled
                                                    className="btn btn-sm w-full gap-2 bg-success/10 text-success border-success/20 hover:bg-success/10"
                                                >
                                                    <LuCheck className="w-4 h-4" />
                                                    Applied
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApplyActions(toolActions, message.id)}
                                                    className="btn btn-primary btn-sm w-full gap-2"
                                                >
                                                    <LuCheck className="w-4 h-4" />
                                                    Apply Changes
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Streaming indicator */}
                {(status === "submitted" || status === "streaming") && (
                    <div className="flex justify-start">
                        <div className="bg-base-200/70 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="loading loading-dots loading-sm text-primary"></span>
                                <span className="text-sm text-base-content/60">
                                    {status === "submitted" ? "Thinking..." : "Generating..."}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="mx-2 p-3 rounded-lg bg-error/10 border border-error/20">
                        <p className="text-sm text-error">Something went wrong. Please try again.</p>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-base-200 bg-base-100/80 backdrop-blur shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your form..."
                        className="input input-bordered input-sm flex-1 focus:input-primary"
                        disabled={status !== "ready"}
                    />
                    {status === "streaming" || status === "submitted" ? (
                        <button
                            type="button"
                            onClick={stop}
                            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-error"
                            title="Stop generating"
                        >
                            <LuSquare className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm btn-square"
                            disabled={!input.trim() || status !== "ready"}
                        >
                            <LuSend className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
