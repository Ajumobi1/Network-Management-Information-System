BEGIN;

DO $$
DECLARE
    v_template_id UUID;
BEGIN
    -- 1. Get the Government Hospital template ID
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- 2. Remove eligibility items from the regular items table
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';
        
        -- 3. Remove the ELIGIBILITY section from the sections table (it's a hardcoded step in the UI)
        DELETE FROM public.inspection_template_sections WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';

        -- 4. Register eligibility criteria in the CORRECT table (inspection_template_eligibility)
        DELETE FROM public.inspection_template_eligibility WHERE template_id = v_template_id;
        INSERT INTO public.inspection_template_eligibility (template_id, criterion_code, criterion_label, required, sort_order)
        VALUES
        (v_template_id, 'E1', 'Accredited by the National Health Insurance Authority (NHIA)', true, 1),
        (v_template_id, 'E2', 'Registered with the Ondo State Ministry of Health (SMOH)', true, 2),
        (v_template_id, 'E3', 'Prescribed fees paid', true, 3),
        (v_template_id, 'E4', 'Health Insurance Plan purchased for facility staff', true, 4);
    END IF;
END $$;

COMMIT;
