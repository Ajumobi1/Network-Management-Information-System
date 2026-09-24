BEGIN;

CREATE OR REPLACE FUNCTION public.nmis_list_odchc_checklist_submissions(
  p_checklist_type text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_search text := NULLIF(lower(trim(p_search)), '');
  v_type text := NULLIF(lower(trim(p_checklist_type)), '');
  v_total bigint;
  v_items jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in to view checklist submissions';
  END IF;
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Checklist history is restricted to inspection staff';
  END IF;
  IF v_type IS NOT NULL AND v_type NOT IN ('primary', 'dental', 'pharmacy', 'qa') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid checklist type filter';
  END IF;

  SELECT count(*) INTO v_total
  FROM public.odchc_checklist_submissions s
  WHERE (v_type IS NULL OR s.checklist_type = v_type)
    AND (v_search IS NULL OR lower(s.submission_code) LIKE '%' || v_search || '%'
      OR lower(s.facility_name) LIKE '%' || v_search || '%'
      OR lower(s.checklist_title) LIKE '%' || v_search || '%'
      OR lower(COALESCE(s.submitted_email, '')) LIKE '%' || v_search || '%');

  SELECT COALESCE(jsonb_agg(to_jsonb(rows) ORDER BY rows.submitted_at DESC), '[]'::jsonb)
  INTO v_items
  FROM (
    SELECT s.id, s.submission_code, s.checklist_type, s.checklist_title,
           s.facility_name, s.inspection_date, s.overall_score, s.maximum_score,
           s.percentage, s.recommendation, s.submitted_email, s.submitted_at
    FROM public.odchc_checklist_submissions s
    WHERE (v_type IS NULL OR s.checklist_type = v_type)
      AND (v_search IS NULL OR lower(s.submission_code) LIKE '%' || v_search || '%'
        OR lower(s.facility_name) LIKE '%' || v_search || '%'
        OR lower(s.checklist_title) LIKE '%' || v_search || '%'
        OR lower(COALESCE(s.submitted_email, '')) LIKE '%' || v_search || '%')
    ORDER BY s.submitted_at DESC
    LIMIT v_limit OFFSET v_offset
  ) rows;

  RETURN jsonb_build_object('items', v_items, 'total', v_total, 'limit', v_limit, 'offset', v_offset);
END;
$$;

CREATE OR REPLACE FUNCTION public.nmis_get_odchc_checklist_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_submission public.odchc_checklist_submissions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in to view checklist submissions';
  END IF;
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','executive','head-of-network','network-officer','inspector']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Checklist history is restricted to inspection staff';
  END IF;

  SELECT * INTO v_submission
  FROM public.odchc_checklist_submissions
  WHERE id = p_submission_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: Checklist submission not found'; END IF;

  RETURN jsonb_build_object(
    'id', v_submission.id,
    'submission_code', v_submission.submission_code,
    'checklist_type', v_submission.checklist_type,
    'checklist_title', v_submission.checklist_title,
    'facility_name', v_submission.facility_name,
    'inspection_date', v_submission.inspection_date,
    'overall_score', v_submission.overall_score,
    'maximum_score', v_submission.maximum_score,
    'percentage', v_submission.percentage,
    'recommendation', v_submission.recommendation,
    'profile_data', v_submission.profile_data,
    'responses', v_submission.responses,
    'raw_payload', v_submission.raw_payload,
    'submitted_by', v_submission.submitted_by,
    'submitted_email', v_submission.submitted_email,
    'submitted_at', v_submission.submitted_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_odchc_checklist_submissions(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_odchc_checklist_submissions(text, text, integer, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.nmis_get_odchc_checklist_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_get_odchc_checklist_submission(uuid) TO authenticated;

COMMIT;
