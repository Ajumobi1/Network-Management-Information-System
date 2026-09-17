-- Lightweight, allow-listed filter metadata for the Enrolment Register.
-- No beneficiary rows are returned and no data is modified.

CREATE OR REPLACE FUNCTION public.nmis_get_enrolment_filter_options()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY[
    'super-admin', 'executive', 'head-of-network', 'network-officer',
    'inspector', 'finance', 'claims', 'customer-service'
  ]), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  RETURN jsonb_build_object(
    'periods', COALESCE((
      SELECT jsonb_agg(d.period ORDER BY d.period DESC)
      FROM (SELECT DISTINCT e.period FROM public.enrollees e WHERE e.period IS NOT NULL AND e.period <> '') d
    ), '[]'::jsonb),
    'states', COALESCE((
      SELECT jsonb_agg(d.state ORDER BY d.state ASC)
      FROM (SELECT DISTINCT e.state FROM public.enrollees e WHERE e.state IS NOT NULL AND e.state <> '') d
    ), '[]'::jsonb),
    'lgas', COALESCE((
      SELECT jsonb_agg(d.lga ORDER BY d.lga ASC)
      FROM (SELECT DISTINCT e.lga FROM public.enrollees e WHERE e.lga IS NOT NULL AND e.lga <> '') d
    ), '[]'::jsonb),
    'districts', COALESCE((
      SELECT jsonb_agg(d.senatorial_district ORDER BY d.senatorial_district ASC)
      FROM (SELECT DISTINCT e.senatorial_district FROM public.enrollees e WHERE e.senatorial_district IS NOT NULL AND e.senatorial_district <> '') d
    ), '[]'::jsonb),
    'providers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', d.provider_id::text, 'name', d.provider_name) ORDER BY d.provider_name ASC)
      FROM (
        SELECT DISTINCT e.provider_id, e.provider_name
        FROM public.enrollees e
        WHERE e.provider_id IS NOT NULL AND e.provider_name IS NOT NULL AND e.provider_name <> ''
      ) d
    ), '[]'::jsonb)
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.nmis_get_enrolment_filter_options() TO authenticated;
