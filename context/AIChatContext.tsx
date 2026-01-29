"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
    getOrCreateChatSession,
    getChatMessages,
    saveChatMessage,
    clearChatHistory,
    ChatSession,
} from "@/actions/chat";
import { useFormBuilder } from "./FormBuilderContext";
import { FormElementType, FormElementInstance } from "@/types/form-builder";
import { GeneratedFormElement } from "@/lib/formElementSchema";

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

    // Form generation
    applyGeneratedForm: (elements: GeneratedFormElement[]) => void;
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

    const {
        messages,
        sendMessage: originalSendMessage,
        status,
        error,
        stop,
        setMessages,
    } = useChat({
        id: `form-chat-${formId}`,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: { formId },
        }),
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

                await saveChatMessage(
                    session.id,
                    "assistant",
                    textContent,
                    toolParts.length > 0 ? toolParts : undefined
                );
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
                    const uiMessages = savedMessages.map((msg) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        parts: [{ type: "text" as const, text: msg.content }],
                        createdAt: msg.createdAt,
                    }));
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
    };

    return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}
