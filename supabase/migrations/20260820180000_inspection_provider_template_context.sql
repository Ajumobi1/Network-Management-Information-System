BEGIN;

-- Preserve the inspection-list access contract while enriching each row with
-- authoritative provider and template context for edit/re-submit workflows.
CREATE OR REPLACE FUNCTION public.nmis_list_inspections(p_provider_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_inspections jsonb;
BEGIN
  IF NOT COALESCE(public.nmis_has_any_role(ARRAY['super-admin','head-of-network','network-officer','inspector','finance','executive']), false) THEN
    RAISE EXCEPTION 'ACCESS_RESTRICTED: Insufficient role for inspection records';
  END IF;

  SELECT COALESCE(jsonb_agg(t ORDER BY t.scheduled_date DESC, t.created_at DESC), '[]'::jsonb)
  INTO v_inspections
  FROM (
    SELECT
      i.id,
      i.provider_id,
      p.provider_name,
      p.provider_code,
      p.category AS provider_category,
      p.ownership AS provider_ownership,
      p.address AS provider_address,
      p.latitude AS provider_latitude,
      p.longitude AS provider_longitude,
      i.template_id,
      it.code AS template_code,
      it.facility_type_code,
      i.inspection_type,
      i.scheduled_date,
      i.inspector_name,
      i.status,
      i.score,
      i.rating,
      i.credentialing_points,
      i.credentialing_possible,
      i.accreditation_points,
      i.accreditation_possible,
      i.findings,
      i.corrective_actions,
      i.created_at
    FROM public.inspections i
    LEFT JOIN public.providers p ON p.id = i.provider_id
    LEFT JOIN public.inspection_templates it ON it.id = i.template_id
    WHERE p_provider_id IS NULL OR i.provider_id = p_provider_id
  ) t;

  RETURN v_inspections;
END;
$$;

REVOKE ALL ON FUNCTION public.nmis_list_inspections(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nmis_list_inspections(uuid) TO authenticated;

COMMIT;
