DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
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