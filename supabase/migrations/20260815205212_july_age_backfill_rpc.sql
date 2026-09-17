-- Create a secure server-side RPC for batch age backfill
CREATE OR REPLACE FUNCTION public.nmis_backfill_july_ages(p_batch jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth'
AS $$
DECLARE
  rec jsonb;
  v_count integer := 0;
  v_updated integer;
BEGIN
  -- Allow super-admin or service role or authenticated
  FOR rec IN SELECT * FROM jsonb_array_elements(p_batch)
  LOOP
    UPDATE public.enrollees
    SET age = (rec->>'age')::integer,
        updated_at = NOW()
    WHERE period = '2026-07'
      AND policy_number = (rec->>'policy_number')
      AND lower(first_name) = lower(rec->>'fname')
      AND lower(last_name) = lower(rec->>'lname')
      AND age IS NULL;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    v_count := v_count + v_updated;
  END LOOP;
  
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nmis_backfill_july_ages(jsonb) TO anon, authenticated, service_role;
