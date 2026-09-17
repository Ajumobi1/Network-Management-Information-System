-- Add total_count to secure register contracts and introduce register aggregate functions.

DROP FUNCTION IF EXISTS public.nmis_list_enrollee_register(text, text, text, text, text, text, text, uuid, text, integer, integer, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.nmis_list_financial_register(text, integer, integer, text, text, text, uuid, text, text, text, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.nmis_list_enrollee_register(
  p_search text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_senatorial_district text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50000,
  p_sort text DEFAULT 'policy_number',
  p_sort_direction text DEFAULT 'asc'
)
RETURNS TABLE(
  id uuid,
  policy_number text,
  category text,
  sector text,
  first_name text,
  last_name text,
  gender text,
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
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance', 'claims']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  IF p_offset < 0 OR p_page_size < 1 OR p_page_size > 50000 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;
  IF p_sort NOT IN ('policy_number', 'beneficiary', 'provider_name', 'lga', 'period') THEN
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
    count(*) OVER() as total_count
  FROM public.enrollees e
  WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_sector IS NULL OR e.sector = p_sector)
    AND (p_category IS NULL OR e.category = p_category)
    AND (p_gender IS NULL OR e.gender = p_gender)
    AND (p_state IS NULL OR e.state = p_state)
    AND (p_lga IS NULL OR e.lga = p_lga)
    AND (p_senatorial_district IS NULL OR e.senatorial_district = p_senatorial_district)
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
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
    e.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_enrollee_register_aggregates(
  p_search text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_senatorial_district text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
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
  female_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance', 'claims']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint AS total_count,
    sum(CASE WHEN e.sector = 'formal' THEN 1 ELSE 0 END)::bigint AS formal_count,
    sum(CASE WHEN e.sector = 'informal' THEN 1 ELSE 0 END)::bigint AS informal_count,
    sum(CASE WHEN e.category = 'principal' THEN 1 ELSE 0 END)::bigint AS principal_count,
    sum(CASE WHEN e.category = 'dependant' THEN 1 ELSE 0 END)::bigint AS dependant_count,
    sum(CASE WHEN e.gender = 'male' THEN 1 ELSE 0 END)::bigint AS male_count,
    sum(CASE WHEN e.gender = 'female' THEN 1 ELSE 0 END)::bigint AS female_count
  FROM public.enrollees e
  WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_sector IS NULL OR e.sector = p_sector)
    AND (p_category IS NULL OR e.category = p_category)
    AND (p_gender IS NULL OR e.gender = p_gender)
    AND (p_state IS NULL OR e.state = p_state)
    AND (p_lga IS NULL OR e.lga = p_lga)
    AND (p_senatorial_district IS NULL OR e.senatorial_district = p_senatorial_district)
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
    AND (p_period IS NULL OR e.period = p_period)
    AND (p_year IS NULL OR e.reporting_year = p_year)
    AND (p_month IS NULL OR e.reporting_month = p_month);
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_list_financial_register(
  p_data_type text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_facility_type text DEFAULT NULL,
  p_ownership text DEFAULT NULL,
  p_claims_category text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50000
)
RETURNS TABLE(
  id uuid,
  provider_id uuid,
  provider_code text,
  provider_name text,
  facility_type text,
  ownership text,
  state text,
  lga text,
  reporting_year integer,
  reporting_month integer,
  period text,
  data_type text,
  claims_category text,
  amount_submitted numeric,
  amount_claimed numeric,
  amount_approved numeric,
  amount_paid numeric,
  net_amount_paid numeric,
  claim_count integer,
  encounter_count integer,
  eligible_lives integer,
  source_file text,
  import_batch_id uuid,
  record_status text,
  fingerprint text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT (public.nmis_has_any_role(ARRAY['finance']) OR (public.is_admin() AND public.nmis_has_aal2())) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  IF p_offset < 0 OR p_page_size < 1 OR p_page_size > 50000 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  RETURN QUERY
  SELECT
    f.id, f.provider_id, f.provider_code, f.provider_name, f.facility_type,
    f.ownership, f.state, f.lga, f.reporting_year, f.reporting_month, f.period,
    f.data_type, f.claims_category, f.amount_submitted, f.amount_claimed,
    f.amount_approved, f.amount_paid, f.net_amount_paid, f.claim_count,
    f.encounter_count, f.eligible_lives, f.source_file, f.import_batch_id,
    f.record_status, f.fingerprint, f.created_at, f.updated_at,
    count(*) OVER() as total_count
  FROM public.financial_records f
  WHERE (p_data_type IS NULL OR f.data_type = p_data_type)
    AND (p_year IS NULL OR f.reporting_year = p_year)
    AND (p_month IS NULL OR f.reporting_month = p_month)
    AND (p_period IS NULL OR f.period = p_period)
    AND (p_state IS NULL OR f.state = p_state)
    AND (p_lga IS NULL OR f.lga = p_lga)
    AND (p_provider_id IS NULL OR f.provider_id = p_provider_id)
    AND (p_facility_type IS NULL OR f.facility_type = p_facility_type)
    AND (p_ownership IS NULL OR f.ownership = p_ownership)
    AND (p_claims_category IS NULL OR f.claims_category = p_claims_category)
    AND (p_status IS NULL OR f.record_status = p_status)
    AND (p_search IS NULL OR lower(concat_ws(' ', f.provider_name, f.provider_code, f.state, f.lga, f.period, f.data_type, f.claims_category)) LIKE '%' || lower(trim(p_search)) || '%')
  ORDER BY f.period DESC, lower(f.provider_name), f.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_enrollee_register_aggregates(text, text, text, text, text, text, text, uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_list_enrollee_register(text, text, text, text, text, text, text, uuid, text, integer, integer, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_list_financial_register(text, integer, integer, text, text, text, uuid, text, text, text, text, text, integer, integer) TO authenticated;
