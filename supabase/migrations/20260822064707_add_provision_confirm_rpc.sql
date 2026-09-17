CREATE OR REPLACE FUNCTION public.nmis_admin_confirm_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  UPDATE auth.users 
  SET confirmed_at = now(), 
      last_sign_in_at = now(),
      email_confirmed_at = now()
  WHERE id = p_user_id; 
END; 
$function$;