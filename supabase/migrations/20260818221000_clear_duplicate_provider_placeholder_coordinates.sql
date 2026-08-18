-- Remove duplicated generic coordinates that represent LGA/city centroids rather than provider-specific pins.
-- This is intentionally fail-safe: a provider with no verified exact coordinate remains address-visible but not navigable.

WITH duplicate_pairs AS (
  SELECT latitude, longitude
  FROM public.providers
  WHERE lower(trim(coalesce(status, 'active'))) = 'active'
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
  GROUP BY latitude, longitude
  HAVING COUNT(*) > 1
)
UPDATE public.providers AS p
SET latitude = NULL,
    longitude = NULL,
    updated_at = now()
WHERE lower(trim(coalesce(p.status, 'active'))) = 'active'
  AND EXISTS (
    SELECT 1
    FROM duplicate_pairs AS d
    WHERE d.latitude = p.latitude
      AND d.longitude = p.longitude
  );
