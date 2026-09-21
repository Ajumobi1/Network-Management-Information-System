-- ODCHCNMIS category labels: preserve the existing checklist engine and change only display names.
update public.inspection_facility_types
set name = 'Private Hospitals',
    description = 'Accreditation checklist for Private Hospitals (Primary Services).',
    updated_at = now()
where code = 'private-hospital';

update public.inspection_facility_types
set name = 'Government Hospitals',
    description = 'Quarterly Quality Assurance monitoring checklist for Government Hospitals.',
    updated_at = now()
where code = 'government-hospital';
