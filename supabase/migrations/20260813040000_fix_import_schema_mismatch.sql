-- Fix schema mismatch for financial_records and enrollees
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS claims_category TEXT;
ALTER TABLE public.enrollees ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Ensure record_status has a default to prevent insert failures if not provided
ALTER TABLE public.financial_records ALTER COLUMN record_status SET DEFAULT 'valid';
ALTER TABLE public.enrollees ALTER COLUMN record_status SET DEFAULT 'valid';
