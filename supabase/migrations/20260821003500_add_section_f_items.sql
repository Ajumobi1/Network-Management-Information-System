DO $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- Add Section F items to the REMARKS section
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'REMARKS';
        
        INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order) VALUES
        (v_template_id, 'REMARKS', 'INTERVIEWER_NAME', 'INTERVIEWER NAME', 'text', 0, 1),
        (v_template_id, 'REMARKS', 'INTERVIEWER_DATE', 'DATE', 'text', 0, 2);
    END IF;
END $$;
COMMIT;
