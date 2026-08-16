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

print("Loading eligible backfill rows from manifest...")
rows = []
with MANIFEST.open('r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('eligible_for_age_backfill'):
            parts = r['beneficiary_name'].split()
            fname = parts[0] if parts else ""
            lname = " ".join(parts[1:]) if len(parts) > 1 else ""
            rows.append({
                'policy_number': r['policy_number'],
                'fname': fname,
                'lname': lname,
                'age': int(r['age_source'])
            })

print(f"Loaded {len(rows)} eligible rows for backfill.")

BATCH_SIZE = 500
total_recovered = 0

print("Starting RPC batch backfill...")
for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i+BATCH_SIZE]
    try:
        res = client.rpc('nmis_backfill_july_ages', {'p_batch': batch}).execute()
        updated_count = res.data if isinstance(res.data, int) else 0
        total_recovered += updated_count
        print(f"Batch {i//BATCH_SIZE + 1}/{len(rows)//BATCH_SIZE + 1}: Recovered {updated_count} ages (Total so far: {total_recovered})")
    except Exception as e:
        print(f"Error in batch {i//BATCH_SIZE + 1}: {e}")

print(f"\n--- RPC BACKFILL COMPLETE ---")
print(f"Total Ages Successfully Recovered: {total_recovered}")
