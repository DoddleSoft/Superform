"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";
import type { Form, FormWithStats, PaginatedResponse, GetFormsParams, FormStyle, FormDesignSettings, ThankYouPageSettings } from "@/types/form-builder";

// ============== Form CRUD Operations ==============

export async function createForm(
    workspaceId: string,
    userId: string,
    name: string,
    description?: string
) {
    const supabase = await createSupabaseServerClient();
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

    revalidatePath("/dashboard");
    return data;
}

export async function getForms({
    workspaceId,
    page = 1,
    pageSize = 9,
    search = "",
}: GetFormsParams): Promise<PaginatedResponse<FormWithStats>> {
    const supabase = await createSupabaseServerClient();
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Build query
    let query = supabase
        .from("forms")
        .select("*, form_submissions(count)", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
    
    // Apply search filter if provided
    if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
        throw error;
    }
    
    // Transform data to include submission_count
    const formsWithStats: FormWithStats[] = (data || []).map((form: any) => ({
        ...form,
        submission_count: form.form_submissions?.[0]?.count || 0,
        form_submissions: undefined, // Remove the nested array
    }));
    
    const total = count || 0;
    
    return {
        data: formsWithStats,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

export async function getFormStats(workspaceId: string): Promise<{ totalForms: number; totalSubmissions: number }> {
    const supabase = await createSupabaseServerClient();
    
    // Get total forms count
    const { count: formCount, error: formError } = await supabase
        .from("forms")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
    
    if (formError) {
        throw formError;
    }
    
    // Get total submissions across all forms in workspace
    const { data: forms, error: submissionError } = await supabase
        .from("forms")
        .select("id")
        .eq("workspace_id", workspaceId);
    
    if (submissionError) {
        throw submissionError;
    }
    
    let totalSubmissions = 0;
    if (forms && forms.length > 0) {
        const formIds = forms.map(f => f.id);
        const { count, error } = await supabase
            .from("form_submissions")
            .select("*", { count: "exact", head: true })
            .in("form_id", formIds);
        
        if (!error) {
            totalSubmissions = count || 0;
        }
    }
    
    return {
        totalForms: formCount || 0,
        totalSubmissions,
    };
}

export async function deleteForm(formId: string) {
    const supabase = await createSupabaseServerClient();
    
    // Delete submissions first (cascade might handle this, but being explicit)
    await supabase.from("form_submissions").delete().eq("form_id", formId);
    
    // Delete the form
    const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", formId);
    
    if (error) {
        throw error;
    }
    
    revalidatePath("/dashboard");
    return { success: true };
}

export async function duplicateForm(formId: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    
    // Fetch the original form
    const { data: original, error: fetchError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", formId)
        .single();
    
    if (fetchError || !original) {
        throw fetchError || new Error("Form not found");
    }
    
    // Create duplicate
    const { data, error } = await supabase
        .from("forms")
        .insert([
            {
                user_id: userId,
                workspace_id: original.workspace_id,
                name: `${original.name} (Copy)`,
                description: original.description,
                content: original.content,
                published: false, // Always start as draft
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

export async function updateFormMetadata(
    formId: string,
    updates: { name?: string; description?: string }
) {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
        .from("forms")
        .update(updates)
        .eq("id", formId)
        .select()
        .single();
    
    if (error) {
        throw error;
    }
    
    revalidatePath("/dashboard");
    return data;
}

export async function saveFormContent(id: string, jsonContent: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("forms")
        .update({
            content: JSON.parse(jsonContent),
            has_unpublished_changes: true, // Mark as having unpublished changes
        })
        .eq("id", id);

    if (error) {
        throw error;
    }
}

export async function publishForm(id: string, userId: string) {
    const supabase = await createSupabaseServerClient();
    
    // First get the current form to access content and compare with published
    const { data: currentForm, error: fetchError } = await supabase
        .from("forms")
        .select("content, style, design_settings, thank_you_page, name, description, current_version, published_content, published_style, published_design_settings, published_thank_you_page")
        .eq("id", id)
        .single();

    if (fetchError) {
        throw fetchError;
    }

    // Check if content has actually changed from published version
    const contentChanged = JSON.stringify(currentForm.content) !== JSON.stringify(currentForm.published_content)
        || currentForm.style !== currentForm.published_style
        || JSON.stringify(currentForm.design_settings) !== JSON.stringify(currentForm.published_design_settings)
        || JSON.stringify(currentForm.thank_you_page) !== JSON.stringify(currentForm.published_thank_you_page);
    
    const now = new Date().toISOString();
    
    // Only increment version if content actually changed
    const newVersion = contentChanged 
        ? (currentForm.current_version || 0) + 1 
        : currentForm.current_version || 1;

    // Update the form with published content
    const { data, error } = await supabase
        .from("forms")
        .update({
            published: true,
            published_content: currentForm.content,
            published_style: currentForm.style,
            published_design_settings: currentForm.design_settings,
            published_thank_you_page: currentForm.thank_you_page,
            published_at: now,
            current_version: newVersion,
            has_unpublished_changes: false,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    // Only create a version snapshot if content changed
    if (contentChanged) {
        const { error: versionError } = await supabase
            .from("form_versions")
            .insert({
                form_id: id,
                version: newVersion,
                content: currentForm.content,
                style: currentForm.style || 'classic',
                design_settings: currentForm.design_settings || {},
                thank_you_page: currentForm.thank_you_page || {},
                name: currentForm.name,
                description: currentForm.description,
                created_by: userId,
            });

        if (versionError) {
            console.error("Failed to create version snapshot:", versionError);
            // Don't throw - publishing succeeded, version tracking is secondary
        }
    }

    return data;
}

export async function getFormById(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getFormContentByUrl(formUrl: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("forms")
        .select("id, published_content, name, description, published_style, published_design_settings, published_thank_you_page, current_version") // Use published content for public view
        .eq("short_code", formUrl)
        .eq("published", true)
        .single();

    if (error) {
        throw error;
    }

    // Return in expected format, using published content
    return {
        id: data.id,
        content: data.published_content,
        name: data.name,
        description: data.description,
        style: data.published_style,
        designSettings: data.published_design_settings,
        thankYouPage: data.published_thank_you_page,
        version: data.current_version,
    };
}

export async function submitForm(
    formId: string,
    jsonContent: string,
    sessionId?: string,
    totalSections?: number,
    formVersion?: number,
    formContentSnapshot?: any
) {
    const supabase = await createSupabaseServerClient();
    const data = JSON.parse(jsonContent);

    // If we have a session ID, try to update the existing partial submission first
    if (sessionId) {
        // First check if a row with this session_id exists
        const { data: existing } = await supabase
            .from("form_submissions")
            .select("id")
            .eq("session_id", sessionId)
            .single();

        if (existing) {
            // Update existing submission
            const { error: updateError } = await supabase
                .from("form_submissions")
                .update({
                    data,
                    is_complete: true,
                    last_section_index: totalSections || 1,
                    total_sections: totalSections || 1,
                    form_version: formVersion || 1,
                    form_content_snapshot: formContentSnapshot || null,
                })
                .eq("session_id", sessionId);

            if (updateError) {
                throw updateError;
            }
        } else {
            // No existing row, insert new
            const { error: insertError } = await supabase
                .from("form_submissions")
                .insert({
                    form_id: formId,
                    data,
                    is_complete: true,
                    session_id: sessionId,
                    last_section_index: totalSections || 1,
                    total_sections: totalSections || 1,
                    form_version: formVersion || 1,
                    form_content_snapshot: formContentSnapshot || null,
                });

            if (insertError) {
                throw insertError;
            }
        }
    } else {
        // No session ID, just insert a new complete submission
        const { error } = await supabase
            .from("form_submissions")
            .insert({
                form_id: formId,
                data,
                is_complete: true,
                form_version: formVersion || 1,
                form_content_snapshot: formContentSnapshot || null,
            });

        if (error) {
            throw error;
        }
    }
}

export async function savePartialSubmission(
    formId: string,
    sessionId: string,
    data: Record<string, string>,
    currentSectionIndex: number,
    totalSections: number
) {
    const supabase = await createSupabaseServerClient();

    // Try to update existing submission first
    const { data: existing } = await supabase
        .from("form_submissions")
        .select("id")
        .eq("session_id", sessionId)
        .single();

    if (existing) {
        // Update existing partial submission
        const { error } = await supabase
            .from("form_submissions")
            .update({
                data,
                is_complete: false,
                last_section_index: currentSectionIndex,
                total_sections: totalSections,
            })
            .eq("session_id", sessionId);

        if (error) {
            throw error;
        }
    } else {
        // Insert new partial submission
        const { error } = await supabase
            .from("form_submissions")
            .insert({
                form_id: formId,
                session_id: sessionId,
                data,
                is_complete: false,
                last_section_index: currentSectionIndex,
                total_sections: totalSections,
            });

        if (error) {
            throw error;
        }
    }
}

export async function getFormSubmissions(formId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("form_id", formId)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

// ============== Form Style Operations ==============

export async function saveFormStyle(id: string, style: FormStyle) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("forms")
        .update({ 
            style,
            has_unpublished_changes: true, // Mark as having unpublished changes
        })
        .eq("id", id);

    if (error) {
        throw error;
    }
}

// ============== Form Design Settings Operations ==============

export async function saveFormDesignSettings(id: string, designSettings: FormDesignSettings) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("forms")
        .update({ 
            design_settings: designSettings,
            has_unpublished_changes: true, // Mark as having unpublished changes
        })
        .eq("id", id);

    if (error) {
        throw error;
    }
}

// ============== Thank You Page Operations ==============

export async function saveThankYouPage(id: string, thankYouPage: ThankYouPageSettings) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("forms")
        .update({ 
            thank_you_page: thankYouPage,
            has_unpublished_changes: true, // Mark as having unpublished changes
        })
        .eq("id", id);

    if (error) {
        throw error;
    }
}

// ============== Form Version Operations ==============

export async function getFormVersions(formId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("form_versions")
        .select("*")
        .eq("form_id", formId)
        .order("version", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

export async function restoreFormVersion(formId: string, version: number) {
    const supabase = await createSupabaseServerClient();
    
    // Get the version to restore
    const { data: versionData, error: fetchError } = await supabase
        .from("form_versions")
        .select("content, style, design_settings")
        .eq("form_id", formId)
        .eq("version", version)
        .single();

    if (fetchError) {
        throw fetchError;
    }

    // Update the form's draft content with the version content
    const { data, error } = await supabase
        .from("forms")
        .update({
            content: versionData.content,
            style: versionData.style,
            design_settings: versionData.design_settings || {},
            has_unpublished_changes: true, // Will need to republish
        })
        .eq("id", formId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    revalidatePath(`/builder/${formId}`);
    return data;
}

export async function unpublishForm(id: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("forms")
        .update({
            published: false,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    revalidatePath("/dashboard");
    return data;
}
