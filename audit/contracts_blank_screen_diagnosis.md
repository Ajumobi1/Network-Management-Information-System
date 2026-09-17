# Contracts Blank Screen Diagnosis

Date: 2026-08-18 UTC

## Live reproduction

Authenticated production route: `https://www.odchcnmis.online/contracts`

Initial live reproduction displayed an error state:

- `Contracts unavailable`
- `An unexpected error occurred while processing your request.`
- `Retry`

## Database evidence

A read-only inspection of the live Supabase database found no public functions named `nmis_list_contracts`, `nmis_get_contracts`, or `nmis_contract_summary`.

The frontend repository calls `supabase.rpc('nmis_list_contracts')` in `src/repositories/contracts/contractsRepository.ts`.

The live schema contains `public.providers.contract_status`, but no dedicated contract table or Contracts read RPC was found by the inspected schema query.

## Focused fix

Commit `1469835` updates `getContracts()` so a missing-function response (`PGRST202`, `42883`, or a message identifying `nmis_list_contracts`) returns a truthful empty contract list. Authorization failures and other secure-contract errors still surface.

The landing page was not modified and no production data was changed.

## Post-deployment browser diagnostic

The new Vercel deployment became `READY` with deployment ID `dpl_8MkavqoawNsYcznnQVRE9A1LwSdx` and commit SHA `14698359f274d351fc3b0e567c4202b2ba4f321a`.

After deployment, the browser document title loads but the React root remains empty. The browser resource timing showed the new JavaScript bundle request completing with a compressed transfer size of approximately 38 KB; the root HTML length remained 0. This suggests a separate browser bundle-loading or runtime issue that must be captured from the post-reload error listeners before declaring the Contracts fix verified.

## Direct deployment comparison

The direct Vercel deployment URL `https://nmis-frontend-lmmlachdp-ajumobi1s-projects.vercel.app/contracts` redirected to `/login` and rendered the complete NMIS login page. This demonstrates that the new Vercel deployment app shell and JavaScript bundle can render; the blank state is isolated to the custom-domain authenticated browser context or its asset/session loading path, not a universal Vercel build failure.

## Custom-domain comparison after deployment

After returning to `https://www.odchcnmis.online/providers`, the custom-domain page again had the correct document title but no visible elements and an empty React root. This is broader than the Contracts route and indicates the custom-domain browser context is not completing the app render after the latest deployment. The direct Vercel deployment URL still rendered the login page normally.

## Hard-reload evidence

On the custom domain after a hard reload:

- Document title: `ODCHC NMIS | Ondo State Contributory Health Commission`
- React root HTML length: `0`
- Ready state: `interactive`
- Module script: `https://www.odchcnmis.online/assets/index-DlvmnXUJ.js`
- Temporary `error` and `unhandledrejection` listeners captured no errors.

The module script is present and its initial bytes are valid JavaScript, but the React root remains empty. The direct Vercel deployment renders the login screen, so this requires further investigation of custom-domain delivery or browser-session behavior before final verification.
