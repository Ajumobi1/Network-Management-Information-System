-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 15: Secure Import Commit and History Contracts.
--
-- This migration implements the secure RPCs required for the Data Upload Centre
-- to commit validated datasets (Financial, Enrolment, and Provider Directory)
-- to the authoritative tables with full audit attribution.

BEGIN;

-- 1. Check for duplicate batches
CREATE OR REPLACE FUNCTION public.nmis_check_duplicate_batch(
  p_period text,
  p_data_type text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_batch record;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  SELECT * INTO v_batch
  FROM public.import_batches
  WHERE period_covered = p_period
    AND data_type = p_data_type
    AND status IN ('imported', 'partially-imported')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_batch.id,
    'fileName', v_batch.file_name,
    'dataType', v_batch.data_type,
    'periodCovered', v_batch.period_covered
  );
END;
$$;

-- 2. List import batches
CREATE OR REPLACE FUNCTION public.nmis_list_import_batches()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'fileName', b.file_name,
      'dataType', b.data_type,
      'uploadedBy', b.uploaded_by,
      'uploadedAt', b.uploaded_at,
      'totalRows', b.total_rows,
      'importedRows', b.imported_rows,
      'warningRows', b.warning_rows,
      'errorRows', b.error_rows,
      'duplicateRows', b.duplicate_rows,
      'unmatchedProviders', b.unmatched_providers,
      'status', b.status,
      'periodCovered', b.period_covered,
      'metadata', b.metadata
    ) ORDER BY b.uploaded_at DESC
  ) INTO v_result
  FROM public.import_batches b;

  RETURN coalesce(v_result, '[]'::jsonb);
END;
$$;

-- 3. Get specific import batch
CREATE OR REPLACE FUNCTION public.nmis_get_import_batch(p_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_batch record;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  SELECT * INTO v_batch FROM public.import_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_batch.id,
    'fileName', v_batch.file_name,
    'dataType', v_batch.data_type,
    'uploadedBy', v_batch.uploaded_by,
    'uploadedAt', v_batch.uploaded_at,
    'totalRows', v_batch.total_rows,
    'importedRows', v_batch.imported_rows,
    'warningRows', v_batch.warning_rows,
    'errorRows', v_batch.error_rows,
    'duplicateRows', v_batch.duplicate_rows,
    'unmatchedProviders', v_batch.unmatched_providers,
    'status', v_batch.status,
    'periodCovered', v_batch.period_covered,
    'metadata', v_batch.metadata
  );
END;
$$;

-- 4. Commit import batch (The core transaction)
CREATE OR REPLACE FUNCTION public.nmis_commit_import_batch(
  p_file_name text,
  p_data_type text,
  p_period_covered text,
  p_total_rows integer,
  p_records jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_batch_id uuid;
  v_user_id uuid;
  v_user_email text;
  v_record jsonb;
  v_imported_count integer := 0;
  v_duplicate_count integer := 0;
  v_error_count integer := 0;
  v_unmatched_count integer := 0;
  v_provider_id uuid;
  v_rejected_rows jsonb := '[]'::jsonb;
BEGIN
  -- 1. Authorization
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  -- 2. Create Batch Record
  INSERT INTO public.import_batches (
    file_name, data_type, period_covered, total_rows, uploaded_by, status, metadata
  ) VALUES (
    p_file_name, p_data_type, p_period_covered, p_total_rows, coalesce(v_user_email, 'System'), 'processing', p_metadata
  ) RETURNING id INTO v_batch_id;

  -- 3. Process Records based on data type
  FOR v_record IN SELECT r.value FROM jsonb_array_elements(p_records) AS r(value) ORDER BY (r.value->>'providerName') ASC
  LOOP
    BEGIN
      -- Handle Provider Directory Import
      IF p_data_type = 'provider-network' THEN
        -- Smart mapping for ownership/category if they are mixed
        DECLARE
          v_ownership text;
          v_category text;
          v_raw_cat text;
          v_next_code integer;
        BEGIN
          v_raw_cat := upper(trim(coalesce(v_record->>'facilityType', v_record->>'ownership', '')));
          
          IF v_raw_cat IN ('PRVATE', 'PRIVATE') THEN
            v_ownership := 'Private';
            v_category := 'Hospital';
          ELSIF v_raw_cat IN ('GOVERNMENT', 'PUBLIC') THEN
            v_ownership := 'Government';
            v_category := 'Hospital';
          ELSE
            v_ownership := coalesce(v_record->>'ownership', 'Private');
            v_category := coalesce(v_record->>'facilityType', 'Hospital');
          END IF;

          -- Check if provider already exists by name or ID
          v_provider_id := (v_record->>'id')::uuid;
          IF v_provider_id IS NULL THEN
            SELECT id INTO v_provider_id FROM public.providers WHERE lower(trim(provider_name)) = lower(trim(v_record->>'providerName'));
          END IF;
          
          IF v_provider_id IS NOT NULL THEN
            -- UPDATE existing provider (LGA Fix / Data Integrity)
            UPDATE public.providers
            SET lga = coalesce(v_record->>'lga', lga),
                ownership = v_ownership,
                category = v_category,
                subcategory = coalesce(v_record->>'subcategory', subcategory),
                state = 'Ondo',
                updated_at = now()
            WHERE id = v_provider_id;

            v_imported_count := v_imported_count + 1;
            v_duplicate_count := v_duplicate_count + 1; -- Track as "updated existing"
          ELSE
            -- Generate stable internal code if not provided
            DECLARE
              v_stable_code text;
            BEGIN
              v_stable_code := coalesce(
                upper(trim(v_record->>'providerCode')), 
                'NMIS-FAC-' || upper(substring(gen_random_uuid()::text from 1 for 8))
              );

              INSERT INTO public.providers (
                provider_code, provider_name, category, subcategory, ownership, state, lga, address, status
              ) VALUES (
                v_stable_code,
                trim(v_record->>'providerName'),
                v_category,
                v_record->>'subcategory',
                v_ownership,
                'Ondo',
                coalesce(v_record->>'lga', 'Unknown'),
                v_record->>'address',
                'Active'
              );
              
              v_imported_count := v_imported_count + 1;
            END;
          END IF;
        END;

      -- Handle Financial Records (Claims, Capitation, FFS)
      ELSIF p_data_type IN ('claims', 'capitation', 'ffs') THEN
        v_provider_id := (v_record->>'providerId')::uuid;
        
        IF v_provider_id IS NULL THEN
          v_unmatched_count := v_unmatched_count + 1;
          CONTINUE;
        END IF;

        INSERT INTO public.financial_records (
          provider_id, provider_code, provider_name, facility_type, ownership, state, lga,
          reporting_year, reporting_month, period, data_type,
          amount_submitted, amount_approved, amount_paid, net_amount_paid,
          claims_category, claim_count, source_file, import_batch_id
        ) VALUES (
          v_provider_id,
          v_record->>'providerCode',
          v_record->>'providerName',
          v_record->>'facilityType',
          v_record->>'ownership',
          'Ondo',
          v_record->>'lga',
          (v_record->>'reportingYear')::integer,
          (v_record->>'reportingMonth')::integer,
          v_record->>'period',
          p_data_type,
          (v_record->>'amountSubmitted')::numeric,
          (v_record->>'amountApproved')::numeric,
          (v_record->>'amountPaid')::numeric,
          (v_record->>'netAmountPaid')::numeric,
          v_record->>'claimsCategory',
          (v_record->>'claimCount')::integer,
          p_file_name,
          v_batch_id
        );
        v_imported_count := v_imported_count + 1;

      -- Handle Enrolment Data
      ELSIF p_data_type = 'enrolment' THEN
        v_provider_id := (v_record->>'providerId')::uuid;
        
        INSERT INTO public.enrollees (
          policy_number, first_name, last_name, gender, date_of_birth,
          sector, category, state, lga, provider_id, provider_name,
          reporting_year, reporting_month, period, import_batch_id
        ) VALUES (
          upper(replace(v_record->>'policyNumber', ' ', '')),
          trim(v_record->>'firstName'),
          trim(v_record->>'lastName'),
          lower(trim(v_record->>'gender')),
          (v_record->>'dateOfBirth')::date,
          v_record->>'sector',
          v_record->>'category',
          'Ondo',
          v_record->>'lga',
          v_provider_id,
          v_record->>'providerName',
          (v_record->>'reportingYear')::integer,
          (v_record->>'reportingMonth')::integer,
          v_record->>'period',
          v_batch_id
        ) ON CONFLICT (policy_number, period) DO NOTHING;
        
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

  -- 4. Update Batch Final Status
  UPDATE public.import_batches
  SET status = 'imported',
      imported_rows = v_imported_count,
      duplicate_rows = v_duplicate_count,
      error_rows = v_error_count,
      unmatched_providers = v_unmatched_count,
      metadata = metadata || jsonb_build_object(
        'importedAt', now(),
        'rejectedRows', v_rejected_rows
      )
  WHERE id = v_batch_id;

  -- 5. Audit Trail
  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id, v_user_email, 'IMPORT_COMMITTED', 'import_batches', v_batch_id::text,
    jsonb_build_object('file_name', p_file_name, 'data_type', p_data_type, 'imported_rows', v_imported_count)
  );

  RETURN jsonb_build_object(
    'id', v_batch_id,
    'status', 'imported',
    'importedRows', v_imported_count,
    'duplicateRows', v_duplicate_count,
    'errorRows', v_error_count,
    'unmatchedProviders', v_unmatched_count
  );
END;
$$;

-- 5. Get persisted matches (Stub for now)
CREATE OR REPLACE FUNCTION public.nmis_get_persisted_matches()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;
  RETURN '{}'::jsonb;
END;
$$;

-- Grants
REVOKE ALL ON FUNCTION public.nmis_check_duplicate_batch(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_list_import_batches() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_import_batch(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_commit_import_batch(text, text, text, integer, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_get_persisted_matches() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_check_duplicate_batch(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_list_import_batches() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_import_batch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_commit_import_batch(text, text, text, integer, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_get_persisted_matches() TO authenticated;

COMMIT;
