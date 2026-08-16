import json
import os
import re
from pathlib import Path

MANIFEST_PATH = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')
RESULTS_DIR = Path('/home/ubuntu/.mcp/tool-results')
PROVIDERS_FILE = Path('/home/ubuntu/.mcp/tool-results/2026-08-15_20-44-43.510716489_supabase_execute_sql_dffef60b.json')

def load_json_results(pattern):
    data = []
    files = sorted(RESULTS_DIR.glob(pattern), key=os.path.getmtime)
    for file in files:
        with open(file, 'r') as f:
            content = json.load(f)
            if 'result' in content:
                text = content['result']
                # Find the JSON array start and end within the untrusted-data tags
                start = text.find('[{"policy_number"')
                end = text.rfind('}]') + 2
                if start != -1 and end != -1:
                    json_str = text[start:end]
                    try:
                        data.extend(json.loads(json_str))
                    except Exception as e:
                        print(f"Error parsing JSON in {file}: {e}")
    return data

# Load database identities
print("Loading database identities...")
db_identities = load_json_results('2026-08-15_20-45-*_supabase_execute_sql_*.json')
print(f"Loaded {len(db_identities)} database records.")

# Index database records by policy number
db_by_policy = {}
for row in db_identities:
    policy = row['policy_number'].strip().upper()
    if policy not in db_by_policy:
        db_by_policy[policy] = []
    db_by_policy[policy].append(row)

# Load providers and build name resolver
print("Building provider resolver...")
with open(PROVIDERS_FILE, 'r') as f:
    prov_content = json.load(f)
    text = prov_content['result']
    start = text.find('[{"id"')
    end = text.rfind('}]') + 2
    providers_raw = json.loads(text[start:end])

provider_resolver = {}
for row in providers_raw:
    pid = row['id']
    name = row['provider_name'].strip().upper()
    alias = row['alias_name'].strip().upper() if row.get('alias_name') else name
    provider_resolver[name] = pid
    provider_resolver[alias] = pid

# Load workbook manifest
print("Auditing workbook rows...")
match_count = 0
name_mismatch = 0
facility_mismatch = 0
policy_not_found = 0
ambiguous_match = 0
total_rows = 0

def normalize_name(name):
    if not name: return ""
    return re.sub(r'\s+', ' ', name.strip().upper())

with MANIFEST_PATH.open('r') as f:
    for line in f:
        total_rows += 1
        row = json.loads(line)
        policy = row['policy_number'].strip().upper()
        wb_name = normalize_name(row['beneficiary_name'])
        wb_facility = row['facility_name'].strip().upper()
        
        wb_provider_id = provider_resolver.get(wb_facility)
        
        if policy not in db_by_policy:
            policy_not_found += 1
            continue
            
        candidates = db_by_policy[policy]
        matches = []
        
        for cand in candidates:
            db_name = normalize_name(f"{cand['first_name']} {cand['last_name']}")
            db_provider_id = cand['provider_id']
            
            name_match = (wb_name == db_name)
            # If we don't have a direct ID match, try a name-based provider match
            facility_match = (wb_provider_id == db_provider_id)
            
            if name_match:
                matches.append(cand)
                if not facility_match:
                    # Log the facility mismatch for records where policy and name matched
                    facility_mismatch += 1
                    if facility_mismatch <= 10:
                        print(f"Facility Variance: Policy={policy}, Name={wb_name}, Workbook_Fac='{wb_facility}', DB_Fac_ID={db_provider_id}")
        
        if len(matches) == 1:
            match_count += 1
        elif len(matches) > 1:
            ambiguous_match += 1
        else:
            # Check why it failed
            has_policy = True
            has_name = any(normalize_name(f"{c['first_name']} {c['last_name']}") == wb_name for c in candidates)
            has_facility = any(c['provider_id'] == wb_provider_id for c in candidates)
            
            if not has_name:
                name_mismatch += 1
            elif not has_facility:
                facility_mismatch += 1
                if facility_mismatch <= 20:
                    print(f"Facility Mismatch: Workbook='{wb_facility}' vs DB_Provider_ID='{candidates[0]['provider_id']}'")

print(f"\nAudit Results for {total_rows} Workbook Rows:")
print(f"Exact Composite Matches: {match_count} ({match_count/total_rows:.1%})")
print(f"Policy Not Found in DB: {policy_not_found}")
print(f"Name Mismatches: {name_mismatch}")
print(f"Facility Mismatches: {facility_mismatch}")
print(f"Ambiguous Matches: {ambiguous_match}")
