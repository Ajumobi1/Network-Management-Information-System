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
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_id uuid;
  v_ref text;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to create complaints';
  END IF;
  IF p_provider_id IS NULL OR nullif(trim(p_title), '') IS NULL OR nullif(trim(p_description), '') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Provider, title, and description are required';
  END IF;

  v_ref := 'ODCHC-' || to_char(current_date, 'YYYY') || '-INT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  INSERT INTO public.provider_complaints(reference_number, provider_id, title, category, priority, status, description, assigned_to, created_by)
  VALUES (v_ref, p_provider_id, trim(p_title), p_category, p_priority, 'open', trim(p_description), nullif(trim(p_assigned_to), ''), auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (auth.uid(), auth.jwt() ->> 'email', 'COMPLAINT_CREATED', 'provider_complaints', v_id::text,
          jsonb_build_object('reference_number', v_ref, 'provider_id', p_provider_id, 'category', p_category, 'priority', p_priority));
  RETURN v_id;
END;
$$;