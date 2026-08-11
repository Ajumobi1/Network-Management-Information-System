-- NMIS Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_code TEXT UNIQUE NOT NULL,
    provider_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    ownership TEXT NOT NULL,
    lga TEXT NOT NULL,
    state TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    contract_status TEXT NOT NULL DEFAULT 'Active',
    credential_status TEXT NOT NULL DEFAULT 'Approved',
    inspection_status TEXT NOT NULL DEFAULT 'Compliant',
    capitation_status TEXT NOT NULL DEFAULT 'Active',
    inspection_rating TEXT,
    last_inspection_date DATE,
    address TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider Documents
CREATE TABLE IF NOT EXISTS provider_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    expiry_date DATE,
    version TEXT,
    status TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import Batches
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    data_type TEXT NOT NULL, -- claims, capitation, ffs, enrolment, etc.
    reporting_year INTEGER,
    reporting_month INTEGER,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER DEFAULT 0,
    imported_rows INTEGER DEFAULT 0,
    warning_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    duplicate_rows INTEGER DEFAULT 0,
    unmatched_providers INTEGER DEFAULT 0,
    total_amount DECIMAL(18, 2),
    status TEXT NOT NULL, -- uploaded, processing, imported, failed, etc.
    period_covered TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Financial Records (Claims, FFS, Capitation)
CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    provider_code TEXT,
    provider_name TEXT NOT NULL,
    facility_type TEXT,
    ownership TEXT,
    state TEXT,
    lga TEXT,
    reporting_year INTEGER NOT NULL,
    reporting_month INTEGER NOT NULL,
    period TEXT NOT NULL, -- YYYY-MM
    data_type TEXT NOT NULL, -- claims, capitation, ffs
    
    -- Financial fields
    amount_submitted DECIMAL(18, 2),
    amount_claimed DECIMAL(18, 2),
    amount_approved DECIMAL(18, 2),
    amount_paid DECIMAL(18, 2),
    net_amount_paid DECIMAL(18, 2),
    
    -- Volume fields
    claim_count INTEGER,
    encounter_count INTEGER,
    eligible_lives INTEGER,
    
    -- Metadata
    source_file TEXT,
    import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
    record_status TEXT NOT NULL, -- valid, warning, error, duplicate
    fingerprint TEXT UNIQUE, -- for duplicate detection (HARDENED with UNIQUE)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider Match Resolutions (History of manual matches)
CREATE TABLE IF NOT EXISTS provider_match_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    excel_name TEXT UNIQUE NOT NULL,
    matched_provider_id UUID REFERENCES providers(id),
    matched_provider_name TEXT,
    matched_provider_code TEXT,
    match_type TEXT NOT NULL, -- exact, manual, etc.
    resolved_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Hardened Role-Based Access)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_match_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  BEGIN RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'executive'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_network_mgmt() RETURNS boolean AS $$
  BEGIN RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'head-of-network', 'network-officer'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_finance() RETURNS boolean AS $$
  BEGIN RETURN (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super-admin', 'finance'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Providers
CREATE POLICY "Read access for all authenticated users" ON providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write access for Network Management" ON providers FOR ALL TO authenticated USING (public.is_network_mgmt()) WITH CHECK (public.is_network_mgmt());

-- 2. Provider Documents
CREATE POLICY "Read access for all authenticated users" ON provider_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write access for Network Management" ON provider_documents FOR ALL TO authenticated USING (public.is_network_mgmt()) WITH CHECK (public.is_network_mgmt());

-- 3. Import Batches
CREATE POLICY "Read access for all authenticated users" ON import_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write access for Finance and Network Management" ON import_batches FOR ALL TO authenticated USING (public.is_finance() OR public.is_network_mgmt()) WITH CHECK (public.is_finance() OR public.is_network_mgmt());

-- 4. Financial Records
CREATE POLICY "Read access for all authenticated users" ON financial_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write access for Finance and Network Management" ON financial_records FOR ALL TO authenticated USING (public.is_finance() OR public.is_network_mgmt()) WITH CHECK (public.is_finance() OR public.is_network_mgmt());

-- 5. Match Resolutions
CREATE POLICY "Read access for all authenticated users" ON provider_match_resolutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write access for Network Management" ON provider_match_resolutions FOR ALL TO authenticated USING (public.is_network_mgmt()) WITH CHECK (public.is_network_mgmt());

-- 6. Audit Logs (APPEND-ONLY)
CREATE POLICY "Read access for all authenticated users" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Append-only for authenticated users" ON audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "No update for audit logs" ON audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No delete for audit logs" ON audit_logs FOR DELETE TO authenticated USING (false);
