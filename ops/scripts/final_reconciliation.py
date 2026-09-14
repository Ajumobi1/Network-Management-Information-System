import json
import os
import re
import pandas as pd
from pathlib import Path
from collections import Counter

# Paths
DB_AGES_FILE = Path('/home/ubuntu/.mcp/tool-results/2026-08-15_20-58-58.514687002_supabase_execute_sql_1c0e35fd.json')
MANIFEST_PATH = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')
NULL_LIST = Path('/home/ubuntu/nmis-frontend-authoritative/JULY_NULL_AGES_REASONS.csv')

def normalize(s):
    if not s: return ""
    return str(s).strip().lower()

# 1. Load DB Records
print("Loading DB records...")
with open(DB_AGES_FILE, 'r') as f:
    content = json.load(f)
    text = content['result']
    start = text.find('[{"id"')
    end = text.rfind('}]') + 2
    db_records = json.loads(text[start:end])

# 2. Load Workbook Eligible Rows
print("Loading workbook eligible rows...")
wb_rows = []
with MANIFEST_PATH.open('r') as f:
    for line in f:
        r = json.loads(line)
        # Replicate the splitting logic used in the RPC script
        parts = r['beneficiary_name'].split()
        fname = parts[0] if parts else ""
        lname = " ".join(parts[1:]) if len(parts) > 1 else ""
        wb_rows.append({
            'policy': r['policy_number'],
            'fname': fname,
            'lname': lname,
            'age': r['age_source'],
            'full_name': r['beneficiary_name']
        })

# 3. Simulate the RPC Update
updated_ids = set()
unmatched_wb_rows = []

# Index DB by policy for speed
db_by_policy = {}
for r in db_records:
    pol = r['policy_number'].strip().upper()
    if pol not in db_by_policy: db_by_policy[pol] = []
    db_by_policy[pol].append(r)

for wb in wb_rows:
    pol = wb['policy'].strip().upper()
    fname = wb['fname'].strip().lower()
    lname = wb['lname'].strip().lower()
    
    candidates = db_by_policy.get(pol, [])
    matches = [c for c in candidates if c['first_name'].strip().lower() == fname and c['last_name'].strip().lower() == lname]
    
    if len(matches) >= 1:
        # The RPC would update all matches if age IS NULL
        for m in matches:
            if m['age'] is None:
                updated_ids.add(m['id'])
    else:
        unmatched_wb_rows.append(wb)

print(f"Simulated Updates: {len(updated_ids)}")
print(f"Unmatched Workbook Rows: {len(unmatched_wb_rows)}")

# 4. Analyze NULLs
null_db_records = [r for r in db_records if r['age'] is None]
print(f"Current NULLs in DB: {len(null_db_records)}")

null_reasons = []
for db in null_db_records:
    pol = db['policy_number'].strip().upper()
    fname = db['first_name'].strip().lower()
    lname = db['last_name'].strip().lower()
    
    wb_matches = [r for r in wb_rows if r['policy'].strip().upper() == pol]
    
    reason = "Record not in workbook"
    if wb_matches:
        # Check if name mismatch
        name_match = [r for r in wb_matches if r['fname'].strip().lower() == fname and r['lname'].strip().lower() == lname]
        if not name_match:
            reason = f"Name Mismatch (WB: {wb_matches[0]['full_name']})"
        else:
            reason = "Other / Ambiguous"
            
    null_reasons.append({
        'id': db['id'],
        'policy': db['policy_number'],
        'name': f"{db['first_name']} {db['last_name']}",
        'reason': reason
    })

pd.DataFrame(null_reasons).to_csv(NULL_LIST, index=False)

# Final stats for report
print(f"Reason: Name Mismatch: {sum(1 for x in null_reasons if 'Name Mismatch' in x['reason'])}")
print(f"Reason: Not in Workbook: {sum(1 for x in null_reasons if 'not in workbook' in x['reason'])}")
