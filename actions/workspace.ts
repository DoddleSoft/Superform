"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import type { Workspace } from "@/types/form-builder";

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
    
    if (error) {
        throw error;
    }
    
    return data || [];
}

export async function createWorkspace(userId: string, name: string): Promise<Workspace> {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from("workspaces")
        .insert([
            {
                user_id: userId,
                name: name,
                is_default: false,
            },
        ])
        .select()
        .single();
    
    if (error) {
        throw error;
    }
    
    revalidatePath("/dashboard");
    return data;
}

export async function updateWorkspace(
    workspaceId: string,
    updates: { name?: string }
): Promise<Workspace> {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from("workspaces")
        .update(updates)
        .eq("id", workspaceId)
        .select()
        .single();
    
    if (error) {
        throw error;
    }
    
    revalidatePath("/dashboard");
    return data;
}

export async function deleteWorkspace(workspaceId: string): Promise<{ success: boolean }> {
    const supabase = await createSupabaseServerClient();
    
    // Check if this is the default workspace
    const { data: workspace, error: fetchError } = await supabase
        .from("workspaces")
        .select("is_default")
        .eq("id", workspaceId)
        .single();
    
    if (fetchError) {
        throw fetchError;
    }
    
    if (workspace?.is_default) {
        throw new Error("Cannot delete the default workspace");
    }
    
    // Get all forms in this workspace
    const { data: forms } = await supabase
        .from("forms")
        .select("id")
        .eq("workspace_id", workspaceId);
    
    // Delete all form submissions for forms in this workspace
    if (forms && forms.length > 0) {
        const formIds = forms.map(f => f.id);
        await supabase.from("form_submissions").delete().in("form_id", formIds);
        
        // Delete all forms in this workspace
        await supabase.from("forms").delete().eq("workspace_id", workspaceId);
    }
    
    // Delete the workspace
    const { error } = await supabase
        .from("workspaces")
        .delete()
        .eq("id", workspaceId);
    
    if (error) {
        throw error;
    }
    
    revalidatePath("/dashboard");
    return { success: true };
}
