-- Preserve the approved Owase directory name and historical Excel facility name.
-- This is forward-only and updates the existing authoritative provider; it does not create a duplicate.

WITH renamed_provider AS (
  UPDATE public.providers
  SET provider_name = 'PRIMARY/COMPREHENSIVE HEALTH CENTRE, OWASE OKA'
  WHERE upper(provider_name) IN (
    'COMPREHENSIVE HEALTH CENTRE OWASE OKA',
    'PRIMARY/COMPREHENSIVE HEALTH CENTRE OWASE OKA',
    'PRIMARY/COMPREHENSIVE HEALTH CENTRE, OWASE OKA'
  )
  RETURNING id
)
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
  'PRIMARY HEALTH CENTRE OWASE',
  'primaryhealthcentreowase',
  'seed',
  1.00,
  true
FROM public.providers p
WHERE p.provider_name = 'PRIMARY/COMPREHENSIVE HEALTH CENTRE, OWASE OKA'
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
