-- Add thank_you_page column to forms table for draft settings
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS thank_you_page JSONB DEFAULT '{
    "title": "Thank You!",
    "description": "Your response has been submitted successfully. You can close this page now.",
    "showConfetti": true,
    "buttonText": "Submit another response",
    "buttonUrl": "",
    "showButton": false
}'::jsonb;

-- Add published_thank_you_page column for published form settings
ALTER TABLE forms
ADD COLUMN IF NOT EXISTS published_thank_you_page JSONB DEFAULT NULL;

-- Add thank_you_page to form_versions table for version history
ALTER TABLE form_versions
ADD COLUMN IF NOT EXISTS thank_you_page JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN forms.thank_you_page IS 'Draft thank you page settings (title, description, confetti, button)';
COMMENT ON COLUMN forms.published_thank_you_page IS 'Published thank you page settings shown to form respondents';
COMMENT ON COLUMN form_versions.thank_you_page IS 'Thank you page settings snapshot at this version';
