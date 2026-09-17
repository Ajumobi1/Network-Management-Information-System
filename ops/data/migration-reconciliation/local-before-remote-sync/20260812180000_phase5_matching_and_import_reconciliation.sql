-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 5: Provider Matching & Import Reconciliation Backend & RPC Contracts.
--
-- Excludes direct browser CRUD against protected tables. All matching candidates,
-- resolution persistence, and import validations are routed through secure RPCs.

BEGIN;

-- 1. Secure function to retrieve provider candidates for import matching sessions
CREATE OR REPLACE FUNCTION public.nmis_import_match_candidates(
  p_import_session_id uuid,
  p_provider_name text,
  p_provider_code text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_candidates jsonb;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for provider matching';
  END IF;

  IF p_import_session_id IS NULL OR p_provider_name IS NULL OR length(trim(p_provider_name)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Import session ID and provider name are required';
  END IF;

  -- Find matching providers using trigram / similarity / substring scoring
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'provider_code', p.provider_code,
      'provider_name', p.provider_name,
      'category', p.category,
      'ownership', p.ownership,
      'state', p.state,
      'lga', p.lga,
      'status', p.status,
      'match_score', CASE
        WHEN lower(trim(p.provider_code)) = lower(trim(coalesce(p_provider_code, ''))) THEN 100
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 95
        WHEN p.provider_name ILIKE '%' || trim(p_provider_name) || '%' THEN 85
        ELSE 60
      END,
      'match_reason', CASE
        WHEN lower(trim(p.provider_code)) = lower(trim(coalesce(p_provider_code, ''))) THEN 'Exact Provider Code Match'
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 'Exact Name Match'
        ELSE 'Fuzzy Name / Location Match'
      END
    )
  ) INTO v_candidates
  FROM public.providers p
  WHERE (p_state IS NULL OR p.state ILIKE p_state)
    AND (p_lga IS NULL OR p.lga ILIKE p_lga)
    AND (
      p.provider_name ILIKE '%' || trim(p_provider_name) || '%'
      OR (p_provider_code IS NOT NULL AND p.provider_code ILIKE '%' || trim(coalesce(p_provider_code, '')) || '%')
    )
  LIMIT 5;

  RETURN jsonb_build_object(
    'import_session_id', p_import_session_id,
    'query_name', p_provider_name,
    'candidates', coalesce(v_candidates, '[]'::jsonb)
  );
END;
$$;

-- 2. Secure function to resolve provider match and persist to provider_match_resolutions
CREATE OR REPLACE FUNCTION public.nmis_resolve_provider_match(
  p_import_session_id uuid,
  p_candidate_provider_id uuid,
  p_match_token text
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
  v_provider public.providers%ROWTYPE;
  v_resolution public.provider_match_resolutions%ROWTYPE;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for match resolution';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  IF p_import_session_id IS NULL OR p_candidate_provider_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Session ID and candidate provider ID are required';
  END IF;

  SELECT * INTO v_provider FROM public.providers WHERE id = p_candidate_provider_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROVIDER_NOT_FOUND: Candidate provider does not exist';
  END IF;

  -- Upsert match resolution record
  INSERT INTO public.provider_match_resolutions (
    excel_name,
    matched_provider_id,
    matched_provider_name,
    matched_provider_code,
    match_type,
    resolved_by,
    resolved_at
  ) VALUES (
    'Session-' || p_import_session_id::text,
    v_provider.id,
    v_provider.provider_name,
    v_provider.provider_code,
    'MANUAL_VERIFIED',
    coalesce(v_user_email, v_user_id::text),
    now()
  )
  ON CONFLICT (excel_name) DO UPDATE
  SET matched_provider_id = EXCLUDED.matched_provider_id,
      matched_provider_name = EXCLUDED.matched_provider_name,
      matched_provider_code = EXCLUDED.matched_provider_code,
      match_type = EXCLUDED.match_type,
      resolved_by = EXCLUDED.resolved_by,
      resolved_at = EXCLUDED.resolved_at
  RETURNING * INTO v_resolution;

  -- Record audit event
  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id,
    v_user_email,
    'PROVIDER_MATCH_RESOLVED',
    'provider_match_resolutions',
    v_resolution.id::text,
    jsonb_build_object(
      'import_session_id', p_import_session_id,
      'matched_provider_id', v_provider.id,
      'provider_code', v_provider.provider_code,
      'match_token', p_match_token
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'resolution_id', v_resolution.id,
    'matched_provider', jsonb_build_object(
      'id', v_provider.id,
      'provider_code', v_provider.provider_code,
      'provider_name', v_provider.provider_name
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_import_match_candidates(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_resolve_provider_match(uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_import_match_candidates(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_resolve_provider_match(uuid, uuid, text) TO authenticated;

COMMIT;
