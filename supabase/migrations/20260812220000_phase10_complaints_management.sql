-- ============================================================================
-- NMIS Phase 10: Complaints & Issue Management Module Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.provider_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('payment', 'claims', 'credentialing', 'inspection', 'enrolment', 'other')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-review', 'escalated', 'resolved', 'closed')),
  description TEXT NOT NULL,
  resolution_notes TEXT,
  assigned_to VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.provider_complaints ENABLE ROW LEVEL SECURITY;

-- Secure RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users with role" ON public.provider_complaints;
CREATE POLICY "Enable read access for authenticated users with role" ON public.provider_complaints
  FOR SELECT TO authenticated
  USING (
    public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service', 'inspector'])
    OR (auth.uid() = created_by)
  );

DROP POLICY IF EXISTS "Enable insert for authenticated staff" ON public.provider_complaints;
CREATE POLICY "Enable insert for authenticated staff" ON public.provider_complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service'])
  );

DROP POLICY IF EXISTS "Enable update for staff and officers" ON public.provider_complaints;
CREATE POLICY "Enable update for staff and officers" ON public.provider_complaints
  FOR UPDATE TO authenticated
  USING (
    public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service'])
  )
  WITH CHECK (
    public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service'])
  );

-- Secure RPCs
CREATE OR REPLACE FUNCTION public.nmis_list_complaints(
  p_status VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_provider_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  provider_id UUID,
  provider_name VARCHAR,
  provider_code VARCHAR,
  title VARCHAR,
  category VARCHAR,
  priority VARCHAR,
  status VARCHAR,
  description TEXT,
  resolution_notes TEXT,
  assigned_to VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service', 'inspector']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaints';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.provider_id,
    p.facility_name AS provider_name,
    p.provider_code,
    c.title,
    c.category,
    c.priority,
    c.status,
    c.description,
    c.resolution_notes,
    c.assigned_to,
    c.created_at,
    c.updated_at
  FROM public.provider_complaints c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
  ORDER BY c.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_create_complaint(
  p_provider_id UUID,
  p_title VARCHAR,
  p_category VARCHAR,
  p_priority VARCHAR,
  p_description TEXT,
  p_assigned_to VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_complaint_id UUID;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to create complaints';
  END IF;

  INSERT INTO public.provider_complaints (
    provider_id,
    title,
    category,
    priority,
    status,
    description,
    assigned_to,
    created_by
  ) VALUES (
    p_provider_id,
    p_title,
    p_category,
    p_priority,
    'open',
    p_description,
    p_assigned_to,
    auth.uid()
  )
  RETURNING id INTO v_complaint_id;

  RETURN v_complaint_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_update_complaint_status(
  p_complaint_id UUID,
  p_status VARCHAR,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to update complaints';
  END IF;

  UPDATE public.provider_complaints
  SET 
    status = p_status,
    resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
    updated_at = NOW()
  WHERE id = p_complaint_id;

  RETURN FOUND;
END;
$$;
