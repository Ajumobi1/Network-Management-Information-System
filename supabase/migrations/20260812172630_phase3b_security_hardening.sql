-- NMIS Phase 3B least-privilege security hardening — REVIEW ONLY.
-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
--
-- Staging execution of this exact target-specific migration was explicitly authorized
-- after read-only verification of project tnklirwrnrdvbfjsdtel and its empty NMIS data tables.
--
-- Scope: role-source/helper replacement and RLS policy replacement only.
-- Excluded: Storage, Edge Functions, Auth user/configuration changes, schema/data
-- changes, audit schema redesign, PII/bank-data table split, imports, and seeds.
--
-- The policy-level DROP statements are necessary to replace the 16 exact live
-- canonical policies verified in the preflight. They do not drop tables, columns,
-- data, constraints, indexes, functions, Storage objects, or users.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Controlled JWT helpers. Authorization uses only app_metadata.nmis_role.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.nmis_current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT CASE auth.jwt() -> 'app_metadata' ->> 'nmis_role'
    WHEN 'super-admin' THEN 'super-admin'
    WHEN 'executive' THEN 'executive'
    WHEN 'head-of-network' THEN 'head-of-network'
    WHEN 'network-officer' THEN 'network-officer'
    WHEN 'inspector' THEN 'inspector'
    WHEN 'finance' THEN 'finance'
    WHEN 'claims' THEN 'claims'
    WHEN 'customer-service' THEN 'customer-service'
    WHEN 'provider' THEN 'provider'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_has_any_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT public.nmis_current_role() = ANY (allowed_roles);
$$;

CREATE OR REPLACE FUNCTION public.nmis_has_aal2()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT auth.jwt() ->> 'aal' = 'aal2';
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT public.nmis_current_role() = 'super-admin';
$$;

CREATE OR REPLACE FUNCTION public.is_network_mgmt()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']);
$$;

CREATE OR REPLACE FUNCTION public.is_finance()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, auth
AS $$
  SELECT public.nmis_has_any_role(ARRAY['super-admin', 'finance']);
$$;

REVOKE ALL ON FUNCTION public.nmis_current_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_has_any_role(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_has_aal2() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_network_mgmt() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_finance() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_current_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_has_any_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_has_aal2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_network_mgmt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_finance() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Replace every verified canonical RLS policy by exact current name.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.providers;
DROP POLICY IF EXISTS "Write access for Network Management" ON public.providers;
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.provider_documents;
DROP POLICY IF EXISTS "Write access for Network Management" ON public.provider_documents;
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.import_batches;
DROP POLICY IF EXISTS "Write access for Finance and Network Management" ON public.import_batches;
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.financial_records;
DROP POLICY IF EXISTS "Write access for Finance and Network Management" ON public.financial_records;
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.provider_match_resolutions;
DROP POLICY IF EXISTS "Write access for Network Management" ON public.provider_match_resolutions;
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "Append-only for authenticated users" ON public.audit_logs;
DROP POLICY IF EXISTS "No update for audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "No delete for audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Enrollees readable by authenticated users" ON public.enrollees;
DROP POLICY IF EXISTS "Enrollees writable by Finance and Network Management" ON public.enrollees;

-- Keep RLS enforced; the baseline already enables it, and this is idempotent.
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_match_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollees ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Explicit least-privilege policies. No broad all-operation policy and no DELETE policy.
-- ---------------------------------------------------------------------------

-- providers: direct base-table access remains denied. The table combines
-- bank and contact data, and the approved review requires both a segregation
-- model and an audited AAL2 workflow before even super-admin provider writes.
-- Network, inspector, provider, and executive scopes are also unresolved.

-- provider_documents: direct access remains denied. The canonical table has
-- no approved document-classification, assignment, or projection model from
-- which a least-privilege document scope can be enforced. A later approved
-- policy/view design may grant the matrix's document access without guessing.

-- Imports remain trusted-workflow-only for writes. Executive summary access and
-- claims-specific scope require projections/scoping decisions, so neither role
-- receives base-table access.
CREATE POLICY "import_batches_operational_select"
ON public.import_batches FOR SELECT TO authenticated
USING (public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']));

-- Financial facts remain read-only for finance and AAL2 super-admin. All direct
-- correction/supersession and import writes remain trusted-workflow-only.
CREATE POLICY "financial_records_finance_select"
ON public.financial_records FOR SELECT TO authenticated
USING (
  public.nmis_has_any_role(ARRAY['finance'])
  OR (public.is_admin() AND public.nmis_has_aal2())
);

-- Match resolutions remain trusted-workflow-only for writes. Finance
-- reconciliation scope is pending and therefore denied.
CREATE POLICY "provider_match_resolutions_network_select"
ON public.provider_match_resolutions FOR SELECT TO authenticated
USING (public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']));

-- audit_logs: no authenticated policy is created. Browser inserts, reads,
-- updates, and deletes are denied until the trusted audit writer and
-- owner-approved audit-reader model are implemented.

-- enrollees: no authenticated policy is created. The base table contains PII;
-- direct browser read/write remains denied pending stable identity, reader,
-- projection, and retention decisions. Trusted import is outside this migration.

-- ---------------------------------------------------------------------------
-- 4. Narrow read contracts. These functions return allow-listed fields only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.nmis_list_provider_directory(
  p_search text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_ownership text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_contract_status text DEFAULT NULL,
  p_credential_status text DEFAULT NULL,
  p_inspection_status text DEFAULT NULL,
  p_capitation_status text DEFAULT NULL,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_sort text DEFAULT 'provider_name'
)
RETURNS TABLE(
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  subcategory text,
  ownership text,
  state text,
  lga text,
  status text,
  contract_status text,
  credential_status text,
  inspection_status text,
  capitation_status text,
  inspection_rating text,
  last_inspection_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  IF p_page_size < 1 OR p_page_size > 100 OR p_offset < 0 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;
  IF p_sort NOT IN ('provider_name', 'provider_code', 'state', 'lga', 'category', 'status') THEN
    RAISE EXCEPTION 'INVALID_SORT';
  END IF;

  RETURN QUERY
  SELECT p.id, p.provider_code, p.provider_name, p.category, p.subcategory,
         p.ownership, p.state, p.lga, p.status, p.contract_status,
         p.credential_status, p.inspection_status, p.capitation_status,
         p.inspection_rating, p.last_inspection_date
  FROM public.providers p
  WHERE (p_search IS NULL OR lower(concat_ws(' ', p.provider_code, p.provider_name, p.category, p.subcategory, p.ownership, p.state, p.lga)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_state IS NULL OR p.state = p_state)
    AND (p_lga IS NULL OR p.lga = p_lga)
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_ownership IS NULL OR p.ownership = p_ownership)
    AND (p_status IS NULL OR p.status = p_status)
    AND (p_contract_status IS NULL OR p.contract_status = p_contract_status)
    AND (p_credential_status IS NULL OR p.credential_status = p_credential_status)
    AND (p_inspection_status IS NULL OR p.inspection_status = p_inspection_status)
    AND (p_capitation_status IS NULL OR p.capitation_status = p_capitation_status)
  ORDER BY
    CASE WHEN p_sort = 'provider_name' THEN lower(p.provider_name) END,
    CASE WHEN p_sort = 'provider_code' THEN lower(p.provider_code) END,
    CASE WHEN p_sort = 'state' THEN lower(p.state) END,
    CASE WHEN p_sort = 'lga' THEN lower(p.lga) END,
    CASE WHEN p_sort = 'category' THEN lower(p.category) END,
    CASE WHEN p_sort = 'status' THEN lower(p.status) END,
    p.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_get_provider_operational_profile(p_provider_id uuid)
RETURNS TABLE(
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  subcategory text,
  ownership text,
  state text,
  lga text,
  status text,
  contract_status text,
  credential_status text,
  inspection_status text,
  capitation_status text,
  inspection_rating text,
  last_inspection_date date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF p_provider_id IS NULL OR NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RETURN QUERY
  SELECT p.id, p.provider_code, p.provider_name, p.category, p.subcategory,
         p.ownership, p.state, p.lga, p.status, p.contract_status,
         p.credential_status, p.inspection_status, p.capitation_status,
         p.inspection_rating, p.last_inspection_date
  FROM public.providers p
  WHERE p.id = p_provider_id;
END;
$$;

-- The reporting functions are prepared but intentionally not granted to browser
-- roles until the owner approves small-cell, PII, executive, and audit-reader scope.
CREATE OR REPLACE FUNCTION public.nmis_population_analytics(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RAISE EXCEPTION 'SECURE_CONTRACT_UNAVAILABLE: aggregate disclosure policy is pending owner approval';
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_provider_population_summary(
  p_provider_id uuid,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_period text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF p_provider_id IS NULL OR NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RAISE EXCEPTION 'SECURE_CONTRACT_UNAVAILABLE: aggregate disclosure policy is pending owner approval';
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_dashboard_intelligence(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_facility_type text DEFAULT NULL,
  p_ownership text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RAISE EXCEPTION 'SECURE_CONTRACT_UNAVAILABLE: dashboard aggregate and activity-reader policy is pending owner approval';
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_financial_intelligence(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_facility_type text DEFAULT NULL,
  p_ownership text DEFAULT NULL,
  p_data_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT (public.is_finance() OR (public.is_admin() AND public.nmis_has_aal2())) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RAISE EXCEPTION 'SECURE_CONTRACT_UNAVAILABLE: financial reporting disclosure policy is pending owner approval';
END;
$$;

-- Trusted workflow hooks are deliberately internal-only. No authenticated user
-- may call them directly and no request-body actor value is accepted.
CREATE OR REPLACE FUNCTION public.nmis_import_match_candidates(
  p_import_session_id uuid,
  p_provider_name text,
  p_provider_code text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'TRUSTED_OPERATION_REQUIRED: import session workflow is not deployed';
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_resolve_provider_match(
  p_import_session_id uuid,
  p_candidate_provider_id uuid,
  p_match_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'TRUSTED_OPERATION_REQUIRED: provider match resolution is not deployed';
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_record_audit_event()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  RAISE EXCEPTION 'TRUSTED_OPERATION_REQUIRED: audit event vocabulary and trusted writer are not approved';
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_provider_directory(text, text, text, text, text, text, text, text, text, text, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_provider_operational_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_population_analytics(integer, integer, text, text, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_provider_population_summary(uuid, integer, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_dashboard_intelligence(integer, integer, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_financial_intelligence(integer, integer, text, text, text, text, uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_import_match_candidates(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_resolve_provider_match(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_record_audit_event() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_list_provider_directory(text, text, text, text, text, text, text, text, text, text, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_provider_operational_profile(uuid) TO authenticated;

COMMIT;
