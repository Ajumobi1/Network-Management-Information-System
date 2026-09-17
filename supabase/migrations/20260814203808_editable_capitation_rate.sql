-- Editable capitation fee configuration and aggregate-only calculation.
-- Forward-only. No business data is changed and direct browser access remains denied.

CREATE TABLE IF NOT EXISTS public.nmis_system_settings (
  setting_key text PRIMARY KEY,
  rate numeric(14, 2) NOT NULL,
  description text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.nmis_system_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nmis_system_settings FROM PUBLIC;
REVOKE ALL ON TABLE public.nmis_system_settings FROM anon;
REVOKE ALL ON TABLE public.nmis_system_settings FROM authenticated;

INSERT INTO public.nmis_system_settings (setting_key, rate, description)
VALUES ('capitation_fee_per_enrollee', 750.00, 'Monthly capitation payment per active enrollee in Nigerian Naira')
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.nmis_get_capitation_settings()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_setting public.nmis_system_settings%ROWTYPE;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  SELECT * INTO v_setting
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee'
    AND active = true;

  RETURN jsonb_build_object(
    'settingKey', COALESCE(v_setting.setting_key, 'capitation_fee_per_enrollee'),
    'rate', COALESCE(v_setting.rate, 750),
    'description', COALESCE(v_setting.description, 'Monthly capitation payment per active enrollee in Nigerian Naira'),
    'updatedAt', v_setting.updated_at,
    'updatedBy', v_setting.updated_by
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_update_capitation_rate(p_rate numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_old_rate numeric;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'head-of-network', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  IF p_rate IS NULL OR p_rate < 0 OR p_rate > 1000000 THEN
    RAISE EXCEPTION 'INVALID_CAPITATION_RATE';
  END IF;

  SELECT rate INTO v_old_rate
  FROM public.nmis_system_settings
  WHERE setting_key = 'capitation_fee_per_enrollee'
  FOR UPDATE;

  INSERT INTO public.nmis_system_settings (setting_key, rate, description, active, updated_at, updated_by)
  VALUES ('capitation_fee_per_enrollee', round(p_rate, 2), 'Monthly capitation payment per active enrollee in Nigerian Naira', true, now(), v_actor)
  ON CONFLICT (setting_key) DO UPDATE SET
    rate = EXCLUDED.rate,
    active = true,
    updated_at = now(),
    updated_by = v_actor;

  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_actor,
    auth.jwt() ->> 'email',
    'UPDATE',
    'nmis_system_settings',
    'capitation_fee_per_enrollee',
    jsonb_build_object('setting', 'capitation_fee_per_enrollee', 'old_rate', v_old_rate, 'new_rate', round(p_rate, 2))
  );

  RETURN public.nmis_get_capitation_settings();
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_get_capitation_settings() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_update_capitation_rate(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_get_capitation_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_update_capitation_rate(numeric) TO authenticated;

-- NMIS Population Overview aggregate contract
-- Non-destructive: creates/replaces an aggregate-only SECURITY DEFINER RPC.
-- No direct browser access to protected tables is introduced.

CREATE OR REPLACE FUNCTION public.nmis_population_analytics(
  p_year integer DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_period text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_total bigint;
  v_formal bigint;
  v_informal bigint;
  v_principal bigint;
  v_dependant bigint;
  v_male bigint;
  v_female bigint;
  v_provider_count bigint;
  v_lga_count bigint;
  v_district_count bigint;
  v_financial_expenditure numeric := 0;
  v_financial_record_count bigint := 0;
  v_pepm numeric := 0;
  v_capitation_rate numeric := 750;
  v_capitation_expenditure numeric := 0;
  v_period text;
BEGIN
  IF NOT public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'finance']) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED';
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE lower(trim(e.sector)) = 'formal'),
    count(*) FILTER (WHERE lower(trim(e.sector)) = 'informal'),
    count(*) FILTER (WHERE lower(trim(e.category)) = 'principal'),
    count(*) FILTER (WHERE lower(trim(e.category)) = 'dependant'),
    count(*) FILTER (WHERE lower(trim(e.gender)) = 'male'),
    count(*) FILTER (WHERE lower(trim(e.gender)) = 'female'),
    count(DISTINCT COALESCE(e.provider_id::text, lower(trim(e.provider_name)))),
    count(DISTINCT NULLIF(lower(trim(e.lga)), '')),
    count(DISTINCT NULLIF(lower(trim(COALESCE(e.senatorial_district, 'Unknown'))), ''))
  INTO v_total, v_formal, v_informal, v_principal, v_dependant, v_male, v_female,
       v_provider_count, v_lga_count, v_district_count
  FROM public.enrollees e
  WHERE (p_year IS NULL OR e.reporting_year = p_year)
    AND (p_month IS NULL OR e.reporting_month = p_month)
    AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
    AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
    AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
    AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id);

  SELECT
    COALESCE(sum(COALESCE(f.net_amount_paid, f.amount_paid, f.amount_approved, f.amount_claimed, f.amount_submitted, 0)), 0),
    count(*)
  INTO v_financial_expenditure, v_financial_record_count
  FROM public.financial_records f
  WHERE (p_year IS NULL OR f.reporting_year = p_year)
    AND (p_month IS NULL OR f.reporting_month = p_month)
    AND (p_period IS NULL OR p_period = 'all' OR f.period = p_period)
    AND (p_state IS NULL OR lower(trim(f.state)) = lower(trim(p_state)))
    AND (p_lga IS NULL OR lower(trim(f.lga)) = lower(trim(p_lga)))
    AND (p_provider_id IS NULL OR f.provider_id = p_provider_id)
    AND (
      p_sector IS NULL OR p_sector = 'all'
      OR EXISTS (
        SELECT 1
        FROM public.enrollees se
        WHERE se.provider_id = f.provider_id
          AND lower(trim(se.sector)) = lower(trim(p_sector))
          AND (p_year IS NULL OR se.reporting_year = p_year)
          AND (p_month IS NULL OR se.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR se.period = p_period)
      )
    );

  SELECT COALESCE(s.rate, 750)
    INTO v_capitation_rate
    FROM public.nmis_system_settings s
    WHERE s.setting_key = 'capitation_fee_per_enrollee'
      AND s.active = true;

  v_capitation_rate := COALESCE(v_capitation_rate, 750);
  v_capitation_expenditure := v_total * v_capitation_rate;
  v_pepm := CASE WHEN v_total > 0 THEN v_financial_expenditure / v_total ELSE 0 END;
  v_period := CASE
    WHEN p_period IS NOT NULL AND p_period <> 'all' THEN p_period
    WHEN p_year IS NOT NULL AND p_month IS NOT NULL THEN p_year::text || '-' || lpad(p_month::text, 2, '0')
    WHEN p_year IS NOT NULL THEN p_year::text
    ELSE 'All periods'
  END;

  RETURN jsonb_build_object(
    'totalEnrollees', v_total,
    'formalCount', v_formal,
    'informalCount', v_informal,
    'principalCount', v_principal,
    'dependantCount', v_dependant,
    'maleCount', v_male,
    'femaleCount', v_female,
    'providerCount', v_provider_count,
    'lgaCount', v_lga_count,
    'senatorialDistrictCount', v_district_count,
    'formalPercentage', CASE WHEN v_total > 0 THEN round((v_formal::numeric / v_total) * 100, 1) ELSE 0 END,
    'informalPercentage', CASE WHEN v_total > 0 THEN round((v_informal::numeric / v_total) * 100, 1) ELSE 0 END,
    'principalPercentage', CASE WHEN v_total > 0 THEN round((v_principal::numeric / v_total) * 100, 1) ELSE 0 END,
    'dependantPercentage', CASE WHEN v_total > 0 THEN round((v_dependant::numeric / v_total) * 100, 1) ELSE 0 END,
    'bySector', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.sector AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.sector
      ) d
    ), '[]'::jsonb),
    'byCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.category AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.category
      ) d
    ), '[]'::jsonb),
    'byGender', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.gender AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.gender
      ) d
    ), '[]'::jsonb),
    'byState', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.state AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.state
      ) d
    ), '[]'::jsonb),
    'byLga', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.lga AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.lga
      ) d
    ), '[]'::jsonb),
    'bySenatorialDistrict', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT COALESCE(e.senatorial_district, 'Unknown') AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY COALESCE(e.senatorial_district, 'Unknown')
      ) d
    ), '[]'::jsonb),
    'byFacility', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.value DESC, d.name ASC)
      FROM (
        SELECT e.provider_name AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.provider_name
      ) d
    ), '[]'::jsonb),
    'monthlyTrend', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', d.name, 'value', d.value) ORDER BY d.name ASC)
      FROM (
        SELECT e.period AS name, count(*) AS value
        FROM public.enrollees e
        WHERE (p_period IS NULL OR p_period = 'all' OR e.period = p_period)
          AND (p_year IS NULL OR e.reporting_year = p_year)
          AND (p_month IS NULL OR e.reporting_month = p_month)
          AND (p_sector IS NULL OR p_sector = 'all' OR lower(trim(e.sector)) = lower(trim(p_sector)))
          AND (p_category IS NULL OR p_category = 'all' OR lower(trim(e.category)) = lower(trim(p_category)))
          AND (p_state IS NULL OR lower(trim(e.state)) = lower(trim(p_state)))
          AND (p_lga IS NULL OR lower(trim(e.lga)) = lower(trim(p_lga)))
          AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
        GROUP BY e.period
      ) d
    ), '[]'::jsonb),
    'financialExpenditure', v_financial_expenditure,
    'financialRecordCount', v_financial_record_count,
    'pepm', v_pepm,
    'capitationRate', v_capitation_rate,
    'capitationExpenditure', v_capitation_expenditure,
    'pepmTrend', '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_population_analytics(integer, integer, text, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_population_analytics(integer, integer, text, text, text, text, text, uuid) TO authenticated;
