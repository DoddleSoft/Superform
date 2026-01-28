import { SupabaseClient } from "@supabase/supabase-js";

export async function createForm(
    supabase: SupabaseClient,
    workspaceId: string,
    userId: string,
    name: string,
    description?: string
) {
    const { data, error } = await supabase
        .from("forms")
        .insert([
            {
                user_id: userId,
                workspace_id: workspaceId,
                name: name,
                description: description,
                content: [], // Default empty content
            },
        ])
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}
