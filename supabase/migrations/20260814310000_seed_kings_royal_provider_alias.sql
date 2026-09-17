-- Preserve the approved historical Excel name for the KINGS MEDI-CLINIC AKURE provider.
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
  'KINGS ROYAL MEDICLINIC ILEKUN ODA ROAD AKURE',
  'kingsroyalmediclinicilekunodaroadakure',
  'seed',
  1.00,
  true
FROM public.providers p
WHERE p.provider_code = 'PROV-136539'
  AND p.provider_name = 'KINGS MEDI-CLINIC AKURE'
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
