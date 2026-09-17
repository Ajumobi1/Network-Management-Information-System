CREATE OR REPLACE FUNCTION public.nmis_list_inspections(
  p_provider_id uuid DEFAULT NULL
)
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

CREATE OR REPLACE FUNCTION public.nmis_get_inspection_checklist(p_inspection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector','finance']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection checklist';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id,
      'inspection_id', c.inspection_id,
      'category', c.category,
      'item', c.item_name,
      'completed', lower(c.status) IN ('compliant','completed','passed'),
      'comments', c.notes
    ) ORDER BY c.category, c.item_name)
    FROM public.inspection_checklists c
    WHERE c.inspection_id = p_inspection_id
  ), '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_list_inspections(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_inspection_checklist(uuid) TO authenticated;
