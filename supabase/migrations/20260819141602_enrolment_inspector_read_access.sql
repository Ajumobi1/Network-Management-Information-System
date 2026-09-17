-- Allow authenticated inspectors to use the read-only population contracts required by
-- the Quality & Compliance workflow. This changes authorization only; it does not
-- alter enrollee rows, provider IDs, periods, fingerprints, or imported data.

CREATE OR REPLACE FUNCTION public.nmis_list_enrollee_register(
  p_search text DEFAULT NULL::text,
  p_sector text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_gender text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_senatorial_district text DEFAULT NULL::text,
  p_provider_id text DEFAULT NULL::text,
  p_period text DEFAULT NULL::text,
  p_year integer DEFAULT NULL::integer,
  p_month integer DEFAULT NULL::integer,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_sort text DEFAULT 'policy_number'::text,
  p_sort_direction text DEFAULT 'asc'::text
)
RETURNS TABLE(
  id uuid,
  policy_number text,
  category text,
  sector text,
  first_name text,
  last_name text,
  gender text,
  age integer,
  phone_number text,
  provider_id uuid,
  provider_code text,
  provider_name text,
  facility_type text,
  ownership text,
  lga text,
  state text,
  senatorial_district text,
  reporting_year integer,
  reporting_month integer,
  period text,
  source_file text,
  import_batch_id uuid,
  source_row integer,
  record_status text,
  fingerprint text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
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

  IF p_offset < 0 OR p_page_size < 1 OR p_page_size > 50000 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  IF p_sort NOT IN (
    'policy_number', 'beneficiary', 'provider_name', 'lga', 'period',
    'gender', 'age', 'category', 'sector', 'senatorial_district'
  ) THEN
    RAISE EXCEPTION 'INVALID_SORT';
  END IF;

  IF lower(coalesce(p_sort_direction, 'asc')) NOT IN ('asc', 'desc') THEN
    RAISE EXCEPTION 'INVALID_SORT_DIRECTION';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.policy_number,
    e.category,
    e.sector,
    e.first_name,
    e.last_name,
    e.gender,
    e.age,
    e.phone_number,
    e.provider_id,
    e.provider_code,
    e.provider_name,
    e.facility_type,
    e.ownership,
    e.lga,
    e.state,
    e.senatorial_district,
    e.reporting_year,
    e.reporting_month,
    e.period,
    e.source_file,
    e.import_batch_id,
    e.source_row,
    e.record_status,
    e.fingerprint,
    e.created_at,
    e.updated_at,
    count(*) OVER() AS total_count
  FROM public.enrollees e
  WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_sector IS NULL OR lower(trim(e.sector)) = lower(trim(p_sector)))
    AND (p_category IS NULL OR lower(trim(e.category)) = lower(trim(p_category)))
    AND (p_gender IS NULL OR lower(trim(e.gender)) = lower(trim(p_gender)))
    AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
    AND (p_senatorial_district IS NULL OR lower(trim(e.senatorial_district)) = lower(trim(p_senatorial_district)))
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id::uuid)
    AND (p_period IS NULL OR e.period = p_period)
    AND (p_year IS NULL OR e.reporting_year = p_year)
    AND (p_month IS NULL OR e.reporting_month = p_month)
  ORDER BY
    CASE WHEN p_sort = 'policy_number' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.policy_number END ASC,
    CASE WHEN p_sort = 'policy_number' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.policy_number END DESC,
    CASE WHEN p_sort = 'beneficiary' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN lower(e.first_name || ' ' || e.last_name) END ASC,
    CASE WHEN p_sort = 'beneficiary' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN lower(e.first_name || ' ' || e.last_name) END DESC,
    CASE WHEN p_sort = 'provider_name' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN lower(e.provider_name) END ASC,
    CASE WHEN p_sort = 'provider_name' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN lower(e.provider_name) END DESC,
    CASE WHEN p_sort = 'lga' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN lower(e.lga) END ASC,
    CASE WHEN p_sort = 'lga' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN lower(e.lga) END DESC,
    CASE WHEN p_sort = 'period' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.period END ASC,
    CASE WHEN p_sort = 'period' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.period END DESC,
    CASE WHEN p_sort = 'gender' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.gender END ASC,
    CASE WHEN p_sort = 'gender' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.gender END DESC,
    CASE WHEN p_sort = 'age' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.age END ASC NULLS LAST,
    CASE WHEN p_sort = 'age' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.age END DESC NULLS LAST,
    CASE WHEN p_sort = 'category' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.category END ASC,
    CASE WHEN p_sort = 'category' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.category END DESC,
    CASE WHEN p_sort = 'sector' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.sector END ASC,
    CASE WHEN p_sort = 'sector' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.sector END DESC,
    CASE WHEN p_sort = 'senatorial_district' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.senatorial_district END ASC,
    CASE WHEN p_sort = 'senatorial_district' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.senatorial_district END DESC,
    e.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.nmis_get_enrollee_detail(p_enrollee_id uuid)
RETURNS TABLE(
  id uuid,
  policy_number text,
  category text,
  sector text,
  first_name text,
  last_name text,
  gender text,
  age integer,
  phone_number text,
  provider_id uuid,
  provider_code text,
  provider_name text,
  facility_type text,
  ownership text,
  lga text,
  state text,
  senatorial_district text,
  reporting_year integer,
  reporting_month integer,
  period text,
  source_file text,
  import_batch_id uuid,
  source_row integer,
  record_status text,
  fingerprint text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  IF p_enrollee_id IS NULL OR NOT COALESCE(public.nmis_has_any_role(ARRAY[
    'super-admin', 'executive', 'head-of-network', 'network-officer',
    'inspector', 'finance', 'claims', 'customer-service'
  ]), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  RETURN QUERY
  SELECT
    e.id, e.policy_number, e.category, e.sector, e.first_name, e.last_name,
    e.gender, e.age, e.phone_number, e.provider_id, e.provider_code,
    e.provider_name, e.facility_type, e.ownership, e.lga, e.state,
    e.senatorial_district, e.reporting_year, e.reporting_month, e.period,
    e.source_file, e.import_batch_id, e.source_row, e.record_status,
    e.fingerprint, e.created_at, e.updated_at
  FROM public.enrollees e
  WHERE e.id = p_enrollee_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.nmis_get_enrolment_analytics(
  p_search text DEFAULT NULL::text,
  p_sector text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_gender text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_senatorial_district text DEFAULT NULL::text,
  p_provider_id text DEFAULT NULL::text,
  p_period text DEFAULT NULL::text,
  p_year integer DEFAULT NULL::integer,
  p_month integer DEFAULT NULL::integer
)
RETURNS TABLE(
  total_count bigint,
  formal_count bigint,
  informal_count bigint,
  principal_count bigint,
  dependant_count bigint,
  male_count bigint,
  female_count bigint,
  provider_count bigint,
  lga_count bigint,
  senatorial_district_count bigint,
  capitation_rate numeric,
  capitation_expenditure numeric,
  financial_expenditure numeric,
  financial_record_count bigint,
  pepm numeric,
  monthly_trend jsonb,
  pepm_trend jsonb,
  by_sector jsonb,
  by_category jsonb,
  by_gender jsonb,
  by_state jsonb,
  by_lga jsonb,
  by_senatorial_district jsonb,
  top_facilities jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_year integer := p_year;
  v_month integer := p_month;
  v_capitation_rate numeric := 750;
  v_provider_uuid uuid;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY[
    'super-admin', 'executive', 'head-of-network', 'network-officer',
    'inspector', 'finance', 'claims', 'customer-service', 'provider'
  ]), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_provider_id IS NOT NULL AND p_provider_id <> '' AND p_provider_id <> 'all' THEN
    BEGIN
      v_provider_uuid := p_provider_id::uuid;
    EXCEPTION WHEN others THEN
      v_provider_uuid := NULL;
    END;
  END IF;

  IF p_period IS NULL AND v_year IS NULL AND v_month IS NULL THEN
    SELECT e.reporting_year, e.reporting_month INTO v_year, v_month
    FROM public.enrollees e
    WHERE e.reporting_year IS NOT NULL AND e.reporting_month BETWEEN 1 AND 12
    ORDER BY e.reporting_year DESC, e.reporting_month DESC
    LIMIT 1;
  END IF;

  SELECT COALESCE(rate, 750) INTO v_capitation_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee' AND active = true;

  RETURN QUERY
  WITH filtered_enrollees AS (
    SELECT e.*
    FROM public.enrollees e
    WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
      AND (p_sector IS NULL OR e.sector = p_sector)
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_gender IS NULL OR e.gender = p_gender)
      AND (p_state IS NULL OR e.state = p_state)
      AND (p_lga IS NULL OR e.lga = p_lga)
      AND (p_senatorial_district IS NULL OR e.senatorial_district = p_senatorial_district)
      AND (v_provider_uuid IS NULL OR e.provider_id = v_provider_uuid)
      AND (p_period IS NULL OR e.period = p_period)
      AND (p_period IS NOT NULL OR v_year IS NULL OR e.reporting_year = v_year)
      AND (p_period IS NOT NULL OR v_month IS NULL OR e.reporting_month = v_month)
  ),
  base_counts AS (
    SELECT
      count(*)::bigint AS total,
      count(*) FILTER (WHERE lower(trim(sector)) = 'formal')::bigint AS formal,
      count(*) FILTER (WHERE lower(trim(sector)) = 'informal')::bigint AS informal,
      count(*) FILTER (WHERE lower(trim(category)) = 'principal')::bigint AS principal,
      count(*) FILTER (WHERE lower(trim(category)) = 'dependant')::bigint AS dependant,
      count(*) FILTER (WHERE lower(trim(gender)) = 'male')::bigint AS male,
      count(*) FILTER (WHERE lower(trim(gender)) = 'female')::bigint AS female,
      count(DISTINCT provider_id)::bigint AS providers,
      count(DISTINCT lga)::bigint AS lgas,
      count(DISTINCT senatorial_district)::bigint AS districts
    FROM filtered_enrollees
  )
  SELECT
    c.total, c.formal, c.informal, c.principal, c.dependant,
    c.male, c.female, c.providers, c.lgas, c.districts,
    v_capitation_rate,
    (c.total * v_capitation_rate)::numeric,
    0::numeric,
    0::bigint,
    0::numeric,
    '[]'::jsonb,
    '[]'::jsonb,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT sector AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY sector ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT category AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY category ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT gender AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY gender ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT state AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY state ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT lga AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY lga ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT senatorial_district AS name, count(*)::int AS value FROM filtered_enrollees WHERE senatorial_district IS NOT NULL GROUP BY senatorial_district ORDER BY value DESC) d),
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT provider_name AS name, count(*)::int AS value FROM filtered_enrollees GROUP BY provider_name ORDER BY value DESC LIMIT 10) d)
  FROM base_counts c;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.nmis_list_enrollee_register(text, text, text, text, text, text, text, text, text, integer, integer, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_enrollee_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_enrolment_analytics(text, text, text, text, text, text, text, text, text, integer, integer) TO authenticated;
