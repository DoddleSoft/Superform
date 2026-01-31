-- Add design_settings JSONB column to forms table for global design properties
-- This stores properties like: backgroundColor, fontFamily, buttonCornerRadius, 
-- primaryColor, textColor, buttonColor, etc.

ALTER TABLE forms ADD COLUMN IF NOT EXISTS design_settings JSONB DEFAULT '{}'::jsonb;

-- Also add to form_versions for version history
ALTER TABLE form_versions ADD COLUMN IF NOT EXISTS design_settings JSONB DEFAULT '{}'::jsonb;

-- Add published_design_settings for published forms
ALTER TABLE forms ADD COLUMN IF NOT EXISTS published_design_settings JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN forms.design_settings IS 'JSONB object containing global design settings like backgroundColor, fontFamily, buttonCornerRadius, primaryColor, textColor, buttonColor, etc.';
