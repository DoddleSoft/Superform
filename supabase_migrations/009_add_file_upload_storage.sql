-- Migration: Add file upload storage bucket
-- This migration creates the storage bucket and RLS policies for form file uploads

-- Create the storage bucket for form uploads
-- Note: This is done via Supabase Dashboard or API, but documented here for reference
-- The bucket was created with the following settings:
-- - Bucket ID: form-uploads
-- - Bucket Name: form-uploads
-- - Public: true
-- - File Size Limit: 52428800 (50MB)
-- - Allowed MIME Types: image/jpeg, image/png, image/gif, image/webp, application/pdf, 
--   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, 
--   text/plain, text/csv, application/vnd.ms-excel, 
--   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

-- The following SQL was executed:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'form-uploads',
--   'form-uploads',
--   true,
--   52428800,
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 
--         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
--         'text/plain', 'text/csv', 'application/vnd.ms-excel', 
--         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
-- );

-- RLS Policies (already created):
-- 1. Allow public uploads - FOR INSERT TO public WITH CHECK (bucket_id = 'form-uploads')
-- 2. Allow public downloads - FOR SELECT TO public USING (bucket_id = 'form-uploads')

-- Note: This migration is for documentation purposes only.
-- The actual bucket and policies were created via Supabase MCP tools.
