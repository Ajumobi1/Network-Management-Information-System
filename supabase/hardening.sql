-- NMIS Security Hardening & RLS Policies

-- 1. DROP existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated read access" ON providers;
DROP POLICY IF EXISTS "Allow authenticated read access" ON provider_documents;
DROP POLICY IF EXISTS "Allow authenticated read access" ON import_batches;
DROP POLICY IF EXISTS "Allow authenticated read access" ON financial_records;
DROP POLICY IF EXISTS "Allow authenticated read access" ON provider_match_resolutions;
DROP POLICY IF EXISTS "Allow authenticated read access" ON audit_logs;

DROP POLICY IF EXISTS "Allow authenticated write access" ON providers;
DROP POLICY IF EXISTS "Allow authenticated write access" ON provider_documents;
DROP POLICY IF EXISTS "Allow authenticated write access" ON import_batches;
DROP POLICY IF EXISTS "Allow authenticated write access" ON financial_records;
DROP POLICY IF EXISTS "Allow authenticated write access" ON provider_match_resolutions;
DROP POLICY IF EXISTS "Allow authenticated write access" ON audit_logs;

-- 2. Define Helper Functions for Role Checks
-- Note: These assume roles are stored in auth.users.raw_user_meta_data->>'role'
-- or in a public.users table linked to auth.uid(). 
-- For this implementation, we use metadata as it's the most common Supabase pattern.

CREATE OR REPLACE FUNCTION public.has_role(target_role text)
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = target_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'executive');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_network_mgmt()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'head-of-network', 'network-officer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_finance()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'finance');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Providers Table Policies
CREATE POLICY "Providers are readable by all authenticated users"
ON providers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Providers can be created/updated by Network Management"
ON providers FOR ALL
TO authenticated
USING (public.is_network_mgmt())
WITH CHECK (public.is_network_mgmt());

-- 4. Provider Documents Policies
CREATE POLICY "Documents are readable by all authenticated users"
ON provider_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Documents can be managed by Network Management"
ON provider_documents FOR ALL
TO authenticated
USING (public.is_network_mgmt())
WITH CHECK (public.is_network_mgmt());

-- 5. Import Batches Policies
CREATE POLICY "Import batches are readable by all authenticated users"
ON import_batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Import batches can be created by Finance and Network Management"
ON import_batches FOR INSERT
TO authenticated
WITH CHECK (public.is_finance() OR public.is_network_mgmt());

CREATE POLICY "Import batches can be updated by Finance and Network Management"
ON import_batches FOR UPDATE
TO authenticated
USING (public.is_finance() OR public.is_network_mgmt());

-- 6. Financial Records Policies
CREATE POLICY "Financial records are readable by all authenticated users"
ON financial_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Financial records can be managed by Finance and Network Management"
ON financial_records FOR ALL
TO authenticated
USING (public.is_finance() OR public.is_network_mgmt())
WITH CHECK (public.is_finance() OR public.is_network_mgmt());

-- 7. Provider Match Resolutions Policies
CREATE POLICY "Match resolutions are readable by all authenticated users"
ON provider_match_resolutions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Match resolutions can be managed by Network Management"
ON provider_match_resolutions FOR ALL
TO authenticated
USING (public.is_network_mgmt())
WITH CHECK (public.is_network_mgmt());

-- 8. Audit Logs Policies (APPEND-ONLY)
CREATE POLICY "Audit logs are readable by all authenticated users"
ON audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Audit logs are append-only for all authenticated users"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Explicitly deny UPDATE and DELETE on audit logs for everyone
CREATE POLICY "Audit logs cannot be updated"
ON audit_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON audit_logs FOR DELETE
TO authenticated
USING (false);

-- 9. Add record-level duplicate protection constraint
-- Fingerprint should be unique within the financial_records table
ALTER TABLE financial_records ADD CONSTRAINT unique_record_fingerprint UNIQUE (fingerprint);
