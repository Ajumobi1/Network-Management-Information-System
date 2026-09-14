import json
from pathlib import Path

manifest = Path('/home/ubuntu/nmis-frontend-authoritative/july_phone_inventory.jsonl')
out_dir = Path('/home/ubuntu/nmis-frontend-authoritative/phone_batches')
out_dir.mkdir(exist_ok=True)

rows = [json.loads(line) for line in manifest.open(encoding='utf-8')]
# Source filters replicate the approved age workflow: duplicate policies and
# missing gender are excluded; blank phone values are excluded; no values are inferred.
from collections import Counter
policy_counts = Counter(r['policy_number'] for r in rows)
duplicate_policies = {p for p, n in policy_counts.items() if n > 1}
eligible = []
for r in rows:
    if r['policy_number'] in duplicate_policies:
        continue
    if not r['gender']:
        continue
    if not r['phone_number']:
        continue
    eligible.append({'policy_number': r['policy_number'], 'phone_number': r['phone_number']})

# Defensive source-policy deduplication.
unique = list({r['policy_number']: r for r in eligible}.values())
print(f'Eligible phone source rows: {len(unique)}')

for p in out_dir.glob('batch_*.json'):
    p.unlink()

batch_size = 10000
for i in range(0, len(unique), batch_size):
    batch = unique[i:i+batch_size]
    json_text = json.dumps(batch, ensure_ascii=False)
    query = "SELECT public.nmis_backfill_july_phones_by_policy('" + json_text.replace("'", "''") + "'::jsonb)"
    payload = {'project_id': 'tnklirwrnrdvbfjsdtel', 'query': query}
    path = out_dir / f'batch_{i//batch_size+1:03d}.json'
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
    print(f'{path} rows={len(batch)} bytes={path.stat().st_size}')
