-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
--
-- Staging execution of this exact target-specific migration was explicitly authorized
-- after Phase 3B was applied and verified on project tnklirwrnrdvbfjsdtel.
--
-- Prerequisite: Phase 3B deny-by-default table policies and provider read
-- contracts must be approved and applied first. This migration does not grant
-- any browser role direct access to public.providers or public.audit_logs.

BEGIN;

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
        WHERE k.key NOT IN ('provider_code', 'provider_name', 'category', 'subcategory', 'ownership', 'state', 'lga', 'address', 'contact_person', 'phone', 'email', 'bank_name', 'account_name', 'account_number')
      )
      OR NOT (p_payload ?& ARRAY['provider_name', 'category', 'ownership', 'state', 'lga'])
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved provider registration payload' USING ERRCODE = 'P0001';
    END IF;

    IF (p_payload ? 'provider_code' AND (length(trim(p_payload->>'provider_code')) NOT BETWEEN 3 AND 64 OR trim(p_payload->>'provider_code') !~ '^[A-Za-z0-9][A-Za-z0-9/_-]{2,63}$'))
      OR length(trim(p_payload->>'provider_name')) NOT BETWEEN 1 AND 160
      OR length(trim(p_payload->>'state')) NOT BETWEEN 1 AND 120
      OR length(trim(p_payload->>'lga')) NOT BETWEEN 1 AND 120
      OR p_payload->>'category' NOT IN (
        'Hospital', 'Primary Health Centre (PHC)', 'Pharmacy', 'Laboratory',
        'Specialist Centre', 'Diagnostic & Imaging Centre', 'Referral Centre'
      )
      OR p_payload->>'ownership' NOT IN (
        'Government', 'Private'
      )
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: invalid provider registration values' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
      INSERT INTO public.providers (
        provider_code, provider_name, category, subcategory, ownership, state, lga, address, contact_person, phone, email, bank_name, account_name, account_number
      ) VALUES (
        coalesce(upper(trim(p_payload->>'provider_code')), 'NMIS-FAC-' || upper(substring(gen_random_uuid()::text from 1 for 8))),
        trim(p_payload->>'provider_name'),
        p_payload->>'category',
        nullif(trim(p_payload->>'subcategory'), ''),
        p_payload->>'ownership',
        trim(p_payload->>'state'),
        trim(p_payload->>'lga'),
        nullif(trim(p_payload->>'address'), ''),
        nullif(trim(p_payload->>'contact_person'), ''),
        nullif(trim(p_payload->>'phone'), ''),
        nullif(trim(p_payload->>'email'), ''),
        nullif(trim(p_payload->>'bank_name'), ''),
        nullif(trim(p_payload->>'account_name'), ''),
        nullif(trim(p_payload->>'account_number'), '')
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
        WHERE k.key NOT IN ('provider_name', 'category', 'subcategory', 'ownership', 'state', 'lga', 'address', 'contact_person', 'phone', 'email', 'bank_name', 'account_name', 'account_number')
      )
      OR (p_payload ? 'provider_name' AND length(trim(p_payload->>'provider_name')) NOT BETWEEN 1 AND 160)
      OR (p_payload ? 'category' AND p_payload->>'category' NOT IN ('Hospital', 'Primary Health Centre (PHC)', 'Pharmacy', 'Laboratory', 'Specialist Centre', 'Diagnostic & Imaging Centre', 'Referral Centre'))
      OR (p_payload ? 'ownership' AND p_payload->>'ownership' NOT IN ('Government', 'Private'))
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved provider update payload' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.providers
    SET
      provider_name = CASE WHEN p_payload ? 'provider_name' THEN trim(p_payload->>'provider_name') ELSE provider_name END,
      category = CASE WHEN p_payload ? 'category' THEN p_payload->>'category' ELSE category END,
      subcategory = CASE WHEN p_payload ? 'subcategory' THEN nullif(trim(p_payload->>'subcategory'), '') ELSE subcategory END,
      ownership = CASE WHEN p_payload ? 'ownership' THEN p_payload->>'ownership' ELSE ownership END,
      state = CASE WHEN p_payload ? 'state' THEN trim(p_payload->>'state') ELSE state END,
      lga = CASE WHEN p_payload ? 'lga' THEN trim(p_payload->>'lga') ELSE lga END,
      address = CASE WHEN p_payload ? 'address' THEN nullif(trim(p_payload->>'address'), '') ELSE address END,
      contact_person = CASE WHEN p_payload ? 'contact_person' THEN nullif(trim(p_payload->>'contact_person'), '') ELSE contact_person END,
      phone = CASE WHEN p_payload ? 'phone' THEN nullif(trim(p_payload->>'phone'), '') ELSE phone END,
      email = CASE WHEN p_payload ? 'email' THEN nullif(trim(p_payload->>'email'), '') ELSE email END,
      bank_name = CASE WHEN p_payload ? 'bank_name' THEN nullif(trim(p_payload->>'bank_name'), '') ELSE bank_name END,
      account_name = CASE WHEN p_payload ? 'account_name' THEN nullif(trim(p_payload->>'account_name'), '') ELSE account_name END,
      account_number = CASE WHEN p_payload ? 'account_number' THEN nullif(trim(p_payload->>'account_number'), '') ELSE account_number END,
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
