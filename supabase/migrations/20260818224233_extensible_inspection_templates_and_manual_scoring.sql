BEGIN;

CREATE TABLE IF NOT EXISTS public.inspection_facility_types (
  code text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.inspection_facility_types(code, name, description, sort_order)
VALUES
  ('pharmacy', 'Pharmacy', 'Community and hospital pharmacy accreditation inspections.', 1),
  ('hospital', 'Hospital', 'Hospital facility inspection template.', 2),
  ('optical-centre', 'Optical Centre', 'Optical centre inspection template.', 3),
  ('dental-centre', 'Dental Centre', 'Dental centre inspection template.', 4),
  ('diagnostic-centre', 'Diagnostic Centre', 'Diagnostic centre inspection template.', 5)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, updated_at = now();

ALTER TABLE public.inspection_templates
  ADD COLUMN IF NOT EXISTS facility_type_code text REFERENCES public.inspection_facility_types(code),
  ADD COLUMN IF NOT EXISTS facility_profile_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.inspection_template_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.inspection_templates(id) ON DELETE CASCADE,
  section_code text NOT NULL,
  section_label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(template_id, section_code)
);

ALTER TABLE public.inspection_template_items
  ADD COLUMN IF NOT EXISTS scoring_method text NOT NULL DEFAULT 'yes_no_with_points'
    CHECK (scoring_method IN ('headcount_formula', 'yes_no_with_points', 'manual_only'));

ALTER TABLE public.inspection_responses
  ADD COLUMN IF NOT EXISTS observed_count numeric,
  ADD COLUMN IF NOT EXISTS manual_score numeric(8,2);

UPDATE public.inspection_templates
SET facility_type_code = 'pharmacy'
WHERE code = 'pharmacy-accreditation' AND facility_type_code IS NULL;

UPDATE public.inspection_templates
SET facility_profile_fields = '[
  {"key":"facility_name","label":"Name of pharmacy / facility","type":"text","required":true,"sort_order":1},
  {"key":"address","label":"Address","type":"text","required":true,"sort_order":2},
  {"key":"telephone","label":"Telephone number","type":"text","required":false,"sort_order":3},
  {"key":"facility_email","label":"Facility email","type":"email","required":false,"sort_order":4},
  {"key":"superintendent_pharmacist","label":"Superintendent pharmacist","type":"text","required":false,"sort_order":5},
  {"key":"inspection_date","label":"Date of inspection","type":"date","required":true,"sort_order":6},
  {"key":"nhia_registration_no","label":"NHIA registration number","type":"text","required":false,"sort_order":7},
  {"key":"smoh_pcn_registration_no","label":"SMOH / PCN registration number","type":"text","required":false,"sort_order":8},
  {"key":"premises_registration_license_no","label":"Premises registration license no.","type":"text","required":false,"sort_order":9},
  {"key":"cac_registration_no","label":"CAC registration no.","type":"text","required":false,"sort_order":10},
  {"key":"contact_person","label":"Contact person","type":"text","required":false,"sort_order":11},
  {"key":"facility_account_name","label":"Facility account name","type":"text","required":false,"sort_order":12},
  {"key":"nhia_registered","label":"NHIA accredited?","type":"boolean","required":false,"sort_order":13},
  {"key":"smoh_pcn_registered","label":"Current SMOH & PCN registration?","type":"boolean","required":false,"sort_order":14}
]'::jsonb
WHERE code = 'pharmacy-accreditation' AND (facility_profile_fields = '[]'::jsonb OR facility_profile_fields IS NULL);

INSERT INTO public.inspection_template_sections(template_id, section_code, section_label, description, sort_order)
SELECT t.id, v.section_code, v.section_label, v.description, v.sort_order
FROM public.inspection_templates t
CROSS JOIN (VALUES
  ('A', 'Section A — Facility profile', 'Capture the metadata exactly as observed during the inspection visit.', 1),
  ('B', 'Section B — Personnel', 'Enter observed headcount and manually award points within each item maximum.', 2),
  ('C', 'Section C — Infrastructure', 'Mark each facility requirement YES or NO and record evidence.', 3),
  ('D', 'Section D — Essential services', 'Mark each facility requirement YES or NO and record evidence.', 4)
) AS v(section_code, section_label, description, sort_order)
WHERE t.code = 'pharmacy-accreditation'
ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order, active = true;

UPDATE public.inspection_template_items
SET scoring_method = CASE WHEN item_code IN ('B11','B12','B13') THEN 'manual_only' ELSE 'yes_no_with_points' END,
    manual_score_allowed = CASE WHEN item_code IN ('B11','B12','B13') THEN true ELSE manual_score_allowed END
WHERE template_id = (SELECT id FROM public.inspection_templates WHERE code = 'pharmacy-accreditation');

UPDATE public.inspection_template_items
SET item_label = 'Water Source'
WHERE template_id = (SELECT id FROM public.inspection_templates WHERE code = 'pharmacy-accreditation')
  AND item_code = 'D27B';

ALTER TABLE public.inspection_facility_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_template_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_direct_inspection_facility_types" ON public.inspection_facility_types;
DROP POLICY IF EXISTS "deny_direct_inspection_template_sections" ON public.inspection_template_sections;
CREATE POLICY "deny_direct_inspection_facility_types" ON public.inspection_facility_types FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_template_sections" ON public.inspection_template_sections FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.nmis_list_inspection_template_options()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection template access is restricted';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'facility_type', jsonb_build_object('code', ft.code, 'name', ft.name, 'description', ft.description, 'active', ft.active, 'sort_order', ft.sort_order),
      'template', CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object('id', t.id, 'code', t.code, 'name', t.name, 'version', t.version, 'active', t.active, 'passing_threshold', t.passing_threshold, 'conditional_threshold', t.conditional_threshold) END,
      'configured', t.id IS NOT NULL
    ) ORDER BY ft.sort_order)
    FROM public.inspection_facility_types ft
    LEFT JOIN LATERAL (
      SELECT * FROM public.inspection_templates it WHERE it.facility_type_code = ft.code ORDER BY it.updated_at DESC LIMIT 1
    ) t ON true
    WHERE ft.active
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_get_inspection_template(p_template_code text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_template public.inspection_templates%ROWTYPE;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector','finance']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection template access is restricted';
  END IF;

  SELECT * INTO v_template
  FROM public.inspection_templates
  WHERE (p_template_code IS NULL OR p_template_code = '' OR code = p_template_code OR facility_type_code = p_template_code)
    AND active = true
  ORDER BY CASE WHEN code = p_template_code THEN 0 ELSE 1 END, updated_at DESC
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEMPLATE_NOT_FOUND'; END IF;

  RETURN jsonb_build_object(
    'facility_type', (SELECT jsonb_build_object('code', ft.code, 'name', ft.name, 'description', ft.description) FROM public.inspection_facility_types ft WHERE ft.code = v_template.facility_type_code),
    'template', jsonb_build_object('id', v_template.id, 'code', v_template.code, 'name', v_template.name, 'version', v_template.version, 'passing_threshold', v_template.passing_threshold, 'conditional_threshold', v_template.conditional_threshold, 'facility_type_code', v_template.facility_type_code, 'facility_profile_fields', COALESCE(v_template.facility_profile_fields, '[]'::jsonb)),
    'sections', COALESCE((SELECT jsonb_agg(jsonb_build_object('section_code', s.section_code, 'section_label', s.section_label, 'description', s.description, 'sort_order', s.sort_order) ORDER BY s.sort_order) FROM public.inspection_template_sections s WHERE s.template_id = v_template.id AND s.active), '[]'::jsonb),
    'eligibility', COALESCE((SELECT jsonb_agg(jsonb_build_object('criterion_code', e.criterion_code, 'criterion_label', e.criterion_label, 'required', e.required, 'sort_order', e.sort_order) ORDER BY e.sort_order) FROM public.inspection_template_eligibility e WHERE e.template_id = v_template.id), '[]'::jsonb),
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('section_code', i.section_code, 'item_code', i.item_code, 'item_label', i.item_label, 'response_type', i.response_type, 'min_required', i.min_required, 'max_points', i.max_points, 'scored_when_no', i.scored_when_no, 'manual_score_allowed', i.manual_score_allowed, 'scoring_method', i.scoring_method, 'sort_order', i.sort_order) ORDER BY i.sort_order) FROM public.inspection_template_items i WHERE i.template_id = v_template.id AND i.active), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_admin_upsert_inspection_template(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_template public.inspection_templates%ROWTYPE;
  v_template_id uuid;
  v_template_code text := COALESCE(NULLIF(trim(p_payload->>'template_code'), ''), lower(regexp_replace(COALESCE(p_payload->>'facility_type_code', 'custom'), '[^a-z0-9]+', '-', 'g')) || '-inspection');
  v_facility_type_code text := NULLIF(trim(p_payload->>'facility_type_code'), '');
  v_item jsonb;
  v_eligibility jsonb;
  v_section jsonb;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Template administration is restricted';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.inspection_facility_types WHERE code = v_facility_type_code AND active) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Facility type is not configured';
  END IF;

  INSERT INTO public.inspection_templates(code, name, version, passing_threshold, conditional_threshold, active, facility_type_code, facility_profile_fields)
  VALUES (
    v_template_code,
    COALESCE(NULLIF(trim(p_payload->>'name'), ''), 'Inspection Template'),
    COALESCE(NULLIF(trim(p_payload->>'version'), ''), '1.0'),
    COALESCE((p_payload->>'passing_threshold')::numeric, 75),
    COALESCE((p_payload->>'conditional_threshold')::numeric, 60),
    COALESCE((p_payload->>'active')::boolean, true),
    v_facility_type_code,
    COALESCE(p_payload->'facility_profile_fields', '[]'::jsonb)
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, version = EXCLUDED.version, passing_threshold = EXCLUDED.passing_threshold,
    conditional_threshold = EXCLUDED.conditional_threshold, active = EXCLUDED.active,
    facility_type_code = EXCLUDED.facility_type_code, facility_profile_fields = EXCLUDED.facility_profile_fields, updated_at = now()
  RETURNING id INTO v_template_id;

  DELETE FROM public.inspection_template_sections WHERE template_id = v_template_id;
  FOR v_section IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'sections', '[]'::jsonb)) LOOP
    INSERT INTO public.inspection_template_sections(template_id, section_code, section_label, description, sort_order, active)
    VALUES (v_template_id, v_section->>'section_code', v_section->>'section_label', NULLIF(v_section->>'description',''), COALESCE((v_section->>'sort_order')::integer, 0), COALESCE((v_section->>'active')::boolean, true));
  END LOOP;

  DELETE FROM public.inspection_template_eligibility WHERE template_id = v_template_id;
  FOR v_eligibility IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'eligibility', '[]'::jsonb)) LOOP
    INSERT INTO public.inspection_template_eligibility(template_id, criterion_code, criterion_label, required, sort_order)
    VALUES (v_template_id, v_eligibility->>'criterion_code', v_eligibility->>'criterion_label', COALESCE((v_eligibility->>'required')::boolean, true), COALESCE((v_eligibility->>'sort_order')::integer, 0));
  END LOOP;

  DELETE FROM public.inspection_template_items WHERE template_id = v_template_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_payload->'items', '[]'::jsonb)) LOOP
    INSERT INTO public.inspection_template_items(template_id, section_code, item_code, item_label, response_type, min_required, max_points, scored_when_no, manual_score_allowed, scoring_method, sort_order, active)
    VALUES (
      v_template_id, v_item->>'section_code', v_item->>'item_code', v_item->>'item_label', COALESCE(v_item->>'response_type','boolean'), NULLIF(v_item->>'min_required','')::numeric, COALESCE((v_item->>'max_points')::numeric, 0), COALESCE((v_item->>'scored_when_no')::boolean, true), COALESCE((v_item->>'manual_score_allowed')::boolean, false), COALESCE(v_item->>'scoring_method','yes_no_with_points'), COALESCE((v_item->>'sort_order')::integer, 0), COALESCE((v_item->>'active')::boolean, true)
    );
  END LOOP;

  RETURN public.nmis_get_inspection_template(v_template_code);
END;
$$;

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
  INSERT INTO public.inspection_facility_profiles(inspection_id, facility_name, address, telephone, superintendent_pharmacist, nhia_registered, nhia_registration_no, smoh_pcn_registered, smoh_pcn_registration_no, premises_registration_license_no, cac_registration_no, facility_email, inspection_date, contact_person, facility_account_name)
  VALUES (v_id, COALESCE(NULLIF(v_facility->>'facility_name', ''), 'Unnamed Facility'), NULLIF(v_facility->>'address', ''), NULLIF(v_facility->>'telephone', ''), NULLIF(v_facility->>'superintendent_pharmacist', ''), NULLIF(v_facility->>'nhia_registered', '')::boolean, NULLIF(v_facility->>'nhia_registration_no', ''), NULLIF(v_facility->>'smoh_pcn_registered', '')::boolean, NULLIF(v_facility->>'smoh_pcn_registration_no', '')::boolean, NULLIF(v_facility->>'premises_registration_license_no', ''), NULLIF(v_facility->>'cac_registration_no', ''), NULLIF(v_facility->>'facility_email', ''), NULLIF(v_facility->>'inspection_date', '')::date, NULLIF(v_facility->>'contact_person', ''), NULLIF(v_facility->>'facility_account_name', ''))
  ON CONFLICT (inspection_id) DO UPDATE SET facility_name = EXCLUDED.facility_name, address = EXCLUDED.address, telephone = EXCLUDED.telephone, superintendent_pharmacist = EXCLUDED.superintendent_pharmacist, nhia_registered = EXCLUDED.nhia_registered, nhia_registration_no = EXCLUDED.nhia_registration_no, smoh_pcn_registered = EXCLUDED.smoh_pcn_registered, smoh_pcn_registration_no = EXCLUDED.smoh_pcn_registration_no, premises_registration_license_no = EXCLUDED.premises_registration_license_no, cac_registration_no = EXCLUDED.cac_registration_no, facility_email = EXCLUDED.facility_email, inspection_date = EXCLUDED.inspection_date, contact_person = EXCLUDED.contact_person, facility_account_name = EXCLUDED.facility_account_name, updated_at = now();

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
  v_eligibility_met := v_required_eligibility > 0 AND v_required_eligibility = v_met_eligibility;

  SELECT count(*) INTO v_item_count FROM public.inspection_template_items WHERE template_id = v_template.id AND active;
  SELECT count(*) INTO v_response_count
  FROM public.inspection_responses r
  JOIN public.inspection_template_items i ON i.id = r.item_id
  WHERE r.inspection_id = v_id AND i.active
    AND ((i.scoring_method = 'manual_only' AND r.observed_count IS NOT NULL AND r.manual_score IS NOT NULL)
      OR (i.scoring_method <> 'manual_only' AND (i.response_type = 'number' AND r.response_number IS NOT NULL OR i.response_type = 'boolean' AND r.response_boolean IS NOT NULL)));
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

  UPDATE public.inspections SET eligibility_met = v_eligibility_met, total_points = v_total_points, total_possible = v_total_possible, overall_score = v_overall_score, score = v_overall_score, rating = CASE WHEN v_overall_score >= 75 THEN 'Excellent' WHEN v_overall_score >= 60 THEN 'Fair' ELSE 'Poor' END, recommendation = v_recommendation, submitted_at = CASE WHEN v_mode = 'submit' THEN now() ELSE submitted_at END, updated_at = now() WHERE id = v_id;
  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', CASE WHEN v_mode = 'submit' THEN 'STRUCTURED_INSPECTION_SUBMITTED' ELSE 'STRUCTURED_INSPECTION_DRAFT_SAVED' END, 'inspections', v_id::text, jsonb_build_object('template_code', v_template.code, 'facility_type_code', v_template.facility_type_code, 'overall_score', v_overall_score, 'recommendation', v_recommendation, 'eligibility_met', v_eligibility_met));

  RETURN jsonb_build_object('inspection_id', v_id, 'status', CASE WHEN v_mode = 'submit' THEN 'Submitted' ELSE 'Draft' END, 'eligibility_met', v_eligibility_met, 'total_points', v_total_points, 'total_possible', v_total_possible, 'overall_score', v_overall_score, 'recommendation', v_recommendation, 'template_code', v_template.code, 'facility_type_code', v_template.facility_type_code);
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_inspection_template_options() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_admin_upsert_inspection_template(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_inspection_template_options() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_admin_upsert_inspection_template(jsonb) TO authenticated;

COMMIT;