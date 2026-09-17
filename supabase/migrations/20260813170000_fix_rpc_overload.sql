-- Drop all overloads of nmis_provider_admin_write to eliminate PostgREST ambiguity (PGRST202)
DROP FUNCTION IF EXISTS public.nmis_provider_admin_write(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.nmis_provider_admin_write(text, uuid, jsonb, uuid, text, uuid);

-- Recreate definitive single version
CREATE OR REPLACE FUNCTION public.nmis_provider_admin_write(
  p_command text,
  p_provider_id uuid,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_provider public.providers%ROWTYPE;
  v_audit_action text;
  v_status_val text;
  v_dep_count integer := 0;
  v_actor_id uuid;
  v_actor_email text;
  v_role text;
  v_aal text;
BEGIN
  -- 1. Security Boundary: Verify Identity & Authority
  v_actor_id := auth.uid();
  v_actor_email := auth.jwt() ->> 'email';
  v_role := auth.jwt() -> 'app_metadata' ->> 'nmis_role';
  v_aal := auth.jwt() ->> 'aal';

  IF v_actor_id IS NULL OR v_role IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Authentication required' USING ERRCODE = 'P0001';
  END IF;

  IF v_role <> 'super-admin' THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Provider administration is restricted to super-administrators' USING ERRCODE = 'P0001';
  END IF;

  -- Require MFA (AAL2) for production operations
  IF v_aal <> 'aal2' THEN
    RAISE EXCEPTION 'AAL_REQUIRED: Complete multi-factor authentication before performing this provider operation' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Command Validation
  IF p_command NOT IN ('register', 'edit_operational', 'change_lifecycle', 'delete_provider') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: unsupported provider command' USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: invalid payload' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Execute Commands
  IF p_command = 'register' THEN
    IF p_provider_id IS NOT NULL
      OR NOT (p_payload ?& ARRAY['provider_name', 'category', 'ownership', 'state', 'lga'])
    THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: unapproved provider registration payload' USING ERRCODE = 'P0001';
    END IF;

    -- State must be Ondo
    IF trim(p_payload->>'state') <> 'Ondo' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Provider state must be Ondo' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
      INSERT INTO public.providers (
        provider_code, provider_name, category, subcategory, ownership, state, lga, address, contact_person, phone, email, bank_name, account_name, account_number, status
      ) VALUES (
        coalesce(upper(trim(p_payload->>'provider_code')), 'NMIS-FAC-' || upper(substring(gen_random_uuid()::text from 1 for 8))),
        trim(p_payload->>'provider_name'),
        p_payload->>'category',
        nullif(trim(p_payload->>'subcategory'), ''),
        p_payload->>'ownership',
        'Ondo',
        trim(p_payload->>'lga'),
        nullif(trim(p_payload->>'address'), ''),
        nullif(trim(p_payload->>'contact_person'), ''),
        nullif(trim(p_payload->>'phone'), ''),
        nullif(trim(p_payload->>'email'), ''),
        nullif(trim(p_payload->>'bank_name'), ''),
        nullif(trim(p_payload->>'account_name'), ''),
        nullif(trim(p_payload->>'account_number'), ''),
        coalesce(p_payload->>'status', 'Active')
      )
      RETURNING * INTO v_provider;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'DUPLICATE_PROVIDER' USING ERRCODE = 'P0001';
    END;
    v_audit_action := 'PROVIDER_CREATED';

  ELSIF p_command = 'edit_operational' THEN
    IF p_provider_id IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: provider id required for update' USING ERRCODE = 'P0001';
    END IF;

    -- Ensure state remains Ondo
    IF p_payload ? 'state' AND trim(p_payload->>'state') <> 'Ondo' THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: Provider state must remain Ondo' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.providers
    SET
      provider_name = CASE WHEN p_payload ? 'provider_name' THEN trim(p_payload->>'provider_name') ELSE provider_name END,
      category = CASE WHEN p_payload ? 'category' THEN p_payload->>'category' ELSE category END,
      subcategory = CASE WHEN p_payload ? 'subcategory' THEN nullif(trim(p_payload->>'subcategory'), '') ELSE subcategory END,
      ownership = CASE WHEN p_payload ? 'ownership' THEN p_payload->>'ownership' ELSE ownership END,
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

  ELSIF p_command = 'change_lifecycle' THEN
    IF p_provider_id IS NULL OR NOT (p_payload ? 'status') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: status required' USING ERRCODE = 'P0001';
    END IF;

    v_status_val := trim(p_payload->>'status');
    IF lower(v_status_val) NOT IN ('active', 'pending', 'suspended', 'inactive', 'expired', 'blacklisted', 'pending review') THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: invalid lifecycle status' USING ERRCODE = 'P0001';
    END IF;

    IF lower(v_status_val) = 'active' THEN v_status_val := 'Active';
    ELSIF lower(v_status_val) = 'pending' OR lower(v_status_val) = 'pending review' THEN v_status_val := 'Pending';
    ELSIF lower(v_status_val) = 'suspended' THEN v_status_val := 'Suspended';
    ELSIF lower(v_status_val) = 'inactive' THEN v_status_val := 'Inactive';
    ELSIF lower(v_status_val) = 'expired' THEN v_status_val := 'Expired';
    ELSIF lower(v_status_val) = 'blacklisted' THEN v_status_val := 'Blacklisted';
    END IF;

    SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROVIDER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.providers
    SET status = v_status_val,
        updated_at = now()
    WHERE id = p_provider_id
    RETURNING * INTO v_provider;
    v_audit_action := 'PROVIDER_LIFECYCLE_CHANGED';

  ELSIF p_command = 'delete_provider' THEN
    IF p_provider_id IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_ERROR: provider id required' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_provider FROM public.providers WHERE id = p_provider_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROVIDER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    SELECT 
      (SELECT count(*) FROM public.financial_records WHERE provider_id = p_provider_id) +
      (SELECT count(*) FROM public.enrollees WHERE provider_id = p_provider_id) +
      (SELECT count(*) FROM public.inspections WHERE provider_id = p_provider_id) +
      (SELECT count(*) FROM public.capitation_records WHERE provider_id = p_provider_id) +
      (SELECT count(*) FROM public.complaints WHERE provider_id = p_provider_id) +
      (SELECT count(*) FROM public.provider_documents WHERE provider_id = p_provider_id)
    INTO v_dep_count;

    IF v_dep_count > 0 THEN
      RAISE EXCEPTION 'DEPENDENCY_CONFLICT: Cannot delete provider with % linked historical records. Use deactivation/suspension instead.', v_dep_count USING ERRCODE = 'P0001';
    END IF;

    DELETE FROM public.providers WHERE id = p_provider_id;
    v_audit_action := 'PROVIDER_DELETED';
  END IF;

  -- 4. Audit Log Insertion
  BEGIN
    INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
    VALUES (
      v_actor_id,
      v_actor_email,
      v_audit_action,
      'providers',
      v_provider.id::text,
      jsonb_build_object(
        'command', p_command,
        'provider_code', v_provider.provider_code,
        'new_status', v_provider.status
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'AUDIT_FAILURE' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'provider', to_jsonb(v_provider)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_provider_admin_write(text, uuid, jsonb) TO authenticated;
