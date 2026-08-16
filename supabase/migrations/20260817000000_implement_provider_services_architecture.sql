-- NMIS PROVIDER CATEGORY & SERVICES ARCHITECTURE
-- IMPLEMENTATION OF SEPARATE CATEGORY AND SERVICES OFFERED

-- 1. Standardize existing categories to uppercase canonical values
UPDATE public.providers
SET category = CASE 
    WHEN provider_name ILIKE '%Diagnostic%' THEN 'DIAGNOSTIC_CENTRE'
    WHEN provider_name ILIKE '%Pharmacy%' OR provider_name ILIKE '%Chemist%' THEN 'PHARMACY'
    WHEN provider_name ILIKE '%Optical%' OR provider_name ILIKE '%Eye%' THEN 'OPTICAL_CENTRE'
    WHEN provider_name ILIKE '%Dental%' THEN 'DENTAL_CENTRE'
    ELSE 'HOSPITAL'
END
WHERE category IS NULL OR category NOT IN ('HOSPITAL', 'DIAGNOSTIC_CENTRE', 'PHARMACY', 'OPTICAL_CENTRE', 'DENTAL_CENTRE');

-- 2. Create provider_services table for normalized multiple services
CREATE TABLE IF NOT EXISTS public.provider_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(provider_id, service_name)
);

-- 3. Add RLS to provider_services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to provider_services"
ON public.provider_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow service_role full access to provider_services"
ON public.provider_services FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Seed initial services for known large hospitals
-- Using a temporary function to handle the seeding safely
DO $$
DECLARE
    p_id UUID;
    large_hospitals TEXT[] := ARRAY[
        'FEDERAL MEDICAL CENTRE OWO',
        'FUTA TEACHING HOSPITAL (UNIMEDTHC), AKURE',
        'UNIMEDTHC LAJE ROAD,ONDO',
        'STATE SPECIALIST HOSPITAL IKARE-AKOKO',
        'STATE SPECIALIST HOSPITAL ONDO',
        'STATE SPECIALIST HOSPITAL, OKITIPUPA',
        'STATE SPECIALIST HOSPITAL, OKE-ARO,AKURE',
        'ONDO STATE REFERENCE HOSPITAL, IGBATORO ROAD AKURE'
    ];
    h_name TEXT;
    services TEXT[] := ARRAY[
        'Diagnostic Services',
        'Dental Services',
        'Optical Services',
        'Laboratory Services',
        'Pharmacy Services',
        'Specialist Services'
    ];
    s_name TEXT;
BEGIN
    FOREACH h_name IN ARRAY large_hospitals LOOP
        SELECT id INTO p_id FROM public.providers WHERE provider_name = h_name;
        IF p_id IS NOT NULL THEN
            FOREACH s_name IN ARRAY services LOOP
                INSERT INTO public.provider_services (provider_id, service_name)
                VALUES (p_id, s_name)
                ON CONFLICT (provider_id, service_name) DO NOTHING;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 5. Update nmis_get_provider_operational_profile to include services
CREATE OR REPLACE FUNCTION public.nmis_get_provider_operational_profile(p_provider_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile JSONB;
    v_services TEXT[];
BEGIN
    -- Get provider services
    SELECT array_agg(service_name) INTO v_services
    FROM provider_services
    WHERE provider_id = p_provider_id;

    -- Build profile
    SELECT jsonb_build_object(
        'id', p.id,
        'provider_code', p.provider_code,
        'provider_name', p.provider_name,
        'category', p.category,
        'subcategory', p.subcategory,
        'ownership', p.ownership,
        'lga', p.lga,
        'state', p.state,
        'senatorial_district', p.senatorial_district,
        'status', p.status,
        'address', p.address,
        'contact_person', p.contact_person,
        'phone', p.phone,
        'email', p.email,
        'bank_name', p.bank_name,
        'account_name', p.account_name,
        'account_number', p.account_number,
        'services', COALESCE(v_services, ARRAY[]::TEXT[])
    ) INTO v_profile
    FROM providers p
    WHERE p.id = p_provider_id;

    RETURN v_profile;
END;
$$;

-- 6. Update nmis_list_provider_directory to support service filtering
-- Note: This is a simplified version, assuming the RPC exists and we are adding service support
-- We'll need to check the full definition of nmis_list_provider_directory to be sure
-- For now, we'll add a helper function to get services for multiple providers
CREATE OR REPLACE FUNCTION public.nmis_get_providers_services(p_provider_ids UUID[])
RETURNS TABLE (provider_id UUID, services TEXT[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT provider_id, array_agg(service_name) as services
    FROM provider_services
    WHERE provider_id = ANY(p_provider_ids)
    GROUP BY provider_id;
$$;
