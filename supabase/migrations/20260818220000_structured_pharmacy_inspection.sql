BEGIN;

-- Structured accreditation model is additive to the existing inspections table.
CREATE TABLE IF NOT EXISTS public.inspection_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  passing_threshold numeric(5,2) NOT NULL DEFAULT 75,
  conditional_threshold numeric(5,2) NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_template_eligibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.inspection_templates(id) ON DELETE CASCADE,
  criterion_code text NOT NULL,
  criterion_label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(template_id, criterion_code)
);

CREATE TABLE IF NOT EXISTS public.inspection_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.inspection_templates(id) ON DELETE CASCADE,
  section_code text NOT NULL,
  item_code text NOT NULL,
  item_label text NOT NULL,
  response_type text NOT NULL CHECK (response_type IN ('number', 'boolean')),
  min_required numeric,
  max_points numeric(8,2) NOT NULL DEFAULT 0,
  scored_when_no boolean NOT NULL DEFAULT true,
  manual_score_allowed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  UNIQUE(template_id, item_code)
);

ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.inspection_templates(id);
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS workflow_step text NOT NULL DEFAULT 'eligibility';
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS eligibility_met boolean NOT NULL DEFAULT false;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS total_points numeric(8,2) NOT NULL DEFAULT 0;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS total_possible numeric(8,2) NOT NULL DEFAULT 0;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS overall_score numeric(5,2);
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS recommendation text;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS review_decision text;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS review_notes text;

CREATE TABLE IF NOT EXISTS public.inspection_eligibility_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  criterion_code text NOT NULL,
  criterion_label text NOT NULL,
  met boolean NOT NULL DEFAULT false,
  notes text,
  UNIQUE(inspection_id, criterion_code)
);

CREATE TABLE IF NOT EXISTS public.inspection_facility_profiles (
  inspection_id uuid PRIMARY KEY REFERENCES public.inspections(id) ON DELETE CASCADE,
  facility_name text NOT NULL,
  address text,
  telephone text,
  superintendent_pharmacist text,
  nhia_registered boolean,
  nhia_registration_no text,
  smoh_pcn_registered boolean,
  smoh_pcn_registration_no text,
  premises_registration_license_no text,
  cac_registration_no text,
  facility_email text,
  inspection_date date,
  contact_person text,
  facility_account_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inspection_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inspection_template_items(id),
  item_code text NOT NULL,
  response_number numeric,
  response_boolean boolean,
  awarded_points numeric(8,2) NOT NULL DEFAULT 0,
  included_in_denominator boolean NOT NULL DEFAULT true,
  remark text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(inspection_id, item_code)
);

CREATE TABLE IF NOT EXISTS public.inspection_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  member_role text,
  inspection_date date,
  signature_data text,
  signed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS inspection_responses_inspection_idx ON public.inspection_responses(inspection_id);
CREATE INDEX IF NOT EXISTS inspection_eligibility_inspection_idx ON public.inspection_eligibility_responses(inspection_id);
CREATE INDEX IF NOT EXISTS inspection_team_inspection_idx ON public.inspection_team_members(inspection_id);
CREATE INDEX IF NOT EXISTS inspections_template_idx ON public.inspections(template_id);
CREATE INDEX IF NOT EXISTS inspections_score_idx ON public.inspections(overall_score);

ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_template_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_eligibility_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_facility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_direct_inspection_templates" ON public.inspection_templates;
DROP POLICY IF EXISTS "deny_direct_inspection_template_eligibility" ON public.inspection_template_eligibility;
DROP POLICY IF EXISTS "deny_direct_inspection_template_items" ON public.inspection_template_items;
DROP POLICY IF EXISTS "deny_direct_inspection_eligibility" ON public.inspection_eligibility_responses;
DROP POLICY IF EXISTS "deny_direct_inspection_facility_profiles" ON public.inspection_facility_profiles;
DROP POLICY IF EXISTS "deny_direct_inspection_responses" ON public.inspection_responses;
DROP POLICY IF EXISTS "deny_direct_inspection_team" ON public.inspection_team_members;
CREATE POLICY "deny_direct_inspection_templates" ON public.inspection_templates FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_template_eligibility" ON public.inspection_template_eligibility FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_template_items" ON public.inspection_template_items FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_eligibility" ON public.inspection_eligibility_responses FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_facility_profiles" ON public.inspection_facility_profiles FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_responses" ON public.inspection_responses FOR ALL USING (false);
CREATE POLICY "deny_direct_inspection_team" ON public.inspection_team_members FOR ALL USING (false);

INSERT INTO public.inspection_templates(code, name, version, passing_threshold, conditional_threshold, active)
VALUES ('pharmacy-accreditation', 'Pharmacy Facility Accreditation Inspection', '1.0', 75, 60, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  version = EXCLUDED.version,
  passing_threshold = EXCLUDED.passing_threshold,
  conditional_threshold = EXCLUDED.conditional_threshold,
  active = EXCLUDED.active,
  updated_at = now();

INSERT INTO public.inspection_template_eligibility(template_id, criterion_code, criterion_label, required, sort_order)
SELECT t.id, v.criterion_code, v.criterion_label, true, v.sort_order
FROM public.inspection_templates t
CROSS JOIN (VALUES
  ('NHIA_ACCREDITED', 'Accredited by the National Health Insurance Authority (NHIA)', 1),
  ('SMOH_REGISTERED', 'Registered with the Ondo State Ministry of Health (SMOH)', 2),
  ('FEES_PAID', 'Prescribed fees paid', 3),
  ('STAFF_HEALTH_PLAN', 'Health Insurance Plan for facility staff in place', 4)
) AS v(criterion_code, criterion_label, sort_order)
WHERE t.code = 'pharmacy-accreditation'
ON CONFLICT (template_id, criterion_code) DO UPDATE SET
  criterion_label = EXCLUDED.criterion_label,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.inspection_template_items(template_id, section_code, item_code, item_label, response_type, min_required, max_points, scored_when_no, manual_score_allowed, sort_order)
SELECT t.id, v.section_code, v.item_code, v.item_label, v.response_type, v.min_required, v.max_points, v.scored_when_no, false, v.sort_order
FROM public.inspection_templates t
CROSS JOIN (VALUES
  ('B', 'B11', 'Pharmacist with professional license / registration number', 'number', 1::numeric, 10::numeric, true, 11),
  ('B', 'B12', 'Pharmacy Technician with professional license / registration number', 'number', 1::numeric, 5::numeric, true, 12),
  ('B', 'B13', 'Pharmacy Attendants', 'number', 2::numeric, 5::numeric, true, 13),
  ('C', 'C14', 'Dispensing Area', 'boolean', NULL, 5::numeric, true, 14),
  ('C', 'C16', 'Waiting / Reception Area', 'boolean', NULL, 4::numeric, true, 16),
  ('C', 'C17', 'Patient Counselling Area', 'boolean', NULL, 4::numeric, true, 17),
  ('C', 'C18', 'Refrigerator', 'boolean', NULL, 4::numeric, true, 18),
  ('C', 'C19', 'Poison Cupboard and Book', 'boolean', NULL, 4::numeric, true, 19),
  ('C', 'C20', 'Equipment for Extemporaneous Preparation', 'boolean', NULL, 5::numeric, true, 20),
  ('C', 'C21', 'Facility for Filtration', 'boolean', NULL, 4::numeric, false, 21),
  ('C', 'C22', 'Weighing Scales', 'boolean', NULL, 4::numeric, true, 22),
  ('C', 'C23', 'Pallets / Shelves', 'boolean', NULL, 4::numeric, true, 23),
  ('C', 'C24', 'Reference Material', 'boolean', NULL, 4::numeric, true, 24),
  ('C', 'C25', 'Air Conditioner / Ceiling Fans', 'boolean', NULL, 4::numeric, true, 25),
  ('C', 'C26', 'Drug Information Service', 'boolean', NULL, 3::numeric, true, 26),
  ('C', 'C27', 'Records of Sales / Computer / Source of Drugs', 'boolean', NULL, 6::numeric, true, 27),
  ('D', 'D27B', 'Water Source', 'boolean', NULL, 4::numeric, true, 28),
  ('D', 'D28', 'Power Source', 'boolean', NULL, 4::numeric, true, 29),
  ('D', 'D29', 'Firefighting Equipment', 'boolean', NULL, 4::numeric, true, 30),
  ('D', 'D30', 'Emergency Parking', 'boolean', NULL, 3::numeric, true, 31),
  ('D', 'D31', 'Internet Connectivity', 'boolean', NULL, 3::numeric, false, 32),
  ('D', 'D32', 'Laptop / Desktop / Tablet / Phone', 'boolean', NULL, 3::numeric, true, 33)
) AS v(section_code, item_code, item_label, response_type, min_required, max_points, scored_when_no, sort_order)
WHERE t.code = 'pharmacy-accreditation'
ON CONFLICT (template_id, item_code) DO UPDATE SET
  section_code = EXCLUDED.section_code,
  item_label = EXCLUDED.item_label,
  response_type = EXCLUDED.response_type,
  min_required = EXCLUDED.min_required,
  max_points = EXCLUDED.max_points,
  scored_when_no = EXCLUDED.scored_when_no,
  sort_order = EXCLUDED.sort_order,
  active = true;

CREATE OR REPLACE FUNCTION public.nmis_get_inspection_template(p_template_code text DEFAULT 'pharmacy-accreditation')
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
  SELECT * INTO v_template FROM public.inspection_templates WHERE code = COALESCE(NULLIF(trim(p_template_code), ''), 'pharmacy-accreditation') AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEMPLATE_NOT_FOUND'; END IF;

  RETURN jsonb_build_object(
    'template', jsonb_build_object('id', v_template.id, 'code', v_template.code, 'name', v_template.name, 'version', v_template.version, 'passing_threshold', v_template.passing_threshold, 'conditional_threshold', v_template.conditional_threshold),
    'eligibility', COALESCE((SELECT jsonb_agg(jsonb_build_object('criterion_code', e.criterion_code, 'criterion_label', e.criterion_label, 'required', e.required, 'sort_order', e.sort_order) ORDER BY e.sort_order) FROM public.inspection_template_eligibility e WHERE e.template_id = v_template.id), '[]'::jsonb),
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('section_code', i.section_code, 'item_code', i.item_code, 'item_label', i.item_label, 'response_type', i.response_type, 'min_required', i.min_required, 'max_points', i.max_points, 'scored_when_no', i.scored_when_no, 'manual_score_allowed', i.manual_score_allowed, 'sort_order', i.sort_order) ORDER BY i.sort_order) FROM public.inspection_template_items i WHERE i.template_id = v_template.id AND i.active), '[]'::jsonb)
  );
END;
$$;

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
  SELECT to_jsonb(i) INTO v_inspection FROM public.inspections i WHERE i.id = p_inspection_id;
  IF v_inspection IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'inspection', v_inspection,
    'facility_profile', COALESCE((SELECT to_jsonb(f) FROM public.inspection_facility_profiles f WHERE f.inspection_id = p_inspection_id), '{}'::jsonb),
    'eligibility', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.criterion_code) FROM public.inspection_eligibility_responses e WHERE e.inspection_id = p_inspection_id), '[]'::jsonb),
    'responses', COALESCE((SELECT jsonb_agg(jsonb_build_object('item_code', r.item_code, 'response_number', r.response_number, 'response_boolean', r.response_boolean, 'awarded_points', r.awarded_points, 'included_in_denominator', r.included_in_denominator, 'remark', r.remark) ORDER BY i.sort_order) FROM public.inspection_responses r JOIN public.inspection_template_items i ON i.id = r.item_id WHERE r.inspection_id = p_inspection_id), '[]'::jsonb),
    'team', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.sort_order) FROM public.inspection_team_members m WHERE m.inspection_id = p_inspection_id), '[]'::jsonb)
  );
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
  v_id uuid;
  v_mode text := COALESCE(p_payload ->> 'mode', 'draft');
  v_provider_id uuid := NULLIF(p_payload ->> 'provider_id', '')::uuid;
  v_scheduled_date date := COALESCE(NULLIF(p_payload ->> 'scheduled_date', '')::date, CURRENT_DATE);
  v_inspection_type text := COALESCE(NULLIF(p_payload ->> 'inspection_type', ''), 'Pharmacy Accreditation');
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
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin','executive','head-of-network','network-officer','inspector') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection save is restricted';
  END IF;
  SELECT * INTO v_template FROM public.inspection_templates WHERE code = COALESCE(NULLIF(p_payload ->> 'template_code', ''), 'pharmacy-accreditation') AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'TEMPLATE_NOT_FOUND'; END IF;
  IF v_provider_id IS NULL THEN RAISE EXCEPTION 'VALIDATION_ERROR: Provider is required'; END IF;

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
  VALUES (v_id, COALESCE(NULLIF(v_facility->>'facility_name', ''), 'Unnamed Facility'), NULLIF(v_facility->>'address', ''), NULLIF(v_facility->>'telephone', ''), NULLIF(v_facility->>'superintendent_pharmacist', ''), NULLIF(v_facility->>'nhia_registered', '')::boolean, NULLIF(v_facility->>'nhia_registration_no', ''), NULLIF(v_facility->>'smoh_pcn_registered', '')::boolean, NULLIF(v_facility->>'smoh_pcn_registration_no', ''), NULLIF(v_facility->>'premises_registration_license_no', ''), NULLIF(v_facility->>'cac_registration_no', ''), NULLIF(v_facility->>'facility_email', ''), NULLIF(v_facility->>'inspection_date', '')::date, NULLIF(v_facility->>'contact_person', ''), NULLIF(v_facility->>'facility_account_name', ''));

  DELETE FROM public.inspection_responses WHERE inspection_id = v_id;
  INSERT INTO public.inspection_responses(inspection_id, item_id, item_code, response_number, response_boolean, awarded_points, included_in_denominator, remark)
  SELECT v_id, i.id, i.item_code,
         CASE WHEN i.response_type = 'number' THEN NULLIF(r->>'response_number', '')::numeric END,
         CASE WHEN i.response_type = 'boolean' THEN NULLIF(r->>'response_boolean', '')::boolean END,
         CASE WHEN i.response_type = 'number' THEN CASE WHEN COALESCE(NULLIF(r->>'response_number', '')::numeric, 0) >= COALESCE(i.min_required, 0) THEN i.max_points ELSE 0 END
              WHEN COALESCE(NULLIF(r->>'response_boolean', '')::boolean, false) THEN i.max_points ELSE 0 END,
         CASE WHEN i.response_type = 'number' THEN NULLIF(r->>'response_number', '') IS NOT NULL ELSE COALESCE(NULLIF(r->>'response_boolean', '')::boolean, false) OR i.scored_when_no END,
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
  SELECT count(*) INTO v_response_count FROM public.inspection_responses r JOIN public.inspection_template_items i ON i.id = r.item_id WHERE r.inspection_id = v_id AND i.active;
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
  VALUES (auth.uid(), auth.jwt() ->> 'email', CASE WHEN v_mode = 'submit' THEN 'STRUCTURED_INSPECTION_SUBMITTED' ELSE 'STRUCTURED_INSPECTION_DRAFT_SAVED' END, 'inspections', v_id::text, jsonb_build_object('overall_score', v_overall_score, 'recommendation', v_recommendation, 'eligibility_met', v_eligibility_met));

  RETURN jsonb_build_object('inspection_id', v_id, 'status', CASE WHEN v_mode = 'submit' THEN 'Submitted' ELSE 'Draft' END, 'eligibility_met', v_eligibility_met, 'total_points', v_total_points, 'total_possible', v_total_possible, 'overall_score', v_overall_score, 'recommendation', v_recommendation);
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_review_inspection(p_inspection_id uuid, p_decision text, p_override_recommendation text DEFAULT NULL, p_review_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection review is restricted';
  END IF;
  IF p_decision NOT IN ('approved','rejected','returned') THEN RAISE EXCEPTION 'VALIDATION_ERROR: Invalid review decision'; END IF;
  UPDATE public.inspections SET status = CASE WHEN p_decision = 'approved' THEN 'Approved' WHEN p_decision = 'rejected' THEN 'Rejected' ELSE 'Returned' END, review_decision = p_decision, review_notes = NULLIF(trim(p_review_notes), ''), recommendation = COALESCE(NULLIF(trim(p_override_recommendation), ''), recommendation), reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now() WHERE id = p_inspection_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'INSPECTION_NOT_FOUND'; END IF;
  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata) VALUES (auth.uid(), auth.jwt() ->> 'email', 'STRUCTURED_INSPECTION_REVIEWED', 'inspections', p_inspection_id::text, jsonb_build_object('decision', p_decision, 'override_recommendation', p_override_recommendation));
  RETURN jsonb_build_object('success', true, 'decision', p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_get_inspection_template(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_structured_inspection(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_save_structured_inspection(uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_review_inspection(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_get_inspection_template(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_structured_inspection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_save_structured_inspection(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_review_inspection(uuid,text,text,text) TO authenticated;

COMMIT;
