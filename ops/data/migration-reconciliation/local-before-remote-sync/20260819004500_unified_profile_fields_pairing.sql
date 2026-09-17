DO $$
DECLARE
    v_pharmacy_id UUID;
    v_hospital_id UUID;
BEGIN
    -- 1. Update Pharmacy Template
    SELECT id INTO v_pharmacy_id FROM public.inspection_templates WHERE code = 'pharmacy-accreditation';
    IF v_pharmacy_id IS NOT NULL THEN
        UPDATE public.inspection_templates
        SET facility_profile_fields = '[
            {"key": "facility_name", "type": "text", "label": "NAME OF FACILITY", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "ADDRESS", "required": true, "sort_order": 2},
            {"key": "superintendent_pharmacist", "type": "text", "label": "NAME OF SUPERINTENDENT PHARMACIST", "required": true, "sort_order": 3},
            {"key": "telephone", "type": "text", "label": "TELEPHONE NUMBER", "required": true, "sort_order": 4},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA REGISTRATION", "required": true, "sort_order": 5, "pair_with": "nhia_registration_no"},
            {"key": "nhia_registration_no", "type": "text", "label": "Reg No:", "required": false, "sort_order": 6, "hidden": true},
            {"key": "smoh_pcn_registered", "type": "boolean", "label": "CURRENT SMOH/PCN REGISTRATION", "required": true, "sort_order": 7, "pair_with": "smoh_pcn_registration_no"},
            {"key": "smoh_pcn_registration_no", "type": "text", "label": "Reg No:", "required": false, "sort_order": 8, "hidden": true},
            {"key": "premises_registration_license_no", "type": "text", "label": "PREMISES REGISTRATION/LICENSE NO.", "required": true, "sort_order": 9},
            {"key": "cac_registration_no", "type": "text", "label": "CAC REGISTRATION NO.", "required": true, "sort_order": 10},
            {"key": "facility_email", "type": "email", "label": "FACILITY EMAIL", "required": true, "sort_order": 11},
            {"key": "inspection_date", "type": "date", "label": "DATE OF INSPECTION", "required": true, "sort_order": 12}
        ]'::jsonb
        WHERE id = v_pharmacy_id;
    END IF;

    -- 2. Update Hospital Template (ensure labels match user request exactly)
    SELECT id INTO v_hospital_id FROM public.inspection_templates WHERE code = 'hospital-accreditation';
    IF v_hospital_id IS NOT NULL THEN
        UPDATE public.inspection_templates
        SET facility_profile_fields = '[
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
        WHERE id = v_hospital_id;
    END IF;
END $$;
