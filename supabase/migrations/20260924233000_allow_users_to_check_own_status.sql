-- Allow each authorized NMIS user to verify their own account status.
-- Super-admins retain the ability to check another user's status.
-- This fixes the session heartbeat/login flow for network-officer accounts
-- without granting them access to arbitrary user-status information.

create or replace function public.nmis_check_user_status(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_status text;
  v_is_super_admin boolean := public.nmis_has_any_role(array['super-admin']);
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not v_is_super_admin and p_user_id <> auth.uid() then
    raise exception 'ACCESS_RESTRICTED';
  end if;

  select coalesce(
    raw_app_meta_data->>'nmis_status',
    case
      when banned_until is not null then 'locked'
      when confirmed_at is null then 'pending'
      else 'active'
    end
  )
  into v_status
  from auth.users
  where id = p_user_id;

  if not found then
    return 'deleted';
  end if;

  return v_status;
end;
$function$;
