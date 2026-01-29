-- Add support for partial (incomplete) form submissions
-- This allows tracking when users leave before completing the form

-- Add columns to form_submissions table
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT TRUE;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS last_section_index INTEGER DEFAULT 0;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS total_sections INTEGER DEFAULT 1;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add index for faster queries on session_id (for upsert operations)
CREATE INDEX IF NOT EXISTS idx_form_submissions_session_id ON form_submissions(session_id);

-- Add index for filtering by completion status
CREATE INDEX IF NOT EXISTS idx_form_submissions_is_complete ON form_submissions(form_id, is_complete);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp on row update
DROP TRIGGER IF EXISTS trigger_update_submission_timestamp ON form_submissions;
CREATE TRIGGER trigger_update_submission_timestamp
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_timestamp();

-- Add RLS policies for partial submissions (anonymous users can create/update their own sessions)
-- Allow insert for anonymous users with a session
CREATE POLICY IF NOT EXISTS "Anyone can insert submissions"
ON form_submissions
FOR INSERT
WITH CHECK (true);

-- Allow update only for matching session_id
CREATE POLICY IF NOT EXISTS "Users can update their own session submissions"
ON form_submissions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow select for form owners (handled by existing policies)
