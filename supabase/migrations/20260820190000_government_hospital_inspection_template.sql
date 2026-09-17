BEGIN;

-- 1. Ensure government-hospital facility type exists
INSERT INTO public.inspection_facility_types (code, name, description, sort_order, active)
VALUES ('government-hospital', 'Government Hospital', 'Official ODCHC accreditation inspection checklist for Government Hospitals', 2, true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, active = true;

-- 2. Upsert Government Hospital Template
DO $$
DECLARE
    v_template_id UUID;
BEGIN
    INSERT INTO public.inspection_templates (
        code, name, version, passing_threshold, conditional_threshold, active, facility_type_code,
        facility_profile_fields
    ) VALUES (
        'government-hospital-accreditation', 'Government Hospital Facility Accreditation Inspection', '1.0', 75.00, 60.00, true, 'government-hospital',
        '[
            {"key": "facility_name", "type": "text", "label": "Name of Facility", "required": true, "sort_order": 1},
            {"key": "address", "type": "text", "label": "Address", "required": true, "sort_order": 2},
            {"key": "medical_director", "type": "text", "label": "Name of Medical Director / Physician-in-Charge", "required": true, "sort_order": 3},
            {"key": "telephone", "type": "text", "label": "Phone Number", "required": true, "sort_order": 4},
            {"key": "desk_officer", "type": "text", "label": "Name of Desk Officer", "required": true, "sort_order": 5},
            {"key": "hospital_beds", "type": "number", "label": "Number of Hospital Beds", "required": true, "sort_order": 6},
            {"key": "nhia_registered", "type": "boolean", "label": "NHIA Registered?", "required": true, "sort_order": 7},
            {"key": "nhia_reg_no", "type": "text", "label": "NHIA Registration No.", "required": false, "sort_order": 8},
            {"key": "smoh_registered", "type": "boolean", "label": "Current SMOH Registered?", "required": true, "sort_order": 9},
            {"key": "smoh_reg_no", "type": "text", "label": "Current SMOH Registration No.", "required": false, "sort_order": 10},
            {"key": "facility_email", "type": "email", "label": "Facility Email", "required": true, "sort_order": 11},
            {"key": "inspection_date", "type": "date", "label": "Date of Inspection", "required": true, "sort_order": 12}
        ]'::jsonb
    )
    ON CONFLICT (code) DO UPDATE SET
        active = true,
        facility_profile_fields = EXCLUDED.facility_profile_fields
    RETURNING id INTO v_template_id;

    -- 3. Seed Sections for Government Hospital
    INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, sort_order, active)
    VALUES 
    (v_template_id, 'ELIGIBILITY', 'Eligibility Criteria', 1, true),
    (v_template_id, 'PERSONNEL', 'Section B — Personnel', 2, true),
    (v_template_id, 'INFRASTRUCTURE', 'Section C — Infrastructure', 3, true),
    (v_template_id, 'SERVICES', 'Section D — Essential Services & Programme Implementation', 4, true)
    ON CONFLICT (template_id, section_code) DO UPDATE SET section_label = EXCLUDED.section_label;

    -- 4. Seed Items for Government Hospital
    -- ELIGIBILITY
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'ELIGIBILITY', 'E1', 'Accredited by the National Health Insurance Authority (NHIA)', 'boolean', 0, 1, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E2', 'Registered with the Ondo State Ministry of Health (SMOH)', 'boolean', 0, 2, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E3', 'Prescribed fees paid', 'boolean', 0, 3, 'yes_no_with_points'),
    (v_template_id, 'ELIGIBILITY', 'E4', 'Health Insurance Plan purchased for facility staff', 'boolean', 0, 4, 'yes_no_with_points');

    -- PERSONNEL (Section B)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'PERSONNEL';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method, min_required)
    VALUES
    (v_template_id, 'PERSONNEL', 'B1', 'Number of Consultants', 'number', 4, 1, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B2', 'Number of Medical Doctors', 'number', 4, 2, 'manual_only', 2),
    (v_template_id, 'PERSONNEL', 'B3', 'Number of Pharmacists', 'number', 3, 3, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B4', 'Number of Laboratory Scientists', 'number', 3, 4, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B5', 'Number of Midwives/Nurses', 'number', 4, 5, 'manual_only', 2),
    (v_template_id, 'PERSONNEL', 'B6', 'Number of Pharmacy Technician', 'number', 2, 6, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B7', 'Number of Laboratory Technician', 'number', 2, 7, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B8', 'Number of CHEW', 'number', 2, 8, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B9', 'Number of JCHEW', 'number', 2, 9, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B10', 'Number of Medical Record Officer', 'number', 2, 10, 'manual_only', 1),
    (v_template_id, 'PERSONNEL', 'B11', 'Number of Medical Record Technicians', 'number', 1, 11, 'manual_only', 0),
    (v_template_id, 'PERSONNEL', 'B12', 'Number of Health Attendant/Assistant', 'number', 1, 12, 'manual_only', 1);

    -- INFRASTRUCTURE (Section C)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'INFRASTRUCTURE';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'INFRASTRUCTURE', 'C13', 'Waiting/Reception area with adequate seating', 'number', 3, 13, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C14', 'Medical record keeping facilities (electronic or physical)', 'number', 3, 14, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C15', 'Consulting rooms (adequate and well-ventilated)', 'number', 4, 15, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C16', 'Treatment room with wash-hand basin and safety box', 'number', 4, 16, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C17', 'Pharmacy unit with secure drug storage and dispensing counter', 'number', 5, 17, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C18', 'Medical Laboratory (fully equipped for routine haematology, chemistry, and microscopy)', 'number', 5, 18, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C19', 'Surgical operating theatre with sterile suite and instruments', 'number', 5, 19, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C20', 'ICT infrastructure with internet access for NHIA/ORANGHIS portal', 'number', 3, 20, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C21', 'Inpatient wards (male, female, pediatric, and maternity) with proper bed spacing', 'number', 5, 21, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C22', 'Delivery room with standard obstetric equipment and emergency tray', 'number', 4, 22, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C23', 'Radiology / Ultrasound services', 'number', 3, 23, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C24', 'Sluice Room and waste management facilities', 'number', 3, 24, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C25', 'Oxygen supply system (cylinders or central manifold)', 'number', 4, 25, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C26', 'Emergency resuscitation equipment (suction machine, ambu bags, crash cart)', 'number', 4, 26, 'manual_only'),
    (v_template_id, 'INFRASTRUCTURE', 'C27', 'Laundry and sterilization (autoclave) services', 'number', 3, 27, 'manual_only');

    -- SERVICES (Section D)
    DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'SERVICES';
    INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order, scoring_method)
    VALUES
    (v_template_id, 'SERVICES', 'D28', 'Reliable water source (borehole / running water)', 'number', 3, 28, 'manual_only'),
    (v_template_id, 'SERVICES', 'D29', 'Alternative power source (generator / solar backup)', 'number', 4, 29, 'manual_only'),
    (v_template_id, 'SERVICES', 'D30', 'Ambulance service for emergency referrals', 'number', 3, 30, 'manual_only'),
    (v_template_id, 'SERVICES', 'D31', 'Fire safety and firefighting equipment', 'number', 2, 31, 'manual_only'),
    (v_template_id, 'SERVICES', 'D32', 'ODCHC workplan and guidelines implementation', 'number', 3, 32, 'manual_only'),
    (v_template_id, 'SERVICES', 'D33', 'Monthly TPA and quarterly ODCHC supervisory visit compliance', 'number', 3, 33, 'manual_only');

END $$;

COMMIT;
