-- Correct the normalized key for the approved Arakale workbook alias.
-- The earlier seed used "arakele" instead of the source value "arakale".

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
  'COMPREHENSIVE HEALTH CENTRE ARAKALE AKURE',
  'comprehensivehealthcentrearakaleakure',
  'seed',
  1.00,
  true
FROM public.providers p
WHERE p.provider_code = 'PROV-950678'
  AND p.provider_name = 'PRIMARY/COMPREHENSIVE HEALTH CENTRE, ARAKALE'
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();

UPDATE public.provider_name_aliases
SET active = false, updated_at = now()
WHERE provider_id = 'df72441f-1a6d-4512-b73b-6047165958e9'::uuid
  AND normalized_alias = 'comprehensivehealthcentrearakeleakure';
