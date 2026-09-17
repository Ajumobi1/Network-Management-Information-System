-- Add reference_number and source to provider_complaints for consistency
ALTER TABLE public.provider_complaints ADD COLUMN IF NOT EXISTS reference_number text;
ALTER TABLE public.provider_complaints ADD COLUMN IF NOT EXISTS source text DEFAULT 'internal';

-- Backfill existing internal complaints with reference numbers
UPDATE public.provider_complaints 
SET reference_number = 'ODCHC-' || to_char(created_at, 'YYYY') || '-INT-' || upper(substr(id::text, 1, 4))
WHERE reference_number IS NULL;

-- Create a table for persistent complaint notes/updates
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL,
  complaint_source text NOT NULL CHECK (complaint_source IN ('internal', 'public')),
  status_from text,
  status_to text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on complaint_updates
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authorized staff" ON public.complaint_updates
  FOR SELECT TO authenticated
  USING (public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service', 'inspector']));

CREATE POLICY "Enable insert for authorized staff" ON public.complaint_updates
  FOR INSERT TO authenticated
  WITH CHECK (public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'customer-service']));

-- Unified complaint listing RPC
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
    c.title, c.category, c.priority, c.status, c.description,
    c.resolution_notes, c.assigned_to, c.created_at, c.updated_at
  FROM public.provider_complaints c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_priority IS NULL OR c.priority = p_priority)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.reference_number, c.title, c.description, p.provider_name, p.provider_code, c.assigned_to)) LIKE '%' || lower(trim(p_search)) || '%')
  
  UNION ALL
  
  SELECT 
    c.id, c.reference_number, 'public'::text as source, c.provider_id, COALESCE(p.provider_name, c.provider_name)::text as provider_name, p.provider_code::text,
    'Public Portal Submission'::text as title, c.category, 'medium'::text as priority, c.status, c.description,
    NULL::text as resolution_notes, NULL::text as assigned_to, c.created_at, c.updated_at
  FROM public.public_portal_complaints c
  LEFT JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.reference_number, c.complainant_name, c.description, c.provider_name, p.provider_code)) LIKE '%' || lower(trim(p_search)) || '%')
  
  ORDER BY created_at DESC;
END;
$$;

-- Updated status update RPC with note persistence
CREATE OR REPLACE FUNCTION public.nmis_update_complaint_status(
  p_complaint_id uuid,
  p_status text,
  p_resolution_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_old_status text;
  v_source text;
  v_found boolean := false;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to update complaints';
  END IF;

  -- Try internal table first
  SELECT status, 'internal' INTO v_old_status, v_source FROM public.provider_complaints WHERE id = p_complaint_id FOR UPDATE;
  
  IF FOUND THEN
    UPDATE public.provider_complaints
    SET status = p_status, resolution_notes = COALESCE(nullif(trim(p_resolution_notes), ''), resolution_notes), updated_at = now()
    WHERE id = p_complaint_id;
    v_found := true;
  ELSE
    -- Try public table
    SELECT status, 'public' INTO v_old_status, v_source FROM public.public_portal_complaints WHERE id = p_complaint_id FOR UPDATE;
    IF FOUND THEN
      UPDATE public.public_portal_complaints
      SET status = p_status, updated_at = now()
      WHERE id = p_complaint_id;
      v_found := true;
    END IF;
  END IF;

  IF NOT v_found THEN RETURN false; END IF;

  -- Persist the update note in history
  INSERT INTO public.complaint_updates (complaint_id, complaint_source, status_from, status_to, notes, created_by, created_by_email)
  VALUES (p_complaint_id, v_source, v_old_status, p_status, nullif(trim(p_resolution_notes), ''), auth.uid(), auth.jwt() ->> 'email');

  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', 'COMPLAINT_STATUS_UPDATED', CASE WHEN v_source = 'internal' THEN 'provider_complaints' ELSE 'public_portal_complaints' END, p_complaint_id::text,
          jsonb_build_object('from', v_old_status, 'to', p_status, 'has_notes', p_resolution_notes IS NOT NULL));
  
  RETURN true;
END;
$$;

-- New RPC to get complaint update history
CREATE OR REPLACE FUNCTION public.nmis_get_complaint_history(p_complaint_id uuid)
RETURNS TABLE (
  id uuid,
  status_from text,
  status_to text,
  notes text,
  created_by_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaint history';
  END IF;

  RETURN QUERY
  SELECT u.id, u.status_from, u.status_to, u.notes, u.created_by_email, u.created_at
  FROM public.complaint_updates u
  WHERE u.complaint_id = p_complaint_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.nmis_list_complaints(text, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_update_complaint_status(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_complaint_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_complaints(text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_update_complaint_status(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_complaint_history(uuid) TO authenticated;
