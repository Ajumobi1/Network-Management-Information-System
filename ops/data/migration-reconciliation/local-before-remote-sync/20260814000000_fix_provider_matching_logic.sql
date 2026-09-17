-- Fix and enhance provider matching logic for imports
CREATE OR REPLACE FUNCTION public.nmis_import_match_candidates(
  p_import_session_id uuid,
  p_provider_name text,
  p_provider_code text DEFAULT NULL,
  p_lga text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_candidates jsonb;
  v_norm_input text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for provider matching';
  END IF;

  IF p_import_session_id IS NULL OR p_provider_name IS NULL OR length(trim(p_provider_name)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Import session ID and provider name are required';
  END IF;

  -- Normalize input name for comparison (lowercase, trim, strip noise)
  v_norm_input := lower(trim(p_provider_name));
  v_norm_input := regexp_replace(v_norm_input, 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc', '', 'g');
  v_norm_input := trim(regexp_replace(v_norm_input, '\s+', ' ', 'g'));

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'provider_code', p.provider_code,
      'provider_name', p.provider_name,
      'category', p.category,
      'ownership', p.ownership,
      'state', p.state,
      'lga', p.lga,
      'status', p.status,
      'match_score', CASE
        -- 1. Exact Code Match
        WHEN p_provider_code IS NOT NULL AND lower(trim(p.provider_code)) = lower(trim(p_provider_code)) THEN 100
        
        -- 2. Exact Name Match (case-insensitive)
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 98
        
        -- 3. Core Name Match (after stripping noise from both)
        WHEN trim(regexp_replace(lower(trim(p.provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc', '', 'g')) = v_norm_input THEN 95

        -- 4. Substring Match (Workbook contains Directory Name or vice versa)
        WHEN lower(trim(p_provider_name)) ILIKE '%' || lower(trim(p.provider_name)) || '%' 
          OR lower(trim(p.provider_name)) ILIKE '%' || lower(trim(p.provider_name)) || '%' THEN 85
        
        -- 5. Fuzzy / Partial
        ELSE 60
      END,
      'match_reason', CASE
        WHEN p_provider_code IS NOT NULL AND lower(trim(p.provider_code)) = lower(trim(p_provider_code)) THEN 'Exact Provider Code Match'
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 'Exact Name Match'
        WHEN trim(regexp_replace(lower(trim(p.provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc', '', 'g')) = v_norm_input THEN 'Core Name Match'
        ELSE 'Fuzzy Name / Location Match'
      END
    )
  ) INTO v_candidates
  FROM public.providers p
  WHERE 
    -- Filter by state if provided (Ondo is default)
    (p_state IS NULL OR p.state ILIKE p_state OR p.state = 'Ondo')
    AND (
      -- Bidirectional Substring Match
      p.provider_name ILIKE '%' || trim(p_provider_name) || '%'
      OR trim(p_provider_name) ILIKE '%' || p.provider_name || '%'
      -- Code match
      OR (p_provider_code IS NOT NULL AND p.provider_code ILIKE '%' || trim(p_provider_code) || '%')
      -- Core name similarity
      OR trim(regexp_replace(lower(trim(p.provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc', '', 'g')) = v_norm_input
    )
  LIMIT 5;

  RETURN jsonb_build_object(
    'import_session_id', p_import_session_id,
    'query_name', p_provider_name,
    'candidates', coalesce(v_candidates, '[]'::jsonb)
  );
END;
$$;
