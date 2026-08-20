BEGIN;

CREATE OR REPLACE FUNCTION public.nmis_get_structured_inspection(p_inspection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_inspection jsonb;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector','finance']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection access is restricted';
  END IF;

  SELECT to_jsonb(i) INTO v_inspection
  FROM public.inspections i
  WHERE i.id = p_inspection_id;

  IF v_inspection IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'inspection', v_inspection,
    'facility_profile', COALESCE((SELECT to_jsonb(f) FROM public.inspection_facility_profiles f WHERE f.inspection_id = p_inspection_id), '{}'::jsonb),
    'eligibility', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.criterion_code) FROM public.inspection_eligibility_responses e WHERE e.inspection_id = p_inspection_id), '[]'::jsonb),
    'responses', COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'item_code', r.item_code,
      'response_number', r.response_number,
      'response_boolean', r.response_boolean,
      'manual_score', r.manual_score,
      'observed_count', r.observed_count,
      'awarded_points', r.awarded_points,
      'included_in_denominator', r.included_in_denominator,
      'remark', r.remark
    ) ORDER BY i.sort_order) FROM public.inspection_responses r JOIN public.inspection_template_items i ON i.id = r.item_id WHERE r.inspection_id = p_inspection_id), '[]'::jsonb),
    'team', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.sort_order) FROM public.inspection_team_members m WHERE m.inspection_id = p_inspection_id), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_get_structured_inspection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_get_structured_inspection(uuid) TO authenticated;

COMMIT;
