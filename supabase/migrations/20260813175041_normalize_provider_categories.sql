-- Normalize ownership and facility types in providers table
UPDATE public.providers
SET ownership = CASE 
    WHEN lower(trim(ownership)) IN ('government', 'govt', 'public') THEN 'Government'
    WHEN lower(trim(ownership)) IN ('private', 'prvate') THEN 'Private'
    ELSE 'Private'
  END,
  category = CASE
    WHEN lower(trim(category)) LIKE '%hospital%' THEN 'Hospital'
    WHEN lower(trim(category)) LIKE '%primary%' OR lower(trim(category)) LIKE '%phc%' THEN 'Primary Health Centre (PHC)'
    WHEN lower(trim(category)) LIKE '%clinic%' THEN 'Clinic'
    WHEN lower(trim(category)) LIKE '%diagnostic%' THEN 'Diagnostic Centre'
    WHEN lower(trim(category)) LIKE '%pharmacy%' THEN 'Pharmacy'
    ELSE 'Hospital'
  END;

-- Update nmis_dashboard_intelligence RPC to return normalized categories
CREATE OR REPLACE FUNCTION public.nmis_dashboard_intelligence(
  p_year integer DEFAULT NULL::integer, 
  p_month integer DEFAULT NULL::integer, 
  p_sector text DEFAULT NULL::text, 
  p_state text DEFAULT NULL::text, 
  p_lga text DEFAULT NULL::text, 
  p_facility_type text DEFAULT NULL::text, 
  p_ownership text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_result jsonb;
  v_total_providers bigint;
  v_active_providers bigint;
  v_inactive_providers bigint;
  v_pending_providers bigint;
  v_risk_providers bigint;
  
  v_total_enrollees bigint;
  v_formal_enrollees bigint;
  v_informal_enrollees bigint;
  v_principal_enrollees bigint;
  v_dependant_enrollees bigint;
  
  v_total_expenditure numeric;
  v_claims_exp numeric;
  v_capitation_exp numeric;
  v_ffs_exp numeric;
  
  v_matched_financial bigint;
  v_unmatched_providers bigint;
  v_network_pepm numeric;
  v_reporting_period text;
  v_last_updated text;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  -- 1. Provider Aggregates
  SELECT
    count(*),
    count(*) FILTER (WHERE lower(trim(status)) = 'active'),
    count(*) FILTER (WHERE lower(trim(status)) != 'active'),
    count(*) FILTER (WHERE lower(trim(status)) = 'pending'),
    count(*) FILTER (WHERE lower(trim(status)) IN ('suspended', 'blacklisted', 'expired'))
  INTO v_total_providers, v_active_providers, v_inactive_providers, v_pending_providers, v_risk_providers
  FROM public.providers
  WHERE (p_state IS NULL OR state = p_state)
    AND (p_lga IS NULL OR lga = p_lga)
    AND (p_facility_type IS NULL OR category = p_facility_type)
    AND (p_ownership IS NULL OR ownership = p_ownership);

  -- 2. Population Aggregates
  SELECT
    count(*),
    count(*) FILTER (WHERE lower(trim(sector)) = 'formal'),
    count(*) FILTER (WHERE lower(trim(sector)) = 'informal'),
    count(*) FILTER (WHERE lower(trim(category)) = 'principal'),
    count(*) FILTER (WHERE lower(trim(category)) = 'dependant')
  INTO v_total_enrollees, v_formal_enrollees, v_informal_enrollees, v_principal_enrollees, v_dependant_enrollees
  FROM public.enrollees e
  WHERE (p_year IS NULL OR reporting_year = p_year)
    AND (p_month IS NULL OR reporting_month = p_month)
    AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
    AND (p_state IS NULL OR state = p_state)
    AND (p_lga IS NULL OR lga = p_lga);

  -- 3. Financial Aggregates
  SELECT
    coalesce(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)), 0),
    coalesce(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'claims'), 0),
    coalesce(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'capitation'), 0),
    coalesce(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'ffs'), 0),
    count(*) FILTER (WHERE provider_id IS NOT NULL)
  INTO v_total_expenditure, v_claims_exp, v_capitation_exp, v_ffs_exp, v_matched_financial
  FROM public.financial_records f
  WHERE (p_year IS NULL OR reporting_year = p_year)
    AND (p_month IS NULL OR reporting_month = p_month)
    AND (p_state IS NULL OR state = p_state)
    AND (p_lga IS NULL OR lga = p_lga);

  v_network_pepm := CASE WHEN v_total_enrollees > 0 THEN v_total_expenditure / v_total_enrollees ELSE 0 END;
  v_reporting_period := COALESCE(p_year::text || '-' || LPAD(p_month::text, 2, '0'), 'All periods');
  
  SELECT max(uploaded_at)::text INTO v_last_updated FROM public.import_batches;
  v_last_updated := COALESCE(v_last_updated, now()::text);

  -- Build JSON
  v_result := jsonb_build_object(
    'reportingPeriod', v_reporting_period,
    'lastUpdatedAt', v_last_updated,
    'provider', jsonb_build_object(
      'total', v_total_providers,
      'active', v_active_providers,
      'inactive', v_inactive_providers,
      'pending', v_pending_providers,
      'risk', v_risk_providers,
      'byLga', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT lga as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY lga ORDER BY value DESC
        ) d
      ), '[]'::jsonb),
      'byFacilityType', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT category as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY category ORDER BY value DESC
        ) d
      ), '[]'::jsonb),
      'byOwnership', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT ownership as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY ownership ORDER BY value DESC
        ) d
      ), '[]'::jsonb),
      'byLifecycle', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT status as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY status ORDER BY value DESC
        ) d
      ), '[]'::jsonb)
    ),
    'population', jsonb_build_object(
      'total', v_total_enrollees,
      'formal', v_formal_enrollees,
      'informal', v_informal_enrollees,
      'principal', v_principal_enrollees,
      'dependant', v_dependant_enrollees,
      'bySector', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT sector as name, count(*) as value FROM public.enrollees GROUP BY sector
        ) d
      ), '[]'::jsonb),
      'byCategory', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT category as name, count(*) as value FROM public.enrollees GROUP BY category
        ) d
      ), '[]'::jsonb),
      'byLga', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT lga as name, count(*) as value FROM public.enrollees GROUP BY lga ORDER BY value DESC
        ) d
      ), '[]'::jsonb),
      'topFacilities', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT provider_name as name, count(*) as value FROM public.enrollees GROUP BY provider_name ORDER BY value DESC LIMIT 10
        ) d
      ), '[]'::jsonb),
      'monthlyTrend', '[]'::jsonb,
      'growthPercentage', 0
    ),
    'financial', jsonb_build_object(
      'totalExpenditure', v_total_expenditure,
      'claims', v_claims_exp,
      'capitation', v_capitation_exp,
      'ffs', v_ffs_exp,
      'byFundingType', jsonb_build_array(
        jsonb_build_object('name', 'claims', 'value', v_claims_exp),
        jsonb_build_object('name', 'capitation', 'value', v_capitation_exp),
        jsonb_build_object('name', 'ffs', 'value', v_ffs_exp)
      ),
      'monthlyTrend', '[]'::jsonb,
      'topLgas', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT lga as name, sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) as value FROM public.financial_records GROUP BY lga ORDER BY value DESC LIMIT 10
        ) d
      ), '[]'::jsonb),
      'topProviders', COALESCE((
        SELECT jsonb_agg(d) FROM (
          SELECT provider_name as name, sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) as value FROM public.financial_records GROUP BY provider_name ORDER BY value DESC LIMIT 10
        ) d
      ), '[]'::jsonb),
      'growthPercentage', 0
    ),
    'efficiency', jsonb_build_object(
      'networkPepm', v_network_pepm,
      'bySector', '[]'::jsonb,
      'byLga', '[]'::jsonb,
      'byProvider', '[]'::jsonb,
      'trend', '[]'::jsonb
    ),
    'managementAttention', '[]'::jsonb,
    'recentActivity', COALESCE((
      SELECT jsonb_agg(d) FROM (
        SELECT id, uploaded_at as timestamp, 'Dataset imported' as title, file_name as description, status as badge, '/financial/history' as href
        FROM public.import_batches ORDER BY uploaded_at DESC LIMIT 5
      ) d
    ), '[]'::jsonb),
    'filterOptions', jsonb_build_object(
      'years', COALESCE((SELECT jsonb_agg(DISTINCT reporting_year ORDER BY reporting_year DESC) FROM public.financial_records WHERE reporting_year IS NOT NULL), jsonb_build_array(2026)),
      'months', COALESCE((SELECT jsonb_agg(DISTINCT reporting_month ORDER BY reporting_month ASC) FROM public.financial_records WHERE reporting_month IS NOT NULL), jsonb_build_array(1,2,3,4,5,6,7,8,9,10,11,12)),
      'states', jsonb_build_array('Ondo'),
      'lgas', COALESCE((SELECT jsonb_agg(DISTINCT lga ORDER BY lga ASC) FROM public.providers WHERE lga IS NOT NULL), '[]'::jsonb),
      'facilityTypes', COALESCE((SELECT jsonb_agg(DISTINCT category ORDER BY category ASC) FROM public.providers WHERE category IS NOT NULL), '[]'::jsonb),
      'ownerships', COALESCE((SELECT jsonb_agg(DISTINCT ownership ORDER BY ownership ASC) FROM public.providers WHERE ownership IS NOT NULL), '[]'::jsonb)
    ),
    'matchedFinancialRecords', v_matched_financial,
    'unmatchedProviderCount', 0
  );

  RETURN v_result;
END;
$function$;
