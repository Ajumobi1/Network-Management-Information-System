BEGIN;

CREATE TABLE IF NOT EXISTS public.odchc_checklist_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_code text NOT NULL UNIQUE DEFAULT ('ODCHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  client_submission_id text NOT NULL,
  checklist_type text NOT NULL CHECK (checklist_type IN ('primary', 'dental', 'pharmacy', 'qa')),
  checklist_title text NOT NULL,
  facility_name text NOT NULL,
  inspection_date date NOT NULL,
  overall_score numeric(10,2),
  maximum_score numeric(10,2),
  percentage numeric(6,2),
  recommendation text CHECK (recommendation IS NULL OR recommendation IN ('yes', 'no')),
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by uuid NOT NULL REFERENCES auth.users(id),
  submitted_email text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submitted_by, client_submission_id)
);

CREATE INDEX IF NOT EXISTS odchc_checklist_submissions_type_date_idx
  ON public.odchc_checklist_submissions(checklist_type, inspection_date DESC);
CREATE INDEX IF NOT EXISTS odchc_checklist_submissions_facility_idx
  ON public.odchc_checklist_submissions(lower(facility_name));

ALTER TABLE public.odchc_checklist_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS odchc_checklist_submissions_no_direct_access ON public.odchc_checklist_submissions;
CREATE POLICY odchc_checklist_submissions_no_direct_access
  ON public.odchc_checklist_submissions
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.nmis_save_odchc_checklist_submission(p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_id uuid;
  v_submission public.odchc_checklist_submissions%ROWTYPE;
  v_type text := NULLIF(trim(p_payload ->> 'checklist_type'), '');
  v_title text := NULLIF(trim(p_payload ->> 'checklist_title'), '');
  v_facility text := NULLIF(trim(p_payload ->> 'facility_name'), '');
  v_date date := NULLIF(trim(p_payload ->> 'inspection_date'), '')::date;
  v_client_id text := NULLIF(trim(p_payload ->> 'client_submission_id'), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in before submitting a checklist';
  END IF;

  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Checklist submission is restricted to inspection staff';
  END IF;

  IF v_type IS NULL OR v_type NOT IN ('primary', 'dental', 'pharmacy', 'qa') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid checklist type';
  END IF;
  IF v_title IS NULL OR v_facility IS NULL OR v_date IS NULL OR v_client_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Checklist title, facility, inspection date, and client submission id are required';
  END IF;
  IF jsonb_typeof(COALESCE(p_payload -> 'profile_data', '{}'::jsonb)) <> 'object'
     OR jsonb_typeof(COALESCE(p_payload -> 'responses', '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Checklist profile and response data must be JSON objects';
  END IF;

  INSERT INTO public.odchc_checklist_submissions(
    client_submission_id, checklist_type, checklist_title, facility_name, inspection_date,
    overall_score, maximum_score, percentage, recommendation, profile_data, responses,
    raw_payload, submitted_by, submitted_email, submitted_at
  )
  VALUES (
    v_client_id, v_type, v_title, v_facility, v_date,
    NULLIF(p_payload ->> 'overall_score', '')::numeric,
    NULLIF(p_payload ->> 'maximum_score', '')::numeric,
    NULLIF(p_payload ->> 'percentage', '')::numeric,
    NULLIF(p_payload ->> 'recommendation', ''),
    COALESCE(p_payload -> 'profile_data', '{}'::jsonb),
    COALESCE(p_payload -> 'responses', '{}'::jsonb),
    p_payload,
    v_user_id,
    v_email,
    now()
  )
  ON CONFLICT (submitted_by, client_submission_id) DO UPDATE SET
    checklist_type = EXCLUDED.checklist_type,
    checklist_title = EXCLUDED.checklist_title,
    facility_name = EXCLUDED.facility_name,
    inspection_date = EXCLUDED.inspection_date,
    overall_score = EXCLUDED.overall_score,
    maximum_score = EXCLUDED.maximum_score,
    percentage = EXCLUDED.percentage,
    recommendation = EXCLUDED.recommendation,
    profile_data = EXCLUDED.profile_data,
    responses = EXCLUDED.responses,
    raw_payload = EXCLUDED.raw_payload,
    submitted_email = EXCLUDED.submitted_email,
    submitted_at = now()
  RETURNING * INTO v_submission;

  v_id := v_submission.id;
  INSERT INTO public.audit_logs(user_id, user_email, action, entity, entity_id, metadata)
  VALUES (
    v_user_id,
    v_email,
    'ODCHC_CHECKLIST_SUBMITTED',
    'odchc_checklist_submissions',
    v_id::text,
    jsonb_build_object(
      'submission_code', v_submission.submission_code,
      'checklist_type', v_submission.checklist_type,
      'facility_name', v_submission.facility_name,
      'inspection_date', v_submission.inspection_date,
      'percentage', v_submission.percentage
    )
  );

  RETURN jsonb_build_object(
    'id', v_submission.id,
    'submission_code', v_submission.submission_code,
    'checklist_type', v_submission.checklist_type,
    'facility_name', v_submission.facility_name,
    'inspection_date', v_submission.inspection_date,
    'percentage', v_submission.percentage,
    'submitted_at', v_submission.submitted_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_save_odchc_checklist_submission(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_save_odchc_checklist_submission(jsonb) TO authenticated;

COMMIT;
