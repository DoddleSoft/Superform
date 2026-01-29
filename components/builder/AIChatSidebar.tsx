"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIChat } from "@/context/AIChatContext";
import { FiSend, FiX, FiTrash2, FiCheck, FiLoader } from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import { GeneratedFormElement } from "@/lib/formElementSchema";

export function AIChatSidebar() {
    const {
        isSidebarOpen,
        closeSidebar,
        messages,
        sendMessage,
        status,
        error,
        stop,
        isLoadingSession,
        clearChat,
        applyGeneratedForm,
    } = useAIChat();

    const [input, setInput] = useState("");
    const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when sidebar opens
    useEffect(() => {
        if (isSidebarOpen) {
            inputRef.current?.focus();
        }
    }, [isSidebarOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && status === "ready") {
            sendMessage({ text: input });
            setInput("");
        }
    };

    const handleClearChat = async () => {
        if (confirm("Are you sure you want to clear the chat history?")) {
            await clearChat();
        }
    };

    // Extract generated elements from tool parts
    // Tool calls come through with type "tool-generateForm"
    // The input contains the generated form elements array
    const extractGeneratedElements = (parts: any[]): GeneratedFormElement[] | null => {
        for (const part of parts) {
            // Check for tool-generateForm type
            if (part.type === "tool-generateForm") {
                // The input is now an object with 'elements' array (matching our schema)
                if (part.input && Array.isArray(part.input.elements)) {
                    return part.input.elements as GeneratedFormElement[];
                }
            }
        }
        return null;
    };

    if (!isSidebarOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-base-100 border-l border-base-300 shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/50">
                <div className="flex items-center gap-2">
                    <BsStars className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">AI Form Builder</h2>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Clear chat history"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={closeSidebar}
                        className="btn btn-ghost btn-sm btn-square"
                        title="Close"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>
            </div>

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
                        const generatedElements = message.role === "assistant"
                            ? extractGeneratedElements(message.parts || [])
                            : null;

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
                                        if (part.type === "text") {
                                            return (
                                                <p key={index} className="whitespace-pre-wrap text-sm">
                                                    {part.text}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Render generated form preview */}
                                    {generatedElements && generatedElements.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-base-300">
                                            <div className="text-xs font-medium mb-2 opacity-70">
                                                Generated {generatedElements.length} field(s):
                                            </div>
                                            <div className="space-y-1 mb-3">
                                                {generatedElements
                                                    .filter((el) => el?.extraAttributes?.label)
                                                    .map((el, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-2 text-xs bg-base-100/50 px-2 py-1 rounded"
                                                        >
                                                            <span className="badge badge-xs badge-outline">
                                                                {el.type}
                                                            </span>
                                                            <span className="truncate">
                                                                {el.extraAttributes.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                            {appliedMessageIds.has(message.id) ? (
                                                <button
                                                    disabled
                                                    className="btn btn-success btn-sm w-full gap-2"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                    Added to Form
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        applyGeneratedForm(generatedElements);
                                                        setAppliedMessageIds((prev) => new Set(prev).add(message.id));
                                                    }}
                                                    className="btn btn-primary btn-sm w-full gap-2"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                    Add to Form
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

// Toggle button component for the header
export function AIChatToggleButton() {
    const { toggleSidebar, isSidebarOpen } = useAIChat();

    return (
        <button
            onClick={toggleSidebar}
            className={`btn btn-ghost gap-2 ${isSidebarOpen ? "btn-active" : ""}`}
            title="AI Form Builder"
        >
            <BsStars className="w-5 h-5" />
            <span className="hidden sm:inline">AI Builder</span>
        </button>
    );
}
