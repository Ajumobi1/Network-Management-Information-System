-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 15: Ownership Standardization.
--
-- This migration restricts the ownership field to 'Government' and 'Private' 
-- across the providers and financial_records tables.

BEGIN;

-- 1. Update existing provider records (if any) to align with new types
UPDATE public.providers 
SET ownership = 'Government' 
WHERE ownership IN ('Public/Government', 'Public');

UPDATE public.providers 
SET ownership = 'Private' 
WHERE ownership NOT IN ('Government', 'Private');

-- 2. Add CHECK constraint to providers table
ALTER TABLE public.providers 
DROP CONSTRAINT IF EXISTS providers_ownership_check;

ALTER TABLE public.providers 
ADD CONSTRAINT providers_ownership_check 
CHECK (ownership IN ('Government', 'Private'));

-- 3. Update existing financial records
UPDATE public.financial_records 
SET ownership = 'Government' 
WHERE ownership IN ('Public/Government', 'Public');

UPDATE public.financial_records 
SET ownership = 'Private' 
WHERE ownership NOT IN ('Government', 'Private') AND ownership IS NOT NULL;

-- 4. Update existing enrolment records
UPDATE public.enrollees 
SET ownership = 'Government' 
WHERE ownership IN ('Public/Government', 'Public');

UPDATE public.enrollees 
SET ownership = 'Private' 
WHERE ownership NOT IN ('Government', 'Private') AND ownership IS NOT NULL;

COMMIT;
