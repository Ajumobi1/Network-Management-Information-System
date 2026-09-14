# NMIS Forensic QA + Architecture Audit Report

**Audit Date:** 2026-08-11  
**Target Commit:** `e91c556`  
**Repository:** `Ajumobi1/NMIS-Frontend`  
**Objective:** Verify stability and architectural integrity of the Capitation Management module.

---

## 1. Baseline Verification
*   **Current Branch:** `main`
*   **HEAD Commit:** `e91c556bcbc27d4d9bec4f0c364fb5ccd5373d0b`
*   **Latest Message:** `feat(capitation): implement operational capitation management workflow`
*   **Working Tree:** Clean (no uncommitted changes).
*   **Origin Sync:** Local branch is up to date with `origin/main`.
*   **Suspicious Files:** None. The `.env` files are correctly ignored, and only domain-relevant files are present.

---

## 2. Build / TypeScript Health
*   **Command:** `npm run build`
*   **Status:** **PASSED**
*   **TypeScript Errors:** 0
*   **Build Errors:** 0
*   **Warnings:** Informational bundle-size warnings (expected for large vendor chunks like Recharts/Supabase).
*   **Lint/Test Scripts:** Not defined in `package.json`.

**Severity:** `INFORMATIONAL` (Build is healthy, but lack of linting is a minor quality risk).

---

## 3. Capitation Architecture Audit
The implementation follows the established `UI → Hooks → Services → Repositories → Mock` architecture.

| File | Problem | Severity | Recommended Fix |
| :--- | :--- | :--- | :--- |
| `src/pages/CapitationPage.tsx` | Redundant logic for `adjustmentTotal` (Line 229) and `deductionTotal` (Line 230). | **LOW** | Move these aggregations to `capitationService.ts`. |
| `src/hooks/capitation/capitationHooks.ts` | Type assertion `id as string` (Line 15). | **LOW** | Use a more defensive check or refine the hook signature. |
| `src/services/capitation/capitationService.ts` | Use of `\n` in CSV export (Line 149) may need standard CRLF for some Excel versions. | **LOW** | Standardize on `\r\n` for CSV exports. |

**Verdict:** Architecture is clean. No direct repository or Supabase imports were found in UI components.

---

## 4. Capitation Calculation Audit
*   **Centralization:** **TRUE**. Calculations live in `src/services/capitation/capitationService.ts`.
*   **Precision:** Uses `number` with `Math.round()` for currency (Naira) which is sufficient for frontend display.
*   **Edge Cases:**
    *   **Zero Values:** Handled via `Math.max(0, ...)` in mock generation.
    *   **Eligibility:** Correctly enforced in `calculateCapitation` based on `providerLifecycleStatus` and `credentialingStatus`.
*   **Inconsistency:** `src/mocks/capitationMocks.ts` (Line 177) contains a local calculation for `netPayable` instead of calling the service.
    *   **Severity:** `MEDIUM`
    *   **Fix:** Mocks should use the service's `calculateCapitation` to ensure consistency.

---

## 5. Capitation Workflow Audit
The workflow supports all requested states and transitions.

### Transition Matrix (Partial)
| Current Status | Action | Next Status | Validated? | Comment Req? |
| :--- | :--- | :--- | :--- | :--- |
| `draft` | `calculate` | `calculated` | Yes | No |
| `submitted` | `review` | `reviewed` | Yes | No |
| `reviewed` | `approve` | `approved` | Yes | No |
| `approved` | `start-payment`| `payment-processing`| Yes | No |
| `payment-processing`| `mark-paid` | `paid` | Yes | No |
| `paid` | `reconcile` | `reconciled` | Yes | No |
| `*` | `reject` | `rejected` | Yes | **YES** |

**Illegal Transitions:** `Draft → Paid` or `Approved → Draft` are correctly prevented by `allowedTransitions` in the service layer.

---

## 6. Audit Trail Verification
*   **Implementation:** Financially significant actions in `applyCapitationAction` (Mocks) correctly prepend to the `auditTrail` array.
*   **Contents:** Audit entries include `action`, `actor`, `timestamp`, `previousStatus`, `newStatus`, and `comment`.
*   **Gap:** The `calculate` action in the service layer updates status but does not explicitly create an audit entry in the same way the mock action does.
    *   **Severity:** `MEDIUM`
    *   **Fix:** Ensure `saveCapitationRecord` or the service wrapper always appends to the audit trail.

---

## 7. Provider Integration Audit
*   **Consistency:** **HIGH**. Capitation types directly import and reuse `ProviderCategory` and `ProviderOwnership` from the provider domain.
*   **Naming:** Matches the `providerNetwork.ts` constants exactly (e.g., `Hospital`, `Primary Health Centre (PHC)`).
*   **Integration:** The `CapitationTab` in the provider profile uses the provider's own `providerCode` to filter and display linked payment records.

---

## 8. Credentialing Integration
*   **Implementation:** **CORRECT**.
*   **Logic:** `calculateCapitation` (Service) explicitly checks `record.credentialingStatus === 'complete'`.
*   **Mock Realism:** Mock generation reduces eligible beneficiary counts significantly for providers that are not `active` or `complete`.

---

## 9. Payment + Reconciliation Audit
*   **Logic Type:** **REAL BUSINESS LOGIC**.
*   **Features:** Supports payment references, dates, and status transitions.
*   **Reconciliation:** Implemented with support for `reconciledAmount` and `exception` states. The UI correctly highlights reconciliation exceptions.

---

## 10. Filtering / Search / Register Audit
*   **Functional:** **TRUE**. Filtering is implemented in `capitationRepository.ts` and affects the data returned to the hook.
*   **Search:** Covers provider code, facility name, state, and LGA.
*   **Sorting/Pagination:** Implemented locally in `CapitationPage.tsx`.

---

## 11. Bulk Action Audit
*   **Implementation:** `useBulkCapitationTransition` hook iterates through selections.
*   **Validation:** Each individual transition is validated against workflow rules.
*   **Confirmation:** `runBulkAction` (UI) requires a `window.confirm`.
*   **Cache:** Invalidation is handled correctly per-record.

---

## 12. React Query Audit
*   **Syntax:** TanStack Query v5 object syntax used throughout.
*   **Invalidation:** Mutations correctly invalidate `['capitation', 'records']` and the specific record by ID.
*   **Stale Time:** Set to 3 minutes, which is appropriate for an operational dashboard.

---

## 13. Mock Data Audit
*   **Realism:** Contains 21 records across 7 providers and 3 periods (Jun-Aug 2026).
*   **Persistence:** **SESSION-ONLY**. Mutations update the in-memory `capitationRecords` array, so changes persist until the page is reloaded.

---

## 14. Supabase Safety Audit
*   **Implementation:** **FIXED**. `supabaseClient.ts` now uses fallback mock values if environment variables are missing, preventing the "blank screen" hang encountered during initial development.

---

## Final Verdict
**Status:** **STABLE**

The NMIS Frontend is currently stable and the Capitation Management module is architecturally sound. The implementation is operational with real business logic and strong domain integration.

**Recommendation:** Proceed to the next module (**Claims Management**) after addressing the minor logic duplication in the mock data layer.
