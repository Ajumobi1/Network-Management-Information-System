import os
import json
from pathlib import Path
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tnklirwrnrdvbfjsdtel.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_KEY:
    env_path = Path('/home/ubuntu/.user_env')
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if 'SUPABASE_KEY=' in line:
                SUPABASE_KEY = line.split('=', 1)[1].strip('"\'')
            if 'SUPABASE_URL=' in line:
                SUPABASE_URL = line.split('=', 1)[1].strip('"\'')

client = create_client(SUPABASE_URL, SUPABASE_KEY)
MANIFEST = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')

def normalize(s):
    if not s: return ""
    return str(s).strip().upper()

print("Loading eligible backfill rows from manifest...")
rows = []
with MANIFEST.open('r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('eligible_for_age_backfill'):
            rows.append(r)

print(f"Loaded {len(rows)} eligible rows for backfill.")

# Group by source file
by_file = {}
for r in rows:
    sf = r['source_file']
    if sf not in by_file:
        by_file[sf] = []
    by_file[sf].append(r)

total_updated = 0
total_skipped = 0
total_not_found = 0

print(f"Starting backfill across {len(by_file)} workbook files...")

for sf, file_rows in by_file.items%() if False else by_file.items():
    print(f"\nProcessing file: {sf} ({len(file_rows)} rows)...")
    policies = list({r['policy_number'] for r in file_rows})
    
    db_map = {}
    for i in range(0, len(policies), 200):
        batch_pols = policies[i:i+200]
        res = client.table('enrollees').select('id, policy_number, first_name, last_name, age').eq('period', '2026-07').in_('policy_number', batch_pols).execute()
        for db_row in res.data:
            pol = normalize(db_row['policy_number'])
            fname = normalize(db_row['first_name'])
            lname = normalize(db_row['last_name'])
            db_map[(pol, fname, lname)] = db_row
            # Also map policy alone if unique in batch
            if pol not in db_map:
                db_map[pol] = db_row
            else:
                db_map[pol] = None # mark ambiguous
            
    file_updated = 0
    file_skipped = 0
    file_not_found = 0
    
    for r in file_rows:
        pol = normalize(r['policy_number'])
        full_name_parts = r['beneficiary_name'].split()
        if not full_name_parts:
            file_not_found += 1
            continue
        fname = normalize(full_name_parts[0])
        lname = normalize(" ".join(full_name_parts[1:])) if len(full_name_parts) > 1 else ""
        
        db_match = db_map.get((pol, fname, lname))
        if not db_match:
            # Fallback to policy match if unique
            pol_match = db_map.get(pol)
            if pol_match and isinstance(pol_match, dict):
                db_match = pol_match
                
        if not db_match or not isinstance(db_match, dict):
            file_not_found += 1
            continue
            
        if db_match.get('age') is not None:
            file_skipped += 1
            continue
            
        # Update age
        client.table('enrollees').update({'age': int(r['age_source'])}).eq('id', db_match['id']).execute()
        file_updated += 1
        
    print(f"File {sf}: Updated={file_updated}, Skipped={file_skipped}, NotFound={file_not_found}")
    total_updated += file_updated
    total_skipped += file_skipped
    total_not_found += file_not_found

print(f"\n--- BACKFILL COMPLETE ---")
print(f"Total Ages Recovered: {total_updated}")
print(f"Total Skipped (Already Populated): {total_skipped}")
print(f"Total Unmatched / Not Found: {total_not_found}")
