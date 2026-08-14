-- 1. Create provider_name_aliases table for permanent historical alias mapping
CREATE TABLE IF NOT EXISTS public.provider_name_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  alias_name text NOT NULL,
  normalized_alias text NOT NULL,
  source text NOT NULL DEFAULT 'manual-resolution', -- 'manual-resolution', 'seed', 'import-auto'
  confidence numeric(3,2) NOT NULL DEFAULT 1.00,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  CONSTRAINT provider_alias_unique UNIQUE (provider_id, normalized_alias)
);

-- Enable RLS
ALTER TABLE public.provider_name_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users on provider_name_aliases"
  ON public.provider_name_aliases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable write access for authorized roles on provider_name_aliases"
  ON public.provider_name_aliases FOR INSERT
  TO authenticated
  WITH CHECK (public.nmis_current_role() IN ('super-admin', 'head-of-network', 'network-officer', 'finance'));

CREATE POLICY "Enable update access for authorized roles on provider_name_aliases"
  ON public.provider_name_aliases FOR UPDATE
  TO authenticated
  USING (public.nmis_current_role() IN ('super-admin', 'head-of-network', 'network-officer', 'finance'));

CREATE INDEX IF NOT EXISTS idx_provider_aliases_norm ON public.provider_name_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_provider_aliases_provider_id ON public.provider_name_aliases(provider_id);

-- 2. Seed initial known aliases (e.g., Aduloju Memorial Hospital -> Aduloju Hospital)
INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source, confidence)
SELECT 
  p.id, 
  'ADULOJU MEMORIAL HOSPITAL, AKUNGBA AKOKO', 
  'adulojumemorialhospitalakungbaakoko', 
  'seed', 
  1.00
FROM public.providers p
WHERE p.provider_name ILIKE '%ADULOJU HOSPITAL%' AND p.lga ILIKE '%Akoko South-East%'
ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

-- 3. Upgrade nmis_import_match_candidates to check aliases (Level 2) and deterministic hierarchy
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
  v_alias_match record;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for provider matching';
  END IF;

  IF p_import_session_id IS NULL OR p_provider_name IS NULL OR length(trim(p_provider_name)) == 0 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Import session ID and provider name are required';
  END IF;

  -- Normalize input name
  v_norm_input := lower(trim(p_provider_name));
  v_norm_input := regexp_replace(v_norm_input, '[^a-z0-9]', '', 'g');

  -- LEVEL 2: Check provider alias first
  SELECT p.* INTO v_alias_match
  FROM public.provider_name_aliases a
  JOIN public.providers p ON p.id = a.provider_id
  WHERE a.normalized_alias = v_norm_input AND a.active = true
  LIMIT 1;

  IF FOUND THEN
    -- Return exact alias match with 100% score
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

  -- LEVEL 1, 3, 4: Standard candidate scoring
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
        -- Core name match after stripping noise
        WHEN regexp_replace(lower(trim(p.provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc|,|\s+', '', 'g') 
             = regexp_replace(lower(trim(p_provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc|,|\s+', '', 'g') THEN 95
        -- LGA assisted match
        WHEN (p_lga IS NOT NULL AND p.lga ILIKE p_lga) AND (p.provider_name ILIKE '%' || split_part(trim(p_provider_name), ' ', 1) || '%') THEN 88
        -- Substring
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
      OR regexp_replace(lower(trim(p.provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc|,|\s+', '', 'g') 
         = regexp_replace(lower(trim(p_provider_name)), 'hospital|memorial|clinic|health|center|centre|akungba|akure|ondo|limited|ltd|plc|,|\s+', '', 'g')
    )
  LIMIT 5;

  RETURN jsonb_build_object(
    'import_session_id', p_import_session_id,
    'query_name', p_provider_name,
    'candidates', coalesce(v_candidates, '[]'::jsonb)
  );
END;
$$;

-- 4. Upgrade nmis_resolve_provider_match to learn and save new aliases permanently
CREATE OR REPLACE FUNCTION public.nmis_resolve_provider_match(
  p_import_session_id uuid,
  p_candidate_provider_id uuid,
  p_match_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
  v_user_email text;
  v_provider public.providers%ROWTYPE;
  v_query_name text;
  v_norm_alias text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for match resolution';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  SELECT * INTO v_provider FROM public.providers WHERE id = p_candidate_provider_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Candidate provider not found';
  END IF;

  -- Extract query name from session or token if possible, or save resolution
  -- Insert into provider_name_aliases to learn for future uploads
  -- p_match_token can carry the raw excel name or alias string
  IF length(trim(p_match_token)) > 0 AND p_match_token <> 'manual-match-token' THEN
    v_norm_alias := lower(trim(p_match_token));
    v_norm_alias := regexp_replace(v_norm_alias, '[^a-z0-9]', '', 'g');

    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source, confidence, created_by, approved_by)
    VALUES (p_candidate_provider_id, p_match_token, v_norm_alias, 'manual-resolution', 1.00, v_user_id, v_user_id)
    ON CONFLICT (provider_id, normalized_alias) DO UPDATE
    SET active = true, updated_at = now();
  END IF;

  INSERT INTO public.provider_match_resolutions (
    import_session_id,
    candidate_provider_id,
    match_token,
    resolved_by_user_id,
    resolved_by_email,
    status
  ) VALUES (
    p_import_session_id,
    p_candidate_provider_id,
    p_match_token,
    v_user_id,
    v_user_email,
    'confirmed'
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Provider match resolved and learned as permanent alias.',
    'provider_id', p_candidate_provider_id,
    'provider_name', v_provider.provider_name
  );
END;
$$;
