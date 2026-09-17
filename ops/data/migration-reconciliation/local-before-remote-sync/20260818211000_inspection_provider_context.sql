CREATE OR REPLACE FUNCTION public.nmis_list_inspections(
  p_provider_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_inspections jsonb;
BEGIN
  v_role := public.nmis_current_role();
  IF NOT COALESCE(v_role = ANY(ARRAY['super-admin','head-of-network','network-officer','inspector','finance','executive']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection records';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'provider_id', i.provider_id,
    'provider_name', COALESCE(p.facility_name, 'Provider Facility'),
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

GRANT EXECUTE ON FUNCTION public.nmis_list_inspections(uuid) TO authenticated;
