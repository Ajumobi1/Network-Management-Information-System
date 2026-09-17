CREATE OR REPLACE FUNCTION public.nmis_save_structured_inspection(p_inspection_id uuid DEFAULT NULL, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_template public.inspection_templates%ROWTYPE;
  v_item public.inspection_template_items%ROWTYPE;
  v_response jsonb;
  v_id uuid;
  v_mode text := COALESCE(p_payload ->> 'mode', 'draft');
  v_provider_id uuid := NULLIF(p_payload ->> 'provider_id', '')::uuid;
  v_scheduled_date date := COALESCE(NULLIF(p_payload ->> 'scheduled_date', '')::date, CURRENT_DATE);
  v_inspection_type text := COALESCE(NULLIF(p_payload ->> 'inspection_type', ''), 'Facility Accreditation');
  v_inspector_name text := NULLIF(p_payload ->> 'inspector_name', '');
  v_eligibility_met boolean := false;
  v_required_eligibility bigint := 0;
  v_met_eligibility bigint := 0;
  v_total_points numeric(8,2) := 0;
  v_total_possible numeric(8,2) := 0;
  v_overall_score numeric(5,2) := 0;
  v_recommendation text;
  v_response_count bigint := 0;
  v_item_count bigint := 0;
  v_signed_count bigint := 0;
  v_facility jsonb := COALESCE(p_payload -> 'facility_profile', '{}'::jsonb);
  v_manual_score numeric;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin','executive','head-of-network','network-officer','inspector') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection save is restricted';
  END IF;
  SELECT * INTO v_template FROM public.inspection_templates WHERE (code = NULLIF(p_payload ->> 'template_code','') OR facility_type_code = NULLIF(p_payload ->> 'template_code','')) AND active ORDER BY CASE WHEN code = p_payload ->> 'template_code' THEN 0 ELSE 1 END LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEMPLATE_NOT_FOUND'; END IF;
  IF v_provider_id IS NULL THEN RAISE EXCEPTION 'VALIDATION_ERROR: Provider is required'; END IF;

  FOR v_response IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload -> 'responses', '[]'::jsonb)) LOOP
    SELECT * INTO v_item FROM public.inspection_template_items WHERE template_id = v_template.id AND item_code = v_response->>'item_code' AND active;
    IF FOUND AND (v_item.scoring_method = 'manual_only' OR v_item.manual_score_allowed) THEN
      v_manual_score := NULLIF(v_response->>'manual_score', '')::numeric;
      IF v_manual_score IS NOT NULL AND (v_manual_score < 0 OR v_manual_score > v_item.max_points) THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Score for % must be between 0 and %', v_item.item_label, v_item.max_points;
      END IF;
    END IF;
  END LOOP;

  IF p_inspection_id IS NULL THEN
    INSERT INTO public.inspections(provider_id, template_id, inspection_type, scheduled_date, inspector_name, status, workflow_step)
    VALUES (v_provider_id, v_template.id, v_inspection_type, v_scheduled_date, v_inspector_name, CASE WHEN v_mode = 'submit' THEN 'Submitted' ELSE 'Draft' END, COALESCE(p_payload ->> 'step', 'eligibility'))
    RETURNING id INTO v_id;
  ELSE
    v_id := p_inspection_id;
    UPDATE public.inspections SET provider_id = v_provider_id, template_id = v_template.id, inspection_type = v_inspection_type, scheduled_date = v_scheduled_date, inspector_name = v_inspector_name, status = CASE WHEN v_mode = 'submit' THEN 'Submitted' ELSE 'Draft' END, workflow_step = COALESCE(p_payload ->> 'step', workflow_step), updated_at = now() WHERE id = v_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'INSPECTION_NOT_FOUND'; END IF;
  END IF;

  DELETE FROM public.inspection_eligibility_responses WHERE inspection_id = v_id;
  INSERT INTO public.inspection_eligibility_responses(inspection_id, criterion_code, criterion_label, met, notes)
  SELECT v_id, e->>'criterion_code', COALESCE(e->>'criterion_label', t.criterion_label), COALESCE((e->>'met')::boolean, false), NULLIF(e->>'notes', '')
  FROM jsonb_array_elements(COALESCE(p_payload -> 'eligibility', '[]'::jsonb)) e
  LEFT JOIN public.inspection_template_eligibility t ON t.template_id = v_template.id AND t.criterion_code = e->>'criterion_code';

  DELETE FROM public.inspection_facility_profiles WHERE inspection_id = v_id;
  INSERT INTO public.inspection_facility_profiles(inspection_id, facility_name, address, telephone, superintendent_pharmacist, nhia_registered, nhia_registration_no, smoh_pcn_registered, smoh_pcn_registration_no, premises_registration_license_no, cac_registration_no, facility_email, inspection_date, contact_person, facility_account_name, metadata)
  VALUES (v_id, COALESCE(NULLIF(v_facility->>'facility_name', ''), 'Unnamed Facility'), NULLIF(v_facility->>'address', ''), NULLIF(v_facility->>'telephone', ''), NULLIF(v_facility->>'superintendent_pharmacist', ''), NULLIF(v_facility->>'nhia_registered', '')::boolean, NULLIF(v_facility->>'nhia_registration_no', ''), NULLIF(v_facility->>'smoh_pcn_registered', '')::boolean, NULLIF(v_facility->>'smoh_pcn_registration_no', ''), NULLIF(v_facility->>'premises_registration_license_no', ''), NULLIF(v_facility->>'cac_registration_no', ''), NULLIF(v_facility->>'facility_email', ''), NULLIF(v_facility->>'inspection_date', '')::date, NULLIF(v_facility->>'contact_person', ''), NULLIF(v_facility->>'facility_account_name', ''), v_facility)
  ON CONFLICT (inspection_id) DO UPDATE SET facility_name = EXCLUDED.facility_name, address = EXCLUDED.address, telephone = EXCLUDED.telephone, superintendent_pharmacist = EXCLUDED.superintendent_pharmacist, nhia_registered = EXCLUDED.nhia_registered, nhia_registration_no = EXCLUDED.nhia_registration_no, smoh_pcn_registered = EXCLUDED.smoh_pcn_registered, smoh_pcn_registration_no = EXCLUDED.smoh_pcn_registration_no, premises_registration_license_no = EXCLUDED.premises_registration_license_no, cac_registration_no = EXCLUDED.cac_registration_no, facility_email = EXCLUDED.facility_email, inspection_date = EXCLUDED.inspection_date, contact_person = EXCLUDED.contact_person, facility_account_name = EXCLUDED.facility_account_name, metadata = EXCLUDED.metadata, updated_at = now();

  DELETE FROM public.inspection_responses WHERE inspection_id = v_id;
  INSERT INTO public.inspection_responses(inspection_id, item_id, item_code, response_number, response_boolean, observed_count, manual_score, awarded_points, included_in_denominator, remark)
  SELECT v_id, i.id, i.item_code,
         CASE WHEN i.response_type = 'number' THEN NULLIF(r->>'response_number', '')::numeric END,
         CASE WHEN i.response_type = 'boolean' THEN NULLIF(r->>'response_boolean', '')::boolean END,
         CASE WHEN i.scoring_method = 'manual_only' THEN NULLIF(r->>'response_number', '')::numeric END,
         CASE WHEN i.scoring_method = 'manual_only' THEN NULLIF(r->>'manual_score', '')::numeric END,
         CASE WHEN i.scoring_method = 'manual_only' THEN COALESCE(NULLIF(r->>'manual_score', '')::numeric, 0)
              WHEN i.response_type = 'number' THEN CASE WHEN COALESCE(NULLIF(r->>'response_number', '')::numeric, 0) >= COALESCE(i.min_required, 0) THEN i.max_points ELSE 0 END
              WHEN COALESCE(NULLIF(r->>'response_boolean', '')::boolean, false) THEN i.max_points ELSE 0 END,
         CASE WHEN i.scoring_method = 'manual_only' THEN NULLIF(r->>'response_number', '') IS NOT NULL AND NULLIF(r->>'manual_score', '') IS NOT NULL
              WHEN i.response_type = 'number' THEN NULLIF(r->>'response_number', '') IS NOT NULL
              ELSE COALESCE(NULLIF(r->>'response_boolean', '')::boolean, false) OR i.scored_when_no END,
         NULLIF(r->>'remark', '')
  FROM jsonb_array_elements(COALESCE(p_payload -> 'responses', '[]'::jsonb)) r
  JOIN public.inspection_template_items i ON i.template_id = v_template.id AND i.item_code = r->>'item_code' AND i.active;

  DELETE FROM public.inspection_team_members WHERE inspection_id = v_id;
  INSERT INTO public.inspection_team_members(inspection_id, member_name, member_role, inspection_date, signature_data, signed_at, sort_order)
  SELECT v_id, NULLIF(m->>'name', ''), NULLIF(m->>'role', ''), NULLIF(m->>'inspection_date', '')::date, NULLIF(m->>'signature_data', ''), CASE WHEN NULLIF(m->>'signature_data', '') IS NULL THEN NULL ELSE now() END, ord::integer
  FROM jsonb_array_elements(COALESCE(p_payload -> 'team', '[]'::jsonb)) WITH ORDINALITY x(m, ord)
  WHERE NULLIF(m->>'name', '') IS NOT NULL;

  SELECT count(*) FILTER (WHERE required), count(*) FILTER (WHERE required AND r.met)
  INTO v_required_eligibility, v_met_eligibility
  FROM public.inspection_template_eligibility t
  LEFT JOIN public.inspection_eligibility_responses r ON r.inspection_id = v_id AND r.criterion_code = t.criterion_code
  WHERE t.template_id = v_template.id;
  v_eligibility_met := v_required_eligibility = v_met_eligibility;

  SELECT count(*) INTO v_item_count FROM public.inspection_template_items WHERE template_id = v_template.id AND active;
  SELECT count(*) INTO v_response_count
  FROM public.inspection_responses r
  JOIN public.inspection_template_items i ON i.id = r.item_id
  WHERE r.inspection_id = v_id AND i.active
    AND ((i.scoring_method = 'manual_only' AND r.observed_count IS NOT NULL AND r.manual_score IS NOT NULL)
      OR (i.scoring_method <> 'manual_only' AND ((i.response_type = 'number' AND r.response_number IS NOT NULL) OR (i.response_type = 'boolean' AND r.response_boolean IS NOT NULL))));
  SELECT COALESCE(sum(awarded_points), 0), COALESCE(sum(CASE WHEN included_in_denominator THEN i.max_points ELSE 0 END), 0)
  INTO v_total_points, v_total_possible
  FROM public.inspection_responses r JOIN public.inspection_template_items i ON i.id = r.item_id WHERE r.inspection_id = v_id;
  v_overall_score := CASE WHEN v_total_possible > 0 THEN round((v_total_points / v_total_possible) * 100, 2) ELSE 0 END;
  v_recommendation := CASE WHEN v_overall_score >= v_template.passing_threshold THEN 'Recommended for Accreditation' WHEN v_overall_score >= v_template.conditional_threshold THEN 'Conditionally Recommended — Re-inspection Required' ELSE 'Not Recommended for Accreditation' END;
  SELECT count(*) INTO v_signed_count FROM public.inspection_team_members WHERE inspection_id = v_id AND NULLIF(signature_data, '') IS NOT NULL;

  IF v_mode = 'submit' THEN
    IF NOT v_eligibility_met THEN RAISE EXCEPTION 'VALIDATION_ERROR: All eligibility criteria must be MET before submission'; END IF;
    IF v_response_count < v_item_count THEN RAISE EXCEPTION 'VALIDATION_ERROR: Complete every scored checklist item before submission'; END IF;
    IF v_signed_count = 0 THEN RAISE EXCEPTION 'VALIDATION_ERROR: At least one signed inspection team member is required'; END IF;
  END IF;

  UPDATE public.inspections SET eligibility_met = v_eligibility_met, total_points = v_total_points, total_possible = v_total_possible, overall_score = v_overall_score, score = v_overall_score, rating = CASE WHEN v_overall_score >= v_template.passing_threshold THEN 'Excellent' WHEN v_overall_score >= v_template.conditional_threshold THEN 'Fair' ELSE 'Poor' END, recommendation = v_recommendation, submitted_at = CASE WHEN v_mode = 'submit' THEN now() ELSE submitted_at END, updated_at = now() WHERE id = v_id;
  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', CASE WHEN v_mode = 'submit' THEN 'STRUCTURED_INSPECTION_SUBMITTED' ELSE 'STRUCTURED_INSPECTION_DRAFT_SAVED' END, 'inspections', v_id::text, jsonb_build_object('template_code', v_template.code, 'facility_type_code', v_template.facility_type_code, 'overall_score', v_overall_score, 'recommendation', v_recommendation, 'eligibility_met', v_eligibility_met));

  RETURN jsonb_build_object('inspection_id', v_id, 'status', CASE WHEN v_mode = 'submit' THEN 'Submitted' ELSE 'Draft' END, 'eligibility_met', v_eligibility_met, 'total_points', v_total_points, 'total_possible', v_total_possible, 'overall_score', v_overall_score, 'recommendation', v_recommendation, 'template_code', v_template.code, 'facility_type_code', v_template.facility_type_code);
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_save_structured_inspection(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_save_structured_inspection(uuid,jsonb) TO authenticated;