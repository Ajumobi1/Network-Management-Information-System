DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- Update Section B
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION B — ADMINISTRATION AND GOVERNANCE', 
            sort_order = 1 
        WHERE template_id = v_template_id AND section_code = 'B';

        -- Update Section C (Drugs)
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION C — DRUG MANAGEMENT SYSTEM', 
            sort_order = 2 
        WHERE template_id = v_template_id AND section_code = 'DRUGS';

        -- Update Section D (Implementation)
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION D — PROGRAMME IMPLEMENTATION', 
            sort_order = 3 
        WHERE template_id = v_template_id AND section_code = 'IMPLEMENTATION';

        -- Update Section E (Financial)
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION E — FINANCIAL MANAGEMENT', 
            sort_order = 4 
        WHERE template_id = v_template_id AND section_code = 'FINANCIAL';

        -- Update Section F (Remarks)
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION F — CHALLENGES & OBSERVATIONS', 
            sort_order = 5 
        WHERE template_id = v_template_id AND section_code = 'REMARKS';
    END IF;
END $$;
COMMIT;
