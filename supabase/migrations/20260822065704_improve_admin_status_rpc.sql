CREATE OR REPLACE FUNCTION public.nmis_admin_update_user_status(p_user_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  IF p_status = 'suspended' OR p_status = 'locked' THEN 
    UPDATE auth.users SET banned_until = '3000-01-01'::timestamptz WHERE id = p_user_id; 
  ELSE 
    UPDATE auth.users SET banned_until = NULL WHERE id = p_user_id; 
  END IF; 
END; 
$function$;