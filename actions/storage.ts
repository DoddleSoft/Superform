"use server";

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "form-uploads";

// Create a Supabase client without authentication for public file uploads
// This is used for form submissions from public forms
function createPublicSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export interface UploadResult {
    url?: string;
    error?: string;
}

/**
 * Upload a file to Supabase Storage for form submissions
 * Files are organized by date and given unique names to avoid collisions
 */
export async function uploadFormFile(formData: FormData): Promise<UploadResult> {
    try {
        const file = formData.get("file") as File;
        
        if (!file) {
            return { error: "No file provided" };
        }

        // Validate file size (50MB max)
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_SIZE) {
            return { error: "File size exceeds 50MB limit" };
        }

        // Generate a unique file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const datePrefix = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const filePath = `${datePrefix}/${timestamp}-${randomId}-${sanitizedName}`;

        const supabase = createPublicSupabaseClient();

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = new Uint8Array(arrayBuffer);

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("Storage upload error:", error);
            return { error: error.message };
        }

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        return { url: urlData.publicUrl };
    } catch (err) {
        console.error("Upload failed:", err);
        return { error: "Failed to upload file" };
    }
}

/**
 * Delete a file from Supabase Storage
 * Used when removing uploaded files before form submission
 */
export async function deleteFormFile(fileUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createPublicSupabaseClient();
        
        // Extract the file path from the URL
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
        
        if (pathParts.length < 2) {
            return { success: false, error: "Invalid file URL" };
        }
        
        const filePath = decodeURIComponent(pathParts[1]);
        
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error("Storage delete error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("Delete failed:", err);
        return { success: false, error: "Failed to delete file" };
    }
}

/**
 * Check if a file exists in storage
 */
export async function checkFileExists(fileUrl: string): Promise<boolean> {
    try {
        const response = await fetch(fileUrl, { method: "HEAD" });
        return response.ok;
    } catch {
        return false;
    }
}
