BEGIN;

ALTER TABLE public.inspection_template_items 
DROP CONSTRAINT IF EXISTS inspection_template_items_response_type_check;

ALTER TABLE public.inspection_template_items 
ADD CONSTRAINT inspection_template_items_response_type_check 
CHECK (response_type = ANY (ARRAY['number'::text, 'boolean'::text, 'text'::text, 'json'::text]));

COMMIT;
