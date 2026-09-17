-- Preserve the approved historical Excel name for the existing College of Health provider.
-- This is alias-only and intentionally does not create or rename a provider.

INSERT INTO public.provider_name_aliases (
  provider_id,
  alias_name,
  normalized_alias,
  source,
  confidence,
  active
)
SELECT
  p.id,
  'COLLEGE OF HEALTH CLINIC ODA RD AKURE',
  'collegeofhealthclinicodardakure',
  'seed',
  1.00,
  true
FROM public.providers p
WHERE p.provider_code = 'PROV-792080'
  AND p.provider_name = 'COLLEGE OF HEALTH TECHNOLOGY CLINIC, ODA ROAD, AKURE'
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
