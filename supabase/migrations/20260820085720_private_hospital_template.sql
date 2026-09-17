DO $$
DECLARE
    v_template_id UUID;
BEGIN
    -- 1. Add new facility types
    INSERT INTO public.inspection_facility_types (code, name, description, sort_order, active)
    VALUES 
        ('private-hospital', 'Private Hospital', 'Accreditation checklist for private hospitals (Primary Services).', 2, true),
        ('government-hospital', 'Government Hospital', 'Accreditation checklist for government-owned hospitals.', 6, true)
    ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name, 
        description = EXCLUDED.description, 
        active = true,
        updated_at = now();

    -- Deactivate the old generic 'hospital' type
    UPDATE public.inspection_facility_types SET active = false WHERE code = 'hospital';

    -- 2. Create the Private Hospital Template
    INSERT INTO public.inspection_templates (
        code, name, version, passing_threshold, conditional_threshold, active, facility_type_code,
        facility_profile_fields
    ) VALUES (
        'private-hospital-accreditation', 'Private Hospital Accreditation Inspection', '1.0', 75.00, 60.00, true, 'private-hospital',
        '[
            {"key": "facility_name", "type": "text", "label": "NAME OF FACILITY", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "ADDRESS", "required": true, "sort_order": 2},
            {"key": "physician_in_charge", "type": "text", "label": "NAME OF PHYSICIAN-IN-CHARGE", "required": true, "sort_order": 3},
            {"key": "physician_phone", "type": "text", "label": "PHONE NO", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "NAME OF DESK OFFICER", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "PHONE NO", "required": true, "sort_order": 6},
            {"key": "hospital_beds", "type": "number", "label": "NUMBER OF HOSPITAL BEDS", "required": true, "sort_order": 7},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA REGISTRATION", "required": true, "sort_order": 8, "pair_with": "nhia_reg_no"},
            {"key": "nhia_reg_no", "type": "text", "label": "Reg No:", "required": false, "sort_order": 9, "hidden": true},
            {"key": "smoh_registered", "type": "boolean", "label": "CURRENT SMOH REGISTRATION", "required": true, "sort_order": 10, "pair_with": "smoh_reg_no"},
            {"key": "smoh_reg_no", "type": "text", "label": "Reg No:", "required": false, "sort_order": 11, "hidden": true},
            {"key": "facility_email", "type": "email", "label": "FACILITY EMAIL", "required": true, "sort_order": 12},
            {"key": "inspection_date", "type": "date", "label": "DATE OF INSPECTION", "required": true, "sort_order": 13}
        ]'::jsonb
    )
    ON CONFLICT (code) DO UPDATE SET
        active = true,
        facility_profile_fields = EXCLUDED.facility_profile_fields,
        facility_type_code = EXCLUDED.facility_type_code
    RETURNING id INTO v_template_id;

    -- 3. Seed Sections
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES 
        (v_template_id, 'ELIGIBILITY', 'ELIGIBILITY CRITERIA FOR PROVIDER REGISTRATION WITH ODCHC', 1, true),
        (v_template_id, 'PROFILE', 'A — GENERAL REQUIREMENTS / FACILITY PROFILE', 2, true),
        (v_template_id, 'PERSONNEL', 'B — PERSONNEL (SIGHT CURRENT PRACTICING LICENCE)', 3, true),
        (v_template_id, 'INFRASTRUCTURE', 'C — INFRASTRUCTURE', 4, true),
        (v_template_id, 'SERVICES', 'D — ESSENTIAL SERVICES', 5, true),
        (v_template_id, 'REMARKS', 'GENERAL REMARKS / RECOMMENDATION', 6, true),
        (v_template_id, 'TEAM', 'INSPECTION TEAM', 7, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- 4. Seed Items
    -- ELIGIBILITY
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'ELIGIBILITY', 'E1', 'Be accredited by the National Health Insurance Authority (NHIA)', 'boolean', 0, 1, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E2', 'Be registered with the Ondo State Ministry of Health (SMOH)', 'boolean', 0, 2, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E3', 'Pay prescribed fees', 'boolean', 0, 3, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E4', 'Have / Purchase Health Insurance Plan for staff of the facility', 'boolean', 0, 4, 'yes_no_with_points');

    -- PERSONNEL (Items 9-19)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'PERSONNEL';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method, min_required)
    VALUES
    (v_template_id, 'PERSONNEL', 'B9', 'Medical Doctors with professional licences/reg. no (at least 1)', 'number', 3, 9, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B10', 'Pharmacist with professional licence/reg.no', 'number', 2, 10, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B11', 'Pharmacy technician with professional licence/reg.no (at least 1)', 'number', 2, 11, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B12', 'Registered Nurse or midwife with professional licence/reg.no (at least 2) (BNSC)', 'number', 3, 12, 'manual_only', 2),
    (v_template_id, 'PERSONNEL', 'B13', 'Nurse/Midwife with professional licence/reg. no (RN, RM, RN/RM)', 'number', 2, 13, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B14', 'Chew/CHO with professional licence (at least 2)', 'number', 2, 14, 'manual_only', 2),
    (v_template_id, 'PERSONNEL', 'B15', 'Med/Lab scientist with professional licence/reg.no', 'number', 3, 15, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B16', 'Med/Lab technician with professional licence/reg.no', 'number', 2, 16, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B17', 'Medical records officers with professional licence/reg.no', 'number', 2, 17, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B18', 'Medical records technician with professional licence/reg.no (at least 1)', 'number', 2, 18, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B19', 'Hospital Attendant (at least 2)', 'number', 2, 19, 'manual_only', 2);

    -- INFRASTRUCTURE (Items 20-42)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'INFRASTRUCTURE';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'INFRASTRUCTURE', 'C20', 'Waiting or reception area at least 4x3 metres', 'boolean', 2, 20, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C21', 'Medical record keeping facilities', 'boolean', 2, 21, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C22', 'Consulting room of 4x3 metres', 'boolean', 2, 22, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C23', 'Treatment room with wash hand basin and safety box for sharps', 'boolean', 3, 23, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C24', 'Pharmacy with drug cabinet', 'boolean', 5, 24, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C25', 'Medical Laboratory (USS machine, MP, Urinalysis, PCV, blood sugar & pregnancy test kits, Spirit lamps, lab glassware, haematocrit centrifuge etc.)', 'boolean', 3, 25, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C26', 'Surgical operating theatre with male circumcision set, ear piercing set, catheterization materials, I&D instruments with other surgical sets', 'boolean', 3, 26, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C27', 'Possession of adequate ICT with internet access', 'boolean', 3, 27, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C28', 'Lying-in ward with minimum distance of 1m in-between beds', 'boolean', 2, 28, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C29', 'A locker and an over-bed table per bed', 'boolean', 1, 29, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C30', 'Color coded containers', 'boolean', 2, 30, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C31', 'Separate wards for male, female and children', 'boolean', 3, 31, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C32', 'Delivery room with required gadgets, consumables and instruments with emergency drugs', 'boolean', 2, 32, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C33', 'Wheel Chair / Patient''s examination couch', 'boolean', 2, 33, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C34', 'Sluice Room', 'boolean', 3, 34, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C35', 'Possession of appropriate equipment and staff for other specialization', 'boolean', 3, 35, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C36', 'Laundry Service', 'boolean', 2, 36, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C38', 'Stadiometer', 'boolean', 2, 38, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C39', 'Oxygen', 'boolean', 4, 39, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C40', 'Resuscitative equipment e.g. ambu bag, suction machine etc.', 'boolean', 4, 40, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C41', 'Bed Pan / Urinal', 'boolean', 2, 41, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C42', 'At least 4 Bed Linens Per Bed', 'boolean', 2, 42, 'manual_only');

    -- ESSENTIAL SERVICES (Items 43-52)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'SERVICES';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'SERVICES', 'D43', 'Vital signs tray or trolley containing sphygmomanometer, thermometer, stethoscope etc.', 'boolean', 2, 43, 'manual_only'),
    (v_template_id, 'SERVICES', 'D44', 'Sterilizer / Autoclave', 'boolean', 2, 44, 'manual_only'),
    (v_template_id, 'SERVICES', 'D45', 'Screens and weighing scale', 'boolean', 2, 45, 'manual_only'),
    (v_template_id, 'SERVICES', 'D46', 'Emergency tray or trolley containing necessary drugs e.g. hydrocortisone, adrenaline etc.', 'boolean', 2, 46, 'manual_only'),
    (v_template_id, 'SERVICES', 'D47', 'Instrument tray containing requisite instruments for specific service', 'boolean', 1, 47, 'manual_only'),
    (v_template_id, 'SERVICES', 'D48', 'Adequate Water source', 'boolean', 2, 48, 'manual_only'),
    (v_template_id, 'SERVICES', 'D49', 'Adequate and alternative Power Source', 'boolean', 2, 49, 'manual_only'),
    (v_template_id, 'SERVICES', 'D50', 'Firefighting Equipment', 'boolean', 2, 50, 'manual_only'),
    (v_template_id, 'SERVICES', 'D51', 'Emergency parking space', 'boolean', 1, 51, 'manual_only'),
    (v_template_id, 'SERVICES', 'D52', 'Ambulance services', 'boolean', 2, 52, 'manual_only');

END $$;