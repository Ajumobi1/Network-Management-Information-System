UPDATE public.inspection_template_items i
SET max_points = 10
FROM public.inspection_templates t
WHERE i.template_id = t.id
  AND t.code = 'pharmacy-accreditation'
  AND i.item_code = 'C27';
