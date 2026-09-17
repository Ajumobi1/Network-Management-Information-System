-- Register the supplied facility list without duplicating existing providers.
-- The only genuinely new identity in the supplied list is PRIMARY HEALTH CENTRE OBAILE.
-- All other supplied names are preserved as aliases to existing authoritative providers.

INSERT INTO public.providers (provider_code, provider_name, category, subcategory, ownership, state, lga, address, status, contract_status, credential_status, inspection_status, capitation_status)
SELECT 'NMIS-FAC-PHC-OBAILE', 'PRIMARY HEALTH CENTRE OBAILE', 'HOSPITAL', NULL, 'Government', 'Ondo', 'Akure North', 'Oba-Ile, Akure North, Ondo State', 'Active', 'Active', 'Approved', 'Compliant', 'Active'
WHERE NOT EXISTS (SELECT 1 FROM public.providers WHERE provider_code = 'NMIS-FAC-PHC-OBAILE' OR lower(regexp_replace(provider_name, '[^a-z0-9]', '', 'g')) = 'primaryhealthcentreobaile');

WITH provider_for_new AS (
  SELECT id FROM public.providers WHERE provider_code = 'NMIS-FAC-PHC-OBAILE' OR lower(regexp_replace(provider_name, '[^a-z0-9]', '', 'g')) = 'primaryhealthcentreobaile' LIMIT 1
), alias_rows(provider_id, alias_name, normalized_alias) AS (
  SELECT 'f7ed9f8e-c0c6-4758-a064-6cbe652655db'::uuid, 'ADULOJU HOSPITAL AKOKO SOUTH', 'adulojuhospitalakokosouth'
  UNION ALL
  SELECT '05992e3b-f6e4-4828-bf4a-2351f18bea74'::uuid, 'AKINTAN MEMORIAL HOSPITAL (CLINIC) AKURE SOUTH', 'akintanmemorialhospitalclinicakuresouth'
  UNION ALL
  SELECT 'c5529b21-20a8-4678-a406-593b796ad715'::uuid, 'AKURE ANGLICAN DIOC. MED. CENTER ANGLICAN COMMUNITY', 'akureanglicandiocmedcenteranglicancommunity'
  UNION ALL
  SELECT '2b8495eb-79f2-4f9e-9c07-db8d3e0c023e'::uuid, 'BISHOP AWOSIKA MEMORIAL HOSPITAL ONDO', 'bishopawosikamemorialhospitalondo'
  UNION ALL
  SELECT '5ecb05a9-1677-45e6-8e32-76c537dec5ff'::uuid, 'BOLCOM HOSPITAL AKURE', 'bolcomhospitalakure'
  UNION ALL
  SELECT 'f0713a72-2cf9-42ab-9371-0682bc4e8149'::uuid, 'CHRIST BAY CONS. CLINIC FUTA SOUTHGATE AKURE', 'christbayconsclinicfutasouthgateakure'
  UNION ALL
  SELECT '7eac0524-951e-4b7f-975e-efe5b09820a0'::uuid, 'COLLEGE OF HEALTH CLINIC ODA RD AKURE', 'collegeofhealthclinicodardakure'
  UNION ALL
  SELECT 'd3417dcc-671e-4b41-b793-3c4050ea733d'::uuid, 'COMPREHENSIVE HEALTH CENTRE AROGBO', 'comprehensivehealthcentrearogbo'
  UNION ALL
  SELECT 'df72441f-1a6d-4512-b73b-6047165958e9'::uuid, 'COMPREHENSIVE HEALTH CENTRE ARAKALE AKURE', 'comprehensivehealthcentrearakaleakure'
  UNION ALL
  SELECT 'b805bd4d-4432-4060-9388-7bda53830feb'::uuid, 'DEBORAH MULTISPECIALIST HOSPITAL AND DIAGNOSTIC CENTRE AKURE', 'deborahmultispecialisthospitalanddiagnosticcentreakure'
  UNION ALL
  SELECT '8d332cbd-1e35-4156-940a-851b5727ea27'::uuid, 'DELIGHT SPECIALIST CLINICS AND MATERNITY AKURE', 'delightspecialistclinicsandmaternityakure'
  UNION ALL
  SELECT '73509910-41b4-4cf5-b04a-43d09c9fe90c'::uuid, 'DIAMOND MEDICAL CLINIC IKARE AKOKO', 'diamondmedicalclinicikareakoko'
  UNION ALL
  SELECT '47082686-efd9-4384-b23c-00459abd0481'::uuid, 'ETON CLINIC & MATERNITY OBA-ILE', 'etonclinicmaternityobaile'
  UNION ALL
  SELECT 'feed36f2-9dfb-4145-8dcf-4ee8f5f1d1d7'::uuid, 'FEDERAL MEDICAL CENTRE OWO', 'federalmedicalcentreowo'
  UNION ALL
  SELECT 'c9770338-23e5-48ff-afc6-a724f33c1fa4'::uuid, 'FUTA TEACHING HOSPITAL AKURE', 'futateachinghospitalakure'
  UNION ALL
  SELECT 'f5295e67-6eaa-4cba-b66e-470e725bd9f9'::uuid, 'GENERAL HOSPITAL ARAROMI-OBU', 'generalhospitalararomiobu'
  UNION ALL
  SELECT 'd8829d49-4115-4389-ae5f-723272b13133'::uuid, 'GENERAL HOSPITAL BOLORUNDURO', 'generalhospitalbolorunduro'
  UNION ALL
  SELECT '6abaa7c2-f7e1-4f08-99eb-e7651998247d'::uuid, 'GENERAL HOSPITAL IDANRE', 'generalhospitalidanre'
  UNION ALL
  SELECT '485c3eef-7386-4441-a21e-4b996fdb8e38'::uuid, 'GENERAL HOSPITAL IDO-ANI', 'generalhospitalidoani'
  UNION ALL
  SELECT 'd71a2ec6-b1ec-48a3-9e5b-8e5f8c3d4a14'::uuid, 'GENERAL HOSPITAL IGBARA-OKE', 'generalhospitaligbaraoke'
  UNION ALL
  SELECT '5247393f-d07f-4db0-b772-af964fd17a76'::uuid, 'GENERAL HOSPITAL IGBEKEBO', 'generalhospitaligbekebo'
  UNION ALL
  SELECT 'b413df83-f8eb-4fd6-ac0c-19379eca7a5d'::uuid, 'GENERAL HOSPITAL IGBOKODA', 'generalhospitaligbokoda'
  UNION ALL
  SELECT '733fd304-2f04-4c83-aecd-a75df8bd9dae'::uuid, 'GENERAL HOSPITAL IGBOTAKO', 'generalhospitaligbotako'
  UNION ALL
  SELECT 'ce54c758-0f05-466d-840d-48db0d14a944'::uuid, 'GENERAL HOSPITAL IJU ITAOGBOLU', 'generalhospitalijuitaogbolu'
  UNION ALL
  SELECT '876ce77b-533a-4c21-a4d9-863697834773'::uuid, 'GENERAL HOSPITAL IPE-AKOKO', 'generalhospitalipeakoko'
  UNION ALL
  SELECT '51e44438-f0db-40e6-a7d4-957c952f8e3f'::uuid, 'GENERAL HOSPITAL IRUN AKOKO', 'generalhospitalirunakoko'
  UNION ALL
  SELECT 'c542f9ea-4ccb-42cf-9ff2-9ae1af56cb56'::uuid, 'GENERAL HOSPITAL IWARO OKA', 'generalhospitaliwarooka'
  UNION ALL
  SELECT 'd84813ad-6ffe-42c0-adee-f1bed1e55791'::uuid, 'GENERAL HOSPITAL ODE-IRELE', 'generalhospitalodeirele'
  UNION ALL
  SELECT 'c2de4c06-eab9-4449-841a-afa53f2124b8'::uuid, 'GENERAL HOSPITAL ILE-OLUJI', 'generalhospitalileoluji'
  UNION ALL
  SELECT '976b0344-e83d-4dfe-903c-4864551c90fe'::uuid, 'GENERAL HOSPITAL ORE', 'generalhospitalore'
  UNION ALL
  SELECT '21bdff1b-8d68-438d-a262-e0ffa1f65852'::uuid, 'GENERAL HOSPITAL OWO', 'generalhospitalowo'
  UNION ALL
  SELECT '8d81e2e4-6f9a-4604-a5d6-dfc50dfcf8be'::uuid, 'GOODIES CLINIC & MAT IFE RD ONDO', 'goodiesclinicmatiferdondo'
  UNION ALL
  SELECT '57d05e7d-cf79-4a80-81ed-dd4b535592d9'::uuid, 'HOPE HOSPITAL & MATERNITY PALACE ROAD IDANRE', 'hopehospitalmaternitypalaceroadidanre'
  UNION ALL
  SELECT 'bb7b33b0-316a-4051-90c7-794936c31e32'::uuid, 'J&E FATUNLA HOSPITAL OKEARO TITUN AKURE', 'jefatunlahospitalokearotitunakure'
  UNION ALL
  SELECT 'd9c7fdba-72d2-452f-9edb-8303281edde6'::uuid, 'KAYMAS MEDICAL CENTRE AKURE SOUTH', 'kaymasmedicalcentreakuresouth'
  UNION ALL
  SELECT 'd9c7fdba-72d2-452f-9edb-8303281edde6'::uuid, 'KINGS ROYAL MEDICLINIC ILEKUN ODA ROAD AKURE', 'kingsroyalmediclinicilekunodaroadakure'
  UNION ALL
  SELECT '604a4cea-0880-4a30-ac21-33b076719cad'::uuid, 'LIFECARE HOSPITAL ORITA ODIGBO', 'lifecarehospitaloritaodigbo'
  UNION ALL
  SELECT '25613f55-e72f-4a06-83e4-3efbc6c59354'::uuid, 'MAO HOSPITALS GBANGBALOGUN AKURE', 'maohospitalsgbangbalogunakure'
  UNION ALL
  SELECT '2ac1d9d8-7623-4b96-9442-67b4581050ea'::uuid, 'MERCY SPECIALIST HOSPITAL GBOGI STR AKURE', 'mercyspecialisthospitalgbogistrakure'
  UNION ALL
  SELECT '27ccb534-82d2-462e-bf6f-a6ba2e115968'::uuid, 'MERCYLAND HOSPITAL ADEYEMI RD ONDO', 'mercylandhospitaladeyemirdondo'
  UNION ALL
  SELECT '8532ec98-441b-4a7b-8ffc-46f9629a98b9'::uuid, 'NETCARE MULTISPECIALTY HOSPITAL AKURE', 'netcaremultispecialtyhospitalakure'
  UNION ALL
  SELECT '189f5216-ec51-4f32-9bb4-cb549a63b8fa'::uuid, 'NEW DAY MEDICAL CENTER IJAPO ESTATE AKURE', 'newdaymedicalcenterijapoestateakure'
  UNION ALL
  SELECT '5e573cd1-74b6-4e7f-b0ec-0b5a60029d6e'::uuid, 'OBA ADEUSI GENERAL HOSPITAL IFON', 'obaadeusigeneralhospitalifon'
  UNION ALL
  SELECT 'e5127882-ac9f-4257-87ab-d140de2f8176'::uuid, 'OMOLOLU HOSPITAL OKE IJEBU AKURE', 'omololuhospitalokeijebuakure'
  UNION ALL
  SELECT '08ccd400-9a19-4447-aa6a-e43b6614ace6'::uuid, 'ONDO STATE REFERENCE HOSPITAL IGBATORO ROAD AKURE', 'ondostatereferencehospitaligbatororoadakure'
  UNION ALL
  SELECT '5cb18aa8-c05f-47c8-a3d6-41bd8f55d380'::uuid, 'PEACE MED CLINIC ORE', 'peacemedclinicore'
  UNION ALL
  SELECT '44e1d1ca-ab01-4326-b666-6da93cb431db'::uuid, 'PIMA HOSPITAL ORE', 'pimahospitalore'
  UNION ALL
  SELECT 'b1850333-7181-4b22-9a4c-4e5851cbd2e2'::uuid, 'POLICE MEDICAL SERVICES ALAGBAKA AKURE', 'policemedicalservicesalagbakaakure'
  UNION ALL
  SELECT '6bf65b2f-7ef4-4c30-98c2-848677ac0b7b'::uuid, 'PRIMARY HEALTH CENTRE ISHAKUNMI', 'primaryhealthcentreishakunmi'
  UNION ALL
  SELECT 'b7409839-99b3-4857-8702-b26da77b0f6f'::uuid, 'PRIMARY HEALTH CENTRE AJAGBA 1', 'primaryhealthcentreajagba1'
  UNION ALL
  SELECT '8dc2cc08-0632-4399-9ba7-6a27591095b6'::uuid, 'PRIMARY HEALTH CENTRE ARIGIDI', 'primaryhealthcentrearigidi'
  UNION ALL
  SELECT '966d73e7-b7e5-4a64-bb35-31929c79ffaf'::uuid, 'PRIMARY HEALTH CENTRE EMURE ILE', 'primaryhealthcentreemureile'
  UNION ALL
  SELECT '06fed4a4-c22e-45b9-9471-0fd89b0d33c7'::uuid, 'PRIMARY HEALTH CENTRE IJARE', 'primaryhealthcentreijare'
  UNION ALL
  SELECT 'a0d60d75-09ad-408c-be19-ccdb7aa51bb0'::uuid, 'PRIMARY HEALTH CENTRE ILARA II', 'primaryhealthcentreilaraii'
  UNION ALL
  SELECT '34fef302-6311-4db3-a01b-125d51573b50'::uuid, 'PRIMARY HEALTH CENTRE ILE OLUJI', 'primaryhealthcentreileoluji'
  UNION ALL
  SELECT 'c81e9498-5da1-4ac3-9af3-f8e792785b25'::uuid, 'PRIMARY HEALTH CENTRE IPELE', 'primaryhealthcentreipele'
  UNION ALL
  SELECT 'd779f4c7-573e-4550-b050-eab2f1a3be7d'::uuid, 'PRIMARY HEALTH CENTRE ISUA OKE', 'primaryhealthcentreisuaoke'
  UNION ALL
  SELECT '5c8ac2f2-863a-452b-a42f-e79aa99dfdd1'::uuid, 'PRIMARY HEALTH CENTRE MAROKO', 'primaryhealthcentremaroko'
  UNION ALL
  SELECT provider_for_new.id, 'PRIMARY HEALTH CENTRE OBAILE', 'primaryhealthcentreobaile' FROM provider_for_new
  UNION ALL
  SELECT 'a849a3cb-1757-4c6e-bc36-9d880ea146ed'::uuid, 'PRIMARY HEALTH CENTRE ODE AYE 1', 'primaryhealthcentreodeaye1'
  UNION ALL
  SELECT 'e9aba5bc-41d6-454a-9218-20fe97c86516'::uuid, 'PRIMARY HEALTH CENTRE OKEIGBO', 'primaryhealthcentreokeigbo'
  UNION ALL
  SELECT '7ad6dd0f-59ce-41cd-939f-be4653c693af'::uuid, 'PRIMARY HEALTH CENTRE OWASE', 'primaryhealthcentreowase'
  UNION ALL
  SELECT 'a8e9e4e4-765b-4e4e-a4a0-ddb1eea9360c'::uuid, 'PRIMARY HEALTH CENTRE OWENA', 'primaryhealthcentreowena'
  UNION ALL
  SELECT 'da4b84b5-5ad5-43ee-a68a-a3863ebc436c'::uuid, 'PRIMARY HEALTH CENTRE OWENA BRIDGE', 'primaryhealthcentreowenabridge'
  UNION ALL
  SELECT '0d9363ae-cafe-40c7-b386-8b6f1f6dac91'::uuid, 'PRIMARY HEALTH CENTRE PANAPANA ORE', 'primaryhealthcentrepanapanaore'
  UNION ALL
  SELECT '41979b02-e631-46c7-9b05-e7e28c5d6ce5'::uuid, 'PRIMARY HEALTH CENTRE ZION PEPE', 'primaryhealthcentrezionpepe'
  UNION ALL
  SELECT '0e8ddaa8-fdc7-4874-b7a1-ac7ed21093d5'::uuid, 'PRIMARY HEALTH CLINIC DANJUMA AKURE', 'primaryhealthclinicdanjumaakure'
  UNION ALL
  SELECT 'b751127e-b117-4948-bd3d-5bb5871d3a29'::uuid, 'PRIMARY HEALTH CLINIC IGOBA', 'primaryhealthclinicigoba'
  UNION ALL
  SELECT 'd4e8352a-965a-4ce1-8f19-4035bd7482d8'::uuid, 'PRIMARY HEALTH CLINIC OKELUSE COTTAGE', 'primaryhealthclinicokelusecottage'
  UNION ALL
  SELECT 'dcb31f00-714a-48a4-9777-5977555d51e0'::uuid, 'REDEEMER HOSPITAL ILAJE', 'redeemerhospitalilaje'
  UNION ALL
  SELECT '9cd7f2b1-14ff-4071-881b-7e112fedc1e8'::uuid, 'RUFUS GIWA MEMORIAL HOSPITAL OKE AGBE', 'rufusgiwamemorialhospitalokeagbe'
  UNION ALL
  SELECT '2d14e20f-fb1b-4666-a9c4-dad9b409e933'::uuid, 'SCKYE HOSPITAL OBA ADESIDA RD AKURE', 'sckyehospitalobaadesidardakure'
  UNION ALL
  SELECT '43624ac8-e8d8-4662-9ae2-531ec7dc8702'::uuid, 'SIJUWADE SPECIALIST HOSPITAL SIJUWADE AKURE', 'sijuwadespecialisthospitalsijuwadeakure'
  UNION ALL
  SELECT '47ab58ae-8da0-45d8-b19e-9836ecf6c8d8'::uuid, 'SIMLON HOSPITAL OFF ILESHA RD AKURE', 'simlonhospitaloffileshardakure'
  UNION ALL
  SELECT '97b45945-a52f-468c-abec-f9e94b1811d9'::uuid, 'ST MICHAELS HOSPITAL DANJUMA AKURE', 'stmichaelshospitaldanjumaakure'
  UNION ALL
  SELECT '21865086-4d05-4a1a-bf31-759fbcfd5002'::uuid, 'STATE SPECIALIST HOSPITAL OKE-ARO AKURE', 'statespecialisthospitalokearoakure'
  UNION ALL
  SELECT '5a59de3d-e52c-4626-b8a0-944bb613ada4'::uuid, 'STATE SPECIALIST HOSPITAL ONDO', 'statespecialisthospitalondo'
  UNION ALL
  SELECT 'e6451ced-b804-4568-bc74-d7676a0f55af'::uuid, 'STATE SPECIALIST HOSPITAL IKARE', 'statespecialisthospitalikare'
  UNION ALL
  SELECT '54966170-aa02-4144-9d01-877356729d9c'::uuid, 'STATE SPECIALIST HOSPITAL OKITIPUPA', 'statespecialisthospitalokitipupa'
  UNION ALL
  SELECT '2d970fe2-05ec-4309-b4ce-f14071b3a289'::uuid, 'TOPTARI MEDICALS AGADAGBA-OBON', 'toptarimedicalsagadagbaobon'
  UNION ALL
  SELECT 'eb1ff010-d61b-4496-b453-0aae58828fb2'::uuid, 'TOTAL CARE CLINIC UGBE AKOKO', 'totalcareclinicugbeakoko'
  UNION ALL
  SELECT 'f8e0c236-658b-4567-b3ce-9e0dc87885f7'::uuid, 'UNIMEDTH LAJE ONDO', 'unimedthlajeondo'
  UNION ALL
  SELECT '95b40fc6-efd3-43c9-bd3d-2a679e735945'::uuid, 'WESTPOINT HOSPITAL OKITIPUPA', 'westpointhospitalokitipupa'
)
INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias, source, confidence, active)
SELECT provider_id, alias_name, normalized_alias, 'manual-reconciliation-2026-08-19', 1.00, true FROM alias_rows
ON CONFLICT (provider_id, normalized_alias) DO UPDATE
SET alias_name = EXCLUDED.alias_name, source = EXCLUDED.source, confidence = EXCLUDED.confidence, active = true, updated_at = now();

