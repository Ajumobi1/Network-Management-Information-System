import json, re
from collections import Counter
from pathlib import Path

MANIFEST = Path('/home/ubuntu/nmis-frontend-authoritative/july_phone_inventory.jsonl')
rows = [json.loads(line) for line in MANIFEST.open(encoding='utf-8')]
policy_counts = Counter(r['policy_number'] for r in rows)
duplicate_policies = {p for p, n in policy_counts.items() if n > 1}

# Replicate the requested age filters: missing gender excluded, duplicate policies excluded,
# and blank phone excluded. Do not infer or repair values.
counts = Counter()
eligible = []
for r in rows:
    if r['policy_number'] in duplicate_policies:
        counts['duplicate_policy_occurrences'] += 1
    elif not r['gender']:
        counts['missing_gender'] += 1
    elif not r['phone_number']:
        counts['blank_phone'] += 1
    else:
        eligible.append(r)
        counts['eligible'] += 1

lengths = Counter(len(r['phone_number']) for r in eligible)
prefixes = Counter(r['phone_number'][:1] for r in eligible)
print('rows', len(rows))
print('workbooks', len(set(r['source_file'] for r in rows)))
print('counts', dict(counts))
print('phone_length_counts', dict(sorted(lengths.items())))
print('first_char_counts', dict(sorted(prefixes.items())))
print('missing_gender_raw', sum(not r['gender'] for r in rows))
print('duplicate_groups', len(duplicate_policies))
print('phone_blank_raw', sum(not r['phone_number'] for r in rows))
