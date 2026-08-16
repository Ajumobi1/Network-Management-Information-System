-- Policy-only NULL age backfill for July 2026.
-- The caller supplies source rows already filtered for valid age, gender present,
-- and non-duplicate source policy numbers. The update remains limited to July,
-- unique database policy numbers, and age IS NULL.
CREATE OR REPLACE FUNCTION public.nmis_backfill_july_ages_by_policy(p_batch jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  WITH source_rows AS (
    SELECT
      value->>'policy_number' AS policy_number,
      (value->>'age')::integer AS age
    FROM jsonb_array_elements(p_batch)
  ),
  unique_source AS (
    SELECT policy_number, max(age) AS age
    FROM source_rows
    GROUP BY policy_number
    HAVING count(*) = 1
  ),
  unique_db AS (
    SELECT e.policy_number
    FROM public.enrollees e
    WHERE e.period = '2026-07'
    GROUP BY e.policy_number
    HAVING count(*) = 1
  )
  UPDATE public.enrollees e
  SET age = s.age,
      updated_at = now()
  FROM unique_source s
  JOIN unique_db d ON d.policy_number = s.policy_number
  WHERE e.period = '2026-07'
    AND e.policy_number = s.policy_number
    AND e.age IS NULL
    AND s.age >= 0;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_backfill_july_ages_by_policy(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_backfill_july_ages_by_policy(jsonb) TO service_role;
