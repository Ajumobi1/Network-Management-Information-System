-- Existing confirmed accounts with one of the two supported NMIS roles are active
-- unless explicitly suspended/locked. This normalizes legacy accounts created
-- before nmis_status was consistently set during provisioning.

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{nmis_status}',
  '"active"'::jsonb,
  true
)
where raw_app_meta_data->>'nmis_role' in ('super-admin','network-officer')
  and confirmed_at is not null
  and banned_until is null
  and coalesce(raw_app_meta_data->>'nmis_status','') <> 'active';
