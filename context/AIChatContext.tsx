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
    saveAIThought,
    ChatSession,
} from "@/actions/chat";
import { useFormBuilder } from "./FormBuilderContext";
import { FormElementType, FormElementInstance, FormSection, createSection, FormRow, createRow, getSectionElements, FormStyle, FormDesignSettings, ThankYouPageSettings } from "@/types/form-builder";
import {
    GeneratedFormElement,
    DeleteFieldsInput,
    UpdateFieldInput,
    ReplaceFormInput,
    ReorderFieldsInput,
    GeneratedSectionWithId,
    AddSectionInput,
    UpdateSectionInput,
    DeleteSectionInput,
    AddElementsToRowInput,
    UpdateFormStyleInput,
    UpdateDesignSettingsInput,
    UpdateThankYouPageInput,
} from "@/lib/formElementSchema";

// Tool action types
export type FormToolAction =
    | { type: "addFields"; elements: GeneratedFormElement[]; insertAfterFieldId?: string; sectionId?: string }
    | { type: "deleteFields"; fieldIds: string[] }
    | { type: "updateField"; fieldId: string; updates: UpdateFieldInput["updates"] }
    | { type: "replaceForm"; sections: GeneratedSectionWithId[] }
    | { type: "reorderFields"; sectionId: string; fieldIds: string[] }
    | { type: "addSection"; title: string; description?: string; showTitle?: boolean; insertAfterSectionId?: string; elements?: GeneratedFormElement[] }
    | { type: "updateSection"; sectionId: string; updates: { title?: string; description?: string; showTitle?: boolean } }
    | { type: "deleteSection"; sectionId: string }
    | { type: "reorderSections"; sectionIds: string[] }
    | { type: "addElementToRow"; sectionId: string; targetElementId: string; position: "left" | "right"; element: GeneratedFormElement }
    | { type: "updateFormStyle"; style: FormStyle }
    | { type: "updateDesignSettings"; settings: Partial<FormDesignSettings> }
    | { type: "updateThankYouPage"; settings: Partial<ThankYouPageSettings> };

// Workflow step types for agentic behavior
export type WorkflowStep = "structure" | "style" | "design" | "thankYou" | "complete";

interface AIChatContextType {
    // Sidebar visibility
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    openSidebar: () => void;
    closeSidebar: () => void;

    // Chat state from useChat
    messages: any[];
    sendMessage: (options: { text: string }) => void;
    continueWorkflow: (completedStep: WorkflowStep) => void;
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
    applyFormAction: (action: FormToolAction, existingSections?: FormSection[]) => FormSection[] | undefined;
    applyMultipleActions: (actions: FormToolAction[]) => void;
    
    // Applied state
    appliedMessageIds: Set<string>;
    markMessageApplied: (messageId: string) => Promise<void>;
    
    // Agentic workflow
    denyChanges: (messageId: string, actions: FormToolAction[]) => void;
    currentWorkflowStep: WorkflowStep;
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
    const [currentWorkflowStep, setCurrentWorkflowStep] = useState<WorkflowStep>("structure");

    const { 
        setSections, 
        sections: currentSections, 
        currentSectionId, 
        selectedElement, 
        setSelectedElement,
        addSection: addSectionToForm,
        updateSection: updateSectionInForm,
        removeSection: removeSectionFromForm,
        reorderSections: reorderSectionsInForm,
        addElementToRow: addElementToRowInForm,
        formStyle,
        setFormStyle,
        designSettings,
        setDesignSettings,
        thankYouPage,
        setThankYouPage,
        selectedSection,
        setSelectedSection,
    } = useFormBuilder();

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

    // Create refs for use in fetch function
    const currentSectionsRef = useRef(currentSections);
    const formStyleRef = useRef(formStyle);
    const currentWorkflowStepRef = useRef(currentWorkflowStep);
    
    useEffect(() => {
        currentSectionsRef.current = currentSections;
    }, [currentSections]);
    
    useEffect(() => {
        formStyleRef.current = formStyle;
    }, [formStyle]);
    
    useEffect(() => {
        currentWorkflowStepRef.current = currentWorkflowStep;
    }, [currentWorkflowStep]);

    // Create a custom transport that includes the current form state
    const transport = useRef(
        new DefaultChatTransport({
            api: "/api/chat",
            body: { formId },
            fetch: async (url, options) => {
                const originalBody = JSON.parse(options?.body as string || "{}");
                
                // Determine pending step based on current workflow
                let pendingStep: "style" | "design" | "thankYou" | undefined;
                const step = currentWorkflowStepRef.current;
                if (step === "style") pendingStep = "style";
                else if (step === "design") pendingStep = "design";
                else if (step === "thankYou") pendingStep = "thankYou";
                
                const enhancedBody = {
                    ...originalBody,
                    formId,
                    currentFormState: currentSectionsRef.current.map((section) => ({
                        id: section.id,
                        title: section.title,
                        description: section.description,
                        showTitle: section.showTitle,
                        elements: section.rows.flatMap((row) => 
                            row.elements.map((el, elIndex) => ({
                                id: el.id,
                                type: el.type,
                                extraAttributes: el.extraAttributes,
                                rowId: row.id,
                                rowPosition: elIndex,
                            }))
                        ),
                    })),
                    workflowContext: pendingStep ? {
                        pendingStep,
                        formStyle: formStyleRef.current,
                    } : undefined,
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
                
                // Save reasoning/thoughts to database for future reference
                const reasoningParts = message.parts?.filter(
                    (p: any) => p.type === "reasoning" && p.text?.trim()
                ) || [];
                
                if (reasoningParts.length > 0) {
                    const thoughtContent = reasoningParts
                        .map((p: any) => p.text)
                        .join("\n");
                    
                    // Determine task context from tool calls
                    let taskContext = "general";
                    if (toolParts.some((p: any) => p.type === "tool-replaceForm")) {
                        taskContext = "build_form_structure";
                    } else if (toolParts.some((p: any) => p.type === "tool-updateFormStyle")) {
                        taskContext = "apply_style";
                    } else if (toolParts.some((p: any) => p.type === "tool-updateDesignSettings")) {
                        taskContext = "apply_design";
                    } else if (toolParts.some((p: any) => p.type === "tool-updateThankYouPage")) {
                        taskContext = "customize_thank_you";
                    } else if (toolParts.some((p: any) => p.type?.includes("Field") || p.type?.includes("Section"))) {
                        taskContext = "modify_form";
                    }
                    
                    await saveAIThought(session.id, savedMessage.id, thoughtContent, taskContext);
                }
            }
        },
    });

    // Track status ref for use in continuations
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // Load existing messages when session is ready
    useEffect(() => {
        let isMounted = true;
        
        async function loadMessages() {
            if (!session || !isSessionReady) return;
            
            try {
                const savedMessages = await getChatMessages(session.id);
                if (!isMounted) return;
                
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
        
        return () => {
            isMounted = false;
        };
    }, [session?.id, isSessionReady, setMessages]);

    // Custom sendMessage that saves user message first (for user-initiated messages)
    const sendMessage = useCallback(
        async (options: { text: string }) => {
            if (session) {
                await saveChatMessage(session.id, "user", options.text);
            }
            // Reset workflow when user starts a new conversation topic
            if (!options.text.toLowerCase().includes("continue")) {
                setCurrentWorkflowStep("structure");
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
            setCurrentWorkflowStep("structure");
            setAppliedMessageIds(new Set());
            // Reinitialize session
            const newSession = await getOrCreateChatSession(formId);
            setSession(newSession);
        } catch (error) {
            console.error("Failed to clear chat history:", error);
        }
    }, [formId, setMessages]);

    // Apply generated form elements to canvas (add to current section)
    const applyGeneratedForm = useCallback(
        (elements: GeneratedFormElement[]) => {
            const newElements: FormElementInstance[] = elements.map((el) => ({
                id: crypto.randomUUID(),
                type: el.type as FormElementType,
                extraAttributes: el.extraAttributes,
            }));

            // Convert elements to rows (one element per row)
            const newRows: FormRow[] = newElements.map((el) => createRow(crypto.randomUUID(), el));

            // Add to current section (or first section if no current)
            const targetSectionId = currentSectionId ?? currentSections[0]?.id;
            if (!targetSectionId) {
                // Create a default section if none exists
                const newSection = createSection(crypto.randomUUID(), "Section 1");
                newSection.rows = newRows;
                setSections([newSection]);
                return;
            }

            // Add rows to the target section
            const updatedSections = currentSections.map((section) => {
                if (section.id === targetSectionId) {
                    return {
                        ...section,
                        rows: [...section.rows, ...newRows],
                    };
                }
                return section;
            });
            setSections(updatedSections);
        },
        [currentSections, currentSectionId, setSections]
    );

    // Helper to find which section an element belongs to
    const findElementSection = useCallback(
        (elementId: string, sections: FormSection[]): FormSection | undefined => {
            return sections.find((s) => getSectionElements(s).some((el) => el.id === elementId));
        },
        []
    );

    // Apply any form action (add, delete, update, replace, reorder)
    const applyFormAction = useCallback(
        (action: FormToolAction, existingSections?: FormSection[]): FormSection[] | undefined => {
            // Use provided sections or current sections
            const workingSections = existingSections || currentSections;
            
            switch (action.type) {
                case "addFields": {
                    const newElements: FormElementInstance[] = action.elements.map((el) => ({
                        id: crypto.randomUUID(),
                        type: el.type as FormElementType,
                        extraAttributes: el.extraAttributes,
                    }));
                    
                    // Convert elements to rows (one element per row)
                    const newRows: FormRow[] = newElements.map((el) => createRow(crypto.randomUUID(), el));
                    
                    // Determine target section
                    let targetSectionId = action.sectionId;
                    
                    // If insertAfterFieldId is specified, find its section
                    if (action.insertAfterFieldId && !targetSectionId) {
                        const section = findElementSection(action.insertAfterFieldId, workingSections);
                        targetSectionId = section?.id;
                    }
                    
                    // Default to current section or first section
                    if (!targetSectionId) {
                        targetSectionId = currentSectionId ?? workingSections[0]?.id;
                    }
                    
                    if (!targetSectionId) {
                        // No sections, create one
                        const newSection = createSection(crypto.randomUUID(), "Section 1");
                        newSection.rows = newRows;
                        const result = [newSection];
                        if (!existingSections) setSections(result);
                        return result;
                    }
                    
                    const result = workingSections.map((section) => {
                        if (section.id === targetSectionId) {
                            // If insertAfterFieldId is specified, insert at that position
                            if (action.insertAfterFieldId) {
                                // Find the row containing the insertAfterFieldId
                                const insertRowIndex = section.rows.findIndex(
                                    (row) => row.elements.some((el) => el.id === action.insertAfterFieldId)
                                );
                                if (insertRowIndex !== -1) {
                                    const before = section.rows.slice(0, insertRowIndex + 1);
                                    const after = section.rows.slice(insertRowIndex + 1);
                                    return {
                                        ...section,
                                        rows: [...before, ...newRows, ...after],
                                    };
                                }
                            }
                            // Default: append to end
                            return {
                                ...section,
                                rows: [...section.rows, ...newRows],
                            };
                        }
                        return section;
                    });
                    if (!existingSections) setSections(result);
                    return result;
                }
                case "deleteFields": {
                    const result = workingSections.map((section) => ({
                        ...section,
                        rows: section.rows
                            .map((row) => ({
                                ...row,
                                elements: row.elements.filter(
                                    (el) => !action.fieldIds.includes(el.id)
                                ),
                            }))
                            .filter((row) => row.elements.length > 0), // Remove empty rows
                    }));
                    if (!existingSections) {
                        setSections(result);
                        // Clear selectedElement if it was deleted
                        if (selectedElement && action.fieldIds.includes(selectedElement.id)) {
                            setSelectedElement(null);
                        }
                    }
                    return result;
                }
                case "updateField": {
                    const result = workingSections.map((section) => ({
                        ...section,
                        rows: section.rows.map((row) => ({
                            ...row,
                            elements: row.elements.map((el) => {
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
                            }),
                        })),
                    }));
                    if (!existingSections) {
                        setSections(result);
                        // Also update selectedElement if the updated field is currently selected
                        if (selectedElement?.id === action.fieldId) {
                            setSelectedElement((prev) => {
                                if (!prev) return null;
                                return {
                                    ...prev,
                                    type: action.updates.type
                                        ? (action.updates.type as FormElementType)
                                        : prev.type,
                                    extraAttributes: {
                                        ...prev.extraAttributes,
                                        ...action.updates.extraAttributes,
                                    },
                                };
                            });
                        }
                    }
                    return result;
                }
                case "replaceForm": {
                    const newSections: FormSection[] = action.sections.map((section) => ({
                        id: section.id || crypto.randomUUID(),
                        title: section.title || "Untitled Section",
                        description: section.description,
                        // Convert elements array to rows (one element per row)
                        rows: section.elements.map((el) => createRow(crypto.randomUUID(), {
                            id: el.id || crypto.randomUUID(),
                            type: el.type as FormElementType,
                            extraAttributes: el.extraAttributes,
                        })),
                    }));
                    if (!existingSections) {
                        setSections(newSections);
                        // Clear selectedElement since form was replaced
                        setSelectedElement(null);
                    }
                    return newSections;
                }
                case "reorderFields": {
                    const result = workingSections.map((section) => {
                        if (section.id === action.sectionId) {
                            // Get all elements from the section
                            const allElements = getSectionElements(section);
                            const reorderedElements: FormElementInstance[] = [];
                            
                            for (const fieldId of action.fieldIds) {
                                const element = allElements.find((el) => el.id === fieldId);
                                if (element) {
                                    reorderedElements.push(element);
                                }
                            }
                            // Add any elements not in the reorder list at the end
                            for (const el of allElements) {
                                if (!action.fieldIds.includes(el.id)) {
                                    reorderedElements.push(el);
                                }
                            }
                            // Convert back to rows (one element per row for simplicity)
                            return {
                                ...section,
                                rows: reorderedElements.map((el) => createRow(crypto.randomUUID(), el)),
                            };
                        }
                        return section;
                    });
                    if (!existingSections) setSections(result);
                    return result;
                }
                case "addSection": {
                    const newSection: FormSection = {
                        id: crypto.randomUUID(),
                        title: action.title,
                        description: action.description,
                        showTitle: action.showTitle,
                        rows: action.elements 
                            ? action.elements.map((el) => createRow(crypto.randomUUID(), {
                                id: crypto.randomUUID(),
                                type: el.type as FormElementType,
                                extraAttributes: el.extraAttributes,
                            }))
                            : [],
                    };
                    
                    let result: FormSection[];
                    if (action.insertAfterSectionId) {
                        const insertIndex = workingSections.findIndex(s => s.id === action.insertAfterSectionId);
                        if (insertIndex !== -1) {
                            result = [
                                ...workingSections.slice(0, insertIndex + 1),
                                newSection,
                                ...workingSections.slice(insertIndex + 1),
                            ];
                        } else {
                            result = [...workingSections, newSection];
                        }
                    } else {
                        result = [...workingSections, newSection];
                    }
                    
                    if (!existingSections) setSections(result);
                    return result;
                }
                case "updateSection": {
                    const result = workingSections.map((section) => {
                        if (section.id === action.sectionId) {
                            return {
                                ...section,
                                ...action.updates,
                            };
                        }
                        return section;
                    });
                    if (!existingSections) {
                        setSections(result);
                        // Update selectedSection if it's the one being updated
                        if (selectedSection?.id === action.sectionId) {
                            setSelectedSection((prev) => prev ? { ...prev, ...action.updates } : null);
                        }
                    }
                    return result;
                }
                case "deleteSection": {
                    const result = workingSections.filter((section) => section.id !== action.sectionId);
                    if (!existingSections) {
                        setSections(result);
                        // Clear selections if they belonged to deleted section
                        if (selectedSection?.id === action.sectionId) {
                            setSelectedSection(null);
                        }
                        if (selectedElement) {
                            const wasInDeletedSection = workingSections
                                .find(s => s.id === action.sectionId)
                                ?.rows.some(r => r.elements.some(el => el.id === selectedElement.id));
                            if (wasInDeletedSection) {
                                setSelectedElement(null);
                            }
                        }
                    }
                    return result;
                }
                case "reorderSections": {
                    const sectionMap = new Map(workingSections.map((s) => [s.id, s]));
                    const result = action.sectionIds
                        .map((id) => sectionMap.get(id))
                        .filter((s): s is FormSection => s !== undefined);
                    // Add any sections not in the reorder list at the end
                    for (const section of workingSections) {
                        if (!action.sectionIds.includes(section.id)) {
                            result.push(section);
                        }
                    }
                    if (!existingSections) setSections(result);
                    return result;
                }
                case "addElementToRow": {
                    const newElement: FormElementInstance = {
                        id: crypto.randomUUID(),
                        type: action.element.type as FormElementType,
                        extraAttributes: action.element.extraAttributes,
                    };
                    
                    const result = workingSections.map((section) => {
                        if (section.id !== action.sectionId) return section;
                        
                        return {
                            ...section,
                            rows: section.rows.map((row) => {
                                // Find the row containing the target element
                                const hasTarget = row.elements.some((el) => el.id === action.targetElementId);
                                if (!hasTarget) return row;
                                
                                // Check if row already has 2 elements
                                if (row.elements.length >= 2) return row;
                                
                                // Add element to the appropriate position
                                const newElements = action.position === "left"
                                    ? [newElement, ...row.elements]
                                    : [...row.elements, newElement];
                                
                                return { ...row, elements: newElements };
                            }),
                        };
                    });
                    
                    if (!existingSections) {
                        setSections(result);
                        setSelectedElement(newElement);
                    }
                    return result;
                }
                case "updateFormStyle": {
                    // This doesn't modify sections, but we handle it here for consistency
                    if (!existingSections) {
                        setFormStyle(action.style);
                    }
                    return workingSections;
                }
                case "updateDesignSettings": {
                    // This doesn't modify sections, but we handle it here for consistency
                    if (!existingSections) {
                        setDesignSettings((prev) => ({ ...prev, ...action.settings }));
                    }
                    return workingSections;
                }
                case "updateThankYouPage": {
                    // This doesn't modify sections, but we handle it here for consistency
                    if (!existingSections) {
                        setThankYouPage((prev) => ({ ...prev, ...action.settings }));
                    }
                    return workingSections;
                }
                default:
                    return workingSections;
            }
        },
        [currentSections, currentSectionId, setSections, findElementSection, selectedElement, setSelectedElement, selectedSection, setSelectedSection, setFormStyle, setDesignSettings, setThankYouPage]
    );

    // Apply multiple actions in sequence
    const applyMultipleActions = useCallback(
        (actions: FormToolAction[]) => {
            let sections = [...currentSections];
            let deletedFieldIds: string[] = [];
            let deletedSectionIds: string[] = [];
            let updatedFields: Map<string, { type?: string; extraAttributes?: Record<string, unknown> }> = new Map();
            let formReplaced = false;

            for (const action of actions) {
                // Handle style/design actions directly since they don't affect sections
                if (action.type === "updateFormStyle") {
                    setFormStyle(action.style);
                    continue;
                }
                if (action.type === "updateDesignSettings") {
                    setDesignSettings((prev) => ({ ...prev, ...action.settings }));
                    continue;
                }
                if (action.type === "updateThankYouPage") {
                    setThankYouPage((prev) => ({ ...prev, ...action.settings }));
                    continue;
                }

                const result = applyFormAction(action, sections);
                if (result) {
                    sections = result;
                }

                // Track changes that affect selectedElement/selectedSection
                if (action.type === "deleteFields") {
                    deletedFieldIds.push(...action.fieldIds);
                } else if (action.type === "updateField") {
                    updatedFields.set(action.fieldId, action.updates);
                } else if (action.type === "replaceForm") {
                    formReplaced = true;
                } else if (action.type === "deleteSection") {
                    deletedSectionIds.push(action.sectionId);
                }
            }

            setSections(sections);

            // Update selectedElement based on tracked changes
            if (formReplaced) {
                // Form was replaced, clear selection
                setSelectedElement(null);
                setSelectedSection(null);
            } else if (selectedElement && deletedFieldIds.includes(selectedElement.id)) {
                // Selected element was deleted
                setSelectedElement(null);
            } else if (selectedSection && deletedSectionIds.includes(selectedSection.id)) {
                // Selected section was deleted
                setSelectedSection(null);
            } else if (selectedElement && updatedFields.has(selectedElement.id)) {
                // Selected element was updated - sync the changes
                const updates = updatedFields.get(selectedElement.id)!;
                setSelectedElement((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        type: updates.type
                            ? (updates.type as FormElementType)
                            : prev.type,
                        extraAttributes: {
                            ...prev.extraAttributes,
                            ...updates.extraAttributes,
                        },
                    };
                });
            }
        },
        [currentSections, applyFormAction, setSections, selectedElement, setSelectedElement, selectedSection, setSelectedSection, setFormStyle, setDesignSettings, setThankYouPage]
    );

    // Mark a message's actions as applied (persists to database)
    const markMessageApplied = useCallback(
        async (messageId: string) => {
            // Use the database ID if we have a mapping, otherwise use the provided ID
            const dbMessageId = messageIdMap.current.get(messageId) || messageId;
            
            setAppliedMessageIds((prev) => new Set(prev).add(messageId));
            try {
                await markActionsApplied(dbMessageId);
            } catch (error) {
                console.error("Failed to mark actions as applied:", error);
            }
        },
        []
    );

    // Determine next workflow step based on action types
    const getNextWorkflowStep = useCallback((actions: FormToolAction[]): WorkflowStep => {
        const types = actions.map(a => a.type);
        if (types.includes("replaceForm") || types.includes("addFields") || types.includes("addSection")) {
            return "style";
        }
        if (types.includes("updateFormStyle")) {
            return "design";
        }
        if (types.includes("updateDesignSettings")) {
            return "thankYou";
        }
        if (types.includes("updateThankYouPage")) {
            return "complete";
        }
        return currentWorkflowStep;
    }, [currentWorkflowStep]);

    // Get a human-readable description of action type
    const getActionStepName = useCallback((actions: FormToolAction[]): string => {
        const types = actions.map(a => a.type);
        if (types.includes("replaceForm") || types.includes("addFields") || types.includes("addSection")) {
            return "form structure";
        }
        if (types.includes("updateFormStyle")) {
            return "form style";
        }
        if (types.includes("updateDesignSettings")) {
            return "design";
        }
        if (types.includes("updateThankYouPage")) {
            return "thank you page";
        }
        return "changes";
    }, []);

    // Continue workflow to next step after user applies changes
    const continueWorkflow = useCallback(
        (completedStep: WorkflowStep) => {
            // Advance to next step
            const stepOrder: WorkflowStep[] = ["structure", "style", "design", "thankYou", "complete"];
            const currentIndex = stepOrder.indexOf(completedStep);
            const nextStep = stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
            
            // Only continue if not complete
            if (nextStep !== "complete") {
                // Update the ref immediately so transport picks it up
                currentWorkflowStepRef.current = nextStep;
                setCurrentWorkflowStep(nextStep);
                
                // Wait for status to be ready before sending
                const sendContinue = async () => {
                    // Check if ready, if not, wait and retry
                    if (statusRef.current !== "ready") {
                        setTimeout(sendContinue, 100);
                        return;
                    }
                    
                    try {
                        if (session) {
                            await saveChatMessage(session.id, "user", "Continue");
                        }
                        originalSendMessage({ text: "Continue" });
                    } catch (error) {
                        console.error("Failed to continue workflow:", error);
                    }
                };
                
                // Start the continuation after a brief delay
                setTimeout(sendContinue, 300);
            } else {
                setCurrentWorkflowStep(nextStep);
            }
        },
        [originalSendMessage, session]
    );

    // Deny changes and ask AI what to do instead
    const denyChanges = useCallback(
        (messageId: string, actions: FormToolAction[]) => {
            const stepName = getActionStepName(actions);
            originalSendMessage({ text: `I don't like this ${stepName}. Suggest something different.` });
        },
        [originalSendMessage, getActionStepName]
    );

    const value: AIChatContextType = {
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        messages,
        sendMessage,
        continueWorkflow,
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
        denyChanges,
        currentWorkflowStep,
    };

    return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
}
