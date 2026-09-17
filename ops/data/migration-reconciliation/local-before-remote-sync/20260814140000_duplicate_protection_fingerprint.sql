-- 1. Add fingerprint to enrollees
ALTER TABLE public.enrollees ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollees_fingerprint ON public.enrollees(fingerprint);

-- 2. Add fingerprint to financial_records
ALTER TABLE public.financial_records ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_records_fingerprint ON public.financial_records(fingerprint);

-- 3. Update existing records to have a fingerprint (backfill)
UPDATE public.enrollees 
SET fingerprint = md5(coalesce(policy_number, '') || '|' || coalesce(period, '') || '|' || coalesce(provider_id::text, ''))
WHERE fingerprint IS NULL;

UPDATE public.financial_records
SET fingerprint = md5(coalesce(provider_id::text, '') || '|' || coalesce(period, '') || '|' || coalesce(data_type, '') || '|' || coalesce(claims_category, '') || '|' || coalesce(amount_paid::text, '0'))
WHERE fingerprint IS NULL;
