-- Target: Supabase staging project tnklirwrnrdvbfjsdtel (NMIS-Frontend).
-- Phase 9: Capitation Management Secure Backend RPC Contracts & Tables.
--
-- Excludes direct browser CRUD against protected tables (`capitation_summaries`).
-- All capitation listing, calculation, and workflow transitions are routed through secure RPCs.

BEGIN;

-- 1. Create capitation_summaries table
CREATE TABLE IF NOT EXISTS public.capitation_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- YYYY-MM
    enrollee_denominator INTEGER DEFAULT 0,
    eligible_population INTEGER DEFAULT 0,
    capitation_rate DECIMAL(18, 2) DEFAULT 0,
    gross_amount DECIMAL(18, 2) DEFAULT 0,
    adjustments DECIMAL(18, 2) DEFAULT 0,
    deductions DECIMAL(18, 2) DEFAULT 0,
    net_amount DECIMAL(18, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Calculated, Submitted, Reviewed, Approved, Paid, etc.
    payment_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Processing, Paid, Partial, Failed
    reconciliation_status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Matched, Exception
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, period)
);

-- Enable RLS
ALTER TABLE public.capitation_summaries ENABLE ROW LEVEL SECURITY;

-- Deny-by-default RLS policies
DROP POLICY IF EXISTS "Deny direct public capitation_summaries access" ON public.capitation_summaries;
CREATE POLICY "Deny direct public capitation_summaries access" ON public.capitation_summaries
    FOR ALL USING (false);

-- 2. Secure function to list field-minimized capitation records
CREATE OR REPLACE FUNCTION public.nmis_list_capitation(
  p_period text DEFAULT NULL,
  p_provider_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_role text;
  v_capitations jsonb;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'network-officer', 'finance', 'executive') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for capitation records';
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'provider_id', c.provider_id,
      'provider_name', p.provider_name,
      'provider_code', p.provider_code,
      'period', c.period,
      'enrollee_denominator', c.enrollee_denominator,
      'eligible_population', c.eligible_population,
      'capitation_rate', c.capitation_rate,
      'gross_amount', c.gross_amount,
      'adjustments', c.adjustments,
      'deductions', c.deductions,
      'net_amount', c.net_amount,
      'status', c.status,
      'payment_status', c.payment_status,
      'reconciliation_status', c.reconciliation_status,
      'updated_at', c.updated_at
    )
  ) INTO v_capitations
  FROM public.capitation_summaries c
  JOIN public.providers p ON c.provider_id = p.id
  WHERE (p_period IS NULL OR c.period = p_period)
    AND (p_provider_id IS NULL OR c.provider_id = p_provider_id);

  RETURN coalesce(v_capitations, '[]'::jsonb);
END;
$$;

-- 3. Secure function to update capitation status / workflow
CREATE OR REPLACE FUNCTION public.nmis_transition_capitation(
  p_capitation_id uuid,
  p_action text,
  p_comment text DEFAULT NULL
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
  v_cap public.capitation_summaries%ROWTYPE;
  v_new_status text;
BEGIN
  v_role := public.nmis_current_role();
  IF v_role NOT IN ('super-admin', 'head-of-network', 'finance') THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for capitation transitions';
  END IF;

  v_user_id := auth.uid();
  v_user_email := auth.jwt() ->> 'email';

  SELECT * INTO v_cap FROM public.capitation_summaries WHERE id = p_capitation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RECORD_NOT_FOUND: Capitation record does not exist';
  END IF;

  -- Simple state machine logic
  CASE p_action
    WHEN 'submit' THEN v_new_status := 'Submitted';
    WHEN 'review' THEN v_new_status := 'Reviewed';
    WHEN 'approve' THEN v_new_status := 'Approved';
    WHEN 'reject' THEN v_new_status := 'Rejected';
    WHEN 'suspend' THEN v_new_status := 'Suspended';
    WHEN 'mark-paid' THEN v_new_status := 'Paid';
    ELSE RAISE EXCEPTION 'INVALID_ACTION: Transition action % is not supported', p_action;
  END CASE;

  UPDATE public.capitation_summaries
  SET 
    status = v_new_status,
    payment_status = CASE WHEN p_action = 'mark-paid' THEN 'Paid' ELSE payment_status END,
    updated_at = NOW()
  WHERE id = p_capitation_id
  RETURNING * INTO v_cap;

  -- Record audit event
  INSERT INTO public.audit_logs (user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id,
    v_user_email,
    'CAPITATION_TRANSITION',
    'capitation_summaries',
    v_cap.id::text,
    jsonb_build_object(
      'provider_id', v_cap.provider_id,
      'period', v_cap.period,
      'action', p_action,
      'new_status', v_new_status,
      'comment', p_comment
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'capitation_id', v_cap.id,
    'status', v_cap.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_capitation(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.nmis_transition_capitation(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.nmis_list_capitation(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_transition_capitation(uuid, text, text) TO authenticated;

COMMIT;
