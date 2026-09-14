import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

sql_path = '/home/ubuntu/nmis-frontend-authoritative/insert_2025_aliases.sql'
with open(sql_path, 'r') as f:
    sql_content = f.read()

# Execute via rpc or direct SQL if table insert is supported directly
# Since we have the data, we can also insert via python insert directly or via rpc execute_sql if available.
# Let's inspect if supabase python client can do rpc or if we can insert records directly using supabase table().insert()

records = [
    {
        "provider_id": "f0713a72-2cf9-42ab-9371-0682bc4e8149",
        "alias_name": "CHRISTBAY CONSULTANT HOSPITAL AKURE",
        "normalized_alias": "christbayconsultanthospitalakure",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "b805bd4d-4432-4060-9388-7bda53830feb",
        "alias_name": "DEBORAH MULTI SPECIALIST  HOS  AND DIAGNOSTICS CENTER",
        "normalized_alias": "deborahmultispecialistfosanddiagnosticscenter",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "47082686-efd9-4384-b23c-00459abd0481",
        "alias_name": "ETON CLINIC OBAILE AKURE",
        "normalized_alias": "etonclinicobaileakure",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "bb7b33b0-316a-4051-90c7-794936c31e32",
        "alias_name": "J&E FATULA HOSPITAL OKEARO AKURE",
        "normalized_alias": "jefatulahospitalokearoakure",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "d9c7fdba-72d2-452f-9edb-8303281edde6",
        "alias_name": "KINGS MEDIC ROYAL CLINIC, ODA ROAD, AKURE",
        "normalized_alias": "kingsmedicroyalclinicodaroadakure",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "27ccb534-82d2-462e-bf6f-a6ba2e115968",
        "alias_name": "MERCYLAND MEDICAL CENTER, ONDO",
        "normalized_alias": "mercylandmedicalcenterondo",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "8532ec98-441b-4a7b-8ffc-46f9629a98b9",
        "alias_name": "NETCARE MULTISPECIALIST HOSPITAL IJAPO",
        "normalized_alias": "netcaremultispecialisthospitalijapo",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "e9aba5bc-41d6-454a-9218-20fe97c86516",
        "alias_name": "OKEIGBO CHC ORANGE HEALTH INSURANCE SCHEME",
        "normalized_alias": "okeigbochcorangehealthinsurancescheme",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "feed36f2-9dfb-4145-8dcf-4ee8f5f1d1d7",
        "alias_name": "REMITA FUND HOLDING ACCOUNT FMC OWO",
        "normalized_alias": "remitafundholdingaccountfmcowo",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    },
    {
        "provider_id": "f8e0c236-658b-4567-b3ce-9e0dc87885f7",
        "alias_name": "UNIVERSITY OF MEDICAL SCIENCES TEACHING HOSPITAL",
        "normalized_alias": "universityofmedicalsciencesteachinghospital",
        "source": "manual_2025_workbook",
        "confidence": 0.95,
        "active": True
    }
]

for rec in records:
    try:
        res = supabase.table('provider_name_aliases').insert(rec).execute()
        print(f"Upserted alias: {rec['alias_name']}")
    except Exception as e:
        print(f"Error upserting {rec['alias_name']}: {e}")
