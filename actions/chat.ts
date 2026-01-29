"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { auth } from "@clerk/nextjs/server";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    toolInvocations?: any[];
    actionsApplied: boolean;
    createdAt: Date;
}

export interface ChatSession {
    id: string;
    formId: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function getOrCreateChatSession(formId: string): Promise<ChatSession> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createSupabaseServerClient();

    // Try to get existing session
    const { data: existingSession } = await supabase
        .from("ai_chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("form_id", formId)
        .single();

    if (existingSession) {
        return {
            id: existingSession.id,
            formId: existingSession.form_id,
            createdAt: new Date(existingSession.created_at),
            updatedAt: new Date(existingSession.updated_at),
        };
    }

    // Create new session
    const { data: newSession, error } = await supabase
        .from("ai_chat_sessions")
        .insert({
            user_id: userId,
            form_id: formId,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return {
        id: newSession.id,
        formId: newSession.form_id,
        createdAt: new Date(newSession.created_at),
        updatedAt: new Date(newSession.updated_at),
    };
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        toolInvocations: msg.tool_invocations,
        actionsApplied: msg.actions_applied ?? false,
        createdAt: new Date(msg.created_at),
    }));
}

export async function saveChatMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    toolInvocations?: any[]
): Promise<ChatMessage> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("ai_chat_messages")
        .insert({
            session_id: sessionId,
            role,
            content,
            tool_invocations: toolInvocations || null,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    // Update session updated_at
    await supabase
        .from("ai_chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

    return {
        id: data.id,
        role: data.role as "user" | "assistant",
        content: data.content,
        toolInvocations: data.tool_invocations,
        actionsApplied: data.actions_applied ?? false,
        createdAt: new Date(data.created_at),
    };
}

export async function markActionsApplied(messageId: string): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("ai_chat_messages")
        .update({ actions_applied: true })
        .eq("id", messageId);

    if (error) {
        // Silently ignore if column doesn't exist yet
        if (error.code === "42703") {
            console.warn("actions_applied column not found - run migration 003_add_actions_applied.sql");
            return;
        }
        throw error;
    }
}

export async function clearChatHistory(formId: string): Promise<void> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const supabase = await createSupabaseServerClient();

    // Delete the session (messages will cascade delete)
    const { error } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("user_id", userId)
        .eq("form_id", formId);

    if (error) {
        throw error;
    }
}
