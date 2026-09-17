DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- Update Profile Fields to match user request exactly
        UPDATE public.inspection_templates
        SET facility_profile_fields = '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "physician_in_charge", "type": "text", "label": "Name of Physician-in-Charge", "required": true, "sort_order": 3},
            {"key": "physician_phone", "type": "text", "label": "Phone No", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "desk_officer_phone", "type": "text", "label": "Phone No", "required": true, "sort_order": 6},
            {"key": "hospital_beds", "type": "number", "label": "Number of Hospital Beds", "required": true, "sort_order": 7},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registration", "required": true, "sort_order": 8},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Reg No.", "required": false, "sort_order": 9},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH Registration", "required": true, "sort_order": 10},
            {"key": "smoh_reg_no", "type": "text", "label": "SMOH Reg No.", "required": false, "sort_order": 11},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 12},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 13}
        ]'::jsonb
        WHERE id = v_template_id;

        -- Update Eligibility Wording
        UPDATE public.inspection_template_eligibility
        SET criterion_label = CASE 
            WHEN criterion_code = 'E1' THEN 'Be accredited by the National Health Insurance Authority (NHIA)'
            WHEN criterion_code = 'E2' THEN 'Be registered with the Ondo State Ministry of Health (SMOH)'
            WHEN criterion_code = 'E3' THEN 'Pay prescribed fees'
            WHEN criterion_code = 'E4' THEN 'Have / Purchase Health Insurance Plan for staff of the facility'
            ELSE criterion_label
        END
        WHERE template_id = v_template_id;
    END IF;
END $$;