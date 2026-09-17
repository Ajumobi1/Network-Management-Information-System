-- Preserve the approved Eton directory name and historical Excel facility name.
-- This is forward-only and updates the existing authoritative provider; it does not create a duplicate.

WITH renamed_provider AS (
  UPDATE public.providers
  SET provider_name = 'ETON MEDICALS, OBA-ILE AKURE'
  WHERE id = '47082686-efd9-4384-b23c-00459abd0481'::uuid
     OR upper(provider_name) IN (
    'ETON MEDICALS OBAILE AKURE',
    'ETON MEDICALS, OBAILE AKURE',
    'ETON MEDICALS, OBA-ILE AKURE'
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
  'ETON CLINIC & MATERNITY OBA-ILE',
  'etonclinicmaternityobaile',
  'seed',
  1.00,
  true
FROM public.providers p
WHERE p.id = '47082686-efd9-4384-b23c-00459abd0481'::uuid
   OR p.provider_name = 'ETON MEDICALS, OBA-ILE AKURE'
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
