BEGIN;

CREATE TABLE IF NOT EXISTS public.odchc_checklist_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES public.inspections(id) ON DELETE CASCADE,
  accreditation_id uuid REFERENCES public.accreditations(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  source_section text NOT NULL,
  source_item text NOT NULL,
  item_code text NOT NULL,
  response_number numeric,
  observed_count numeric,
  response_boolean boolean,
  response_text text,
  response_json jsonb,
  remark text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((inspection_id IS NOT NULL) <> (accreditation_id IS NOT NULL)),
  UNIQUE (inspection_id, item_code),
  UNIQUE (accreditation_id, item_code)
);
ALTER TABLE public.odchc_checklist_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS odchc_checklist_answers_no_direct_access ON public.odchc_checklist_answers;
CREATE POLICY odchc_checklist_answers_no_direct_access ON public.odchc_checklist_answers FOR ALL TO authenticated USING (false) WITH CHECK (false);

ALTER TABLE public.inspection_responses
  ADD COLUMN IF NOT EXISTS response_text text,
  ADD COLUMN IF NOT EXISTS response_json jsonb;

ALTER TABLE public.accreditation_responses
  ADD COLUMN IF NOT EXISTS response_text text,
  ADD COLUMN IF NOT EXISTS response_json jsonb;

CREATE OR REPLACE FUNCTION public.nmis_save_odchc_checklist_as_canonical_record(
  p_record_type text DEFAULT 'accreditation',
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_type text := lower(coalesce(nullif(trim(p_record_type), ''), 'accreditation'));
  v_checklist_type text := nullif(trim(p_payload ->> 'checklist_type'), '');
  v_template_code text := nullif(trim(p_payload ->> 'template_code'), '');
  v_facility_name text := nullif(trim(p_payload ->> 'facility_name'), '');
  v_provider_id uuid := nullif(trim(p_payload ->> 'provider_id'), '')::uuid;
  v_canonical jsonb;
  v_result jsonb;
  v_id uuid;
  v_facility_profile jsonb := coalesce(p_payload -> 'profile_data', '{}'::jsonb);
BEGIN
  IF v_type NOT IN ('inspection', 'accreditation') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Record type must be inspection or accreditation';
  END IF;
  IF v_checklist_type NOT IN ('primary', 'dental', 'pharmacy', 'qa') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid checklist type';
  END IF;
  IF v_facility_name IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Facility name is required';
  END IF;

  v_template_code := coalesce(v_template_code, CASE v_checklist_type
    WHEN 'primary' THEN 'private-hospital-accreditation'
    WHEN 'dental' THEN 'dental-accreditation'
    WHEN 'pharmacy' THEN 'pharmacy-accreditation'
    WHEN 'qa' THEN 'government-hospital-accreditation'
  END);

  IF v_type = 'inspection' AND v_provider_id IS NULL THEN
    SELECT p.id INTO v_provider_id
    FROM public.providers p
    WHERE lower(trim(coalesce(p.provider_name, ''))) = lower(trim(v_facility_name))
       OR lower(trim(coalesce(p.provider_name, ''))) = lower(trim(coalesce(v_facility_profile ->> 'name', '')))
    ORDER BY CASE WHEN lower(trim(coalesce(p.provider_name, ''))) = lower(trim(v_facility_name)) THEN 0 ELSE 1 END,
             p.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_type = 'inspection' AND v_provider_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Select a registered facility from the Provider Directory before saving this inspection';
  END IF;

  v_facility_profile := jsonb_build_object(
    'facility_name', v_facility_name,
    'address', coalesce(v_facility_profile ->> 'address', ''),
    'telephone', coalesce(v_facility_profile ->> 'telephone', ''),
    'facility_email', coalesce(v_facility_profile ->> 'email', v_facility_profile ->> 'facility_email', ''),
    'contact_person', coalesce(v_facility_profile ->> 'contact_person', ''),
    'facility_account_name', coalesce(v_facility_profile ->> 'facility_account', ''),
    'inspection_date', coalesce(p_payload ->> 'inspection_date', current_date::text),
    'metadata', coalesce(p_payload -> 'profile_data', '{}'::jsonb)
  ) || coalesce(p_payload -> 'profile_data', '{}'::jsonb);

  v_canonical := jsonb_build_object(
    'mode', 'submit',
    'template_code', v_template_code,
    'inspection_type', coalesce(p_payload ->> 'checklist_title', 'ODCHC Checklist'),
    'scheduled_date', coalesce(p_payload ->> 'inspection_date', current_date::text),
    'inspector_name', nullif(p_payload ->> 'inspector_name', ''),
    'facility_profile', v_facility_profile,
    'eligibility', coalesce(p_payload -> 'eligibility', '[]'::jsonb),
    'responses', coalesce(p_payload -> 'canonical_responses', '[]'::jsonb),
    'team', coalesce(p_payload -> 'team', '[]'::jsonb),
    'step', 'submitted'
  );

  IF v_type = 'accreditation' THEN
    v_result := public.nmis_save_accreditation(NULL, v_canonical);
    v_id := (v_result ->> 'accreditation_id')::uuid;

    INSERT INTO public.odchc_checklist_answers(accreditation_id, checklist_type, source_section, source_item, item_code, response_number, observed_count, response_boolean, response_text, response_json, remark)
    SELECT v_id, v_checklist_type, coalesce(r ->> 'source_section',''), coalesce(r ->> 'source_item',''), r ->> 'item_code', nullif(r ->> 'response_number','')::numeric, nullif(r ->> 'observed_count','')::numeric, nullif(r ->> 'response_boolean','')::boolean, nullif(r ->> 'response_text',''), CASE WHEN jsonb_typeof(r -> 'response_json') IN ('object','array') THEN r -> 'response_json' ELSE NULL END, nullif(r ->> 'remark','')
    FROM jsonb_array_elements(coalesce(p_payload -> 'canonical_responses','[]'::jsonb)) r
    ON CONFLICT (accreditation_id, item_code) DO UPDATE SET source_section=excluded.source_section, source_item=excluded.source_item, response_number=excluded.response_number, observed_count=excluded.observed_count, response_boolean=excluded.response_boolean, response_text=excluded.response_text, response_json=excluded.response_json, remark=excluded.remark, updated_at=now();

    UPDATE public.accreditation_responses ar
    SET response_text = nullif(r ->> 'response_text', ''),
        response_json = CASE WHEN jsonb_typeof(r -> 'response_json') IN ('object', 'array') THEN r -> 'response_json' ELSE NULL END,
        observed_count = nullif(r ->> 'observed_count', '')::numeric,
        updated_at = now()
    FROM jsonb_array_elements(coalesce(p_payload -> 'canonical_responses', '[]'::jsonb)) r
    WHERE ar.accreditation_id = v_id AND ar.item_code = r ->> 'item_code';

    RETURN jsonb_build_object('record_type', 'accreditation', 'accreditation_id', v_id,
      'status', v_result ->> 'status', 'overall_score', v_result -> 'overall_score',
      'total_points', v_result -> 'total_points', 'total_possible', v_result -> 'total_possible');
  END IF;

  v_canonical := v_canonical || jsonb_build_object('provider_id', v_provider_id);
  v_result := public.nmis_save_structured_inspection(NULL, v_canonical);
  v_id := (v_result ->> 'inspection_id')::uuid;

  INSERT INTO public.odchc_checklist_answers(inspection_id, checklist_type, source_section, source_item, item_code, response_number, observed_count, response_boolean, response_text, response_json, remark)
  SELECT v_id, v_checklist_type, coalesce(r ->> 'source_section',''), coalesce(r ->> 'source_item',''), r ->> 'item_code', nullif(r ->> 'response_number','')::numeric, nullif(r ->> 'observed_count','')::numeric, nullif(r ->> 'response_boolean','')::boolean, nullif(r ->> 'response_text',''), CASE WHEN jsonb_typeof(r -> 'response_json') IN ('object','array') THEN r -> 'response_json' ELSE NULL END, nullif(r ->> 'remark','')
  FROM jsonb_array_elements(coalesce(p_payload -> 'canonical_responses','[]'::jsonb)) r
  ON CONFLICT (inspection_id, item_code) DO UPDATE SET source_section=excluded.source_section, source_item=excluded.source_item, response_number=excluded.response_number, observed_count=excluded.observed_count, response_boolean=excluded.response_boolean, response_text=excluded.response_text, response_json=excluded.response_json, remark=excluded.remark, updated_at=now();

  UPDATE public.inspection_responses ir
  SET response_text = nullif(r ->> 'response_text', ''),
      response_json = CASE WHEN jsonb_typeof(r -> 'response_json') IN ('object', 'array') THEN r -> 'response_json' ELSE NULL END,
      observed_count = nullif(r ->> 'observed_count', '')::numeric,
      updated_at = now()
  FROM jsonb_array_elements(coalesce(p_payload -> 'canonical_responses', '[]'::jsonb)) r
  WHERE ir.inspection_id = v_id AND ir.item_code = r ->> 'item_code';

  RETURN jsonb_build_object('record_type', 'inspection', 'inspection_id', v_id,
    'status', v_result ->> 'status', 'overall_score', v_result -> 'overall_score',
    'total_points', v_result -> 'total_points', 'total_possible', v_result -> 'total_possible');
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_save_odchc_checklist_as_canonical_record(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_save_odchc_checklist_as_canonical_record(text, jsonb) TO authenticated;

COMMIT;
