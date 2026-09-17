-- Allow accredited facilities that are not yet present in the provider directory.
-- The trusted inspection contract still validates the user role, active template,
-- checklist responses, signed submission requirements, and audit event. A null
-- provider_id is represented by the facility profile captured in the payload.
do $$
declare
  v_definition text;
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'nmis_save_structured_inspection'
    and pg_get_function_identity_arguments(p.oid) = 'p_inspection_id uuid, p_payload jsonb'
  limit 1;

  if v_definition is null then
    raise exception 'nmis_save_structured_inspection function not found';
  end if;

  v_definition := replace(
    v_definition,
    $remove$  IF v_provider_id IS NULL THEN RAISE EXCEPTION 'VALIDATION_ERROR: Provider is required'; END IF;
$remove$,
    ''
  );

  execute v_definition;
end $$;
