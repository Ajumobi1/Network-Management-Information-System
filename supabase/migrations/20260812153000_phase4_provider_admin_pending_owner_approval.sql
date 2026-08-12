-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
--
-- This migration is intentionally non-executable. Its guard MUST remain until
-- the owner approves the exact Phase 3B/Phase 4 staging deployment sequence.
--
-- Prerequisite: Phase 3B deny-by-default table policies and provider read
-- contracts must be approved and applied first. This migration does not grant
-- any browser role direct access to public.providers or public.audit_logs.

BEGIN;

DO $$
BEGIN
  RAISE EXCEPTION
    'PENDING OWNER APPROVAL: Phase 4 provider admin workflow migration is intentionally guarded and must not execute';
END
$$;

-- The Edge Function is the only caller. It verifies the user JWT, the signed
-- app_metadata.nmis_role claim, AAL2, command schema, and field allow-list
-- before using its server-only credential to invoke this internal RPC.
CREATE OR REPLACE FUNCTION public.nmis_provider_admin_write(
  p_command text,
  p_provider_id uuid,
  p_payload jsonb,
  p_actor_id uuid,
  p_actor_email text,
  p_correlation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
  v_action text;
  v_status text;
  v_audit_action text;
BEGIN
  IF p_command NOT IN ('register', 'edit_operational', 'change_lifecycle') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: unsupported provider command' USING ERRCODE = 'P0001';
  END IF;
  IF p_actor_id IS NULL OR p_correlation_id IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: invalid trusted workflow request' USING ERRCODE = 'P0001';
  END IF;

  IF p_command = 'register' THEN
    IF p_provider_id IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p_payload) AS k(key)
        WHERE k.key NOT IN ('provider_code', 'provider_name', 'category', 'subcategory', 'ownership', 'state', 'lga')
      )
      OR NOT (p_payload ?& ARRAY['provider_code', 'provider_name', 'category', 'ownership', 'state', 'lga'])
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved provider registration payload' USING ERRCODE = 'P0001';
    END IF;

    IF length(trim(p_payload->>'provider_code')) NOT BETWEEN 3 AND 64
      OR trim(p_payload->>'provider_code') !~ '^[A-Za-z0-9][A-Za-z0-9/_-]{2,63}$'
      OR length(trim(p_payload->>'provider_name')) NOT BETWEEN 1 AND 160
      OR length(trim(p_payload->>'state')) NOT BETWEEN 1 AND 120
      OR length(trim(p_payload->>'lga')) NOT BETWEEN 1 AND 120
      OR p_payload->>'category' NOT IN (
        'Hospital', 'Primary Health Centre (PHC)', 'Pharmacy', 'Laboratory',
        'Specialist Centre', 'Diagnostic & Imaging Centre', 'Referral Centre'
      )
      OR p_payload->>'ownership' NOT IN (
        'Private', 'Public/Government', 'Faith-Based', 'NGO/Non-Profit', 'Corporate'
      )
      OR (p_payload ? 'subcategory' AND jsonb_typeof(p_payload->'subcategory') NOT IN ('string', 'null'))
      OR (p_payload ? 'subcategory' AND length(coalesce(trim(p_payload->>'subcategory'), '')) > 160)
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: invalid provider registration values' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
      INSERT INTO public.providers (
        provider_code, provider_name, category, subcategory, ownership, state, lga
      ) VALUES (
        upper(trim(p_payload->>'provider_code')),
        trim(p_payload->>'provider_name'),
        p_payload->>'category',
        nullif(trim(p_payload->>'subcategory'), ''),
        p_payload->>'ownership',
        trim(p_payload->>'state'),
        trim(p_payload->>'lga')
      )
      RETURNING * INTO v_provider;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'DUPLICATE_PROVIDER' USING ERRCODE = 'P0001';
    END;
    v_audit_action := 'PROVIDER_CREATED';

  ELSIF p_command = 'edit_operational' THEN
    IF p_provider_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p_payload) AS k(key)
        WHERE k.key NOT IN ('subcategory', 'state', 'lga')
      )
      OR NOT (p_payload ? 'subcategory' OR p_payload ? 'state' OR p_payload ? 'lga')
      OR (p_payload ? 'subcategory' AND jsonb_typeof(p_payload->'subcategory') NOT IN ('string', 'null'))
      OR (p_payload ? 'state' AND (jsonb_typeof(p_payload->'state') <> 'string' OR length(trim(p_payload->>'state')) NOT BETWEEN 1 AND 120))
      OR (p_payload ? 'lga' AND (jsonb_typeof(p_payload->'lga') <> 'string' OR length(trim(p_payload->>'lga')) NOT BETWEEN 1 AND 120))
      OR (p_payload ? 'subcategory' AND length(coalesce(trim(p_payload->>'subcategory'), '')) > 160)
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved operational update payload' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.providers
    SET
      subcategory = CASE WHEN p_payload ? 'subcategory' THEN nullif(trim(p_payload->>'subcategory'), '') ELSE subcategory END,
      state = CASE WHEN p_payload ? 'state' THEN trim(p_payload->>'state') ELSE state END,
      lga = CASE WHEN p_payload ? 'lga' THEN trim(p_payload->>'lga') ELSE lga END,
      updated_at = now()
    WHERE id = p_provider_id
    RETURNING * INTO v_provider;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROVIDER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    v_audit_action := 'PROVIDER_OPERATIONAL_UPDATED';

  ELSE
    IF p_provider_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p_payload) AS k(key)
        WHERE k.key <> 'status'
      )
      OR p_payload->>'status' NOT IN ('active', 'inactive')
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved lifecycle payload' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROVIDER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    v_status := lower(v_provider.status);
    IF NOT ((v_status = 'active' AND p_payload->>'status' = 'inactive')
      OR (v_status = 'inactive' AND p_payload->>'status' = 'active'))
    THEN
      RAISE EXCEPTION 'INVALID_LIFECYCLE_TRANSITION' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.providers
    SET status = CASE p_payload->>'status' WHEN 'active' THEN 'Active' ELSE 'Inactive' END,
        updated_at = now()
    WHERE id = p_provider_id
    RETURNING * INTO v_provider;
    v_audit_action := 'PROVIDER_LIFECYCLE_CHANGED';
  END IF;

  -- This INSERT is in the same transaction as the provider change. Any audit
  -- failure rolls back the write and cannot produce a false successful result.
  BEGIN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
    VALUES (
      p_actor_id,
      p_actor_email,
      v_audit_action,
      'providers',
      v_provider.id::text,
      jsonb_build_object(
        'correlation_id', p_correlation_id,
        'command', p_command,
        'provider_code', v_provider.provider_code
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'AUDIT_FAILURE' USING ERRCODE = 'P0001';
  END;

  RETURN jsonb_build_object(
    'provider', jsonb_build_object(
      'id', v_provider.id,
      'provider_code', v_provider.provider_code,
      'provider_name', v_provider.provider_name,
      'category', v_provider.category,
      'subcategory', v_provider.subcategory,
      'ownership', v_provider.ownership,
      'state', v_provider.state,
      'lga', v_provider.lga,
      'status', v_provider.status,
      'contract_status', v_provider.contract_status,
      'credential_status', v_provider.credential_status,
      'inspection_status', v_provider.inspection_status,
      'capitation_status', v_provider.capitation_status,
      'inspection_rating', v_provider.inspection_rating,
      'last_inspection_date', v_provider.last_inspection_date
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_provider_admin_write(text, uuid, jsonb, uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_provider_admin_write(text, uuid, jsonb, uuid, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.nmis_provider_admin_write(text, uuid, jsonb, uuid, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_provider_admin_write(text, uuid, jsonb, uuid, text, uuid) TO service_role;

COMMIT;
