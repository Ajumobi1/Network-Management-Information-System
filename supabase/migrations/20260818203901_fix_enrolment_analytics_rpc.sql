CREATE OR REPLACE FUNCTION public.nmis_get_enrolment_analytics(
  p_search text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_senatorial_district text DEFAULT NULL,
  p_provider_id text DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL
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
AS $$
DECLARE
  v_year integer := p_year;
  v_month integer := p_month;
  v_capitation_rate numeric := 750;
  v_provider_uuid uuid;
BEGIN
  -- Handle role check with fallback
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance', 'claims', 'customer-service', 'provider']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  -- Convert provider_id to uuid if possible
  IF p_provider_id IS NOT NULL AND p_provider_id <> '' AND p_provider_id <> 'all' THEN
    BEGIN
      v_provider_uuid := p_provider_id::uuid;
    EXCEPTION WHEN others THEN
      v_provider_uuid := NULL;
    END;
  END IF;

  -- Default to latest period if none specified
  IF p_period IS NULL AND v_year IS NULL AND v_month IS NULL THEN
    SELECT e.reporting_year, e.reporting_month
    INTO v_year, v_month
    FROM public.enrollees e
    WHERE e.reporting_year IS NOT NULL
      AND e.reporting_month BETWEEN 1 AND 12
    ORDER BY e.reporting_year DESC, e.reporting_month DESC
    LIMIT 1;
  END IF;

  -- Get capitation rate from settings
  SELECT COALESCE(rate, 750)
  INTO v_capitation_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee'
    AND active = true;

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
      count(*)::bigint as total,
      count(*) FILTER (WHERE lower(trim(sector)) = 'formal')::bigint as formal,
      count(*) FILTER (WHERE lower(trim(sector)) = 'informal')::bigint as informal,
      count(*) FILTER (WHERE lower(trim(category)) = 'principal')::bigint as principal,
      count(*) FILTER (WHERE lower(trim(category)) = 'dependant')::bigint as dependant,
      count(*) FILTER (WHERE lower(trim(gender)) = 'male')::bigint as male,
      count(*) FILTER (WHERE lower(trim(gender)) = 'female')::bigint as female,
      count(DISTINCT provider_id)::bigint as providers,
      count(DISTINCT lga)::bigint as lgas,
      count(DISTINCT senatorial_district)::bigint as districts
    FROM filtered_enrollees
  )
  SELECT
    c.total,
    c.formal,
    c.informal,
    c.principal,
    c.dependant,
    c.male,
    c.female,
    c.providers,
    c.lgas,
    c.districts,
    v_capitation_rate,
    (c.total * v_capitation_rate)::numeric,
    0::numeric as financial_expenditure,
    0::bigint as financial_record_count,
    0::numeric as pepm,
    '[]'::jsonb as monthly_trend,
    '[]'::jsonb as pepm_trend,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT sector as name, count(*)::int as value FROM filtered_enrollees GROUP BY sector ORDER BY value DESC) d) as by_sector,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT category as name, count(*)::int as value FROM filtered_enrollees GROUP BY category ORDER BY value DESC) d) as by_category,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT gender as name, count(*)::int as value FROM filtered_enrollees GROUP BY gender ORDER BY value DESC) d) as by_gender,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT state as name, count(*)::int as value FROM filtered_enrollees GROUP BY state ORDER BY value DESC) d) as by_state,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT lga as name, count(*)::int as value FROM filtered_enrollees GROUP BY lga ORDER BY value DESC) d) as by_lga,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT senatorial_district as name, count(*)::int as value FROM filtered_enrollees WHERE senatorial_district IS NOT NULL GROUP BY senatorial_district ORDER BY value DESC) d) as by_senatorial_district,
    (SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (SELECT provider_name as name, count(*)::int as value FROM filtered_enrollees GROUP BY provider_name ORDER BY value DESC LIMIT 10) d) as top_facilities
  FROM base_counts c;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_get_enrolment_analytics(text, text, text, text, text, text, text, text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_enrolment_analytics(text, text, text, text, text, text, text, text, text, integer, integer) TO service_role;
