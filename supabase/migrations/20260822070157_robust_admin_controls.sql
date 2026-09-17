CREATE OR REPLACE FUNCTION public.nmis_admin_update_user_status(p_user_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  -- 1. Update the actual ban status for Supabase Auth enforcement
  IF p_status = 'suspended' OR p_status = 'locked' THEN 
    UPDATE auth.users SET banned_until = '3000-01-01'::timestamptz WHERE id = p_user_id; 
  ELSE 
    UPDATE auth.users SET banned_until = NULL WHERE id = p_user_id; 
  END IF; 

  -- 2. Update the NMIS-specific metadata for UI tracking
  UPDATE auth.users 
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('nmis_status', p_status)
  WHERE id = p_user_id;
END; 
$function$;

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
    COALESCE(u.raw_app_meta_data->>'nmis_status', 
      CASE 
        WHEN u.banned_until IS NOT NULL THEN 'suspended' 
        WHEN u.confirmed_at IS NULL THEN 'pending' 
        ELSE 'active' 
      END
    )::text,
    u.last_sign_in_at 
  FROM auth.users u; 
END; 
$function$;