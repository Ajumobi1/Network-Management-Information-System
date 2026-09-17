-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 8: Facility Inspection Secure Backend RPC Contracts & Tables.
--
-- Excludes direct browser CRUD against protected tables (`inspections`, `inspection_checklists`).
-- All inspection listing, scheduling, and review are routed through secure RPCs.

BEGIN;

-- 1. Create inspections table if not exists
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    inspector_name TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    score NUMERIC(5,2),
    rating TEXT,
    findings TEXT,
    corrective_actions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create inspection checklists table if not exists
CREATE TABLE IF NOT EXISTS inspection_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Compliant',
    notes TEXT
);

-- Enable RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_checklists ENABLE ROW LEVEL SECURITY;

-- Deny-by-default RLS policies
DROP POLICY IF EXISTS "Deny direct public inspections access" ON inspections;
CREATE POLICY "Deny direct public inspections access" ON inspections
    FOR ALL USING (false);

DROP POLICY IF EXISTS "Deny direct public inspection_checklists access" ON inspection_checklists;
CREATE POLICY "Deny direct public inspection_checklists access" ON inspection_checklists
    FOR ALL USING (false);

-- 3. Secure function to list field-minimized inspections
CREATE OR REPLACE FUNCTION public.nmis_list_inspections(
  p_provider_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_inspections jsonb;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'inspector', 'finance', 'executive') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection records';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', i.id,
      'provider_id', i.provider_id,
      'inspection_type', i.inspection_type,
      'scheduled_date', i.scheduled_date,
      'inspector_name', i.inspector_name,
      'status', i.status,
      'score', i.score,
      'rating', i.rating,
      'findings', i.findings,
      'corrective_actions', i.corrective_actions,
      'created_at', i.created_at
    )
  ) INTO v_inspections
  FROM public.inspections i
  WHERE p_provider_id IS NULL OR i.provider_id = p_provider_id;

  RETURN coalesce(v_inspections, '[]'::jsonb);
END;
$$;

-- 4. Secure function to schedule or update an inspection
CREATE OR REPLACE FUNCTION public.nmis_save_inspection(
  p_inspection_id uuid DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL,
  p_inspection_type text DEFAULT 'Routine',
  p_scheduled_date date DEFAULT CURRENT_DATE,
  p_inspector_name text DEFAULT NULL,
  p_status text DEFAULT 'Scheduled',
  p_score numeric DEFAULT NULL,
  p_rating text DEFAULT NULL,
  p_findings text DEFAULT NULL,
  p_corrective_actions text DEFAULT NULL
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
  v_inspection public.inspections%ROWTYPE;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'inspector') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection scheduling/mutations';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  IF p_inspection_id IS NULL THEN
    INSERT INTO public.inspections (
      provider_id, inspection_type, scheduled_date, inspector_name, status, score, rating, findings, corrective_actions
    ) VALUES (
      p_provider_id, p_inspection_type, p_scheduled_date, p_inspector_name, p_status, p_score, p_rating, p_findings, p_corrective_actions
    )
    RETURNING * INTO v_inspection;
  ELSE
    UPDATE public.inspections
    SET
      provider_id = coalesce(p_provider_id, provider_id),
      inspection_type = coalesce(p_inspection_type, inspection_type),
      scheduled_date = coalesce(p_scheduled_date, scheduled_date),
      inspector_name = coalesce(p_inspector_name, inspector_name),
      status = coalesce(p_status, status),
      score = coalesce(p_score, score),
      rating = coalesce(p_rating, rating),
      findings = coalesce(p_findings, findings),
      corrective_actions = coalesce(p_corrective_actions, corrective_actions),
      updated_at = NOW()
    WHERE id = p_inspection_id
    RETURNING * INTO v_inspection;
  END IF;

  -- Record audit event
  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id,
    v_user_email,
    'INSPECTION_SAVED',
    'inspections',
    v_inspection.id::text,
    jsonb_build_object(
      'provider_id', v_inspection.provider_id,
      'inspection_type', v_inspection.inspection_type,
      'status', v_inspection.status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'inspection_id', v_inspection.id,
    'status', v_inspection.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_inspections(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_save_inspection(uuid, uuid, text, date, text, text, numeric, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_list_inspections(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_save_inspection(uuid, uuid, text, date, text, text, numeric, text, text, text) TO authenticated;

COMMIT;
