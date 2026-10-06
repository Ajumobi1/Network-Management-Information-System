-- Align the government-hospital QA template with the canonical ODCHC checklist.
-- This template is intentionally shared by government-hospital Inspection and Accreditation;
-- the workflows differ only in facility identity: directory selection for Inspection versus
-- manual facility profile for Accreditation.

DO $$
DECLARE
  v_template_id uuid;
BEGIN
  SELECT id INTO v_template_id
  FROM public.inspection_templates
  WHERE code = 'government-hospital-accreditation';

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Government-hospital QA template is missing';
  END IF;

  UPDATE public.inspection_templates
  SET name = 'Government Hospital Quality Assurance Checklist',
      version = '2.0',
      passing_threshold = 0,
      conditional_threshold = 0,
      facility_profile_fields = '[
        {"key":"reference_quarter","type":"select","label":"Reference Quarter","required":true,"options":["Q1 (Jan-Mar)","Q2 (Apr-Jun)","Q3 (Jul-Sep)","Q4 (Oct-Dec)"],"sort_order":1},
        {"key":"reference_year","type":"number","label":"Reference Year","required":true,"sort_order":2},
        {"key":"facility_name","type":"text","label":"Name of Facility","required":true,"sort_order":3},
        {"key":"address","type":"text","label":"Address of Facility / Location","required":true,"sort_order":4},
        {"key":"lga_district","type":"text","label":"Local Government / Senatorial District","required":true,"sort_order":5},
        {"key":"facility_email","type":"email","label":"Facility Email","required":true,"sort_order":6},
        {"key":"nhia_accredited","type":"boolean","label":"Is your facility accredited by NHIA?","required":true,"pair_with":"nhia_reg_no","sort_order":7},
        {"key":"nhia_reg_no","type":"text","label":"Registration Number","required":false,"sort_order":8},
        {"key":"oranghis_enrollees","type":"number","label":"Number of ORANGHIS Enrollees","required":true,"sort_order":9},
        {"key":"last_hfmc_meeting","type":"text","label":"When last did the HFMC meet?","required":true,"sort_order":10},
        {"key":"dedicated_officer","type":"boolean","label":"Is there a dedicated officer for ORANGHIS?","required":true,"sort_order":11},
        {"key":"desk_officer_name","type":"text","label":"Name of Desk Officer","required":true,"sort_order":12},
        {"key":"desk_officer_phone","type":"text","label":"Phone Number of Desk Officer","required":true,"sort_order":13},
        {"key":"tpa_visits","type":"boolean","label":"Did you receive monthly TPA supervisory visits?","required":true,"sort_order":14},
        {"key":"odchc_visits","type":"boolean","label":"Did you receive quarterly ODCHC supervisory visits?","required":true,"sort_order":15},
        {"key":"service_24h","type":"boolean","label":"Does your facility provide 24-hour service?","required":true,"sort_order":16}
      ]'::jsonb,
      updated_at = now()
  WHERE id = v_template_id;

  -- The checklist sequence is A (profile), B (administration/personnel),
  -- C (drug management), D (programme implementation), E (financial), F (challenges).
  INSERT INTO public.inspection_template_sections(template_id, section_code, section_label, sort_order, active)
  VALUES
    (v_template_id, 'PROFILE', 'Section A — General Requirements / Facility Profile', 1, true),
    (v_template_id, 'B', 'Section B — Administration, Personnel & Governance', 2, true),
    (v_template_id, 'C', 'Section C — Drug Management System (Q018–Q019)', 3, true),
    (v_template_id, 'D', 'Section D — Programme Implementation (Q020–Q023)', 4, true),
    (v_template_id, 'E', 'Section E — Financial Management (Q024–Q028)', 5, true),
    (v_template_id, 'F', 'Section F — Challenges, Recommendations & Observations', 6, true),
    (v_template_id, 'TEAM', 'QA Team Members', 7, true)
  ON CONFLICT (template_id, section_code) DO UPDATE
    SET section_label = EXCLUDED.section_label,
        sort_order = EXCLUDED.sort_order,
        active = true;

  -- Repair the legacy migration which placed all QA items in section B.
  UPDATE public.inspection_template_items
  SET section_code = CASE
      WHEN item_code ~ '^Q00[7-9]$' OR item_code IN ('Q010','Q010b','Q011','Q012','Q013','Q014') OR item_code ~ '^Q015(_|b_)' OR item_code IN ('Q016','Q017','INTERVIEWER_NAME','INTERVIEWER_DATE') THEN 'B'
      WHEN item_code ~ '^Q018' OR item_code IN ('Q019','Q019_DRUGS') THEN 'C'
      WHEN item_code ~ '^Q020$' OR item_code ~ '^Q021' OR item_code ~ '^Q022' OR item_code ~ '^Q023' THEN 'D'
      WHEN item_code ~ '^Q024' OR item_code ~ '^Q025' OR item_code ~ '^Q026' OR item_code ~ '^Q027' OR item_code ~ '^Q028' THEN 'E'
      WHEN item_code IN ('Q029','Q030','Q031','OBS') THEN 'F'
      ELSE section_code
    END,
      active = true
  WHERE template_id = v_template_id;

  -- Within each canonical section, preserve the checklist's existing local sequence
  -- and make ties deterministic. This eliminates the previous global interleaving.
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY section_code
             ORDER BY sort_order, item_code
           )::integer AS next_order
    FROM public.inspection_template_items
    WHERE template_id = v_template_id AND active AND section_code IN ('B','C','D','E','F')
  )
  UPDATE public.inspection_template_items i
  SET sort_order = ranked.next_order
  FROM ranked
  WHERE i.id = ranked.id;

  -- Profile and team are rendered from dedicated workflow state, not scored items.
  UPDATE public.inspection_template_items
  SET active = false
  WHERE template_id = v_template_id
    AND section_code IN ('PROFILE','TEAM');
END $$;

COMMENT ON TABLE public.inspection_template_sections IS
  'Government-hospital QA uses canonical section ordering; item order is deterministic within each section.';
