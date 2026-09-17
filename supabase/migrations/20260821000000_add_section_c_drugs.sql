DO $$
DECLARE
    v_template_id UUID;
    v_section_c_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- Ensure Section C exists (labeled as Section C to avoid duplicate B)
        SELECT id INTO v_section_c_id FROM public.inspection_template_sections WHERE template_id = v_template_id AND section_code = 'DRUGS';
        IF v_section_c_id IS NULL THEN
            INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, description, sort_order)
            VALUES (v_template_id, 'DRUGS', 'SECTION C — DRUG MANAGEMENT SYSTEM', 'Pharmacy, dispensary, stocking, and drug revolving fund', 3)
            RETURNING id INTO v_section_c_id;
        ELSE
            UPDATE public.inspection_template_sections 
            SET section_label = 'SECTION C — DRUG MANAGEMENT SYSTEM', 
                sort_order = 3 
            WHERE id = v_section_c_id;
        END IF;

        -- Clear existing items for this section to rebuild from screenshots
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'DRUGS';

        -- Insert exact items from screenshots
        INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order) VALUES
        (v_template_id, 'DRUGS', 'Q018_1', 'Is the pharmacy/dispensary adequately stocked with ACT, Antibacterial, Antihypertensive, Antidiabetic drugs etc.?', 'boolean', 0, 1),
        (v_template_id, 'DRUGS', 'Q018_2', 'Prescribed drugs (appropriateness, dose & duration)', 'boolean', 0, 2),
        (v_template_id, 'DRUGS', 'Q018_3', 'Is Drug Revolving Fund (DRF) Committee in place and functional?', 'boolean', 0, 3),
        (v_template_id, 'DRUGS', 'Q018_3a', 'If no, how do you ensure availability of drugs in the hospital?', 'text', 0, 4),
        (v_template_id, 'DRUGS', 'Q018_4', 'Availability of drug counseling', 'boolean', 0, 5),
        (v_template_id, 'DRUGS', 'Q018_5', 'Provision for out-of-stock (O/S) for enrollees', 'boolean', 0, 6),
        (v_template_id, 'DRUGS', 'Q018_5a', 'If yes, what does facility do?', 'text', 0, 7),
        (v_template_id, 'DRUGS', 'Q018_6', 'Adequate drug storage with A/C', 'boolean', 0, 8),
        (v_template_id, 'DRUGS', 'Q018_7', 'Assess the drug store for labelling', 'boolean', 0, 9),
        (v_template_id, 'DRUGS', 'Q018_8', 'Amount budgeted for drugs per month/quarter (record the figure)', 'text', 0, 10),
        (v_template_id, 'DRUGS', 'Q019_DRUGS', 'How much did you generate apart from ORANGHIS fund? · Quarter: (select quarter)', 'text', 0, 11);
    END IF;
END $$;
COMMIT;
