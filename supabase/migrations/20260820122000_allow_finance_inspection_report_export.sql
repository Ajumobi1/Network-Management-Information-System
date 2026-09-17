BEGIN;

DROP POLICY IF EXISTS "inspection_reports_authenticated_insert" ON storage.objects;
CREATE POLICY "inspection_reports_authenticated_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inspection-reports'
  AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
  AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance']::text[])
);

DROP POLICY IF EXISTS "inspection_reports_authenticated_update" ON storage.objects;
CREATE POLICY "inspection_reports_authenticated_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'inspection-reports'
  AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance']::text[])
)
WITH CHECK (
  bucket_id = 'inspection-reports'
  AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$'
  AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance']::text[])
);

CREATE OR REPLACE FUNCTION public.nmis_register_inspection_report(
  p_provider_id uuid,
  p_inspection_id uuid,
  p_file_path text,
  p_file_name text,
  p_version text DEFAULT '1.0'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_document public.provider_documents%ROWTYPE;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Inspection report registration is restricted';
  END IF;

  IF p_provider_id IS NULL OR p_inspection_id IS NULL OR NULLIF(p_file_path, '') IS NULL OR NULLIF(p_file_name, '') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Provider, inspection, file path, and file name are required';
  END IF;

  IF p_file_path <> p_provider_id::text || '/' || p_inspection_id::text || '.pdf' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Inspection report path does not match the inspection';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inspections i
    WHERE i.id = p_inspection_id
      AND i.provider_id = p_provider_id
      AND i.status = 'Submitted'
  ) THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: A submitted inspection linked to this provider is required';
  END IF;

  SELECT * INTO v_document
  FROM public.provider_documents
  WHERE file_url = p_file_path
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_document.id,
      'provider_id', v_document.provider_id,
      'inspection_id', p_inspection_id,
      'type', v_document.type,
      'name', v_document.name,
      'version', v_document.version,
      'status', v_document.status,
      'file_url', v_document.file_url,
      'created_at', v_document.created_at
    );
  END IF;

  INSERT INTO public.provider_documents(provider_id, type, name, expiry_date, version, status, file_url)
  VALUES (p_provider_id, 'Inspection Report', p_file_name, NULL, COALESCE(NULLIF(p_version, ''), '1.0'), 'Approved', p_file_path)
  RETURNING * INTO v_document;

  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    'INSPECTION_REPORT_REGISTERED',
    'provider_documents',
    v_document.id::text,
    jsonb_build_object('provider_id', p_provider_id, 'inspection_id', p_inspection_id, 'file_path', p_file_path)
  );

  RETURN jsonb_build_object(
    'id', v_document.id,
    'provider_id', v_document.provider_id,
    'inspection_id', p_inspection_id,
    'type', v_document.type,
    'name', v_document.name,
    'version', v_document.version,
    'status', v_document.status,
    'file_url', v_document.file_url,
    'created_at', v_document.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_register_inspection_report(uuid, uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_register_inspection_report(uuid, uuid, text, text, text) TO authenticated;

COMMIT;
