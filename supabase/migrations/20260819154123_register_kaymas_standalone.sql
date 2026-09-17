-- 1. Register KAYMAS MEDICAL CENTRE as a new authoritative provider
INSERT INTO public.providers (provider_code, provider_name, category, subcategory, ownership, state, lga, address, status, contract_status, credential_status, inspection_status, capitation_status, senatorial_district)
VALUES ('NMIS-FAC-KAYMAS', 'KAYMAS MEDICAL CENTRE', 'HOSPITAL', NULL, 'Private', 'Ondo', 'Akure South', 'Akure South, Ondo State', 'Active', 'Active', 'Approved', 'Compliant', 'Active', 'Ondo Central');

-- 2. Re-map aliases from KINGS MEDI-CLINIC AKURE to the new KAYMAS record
WITH new_kaymas AS (
  SELECT id FROM public.providers WHERE provider_code = 'NMIS-FAC-KAYMAS' LIMIT 1
)
UPDATE public.provider_name_aliases
SET provider_id = new_kaymas.id,
    source = 'manual-reconciliation-standalone-2026-08-19',
    confidence = 1.00
FROM new_kaymas
WHERE normalized_alias IN ('kaymasmedicalcentre', 'kaymasmedicalcentreakuresouth');