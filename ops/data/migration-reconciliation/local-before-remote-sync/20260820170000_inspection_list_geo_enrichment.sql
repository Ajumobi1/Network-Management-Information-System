-- Enrich inspection list with geographic data for live tracking
CREATE OR REPLACE FUNCTION public.nmis_list_inspections(p_provider_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(t)
    FROM (
      SELECT 
        i.id,
        i.provider_id,
        p.provider_name,
        p.provider_code,
        p.address as provider_address,
        p.latitude as provider_latitude,
        p.longitude as provider_longitude,
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
      JOIN public.providers p ON i.provider_id = p.id
      WHERE (p_provider_id IS NULL OR i.provider_id = p_provider_id)
      ORDER BY i.scheduled_date DESC, i.created_at DESC
    ) t
  );
END;
$$;
