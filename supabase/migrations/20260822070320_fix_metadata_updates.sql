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
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('nmis_status', p_status)
  WHERE id = p_user_id;
END; 
$function$;

CREATE OR REPLACE FUNCTION public.nmis_admin_update_user_role(p_user_id uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('nmis_role', p_role) 
  WHERE id = p_user_id; 
END; 
$function$;