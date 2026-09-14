# NMIS Population & Enrolment Management — Implementation Report

## Delivery status

The Population & Enrolment Management module has been implemented, integrated, built successfully, committed, and pushed to `origin/main`.

| Item | Result |
|---|---|
| Commit | `6e80d53` — `feat(enrolment): implement population and monthly enrolment management` |
| Branch | `main` |
| Remote | `origin/main` updated successfully |
| Build | `npm run build` passed with zero TypeScript or compilation errors |
| Working tree | Clean after push |
| Mock mode | Preserved through `VITE_USE_MOCK_DATA=true` |
| Supabase mode | Implemented through the existing repository/client architecture; schema deployment remains an environment operation |

## Implemented architecture

The new module follows the established `UI → TanStack Query Hooks → Services → Repositories → Mock/Supabase` flow. UI pages do not access Supabase directly. The enrolment repository supports both session-only mock data and Supabase persistence, while the service owns policy-number sector derivation, source-category normalization, fingerprint generation, duplicate marking, and generalized workbook normalization.

## Major functionality

The module now includes a Population Overview at `/population/enrolment`, an operational Enrolment Register at `/population/enrolment/register`, and a dedicated upload workflow at `/population/enrolment/upload`. The upload workflow supports worksheet selection, reporting-period confirmation, intelligent column mapping, CATEGORY preservation, policy-number sector derivation, Provider Directory matching, manual resolution persistence, validation, duplicate preview, explicit batch-level duplicate warnings, import-only-new-record handling, and successful commit confirmation.

The Population Overview calculates live totals and distributions for formal/informal sector, principal/dependant category, gender, state, LGA, senatorial district, facility, and reporting period. It also links financial expenditure by period to calculate expenditure per enrollee per month (PEPM) without modifying historical Claims, Capitation, or FFS records.

The Enrolment Register provides independent sector and category filters, search, gender/state/LGA/senatorial-district/facility/period filters, pagination, sorting, CSV export, and a traceability detail drawer showing source file, source row, import batch, and record fingerprint.

The Provider Profile now includes an **Enrolment / Population** tab with facility-level total, formal, informal, principal, dependant, male, female, period count, and monthly history views.

## Persistence and security

The canonical `supabase/schema.sql` now includes the `enrollees` table, foreign keys to `providers` and `import_batches`, category/sector/reporting-month/status constraints, record-level fingerprint uniqueness, operational indexes, and role-aware RLS policies consistent with the existing Finance and Network Management model. The standalone `supabase/enrolment_schema.sql` is retained as an enrolment-specific migration reference.

Import metadata records provider names, formal/informal counts, principal/dependant counts, source worksheet, source headers, file size, classification rules, and source-category policy. Import and record commits use the existing audit repository and actor context.

## Data integrity rules implemented

`CATEGORY` is read from the source workbook and normalized only to `principal` or `dependant`; it is not inferred from `/C/0`, `/C/1`, or `/D/0` policy suffixes. `SECTOR` is derived from `/C/` as formal and `/D/` as informal. Provider name, provider code, LGA, state, facility type, and ownership are resolved through Provider Directory matching where available, while source values are retained in enrolment metadata for traceability. Record fingerprints use policy number and reporting period, and the database adds a unique constraint for Supabase mode.

## Remaining operational action

The Supabase schema and RLS changes are present in the repository but must be applied to the target Supabase project by an authorized deployment operator. The existing Provider Directory model does not currently expose a senatorial-district field, so the enrolment module preserves source senatorial-district values where supplied and uses the Provider Directory as the authoritative source for fields that exist in that master entity.
