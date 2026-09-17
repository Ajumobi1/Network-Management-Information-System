-- Resolve function ambiguity by dropping both versions and recreating the definitive one.

DROP FUNCTION IF EXISTS public.nmis_list_enrollee_register(text, text, text, text, text, text, text, text, text, integer, integer, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.nmis_list_enrollee_register(text, text, text, text, text, text, text, uuid, text, integer, integer, integer, integer, text, text);

CREATE OR REPLACE FUNCTION public.nmis_list_enrollee_register(
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
  p_month integer DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 15,
  p_sort text DEFAULT 'policy_number',
  p_sort_direction text DEFAULT 'asc'
)
RETURNS TABLE (
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance', 'claims']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_offset < 0 OR p_page_size < 1 OR p_page_size > 50000 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  IF p_sort NOT IN ('policy_number', 'beneficiary', 'provider_name', 'lga', 'period', 'gender', 'category', 'sector', 'senatorial_district') THEN
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
    AND (p_provider_id IS NULL OR e.provider_id = (p_provider_id)::uuid)
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
    CASE WHEN p_sort = 'category' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.category END ASC,
    CASE WHEN p_sort = 'category' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.category END DESC,
    CASE WHEN p_sort = 'sector' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.sector END ASC,
    CASE WHEN p_sort = 'sector' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.sector END DESC,
    CASE WHEN p_sort = 'senatorial_district' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.senatorial_district END ASC,
    CASE WHEN p_sort = 'senatorial_district' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.senatorial_district END DESC,
    e.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_list_enrollee_register(text, text, text, text, text, text, text, text, text, integer, integer, integer, integer, text, text) TO authenticated;
