BEGIN;

DROP POLICY IF EXISTS "inspection_reports_authenticated_insert" ON storage.objects;
CREATE POLICY "inspection_reports_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspection-reports' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$' AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector']::text[]));

DROP POLICY IF EXISTS "inspection_reports_authenticated_update" ON storage.objects;
CREATE POLICY "inspection_reports_authenticated_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'inspection-reports' AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector']::text[])) WITH CHECK (bucket_id = 'inspection-reports' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.pdf$' AND public.nmis_has_any_role(ARRAY['super-admin', 'executive', 'head-of-network', 'network-officer', 'inspector']::text[]));

COMMIT;