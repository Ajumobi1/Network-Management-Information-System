# NMIS Facility Category Audit Findings

Audit date: 2026-08-16 UTC
Supabase project: `tnklirwrnrdvbfjsdtel` (NMIS-Frontend)

## Live provider data

The live `public.providers` table contains exactly **80 providers**. The category distribution before migration is:

| Current category | Providers |
|---|---:|
| Hospital | 80 |

No live provider currently has a stored category of PHC, Clinic, Laboratory, Specialist Centre, Diagnostic & Imaging Centre, or Referral Centre. Several provider names contain terms such as PRIMARY HEALTH CENTRE, CLINIC, or DIAGNOSTICS, but those are names, not stored category values. They must not be used alone to infer a new category.

## Database shape

`public.providers.category` is a required text column. The live provider table had only its primary-key and unique provider-code/provider-name constraints before the migration; it was not backed by a PostgreSQL enum or category check constraint.

The provider table has foreign-key relationships from provider aliases, provider documents, financial records, provider match resolutions, enrollees, inspections, and capitation summaries. Provider UUIDs and relationships must remain unchanged.

## Category-sensitive live functions

The live public functions whose definitions reference category include:

- `nmis_provider_admin_write`
- `nmis_count_provider_directory`
- `nmis_dashboard_intelligence`
- `nmis_financial_intelligence`
- `nmis_list_financial_register`
- `nmis_list_provider_directory`
- `nmis_population_analytics`
- `nmis_provider_directory_summary`
- `nmis_get_provider_operational_profile`
- import and enrollee functions that carry facility/category fields

## Code findings

The frontend canonical enum still exposed legacy values including PHC, Laboratory, Specialist Centre, Diagnostic & Imaging Centre, and Referral Centre. Several screens also hard-coded PHC and Clinic options. The trusted provider admin edge validator accepted the old vocabulary. The financial AI normalizer returned `Primary Health Centre (PHC)` for PHC/PRIMARY source labels.

## Safety decision

Because all 80 live provider category values were already `Hospital`, no provider row required an inferred classification during the initial audit. The approved-category constraint and write validation can therefore be added without changing provider identity, relationships, enrolments, financial records, inspections, complaints, documents, or audit history. Source names containing PHC/Clinic remain a manual-review concern if a future import supplies an ambiguous category value.
