-- Align the private-hospital template with the canonical Primary Services checklist.
-- The same template is used by registered-provider Inspection and new-facility Accreditation;
-- only facility identity differs between the two workflows.
DO $$
DECLARE
  v_template_id uuid;
BEGIN
  SELECT id INTO v_template_id
  FROM public.inspection_templates
  WHERE code = 'private-hospital-accreditation';
  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Private-hospital Primary Services template is missing';
  END IF;

  UPDATE public.inspection_templates
  SET name = 'Private Hospital — Primary Services Checklist',
      version = '2.0',
      passing_threshold = 75,
      conditional_threshold = 60,
      facility_type_code = 'private-hospital',
      facility_profile_fields = '[
        {"key":"facility_name","type":"text","label":"Name of Facility","required":true,"sort_order":1},
        {"key":"address","type":"text","label":"Address","required":true,"sort_order":2},
        {"key":"physician_in_charge","type":"text","label":"Name of Physician-in-Charge","required":true,"sort_order":3},
        {"key":"physician_phone","type":"text","label":"Phone No","required":true,"sort_order":4},
        {"key":"desk_officer","type":"text","label":"Name of Desk Officer","required":true,"sort_order":5},
        {"key":"desk_officer_phone","type":"text","label":"Phone No","required":true,"sort_order":6},
        {"key":"hospital_beds","type":"number","label":"Number of Hospital Beds","required":true,"sort_order":7},
        {"key":"nhia_registered","type":"boolean","label":"NHIA Registration","required":true,"pair_with":"nhia_reg_no","sort_order":8},
        {"key":"nhia_reg_no","type":"text","label":"Registration Number","required":false,"hidden":true,"sort_order":9},
        {"key":"smoh_registered","type":"boolean","label":"Current SMOH Registration","required":true,"pair_with":"smoh_reg_no","sort_order":10},
        {"key":"smoh_reg_no","type":"text","label":"Registration Number","required":false,"hidden":true,"sort_order":11},
        {"key":"facility_email","type":"email","label":"Facility Email","required":true,"sort_order":12},
        {"key":"inspection_date","type":"date","label":"Date of Inspection","required":true,"sort_order":13}
      ]'::jsonb,
      updated_at = now()
  WHERE id = v_template_id;

  INSERT INTO public.inspection_template_sections(template_id, section_code, section_label, sort_order, active)
  VALUES
    (v_template_id, 'ELIGIBILITY', 'Eligibility Criteria for Provider Registration with ODCHC', 1, true),
    (v_template_id, 'PROFILE', 'Section A — General Requirements / Facility Profile', 2, true),
    (v_template_id, 'PERSONNEL', 'Section B — Personnel (Sight Current Practicing Licence)', 3, true),
    (v_template_id, 'INFRASTRUCTURE', 'Section C — Infrastructure', 4, true),
    (v_template_id, 'SERVICES', 'Section D — Essential Services', 5, true),
    (v_template_id, 'REMARKS', 'General Remarks / Recommendation', 6, true),
    (v_template_id, 'TEAM', 'Inspection Team', 7, true)
  ON CONFLICT (template_id, section_code) DO UPDATE
    SET section_label = EXCLUDED.section_label,
        sort_order = EXCLUDED.sort_order,
        active = true;

  -- Profile, remarks, and team are rendered by dedicated workflow state.
  UPDATE public.inspection_template_items
  SET active = false
  WHERE template_id = v_template_id
    AND section_code IN ('PROFILE', 'REMARKS', 'TEAM');

  -- Keep only the canonical Primary Services scored items and map them to their
  -- correct sections. Eligibility remains in inspection_template_eligibility.
  UPDATE public.inspection_template_items
  SET section_code = CASE
      WHEN item_code ~ '^B(9|10|11|12|13|14|15|16|17|18|19)$' THEN 'PERSONNEL'
      WHEN item_code ~ '^C(20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|38|39|40|41|42)$' THEN 'INFRASTRUCTURE'
      WHEN item_code ~ '^D(43|44|45|46|47|48|49|50|51|52)$' THEN 'SERVICES'
      ELSE section_code
    END,
    active = true
  WHERE template_id = v_template_id
    AND item_code IN (
      'B9','B10','B11','B12','B13','B14','B15','B16','B17','B18','B19',
      'C20','C21','C22','C23','C24','C25','C26','C27','C28','C29','C30','C31','C32','C33','C34','C35','C36','C38','C39','C40','C41','C42',
      'D43','D44','D45','D46','D47','D48','D49','D50','D51','D52'
    );

  -- Disable accidental active items outside the canonical Primary Services set.
  UPDATE public.inspection_template_items
  SET active = false
  WHERE template_id = v_template_id
    AND item_code NOT IN (
      'B9','B10','B11','B12','B13','B14','B15','B16','B17','B18','B19',
      'C20','C21','C22','C23','C24','C25','C26','C27','C28','C29','C30','C31','C32','C33','C34','C35','C36','C38','C39','C40','C41','C42',
      'D43','D44','D45','D46','D47','D48','D49','D50','D51','D52'
    );

  -- Use compact, deterministic local order within each rendered section.
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY section_code
             ORDER BY sort_order, item_code
           )::integer AS next_order
    FROM public.inspection_template_items
    WHERE template_id = v_template_id
      AND active
      AND section_code IN ('PERSONNEL','INFRASTRUCTURE','SERVICES')
  )
  UPDATE public.inspection_template_items i
  SET sort_order = ranked.next_order
  FROM ranked
  WHERE i.id = ranked.id;

  DELETE FROM public.inspection_template_eligibility
  WHERE template_id = v_template_id;
  INSERT INTO public.inspection_template_eligibility(template_id, criterion_code, criterion_label, required, sort_order)
  VALUES
    (v_template_id, 'NHIA_ACCREDITED', 'Be accredited by the National Health Insurance Authority (NHIA)', true, 1),
    (v_template_id, 'SMOH_REGISTERED', 'Be registered with the Ondo State Ministry of Health (SMOH)', true, 2),
    (v_template_id, 'FEES_PAID', 'Pay prescribed fees', true, 3),
    (v_template_id, 'STAFF_HEALTH_PLAN', 'Have / Purchase Health Insurance Plan for staff of the facility', true, 4);
END $$;
