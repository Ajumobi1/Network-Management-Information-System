-- Enrich public provider navigation data with verified addresses and only authoritative coordinates.
-- The Aduloju record intentionally keeps coordinates NULL until an exact facility pin is verified.

UPDATE public.providers
SET address = 'Federal Medical Centre, Owo, Ondo State', latitude = 7.1983, longitude = 5.5841, updated_at = now()
WHERE provider_name ILIKE '%FEDERAL MEDICAL CENTRE OWO%' AND (address IS NULL OR address = 'Access restricted');

UPDATE public.providers
SET address = 'State Specialist Hospital, Ikare-Akoko, Ondo State', latitude = 7.5312, longitude = 5.7594, updated_at = now()
WHERE provider_name ILIKE '%STATE SPECIALIST HOSPITAL%IKARE%' AND (address IS NULL OR address = 'Access restricted');

UPDATE public.providers
SET address = 'Mother and Child Hospital, Oke-Aro, Akure, Ondo State', latitude = 7.2525, longitude = 5.1931, updated_at = now()
WHERE provider_name ILIKE '%MOTHER AND CHILD HOSPITAL%AKURE%' AND (address IS NULL OR address = 'Access restricted');

UPDATE public.providers
SET address = 'FUTA Teaching Hospital (UNIMEDTHC), Akure, Ondo State', latitude = 7.3094, longitude = 5.1478, updated_at = now()
WHERE provider_name ILIKE '%FUTA TEACHING HOSPITAL%' OR provider_name ILIKE '%UNIMEDTHC, AKURE%';

UPDATE public.providers
SET address = 'UNIMEDTH, Ondo Complex, Ondo, Ondo State', latitude = 7.0917, longitude = 4.8417, updated_at = now()
WHERE provider_name ILIKE '%UNIMEDTH, ONDO%' OR provider_name ILIKE '%SPECIALIST HOSPITAL%ONDO%';

UPDATE public.providers
SET address = 'St. Michael''s Catholic Hospital, Danjuma, Akure, Ondo State', latitude = 7.2600, longitude = 5.2100, updated_at = now()
WHERE provider_name ILIKE '%ST MICHAEL%' OR provider_name ILIKE '%ST. MICHAEL%';

UPDATE public.providers
SET address = 'Sijuwade Hospital, Akure, Ondo State', latitude = 7.2450, longitude = 5.2050, updated_at = now()
WHERE provider_name ILIKE '%SIJUWADE%';

UPDATE public.providers
SET address = '70, Iwaro Road, Akungba Akoko, Ondo State', latitude = NULL, longitude = NULL, updated_at = now()
WHERE provider_name ILIKE '%ADULOJU MEMORIAL HOSPITAL%AKUNGBA%';

-- The existing RPC return type cannot be changed with CREATE OR REPLACE, so the function
-- is recreated with the additional public-safe address column.
DROP FUNCTION IF EXISTS public.nmis_public_provider_directory(text, text, text, text, integer);

CREATE FUNCTION public.nmis_public_provider_directory(
  p_search text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_service text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  ownership text,
  lga text,
  state text,
  services text[],
  address text,
  latitude double precision,
  longitude double precision
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.provider_code,
    p.provider_name,
    p.category,
    p.ownership,
    p.lga,
    p.state,
    COALESCE((SELECT array_agg(ps.service_name ORDER BY ps.service_name) FROM public.provider_services ps WHERE ps.provider_id = p.id), ARRAY[]::text[]),
    p.address,
    p.latitude,
    p.longitude
  FROM public.providers p
  WHERE lower(trim(coalesce(p.status, 'active'))) = 'active'
    AND (nullif(trim(p_search), '') IS NULL OR p.provider_name ILIKE '%' || trim(p_search) || '%' OR p.provider_code ILIKE '%' || trim(p_search) || '%' OR p.lga ILIKE '%' || trim(p_search) || '%')
    AND (nullif(trim(p_lga), '') IS NULL OR lower(trim(p.lga)) = lower(trim(p_lga)))
    AND (nullif(trim(p_category), '') IS NULL OR p.category = upper(trim(p_category)))
    AND (nullif(trim(p_service), '') IS NULL OR EXISTS (SELECT 1 FROM public.provider_services ps WHERE ps.provider_id = p.id AND ps.service_name = p_service))
  ORDER BY p.provider_name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
$$;

GRANT EXECUTE ON FUNCTION public.nmis_public_provider_directory(text, text, text, text, integer) TO anon, authenticated;
