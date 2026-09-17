CREATE OR REPLACE FUNCTION public.nmis_admin_confirm_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
BEGIN 
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmed_at = now(),
    last_sign_in_at = now(),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"nmis_status": "active"}'::jsonb
  WHERE id = p_user_id; 
END; 
$function$;