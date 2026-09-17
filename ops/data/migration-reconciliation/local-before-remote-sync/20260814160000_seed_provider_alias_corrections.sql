-- Preserve approved historical workbook names for existing authoritative providers.
-- This is data-only and intentionally does not create, rename, or duplicate providers.

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
  alias_data.alias_name,
  alias_data.normalized_alias,
  'seed',
  1.00,
  true
FROM public.providers p
JOIN (
  VALUES
    (
      'TOTAL CARE MEDICAL CENTRE UGBE- AKOKO'::text,
      'TOTAL CARE MEDICAL CLINIC,UGBE AKOKO'::text,
      'totalcaremedicalclinicugbeakoko'::text
    ),
    (
      'PRIMARY/COMPREHENSIVE HEALTH CENTRE, ARAKALE'::text,
      'COMPREHENSIVE HEALTH CENTRE, ARAKALE AKURE'::text,
      'comprehensivehealthcentrearakeleakure'::text
    )
) AS alias_data(provider_name, alias_name, normalized_alias)
  ON p.provider_name = alias_data.provider_name
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
