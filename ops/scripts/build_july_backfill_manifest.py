import csv
import json
import math
import re
import pandas as pd
from pathlib import Path

ROOT = Path('/home/ubuntu/july_capitation_archive/2026 CAPITATION/JULY 2026 CAPITATION')
OUT_JSONL = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')
REPORT = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.json')
PERIOD = '2026-07'

def clean(v):
    if v is None or (isinstance(v, float) and math.isnan(v)) or pd.isna(v):
        return ''
    return str(v).strip()

def normalize_policy(v):
    return re.sub(r'\s+', '', clean(v)).upper()

def header_for(path):
    try:
        raw = pd.read_excel(path, header=None, dtype=object)
        for i, row in raw.iterrows():
            vals = [clean(v).upper() for v in row.tolist()]
            if 'POLICY NUMBER' in vals and 'GENDER' in vals and 'AGE' in vals:
                return raw, i, vals
    except Exception as e:
        print(f"Error reading {path}: {e}")
    return None, None, []

def parse_age(v):
    text = clean(v)
    if text == '':
        return None, 'blank'
    try:
        number = float(text)
    except Exception:
        return None, 'invalid'
    if not math.isfinite(number) or number < 0 or not number.is_integer():
        return None, 'invalid'
    return int(number), 'valid'

records = []
file_stats = []
for path in sorted(p for p in ROOT.rglob('*.xlsx') if not p.name.startswith('~$')):
    raw, header_idx, headers = header_for(path)
    if header_idx is None:
        file_stats.append({'file': path.name, 'lga': path.parent.name, 'status': 'no_header', 'rows': 0})
        continue
    
    # Extract facility name from filename or parent directory if needed, 
    # but the filename is the facility name usually.
    facility_name = path.stem.strip().upper()
    
    body = raw.iloc[header_idx + 1:].copy()
    body.columns = headers
    row_count = 0
    for idx, row in body.iterrows():
        vals = [clean(v) for v in row.tolist()]
        if not any(vals):
            continue
        policy = normalize_policy(row.get('POLICY NUMBER'))
        if not policy:
            continue
        row_count += 1
        age, age_status = parse_age(row.get('AGE'))
        gender = clean(row.get('GENDER')).upper()
        category = clean(row.get('CATEGORY')).upper()
        first_name = clean(row.get('FIRST NAME'))
        last_name = clean(row.get('LAST NAME'))
        
        records.append({
            'source_file': path.name,
            'source_lga': path.parent.name,
            'facility_name': facility_name,
            'source_row': int(idx) + 1,
            'policy_number': policy,
            'category_source': category,
            'beneficiary_name': f"{first_name} {last_name}",
            'gender_source': gender,
            'age_source': age,
            'age_status': age_status,
            'period': PERIOD,
        })
    file_stats.append({'file': path.name, 'lga': path.parent.name, 'status': 'parsed', 'rows': row_count})

from collections import Counter
policy_counts = Counter(r['policy_number'] for r in records)
duplicate_policies = {p for p, c in policy_counts.items() if c > 1}

for r in records:
    r['gender_missing'] = not bool(r['gender_source'])
    r['duplicate_policy'] = r['policy_number'] in duplicate_policies
    r['eligible_for_age_backfill'] = bool(r['gender_source']) and not r['duplicate_policy'] and r['age_status'] == 'valid'

eligible = [r for r in records if r['eligible_for_age_backfill']]

with OUT_JSONL.open('w', encoding='utf-8') as fh:
    for r in eligible:
        fh.write(json.dumps(r) + '\n')

report = {
    'period': PERIOD,
    'workbook_count': len(file_stats),
    'parsed_workbook_count': sum(1 for x in file_stats if x['status'] == 'parsed'),
    'workbooks_without_header': [x for x in file_stats if x['status'] != 'parsed'],
    'source_rows_with_policy': len(records),
    'unique_policy_numbers': len(policy_counts),
    'duplicate_policy_number_groups': len(duplicate_policies),
    'duplicate_policy_occurrences_excluded': sum(c for p, c in policy_counts.items() if p in duplicate_policies),
    'missing_gender_rows': sum(1 for r in records if r['gender_missing']),
    'blank_age_rows': sum(1 for r in records if r['age_status'] == 'blank'),
    'invalid_age_rows': sum(1 for r in records if r['age_status'] == 'invalid'),
    'valid_age_rows': sum(1 for r in records if r['age_status'] == 'valid'),
    'eligible_age_backfill_rows': len(eligible),
}
REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
print('MANIFEST', OUT_JSONL)
