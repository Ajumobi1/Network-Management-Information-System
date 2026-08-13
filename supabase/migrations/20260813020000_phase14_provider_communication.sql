-- ============================================================================
-- NMIS Phase 14: Provider Communication & Workflow Module Migration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.provider_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('General', 'Credentialing', 'Inspection', 'Complaint', 'Financial', 'Contract')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('Phone', 'Email', 'Letter', 'Meeting', 'SMS', 'Portal', 'Other')),
  status VARCHAR(30) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Awaiting Provider', 'Awaiting Internal Action', 'Resolved', 'Closed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  assigned_officer VARCHAR(100),
  communication_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  follow_up_date TIMESTAMPTZ,
  follow_up_completed BOOLEAN NOT NULL DEFAULT FALSE,
  related_entity_type VARCHAR(50), -- 'complaint', 'inspection', 'document', 'capitation'
  related_entity_id UUID,
  correlation_id UUID DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.provider_communications ENABLE ROW LEVEL SECURITY;

-- Secure RLS policies
DROP POLICY IF EXISTS "Enable read access for communications" ON public.provider_communications;
CREATE POLICY "Enable read access for communications" ON public.provider_communications
  FOR SELECT TO authenticated
  USING (
    public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service', 'inspector', 'finance'])
  );

DROP POLICY IF EXISTS "Enable insert for staff" ON public.provider_communications;
CREATE POLICY "Enable insert for staff" ON public.provider_communications
  FOR INSERT TO authenticated
  WITH CHECK (
    public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'customer-service', 'inspector', 'finance'])
  );

DROP POLICY IF EXISTS "Enable update for staff" ON public.provider_communications;
CREATE POLICY "Enable update for staff" ON public.provider_communications
  FOR UPDATE TO authenticated
  USING (
    public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'customer-service'])
  );

-- Secure RPCs
CREATE OR REPLACE FUNCTION public.nmis_list_provider_communications(
  p_provider_id UUID DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL,
  p_type VARCHAR DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  provider_id UUID,
  provider_name VARCHAR,
  provider_code VARCHAR,
  type VARCHAR,
  subject VARCHAR,
  message TEXT,
  channel VARCHAR,
  status VARCHAR,
  priority VARCHAR,
  assigned_officer VARCHAR,
  communication_date TIMESTAMPTZ,
  follow_up_date TIMESTAMPTZ,
  follow_up_completed BOOLEAN,
  related_entity_type VARCHAR,
  related_entity_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service', 'inspector', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.provider_id,
    p.facility_name AS provider_name,
    p.provider_code,
    c.type,
    c.subject,
    c.message,
    c.channel,
    c.status,
    c.priority,
    c.assigned_officer,
    c.communication_date,
    c.follow_up_date,
    c.follow_up_completed,
    c.related_entity_type,
    c.related_entity_id,
    c.created_at,
    c.updated_at
  FROM public.provider_communications c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_type IS NULL OR c.type = p_type)
    AND (p_search IS NULL OR c.subject ILIKE '%' || p_search || '%' OR c.message ILIKE '%' || p_search || '%')
  ORDER BY c.communication_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_create_provider_communication(
  p_provider_id UUID,
  p_type VARCHAR,
  p_subject VARCHAR,
  p_message TEXT,
  p_channel VARCHAR,
  p_priority VARCHAR DEFAULT 'Medium',
  p_assigned_officer VARCHAR DEFAULT NULL,
  p_follow_up_date TIMESTAMPTZ DEFAULT NULL,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comm_id UUID;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'customer-service', 'inspector', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  INSERT INTO public.provider_communications (
    provider_id,
    type,
    subject,
    message,
    channel,
    priority,
    assigned_officer,
    follow_up_date,
    related_entity_type,
    related_entity_id,
    created_by
  ) VALUES (
    p_provider_id,
    p_type,
    p_subject,
    p_message,
    p_channel,
    p_priority,
    p_assigned_officer,
    p_follow_up_date,
    p_related_entity_type,
    p_related_entity_id,
    auth.uid()
  )
  RETURNING id INTO v_comm_id;

  -- Create notification if follow-up is set
  IF p_follow_up_date IS NOT NULL THEN
    INSERT INTO public.system_notifications (
      user_id,
      title,
      message,
      category,
      severity,
      link_url
    ) VALUES (
      auth.uid(),
      'Communication Follow-up Set',
      'Follow-up scheduled for ' || p_subject || ' on ' || p_follow_up_date::date::text,
      'system',
      'info',
      '/providers/' || p_provider_id::text
    );
  END IF;

  RETURN v_comm_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_complete_communication_followup(
  p_comm_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_communications
  SET 
    follow_up_completed = TRUE,
    status = 'Resolved',
    updated_at = NOW()
  WHERE id = p_comm_id;

  RETURN FOUND;
END;
$$;
