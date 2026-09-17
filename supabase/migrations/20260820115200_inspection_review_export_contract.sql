BEGIN;

CREATE OR REPLACE FUNCTION public.nmis_refresh_inspection_score_split()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_inspection_id uuid := COALESCE(NEW.inspection_id, OLD.inspection_id);
  v_breakdown jsonb;
BEGIN
  IF v_inspection_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  v_breakdown := public.nmis_compute_inspection_score_breakdown(v_inspection_id);
  UPDATE public.inspections
  SET credentialing_points = COALESCE((v_breakdown ->> 'credentialing_points')::numeric, 0),
      credentialing_possible = COALESCE((v_breakdown ->> 'credentialing_possible')::numeric, 0),
      accreditation_points = COALESCE((v_breakdown ->> 'accreditation_points')::numeric, 0),
      accreditation_possible = COALESCE((v_breakdown ->> 'accreditation_possible')::numeric, 0),
      updated_at = now()
  WHERE id = v_inspection_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_inspection_score_split ON public.inspection_responses;
CREATE TRIGGER trg_refresh_inspection_score_split AFTER INSERT OR UPDATE OR DELETE ON public.inspection_responses FOR EACH ROW EXECUTE FUNCTION public.nmis_refresh_inspection_score_split();

UPDATE public.inspections inspection
SET credentialing_points = COALESCE((public.nmis_compute_inspection_score_breakdown(inspection.id) ->> 'credentialing_points')::numeric, 0),
    credentialing_possible = COALESCE((public.nmis_compute_inspection_score_breakdown(inspection.id) ->> 'credentialing_possible')::numeric, 0),
    accreditation_points = COALESCE((public.nmis_compute_inspection_score_breakdown(inspection.id) ->> 'accreditation_points')::numeric, 0),
    accreditation_possible = COALESCE((public.nmis_compute_inspection_score_breakdown(inspection.id) ->> 'accreditation_possible')::numeric, 0);

CREATE OR REPLACE FUNCTION public.nmis_get_structured_inspection(p_inspection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_inspection jsonb;
  v_template_id uuid;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector','finance']), false) THEN RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection access is restricted'; END IF;
  SELECT to_jsonb(i), i.template_id INTO v_inspection, v_template_id FROM public.inspections i WHERE i.id = p_inspection_id;
  IF v_inspection IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'inspection', v_inspection,
    'score_breakdown', public.nmis_compute_inspection_score_breakdown(p_inspection_id),
    'template', jsonb_build_object(
      'facility_type', (SELECT jsonb_build_object('code', ft.code, 'name', ft.name) FROM public.inspection_facility_types ft JOIN public.inspection_templates t ON t.facility_type_code = ft.code WHERE t.id = v_template_id),
      'template', (SELECT jsonb_build_object('id', t.id, 'code', t.code, 'name', t.name, 'version', t.version, 'passing_threshold', t.passing_threshold, 'conditional_threshold', t.conditional_threshold, 'facility_type_code', t.facility_type_code, 'facility_profile_fields', COALESCE(t.facility_profile_fields, '[]'::jsonb)) FROM public.inspection_templates t WHERE t.id = v_template_id),
      'sections', COALESCE((SELECT jsonb_agg(jsonb_build_object('section_code', s.section_code, 'section_label', s.section_label, 'description', s.description, 'sort_order', s.sort_order) ORDER BY s.sort_order) FROM public.inspection_template_sections s WHERE s.template_id = v_template_id AND s.active), '[]'::jsonb),
      'eligibility', COALESCE((SELECT jsonb_agg(jsonb_build_object('criterion_code', e.criterion_code, 'criterion_label', e.criterion_label, 'required', e.required, 'sort_order', e.sort_order) ORDER BY e.sort_order) FROM public.inspection_template_eligibility e WHERE e.template_id = v_template_id), '[]'::jsonb),
      'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('section_code', i.section_code, 'item_code', i.item_code, 'item_label', i.item_label, 'response_type', i.response_type, 'min_required', i.min_required, 'max_points', i.max_points, 'scored_when_no', i.scored_when_no, 'manual_score_allowed', i.manual_score_allowed, 'scoring_method', i.scoring_method, 'sort_order', i.sort_order) ORDER BY i.sort_order) FROM public.inspection_template_items i WHERE i.template_id = v_template_id AND i.active), '[]'::jsonb)
    ),
    'facility_profile', COALESCE((SELECT to_jsonb(f) FROM public.inspection_facility_profiles f WHERE f.inspection_id = p_inspection_id), '{}'::jsonb),
    'eligibility', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.criterion_code) FROM public.inspection_eligibility_responses e WHERE e.inspection_id = p_inspection_id), '[]'::jsonb),
    'responses', COALESCE((SELECT jsonb_agg(jsonb_build_object('item_code', r.item_code, 'response_number', r.response_number, 'response_boolean', r.response_boolean, 'observed_count', r.observed_count, 'manual_score', r.manual_score, 'awarded_points', r.awarded_points, 'included_in_denominator', r.included_in_denominator, 'remark', r.remark) ORDER BY i.sort_order) FROM public.inspection_responses r JOIN public.inspection_template_items i ON i.id = r.item_id WHERE r.inspection_id = p_inspection_id), '[]'::jsonb),
    'team', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.sort_order) FROM public.inspection_team_members m WHERE m.inspection_id = p_inspection_id), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_refresh_inspection_score_split() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_structured_inspection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_get_structured_inspection(uuid) TO authenticated;

COMMIT;