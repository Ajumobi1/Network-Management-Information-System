DO $$
DECLARE
    v_pharmacy_id UUID;
BEGIN
    SELECT id INTO v_pharmacy_id FROM public.inspection_templates WHERE code = 'pharmacy-accreditation';
    IF v_pharmacy_id IS NOT NULL THEN
        DELETE FROM public.inspection_template_items WHERE template_id = v_pharmacy_id;

        INSERT INTO public.inspection_template_items(template_id, section_code, item_code, item_label, response_type, min_required, max_points, scored_when_no, manual_score_allowed, sort_order, active)
        VALUES
        (v_pharmacy_id, 'B', 'B11', 'Pharmacist with professional license/reg. no (at least 1)', 'number', 1::numeric, 10::numeric, true, false, 11, true),
        (v_pharmacy_id, 'B', 'B12', 'Pharmacy Technician with Professional license/reg. no (at least 1)', 'number', 1::numeric, 5::numeric, true, false, 12, true),
        (v_pharmacy_id, 'B', 'B13', 'Pharmacy Attendants (at least 2)', 'number', 2::numeric, 5::numeric, true, false, 13, true),

        (v_pharmacy_id, 'C', 'C14', 'Dispensing Area', 'boolean', NULL, 5::numeric, true, false, 14, true),
        (v_pharmacy_id, 'C', 'C16', 'Waiting / Reception Area with chairs', 'boolean', NULL, 4::numeric, true, false, 16, true),
        (v_pharmacy_id, 'C', 'C17', 'Patient Counselling Area', 'boolean', NULL, 4::numeric, true, false, 17, true),
        (v_pharmacy_id, 'C', 'C18', 'Refrigerator', 'boolean', NULL, 5::numeric, true, false, 18, true),
        (v_pharmacy_id, 'C', 'C19', 'Poison Cupboard and Book', 'boolean', NULL, 5::numeric, true, false, 19, true),
        (v_pharmacy_id, 'C', 'C20', 'Equipment for Extemporaneous preparation', 'boolean', NULL, 3::numeric, true, false, 20, true),
        (v_pharmacy_id, 'C', 'C21', 'Facility for Filtration', 'boolean', NULL, 4::numeric, false, false, 21, true),
        (v_pharmacy_id, 'C', 'C22', 'Weighing Scales', 'boolean', NULL, 4::numeric, true, false, 22, true),
        (v_pharmacy_id, 'C', 'C23', 'Pallets or Shelves', 'boolean', NULL, 4::numeric, true, false, 23, true),
        (v_pharmacy_id, 'C', 'C23B', 'Copy of Reference Material (recent)', 'boolean', NULL, 5::numeric, true, false, 24, true),
        (v_pharmacy_id, 'C', 'C24', 'Air Conditioner / Ceiling fans', 'boolean', NULL, 4::numeric, true, false, 25, true),
        (v_pharmacy_id, 'C', 'C25', 'Drug Information Service', 'boolean', NULL, 5::numeric, true, false, 26, true),
        (v_pharmacy_id, 'C', 'C26', 'Records of Sales / Computer', 'boolean', NULL, 3::numeric, true, false, 27, true),
        (v_pharmacy_id, 'C', 'C27', 'Source of drugs (See Receipts)', 'boolean', NULL, 4::numeric, true, false, 28, true),

        (v_pharmacy_id, 'D', 'D27B', 'Adequate Water Source', 'boolean', NULL, 3::numeric, true, false, 29, true),
        (v_pharmacy_id, 'D', 'D28', 'Adequate and Alternative Power Source', 'boolean', NULL, 3::numeric, true, false, 30, true),
        (v_pharmacy_id, 'D', 'D29', 'Firefighting Equipment', 'boolean', NULL, 3::numeric, true, false, 31, true),
        (v_pharmacy_id, 'D', 'D30', 'Emergency Parking Space', 'boolean', NULL, 2::numeric, true, false, 32, true),
        (v_pharmacy_id, 'D', 'D31', 'Internet Connectivity', 'boolean', NULL, 5::numeric, false, false, 33, true),
        (v_pharmacy_id, 'D', 'D32', 'Laptop / Desktop / Tablet / Phone', 'boolean', NULL, 5::numeric, true, false, 34, true);
    END IF;
END $$;