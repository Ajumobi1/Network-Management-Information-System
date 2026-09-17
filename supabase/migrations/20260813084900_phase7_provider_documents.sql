-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 7: Provider Documents & Credentialing Secure Backend RPC Contracts.
--
-- Excludes direct browser CRUD against protected tables (`provider_documents`).
-- All document reads, status updates, and verification are routed through secure RPCs.

BEGIN;

-- 1. Secure function to list field-minimized provider documents
CREATE OR REPLACE FUNCTION public.nmis_list_provider_documents(
  p_provider_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_docs jsonb;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'inspector', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for provider documents';
  END IF;

  IF p_provider_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Provider ID is required';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', d.id,
      'provider_id', d.provider_id,
      'type', d.type,
      'name', d.name,
      'expiry_date', d.expiry_date,
      'version', d.version,
      'status', d.status,
      'created_at', d.created_at
    )
  ) INTO v_docs
  FROM public.provider_documents d
  WHERE d.provider_id = p_provider_id;

  RETURN coalesce(v_docs, '[]'::jsonb);
END;
$$;

-- 2. Secure function to review / update document status (verify/reject)
CREATE OR REPLACE FUNCTION public.nmis_review_provider_document(
  p_document_id uuid,
  p_status text,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
  v_user_email text;
  v_doc public.provider_documents%ROWTYPE;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'inspector') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for document review';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  IF p_document_id IS NULL OR p_status NOT IN ('Approved', 'Rejected', 'Under Review', 'Expired') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Valid document ID and approved status are required';
  END IF;

  SELECT * INTO v_doc FROM public.provider_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_FOUND: Document record does not exist';
  END IF;

  UPDATE public.provider_documents
  SET status = p_status
  WHERE id = p_document_id
  RETURNING * INTO v_doc;

  -- Record audit event
  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id,
    v_user_email,
    'DOCUMENT_REVIEWED',
    'provider_documents',
    v_doc.id::text,
    jsonb_build_object(
      'provider_id', v_doc.provider_id,
      'document_type', v_doc.type,
      'new_status', p_status,
      'review_notes', p_review_notes
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'document_id', v_doc.id,
    'status', v_doc.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_provider_documents(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_review_provider_document(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_list_provider_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_review_provider_document(uuid, text, text) TO authenticated;

COMMIT;
