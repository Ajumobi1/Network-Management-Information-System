-- Add latitude and longitude columns to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Update the public provider directory RPC to include coordinates
DROP FUNCTION IF EXISTS public.nmis_public_provider_directory(text, text, text, text, integer);
CREATE OR REPLACE FUNCTION public.nmis_public_provider_directory(
  p_search TEXT DEFAULT NULL,
  p_lga TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_service TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  provider_code TEXT,
  provider_name TEXT,
  category TEXT,
  ownership TEXT,
  lga TEXT,
  state TEXT,
  services TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
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
    p.latitude,
    p.longitude
  FROM public.providers p
  WHERE lower(trim(coalesce(p.status, 'active'))) = 'active'
    AND (nullif(trim(p_search), '') IS NULL OR p.provider_name ILIKE '%' || trim(p_search) || '%' OR p.provider_code ILIKE '%' || trim(p_search) || '%' OR p.lga ILIKE '%' || trim(p_search) || '%')
    AND (nullif(trim(p_lga), '') IS NULL OR lower(trim(p.lga)) = lower(trim(p_lga)))
    AND (nullif(trim(p_category), '') IS NULL OR p.category = upper(trim(p_category)))
    AND (nullif(trim(p_service), '') IS NULL OR EXISTS (SELECT 1 FROM public.provider_services ps WHERE ps.provider_id = p.id AND ps.service_name = p_service))
  ORDER BY p.provider_name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 100);
$$;

-- Seed approximate coordinates for LGAs
UPDATE public.providers SET latitude = 7.257, longitude = 5.205 WHERE lower(trim(lga)) = 'akure south' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.300, longitude = 5.250 WHERE lower(trim(lga)) = 'akure north' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.100, longitude = 4.840 WHERE lower(trim(lga)) = 'ondo west' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.150, longitude = 4.950 WHERE lower(trim(lga)) = 'ondo east' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.510, longitude = 5.750 WHERE lower(trim(lga)) = 'akoko north-east' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.550, longitude = 5.600 WHERE lower(trim(lga)) = 'akoko north-west' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.350, longitude = 5.700 WHERE lower(trim(lga)) = 'akoko south-east' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.400, longitude = 5.650 WHERE lower(trim(lga)) = 'akoko south-west' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.500, longitude = 4.780 WHERE lower(trim(lga)) = 'okitipupa' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.950, longitude = 5.580 WHERE lower(trim(lga)) = 'owo' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.350, longitude = 4.820 WHERE lower(trim(lga)) = 'ilaje' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.780, longitude = 4.880 WHERE lower(trim(lga)) = 'odigbo' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.120, longitude = 4.950 WHERE lower(trim(lga)) = 'ile-oluji/oke-igbo' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.550, longitude = 4.950 WHERE lower(trim(lga)) = 'irele' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.150, longitude = 5.780 WHERE lower(trim(lga)) = 'ose' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.280, longitude = 5.120 WHERE lower(trim(lga)) = 'ifedore' AND latitude IS NULL;
UPDATE public.providers SET latitude = 7.100, longitude = 5.150 WHERE lower(trim(lga)) = 'idanre' AND latitude IS NULL;
UPDATE public.providers SET latitude = 6.300, longitude = 4.850 WHERE lower(trim(lga)) = 'ese-odo' AND latitude IS NULL;