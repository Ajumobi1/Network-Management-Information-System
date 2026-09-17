CREATE OR REPLACE FUNCTION public.nmis_check_user_status(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, auth
AS $function$ 
DECLARE
  v_status text;
BEGIN 
  SELECT 
    COALESCE(raw_app_meta_data->>'nmis_status', 
      CASE 
        WHEN banned_until IS NOT NULL THEN 'locked' 
        WHEN confirmed_at IS NULL THEN 'pending' 
        ELSE 'active' 
      END
    ) INTO v_status
  FROM auth.users 
  WHERE id = p_user_id;
  
  RETURN v_status;
END; 
$function$;

GRANT EXECUTE ON FUNCTION public.nmis_check_user_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_check_user_status(uuid) TO anon;