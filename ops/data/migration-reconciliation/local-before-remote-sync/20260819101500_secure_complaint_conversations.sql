-- Secure two-way complaint conversations.
-- Staff use complaint UUIDs through authenticated, role-checked RPCs.
-- Complainants use reference number plus their original phone or email.

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
  IF p_sender_type <> 'staff' THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Staff RPC accepts staff messages only';
  END IF;

  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to send complaint messages';
  END IF;

  IF nullif(trim(coalesce(p_message, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.provider_complaints WHERE id = p_complaint_id)
     AND NOT EXISTS (SELECT 1 FROM public.public_portal_complaints WHERE id = p_complaint_id) THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;

  INSERT INTO public.complaint_messages (complaint_id, sender_type, sender_name, sender_email, message)
  VALUES (p_complaint_id, 'staff', COALESCE(NULLIF(trim(p_sender_name), ''), 'ODCHC Support'), NULLIF(trim(p_sender_email), ''), trim(p_message))
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','customer-service','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient permissions to view complaint messages';
  END IF;

  RETURN QUERY
  SELECT m.id, m.complaint_id, m.sender_type, m.sender_name, m.sender_email, m.message, m.created_at
  FROM public.complaint_messages m
  WHERE m.complaint_id = p_complaint_id
  ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_public_get_complaint_thread(
  p_reference text,
  p_contact text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_complaint public.public_portal_complaints%ROWTYPE;
  v_contact text := lower(trim(coalesce(p_contact, '')));
  v_messages jsonb;
  v_updates jsonb;
BEGIN
  IF nullif(trim(coalesce(p_reference, '')), '') IS NULL OR v_contact = '' THEN
    RAISE EXCEPTION 'Reference number and reporter phone or email are required';
  END IF;

  SELECT * INTO v_complaint
  FROM public.public_portal_complaints c
  WHERE upper(c.reference_number) = upper(trim(p_reference))
    AND (
      lower(trim(coalesce(c.contact_email, ''))) = v_contact
      OR regexp_replace(coalesce(c.contact_phone, ''), '[^0-9]', '', 'g') = regexp_replace(v_contact, '[^0-9]', '', 'g')
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No complaint matched that reference number and contact detail';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'senderType', m.sender_type,
    'senderName', CASE WHEN m.sender_type = 'staff' THEN m.sender_name ELSE 'You' END,
    'message', m.message,
    'createdAt', m.created_at
  ) ORDER BY m.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM public.complaint_messages m
  WHERE m.complaint_id = v_complaint.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', u.id,
    'statusFrom', u.status_from,
    'statusTo', u.status_to,
    'notes', u.notes,
    'createdAt', u.created_at
  ) ORDER BY u.created_at ASC), '[]'::jsonb)
  INTO v_updates
  FROM public.complaint_updates u
  WHERE u.complaint_id = v_complaint.id
    AND u.complaint_source = 'public';

  RETURN jsonb_build_object(
    'complaint', jsonb_build_object(
      'referenceNumber', v_complaint.reference_number,
      'category', v_complaint.category,
      'providerName', v_complaint.provider_name,
      'status', v_complaint.status,
      'description', v_complaint.description,
      'submittedAt', v_complaint.created_at
    ),
    'messages', v_messages,
    'updates', v_updates
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_public_send_complaint_message(
  p_reference text,
  p_contact text,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_complaint public.public_portal_complaints%ROWTYPE;
  v_message_id uuid;
  v_contact text := lower(trim(coalesce(p_contact, '')));
BEGIN
  IF nullif(trim(coalesce(p_reference, '')), '') IS NULL OR v_contact = '' THEN
    RAISE EXCEPTION 'Reference number and reporter phone or email are required';
  END IF;

  IF nullif(trim(coalesce(p_message, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  SELECT * INTO v_complaint
  FROM public.public_portal_complaints c
  WHERE upper(c.reference_number) = upper(trim(p_reference))
    AND (
      lower(trim(coalesce(c.contact_email, ''))) = v_contact
      OR regexp_replace(coalesce(c.contact_phone, ''), '[^0-9]', '', 'g') = regexp_replace(v_contact, '[^0-9]', '', 'g')
    )
    AND lower(c.status) NOT IN ('resolved', 'closed')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complaint not found, contact verification failed, or the complaint is already resolved';
  END IF;

  INSERT INTO public.complaint_messages (complaint_id, sender_type, sender_name, sender_email, message)
  VALUES (v_complaint.id, 'complainant', COALESCE(NULLIF(trim(v_complaint.complainant_name), ''), 'Complainant'), v_complaint.contact_email, trim(p_message))
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_public_get_complaint_thread(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_public_send_complaint_message(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_public_get_complaint_thread(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_public_send_complaint_message(text, text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.nmis_send_complaint_message(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_complaint_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_send_complaint_message(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_complaint_messages(uuid) TO authenticated;

-- Leave the base table protected by RLS; conversation access is only through the RPCs above.
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.complaint_messages FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.complaint_messages IS 'Two-way complaint conversation messages. Access only through security-definer RPCs.';
COMMENT ON FUNCTION public.nmis_public_get_complaint_thread(text, text) IS 'Returns public-safe complaint status, staff notes, and messages after reference plus reporter contact verification.';
COMMENT ON FUNCTION public.nmis_public_send_complaint_message(text, text, text) IS 'Allows a verified complainant to reply while the complaint remains unresolved.';

NOTIFY pgrst, 'reload schema';
