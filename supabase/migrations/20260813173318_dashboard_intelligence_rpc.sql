-- Implement secure dashboard intelligence RPC
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
  v_pending_providers bigint;
  v_risk_providers bigint;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  -- Provider Aggregates
  SELECT
    count(*),
    count(*) FILTER (WHERE lower(trim(status)) = 'active'),
    count(*) FILTER (WHERE lower(trim(status)) = 'pending'),
    count(*) FILTER (WHERE lower(trim(status)) IN ('suspended', 'blacklisted', 'expired'))
  INTO v_total_providers, v_active_providers, v_pending_providers, v_risk_providers
  FROM public.providers
  WHERE (p_state IS NULL OR state = p_state)
    AND (p_lga IS NULL OR lga = p_lga)
    AND (p_facility_type IS NULL OR category = p_facility_type)
    AND (p_ownership IS NULL OR ownership = p_ownership);

  -- Build final JSON result
  v_result := jsonb_build_object(
    'reportingPeriod', COALESCE(p_year::text || '-' || LPAD(p_month::text, 2, '0'), 'All periods'),
    'lastUpdatedAt', now(),
    'provider', jsonb_build_object(
      'total', v_total_providers,
      'active', v_active_providers,
      'inactive', v_total_providers - v_active_providers,
      'pending', v_pending_providers,
      'risk', v_risk_providers,
      'byLga', (
        SELECT jsonb_agg(d) FROM (
          SELECT lga as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY lga ORDER BY value DESC
        ) d
      ),
      'byFacilityType', (
        SELECT jsonb_agg(d) FROM (
          SELECT category as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY category ORDER BY value DESC
        ) d
      ),
      'byOwnership', (
        SELECT jsonb_agg(d) FROM (
          SELECT ownership as name, count(*) as value 
          FROM public.providers 
          WHERE (p_state IS NULL OR state = p_state)
            AND (p_lga IS NULL OR lga = p_lga)
            AND (p_facility_type IS NULL OR category = p_facility_type)
            AND (p_ownership IS NULL OR ownership = p_ownership)
          GROUP BY ownership ORDER BY value DESC
        ) d
      )
    ),
    'population', jsonb_build_object(
      'total', 0,
      'formal', 0,
      'informal', 0,
      'principal', 0,
      'dependant', 0
    ),
    'financial', jsonb_build_object(
      'totalExpenditure', 0,
      'claims', 0,
      'capitation', 0,
      'ffs', 0
    ),
    'efficiency', jsonb_build_object(
      'networkPepm', 0
    ),
    'recentActivity', '[]'::jsonb
  );

  RETURN v_result;
END;
$function$;
