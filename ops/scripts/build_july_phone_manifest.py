import json, math, re
from pathlib import Path
import pandas as pd

ROOT = Path('/home/ubuntu/july_capitation_archive/2026 CAPITATION/JULY 2026 CAPITATION')
OUT = Path('/home/ubuntu/nmis-frontend-authoritative/july_phone_inventory.jsonl')

def clean(v):
    if v is None: return ''
    try:
        if pd.isna(v): return ''
    except Exception: pass
    if isinstance(v, float) and math.isnan(v): return ''
    return str(v).strip()

def normalize_policy(v):
    return re.sub(r'\s+', '', clean(v)).upper()

def normalize_phone(v):
    text = clean(v)
    if not text: return ''
    # Keep original digits and a leading plus if present; remove Excel numeric .0.
    text = re.sub(r'\.0$', '', text)
    text = re.sub(r'[^0-9+]', '', text)
    return text

rows = []
for path in sorted(p for p in ROOT.rglob('*.xlsx') if not p.name.startswith('~$')):
    raw = pd.read_excel(path, header=None, dtype=object)
    header_idx = None
    headers = []
    for i, row in raw.iterrows():
        vals = [clean(v).upper() for v in row.tolist()]
        if 'POLICY NUMBER' in vals and 'PHONE NUMBER' in vals:
            header_idx = i
            headers = vals
            break
    if header_idx is None:
        continue
    body = raw.iloc[header_idx + 1:].copy()
    body.columns = headers
    for idx, row in body.iterrows():
        policy = normalize_policy(row.get('POLICY NUMBER'))
        if not policy: continue
        first = clean(row.get('FIRST NAME'))
        last = clean(row.get('LAST NAME'))
        phone_raw = clean(row.get('PHONE NUMBER'))
        phone = normalize_phone(phone_raw)
        gender = clean(row.get('GENDER')).upper()
        age_raw = clean(row.get('AGE'))
        rows.append({
            'facility': path.stem.strip(),
            'source_lga': path.parent.name.strip(),
            'source_file': path.name,
            'source_row': int(idx) + 1,
            'policy_number': policy,
            'beneficiary_name': f'{first} {last}'.strip(),
            'gender': gender,
            'phone_raw': phone_raw,
            'phone_number': phone,
            'phone_present': bool(phone),
            'period': '2026-07'
        })

with OUT.open('w', encoding='utf-8') as f:
    for row in rows:
        f.write(json.dumps(row, ensure_ascii=False) + '\n')

from collections import Counter
policy_counts = Counter(r['policy_number'] for r in rows)
dup_rows = sum(n for n in policy_counts.values() if n > 1)
print(json.dumps({
    'workbook_rows': len(rows),
    'workbooks': len(set(r['source_file'] for r in rows)),
    'phone_present': sum(r['phone_present'] for r in rows),
    'phone_blank': sum(not r['phone_present'] for r in rows),
    'duplicate_policy_occurrences': dup_rows,
    'unique_policies': len(policy_counts),
    'manifest': str(OUT)
}, indent=2))
