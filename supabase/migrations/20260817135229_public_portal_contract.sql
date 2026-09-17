-- Public NMIS portal contract
-- Additive only: no existing protected table policies or business data are changed.

CREATE OR REPLACE FUNCTION public.nmis_public_portal_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_active_providers bigint := 0;
  v_lgas bigint := 0;
  v_enrollees bigint := 0;
  v_capitation_rate numeric := 750;
  v_hospitals bigint := 0;
  v_pharmacies bigint := 0;
  v_diagnostics bigint := 0;
  v_last_updated timestamptz := now();
BEGIN
  SELECT count(*) INTO v_active_providers
  FROM public.providers
  WHERE lower(trim(coalesce(status, ''))) = 'active';

  SELECT count(DISTINCT nullif(trim(lga), '')) INTO v_lgas
  FROM public.providers
  WHERE lower(trim(coalesce(status, ''))) = 'active';

  SELECT count(*) INTO v_enrollees
  FROM public.enrollees
  WHERE record_status = 'valid';

  SELECT COALESCE(rate, 750) INTO v_capitation_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee' AND active = true;
  v_capitation_rate := COALESCE(v_capitation_rate, 750);

  SELECT count(*) INTO v_hospitals
  FROM public.providers
  WHERE lower(trim(coalesce(status, ''))) = 'active' AND category = 'HOSPITAL';

  SELECT count(*) INTO v_pharmacies
  FROM public.providers
  WHERE lower(trim(coalesce(status, ''))) = 'active' AND category = 'PHARMACY';

  SELECT count(*) INTO v_diagnostics
  FROM public.providers
  WHERE lower(trim(coalesce(status, ''))) = 'active' AND category = 'DIAGNOSTIC_CENTRE';

  SELECT max(updated_at) INTO v_last_updated FROM public.enrollees;
  SELECT greatest(v_last_updated, (SELECT max(updated_at) FROM public.providers), now()) INTO v_last_updated;

  RETURN jsonb_build_object(
    'kpis', jsonb_build_object(
      'registeredEnrollees', v_enrollees,
      'accreditedProviders', v_active_providers,
      'lgasCovered', v_lgas,
      'capitationRate', v_capitation_rate,
      'hospitals', v_hospitals,
      'pharmacies', v_pharmacies,
      'diagnosticCentres', v_diagnostics
    ),
    'transparency', jsonb_build_object(
      'byLga', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC, name)
        FROM (
          SELECT trim(lga) AS name, count(*)::bigint AS value
          FROM public.enrollees
          WHERE record_status = 'valid' AND nullif(trim(lga), '') IS NOT NULL
          GROUP BY trim(lga)
          ORDER BY count(*) DESC, trim(lga)
          LIMIT 18
        ) AS lga_summary
      ), '[]'::jsonb),
      'byCategory', COALESCE((
        SELECT jsonb_agg(jsonb_build_object('name', category, 'value', value) ORDER BY value DESC, category)
        FROM (
          SELECT category, count(*)::bigint AS value
          FROM public.providers
          WHERE lower(trim(coalesce(status, ''))) = 'active'
          GROUP BY category
        ) AS category_summary
      ), '[]'::jsonb)
    ),
    'featuredProviders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', p.id,
        'providerCode', p.provider_code,
        'providerName', p.provider_name,
        'category', p.category,
        'ownership', p.ownership,
        'lga', p.lga,
        'state', p.state,
        'services', COALESCE((SELECT array_agg(ps.service_name ORDER BY ps.service_name) FROM public.provider_services ps WHERE ps.provider_id = p.id), ARRAY[]::text[])
      ) ORDER BY p.provider_name)
      FROM (
        SELECT p.*
        FROM public.providers p
        WHERE lower(trim(coalesce(p.status, ''))) = 'active'
        ORDER BY p.provider_name
        LIMIT 6
      ) AS p
    ), '[]'::jsonb),
    'lastUpdated', v_last_updated
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_public_provider_directory(
  p_search text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_service text DEFAULT NULL,
  p_limit integer DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  ownership text,
  lga text,
  state text,
  services text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    p.id,
    p.provider_code,
    p.provider_name,
    p.category,
    p.ownership,
    p.lga,
    p.state,
    COALESCE((SELECT array_agg(ps.service_name ORDER BY ps.service_name) FROM public.provider_services ps WHERE ps.provider_id = p.id), ARRAY[]::text[])
  FROM public.providers p
  WHERE lower(trim(coalesce(p.status, ''))) = 'active'
    AND (nullif(trim(p_search), '') IS NULL OR p.provider_name ILIKE '%' || trim(p_search) || '%' OR p.provider_code ILIKE '%' || trim(p_search) || '%' OR p.lga ILIKE '%' || trim(p_search) || '%')
    AND (nullif(trim(p_lga), '') IS NULL OR lower(trim(p.lga)) = lower(trim(p_lga)))
    AND (nullif(trim(p_category), '') IS NULL OR p.category = upper(trim(p_category)))
    AND (nullif(trim(p_service), '') IS NULL OR EXISTS (SELECT 1 FROM public.provider_services ps WHERE ps.provider_id = p.id AND ps.service_name = p_service))
  ORDER BY p.provider_name
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 24), 1), 100);
$$;

CREATE TABLE IF NOT EXISTS public.public_portal_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  category text NOT NULL,
  complainant_name text,
  contact_phone text,
  contact_email text,
  lga text,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name text,
  description text NOT NULL,
  incident_date date,
  preferred_contact_method text,
  status text NOT NULL DEFAULT 'Submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_portal_complaints ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_portal_complaints FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nmis_public_submit_complaint(
  p_category text,
  p_complainant_name text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_incident_date date DEFAULT NULL,
  p_preferred_contact_method text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_reference text;
  v_provider_name text;
BEGIN
  IF nullif(trim(coalesce(p_category, '')), '') IS NULL THEN RAISE EXCEPTION 'Complaint category is required'; END IF;
  IF nullif(trim(coalesce(p_description, '')), '') IS NULL OR length(trim(p_description)) < 10 THEN RAISE EXCEPTION 'Please provide a complaint description of at least 10 characters'; END IF;
  IF nullif(trim(coalesce(p_contact_phone, '')), '') IS NULL AND nullif(trim(coalesce(p_contact_email, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Provide a phone number or email address so the Commission can follow up';
  END IF;
  IF p_contact_email IS NOT NULL AND p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RAISE EXCEPTION 'Enter a valid email address'; END IF;

  IF p_provider_id IS NOT NULL THEN
    SELECT provider_name INTO v_provider_name FROM public.providers WHERE id = p_provider_id AND lower(trim(coalesce(status, ''))) = 'active';
    IF v_provider_name IS NULL THEN RAISE EXCEPTION 'The selected provider is not available in the public directory'; END IF;
  END IF;

  v_reference := 'ODCHC-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
  INSERT INTO public.public_portal_complaints (
    reference_number, category, complainant_name, contact_phone, contact_email, lga, provider_id, provider_name, description, incident_date, preferred_contact_method
  ) VALUES (
    v_reference, trim(p_category), nullif(trim(p_complainant_name), ''), nullif(trim(p_contact_phone), ''), nullif(trim(p_contact_email), ''), nullif(trim(p_lga), ''), p_provider_id, v_provider_name, trim(p_description), p_incident_date, nullif(trim(p_preferred_contact_method), '')
  );

  RETURN jsonb_build_object('referenceNumber', v_reference, 'status', 'Submitted', 'submittedAt', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_public_track_complaint(p_reference text)
RETURNS TABLE(reference_number text, category text, provider_name text, status text, submitted_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT reference_number, category, provider_name, status, created_at
  FROM public.public_portal_complaints
  WHERE upper(reference_number) = upper(trim(p_reference));
$$;

REVOKE ALL ON FUNCTION public.nmis_public_portal_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_public_provider_directory(text, text, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_public_submit_complaint(text, text, text, text, text, uuid, text, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_public_track_complaint(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_public_portal_snapshot() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_public_provider_directory(text, text, text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_public_submit_complaint(text, text, text, text, text, uuid, text, date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_public_track_complaint(text) TO anon, authenticated;
