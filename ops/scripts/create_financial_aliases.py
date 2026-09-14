import json

project_id = "tnklirwrnrdvbfjsdtel"

aliases = [
    {"provider_id": "08ccd400-9a19-4447-aa6a-e43b6614ace6", "alias_name": "REFERENCE HOSPITAL IGBATORO ROAD"},
    {"provider_id": "21865086-4d05-4a1a-bf31-759fbcfd5002", "alias_name": "STATE SPECIALIST HOSPITAL (ODCHC) ACCOUNT OKE-ARO"},
    {"provider_id": "c9770338-23e5-48ff-afc6-a724f33c1fa4", "alias_name": "STATE SPECIALIST HOSPITAL,AKURE REVENUE ACCOUNT"},
    {"provider_id": "c9770338-23e5-48ff-afc6-a724f33c1fa4", "alias_name": "STATE SPECIALIST HOSPITAL NHIS"},
    {"provider_id": "e5127882-ac9f-4257-87ab-d140de2f8176", "alias_name": "OMOLOLU HOSPITAL"},
    {"provider_id": "feed36f2-9dfb-4145-8dcf-4ee8f5f1d1d7", "alias_name": "REMITA FUND HOLDING ACCOUNT FMC OWO"},
    {"provider_id": "2d970fe2-05ec-4309-b4ce-f14071b3a289", "alias_name": "TOPTARI MEDICALS"},
    {"provider_id": "7ad6dd0f-59ce-41cd-939f-be4653c693af", "alias_name": "COMPREHENSIVE HEALTH CENTRE OWASE OKA"},
    {"provider_id": "e9aba5bc-41d6-454a-9218-20fe97c86516", "alias_name": "OKEIGBO CHC ORANGE HEALTH INSURANCE SCHEME"},
    {"provider_id": "47082686-efd9-4384-b23c-00459abd0481", "alias_name": "ETON CLINIC OBAILE AKURE"},
    {"provider_id": "bb7b33b0-316a-4051-90c7-794936c31e32", "alias_name": "J&E FATULA HOSPITAL OKEARO AKURE"},
    {"provider_id": "8532ec98-441b-4a7b-8ffc-46f9629a98b9", "alias_name": "NETCARE MULTISPECIALIST HOSPITAL IJAPO"},
    {"provider_id": "f0713a72-2cf9-42ab-9371-0682bc4e8149", "alias_name": "CHRISTBAY CONSULTANT HOSPITAL AKURE"},
    {"provider_id": "b805bd4d-4432-4060-9388-7bda53830feb", "alias_name": "DEBORAH MULTI SPECIALIST  HOS  AND DIAGNOSTICS CENTER"},
    {"provider_id": "dcb31f00-714a-48a4-9777-5977555d51e0", "alias_name": "REDEEMER HOSPITAL"},
    {"provider_id": "f8e0c236-658b-4567-b3ce-9e0dc87885f7", "alias_name": "UNIMEDTHC LAJE ROAD,ONDO"}
]

def normalize(text):
    return "".join(filter(str.isalnum, text.lower()))

sql = "INSERT INTO public.provider_name_aliases (provider_id, alias_name, normalized_alias) VALUES \n"
values = []
for a in aliases:
    norm = normalize(a['alias_name'])
    values.append(f"('{a['provider_id']}', '{a['alias_name']}', '{norm}')")

sql += ",\n".join(values)
sql += "\nON CONFLICT ON CONSTRAINT provider_alias_unique DO NOTHING;"

payload = {"project_id": project_id, "query": sql}
with open('execute_aliases_payload.json', 'w') as f:
    json.dump(payload, f, indent=2)

print("Payload generated in execute_aliases_payload.json")
