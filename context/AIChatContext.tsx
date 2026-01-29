"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import {
    getOrCreateChatSession,
    getChatMessages,
    saveChatMessage,
    clearChatHistory,
    markActionsApplied,
    ChatSession,
} from "@/actions/chat";
import { useFormBuilder } from "./FormBuilderContext";
import { FormElementType, FormElementInstance } from "@/types/form-builder";
import {
    GeneratedFormElement,
    DeleteFieldsInput,
    UpdateFieldInput,
    ReplaceFormInput,
    ReorderFieldsInput,
} from "@/lib/formElementSchema";

// Tool action types
export type FormToolAction =
    | { type: "addFields"; elements: GeneratedFormElement[]; insertAfterFieldId?: string }
    | { type: "deleteFields"; fieldIds: string[] }
    | { type: "updateField"; fieldId: string; updates: UpdateFieldInput["updates"] }
    | { type: "replaceForm"; elements: ReplaceFormInput["elements"] }
    | { type: "reorderFields"; fieldIds: string[] };

interface AIChatContextType {
    // Sidebar visibility
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    openSidebar: () => void;
    closeSidebar: () => void;

    // Chat state from useChat
    messages: any[];
    sendMessage: (options: { text: string }) => void;
    status: "ready" | "submitted" | "streaming" | "error";
    error: Error | undefined;
    stop: () => void;
    setMessages: (messages: any[]) => void;

    // Session management
    session: ChatSession | null;
    isLoadingSession: boolean;
    clearChat: () => Promise<void>;

    // Form operations
    applyGeneratedForm: (elements: GeneratedFormElement[]) => void;
    applyFormAction: (action: FormToolAction, existingElements?: FormElementInstance[]) => FormElementInstance[] | undefined;
    applyMultipleActions: (actions: FormToolAction[]) => void;
    
    // Applied state
    appliedMessageIds: Set<string>;
    markMessageApplied: (messageId: string) => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | null>(null);

export function useAIChat() {
    const context = useContext(AIChatContext);
    if (!context) {
        throw new Error("useAIChat must be used within an AIChatProvider");
    }
    return context;
}

interface AIChatProviderProps {
    children: ReactNode;
    formId: string;
}

export function AIChatProvider({ children, formId }: AIChatProviderProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [session, setSession] = useState<ChatSession | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [appliedMessageIds, setAppliedMessageIds] = useState<Set<string>>(new Set());

    const { setElements, elements: currentElements } = useFormBuilder();

    // Initialize chat session
    useEffect(() => {
        async function initSession() {
            try {
                setIsLoadingSession(true);
                const chatSession = await getOrCreateChatSession(formId);
                setSession(chatSession);
                setIsSessionReady(true);
            } catch (error) {
                console.error("Failed to initialize chat session:", error);
            } finally {
                setIsLoadingSession(false);
            }
        }

        initSession();
    }, [formId]);

    // Create a ref to hold the current elements for use in the fetch function
    const currentElementsRef = useRef(currentElements);
    useEffect(() => {
        currentElementsRef.current = currentElements;
    }, [currentElements]);

    // Create a custom transport that includes the current form state
    const transport = useRef(
        new DefaultChatTransport({
            api: "/api/chat",
            body: { formId },
            fetch: async (url, options) => {
                // Parse the original body and add current form state
                const originalBody = JSON.parse(options?.body as string || "{}");
                const enhancedBody = {
                    ...originalBody,
                    formId,
                    currentFormState: currentElementsRef.current.map((el) => ({
                        id: el.id,
                        type: el.type,
                        extraAttributes: el.extraAttributes,
                    })),
                };
                return fetch(url, {
                    ...options,
                    body: JSON.stringify(enhancedBody),
                });
            },
        })
    );

    // Track mapping of client IDs to database IDs for assistant messages
    const messageIdMap = useRef<Map<string, string>>(new Map());

    const {
        messages,
        sendMessage: originalSendMessage,
        status,
        error,
        stop,
        setMessages,
    } = useChat({
        id: `form-chat-${formId}`,
        transport: transport.current,
        onFinish: async ({ message }: { message: any }) => {
            // Save assistant message to database
            if (session && message.role === "assistant") {
                const textContent = message.parts
                    ?.filter((p: any) => p.type === "text")
                    .map((p: any) => p.text)
                    .join("") || "";

                // Extract tool invocations if any
                const toolParts = message.parts?.filter(
                    (p: any) => typeof p.type === "string" && p.type.startsWith("tool-")
                ) || [];

                const savedMessage = await saveChatMessage(
                    session.id,
                    "assistant",
                    textContent,
                    toolParts.length > 0 ? toolParts : undefined
                );
                
                // Store mapping from client ID to database ID
                messageIdMap.current.set(message.id, savedMessage.id);
            }
        },
    });

    // Load existing messages when session is ready
    useEffect(() => {
        async function loadMessages() {
            if (!session || !isSessionReady) return;
            
            try {
                const savedMessages = await getChatMessages(session.id);
                if (savedMessages.length > 0) {
                    // Track which messages have already been applied
                    const appliedIds = new Set<string>();
                    
                    const uiMessages = savedMessages.map((msg) => {
                        // Build parts array
                        const parts: any[] = [];
                        
                        // Add text part if there's content
                        if (msg.content) {
                            parts.push({ type: "text" as const, text: msg.content });
                        }
                        
                        // Add tool invocation parts if they exist
                        if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
                            for (const toolPart of msg.toolInvocations) {
                                parts.push(toolPart);
                            }
                        }
                        
                        // Track applied messages
                        if (msg.actionsApplied) {
                            appliedIds.add(msg.id);
                        }
                        
                        return {
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            parts,
                            createdAt: msg.createdAt,
                        };
                    });
                    
                    setAppliedMessageIds(appliedIds);
                    setMessages(uiMessages);
                }
            } catch (error) {
                console.error("Failed to load chat messages:", error);
            }
        }

        loadMessages();
    }, [session, isSessionReady, setMessages]);

    // Custom sendMessage that saves user message first
    const sendMessage = useCallback(
        async (options: { text: string }) => {
            if (session) {
                await saveChatMessage(session.id, "user", options.text);
            }
            originalSendMessage(options);
        },
        [session, originalSendMessage]
    );

    // Sidebar controls
    const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);
    const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

    // Clear chat history
    const clearChat = useCallback(async () => {
        try {
            await clearChatHistory(formId);
            setMessages([]);
            // Reinitialize session
            const newSession = await getOrCreateChatSession(formId);
            setSession(newSession);
        } catch (error) {
            console.error("Failed to clear chat history:", error);
        }
    }, [formId, setMessages]);

    // Apply generated form elements to canvas
    const applyGeneratedForm = useCallback(
        (elements: GeneratedFormElement[]) => {
            const newElements: FormElementInstance[] = elements.map((el) => ({
                id: crypto.randomUUID(),
                type: el.type as FormElementType,
                extraAttributes: el.extraAttributes,
            }));

            // Add to existing elements
            setElements([...currentElements, ...newElements]);
        },
        [currentElements, setElements]
    );

    // Apply any form action (add, delete, update, replace, reorder)
    const applyFormAction = useCallback(
        (action: FormToolAction, existingElements?: FormElementInstance[]) => {
            // Use provided elements or current elements
            const workingElements = existingElements || currentElements;
            
            switch (action.type) {
                case "addFields": {
                    const newElements: FormElementInstance[] = action.elements.map((el) => ({
                        id: crypto.randomUUID(),
                        type: el.type as FormElementType,
                        extraAttributes: el.extraAttributes,
                    }));
                    
                    // If insertAfterFieldId is specified, insert at that position
                    if (action.insertAfterFieldId) {
                        const insertIndex = workingElements.findIndex(
                            (el) => el.id === action.insertAfterFieldId
                        );
                        if (insertIndex !== -1) {
                            const before = workingElements.slice(0, insertIndex + 1);
                            const after = workingElements.slice(insertIndex + 1);
                            const result = [...before, ...newElements, ...after];
                            if (!existingElements) setElements(result);
                            return result;
                        }
                    }
                    // Default: append to end
                    const result = [...workingElements, ...newElements];
                    if (!existingElements) setElements(result);
                    return result;
                }
                case "deleteFields": {
                    const filteredElements = workingElements.filter(
                        (el) => !action.fieldIds.includes(el.id)
                    );
                    if (!existingElements) setElements(filteredElements);
                    return filteredElements;
                }
                case "updateField": {
                    const updatedElements = workingElements.map((el) => {
                        if (el.id === action.fieldId) {
                            return {
                                ...el,
                                type: action.updates.type
                                    ? (action.updates.type as FormElementType)
                                    : el.type,
                                extraAttributes: {
                                    ...el.extraAttributes,
                                    ...action.updates.extraAttributes,
                                },
                            };
                        }
                        return el;
                    });
                    if (!existingElements) setElements(updatedElements);
                    return updatedElements;
                }
                case "replaceForm": {
                    const newElements: FormElementInstance[] = action.elements.map((el) => ({
                        id: el.id || crypto.randomUUID(),
                        type: el.type as FormElementType,
                        extraAttributes: el.extraAttributes,
                    }));
                    if (!existingElements) setElements(newElements);
                    return newElements;
                }
                case "reorderFields": {
                    const reorderedElements: FormElementInstance[] = [];
                    for (const fieldId of action.fieldIds) {
                        const element = workingElements.find((el) => el.id === fieldId);
                        if (element) {
                            reorderedElements.push(element);
                        }
                    }
                    // Add any elements not in the reorder list at the end
                    for (const el of workingElements) {
                        if (!action.fieldIds.includes(el.id)) {
                            reorderedElements.push(el);
                        }
                    }
                    if (!existingElements) setElements(reorderedElements);
                    return reorderedElements;
                }
                default:
                    return workingElements;
            }
        },
        [currentElements, setElements]
    );

    // Apply multiple actions in sequence
    const applyMultipleActions = useCallback(
        (actions: FormToolAction[]) => {
            let elements = currentElements;
            for (const action of actions) {
                elements = applyFormAction(action, elements) || elements;
            }
            setElements(elements);
        },
        [currentElements, applyFormAction, setElements]
    );

    // Mark a message's actions as applied (persists to database)
    const markMessageApplied = useCallback(
        async (messageId: string) => {
            // Use the database ID if we have a mapping, otherwise use the provided ID
            const dbMessageId = messageIdMap.current.get(messageId) || messageId;
            console.log("markMessageApplied called with messageId:", messageId, "dbMessageId:", dbMessageId);
            
            setAppliedMessageIds((prev) => new Set(prev).add(messageId));
            try {
                await markActionsApplied(dbMessageId);
                console.log("markActionsApplied succeeded for dbMessageId:", dbMessageId);
            } catch (error) {
                console.error("Failed to mark actions as applied:", error);
            }
        },
        []
    );

    const value: AIChatContextType = {
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        messages,
        sendMessage,
        status,
        error,
        stop,
        setMessages,
        session,
        isLoadingSession,
        clearChat,
        applyGeneratedForm,
        applyFormAction,
        applyMultipleActions,
        appliedMessageIds,
        markMessageApplied,
    };

    return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}
