-- Grant execute on all NMIS secure contract functions to authenticated role
GRANT EXECUTE ON FUNCTION public.nmis_dashboard_intelligence(integer, integer, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_count_provider_directory(text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_provider_directory_summary(text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_list_provider_directory(text, text, text, text, text, text, text, text, text, text, integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_has_any_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nmis_current_role() TO authenticated;
