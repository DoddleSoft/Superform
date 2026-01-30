-- Add style column to forms table to support different form rendering styles
-- 'classic' = One page sectioned (all sections visible on one page)
-- 'typeform' = Current Typeform-like slide/step experience

ALTER TABLE forms ADD COLUMN IF NOT EXISTS style TEXT DEFAULT 'classic';

-- Add check constraint for valid style values
ALTER TABLE forms ADD CONSTRAINT forms_style_check
  CHECK (style IN ('classic', 'typeform'));

-- Add index for potential filtering by style
CREATE INDEX IF NOT EXISTS idx_forms_style ON forms(style);
