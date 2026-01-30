-- Form Versioning System
-- Separates draft content from published content and tracks version history

-- 1. Add versioning columns to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published_content JSONB DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published_style TEXT DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 0;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS has_unpublished_changes BOOLEAN DEFAULT false;

-- 2. Create form_versions table to track version history
CREATE TABLE IF NOT EXISTS form_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content JSONB NOT NULL,
    style TEXT NOT NULL DEFAULT 'classic',
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT NOT NULL,
    
    -- Ensure unique version per form
    UNIQUE(form_id, version)
);

-- 3. Add version tracking to submissions
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_version INTEGER DEFAULT 1;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS form_content_snapshot JSONB DEFAULT NULL;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_form_id_version ON form_versions(form_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_forms_published ON forms(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_form_submissions_version ON form_submissions(form_id, form_version);

-- 5. Enable RLS on form_versions
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for form_versions (using Clerk JWT sub claim)
CREATE POLICY "Users can view versions of their forms"
    ON form_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = form_versions.form_id 
            AND forms.user_id = (auth.jwt() ->> 'sub')
        )
    );

CREATE POLICY "Users can create versions for their forms"
    ON form_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = form_versions.form_id 
            AND forms.user_id = (auth.jwt() ->> 'sub')
        )
    );

CREATE POLICY "Users can delete versions of their forms"
    ON form_versions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = form_versions.form_id 
            AND forms.user_id = (auth.jwt() ->> 'sub')
        )
    );

-- 7. Migrate existing published forms: copy content to published_content
UPDATE forms 
SET 
    published_content = content,
    published_style = style,
    published_at = updated_at,
    current_version = 1,
    has_unpublished_changes = false
WHERE published = true AND published_content IS NULL;

-- 8. Create initial version for existing published forms
INSERT INTO form_versions (form_id, version, content, style, name, description, created_by)
SELECT 
    id,
    1,
    content,
    COALESCE(style, 'classic'),
    name,
    description,
    user_id
FROM forms 
WHERE published = true 
AND NOT EXISTS (
    SELECT 1 FROM form_versions WHERE form_versions.form_id = forms.id
);
