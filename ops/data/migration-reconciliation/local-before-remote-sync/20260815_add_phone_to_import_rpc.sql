-- Preserve the existing secure enrolment import contract and add phone_number persistence.
-- Phone numbers are source values only; no inference or normalization is performed here.
CREATE OR REPLACE FUNCTION public.nmis_append_import_records(p_batch_id uuid, p_data_type text, p_records jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_record jsonb;
  v_imported_count integer := 0;
  v_duplicate_count integer := 0;
  v_error_count integer := 0;
  v_unmatched_count integer := 0;
  v_provider_id uuid;
  v_rejected_rows jsonb := '[]'::jsonb;
  v_auth_name text;
  v_auth_code text;
  v_auth_lga text;
  v_auth_state text;
  v_auth_ownership text;
  v_auth_category text;
  v_age integer;
  v_phone text;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  FOR v_record IN SELECT r.value FROM jsonb_array_elements(p_records) AS r(value)
  LOOP
    BEGIN
      IF p_data_type = 'enrolment' THEN
        BEGIN
          v_provider_id := (v_record->>'providerId')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_provider_id := NULL;
        END;

        IF v_provider_id IS NULL THEN
          v_unmatched_count := v_unmatched_count + 1;
          CONTINUE;
        END IF;

        SELECT provider_name, lga, state
        INTO v_auth_name, v_auth_lga, v_auth_state
        FROM public.providers
        WHERE id = v_provider_id;

        BEGIN
          v_age := (v_record->>'age')::integer;
        EXCEPTION WHEN OTHERS THEN
          v_age := NULL;
        END;

        v_phone := NULLIF(trim(v_record->>'phoneNumber'), '');

        INSERT INTO public.enrollees (
          policy_number,
          first_name,
          last_name,
          gender,
          age,
          phone_number,
          date_of_birth,
          sector,
          category,
          state,
          lga,
          provider_id,
          provider_name,
          reporting_year,
          reporting_month,
          period,
          import_batch_id,
          fingerprint
        ) VALUES (
          upper(replace(v_record->>'policyNumber', ' ', '')),
          trim(v_record->>'firstName'),
          trim(v_record->>'lastName'),
          lower(trim(v_record->>'gender')),
          v_age,
          v_phone,
          nullif(v_record->>'dateOfBirth', '')::date,
          v_record->>'sector',
          v_record->>'category',
          v_auth_state,
          v_auth_lga,
          v_provider_id,
          v_auth_name,
          (v_record->>'reportingYear')::integer,
          (v_record->>'reportingMonth')::integer,
          v_record->>'period',
          p_batch_id,
          v_record->>'fingerprint'
        )
        ON CONFLICT (fingerprint) DO UPDATE SET
          age = COALESCE(public.enrollees.age, EXCLUDED.age),
          phone_number = COALESCE(public.enrollees.phone_number, EXCLUDED.phone_number),
          updated_at = NOW();

        IF FOUND THEN
          v_imported_count := v_imported_count + 1;
        ELSE
          v_duplicate_count := v_duplicate_count + 1;
        END IF;

      ELSIF p_data_type IN ('claims', 'capitation', 'ffs') THEN
        BEGIN
          v_provider_id := (v_record->>'providerId')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_provider_id := NULL;
        END;

        IF v_provider_id IS NULL THEN
          v_unmatched_count := v_unmatched_count + 1;
          CONTINUE;
        END IF;

        SELECT provider_name, provider_code, lga, state, ownership, category
        INTO v_auth_name, v_auth_code, v_auth_lga, v_auth_state, v_auth_ownership, v_auth_category
        FROM public.providers
        WHERE id = v_provider_id;

        INSERT INTO public.financial_records (
          provider_id, provider_code, provider_name, facility_type, ownership,
          state, lga, reporting_year, reporting_month, period, data_type,
          amount_submitted, amount_approved, amount_paid, net_amount_paid,
          claims_category, claim_count, source_file, import_batch_id, fingerprint
        ) VALUES (
          v_provider_id, v_auth_code, v_auth_name, v_auth_category, v_auth_ownership,
          v_auth_state, v_auth_lga, (v_record->>'reportingYear')::integer,
          (v_record->>'reportingMonth')::integer, v_record->>'period', p_data_type,
          (v_record->>'amountSubmitted')::numeric, (v_record->>'amountApproved')::numeric,
          (v_record->>'amountPaid')::numeric, (v_record->>'netAmountPaid')::numeric,
          v_record->>'claimsCategory', (v_record->>'claimCount')::integer,
          v_record->>'sourceFile', p_batch_id, v_record->>'fingerprint'
        )
        ON CONFLICT (fingerprint) DO NOTHING;

        IF FOUND THEN
          v_imported_count := v_imported_count + 1;
        ELSE
          v_duplicate_count := v_duplicate_count + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_rejected_rows := v_rejected_rows || jsonb_build_object(
        'row', v_record->>'sourceRow',
        'name', v_record->>'providerName',
        'reason', SQLERRM
      );
    END;
  END LOOP;

  UPDATE public.import_batches
  SET imported_rows = imported_rows + v_imported_count,
      duplicate_rows = duplicate_rows + v_duplicate_count,
      error_rows = error_rows + v_error_count,
      unmatched_providers = unmatched_providers + v_unmatched_count,
      metadata = metadata || jsonb_build_object(
        'rejectedRows', coalesce(metadata->'rejectedRows', '[]'::jsonb) || v_rejected_rows
      )
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'imported', v_imported_count,
    'duplicates', v_duplicate_count,
    'errors', v_error_count,
    'unmatched', v_unmatched_count
  );
END;
$function$;
