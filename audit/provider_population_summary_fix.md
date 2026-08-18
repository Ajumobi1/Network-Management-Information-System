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
