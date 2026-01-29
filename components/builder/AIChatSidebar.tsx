"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIChat, FormToolAction } from "@/context/AIChatContext";
import { FiSend, FiX, FiCheck, FiPlus, FiEdit2, FiList } from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import { MdDeleteOutline } from "react-icons/md";
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
                return <FiPlus className="w-4 h-4" />;
            case "deleteFields":
                return <MdDeleteOutline className="w-4 h-4" />;
            case "updateField":
                return <FiEdit2 className="w-4 h-4" />;
            case "replaceForm":
                return <FiList className="w-4 h-4" />;
            case "reorderFields":
                return <FiList className="w-4 h-4" />;
            default:
                return <FiCheck className="w-4 h-4" />;
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingSession ? (
                    <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-base-content/60">
                        <BsStars className="w-12 h-12 mx-auto mb-4 text-primary/40" />
                        <p className="font-medium">Start building your form</p>
                        <p className="text-sm mt-2">
                            Describe the form you want to create and I'll generate it for you.
                        </p>
                        <div className="mt-4 space-y-2">
                            <p className="text-xs text-base-content/40">Try saying:</p>
                            <div className="space-y-1">
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
                                        className="block w-full text-left px-3 py-2 text-sm bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
                                    >
                                        "{suggestion}"
                                    </button>
                                ))}
                            </div>
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
                                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                                        message.role === "user"
                                            ? "bg-primary text-primary-content rounded-br-md"
                                            : "bg-base-200 rounded-bl-md"
                                    }`}
                                >
                                    {/* Render text parts */}
                                    {(message.parts || []).map((part: any, index: number) => {
                                        if (part.type === "text" && part.text?.trim()) {
                                            return (
                                                <p key={index} className="whitespace-pre-wrap text-sm">
                                                    {part.text}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Render tool actions preview */}
                                    {toolActions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-base-300">
                                            <div className="text-xs font-medium mb-2 opacity-70">
                                                {getActionsDescription(toolActions)}
                                            </div>
                                            
                                            {/* Show preview for each action */}
                                            <div className="space-y-2 mb-3">
                                                {toolActions.map((action, actionIndex) => (
                                                    <div key={actionIndex} className="space-y-1">
                                                        {/* Add fields preview */}
                                                        {action.type === "addFields" && (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1 text-xs text-success">
                                                                    <FiPlus className="w-3 h-3" />
                                                                    <span>Adding:</span>
                                                                </div>
                                                                {action.elements
                                                                    .filter((el) => el?.extraAttributes?.label)
                                                                    .map((el, i) => (
                                                                        <div
                                                                            key={i}
                                                                            className="flex items-center gap-2 text-xs bg-success/10 px-2 py-1 rounded"
                                                                        >
                                                                            <span className="badge badge-xs badge-outline badge-success">
                                                                                {el.type}
                                                                            </span>
                                                                            <span className="truncate">
                                                                                {el.extraAttributes.label}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}

                                                        {/* Delete fields preview */}
                                                        {action.type === "deleteFields" && (
                                                            <div className="text-xs text-error flex items-center gap-1">
                                                                <MdDeleteOutline className="w-3 h-3" />
                                                                <span>{action.fieldIds.length} field(s) will be removed</span>
                                                            </div>
                                                        )}

                                                        {/* Update field preview */}
                                                        {action.type === "updateField" && action.updates && (
                                                            <div className="text-xs bg-warning/10 px-2 py-1 rounded flex items-center gap-1">
                                                                <FiEdit2 className="w-3 h-3" />
                                                                <span>
                                                                    Updating: {Object.keys(action.updates.extraAttributes || {}).join(", ")}
                                                                    {action.updates.type && ` (type → ${action.updates.type})`}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Replace form preview */}
                                                        {action.type === "replaceForm" && (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1 text-xs text-info">
                                                                    <FiList className="w-3 h-3" />
                                                                    <span>Replacing form with {action.sections?.length || 0} section(s)</span>
                                                                </div>
                                                                {action.sections?.map((section: any, i: number) => (
                                                                    <div
                                                                        key={i}
                                                                        className="flex items-center gap-2 text-xs bg-info/10 px-2 py-1 rounded"
                                                                    >
                                                                        <span className="badge badge-xs badge-outline badge-info">
                                                                            Section
                                                                        </span>
                                                                        <span className="truncate">
                                                                            {section.title} ({section.elements?.length || 0} elements)
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Reorder preview */}
                                                        {action.type === "reorderFields" && (
                                                            <div className="text-xs bg-base-100/50 px-2 py-1 rounded flex items-center gap-1">
                                                                <FiList className="w-3 h-3" />
                                                                <span>Reordering {action.fieldIds.length} field(s)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {appliedMessageIds.has(message.id) ? (
                                                <button
                                                    disabled
                                                    className="btn btn-success btn-sm w-full gap-2"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                    Applied
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApplyActions(toolActions, message.id)}
                                                    className="btn btn-primary btn-sm w-full gap-2"
                                                >
                                                    <FiCheck className="w-4 h-4" />
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
                        <div className="bg-base-200 rounded-2xl rounded-bl-md px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="loading loading-dots loading-sm"></span>
                                <span className="text-sm text-base-content/60">
                                    {status === "submitted" ? "Thinking..." : "Generating..."}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div className="alert alert-error">
                        <span className="text-sm">Something went wrong. Please try again.</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-base-300 bg-base-100">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your form..."
                        className="input input-bordered flex-1"
                        disabled={status !== "ready"}
                    />
                    {status === "streaming" || status === "submitted" ? (
                        <button
                            type="button"
                            onClick={stop}
                            className="btn btn-ghost btn-square"
                            title="Stop generating"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary btn-square"
                            disabled={!input.trim() || status !== "ready"}
                        >
                            <FiSend className="w-5 h-5" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
