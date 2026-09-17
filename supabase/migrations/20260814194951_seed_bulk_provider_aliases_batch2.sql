-- Seed additional provider aliases for automatic workbook matching (Batch 2).
-- Using direct INSERT with manual normalization logic.

DO $$
DECLARE
    v_source text := 'manual-resolution';
BEGIN
    -- Ese Odo
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('d3417dcc-671e-4b41-b793-3c4050ea733d', 'COMPREHENSIVE HEALTH CENTRE  AROGBO', lower(regexp_replace('COMPREHENSIVE HEALTH CENTRE  AROGBO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('5247393f-d07f-4db0-b772-af964fd17a76', 'GENERAL HOSPITAL IGBEKEBO', lower(regexp_replace('GENERAL HOSPITAL IGBEKEBO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('2d970fe2-05ec-4309-b4ce-f14071b3a289', 'TOPTARI MEDICALS AGADAGBA-OBON', lower(regexp_replace('TOPTARI MEDICALS AGADAGBA-OBON', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Idanre
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('6abaa7c2-f7e1-4f08-99eb-e7651998247d', 'GENERAL HOSPITAL IDANRE', lower(regexp_replace('GENERAL HOSPITAL IDANRE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('57d05e7d-cf79-4a80-81ed-dd4b535592d9', 'HOPE HOSPITAL & MATERNITY, PALACE ROAD IDANRE', lower(regexp_replace('HOPE HOSPITAL & MATERNITY, PALACE ROAD IDANRE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('a8e9e4e4-765b-4e4e-a4a0-ddb1eea9360c', 'PRIMARY HEALTH CENTRE OWENA', lower(regexp_replace('PRIMARY HEALTH CENTRE OWENA', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ifedore
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('d71a2ec6-b1ec-48a3-9e5b-8e5f8c3d4a14', 'GENERAL HOSPITAL IGBARA-OKE', lower(regexp_replace('GENERAL HOSPITAL IGBARA-OKE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('06fed4a4-c22e-45b9-9471-0fd89b0d33c7', 'PRIMARY HEALTH CENTRE IJARE', lower(regexp_replace('PRIMARY HEALTH CENTRE IJARE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('a0d60d75-09ad-408c-be19-ccdb7aa51bb0', 'PRIMARY HEALTH CENTRE ILARA II', lower(regexp_replace('PRIMARY HEALTH CENTRE ILARA II', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ilaje
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('b413df83-f8eb-4fd6-ac0c-19379eca7a5d', 'GENERAL HOSPITAL IGBOKODA', lower(regexp_replace('GENERAL HOSPITAL IGBOKODA', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('41979b02-e631-46c7-9b05-e7e28c5d6ce5', 'PRIMARY HEALTH CENTRE ZION PEPE', lower(regexp_replace('PRIMARY HEALTH CENTRE ZION PEPE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('dcb31f00-714a-48a4-9777-5977555d51e0', 'REDEEMER HOSPITAL', lower(regexp_replace('REDEEMER HOSPITAL', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ile Oluji/Okeigbo
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('c2de4c06-eab9-4449-841a-afa53f2124b8', 'GENERAL HOSPITAL, ILE-OLUJI', lower(regexp_replace('GENERAL HOSPITAL, ILE-OLUJI', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('34fef302-6311-4db3-a01b-125d51573b50', 'PRIMARY HEALTH CENTRE ILE OLUJI', lower(regexp_replace('PRIMARY HEALTH CENTRE ILE OLUJI', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('e9aba5bc-41d6-454a-9218-20fe97c86516', 'PRIMARY HEALTH CENTRE OKEIGBO', lower(regexp_replace('PRIMARY HEALTH CENTRE OKEIGBO', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Irele
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('d84813ad-6ffe-42c0-adee-f1bed1e55791', 'GENERAL HOSPITAL ODE-IRELE', lower(regexp_replace('GENERAL HOSPITAL ODE-IRELE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('b7409839-99b3-4857-8702-b26da77b0f6f', 'PRIMARY HEALTH CENTRE AJAGBA 1', lower(regexp_replace('PRIMARY HEALTH CENTRE AJAGBA 1', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Odigbo
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('f5295e67-6eaa-4cba-b66e-470e725bd9f9', 'GENERAL HOSPITAL ARAROMI-OBU', lower(regexp_replace('GENERAL HOSPITAL ARAROMI-OBU', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('976b0344-e83d-4dfe-903c-4864551c90fe', 'GENERAL HOSPITAL, ORE', lower(regexp_replace('GENERAL HOSPITAL, ORE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('604a4cea-0880-4a30-ac21-33b076719cad', 'LIFECARE HOSPITAL ORITA', lower(regexp_replace('LIFECARE HOSPITAL ORITA', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('5cb18aa8-c05f-47c8-a3d6-41bd8f55d380', 'PEACE MED CLINIC ORE', lower(regexp_replace('PEACE MED CLINIC ORE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('44e1d1ca-ab01-4326-b666-6da93cb431db', 'PIMA HOSPITAL ORE', lower(regexp_replace('PIMA HOSPITAL ORE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('0d9363ae-cafe-40c7-b386-8b6f1f6dac91', 'PRIMARY HEALTH CENTRE PANAPANA ORE', lower(regexp_replace('PRIMARY HEALTH CENTRE PANAPANA ORE', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Okitipupa
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('733fd304-2f04-4c83-aecd-a75df8bd9dae', 'GENERAL HOSPITAL IGBOTAKO', lower(regexp_replace('GENERAL HOSPITAL IGBOTAKO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('a849a3cb-1757-4c6e-bc36-9d880ea146ed', 'PRIMARY HEALTH CENTRE ODE AYE 1', lower(regexp_replace('PRIMARY HEALTH CENTRE ODE AYE 1', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('54966170-aa02-4144-9d01-877356729d9c', 'STATE SPECIALIST HOSPITAL, OKITIPUPA', lower(regexp_replace('STATE SPECIALIST HOSPITAL, OKITIPUPA', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('95b40fc6-efd3-43c9-bd3d-2a679e735945', 'WESTPOINT HOSPITAL OKITIPUPA', lower(regexp_replace('WESTPOINT HOSPITAL OKITIPUPA', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ondo East
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('d8829d49-4115-4389-ae5f-723272b13133', 'GENERAL HOSPITAL BOLORUNDURO', lower(regexp_replace('GENERAL HOSPITAL BOLORUNDURO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('da4b84b5-5ad5-43ee-a68a-a3863ebc436c', 'PRIMARY HEALTH CENTRE OWENA BRIDGE', lower(regexp_replace('PRIMARY HEALTH CENTRE OWENA BRIDGE', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ondo West
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('8d81e2e4-6f9a-4604-a5d6-dfc50dfcf8be', 'GOODIES CLINIC & MAT  IFE RD ONDO', lower(regexp_replace('GOODIES CLINIC & MAT  IFE RD ONDO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('27ccb534-82d2-462e-bf6f-a6ba2e115968', 'MERCYLAND HOSPITAL  ADEYEMI RD ONDO', lower(regexp_replace('MERCYLAND HOSPITAL  ADEYEMI RD ONDO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('5c8ac2f2-863a-452b-a42f-e79aa99dfdd1', 'PRIMARY HEALTH CENTRE MAROKO', lower(regexp_replace('PRIMARY HEALTH CENTRE MAROKO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('5a59de3d-e52c-4626-b8a0-944bb613ada4', ' STATE SPECIALIST HOSPITAL ONDO', lower(regexp_replace(' STATE SPECIALIST HOSPITAL ONDO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('f8e0c236-658b-4567-b3ce-9e0dc87885f7', 'UNIMEDTHC LAJE ROAD,ONDO', lower(regexp_replace('UNIMEDTHC LAJE ROAD,ONDO', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Ose
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('485c3eef-7386-4441-a21e-4b996fdb8e38', 'GENERAL HOSPITAL IDO-ANI', lower(regexp_replace('GENERAL HOSPITAL IDO-ANI', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('5e573cd1-74b6-4e7f-b0ec-0b5a60029d6e', 'OBA ADEUSI GENERAL HOSPITAL IFON', lower(regexp_replace('OBA ADEUSI GENERAL HOSPITAL IFON', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('d4e8352a-965a-4ce1-8f19-4035bd7482d8', 'PRIMARY HEALTH CLINIC OKELUSE COTTAGE', lower(regexp_replace('PRIMARY HEALTH CLINIC OKELUSE COTTAGE', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;

    -- Owo
    INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source)
    VALUES 
    ('feed36f2-9dfb-4145-8dcf-4ee8f5f1d1d7', 'FEDERAL MEDICAL CENTRE OWO', lower(regexp_replace('FEDERAL MEDICAL CENTRE OWO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('21bdff1b-8d68-438d-a262-e0ffa1f65852', 'GENERAL HOSPITAL, OWO', lower(regexp_replace('GENERAL HOSPITAL, OWO', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('966d73e7-b7e5-4a64-bb35-31929c79ffaf', 'PRIMARY HEALTH CENTRE EMURE ILE', lower(regexp_replace('PRIMARY HEALTH CENTRE EMURE ILE', '[^a-zA-Z0-9]', '', 'g')), v_source),
    ('c81e9498-5da1-4ac3-9af3-f8e792785b25', 'PRIMARY HEALTH CENTRE IPELE', lower(regexp_replace('PRIMARY HEALTH CENTRE IPELE', '[^a-zA-Z0-9]', '', 'g')), v_source)
    ON CONFLICT (provider_id, normalized_alias) DO NOTHING;
END $$;
