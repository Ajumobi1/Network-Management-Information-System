-- NMIS provider directory repair
-- Restores the fail-closed role helper and fixes the live RPC's return-type
-- mismatch against public.providers (inspection_rating is text and
-- last_inspection_date is date).

CREATE OR REPLACE FUNCTION public.nmis_has_any_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  RETURN COALESCE(v_role = ANY(allowed_roles), false);
END;
$$;

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.providers;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.enrollees;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.financial_records;

REVOKE SELECT ON public.providers FROM anon, authenticated;
REVOKE SELECT ON public.enrollees FROM anon, authenticated;
REVOKE SELECT ON public.financial_records FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.nmis_list_provider_directory(
  text, text, text, text, text, text, text, text, text, text, integer, integer, text
);

CREATE FUNCTION public.nmis_list_provider_directory(
  p_search text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_ownership text DEFAULT NULL::text,
  p_status text DEFAULT NULL::text,
  p_contract_status text DEFAULT NULL::text,
  p_credential_status text DEFAULT NULL::text,
  p_inspection_status text DEFAULT NULL::text,
  p_capitation_status text DEFAULT NULL::text,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_sort text DEFAULT 'provider_name'::text
)
RETURNS TABLE(
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  subcategory text,
  ownership text,
  state text,
  lga text,
  status text,
  contract_status text,
  credential_status text,
  inspection_status text,
  capitation_status text,
  inspection_rating text,
  last_inspection_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY[
    'super-admin', 'executive', 'head-of-network', 'network-officer',
    'inspector', 'finance', 'claims', 'customer-service', 'provider'
  ]), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_page_size < 1 OR p_page_size > 1000 OR p_offset < 0 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  IF p_sort NOT IN ('provider_name', 'provider_code', 'state', 'lga', 'category', 'status') THEN
    RAISE EXCEPTION 'INVALID_SORT';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.provider_code,
    p.provider_name,
    p.category,
    p.subcategory,
    p.ownership,
    p.state,
    p.lga,
    p.status,
    p.contract_status,
    p.credential_status,
    p.inspection_status,
    p.capitation_status,
    p.inspection_rating,
    p.last_inspection_date
  FROM public.providers AS p
  WHERE (p_search IS NULL OR lower(concat_ws(' ', p.provider_code, p.provider_name, p.category, p.subcategory, p.ownership, p.state, p.lga)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_state IS NULL OR lower(trim(p.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(p.lga)) = lower(trim(p_lga)))
    AND (p_category IS NULL OR lower(trim(p.category)) = lower(trim(p_category)))
    AND (p_ownership IS NULL OR lower(trim(p.ownership)) = lower(trim(p_ownership)))
    AND (p_status IS NULL OR lower(trim(p.status)) = lower(trim(p_status)))
    AND (p_contract_status IS NULL OR lower(trim(p.contract_status)) = lower(trim(p_contract_status)))
    AND (p_credential_status IS NULL OR lower(trim(p.credential_status)) = lower(trim(p_credential_status)))
    AND (p_inspection_status IS NULL OR lower(trim(p.inspection_status)) = lower(trim(p_inspection_status)))
    AND (p_capitation_status IS NULL OR lower(trim(p.capitation_status)) = lower(trim(p_capitation_status)))
  ORDER BY
    CASE WHEN p_sort = 'provider_name' THEN lower(p.provider_name) END,
    CASE WHEN p_sort = 'provider_code' THEN lower(p.provider_code) END,
    CASE WHEN p_sort = 'state' THEN lower(p.state) END,
    CASE WHEN p_sort = 'lga' THEN lower(p.lga) END,
    CASE WHEN p_sort = 'category' THEN lower(p.category) END,
    CASE WHEN p_sort = 'status' THEN lower(p.status) END,
    p.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_provider_directory(
  text, text, text, text, text, text, text, text, text, text, integer, integer, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_provider_directory(
  text, text, text, text, text, text, text, text, text, text, integer, integer, text
) TO authenticated, service_role;
