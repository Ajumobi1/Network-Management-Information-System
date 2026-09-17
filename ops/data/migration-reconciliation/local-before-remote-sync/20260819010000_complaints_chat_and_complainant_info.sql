-- 1. Create complaint_messages table for chat-like thread between staff and public/internal complainants
CREATE TABLE IF NOT EXISTS public.complaint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('staff', 'complainant')),
  sender_name text NOT NULL,
  sender_email text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authorized staff and public tracking" ON public.complaint_messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for staff" ON public.complaint_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable insert for public" ON public.complaint_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 2. Update nmis_list_complaints to include complainant details
CREATE OR REPLACE FUNCTION public.nmis_list_complaints(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  reference_number text,
  source text,
  provider_id uuid,
  provider_name text,
  provider_code text,
  title text,
  category text,
  priority text,
  status text,
  description text,
  resolution_notes text,
  assigned_to text,
  complainant_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector','finance','claims']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaints';
  END IF;

  RETURN QUERY
  SELECT 
    c.id, c.reference_number, 'internal'::text as source, c.provider_id, p.provider_name::text, p.provider_code::text,
    c.title, c.category, c.priority, lower(c.status) as status, c.description,
    c.resolution_notes, c.assigned_to, NULL::text as complainant_name, NULL::text as contact_phone, NULL::text as contact_email, c.created_at, c.updated_at
  FROM public.provider_complaints c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR lower(c.status) = lower(p_status))
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_priority IS NULL OR c.priority = p_priority)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.reference_number, c.title, c.description, p.provider_name, p.provider_code, c.assigned_to)) LIKE '%' || lower(trim(p_search)) || '%')
  
  UNION ALL
  
  SELECT 
    c.id, c.reference_number, 'public'::text as source, c.provider_id, COALESCE(p.provider_name, c.provider_name)::text as provider_name, p.provider_code::text,
    'Public Portal Submission'::text as title, c.category, 'medium'::text as priority, lower(c.status) as status, c.description,
    NULL::text as resolution_notes, NULL::text as assigned_to, c.complainant_name, c.contact_phone, c.contact_email, c.created_at, c.updated_at
  FROM public.public_portal_complaints c
  LEFT JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR lower(c.status) = lower(p_status))
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.reference_number, c.complainant_name, c.description, c.provider_name, p.provider_code, c.contact_phone, c.contact_email)) LIKE '%' || lower(trim(p_search)) || '%')
  
  ORDER BY created_at DESC;
END;
$$;

-- 3. RPC to send complaint message (chat)
CREATE OR REPLACE FUNCTION public.nmis_send_complaint_message(
  p_complaint_id uuid,
  p_sender_type text,
  p_sender_name text,
  p_sender_email text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_message_id uuid;
BEGIN
  INSERT INTO public.complaint_messages (complaint_id, sender_type, sender_name, sender_email, message)
  VALUES (p_complaint_id, p_sender_type, p_sender_name, p_sender_email, p_message)
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

-- 4. RPC to get complaint messages
CREATE OR REPLACE FUNCTION public.nmis_get_complaint_messages(p_complaint_id uuid)
RETURNS TABLE (
  id uuid,
  complaint_id uuid,
  sender_type text,
  sender_name text,
  sender_email text,
  message text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id, complaint_id, sender_type, sender_name, sender_email, message, created_at
  FROM public.complaint_messages
  WHERE complaint_id = p_complaint_id
  ORDER BY created_at ASC;
$$;

REVOKE ALL ON FUNCTION public.nmis_send_complaint_message(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_complaint_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_send_complaint_message(uuid, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_complaint_messages(uuid) TO anon, authenticated;
