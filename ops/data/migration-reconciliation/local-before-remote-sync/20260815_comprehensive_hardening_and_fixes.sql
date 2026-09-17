-- ============================================================================
-- NMIS Comprehensive Hardening & Functional Fixes Migration
-- Applied to production Supabase project on August 15, 2026
-- ============================================================================

-- 1. Fail-Closed Role Helper Hardening
CREATE OR REPLACE FUNCTION public.nmis_has_any_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  RETURN COALESCE(v_role = ANY(allowed_roles), false);
END;
$$;

-- 2. Provider Directory RPCs (Broadened authorized roles)
CREATE OR REPLACE FUNCTION public.nmis_list_provider_directory(
  p_search text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_ownership text DEFAULT NULL::text,
  p_status text DEFAULT NULL::text,
  p_contract_status text DEFAULT NULL::text,
  p_credential_status text DEFAULT NULL::text,
  p_inspection_status text DEFAULT NULL::text,
  p_capitation_status text DEFAULT NULL::text,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_sort text DEFAULT 'provider_name'::text
)
RETURNS TABLE(
  id uuid,
  provider_code text,
  provider_name text,
  category text,
  subcategory text,
  ownership text,
  state text,
  lga text,
  status text,
  contract_status text,
  credential_status text,
  inspection_status text,
  capitation_status text,
  inspection_rating numeric,
  last_inspection_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance', 'claims', 'customer-service', 'provider']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_page_size < 1 OR p_page_size > 1000 OR p_offset < 0 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  IF p_sort NOT IN ('provider_name', 'provider_code', 'state', 'lga', 'category', 'status') THEN
    RAISE EXCEPTION 'INVALID_SORT';
  END IF;

  RETURN QUERY
  SELECT 
    p.id, p.provider_code, p.provider_name, p.category, p.subcategory, 
    p.ownership, p.state, p.lga, p.status, p.contract_status, 
    p.credential_status, p.inspection_status, p.capitation_status, 
    p.inspection_rating, p.last_inspection_date
  FROM public.providers p
  WHERE (p_search IS NULL OR lower(concat_ws(' ', p.provider_code, p.provider_name, p.category, p.subcategory, p.ownership, p.state, p.lga)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_state IS NULL OR lower(trim(p.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(p.lga)) = lower(trim(p_lga)))
    AND (p_category IS NULL OR lower(trim(p.category)) = lower(trim(p_category)))
    AND (p_ownership IS NULL OR lower(trim(p.ownership)) = lower(trim(p_ownership)))
    AND (p_status IS NULL OR lower(trim(p.status)) = lower(trim(p_status)))
    AND (p_contract_status IS NULL OR lower(trim(p.contract_status)) = lower(trim(p_contract_status)))
    AND (p_credential_status IS NULL OR lower(trim(p.credential_status)) = lower(trim(p_credential_status)))
    AND (p_inspection_status IS NULL OR lower(trim(p.inspection_status)) = lower(trim(p_inspection_status)))
    AND (p_capitation_status IS NULL OR lower(trim(p.capitation_status)) = lower(trim(p_capitation_status)))
  ORDER BY 
    CASE WHEN p_sort = 'provider_name' THEN lower(p.provider_name) END,
    CASE WHEN p_sort = 'provider_code' THEN lower(p.provider_code) END,
    CASE WHEN p_sort = 'state' THEN lower(p.state) END,
    CASE WHEN p_sort = 'lga' THEN lower(p.lga) END,
    CASE WHEN p_sort = 'category' THEN lower(p.category) END,
    CASE WHEN p_sort = 'status' THEN lower(p.status) END,
    p.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

-- 3. Enrollee Register RPC (Includes age column and broadened roles)
CREATE OR REPLACE FUNCTION public.nmis_list_enrollee_register(
  p_search text DEFAULT NULL::text,
  p_sector text DEFAULT NULL::text,
  p_category text DEFAULT NULL::text,
  p_gender text DEFAULT NULL::text,
  p_state text DEFAULT NULL::text,
  p_lga text DEFAULT NULL::text,
  p_senatorial_district text DEFAULT NULL::text,
  p_provider_id text DEFAULT NULL::text,
  p_period text DEFAULT NULL::text,
  p_year integer DEFAULT NULL::integer,
  p_month integer DEFAULT NULL::integer,
  p_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 50,
  p_sort text DEFAULT 'policy_number'::text,
  p_sort_direction text DEFAULT 'asc'::text
)
RETURNS TABLE(
  id uuid,
  policy_number text,
  category text,
  sector text,
  first_name text,
  last_name text,
  gender text,
  age integer,
  phone_number text,
  provider_id uuid,
  provider_code text,
  provider_name text,
  facility_type text,
  ownership text,
  lga text,
  state text,
  senatorial_district text,
  reporting_year integer,
  reporting_month integer,
  period text,
  source_file text,
  import_batch_id uuid,
  source_row integer,
  record_status text,
  fingerprint text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance', 'claims', 'customer-service', 'provider']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_offset < 0 OR p_page_size < 1 OR p_page_size > 50000 THEN
    RAISE EXCEPTION 'INVALID_PAGINATION';
  END IF;

  RETURN QUERY
  SELECT 
    e.id, e.policy_number, e.category, e.sector, e.first_name, e.last_name, 
    e.gender, e.age, e.phone_number, e.provider_id, e.provider_code, e.provider_name, 
    e.facility_type, e.ownership, e.lga, e.state, e.senatorial_district, 
    e.reporting_year, e.reporting_month, e.period, e.source_file, e.import_batch_id, 
    e.source_row, e.record_status, e.fingerprint, e.created_at, e.updated_at, 
    count(*) OVER() as total_count
  FROM public.enrollees e
  WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
    AND (p_sector IS NULL OR lower(trim(e.sector)) = lower(trim(p_sector)))
    AND (p_category IS NULL OR lower(trim(e.category)) = lower(trim(p_category)))
    AND (p_gender IS NULL OR lower(trim(e.gender)) = lower(trim(p_gender)))
    AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
    AND (p_senatorial_district IS NULL OR lower(trim(e.senatorial_district)) = lower(trim(p_senatorial_district)))
    AND (p_provider_id IS NULL OR e.provider_id = (p_provider_id)::uuid)
    AND (p_period IS NULL OR e.period = p_period)
    AND (p_year IS NULL OR e.reporting_year = p_year)
    AND (p_month IS NULL OR e.reporting_month = p_month)
  ORDER BY 
    CASE WHEN p_sort = 'policy_number' AND lower(coalesce(p_sort_direction, 'asc')) = 'asc' THEN e.policy_number END ASC,
    CASE WHEN p_sort = 'policy_number' AND lower(coalesce(p_sort_direction, 'asc')) = 'desc' THEN e.policy_number END DESC,
    e.id
  LIMIT p_page_size OFFSET p_offset;
END;
$$;

-- 4. Safe Age UPSERT in Ingestion Import Append
CREATE OR REPLACE FUNCTION public.nmis_append_import_records(p_batch_id uuid, p_data_type text, p_records jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
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
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  FOR v_record IN SELECT r.value FROM jsonb_array_elements(p_records) AS r(value) LOOP
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

        SELECT provider_name, lga, state INTO v_auth_name, v_auth_lga, v_auth_state
        FROM public.providers WHERE id = v_provider_id;

        BEGIN
          v_age := (v_record->>'age')::integer;
        EXCEPTION WHEN OTHERS THEN
          v_age := NULL;
        END;

        INSERT INTO public.enrollees (
          policy_number, first_name, last_name, gender, age, date_of_birth,
          sector, category, state, lga, provider_id, provider_name,
          reporting_year, reporting_month, period, import_batch_id, fingerprint
        ) VALUES (
          upper(replace(v_record->>'policyNumber', ' ', '')),
          trim(v_record->>'firstName'),
          trim(v_record->>'lastName'),
          lower(trim(v_record->>'gender')),
          v_age,
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
        FROM public.providers WHERE id = v_provider_id;

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
  SET 
    imported_rows = imported_rows + v_imported_count,
    duplicate_rows = duplicate_rows + v_duplicate_count,
    error_rows = error_rows + v_error_count,
    unmatched_providers = unmatched_providers + v_unmatched_count,
    metadata = metadata || jsonb_build_object('rejectedRows', coalesce(metadata->'rejectedRows', '[]'::jsonb) || v_rejected_rows)
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'imported', v_imported_count,
    'duplicates', v_duplicate_count,
    'errors', v_error_count,
    'unmatched', v_unmatched_count
  );
END;
$$;
