-- Create secure count RPC for provider directory matching exact filters
CREATE OR REPLACE FUNCTION public.nmis_count_provider_directory(
  p_search text DEFAULT NULL::text, 
  p_state text DEFAULT NULL::text, 
  p_lga text DEFAULT NULL::text, 
  p_category text DEFAULT NULL::text, 
  p_ownership text DEFAULT NULL::text, 
  p_status text DEFAULT NULL::text, 
  p_contract_status text DEFAULT NULL::text, 
  p_credential_status text DEFAULT NULL::text, 
  p_inspection_status text DEFAULT NULL::text, 
  p_capitation_status text DEFAULT NULL::text
)
RETURNS bigint
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  RETURN (
    SELECT count(*)
    FROM public.providers p
    WHERE (p_search IS NULL OR lower(concat_ws(' ', p.provider_code, p.provider_name, p.category, p.subcategory, p.ownership, p.state, p.lga)) LIKE '%' || lower(trim(p_search)) || '%')
      AND (p_state IS NULL OR p.state = p_state)
      AND (p_lga IS NULL OR p.lga = p_lga)
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_ownership IS NULL OR p.ownership = p_ownership)
      AND (p_status IS NULL OR p.status = p_status)
      AND (p_contract_status IS NULL OR p.contract_status = p_contract_status)
      AND (p_credential_status IS NULL OR p.credential_status = p_credential_status)
      AND (p_inspection_status IS NULL OR p.inspection_status = p_inspection_status)
      AND (p_capitation_status IS NULL OR p.capitation_status = p_capitation_status)
  );
END;
$function$;
