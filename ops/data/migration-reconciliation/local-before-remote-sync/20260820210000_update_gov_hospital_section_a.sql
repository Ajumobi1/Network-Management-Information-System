DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        UPDATE public.inspection_templates SET
            facility_profile_fields = '[
                {"key": "reference_quarter", "type": "select", "label": "Reference Quarter", "required": true, "options": ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"], "sort_order": 1},
                {"key": "reference_year", "type": "number", "label": "Reference Year", "required": true, "sort_order": 2},
                {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 3},
                {"key": "address", "type": "text", "label": "Address of Facility / Location", "required": true, "sort_order": 4},
                {"key": "lga_district", "type": "text", "label": "Local Government / Senatorial District", "required": true, "sort_order": 5},
                {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 6},
                {"key": "nhia_accredited", "type": "boolean", "label": "Is your facility accredited by NHIA?", "required": true, "pair_with": "nhia_reg_no", "sort_order": 7},
                {"key": "nhia_reg_no", "type": "text", "label": "Registration Number", "required": false, "sort_order": 8},
                {"key": "oranghis_enrollees", "type": "number", "label": "Number of ORANGHIS enrollees — (Select Quarter)", "required": true, "sort_order": 9},
                {"key": "oranghis_accessing_care", "type": "number", "label": "Number of ORANGHIS enrollees accessing care — (Select Quarter)", "required": true, "sort_order": 10}
            ]'::jsonb
        WHERE id = v_template_id;
    END IF;
END $$;
COMMIT;
