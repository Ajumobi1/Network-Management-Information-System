DO $$
DECLARE
    v_template_id UUID;
BEGIN
    -- Get the Hospital Template ID
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- 1. Remove eligibility items from the items table (they were wrongly placed there)
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'ELIGIBILITY';
        
        -- 2. Insert them into the correct eligibility table
        INSERT INTO public.inspection_template_eligibility (template_id, criterion_code, criterion_label, required, sort_order)
        VALUES
        (v_template_id, 'E1', 'Accredited by the National Health Insurance Authority (NHIA)', true, 1),
        (v_template_id, 'E2', 'Registered with the Ondo State Ministry of Health (SMOH)', true, 2),
        (v_template_id, 'E3', 'Prescribed fees paid', true, 3),
        (v_template_id, 'E4', 'Health Insurance Plan purchased for facility staff', true, 4)
        ON CONFLICT (template_id, criterion_code) DO UPDATE SET criterion_label = EXCLUDED.criterion_label, required = EXCLUDED.required;
    END IF;
END $$;
