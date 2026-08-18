-- Correct provider contact data using official facility sources.
-- Remove prior unverified or incorrectly attributed values first.
UPDATE public.providers
SET contact_person = NULL,
    phone = NULL,
    email = NULL,
    updated_at = now()
WHERE provider_name IN (
  'FUTA TEACHING HOSPITAL (UNIMEDTHC), AKURE',
  'ONDO STATE REFERENCE HOSPITAL, IGBATORO ROAD AKURE',
  'FEDERAL MEDICAL CENTRE OWO',
  'MOTHER AND CHILD HOSPITAL AKURE'
);

UPDATE public.providers
SET phone = '+2348035094545',
    email = 'info@fmcowo.org.ng',
    updated_at = now()
WHERE provider_name = 'FEDERAL MEDICAL CENTRE OWO';

UPDATE public.providers
SET phone = '+2349158203566',
    email = 'admin@adulojuhospital.com',
    updated_at = now()
WHERE provider_name = 'ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO';

UPDATE public.providers
SET phone = '+2347030284487',
    email = 'netcarehospitalng@gmail.com',
    updated_at = now()
WHERE provider_name = 'NETCARE MULTISPECIALTY HOSPITAL, AKURE';

UPDATE public.providers
SET phone = '+2349155621586',
    email = 'info@deborahhealth.com',
    updated_at = now()
WHERE provider_name = 'DEBORAH MULTI-SPECIALIST HOSPITAL & DIAGNOSTIC CENTRE';
