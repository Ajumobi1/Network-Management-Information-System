CREATE OR REPLACE FUNCTION public.nmis_backfill_july_phones_by_policy(p_batch jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  WITH source_rows AS (
    SELECT DISTINCT ON (upper(replace(x.policy_number, ' ', '')))
      upper(replace(x.policy_number, ' ', '')) AS policy_number,
      NULLIF(trim(x.phone_number), '') AS phone_number
    FROM jsonb_to_recordset(p_batch) AS x(policy_number text, phone_number text)
    WHERE NULLIF(trim(x.phone_number), '') IS NOT NULL
    ORDER BY upper(replace(x.policy_number, ' ', ''))
  )
  UPDATE public.enrollees e
  SET phone_number = s.phone_number,
      updated_at = now()
  FROM source_rows s
  WHERE e.period = '2026-07'
    AND e.policy_number = s.policy_number
    AND e.phone_number IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_backfill_july_phones_by_policy(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_backfill_july_phones_by_policy(jsonb) TO service_role;
