BEGIN;

DO $$
DECLARE
    v_template_id UUID;
BEGIN
    -- 1. Get and Clear the Government Hospital template
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id;
        DELETE FROM public.inspection_template_sections WHERE template_id = v_template_id;
        DELETE FROM public.inspection_template_eligibility WHERE template_id = v_template_id;
        
        -- Update template to be non-scored
        UPDATE public.inspection_templates SET
            name = 'Government Hospital Quality Assurance Checklist',
            passing_threshold = 0,
            conditional_threshold = 0,
            facility_profile_fields = '[
                {"key": "reference_quarter", "type": "select", "label": "Reference Quarter", "required": true, "options": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"], "sort_order": 1},
                {"key": "reference_year", "type": "number", "label": "Reference Year", "required": true, "sort_order": 2},
                {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 3},
                {"key": "address", "type": "text", "label": "Address of Facility / Location", "required": true, "sort_order": 4},
                {"key": "lga_district", "type": "text", "label": "Local Government / Senatorial District", "required": true, "sort_order": 5},
                {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 6},
                {"key": "nhia_accredited", "type": "boolean", "label": "Is your facility accredited by NHIA?", "required": true, "pair_with": "nhia_reg_no", "sort_order": 7},
                {"key": "nhia_reg_no", "type": "text", "label": "Registration Number", "required": false, "sort_order": 8},
                {"key": "oranghis_enrollees", "type": "number", "label": "Number of ORANGHIS Enrollees", "required": true, "sort_order": 9},
                {"key": "last_hfmc_meeting", "type": "text", "label": "When last did the HFMC meet?", "required": true, "sort_order": 10},
                {"key": "dedicated_officer", "type": "boolean", "label": "Is there a dedicated officer for ORANGHIS?", "required": true, "sort_order": 11},
                {"key": "desk_officer_name", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 12},
                {"key": "desk_officer_phone", "type": "text", "label": "Phone Number of Desk Officer", "required": true, "sort_order": 13},
                {"key": "tpa_visits", "type": "boolean", "label": "Did you receive monthly TPA supervisory visits?", "required": true, "sort_order": 14},
                {"key": "odchc_visits", "type": "boolean", "label": "Did you receive quarterly ODCHC supervisory visits?", "required": true, "sort_order": 15},
                {"key": "service_24h", "type": "boolean", "label": "Does your facility provide 24-hour service?", "required": true, "sort_order": 16}
            ]'::jsonb
        WHERE id = v_template_id;
    ELSE
        -- Create if it doesn't exist (unlikely given previous steps)
        INSERT INTO public.inspection_templates (
            code, name, version, passing_threshold, conditional_threshold, active, facility_type_code,
            facility_profile_fields
        ) VALUES (
            'government-hospital-accreditation', 'Government Hospital Quality Assurance Checklist', '1.0', 0, 0, true, 'government-hospital',
            '[
                {"key": "reference_quarter", "type": "select", "label": "Reference Quarter", "required": true, "options": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"], "sort_order": 1},
                {"key": "reference_year", "type": "number", "label": "Reference Year", "required": true, "sort_order": 2},
                {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 3},
                {"key": "address", "type": "text", "label": "Address of Facility / Location", "required": true, "sort_order": 4},
                {"key": "lga_district", "type": "text", "label": "Local Government / Senatorial District", "required": true, "sort_order": 5},
                {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 6},
                {"key": "nhia_accredited", "type": "boolean", "label": "Is your facility accredited by NHIA?", "required": true, "pair_with": "nhia_reg_no", "sort_order": 7},
                {"key": "nhia_reg_no", "type": "text", "label": "Registration Number", "required": false, "sort_order": 8},
                {"key": "oranghis_enrollees", "type": "number", "label": "Number of ORANGHIS Enrollees", "required": true, "sort_order": 9},
                {"key": "last_hfmc_meeting", "type": "text", "label": "When last did the HFMC meet?", "required": true, "sort_order": 10},
                {"key": "dedicated_officer", "type": "boolean", "label": "Is there a dedicated officer for ORANGHIS?", "required": true, "sort_order": 11},
                {"key": "desk_officer_name", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 12},
                {"key": "desk_officer_phone", "type": "text", "label": "Phone Number of Desk Officer", "required": true, "sort_order": 13},
                {"key": "tpa_visits", "type": "boolean", "label": "Did you receive monthly TPA supervisory visits?", "required": true, "sort_order": 14},
                {"key": "odchc_visits", "type": "boolean", "label": "Did you receive quarterly ODCHC supervisory visits?", "required": true, "sort_order": 15},
                {"key": "service_24h", "type": "boolean", "label": "Does your facility provide 24-hour service?", "required": true, "sort_order": 16}
            ]'::jsonb
        ) RETURNING id INTO v_template_id;
    END IF;

    -- 2. Seed Sections
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES 
    (v_template_id, 'STAFFING', 'Section B — Operational / Staffing', 1, true),
    (v_template_id, 'DRUGS', 'Section C — Drug Management System (Q18)', 2, true),
    (v_template_id, 'IMPLEMENTATION', 'Section D — Programme Implementation', 3, true),
    (v_template_id, 'FINANCIAL', 'Section E — Financial Management', 4, true),
    (v_template_id, 'REMARKS', 'Section F — Challenges & Observations', 5, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- 3. Seed Items
    -- STAFFING
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'STAFFING', 'Q14', 'Total number of staff (skilled and non-skilled)', 'number', 0, 1, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-1', 'Number of Consultants', 'number', 0, 2, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-2', 'Number of Medical Doctors', 'number', 0, 3, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-3', 'Number of Pharmacists', 'number', 0, 4, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-4', 'Number of Laboratory Scientists', 'number', 0, 5, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-5', 'Number of Midwives/Nurses', 'number', 0, 6, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-6', 'Number of Pharmacy Technician', 'number', 0, 7, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-7', 'Number of Laboratory Technician', 'number', 0, 8, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-8', 'Number of CHEW', 'number', 0, 9, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-9', 'Number of JCHEW', 'number', 0, 10, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-10', 'Number of Medical Record Officer', 'number', 0, 11, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-11', 'Number of Medical Record Technicians', 'number', 0, 12, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-12', 'Number of Health Attendant/Assistant', 'number', 0, 13, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-13', 'Number of Security Personnel', 'number', 0, 14, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q15-14', 'Total Number of Beds', 'number', 0, 15, 'manual_only'),
    (v_template_id, 'STAFFING', 'Q16', 'Have you received training on ORANGHIS implementation?', 'boolean', 0, 16, 'manual_only');

    -- DRUGS
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'DRUGS', 'Q18-1', 'Is there a drug store in the facility?', 'boolean', 0, 1, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-2', 'Is the drug store managed by a pharmacist?', 'boolean', 0, 2, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-3', 'Are there essential drugs in the facility?', 'boolean', 0, 3, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-4', 'Are the drugs stored in a cool dry place?', 'boolean', 0, 4, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-5', 'Does the facility have a drug revolving fund?', 'boolean', 0, 5, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-6', 'Adequate drug storage with A/C', 'boolean', 0, 6, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-7', 'Assess the drug store for labelling', 'boolean', 0, 7, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q18-8', 'Amount budgeted for drugs per month/quarter', 'number', 0, 8, 'manual_only'),
    (v_template_id, 'DRUGS', 'Q19', 'How much did you generate apart from ORANGHIS fund?', 'number', 0, 9, 'manual_only');

    -- IMPLEMENTATION
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'IMPLEMENTATION', 'Q20', 'Does your facility have the ODCHC workplan?', 'boolean', 0, 1, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q21a', 'Number of referrals for secondary services', 'number', 0, 2, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q21b', 'Number of referrals to SHF approved', 'number', 0, 3, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q21c', 'Did you refer ORANGHIS beneficiaries to SHC facility?', 'boolean', 0, 4, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q22a', 'Did you refer ORANGHIS beneficiaries to other facilities?', 'boolean', 0, 5, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra1', 'Availability of water?', 'boolean', 0, 6, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra2', 'Availability of power?', 'boolean', 0, 7, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra3', 'Availability of medical waste disposal?', 'boolean', 0, 8, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra4', 'Availability of ambulance?', 'boolean', 0, 9, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra5', 'Availability of firefighting equipment?', 'boolean', 0, 10, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra6', 'Availability of security?', 'boolean', 0, 11, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra7', 'Are the toilets clean?', 'boolean', 0, 12, 'manual_only'),
    (v_template_id, 'IMPLEMENTATION', 'Q23-infra8', 'Is the hospital environment clean/grass well cut?', 'boolean', 0, 13, 'manual_only');

    -- FINANCIAL
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'FINANCIAL', 'Q24a', 'Did you receive capitation from ODCHC?', 'boolean', 0, 1, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q24b', 'If no, when last did you receive capitation?', 'text', 0, 2, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q24c', 'Evidence of capitation received (Table)', 'json', 0, 3, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q25-1', 'Amount spent on Essential drugs and consumables (Table)', 'json', 0, 4, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q25-2', 'Amount spent on Maintenance (Table)', 'json', 0, 5, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q25-3', 'Amount spent on HR development (Table)', 'json', 0, 6, 'manual_only'),
    (v_template_id, 'FINANCIAL', 'Q25-4', 'Amount spent on Other things (Table)', 'json', 0, 7, 'manual_only');

    -- REMARKS
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'REMARKS', 'Q29', 'Challenges facing ORANGHIS in your facility', 'text', 0, 1, 'manual_only'),
    (v_template_id, 'REMARKS', 'Q30', 'Your recommendations', 'text', 0, 2, 'manual_only'),
    (v_template_id, 'OBS', 'OBS', 'General Observations', 'text', 0, 3, 'manual_only');

END $$;

COMMIT;
