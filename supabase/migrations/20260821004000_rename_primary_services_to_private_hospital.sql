-- Rename 'Primary Services' facility type to 'Private hospital' as requested
UPDATE public.inspection_facility_types 
SET name = 'Private hospital' 
WHERE code = 'private-hospital';

COMMIT;
