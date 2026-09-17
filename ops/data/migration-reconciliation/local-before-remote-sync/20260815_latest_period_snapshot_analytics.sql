-- NMIS monthly snapshot analytics
-- Forward-only: replaces read/aggregate functions and adds read-performance indexes.
-- It does not alter enrollee rows, fingerprints, IDs, providers, or reporting periods.

CREATE INDEX IF NOT EXISTS idx_enrollees_reporting_period_provider
  ON public.enrollees (reporting_year, reporting_month, provider_id);

CREATE INDEX IF NOT EXISTS idx_financial_records_reporting_period_provider
  ON public.financial_records (reporting_year, reporting_month, provider_id);

CREATE OR REPLACE FUNCTION public.nmis_enrollee_register_aggregates(
  p_search text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_senatorial_district text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL
)
RETURNS TABLE(
  total_count bigint,
  formal_count bigint,
  informal_count bigint,
  principal_count bigint,
  dependant_count bigint,
  male_count bigint,
  female_count bigint,
  provider_count bigint,
  lga_count bigint,
  senatorial_district_count bigint,
  capitation_rate numeric,
  capitation_expenditure numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_year integer := p_year;
  v_month integer := p_month;
  v_capitation_rate numeric := 750;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'network-officer', 'finance', 'claims']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  -- With no explicit period, population overview means the latest completed snapshot,
  -- not the sum of every historical monthly snapshot.
  IF p_period IS NULL AND p_year IS NULL AND p_month IS NULL THEN
    SELECT e.reporting_year, e.reporting_month
    INTO v_year, v_month
    FROM public.enrollees e
    WHERE e.reporting_year IS NOT NULL
      AND e.reporting_month BETWEEN 1 AND 12
    ORDER BY e.reporting_year DESC, e.reporting_month DESC
    LIMIT 1;
  END IF;

  SELECT COALESCE(rate, 750)
  INTO v_capitation_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee'
    AND active = true;

  RETURN QUERY
  WITH filtered_enrollees AS (
    SELECT e.*
    FROM public.enrollees e
    WHERE (p_search IS NULL OR lower(concat_ws(' ', e.policy_number, e.first_name, e.last_name, e.provider_name, e.provider_code, e.lga, e.state, e.senatorial_district)) LIKE '%' || lower(trim(p_search)) || '%')
      AND (p_sector IS NULL OR e.sector = p_sector)
      AND (p_category IS NULL OR e.category = p_category)
      AND (p_gender IS NULL OR e.gender = p_gender)
      AND (p_state IS NULL OR e.state = p_state)
      AND (p_lga IS NULL OR e.lga = p_lga)
      AND (p_senatorial_district IS NULL OR e.senatorial_district = p_senatorial_district)
      AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
      AND (p_period IS NULL OR e.period = p_period)
      AND (p_period IS NOT NULL OR v_year IS NULL OR e.reporting_year = v_year)
      AND (p_period IS NOT NULL OR v_month IS NULL OR e.reporting_month = v_month)
  )
  SELECT
    count(*)::bigint,
    count(*) FILTER (WHERE lower(trim(e.sector)) = 'formal')::bigint,
    count(*) FILTER (WHERE lower(trim(e.sector)) = 'informal')::bigint,
    count(*) FILTER (WHERE lower(trim(e.category)) = 'principal')::bigint,
    count(*) FILTER (WHERE lower(trim(e.category)) = 'dependant')::bigint,
    count(*) FILTER (WHERE lower(trim(e.gender)) = 'male')::bigint,
    count(*) FILTER (WHERE lower(trim(e.gender)) = 'female')::bigint,
    count(DISTINCT e.provider_id)::bigint,
    count(DISTINCT e.lga)::bigint,
    count(DISTINCT e.senatorial_district)::bigint,
    v_capitation_rate,
    (count(*) * v_capitation_rate)::numeric
  FROM filtered_enrollees e;
END;
$function$;

CREATE OR REPLACE FUNCTION public.nmis_dashboard_intelligence(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_facility_type text DEFAULT NULL,
  p_ownership text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_result jsonb;
  v_effective_year integer := p_year;
  v_effective_month integer := p_month;
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
  v_network_pepm numeric;
  v_reporting_period text;
  v_last_updated text;
  v_capitation_rate numeric := 750;
  v_capitation_liability numeric;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector', 'finance', 'claims', 'customer-service', 'provider']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  -- No explicit year/month means current population: the newest available monthly
  -- snapshot across enrolment and financial data. Historical trends remain separate.
  IF p_year IS NULL AND p_month IS NULL THEN
    SELECT period_year, period_month
    INTO v_effective_year, v_effective_month
    FROM (
      SELECT reporting_year AS period_year, reporting_month AS period_month
      FROM public.enrollees
      WHERE reporting_year IS NOT NULL AND reporting_month BETWEEN 1 AND 12
      UNION
      SELECT reporting_year AS period_year, reporting_month AS period_month
      FROM public.financial_records
      WHERE reporting_year IS NOT NULL AND reporting_month BETWEEN 1 AND 12
    ) periods
    ORDER BY period_year DESC, period_month DESC
    LIMIT 1;
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE lower(trim(status)) = 'active'),
         count(*) FILTER (WHERE lower(trim(status)) != 'active'),
         count(*) FILTER (WHERE lower(trim(status)) = 'pending'),
         count(*) FILTER (WHERE lower(trim(status)) IN ('suspended', 'blacklisted', 'expired'))
  INTO v_total_providers, v_active_providers, v_inactive_providers, v_pending_providers, v_risk_providers
  FROM public.providers
  WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
    AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
    AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)));

  SELECT count(*),
         count(*) FILTER (WHERE lower(trim(sector)) = 'formal'),
         count(*) FILTER (WHERE lower(trim(sector)) = 'informal'),
         count(*) FILTER (WHERE lower(trim(category)) = 'principal'),
         count(*) FILTER (WHERE lower(trim(category)) = 'dependant')
  INTO v_total_enrollees, v_formal_enrollees, v_informal_enrollees, v_principal_enrollees, v_dependant_enrollees
  FROM public.enrollees e
  WHERE (v_effective_year IS NULL OR e.reporting_year = v_effective_year)
    AND (v_effective_month IS NULL OR e.reporting_month = v_effective_month)
    AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
    AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)));

  SELECT COALESCE(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)), 0),
         COALESCE(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'claims'), 0),
         COALESCE(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'capitation'), 0),
         COALESCE(sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) FILTER (WHERE lower(trim(data_type)) = 'ffs'), 0),
         count(*) FILTER (WHERE provider_id IS NOT NULL)
  INTO v_total_expenditure, v_claims_exp, v_capitation_exp, v_ffs_exp, v_matched_financial
  FROM public.financial_records f
  WHERE (v_effective_year IS NULL OR f.reporting_year = v_effective_year)
    AND (v_effective_month IS NULL OR f.reporting_month = v_effective_month)
    AND (p_state IS NULL OR lower(trim(f.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(f.lga)) = lower(trim(p_lga)));

  SELECT COALESCE(rate, 750)
  INTO v_capitation_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee'
    AND active = true;

  v_capitation_liability := v_total_enrollees * v_capitation_rate;
  v_network_pepm := CASE WHEN v_total_enrollees > 0 THEN (v_claims_exp + v_ffs_exp + v_capitation_liability) / v_total_enrollees ELSE 0 END;

  IF p_year IS NOT NULL AND p_month IS NOT NULL THEN
    v_reporting_period := p_year::text || '-' || LPAD(p_month::text, 2, '0');
  ELSIF p_year IS NOT NULL THEN
    v_reporting_period := p_year::text;
  ELSIF p_month IS NOT NULL THEN
    v_reporting_period := 'Month ' || p_month::text;
  ELSIF v_effective_year IS NOT NULL AND v_effective_month IS NOT NULL THEN
    v_reporting_period := v_effective_year::text || '-' || LPAD(v_effective_month::text, 2, '0');
  ELSE
    v_reporting_period := 'No reporting period';
  END IF;

  SELECT max(uploaded_at)::text INTO v_last_updated FROM public.import_batches;
  v_last_updated := COALESCE(v_last_updated, now()::text);

  v_result := jsonb_build_object(
    'reportingPeriod', v_reporting_period,
    'lastUpdatedAt', v_last_updated,
    'provider', jsonb_build_object(
      'total', v_total_providers,
      'active', v_active_providers,
      'inactive', v_inactive_providers,
      'pending', v_pending_providers,
      'risk', v_risk_providers,
      'byLga', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT lga AS name, count(*) AS value FROM public.providers
        WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
          AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
          AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)))
        GROUP BY lga ORDER BY value DESC, lga ASC
      ) d), '[]'::jsonb),
      'bySenatorialDistrict', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT senatorial_district AS name, count(*) AS value FROM public.providers
        WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
          AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
          AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)))
        GROUP BY senatorial_district ORDER BY value DESC, senatorial_district ASC
      ) d), '[]'::jsonb),
      'byFacilityType', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT category AS name, count(*) AS value FROM public.providers
        WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
          AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
          AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)))
        GROUP BY category ORDER BY value DESC, category ASC
      ) d), '[]'::jsonb),
      'byOwnership', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT ownership AS name, count(*) AS value FROM public.providers
        WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
          AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
          AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)))
        GROUP BY ownership ORDER BY value DESC, ownership ASC
      ) d), '[]'::jsonb),
      'byLifecycle', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT status AS name, count(*) AS value FROM public.providers
        WHERE (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
          AND (p_facility_type IS NULL OR lower(trim(category)) = lower(trim(p_facility_type)))
          AND (p_ownership IS NULL OR lower(trim(ownership)) = lower(trim(p_ownership)))
        GROUP BY status ORDER BY value DESC, status ASC
      ) d), '[]'::jsonb)
    ),
    'population', jsonb_build_object(
      'total', v_total_enrollees,
      'formal', v_formal_enrollees,
      'informal', v_informal_enrollees,
      'principal', v_principal_enrollees,
      'dependant', v_dependant_enrollees,
      'capitationRate', v_capitation_rate,
      'capitationExpenditure', v_capitation_liability,
      'bySector', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT sector AS name, count(*) AS value FROM public.enrollees
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY sector ORDER BY value DESC
      ) d), '[]'::jsonb),
      'byCategory', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT category AS name, count(*) AS value FROM public.enrollees
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY category ORDER BY value DESC
      ) d), '[]'::jsonb),
      'byLga', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT lga AS name, count(*) AS value FROM public.enrollees
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY lga ORDER BY value DESC, lga ASC
      ) d), '[]'::jsonb),
      'bySenatorialDistrict', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT senatorial_district AS name, count(*) AS value FROM public.enrollees
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY senatorial_district ORDER BY value DESC, senatorial_district ASC
      ) d), '[]'::jsonb),
      'topFacilities', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT provider_name AS name, count(*) AS value FROM public.enrollees
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(sector)) = lower(trim(p_sector)))
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY provider_name ORDER BY value DESC, provider_name ASC LIMIT 10
      ) d), '[]'::jsonb),
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
      'topLgas', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT lga AS name, sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) AS value
        FROM public.financial_records
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY lga ORDER BY value DESC, lga ASC LIMIT 10
      ) d), '[]'::jsonb),
      'topProviders', COALESCE((SELECT jsonb_agg(d) FROM (
        SELECT provider_name AS name, sum(coalesce(net_amount_paid, amount_paid, amount_approved, amount_claimed, amount_submitted, 0)) AS value
        FROM public.financial_records
        WHERE (v_effective_year IS NULL OR reporting_year = v_effective_year)
          AND (v_effective_month IS NULL OR reporting_month = v_effective_month)
          AND (p_state IS NULL OR lower(trim(state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(lga)) = lower(trim(p_lga)))
        GROUP BY provider_name ORDER BY value DESC, provider_name ASC LIMIT 10
      ) d), '[]'::jsonb),
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
    'recentActivity', COALESCE((SELECT jsonb_agg(d) FROM (
      SELECT id, uploaded_at AS timestamp, 'Dataset imported' AS title, file_name AS description, status AS badge, '/financial/history' AS href
      FROM public.import_batches ORDER BY uploaded_at DESC LIMIT 5
    ) d), '[]'::jsonb),
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
