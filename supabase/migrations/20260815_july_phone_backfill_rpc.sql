-- Secure July phone-number recovery by unique policy match.
-- Caller supplies source rows already filtered for nonblank phone, present gender,
-- and non-duplicate source policy. Existing phone values are never overwritten.
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
    SELECT
      upper(replace(value->>'policy_number', ' ', '')) AS policy_number,
      NULLIF(trim(value->>'phone_number'), '') AS phone_number
    FROM jsonb_array_elements(p_batch)
  ),
  unique_source AS (
    SELECT policy_number, max(phone_number) AS phone_number
    FROM source_rows
    WHERE phone_number IS NOT NULL
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
  SET phone_number = s.phone_number,
      updated_at = now()
  FROM unique_source s
  JOIN unique_db d ON d.policy_number = s.policy_number
  WHERE e.period = '2026-07'
    AND e.policy_number = s.policy_number
    AND e.phone_number IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_backfill_july_phones_by_policy(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_backfill_july_phones_by_policy(jsonb) TO service_role;
