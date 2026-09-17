DO $$
DECLARE
    v_template_id UUID;
BEGIN
    -- 1. Upsert the Hospital Template
    INSERT INTO public.inspection_templates (
        code, name, version, passing_threshold, conditional_threshold, active, facility_type_code,
        facility_profile_fields
    ) VALUES (
        'hospital-accreditation', 'Hospital Facility Accreditation Inspection', '1.0', 75.00, 60.00, true, 'hospital',
        '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "physician_in_charge", "type": "text", "label": "Name of Physician-in-Charge", "required": true, "sort_order": 3},
            {"key": "physician_phone", "type": "text", "label": "Physician Phone No", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "Desk Officer Phone No", "required": true, "sort_order": 6},
            {"key": "hospital_beds", "type": "number", "label": "Number of Hospital Beds", "required": true, "sort_order": 7},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registered?", "required": true, "sort_order": 8},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Registration No.", "required": false, "sort_order": 9},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH Registered?", "required": true, "sort_order": 10},
            {"key": "smoh_reg_no", "type": "text", "label": "Current SMOH Registration No.", "required": false, "sort_order": 11},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 12},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 13}
        ]'::jsonb
    )
    ON CONFLICT (code) DO UPDATE SET
        active = true,
        facility_profile_fields = EXCLUDED.facility_profile_fields
    RETURNING id INTO v_template_id;

    -- 2. Seed Sections for Hospital
    -- ELIGIBILITY
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES (v_template_id, 'ELIGIBILITY', 'Eligibility Criteria', 1, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- PERSONNEL
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES (v_template_id, 'PERSONNEL', 'Section B — Personnel', 2, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- INFRASTRUCTURE
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES (v_template_id, 'INFRASTRUCTURE', 'Section C — Infrastructure', 3, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- SERVICES
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES (v_template_id, 'SERVICES', 'Section D — Essential Services', 4, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- 3. Seed Items for Hospital
    -- ELIGIBILITY
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'ELIGIBILITY', 'E1', 'Accredited by the National Health Insurance Authority (NHIA)', 'MET_NOT_MET', 0, 1, 'YES_NO'),
    (v_template_id, 'ELIGIBILITY', 'E2', 'Registered with the Ondo State Ministry of Health (SMOH)', 'MET_NOT_MET', 0, 2, 'YES_NO'),
    (v_template_id, 'ELIGIBILITY', 'E3', 'Prescribed fees paid', 'MET_NOT_MET', 0, 3, 'YES_NO'),
    (v_template_id, 'ELIGIBILITY', 'E4', 'Health Insurance Plan purchased for facility staff', 'MET_NOT_MET', 0, 4, 'YES_NO');

    -- PERSONNEL
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'PERSONNEL';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method, min_required)
    VALUES
    (v_template_id, 'PERSONNEL', 'B1', 'Medical Doctors with professional licences/reg. no', 'MANUAL_SCORE', 3, 1, 'MANUAL', 1),
    (v_template_id, 'PERSONNEL', 'B2', 'Pharmacist with professional licence/reg. no', 'MANUAL_SCORE', 2, 2, 'MANUAL', 0),
    (v_template_id, 'PERSONNEL', 'B3', 'Pharmacy Technician with professional licence/reg. no', 'MANUAL_SCORE', 2, 3, 'MANUAL', 1),
    (v_template_id, 'PERSONNEL', 'B4', 'Registered Nurse or Midwife with professional licence/reg. no, BNSC', 'MANUAL_SCORE', 3, 4, 'MANUAL', 2),
    (v_template_id, 'PERSONNEL', 'B5', 'Nurse/Midwife with professional licence/reg. no — RN, RM, or RN/RM', 'MANUAL_SCORE', 2, 5, 'MANUAL', 0),
    (v_template_id, 'PERSONNEL', 'B6', 'Chew/CHO with professional licence', 'MANUAL_SCORE', 2, 6, 'MANUAL', 2),
    (v_template_id, 'PERSONNEL', 'B7', 'Med/Lab Scientist with professional licence/reg. no', 'MANUAL_SCORE', 3, 7, 'MANUAL', 0),
    (v_template_id, 'PERSONNEL', 'B8', 'Med/Lab Technician with professional licence/reg. no', 'MANUAL_SCORE', 2, 8, 'MANUAL', 0),
    (v_template_id, 'PERSONNEL', 'B9', 'Medical Records Officers with professional licence/reg. no', 'MANUAL_SCORE', 2, 9, 'MANUAL', 0),
    (v_template_id, 'PERSONNEL', 'B10', 'Medical Records Technician with professional licence/reg. no', 'MANUAL_SCORE', 2, 10, 'MANUAL', 1),
    (v_template_id, 'PERSONNEL', 'B11', 'Hospital Attendant', 'MANUAL_SCORE', 2, 11, 'MANUAL', 2);

    -- INFRASTRUCTURE
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'INFRASTRUCTURE';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'INFRASTRUCTURE', 'C12', 'Waiting/Reception area, at least 4x3 metres', 'MANUAL_SCORE', 2, 12, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C13', 'Medical record keeping facilities', 'MANUAL_SCORE', 2, 13, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C14', 'Consulting room, 4x3 metres', 'MANUAL_SCORE', 2, 14, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C15', 'Treatment room with wash-hand basin and safety box for sharps', 'MANUAL_SCORE', 3, 15, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C16', 'Pharmacy with drug cabinet', 'MANUAL_SCORE', 5, 16, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C17', 'Medical Laboratory (USS machine, MP, Urinalysis, PCV, blood sugar & pregnancy test kits, spirit lamps, lab glassware, haematocrit centrifuge, etc.)', 'MANUAL_SCORE', 3, 17, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C18', 'Surgical operating theatre (circumcision set, ear-piercing set, catheterization materials, I&D instruments, other surgical sets)', 'MANUAL_SCORE', 3, 18, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C19', 'Possession of adequate ICT with internet access', 'MANUAL_SCORE', 3, 19, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C20', 'Lying-in ward, minimum distance of 1m in-between beds', 'MANUAL_SCORE', 2, 20, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C21', 'A locker and an over-bed table per bed', 'MANUAL_SCORE', 1, 21, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C22', 'Colour-coded containers', 'MANUAL_SCORE', 2, 22, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C23', 'Separate wards for male, female, and children', 'MANUAL_SCORE', 3, 23, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C24', 'Delivery room with required gadgets, consumables, instruments, and emergency drugs', 'MANUAL_SCORE', 2, 24, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C25', 'Wheelchair / patient''s examination couch', 'MANUAL_SCORE', 2, 25, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C26', 'Sluice Room', 'MANUAL_SCORE', 3, 26, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C27', 'Possession of appropriate equipment and staff for other specialization', 'MANUAL_SCORE', 3, 27, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C28', 'Laundry Service', 'MANUAL_SCORE', 2, 28, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C29', 'Stadiometer', 'MANUAL_SCORE', 2, 29, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C30', 'Oxygen', 'MANUAL_SCORE', 4, 30, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C31', 'Resuscitative equipment (ambu bag, suction machine, etc.)', 'MANUAL_SCORE', 4, 31, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C32', 'Bed Pan / Urinal', 'MANUAL_SCORE', 2, 32, 'MANUAL'),
    (v_template_id, 'INFRASTRUCTURE', 'C33', 'At least 4 bed linens per bed', 'MANUAL_SCORE', 2, 33, 'MANUAL');

    -- SERVICES
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'SERVICES';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'SERVICES', 'D34', 'Vital signs tray or trolley (sphygmomanometer, thermometer, stethoscope, etc.)', 'MANUAL_SCORE', 2, 34, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D35', 'Sterilizer / Autoclave', 'MANUAL_SCORE', 2, 35, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D36', 'Screens and weighing scale', 'MANUAL_SCORE', 2, 36, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D37', 'Emergency tray or trolley (hydrocortisone, adrenaline, etc.)', 'MANUAL_SCORE', 2, 37, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D38', 'Instrument tray for specific service', 'MANUAL_SCORE', 1, 38, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D39', 'Adequate water source', 'MANUAL_SCORE', 2, 39, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D40', 'Adequate and alternative power source', 'MANUAL_SCORE', 2, 40, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D41', 'Firefighting equipment', 'MANUAL_SCORE', 2, 41, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D42', 'Emergency parking space', 'MANUAL_SCORE', 1, 42, 'MANUAL'),
    (v_template_id, 'SERVICES', 'D43', 'Ambulance services', 'MANUAL_SCORE', 2, 43, 'MANUAL');

END $$;
