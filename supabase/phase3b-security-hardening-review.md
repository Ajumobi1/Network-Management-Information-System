# NMIS Phase 3B Security Hardening — Review-Only Migration

**Target:** NMIS-Frontend staging, project `tnklirwrnrdvbfjsdtel`, `eu-west-1`, `ACTIVE_HEALTHY`.

> This review covers a non-executable, guarded migration only. It creates no Storage objects, deploys no Edge Functions, changes no Auth user/configuration, imports no data, and does not alter frozen UI work. It must not be applied until its guard is explicitly removed under a later owner approval.

## Fresh live baseline

The current public schema contains the seven expected empty NMIS tables and RLS is enabled on each: `providers`, `provider_documents`, `import_batches`, `financial_records`, `provider_match_resolutions`, `audit_logs`, and `enrollees`. The current migration history contains only `initial_canonical_schema` version `20260812143736`. The canonical constraints and indexes are present, there are no public triggers, `storage.buckets` is empty, and no Edge Function is deployed.

The specified existing administrator remains unchanged and retains only the relevant App Metadata claim `nmis_role = super-admin` along with provider metadata. No credential, password, MFA, recovery, token, or secret was accessed or changed.

## Existing policies to be removed

All sixteen exact live canonical policies will be removed by name using **policy-only DDL**. No table, data, function, constraint, index, Storage object, or user is dropped.

| Table | Policies replaced |
|---|---|
| `providers` | `Read access for all authenticated users`; `Write access for Network Management` |
| `provider_documents` | `Read access for all authenticated users`; `Write access for Network Management` |
| `import_batches` | `Read access for all authenticated users`; `Write access for Finance and Network Management` |
| `financial_records` | `Read access for all authenticated users`; `Write access for Finance and Network Management` |
| `provider_match_resolutions` | `Read access for all authenticated users`; `Write access for Network Management` |
| `audit_logs` | `Read access for all authenticated users`; `Append-only for authenticated users`; `No update for audit logs`; `No delete for audit logs` |
| `enrollees` | `Enrollees readable by authenticated users`; `Enrollees writable by Finance and Network Management` |

The policy replacement uses `DROP POLICY IF EXISTS` because PostgreSQL has no non-destructive `ALTER POLICY` operation that can change an existing policy's command. These are policy-level replacements required to remove authenticated-wide access and broad all-operation access; they are not data-destructive `DROP`, `TRUNCATE`, `DELETE`, `UPDATE`, or `INSERT` operations.

## Helper/function changes

The migration replaces `public.is_admin()`, `public.is_network_mgmt()`, and `public.is_finance()`. The current `SECURITY DEFINER` helpers have no pinned search path and read `auth.jwt()->'user_metadata'->>'role'`.

The reviewed migration adds `public.nmis_current_role()`, `public.nmis_has_any_role(text[])`, and `public.nmis_has_aal2()`, then replaces the three legacy compatibility helpers. All six resulting helpers are `SECURITY INVOKER`, stable, pinned to `search_path = pg_catalog, auth`, and use only signed `auth.jwt()->'app_metadata'->>'nmis_role'` values from an allow-list. Their public execute access is revoked and execution is granted only to `authenticated`.

## New direct-access policies

The migration creates only the following explicit `SELECT` policies. It intentionally creates **zero direct `INSERT` policies, zero direct `UPDATE` policies, and zero ordinary business-role `DELETE` policies**. Imports, corrections, match persistence, audit writes, and enrollee writes remain trusted-workflow-only and are denied until their later server/database boundary is approved.

| Policy | Table | Direct permission | Allowed roles | Additional boundary |
|---|---|---|---|---|
| `import_batches_operational_select` | `import_batches` | SELECT | `super-admin`, `head-of-network`, `network-officer`, `finance` | No direct write. Executive/claims scope remains denied pending projections and batch scoping. |
| `financial_records_finance_select` | `financial_records` | SELECT | `finance`; `super-admin` | Super-admin requires AAL2. No correction/import write. |
| `provider_match_resolutions_network_select` | `provider_match_resolutions` | SELECT | `super-admin`, `head-of-network`, `network-officer` | No direct resolution write. Finance reconciliation scope remains pending. |

## Role × table × direct-operation matrix after hardening

`S` means a direct base-table SELECT policy; `—` means denied. No role receives a direct `INSERT`, `UPDATE`, or `DELETE` policy in this migration. This conservative matrix preserves every unresolved decision as denied rather than inventing a scope.

| Role | Providers | Provider documents | Import batches | Financial records | Match resolutions | Audit logs | Enrollees |
|---|---|---|---|---|---|---|---|
| super-admin | — | — | S | S at AAL2 | S | — | — |
| executive | — | — | — | — | — | — | — |
| head-of-network | — | — | S | — | S | — | — |
| network-officer | — | — | S | — | S | — | — |
| inspector | — | — | — | — | — | — | — |
| finance | — | — | S | S | — | — | — |
| claims | — | — | — | — | — | — | — |
| customer-service | — | — | — | — | — | — | — |
| provider | — | — | — | — | — | — | — |

## Permissions deliberately left denied

Provider base-table access is denied because it contains bank and contact data and the required split-table versus secure-view decision has not been made. Provider document access is denied because document classifications, inspection assignment, and approved evidence scope are unknown. Enrollee base-table access is denied because it contains PII and the stable identity, reader, projection, masking, and retention decisions remain open. Audit logs have no authenticated policy because trusted audit writing and the reader/event/retention model are not yet implemented.

Executive, inspector, claims, customer-service, provider self-service, finance reconciliation, and network finance/PII scopes remain denied because the required ownership/assignment/projection decisions are pending. Import batch, financial correction, enrollee import, manual match resolution, and audit persistence remain trusted-workflow-only.

## Negative-access tests required after approval and application

| Test area | Required outcome |
|---|---|
| Role-source forgery | A token containing only `user_metadata.role` is denied. A signed allow-listed `app_metadata.nmis_role` is evaluated by the stated matrix. |
| Browser-state forgery | Local storage, URL parameters, client-supplied role, and client-supplied actor ID do not change RLS authorization. |
| RLS matrix | Every allowed SELECT above succeeds only for the specified signed role/AAL condition; every other table/action/role combination is denied. |
| AAL2 | AAL1 super-admin is denied `financial_records` SELECT; AAL2 super-admin is allowed. |
| Write denial | Every direct authenticated insert/update to all seven tables is denied; direct DELETE is denied for every business role. |
| Audit integrity | Authenticated browser users cannot select, insert, update, or delete `audit_logs`; arbitrary actor/time/event metadata cannot be accepted. |
| PII/bank data | All direct authenticated reads of `providers` and `enrollees` are denied until approved secure projections exist. |
| Regression | `/C/` remains formal, `/D/` remains informal, and source `CATEGORY` remains the principal/dependant authority in the later trusted-import flow. |

## Safety properties and approval gate

The reviewed migration is forward-only and staging-targeted. It changes only helpers, helper grants, RLS policy definitions, and confirms RLS remains enabled. It has no data-changing statement and no Storage, Edge Function, Auth, user, credential, or UI operation. The leading `RAISE EXCEPTION` guard is intentional and remains in place.

Before a future execution approval, the owner must explicitly accept the conservative deny-by-default matrix, the policy-only replacement operation, the lack of a bank/PII secure-view or split-table implementation in this migration, the absence of a trusted audit/import writer, and the stated negative-access test plan.
