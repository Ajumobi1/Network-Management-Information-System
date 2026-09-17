DO $$
DECLARE
    v_template_id UUID;
    v_section_e_id UUID;
BEGIN
    SELECT id INTO v_template_id FROM public.inspection_templates WHERE code = 'government-hospital-accreditation';
    
    IF v_template_id IS NOT NULL THEN
        -- 1. Fix Section B: Rename and ensure it covers Admin, Personnel, and Drugs
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION B — ADMINISTRATION, PERSONNEL & DRUG MANAGEMENT', 
            sort_order = 2 
        WHERE template_id = v_template_id AND section_code = 'B';

        -- Move Drug items from 'DRUGS' section to 'B' section
        UPDATE public.inspection_template_items
        SET section_code = 'B'
        WHERE template_id = v_template_id AND section_code = 'DRUGS';

        -- Delete the now-empty DRUGS section
        DELETE FROM public.inspection_template_sections 
        WHERE template_id = v_template_id AND section_code = 'DRUGS';

        -- 2. Fix Section C: Programme Implementation
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION C — PROGRAMME IMPLEMENTATION', 
            sort_order = 3 
        WHERE template_id = v_template_id AND section_code = 'IMPLEMENTATION';
        
        -- 3. Fix Section D: Financial Management
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION D — FINANCIAL MANAGEMENT', 
            sort_order = 4 
        WHERE template_id = v_template_id AND section_code = 'FINANCIAL';

        -- 4. Create/Update Section E: Challenges and Recommendations
        SELECT id INTO v_section_e_id FROM public.inspection_template_sections WHERE template_id = v_template_id AND section_code = 'CHALLENGES';
        IF v_section_e_id IS NULL THEN
            INSERT INTO public.inspection_template_sections (template_id, section_code, section_label, description, sort_order)
            VALUES (v_template_id, 'CHALLENGES', 'SECTION E — CHALLENGES AND RECOMMENDATIONS', 'Facility feedback, risks, and recommendations', 5)
            RETURNING id INTO v_section_e_id;
        ELSE
            UPDATE public.inspection_template_sections 
            SET section_label = 'SECTION E — CHALLENGES AND RECOMMENDATIONS', 
                sort_order = 5 
            WHERE id = v_section_e_id;
        END IF;

        -- Remove conflicting items from old REMARKS section before adding to CHALLENGES
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND item_code = 'OBS';
        
        -- Add Section E items
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'CHALLENGES';
        INSERT INTO public.inspection_template_items (template_id, section_code, item_code, item_label, response_type, max_points, sort_order) VALUES
        (v_template_id, 'CHALLENGES', 'Q029', 'What are the challenges facing ORANGHIS in your facility?', 'text', 0, 1),
        (v_template_id, 'CHALLENGES', 'Q030', 'What are your recommendations?', 'text', 0, 2),
        (v_template_id, 'CHALLENGES', 'Q031', 'Apart from these questions, are there other information you would like to share with the ODCHC concerning the operations of ORANGHIS in your facility?', 'text', 0, 3),
        (v_template_id, 'CHALLENGES', 'OBS', 'Please provide details of your observations here', 'text', 0, 4);

        -- 5. Create/Update Section F: Interviewer Details
        UPDATE public.inspection_template_sections 
        SET section_label = 'SECTION F — INTERVIEWER DETAILS', 
            sort_order = 6 
        WHERE template_id = v_template_id AND section_code = 'REMARKS';
        
        -- Clear old remark items as they are replaced by Section E and workflow-level remarks
        DELETE FROM public.inspection_template_items WHERE template_id = v_template_id AND section_code = 'REMARKS';
    END IF;
END $$;
COMMIT;
