-- Migration: Add settings JSONB column for flexible form settings
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.form_versions
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add published settings snapshot for published forms
ALTER TABLE public.forms
ADD COLUMN IF NOT EXISTS published_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN public.forms.settings IS 'Draft form-level settings (notifications, access, advanced features)';
COMMENT ON COLUMN public.forms.published_settings IS 'Published snapshot of form-level settings';
COMMENT ON COLUMN public.form_versions.settings IS 'Settings snapshot stored with each version';
