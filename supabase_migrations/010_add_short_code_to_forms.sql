-- Migration: Add short_code column for shorter public form URLs
-- This migration adds a unique 8-character short code for each form

-- Add short_code column to forms table for shorter public URLs
ALTER TABLE public.forms ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

-- Create a function to generate a unique short code
CREATE OR REPLACE FUNCTION generate_short_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get a unique short code (retries if collision)
CREATE OR REPLACE FUNCTION get_unique_short_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        new_code := generate_short_code(8);
        SELECT EXISTS(SELECT 1 FROM public.forms WHERE short_code = new_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate short_code on insert
CREATE OR REPLACE FUNCTION set_short_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_code IS NULL THEN
        NEW.short_code := get_unique_short_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_short_code ON public.forms;
CREATE TRIGGER trigger_set_short_code
    BEFORE INSERT ON public.forms
    FOR EACH ROW
    EXECUTE FUNCTION set_short_code();

-- Backfill existing forms with short codes
UPDATE public.forms SET short_code = get_unique_short_code() WHERE short_code IS NULL;

-- Make short_code NOT NULL after backfilling
ALTER TABLE public.forms ALTER COLUMN short_code SET NOT NULL;

-- Create an index on short_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_forms_short_code ON public.forms(short_code);
