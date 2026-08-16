CREATE OR REPLACE FUNCTION public.nmis_import_match_candidates(p_import_session_id uuid, p_provider_name text, p_provider_code text DEFAULT NULL::text, p_lga text DEFAULT NULL::text, p_state text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_role text;
  v_candidates jsonb;
  v_norm_input text;
  v_alias_match record;
  v_cleaned_input text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for provider matching';
  END IF;

  IF p_import_session_id IS NULL OR p_provider_name IS NULL OR length(trim(p_provider_name)) = 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Import session ID and provider name are required';
  END IF;

  v_norm_input := lower(trim(p_provider_name));
  v_norm_input := regexp_replace(v_norm_input, '[^a-z0-9]', '', 'g');

  -- 1. Check exact alias match
  SELECT p.* INTO v_alias_match
  FROM public.provider_name_aliases a
  JOIN public.providers p ON p.id = a.provider_id
  WHERE (a.normalized_alias = v_norm_input OR regexp_replace(lower(trim(a.alias_name)), '[^a-z0-9]', '', 'g') = v_norm_input) 
    AND a.active = true
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'import_session_id', p_import_session_id,
      'query_name', p_provider_name,
      'candidates', jsonb_build_array(
        jsonb_build_object(
          'id', v_alias_match.id,
          'provider_code', v_alias_match.provider_code,
          'provider_name', v_alias_match.provider_name,
          'category', v_alias_match.category,
          'ownership', v_alias_match.ownership,
          'state', v_alias_match.state,
          'lga', v_alias_match.lga,
          'status', v_alias_match.status,
          'match_score', 100,
          'match_reason', 'Approved Provider Alias Match'
        )
      )
    );
  END IF;

  -- Cleaned input for fuzzy matching (remove common noise words)
  v_cleaned_input := regexp_replace(lower(trim(p_provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc|,|\\s+', '', 'g');

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
        WHEN p_provider_code IS NOT NULL AND lower(trim(p.provider_code)) = lower(trim(p.provider_code)) THEN 100
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 98
        WHEN regexp_replace(lower(trim(p.provider_name)), '[^a-z0-9]', '', 'g') = v_norm_input THEN 95
        WHEN (p_lga IS NOT NULL AND p.lga ILIKE p_lga) AND (p.provider_name ILIKE '%' || split_part(trim(p_provider_name), ' ', 1) || '%') THEN 88
        WHEN p.provider_name ILIKE '%' || trim(p_provider_name) || '%' OR trim(p_provider_name) ILIKE '%' || p.provider_name || '%' THEN 80
        ELSE 60
      END,
      'match_reason', CASE
        WHEN p_provider_code IS NOT NULL THEN 'Provider Code Match'
        WHEN lower(trim(p.provider_name)) = lower(trim(p_provider_name)) THEN 'Exact Name Match'
        WHEN (p_lga IS NOT NULL AND p.lga ILIKE p_lga) THEN 'Core Name + LGA Match'
        ELSE 'Fuzzy Name Match'
      END
    )
  ) INTO v_candidates
  FROM public.providers p
  WHERE 
    (p_state IS NULL OR p.state ILIKE p_state OR p.state = 'Ondo')
    AND (
      p.provider_name ILIKE '%' || trim(p_provider_name) || '%'
      OR trim(p_provider_name) ILIKE '%' || p.provider_name || '%'
      OR (p_provider_code IS NOT NULL AND p.provider_code ILIKE '%' || trim(p_provider_code) || '%')
      OR regexp_replace(lower(trim(p.provider_name)), '[^a-z0-9]', '', 'g') = v_norm_input
    )
  LIMIT 5;

  RETURN jsonb_build_object(
    'import_session_id', p_import_session_id,
    'query_name', p_provider_name,
    'candidates', coalesce(v_candidates, '[]'::jsonb)
  );
END;
$function$;

-- Update normalized_alias for all workbook import aliases
UPDATE public.provider_name_aliases
SET normalized_alias = regexp_replace(lower(trim(alias_name)), '[^a-z0-9]', '', 'g')
WHERE source = 'workbook_import';
