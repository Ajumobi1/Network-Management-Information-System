-- Remove obsolete empty section records from the legacy government-hospital QA seed.
UPDATE public.inspection_template_sections s
SET active = false,
FROM public.inspection_templates t
WHERE s.template_id = t.id
  AND t.code = 'government-hospital-accreditation'
  AND s.section_code IN ('IMPLEMENTATION', 'FINANCIAL', 'CHALLENGES', 'REMARKS');
