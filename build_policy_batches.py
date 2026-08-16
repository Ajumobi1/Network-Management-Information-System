import json
from pathlib import Path
from collections import Counter

manifest = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')
input_dir = Path('/home/ubuntu/nmis-frontend-authoritative/policy_batches')
input_dir.mkdir(exist_ok=True)

# Source eligible rows indexed by policy; the manifest already excludes missing
# gender, duplicate source policies, blank ages and invalid ages.
source_by_policy = {}
with manifest.open('r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('eligible_for_age_backfill'):
            p = r['policy_number'].strip().upper()
            source_by_policy[p] = {'policy_number': p, 'age': int(r['age_source'])}

# Current DB July state from the read-only Supabase export.
db_file = Path('/home/ubuntu/.mcp/tool-results/2026-08-15_20-58-58.514687002_supabase_execute_sql_1c0e35fd.json')
with db_file.open('r') as f:
    content = json.load(f)
text = content['result']
start = text.find('[{"id"')
end = text.rfind('}]') + 2
db_records = json.loads(text[start:end])

# Only policy numbers with exactly one July database record and NULL age are eligible.
counts = Counter(r['policy_number'].strip().upper() for r in db_records)
rows = []
for r in db_records:
    p = r['policy_number'].strip().upper()
    if r['age'] is None and counts[p] == 1 and p in source_by_policy:
        rows.append(source_by_policy[p])

# Deduplicate defensively.
rows = list({r['policy_number']: r for r in rows}.values())
print(f"Unique policy rows to update: {len(rows)}")

# Recreate batch directory.
for p in input_dir.glob('batch_*.json'):
    p.unlink()

batch_size = 500
for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    # JSON is safe here because the input contains only policy strings and ints.
    query = "SELECT public.nmis_backfill_july_ages_by_policy('" + json.dumps(batch).replace("'", "''") + "'::jsonb)"
    payload = {'project_id': 'tnklirwrnrdvbfjsdtel', 'query': query}
    path = input_dir / f'batch_{i//batch_size+1:03d}.json'
    path.write_text(json.dumps(payload), encoding='utf-8')
    print(path)
