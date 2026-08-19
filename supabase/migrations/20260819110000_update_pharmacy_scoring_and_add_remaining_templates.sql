DO $$
DECLARE
    v_pharmacy_id UUID;
    v_optical_id UUID;
    v_dental_id UUID;
    v_diagnostic_id UUID;
BEGIN
    -- 1. Update Pharmacy Template to manual scoring for ALL items
    SELECT id INTO v_pharmacy_id FROM public.inspection_templates WHERE code = 'pharmacy-accreditation';
    
    IF v_pharmacy_id IS NOT NULL THEN
        -- Update sections labels to match Hospital style
        UPDATE public.inspection_template_sections SET section_label = 'Section B — Personnel' WHERE template_id = v_pharmacy_id AND section_code = 'B';
        UPDATE public.inspection_template_sections SET section_label = 'Section C — Infrastructure' WHERE template_id = v_pharmacy_id AND section_code = 'C';
        UPDATE public.inspection_template_sections SET section_label = 'Section D — Essential Services' WHERE template_id = v_pharmacy_id AND section_code = 'D';

        -- Update ALL items to manual_only scoring
        UPDATE public.inspection_template_items 
        SET scoring_method = 'manual_only',
            manual_score_allowed = true
        WHERE template_id = v_pharmacy_id;

        -- Ensure correct response types (Personnel should be number, others are Yes/No + Score)
        UPDATE public.inspection_template_items SET response_type = 'number' WHERE template_id = v_pharmacy_id AND section_code = 'B';
        UPDATE public.inspection_template_items SET response_type = 'boolean' WHERE template_id = v_pharmacy_id AND section_code IN ('C', 'D');
    END IF;

    -- 2. Seed Optical Centre Template
    INSERT INTO public.inspection_templates (code, name, version, passing_threshold, conditional_threshold, active, facility_type_code, facility_profile_fields)
    VALUES ('optical-accreditation', 'Optical Centre Accreditation Inspection', '1.0 (Draft)', 75, 60, true, 'optical-centre',
        '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "optometrist_in_charge", "type": "text", "label": "Name of Optometrist-in-Charge", "required": true, "sort_order": 3},
            {"key": "optometrist_phone", "type": "text", "label": "Optometrist Phone No", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "Desk Officer Phone No", "required": true, "sort_order": 6},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registered?", "required": true, "sort_order": 7},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Registration No.", "required": false, "sort_order": 8},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH & ODORBN Registered?", "required": true, "sort_order": 9},
            {"key": "smoh_reg_no", "type": "text", "label": "Registration No.", "required": false, "sort_order": 10},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 11},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 12}
        ]'::jsonb
    ) ON CONFLICT (code) DO UPDATE SET active = true RETURNING id INTO v_optical_id;

    -- 3. Seed Dental Centre Template
    INSERT INTO public.inspection_templates (code, name, version, passing_threshold, conditional_threshold, active, facility_type_code, facility_profile_fields)
    VALUES ('dental-accreditation', 'Dental Centre Accreditation Inspection', '1.0 (Draft)', 75, 60, true, 'dental-centre',
        '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "dentist_in_charge", "type": "text", "label": "Name of Dentist-in-Charge", "required": true, "sort_order": 3},
            {"key": "dentist_phone", "type": "text", "label": "Dentist Phone No", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "Desk Officer Phone No", "required": true, "sort_order": 6},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registered?", "required": true, "sort_order": 7},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Registration No.", "required": false, "sort_order": 8},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH & Dental Council Registered?", "required": true, "sort_order": 9},
            {"key": "smoh_reg_no", "type": "text", "label": "Registration No.", "required": false, "sort_order": 10},
            {"key": "cac_registration_no", "type": "text", "label": "CAC Registration No.", "required": false, "sort_order": 11},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 12},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 13}
        ]'::jsonb
    ) ON CONFLICT (code) DO UPDATE SET active = true RETURNING id INTO v_dental_id;

    -- 4. Seed Diagnostic Centre Template
    INSERT INTO public.inspection_templates (code, name, version, passing_threshold, conditional_threshold, active, facility_type_code, facility_profile_fields)
    VALUES ('diagnostic-accreditation', 'Diagnostic Centre Accreditation Inspection', '1.0 (Draft)', 75, 60, true, 'diagnostic-centre',
        '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "director_in_charge", "type": "text", "label": "Name of Medical Director / Scientist-in-Charge", "required": true, "sort_order": 3},
            {"key": "director_phone", "type": "text", "label": "Director Phone No", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "Desk Officer Phone No", "required": true, "sort_order": 6},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registered?", "required": true, "sort_order": 7},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Registration No.", "required": false, "sort_order": 8},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH & MLSCN Registered?", "required": true, "sort_order": 9},
            {"key": "smoh_reg_no", "type": "text", "label": "Registration No.", "required": false, "sort_order": 10},
            {"key": "cac_registration_no", "type": "text", "label": "CAC Registration No.", "required": false, "sort_order": 11},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 12},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 13}
        ]'::jsonb
    ) ON CONFLICT (code) DO UPDATE SET active = true RETURNING id INTO v_diagnostic_id;

    -- 5. Seed Sections and Eligibility for all 3 new templates
    FOR v_id IN SELECT id FROM public.inspection_templates WHERE code IN ('optical-accreditation', 'dental-accreditation', 'diagnostic-accreditation') LOOP
        INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
        VALUES 
            (v_id, 'ELIGIBILITY', 'Eligibility Criteria', 1, true),
            (v_id, 'PERSONNEL', 'Section B — Personnel', 2, true),
            (v_id, 'INFRASTRUCTURE', 'Section C — Infrastructure', 3, true),
            (v_id, 'SERVICES', 'Section D — Essential Services', 4, true)
        ON CONFLICT (template_id, section_code) DO NOTHING;

        INSERT INTO public.inspection_template_eligibility (template_id, criterion_code, criterion_label, required, sort_order)
        VALUES
            (v_id, 'NHIA', 'Accredited by the National Health Insurance Authority (NHIA)', true, 1),
            (v_id, 'SMOH', 'Registered with the Ondo State Ministry of Health (SMOH)', true, 2),
            (v_id, 'FEES', 'Prescribed fees paid', true, 3),
            (v_id, 'INSURANCE', 'Health Insurance Plan purchased for facility staff', true, 4)
        ON CONFLICT (template_id, criterion_code) DO NOTHING;
    END LOOP;

    -- 6. Seed Items for Dental Centre (Section 2.10)
    DELETE FROM public.inspection_template_items WHERE template_id = v_dental_id;
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method, min_required)
    VALUES
        (v_dental_id, 'PERSONNEL', 'B1', 'Dental Surgeon with professional licence/reg. no', 'number', 8, 1, 'manual_only', 1),
        (v_dental_id, 'PERSONNEL', 'B2', 'Dental Therapist/Technologist with professional licence/reg. no', 'number', 4, 2, 'manual_only', 0),
        (v_dental_id, 'PERSONNEL', 'B3', 'Dental Nurse/Chairside Assistant', 'number', 4, 3, 'manual_only', 1),
        (v_dental_id, 'PERSONNEL', 'B4', 'Dental Technician — prosthetics/denture work', 'number', 3, 4, 'manual_only', 0),
        (v_dental_id, 'PERSONNEL', 'B5', 'Records/Reception Officer', 'number', 3, 5, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C6', 'Reception/Waiting Area', 'boolean', 3, 6, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C7', 'Dental Surgery/Operatory Room (per chair)', 'boolean', 6, 7, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C8', 'Dental Chair Unit with handpieces and compressor', 'boolean', 8, 8, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C9', 'X-ray Room/Equipment (intraoral/panoramic) with radiation shielding', 'boolean', 6, 9, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C10', 'Sterilization Room/Autoclave', 'boolean', 6, 10, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C11', 'Instrument Sets (extraction, restorative, scaling kits)', 'boolean', 5, 11, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C12', 'Dental Laboratory (in-house or documented access agreement)', 'boolean', 4, 12, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C13', 'Consumables Store (amalgam, composite, anaesthetics, gloves)', 'boolean', 4, 13, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C14', 'Record Keeping / Patient Files (digital or physical)', 'boolean', 3, 14, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C15', 'Waste Disposal (sharps box, biohazard bin)', 'boolean', 4, 15, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C16', 'Handwashing/Infection Control Station', 'boolean', 3, 16, 'manual_only', 0),
        (v_dental_id, 'INFRASTRUCTURE', 'C17', 'Signage and Facility Branding', 'boolean', 3, 17, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D18', 'Adequate Water Source', 'boolean', 3, 18, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D19', 'Adequate and Alternative Power Source', 'boolean', 3, 19, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D20', 'Firefighting Equipment', 'boolean', 2, 20, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D21', 'Emergency Drug Tray/Kit (dental emergencies, e.g., anaphylaxis)', 'boolean', 4, 21, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D22', 'Oxygen and Resuscitation Equipment', 'boolean', 4, 22, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D23', 'Internet Connectivity', 'boolean', 2, 23, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D24', 'Laptop/Desktop/Tablet for records', 'boolean', 2, 24, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D25', 'Emergency Parking Space', 'boolean', 2, 25, 'manual_only', 0),
        (v_dental_id, 'SERVICES', 'D26', 'Documented Referral Arrangement with a Hospital', 'boolean', 1, 26, 'manual_only', 0);

    -- 7. Seed Items for Diagnostic Centre (Section 2.11)
    DELETE FROM public.inspection_template_items WHERE template_id = v_diagnostic_id;
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method, min_required)
    VALUES
        (v_diagnostic_id, 'PERSONNEL', 'B1', 'Medical Laboratory Scientist with professional licence/reg. no', 'number', 6, 1, 'manual_only', 1),
        (v_diagnostic_id, 'PERSONNEL', 'B2', 'Medical Laboratory Technician with professional licence/reg. no', 'number', 4, 2, 'manual_only', 0),
        (v_diagnostic_id, 'PERSONNEL', 'B3', 'Radiographer/Sonographer with professional licence/reg. no', 'number', 4, 3, 'manual_only', 0),
        (v_diagnostic_id, 'PERSONNEL', 'B4', 'Phlebotomist/Sample Collection Staff', 'number', 3, 4, 'manual_only', 0),
        (v_diagnostic_id, 'PERSONNEL', 'B5', 'Records/Reception Officer', 'number', 3, 5, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C6', 'Reception/Waiting Area', 'boolean', 3, 6, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C7', 'Sample Collection Room (with privacy)', 'boolean', 4, 7, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C8', 'Laboratory Bench/Workstation Area', 'boolean', 5, 8, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C9', 'Haematology Section/Equipment', 'boolean', 5, 9, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C10', 'Chemical Pathology/Biochemistry Section/Equipment', 'boolean', 5, 10, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C11', 'Microbiology Section/Equipment (incubator, autoclave, culture media)', 'boolean', 5, 11, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C12', 'Imaging Room (X-ray/Ultrasound) with radiation shielding', 'boolean', 6, 12, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C13', 'Refrigerator/Cold Chain Storage for reagents & samples', 'boolean', 5, 13, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C14', 'Power Backup (UPS/Inverter) for sensitive equipment', 'boolean', 5, 14, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C15', 'Waste Management (autoclave for bio-waste, sharps disposal)', 'boolean', 5, 15, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C16', 'Record Keeping (LIS or physical register)', 'boolean', 3, 16, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C17', 'Signage and Safety Notices (Biohazard, Radiation)', 'boolean', 3, 17, 'manual_only', 0),
        (v_diagnostic_id, 'INFRASTRUCTURE', 'C18', 'Handwashing/Decontamination Station', 'boolean', 4, 18, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D19', 'Adequate Water Source', 'boolean', 3, 19, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D20', 'Adequate and Alternative Power Source (Generator)', 'boolean', 4, 20, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D21', 'Firefighting Equipment', 'boolean', 3, 21, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D22', 'First Aid / Emergency Kit', 'boolean', 3, 22, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D23', 'Internet Connectivity', 'boolean', 3, 23, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D24', 'Laptop/Desktop for result processing', 'boolean', 3, 24, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D25', 'Emergency Parking Space', 'boolean', 2, 25, 'manual_only', 0),
        (v_diagnostic_id, 'SERVICES', 'D26', 'Documented Quality Control (Internal/External)', 'boolean', 4, 26, 'manual_only', 0);

END $$;
