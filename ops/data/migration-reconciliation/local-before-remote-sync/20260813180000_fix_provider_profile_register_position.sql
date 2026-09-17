CREATE OR REPLACE FUNCTION public.nmis_get_provider_operational_profile(p_provider_id uuid)
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
  last_inspection_date date,
  register_position bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF p_provider_id IS NULL OR NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RETURN QUERY
  WITH sorted_register AS (
    SELECT 
      p_inner.id,
      row_number() OVER (ORDER BY p_inner.provider_name ASC) as pos
    FROM public.providers p_inner
  )
  SELECT p.id, p.provider_code, p.provider_name, p.category, p.subcategory,
         p.ownership, p.state, p.lga, p.status, p.contract_status,
         p.credential_status, p.inspection_status, p.capitation_status,
         p.inspection_rating, p.last_inspection_date,
         sr.pos as register_position
  FROM public.providers p
  JOIN sorted_register sr ON sr.id = p.id
  WHERE p.id = p_provider_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_get_provider_operational_profile(uuid) TO authenticated;
