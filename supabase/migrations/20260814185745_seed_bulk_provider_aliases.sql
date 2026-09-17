-- Seed multiple provider aliases to ensure consistent workbook ingestion.
-- This is alias-only and intentionally does not create or rename providers.

WITH alias_data (p_code, alias_name, normalized) AS (
  VALUES 
    ('PROV-615744', 'MAO HOSPITALS GBANGBALOGUN AKURE', 'maohospitalsgbangbalogunakure'),
    ('PROV-519833', 'NETCARE MULTISPECIALTY HOSPITAL, AKURE', 'netcaremultispecialtyhospitalakure'),
    ('PROV-133989', 'NEW DAY MEDICAL CENTER IJAPO ESTATE AKURE', 'newdaymedicalcenterijapoestateakure'),
    ('PROV-327288', 'POLICE MEDICAL SERVICES ALAGBAKA AKURE', 'policemedicalservicesalagbakaakure'),
    ('PROV-601713', 'OMOLOLU HOSPITAL OKE IJEBU AKURE', 'omololuhospitalokeijebuakure'),
    ('PROV-160539', 'ONDO STATE REFRENCE HOSPITAL IGBATORO ROAD, AKURE', 'ondostaterefrencehospitaligbatororoadakure'),
    ('PROV-205695', 'PRIMARY HEALTH CLINIC DANJUMA AKURE', 'primaryhealthclinicdanjumaakure'),
    ('PROV-356331', 'SCKYE HOSPITAL OBA ADESIDA RD AKURE', 'sckyehospitalobaadesidardakure'),
    ('PROV-77628', 'SIJUWADE HOSPITAL', 'sijuwadehospital'),
    ('PROV-612067', 'SIMLON HOSPITAL OFF ILESHA RD AKURE', 'simlonhospitaloffileshardakure'),
    ('PROV-431180', 'ST. MICHAELS HOSP. ARAKALE AKURE', 'stmichaelshosparakaleakure'),
    ('PROV-585865', 'STATE SPECIALIST HOSPITAL OKE-ARO AKURE', 'statespecialisthospitalokearoakure')
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
  d.alias_name,
  d.normalized,
  'seed',
  1.00,
  true
FROM alias_data d
JOIN public.providers p ON p.provider_code = d.p_code
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET
  alias_name = EXCLUDED.alias_name,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  active = EXCLUDED.active,
  updated_at = now();
