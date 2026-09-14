# NMIS Phase 3B Offline Security Review

**Status:** Prepared offline on 2026-08-12. This document is a design and staging-review artifact. It does not authorize or perform a migration, deployment, Auth update, Storage configuration, or live data operation.

> **Authorization principle.** `auth.jwt() -> 'app_metadata' ->> 'nmis_role'` is the sole proposed business-role claim. The browser may display a role but cannot authorize database access, trusted-function action, audit attribution, or import state transition.

## 1. Canonical schema scope and mandatory replacement points

The proposed hardening applies only to the canonical core tables in `supabase/schema.sql`: `providers`, `provider_documents`, `import_batches`, `financial_records`, `provider_match_resolutions`, `audit_logs`, and `enrollees`.

The following canonical elements must be replaced in the approved forward-only staging migration, after live catalog preflight confirms exact object names: `public.is_admin()`, `public.is_network_mgmt()`, and `public.is_finance()` currently read `user_metadata.role`; every authenticated-wide read policy; every broad `FOR ALL` policy; and the client-attributed `audit_logs` insert policy. The migration must never assume undiscovered deployed objects exist.

## 2. Proposed role × table × operation matrix

The symbols mean **S** = direct `SELECT`, **I** = direct `INSERT`, **U** = direct `UPDATE`, **D** = direct `DELETE`, **T** = a trusted server/database workflow only, and **—** = deny. `D` is **deny for every ordinary business role**. “Pending” means an owner decision is required before a policy can be written.

| Role | Providers | Provider documents | Import batches | Financial records | Match resolutions | Audit logs | Enrollees |
|---|---|---|---|---|---|---|---|
| super-admin | S; I/U only with approved AAL2 workflow | S; I/U only with approved AAL2 workflow | S; T | S; T for correction/supersession | S; T | S **pending audit-reader decision**; no I/U/D | S **pending PII scope**; T only |
| executive | S only after bank-data separation | S **pending document scope** | S (summary/status only) | S via approved aggregate/reporting view; base-table scope pending | — | — | —; approved aggregate view only |
| head-of-network | S; I/U for approved non-sensitive provider fields | S; I/U for approved documents | S; T | S **pending finance scope** | S; T | — | — **pending PII scope** |
| network-officer | S; I/U for approved non-sensitive provider fields | S; I/U for approved documents | S; T | — | S; T | — | — |
| inspector | S limited to assigned inspection scope **pending assignment model** | S limited to approved evidence scope | — | — | — | — | — |
| finance | S excluding bank data until segregation is approved | — | S; T | S; T for approved correction workflow | S only where needed for reconciliation **pending** | — | S aggregate-only **pending** |
| claims | S only for approved claims-reporting scope **pending** | — | S only for claims batches **pending** | S only for approved claims fields **pending**; T for no adjudication | — | — | — |
| customer-service | — **pending scope** | — | — | — | — | — | — **pending PII/service scope** |
| provider | S only for own approved profile projection **pending provider-to-user model** | S only for own approved documents **pending** | — | — | — | — | — |

### Explicit enforcement rules

The staging migration must create separate `SELECT`, `INSERT`, and `UPDATE` policies only where the relevant cell allows the operation. It must create **no business-role `DELETE` policy**, no `FOR ALL` policy, no `USING (true)` authenticated-wide policy, and no policy based on `user_metadata`, browser state, URL parameters, local storage, client-supplied actor fields, or client-supplied role fields.

All direct writes to import batches, financial records, enrollee records, manual match resolutions, audit logs, protected source files, and financial correction/supersession records are proposed as **trusted-workflow-only**. The offline repository now fails closed for these direct live browser paths.

## 3. Sensitive-data boundaries

| Data category | Current canonical location | Required least-privilege boundary | Owner decision still required |
|---|---|---|---|
| Provider bank data | `providers.bank_name`, `account_name`, `account_number` | Prefer a separate finance-owned restricted table plus narrowly scoped secure view; exclude base columns from routine provider reads. | Split-table versus secure-view model; finance and audit reader scope. |
| Provider contact information | `providers.contact_person`, `phone`, `email`, `address` | Permit only defined network/provider-service roles and no public/authenticated-wide read. | Inspector, customer-service, provider self-service scope. |
| Enrollee/beneficiary PII | `enrollees` names, policy number, phone, provider association, geographic fields | Deny base-table access by default; use minimum-necessary projections/aggregates and trusted import only. | Stable identity model, authorised readers, retention and masking. |
| Financial information | `financial_records` and `import_batches` | Finance/approved reports only; corrections by reversal/version/supersession with provenance. | Claims versus finance data scope; correction approval semantics. |
| Audit information | `audit_logs` | Append-only trusted events; direct client insert/update/delete denied; no raw PII in arbitrary metadata. | Reader roles, redaction, retention, legal hold, event vocabulary. |

## 4. Trusted audit contract

The offline contract is in `supabase/functions/_shared/audit-contract.ts`. A future trusted function/database trigger must derive the actor ID and role from a verified access token; use a database-generated timestamp; accept only an allow-listed event code; require entity and correlation identifiers; attach batch/source linkage where applicable; and restrict change evidence to redacted, schema-constrained values.

The browser must never provide accepted actor identity, actor role, occurrence timestamp, privileged event code, unrestricted reason, raw before/after payload, or arbitrary audit metadata. The local `auditRepository` now rejects live browser audit writes rather than persisting client-attributed events.

## 5. ORANGHIS source-file and import design

The proposed trusted workflow is represented by `supabase/functions/_shared/import-contract.ts`. The permitted lifecycle is:

```text
uploaded → validating → validation-required → ready-for-review → match-review → approved → importing → imported → reconciled
                                      ↘ rejected / failed / superseded as permitted by the state contract
```

An uploaded workbook remains **untrusted input**. The future `nmis-import` trusted function must, before it can create operational facts: validate extension, size, declared/detected MIME, parseability, allowed workbook structure, owner-approved required sheets and columns, reporting period, duplicate SHA-256, and the approved formula/macro/malware policy. It must store original source files only in an approved private immutable object namespace; derive SHA-256 server-side; use a correlation ID; prohibit overwrite and browser deletion; and preserve the link among source object, batch, rows, audit events, and supersession/reconciliation outcome.

Exact maximum byte size, allowable MIME types, required sheets/columns by department data type, macro policy, source retention/legal hold, malware scanning integration, sign/download audience, and quarantine operation are **blocking owner decisions**. The contract intentionally does not invent them.

Provider matching must never silently approve ambiguous matches. Exact deterministic matches may proceed only under the approved policy; every ambiguous, fuzzy, or manually selected match remains in `match-review` until an authorised trusted workflow persists a reviewed decision with audit evidence. The current browser UI may inspect and preview records, but live manual resolution and commit paths are blocked.

Financial corrections must use an owner-approved reversal/version/supersession model; they must not destructively replace imported facts. Original source, batch, financial record, correction reason, approver, and reconciliation linkage must remain traceable.

## 6. Guarded migration structure

`supabase/migrations/20260812120000_phase3b_security_foundation_pending_live_verification.sql` remains intentionally blocked by `RAISE EXCEPTION`. It must remain unchanged as an execution gate until staging preflight is complete and the owner approves the exact target-specific SQL.

After the guard is authorised for removal, the migration must be composed and reviewed in this order:

1. Confirm project, environment, backup/PITR posture, canonical table existence, existing policy/function names, and the existing administrator’s controlled app-metadata role.
2. Create pinned-search-path role/AAL helpers that read only `app_metadata.nmis_role`; restrict function ownership/grants; verify JWT and AAL2 behaviour.
3. Replace broad policy definitions with operation-specific RLS policies according to the approved matrix, leaving unapproved cells denied.
4. Implement the approved provider-bank/PII segregation model and safe reporting projections.
5. Implement append-only audit schema/trigger/function controls and reader policy.
6. Implement constrained import batch state/provenance/correction model and supporting indexes/constraints.
7. Create the approved private Storage bucket/policy/object-key model only after file-policy approval.
8. Validate policy, function, Storage, negative-access, audit-immutability, and performance/index coverage; record the outcome before any production promotion.

## 7. Trusted Edge Function boundaries

`nmis-admin-provision` and `nmis-import` are deliberately non-operative `503` stubs until staging preflight and approval. `security.ts` verifies the bearer token server-side, derives the role only from `app_metadata.nmis_role`, uses an allow-listed role vocabulary, and supports AAL2 enforcement. No function contains a hard-coded secret, and no server credential is present in the Vite/browser source.

The future administration function must use server-only secrets managed as platform secrets; request AAL2 for privileged role/account operations; never create a replacement administrator; and record only trusted audit events. The future import function must apply the state/validation/audit contracts above and must never use browser-supplied actor attribution or final batch state as authority.

## 8. Required staging tests

| Test family | Minimum test |
|---|---|
| JWT role source | Confirm a token with only `user_metadata.role` is denied; a valid allow-listed `app_metadata.nmis_role` behaves according to RLS. |
| AAL2 | Confirm allowed high-risk action is denied at AAL1 and allowed only at AAL2 for the approved role. |
| RLS matrix | Test every role/table/operation matrix cell; verify all unapproved and DELETE paths are denied. |
| Sensitive data | Confirm non-finance callers cannot retrieve bank data and unauthorised roles cannot retrieve beneficiary PII or audit details. |
| Audit | Confirm actor/time/event cannot be browser-forged, and normal users cannot insert/update/delete audit records. |
| Storage | Confirm bucket is private, key is immutable, public URL/overwrite/browser deletion are denied, and object/batch/audit linkage is complete. |
| Import | Verify malformed workbook, extension/MIME/size/sheet/column/period/hash validation, duplicate hash denial, state transition denial, and ambiguous-match denial. |
| Correction | Verify no destructive financial overwrite and approved reversal/version/supersession remains traceable. |
| Regression | Verify `/C/` = formal, `/D/` = informal, and source `CATEGORY` remains the principal/dependant authority. |

## 9. Blocking owner decisions

The following are intentionally unresolved: bank-data segregation model; provider-to-user and inspector assignment model; claims, customer-service, provider and executive scope; authorised audit readers/event vocabulary/retention/legal hold; file retention/scanning/MIME/size/sheet/column policy; enrollee stable identity; financial correction approval semantics; RPO/RTO/backup/PITR; and any direct-write exceptions from the proposed default trusted-workflow-only model.

## 10. First live operation after connectivity returns

Perform a **privacy-minimised read-only preflight**, in this order: identify the connected staging project and health; read only the existing administrator UID plus `raw_app_meta_data`; confirm whether `nmis_role` is exactly `super-admin`; inventory current tables/functions/policies/RLS/Storage/Edge Functions/migration history; and compare those facts to the canonical schema and this review. Report all differences and exact target-specific SQL. Do not remove the migration guard or make any write until the owner explicitly approves that reviewed result.
