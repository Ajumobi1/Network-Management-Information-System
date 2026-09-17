BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('payment', 'claims', 'credentialing', 'inspection', 'enrolment', 'other')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-review', 'escalated', 'resolved', 'closed')),
  description text NOT NULL,
  resolution_notes text,
  assigned_to text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_complaints_status_idx ON public.provider_complaints(status);
CREATE INDEX IF NOT EXISTS provider_complaints_category_idx ON public.provider_complaints(category);
CREATE INDEX IF NOT EXISTS provider_complaints_priority_idx ON public.provider_complaints(priority);
CREATE INDEX IF NOT EXISTS provider_complaints_provider_idx ON public.provider_complaints(provider_id);

ALTER TABLE public.provider_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quality_compliance_complaints_read" ON public.provider_complaints;
DROP POLICY IF EXISTS "quality_compliance_complaints_insert" ON public.provider_complaints;
DROP POLICY IF EXISTS "quality_compliance_complaints_update" ON public.provider_complaints;
CREATE POLICY "quality_compliance_complaints_read" ON public.provider_complaints FOR SELECT TO authenticated
  USING (public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector','finance','claims']) OR auth.uid() = created_by);
CREATE POLICY "quality_compliance_complaints_insert" ON public.provider_complaints FOR INSERT TO authenticated
  WITH CHECK (public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']));
CREATE POLICY "quality_compliance_complaints_update" ON public.provider_complaints FOR UPDATE TO authenticated
  USING (public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']))
  WITH CHECK (public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']));

CREATE OR REPLACE FUNCTION public.nmis_list_complaints(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_priority text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
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
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector','finance','claims']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaints';
  END IF;

  RETURN QUERY
  SELECT c.id, c.provider_id, p.facility_name::text, p.provider_code::text,
         c.title, c.category, c.priority, c.status, c.description,
         c.resolution_notes, c.assigned_to, c.created_at, c.updated_at
  FROM public.provider_complaints c
  JOIN public.providers p ON p.id = c.provider_id
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (p_category IS NULL OR c.category = p_category)
    AND (p_priority IS NULL OR c.priority = p_priority)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id)
    AND (p_search IS NULL OR lower(concat_ws(' ', c.title, c.description, p.facility_name, p.provider_code, c.assigned_to)) LIKE '%' || lower(trim(p_search)) || '%')
  ORDER BY c.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_create_complaint(
  p_provider_id uuid,
  p_title text,
  p_category text,
  p_priority text,
  p_description text,
  p_assigned_to text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to create complaints';
  END IF;
  IF p_provider_id IS NULL OR nullif(trim(p_title), '') IS NULL OR nullif(trim(p_description), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Provider, title, and description are required';
  END IF;

  INSERT INTO public.provider_complaints(provider_id, title, category, priority, status, description, assigned_to, created_by)
  VALUES (p_provider_id, trim(p_title), p_category, p_priority, 'open', trim(p_description), nullif(trim(p_assigned_to), ''), auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', 'COMPLAINT_CREATED', 'provider_complaints', v_id::text,
          jsonb_build_object('provider_id', p_provider_id, 'category', p_category, 'priority', p_priority));
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_update_complaint_status(
  p_complaint_id uuid,
  p_status text,
  p_resolution_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_old_status text;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to update complaints';
  END IF;
  IF p_status NOT IN ('open','in-review','escalated','resolved','closed') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid complaint status';
  END IF;
  IF p_status = 'resolved' AND nullif(trim(p_resolution_notes), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Resolution notes are required before resolving a complaint';
  END IF;

  SELECT status INTO v_old_status FROM public.provider_complaints WHERE id = p_complaint_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.provider_complaints
  SET status = p_status, resolution_notes = COALESCE(nullif(trim(p_resolution_notes), ''), resolution_notes), updated_at = now()
  WHERE id = p_complaint_id;

  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', 'COMPLAINT_STATUS_UPDATED', 'provider_complaints', p_complaint_id::text,
          jsonb_build_object('from', v_old_status, 'to', p_status));
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_get_inspection_checklist(p_inspection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin','executive','head-of-network','network-officer','inspector','finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection checklist';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', c.id,
      'inspection_id', c.inspection_id,
      'category', c.category,
      'item', c.item_name,
      'completed', lower(c.status) IN ('compliant','completed','passed'),
      'comments', c.notes
    ) ORDER BY c.category, c.item_name)
    FROM public.inspection_checklists c
    WHERE c.inspection_id = p_inspection_id
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_complaints(text,text,text,text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_create_complaint(uuid,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_update_complaint_status(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_inspection_checklist(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_complaints(text,text,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_create_complaint(uuid,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_update_complaint_status(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_inspection_checklist(uuid) TO authenticated;

COMMIT;