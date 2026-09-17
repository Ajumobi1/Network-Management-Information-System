CREATE OR REPLACE FUNCTION public.nmis_list_complaints(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  provider_id uuid,
  provider_name text,
  provider_code text,
  title text,
  category text,
  priority text,
  status text,
  description text,
  resolution_notes text,
  assigned_to text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector','finance','claims']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaints';
  END IF;

  RETURN QUERY
  SELECT c.id, c.provider_id, p.provider_name::text, p.provider_code::text,
         c.title, c.category, c.priority, c.status, c.description,
         c.resolution_notes, c.assigned_to, c.created_at, c.updated_at
  FROM public.provider_complaints c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_priority IS NULL OR c.priority = p_priority)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.title, c.description, p.provider_name, p.provider_code, c.assigned_to)) LIKE '%' || lower(trim(p_search)) || '%')
  ORDER BY c.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_list_inspections(p_provider_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_inspections jsonb;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','head-of-network','network-officer','inspector','finance','executive']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection records';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'provider_id', i.provider_id,
    'provider_name', COALESCE(p.provider_name, 'Provider Facility'),
    'provider_code', COALESCE(p.provider_code, 'NMIS-FAC'),
    'inspection_type', i.inspection_type,
    'scheduled_date', i.scheduled_date,
    'inspector_name', i.inspector_name,
    'status', i.status,
    'score', i.score,
    'rating', i.rating,
    'findings', i.findings,
    'corrective_actions', i.corrective_actions,
    'created_at', i.created_at
  ) ORDER BY i.scheduled_date DESC, i.created_at DESC), '[]'::jsonb)
  INTO v_inspections
  FROM public.inspections i
  LEFT JOIN public.providers p ON p.id = i.provider_id
  WHERE p_provider_id IS NULL OR i.provider_id = p_provider_id;

  RETURN v_inspections;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_list_complaints(text,text,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_list_inspections(uuid) TO authenticated;
