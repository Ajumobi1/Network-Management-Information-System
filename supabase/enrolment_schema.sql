-- NMIS Enrolment Schema Addition

-- Enrollees Table (Normalized beneficiary records)
CREATE TABLE IF NOT EXISTS enrollees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number TEXT NOT NULL,
    category TEXT NOT NULL, -- principal, dependant
    sector TEXT NOT NULL, -- formal, informal
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone_number TEXT,
    
    -- Provider association
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    provider_code TEXT,
    provider_name TEXT NOT NULL,
    facility_type TEXT,
    ownership TEXT,
    
    -- Location context
    lga TEXT NOT NULL,
    state TEXT NOT NULL,
    senatorial_district TEXT,
    
    -- Temporal context
    reporting_year INTEGER NOT NULL,
    reporting_month INTEGER NOT NULL,
    period TEXT NOT NULL, -- YYYY-MM
    
    -- Source context
    source_file TEXT,
    import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
    source_row INTEGER,
    
    -- Status & Protection
    record_status TEXT NOT NULL, -- valid, warning, error, duplicate
    fingerprint TEXT UNIQUE, -- for duplicate detection
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies for Enrollees
ALTER TABLE enrollees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrollees are readable by all authenticated users"
ON enrollees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enrollees can be managed by authorized users"
ON enrollees FOR ALL
TO authenticated
USING (public.is_finance() OR public.is_network_mgmt())
WITH CHECK (public.is_finance() OR public.is_network_mgmt());

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_enrollees_policy_number ON enrollees(policy_number);
CREATE INDEX IF NOT EXISTS idx_enrollees_provider_id ON enrollees(provider_id);
CREATE INDEX IF NOT EXISTS idx_enrollees_period ON enrollees(period);
CREATE INDEX IF NOT EXISTS idx_enrollees_sector ON enrollees(sector);
CREATE INDEX IF NOT EXISTS idx_enrollees_category ON enrollees(category);
CREATE INDEX IF NOT EXISTS idx_enrollees_lga ON enrollees(lga);
