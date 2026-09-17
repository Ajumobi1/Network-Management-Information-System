ALTER FUNCTION public.nmis_admin_list_users() SET search_path = public, auth;
ALTER FUNCTION public.nmis_admin_update_user_role(uuid, text) SET search_path = public, auth;
ALTER FUNCTION public.nmis_admin_update_user_status(uuid, text) SET search_path = public, auth;
ALTER FUNCTION public.nmis_admin_delete_user(uuid) SET search_path = public, auth;