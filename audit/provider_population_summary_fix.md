# Provider Population Summary Fix

Date: 2026-08-18

## Root cause

The live `public.nmis_provider_population_summary(uuid, integer, integer, text)` RPC existed but was intentionally implemented as a placeholder that raised `SECURE_CONTRACT_UNAVAILABLE: aggregate disclosure policy is pending owner approval`. The frontend repository was also incorrectly routing provider population summaries through `nmis_get_enrolment_analytics` instead of the live approved `nmis_population_analytics` aggregate RPC.

## Database evidence

A read-only Supabase inspection confirmed the live `nmis_population_analytics(integer, integer, text, text, text, text, text, uuid)` RPC. A read-only call for provider `f7ed9f8e-c0c6-4758-a064-6cbe652655db` returned 128 total enrollees, 114 formal, 14 informal, 84 principals, 44 dependants, 54 male, 74 female, and monthly trend `2026-08: 128`.

## Implementation

`fetchProviderPopulationSummary` now calls `nmis_population_analytics` with provider ID, year, month, period, sector, category, state, and LGA filters, and safely maps the aggregate JSON response. No production data was written and no migration was required.

The provider Enrolment tab now provides Reporting year and Reporting month selectors, a clear no-data state, and a provider-scoped enrollee CSV export using the existing secure enrollee-register read contract. The implementation is provider-ID based and therefore applies to all current and future provider records.

## Live verification

Production deployment: Vercel deployment `dpl_CZk6Q68FzQNm2ZGFo9ZwpWtSzxzh`, commit `c10f798654b3115409430135c557184288ce957d`, state READY.

Live Aduloju profile Enrolment tab rendered successfully at:
`https://www.odchcnmis.online/providers/f7ed9f8e-c0c6-4758-a064-6cbe652655db?tab=Enrolment%20%2F%20Population&fix=c10f798`

Visible live values: 128 total, 114 formal, 14 informal, 84 principals, 44 dependants, 54 male, 74 female, 1 period. The live UI showed All years and All months selectors and the Export enrollees button. Clicking Export enrollees completed without an application error.

Landing page files were not modified.

## Latest-period rule update

The provider population tab no longer offers All years or All months. It derives the available reporting periods from the provider's aggregate trend, defaults to the most recent available `YYYY-MM` period, and restricts month choices to months that actually exist for the selected year. Export now follows the same effective latest year/month filter. This keeps population reporting aligned with the current-month/latest-uploaded-period rule and avoids money-style all-period controls.

The landing page remains untouched.

## Live verification of latest-period default

After deployment `dpl_4Dbnaiva9iFGLpRAWB3obsD3U377` (commit `66d3a1cad0a583af44c4f77205997c3d8275e992`) reached READY, the live Aduloju provider profile rendered Reporting year `2026` and Reporting month `August` with the text `Showing latest available reporting period: 2026-08.`. The controls contained no All years or All months option. Aggregate values remained 128 total, 114 formal, 14 informal, 84 principals, 44 dependants, 54 male, and 74 female.

## Branded UI verification note

The branded production deployment reached READY. The attempted direct verification URL used a guessed UUID for FUTA and correctly returned the existing secure-provider-profile-unavailable state, so no incorrect provider record was displayed. The live verification must use the authoritative UUID resolved from provider code `PROV-934792`; the UI build and deployment themselves are healthy.

## Final branded UI verification

Using the authoritative FUTA UUID `c9770338-23e5-48ff-afc6-a724f33c1fa4`, the live Enrolment / Population tab rendered the ODCHC ORANGHIS design successfully. The view showed the blue/orange/white header, branded reporting-context panel, orange export action, bordered metric cards, and blue/orange composition styling. Live values matched the requested provider data: 8,937 total, 8,840 formal, 97 informal, 3,399 principals, 5,538 dependants, 4,211 male, 4,726 female, and 3 available periods. The latest default remained 2026 / August. The landing page was not modified.
