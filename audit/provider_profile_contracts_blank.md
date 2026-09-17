# Provider Profile Contracts Blank-Screen Investigation

Date: 2026-08-18 UTC

The specified route `https://www.odchcnmis.online/providers/f7ed9f8e-c0c6-4758-a064-6cbe652655db` initially showed `Loading provider profile...` during navigation, then resolved successfully to the ADULOJU MEMORIAL HOSPITAL profile (`PROV-553589`). The provider overview rendered correctly with the expected provider code, active status, category, LGA, ownership, and services state.

The next controlled step is to open the profile-level `Contracts` tab and determine whether that tab alone causes the blank/error state.

## Root cause and fix

Opening the profile-level Contracts tab caused the page to go blank because `ContractsTab.tsx` always passed `provider.contractStatus` into `ProviderStatusBadge`. For this provider the field is absent, and `formatProviderLabel(status)` called `.replace()` on `undefined`, causing a render-time exception.

The fix in commit `8797299` renders a truthful `No contract data` empty state whenever `contractStatus` is missing. It also stores the selected profile tab in the URL query parameter `tab`, so a refresh preserves the active tab instead of resetting to Overview.

The Vercel production deployment `dpl_94KobTNheLDksSNEUKYovfn6o1hc` is READY for commit SHA `879729960e16504986b854411a853b3ad4a6b349`.

## Live verification

On the deployed custom domain, opening the provider profile with `?tab=Contracts` now renders:

- Contract status
- No contract data
- No contract record has been registered for this provider yet.

A browser refresh preserved the same provider profile, retained the `Contracts` tab, and continued to display the same empty state. The white blank screen no longer occurs for this provider.
