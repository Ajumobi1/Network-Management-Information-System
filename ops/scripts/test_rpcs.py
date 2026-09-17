import os
import requests
import json

url = f"{os.environ.get('SUPABASE_URL')}/rest/v1/rpc/"
headers = {
    "apikey": os.environ.get('SUPABASE_KEY'),
    "Authorization": f"Bearer {os.environ.get('SUPABASE_KEY')}",
    "Content-Type": "application/json"
}

def test_rpc(name, params):
    print(f"Testing {name}...")
    try:
        response = requests.post(f"{url}{name}", headers=headers, data=json.dumps(params))
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Error: {response.text}")
        else:
            print(f"Success: {json.dumps(response.json())[:100]}...")
    except Exception as e:
        print(f"Exception: {e}")

params = {
    "p_search": None,
    "p_state": None,
    "p_lga": None,
    "p_category": "HOSPITAL",
    "p_ownership": "Government",
    "p_status": "active",
    "p_contract_status": None,
    "p_credential_status": None,
    "p_inspection_status": None,
    "p_capitation_status": None,
    "p_page_size": 10,
    "p_offset": 0,
    "p_sort": "provider_name"
}

# The list RPC has more params
list_params = params.copy()
list_params["p_service"] = None

# The others have fewer
base_params = {k: v for k, v in params.items() if k not in ["p_page_size", "p_offset", "p_sort"]}

test_rpc("nmis_list_provider_directory", list_params)
test_rpc("nmis_count_provider_directory", base_params)
test_rpc("nmis_provider_directory_summary", base_params)
