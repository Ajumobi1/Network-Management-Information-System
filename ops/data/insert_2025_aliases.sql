INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source, confidence, active)
VALUES
  ('f0713a72-2cf9-42ab-9371-0682bc4e8149', 'CHRISTBAY CONSULTANT HOSPITAL AKURE', regexp_replace(lower(trim('CHRISTBAY CONSULTANT HOSPITAL AKURE')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('b805bd4d-4432-4060-9388-7bda53830feb', 'DEBORAH MULTI SPECIALIST  HOS  AND DIAGNOSTICS CENTER', regexp_replace(lower(trim('DEBORAH MULTI SPECIALIST  HOS  AND DIAGNOSTICS CENTER')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('47082686-efd9-4384-b23c-00459abd0481', 'ETON CLINIC OBAILE AKURE', regexp_replace(lower(trim('ETON CLINIC OBAILE AKURE')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('bb7b33b0-316a-4051-90c7-794936c31e32', 'J&E FATULA HOSPITAL OKEARO AKURE', regexp_replace(lower(trim('J&E FATULA HOSPITAL OKEARO AKURE')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('d9c7fdba-72d2-452f-9edb-8303281edde6', 'KINGS MEDIC ROYAL CLINIC, ODA ROAD, AKURE', regexp_replace(lower(trim('KINGS MEDIC ROYAL CLINIC, ODA ROAD, AKURE')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('27ccb534-82d2-462e-bf6f-a6ba2e115968', 'MERCYLAND MEDICAL CENTER, ONDO', regexp_replace(lower(trim('MERCYLAND MEDICAL CENTER, ONDO')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('8532ec98-441b-4a7b-8ffc-46f9629a98b9', 'NETCARE MULTISPECIALIST HOSPITAL IJAPO', regexp_replace(lower(trim('NETCARE MULTISPECIALIST HOSPITAL IJAPO')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('e9aba5bc-41d6-454a-9218-20fe97c86516', 'OKEIGBO CHC ORANGE HEALTH INSURANCE SCHEME', regexp_replace(lower(trim('OKEIGBO CHC ORANGE HEALTH INSURANCE SCHEME')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('feed36f2-9dfb-4145-8dcf-4ee8f5f1d1d7', 'REMITA FUND HOLDING ACCOUNT FMC OWO', regexp_replace(lower(trim('REMITA FUND HOLDING ACCOUNT FMC OWO')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true),
  ('f8e0c236-658b-4567-b3ce-9e0dc87885f7', 'UNIVERSITY OF MEDICAL SCIENCES TEACHING HOSPITAL', regexp_replace(lower(trim('UNIVERSITY OF MEDICAL SCIENCES TEACHING HOSPITAL')), '[^a-z0-9]', '', 'g'), 'manual_2025_workbook', 0.95, true)
ON CONFLICT ON CONSTRAINT provider_alias_unique DO NOTHING;
