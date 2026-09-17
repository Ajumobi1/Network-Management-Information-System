CREATE OR REPLACE FUNCTION public.nmis_admin_list_users()
 RETURNS TABLE(id uuid, email text, full_name text, role text, status text, last_login timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  RETURN QUERY 
  SELECT 
    u.id, 
    u.email::text, 
    (u.raw_user_meta_data->>'full_name')::text, 
    (u.raw_app_meta_data->>'nmis_role')::text, 
    CASE 
      WHEN u.banned_until IS NOT NULL THEN 'suspended' 
      WHEN u.confirmed_at IS NULL THEN 'pending' 
      ELSE 'active' 
    END, 
    u.last_sign_in_at 
  FROM auth.users u; 
END; 
$function$;