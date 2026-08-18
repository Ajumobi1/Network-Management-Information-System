-- Batch 2: Enrich provider addresses for Akintan Memorial Hospital and Bolcom Hospital in Akure
-- Following the verified address rules: exact street addresses applied, coordinates kept NULL or set to verified point.

UPDATE public.providers
SET address = 'No. 8, Adegbola Street, Oshukoti Layout, Oke-Ijebu, Akure, Ondo State', latitude = NULL, longitude = NULL, updated_at = now()
WHERE provider_name ILIKE '%AKINTAN MEMORIAL HOSPITAL%' AND (address IS NULL OR address = 'Access restricted');

UPDATE public.providers
SET address = '5, Moses Orimolade Street, Ijapo Estate, Akure, Ondo State', latitude = NULL, longitude = NULL, updated_at = now()
WHERE provider_name ILIKE '%BOLCOM HOSPITAL%' AND (address IS NULL OR address = 'Access restricted');
