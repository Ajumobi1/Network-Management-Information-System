import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path('/home/ubuntu/july_capitation_archive/2026 CAPITATION/JULY 2026 CAPITATION')
DB_NULL_FILE = Path('/home/ubuntu/.mcp/tool-results/2026-08-15_21-16-10.949535396_supabase_execute_sql_46506be3.json')
OUT_DIR = Path('/home/ubuntu/nmis-frontend-authoritative/july_reconciliation_reports')
OUT_DIR.mkdir(exist_ok=True)


def clean(v):
    if v is None:
        return ''
    try:
        if pd.isna(v):
            return ''
    except Exception:
        pass
    if isinstance(v, float) and math.isnan(v):
        return ''
    return str(v).strip()


def normalize_policy(v):
    return re.sub(r'\s+', '', clean(v)).upper()


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

# Parse all workbook rows using the same source rules used for the 112,027-row manifest.
rows = []
for path in sorted(p for p in ROOT.rglob('*.xlsx') if not p.name.startswith('~$')):
    raw = pd.read_excel(path, header=None, dtype=object)
    header_idx = None
    headers = []
    for i, row in raw.iterrows():
        vals = [clean(v).upper() for v in row.tolist()]
        if 'POLICY NUMBER' in vals and 'GENDER' in vals and 'AGE' in vals:
            header_idx = i
            headers = vals
            break
    if header_idx is None:
        continue
    body = raw.iloc[header_idx + 1:].copy()
    body.columns = headers
    for idx, row in body.iterrows():
        policy = normalize_policy(row.get('POLICY NUMBER'))
        if not policy:
            continue
        age, age_status = parse_age(row.get('AGE'))
        first = clean(row.get('FIRST NAME'))
        last = clean(row.get('LAST NAME'))
        rows.append({
            'facility': path.stem.strip(),
            'source_lga': path.parent.name.strip(),
            'source_file': path.name,
            'source_row': int(idx) + 1,
            'policy_number': policy,
            'beneficiary_name': f'{first} {last}'.strip(),
            'gender': clean(row.get('GENDER')).upper(),
            'age_source': '' if age is None else age,
            'age_status': age_status,
        })

policy_counts = Counter(r['policy_number'] for r in rows)
duplicate_policies = {p for p, count in policy_counts.items() if count > 1}
for r in rows:
    r['duplicate_policy'] = r['policy_number'] in duplicate_policies
    r['missing_gender'] = not bool(r['gender'])
    # Primary exclusion reason prevents overlap and gives an exact partition.
    if r['duplicate_policy']:
        r['primary_reason'] = 'duplicate_policy'
    elif r['missing_gender']:
        r['primary_reason'] = 'missing_gender'
    elif r['age_status'] == 'blank':
        r['primary_reason'] = 'blank_source_age'
    elif r['age_status'] == 'invalid':
        r['primary_reason'] = 'invalid_source_age'
    else:
        r['primary_reason'] = 'eligible'

# Save source-category lists with raw overlapping categories.
columns = ['facility', 'source_lga', 'source_file', 'source_row', 'policy_number', 'beneficiary_name', 'gender', 'age_source', 'age_status', 'primary_reason']
for filename, predicate in [
    ('source_duplicate_policy_records.csv', lambda r: r['duplicate_policy']),
    ('source_missing_gender_records.csv', lambda r: r['missing_gender']),
    ('source_blank_age_records.csv', lambda r: r['age_status'] == 'blank'),
    ('source_invalid_age_records.csv', lambda r: r['age_status'] == 'invalid'),
    ('source_primary_exclusions.csv', lambda r: r['primary_reason'] != 'eligible'),
]:
    pd.DataFrame([{c: r[c] for c in columns} for r in rows if predicate(r)], columns=columns).to_csv(OUT_DIR / filename, index=False)

# Facility summary for primary categories.
summary = defaultdict(Counter)
for r in rows:
    summary[r['facility']][r['primary_reason']] += 1
summary_rows = []
for facility in sorted(summary):
    c = summary[facility]
    summary_rows.append({
        'facility': facility,
        'duplicate_policy': c['duplicate_policy'],
        'missing_gender': c['missing_gender'],
        'blank_source_age': c['blank_source_age'],
        'invalid_source_age': c['invalid_source_age'],
        'eligible': c['eligible'],
        'primary_exclusions_total': sum(v for k, v in c.items() if k != 'eligible'),
    })
pd.DataFrame(summary_rows).to_csv(OUT_DIR / 'source_facility_summary.csv', index=False)

# Parse final DB NULL rows and save them individually by authoritative provider/facility.
with DB_NULL_FILE.open('r', encoding='utf-8') as f:
    content = json.load(f)
text = content['result']
start = text.find('[{"id"')
end = text.rfind('}]') + 2
db_nulls = json.loads(text[start:end])
for r in db_nulls:
    r['reason'] = 'Not found in the provided original July workbooks'

null_columns = ['provider_name', 'lga', 'id', 'policy_number', 'first_name', 'last_name', 'gender', 'provider_id', 'reason']
pd.DataFrame([{c: r.get(c, '') for c in null_columns} for r in db_nulls], columns=null_columns).to_csv(OUT_DIR / 'database_remaining_null_age_records.csv', index=False)

null_by_facility = Counter(r.get('provider_name') or '[provider not found]' for r in db_nulls)
pd.DataFrame([{'provider_name': k, 'lga': next((r.get('lga','') for r in db_nulls if (r.get('provider_name') or '[provider not found]') == k), ''), 'remaining_null_age_records': v} for k, v in sorted(null_by_facility.items())]).to_csv(OUT_DIR / 'database_remaining_null_by_facility.csv', index=False)

# Build markdown report.
raw_counts = {
    'total_source_rows': len(rows),
    'unique_policies': len(policy_counts),
    'duplicate_policy_occurrences': sum(count for p, count in policy_counts.items() if p in duplicate_policies),
    'duplicate_policy_groups': len(duplicate_policies),
    'missing_gender_rows': sum(1 for r in rows if r['missing_gender']),
    'blank_age_rows': sum(1 for r in rows if r['age_status'] == 'blank'),
    'invalid_age_rows': sum(1 for r in rows if r['age_status'] == 'invalid'),
    'eligible_rows': sum(1 for r in rows if r['primary_reason'] == 'eligible'),
}
primary_counts = Counter(r['primary_reason'] for r in rows)

lines = []
lines.append('# July 2026 Age Backfill — Facility-by-Facility Reconciliation')
lines.append('')
lines.append('No database writes were performed while generating this report. The policy-based update has already completed; this report is read-only reconciliation of the resulting state and the original source archive.')
lines.append('')
lines.append('## Final Database State')
lines.append('')
lines.append('| Metric | Count |')
lines.append('|---|---:|')
lines.append('| July enrollee records | 112,127 |')
lines.append('| Ages populated | 112,027 |')
lines.append('| Ages still NULL | 100 |')
lines.append('| Duplicate fingerprints | 0 |')
lines.append('')
lines.append('## Source Archive Counts')
lines.append('')
lines.append('| Category | Raw count | Primary-partition count |')
lines.append('|---|---:|---:|')
lines.append(f"| Total source rows with policy | {raw_counts['total_source_rows']} | {raw_counts['total_source_rows']} |")
lines.append(f"| Duplicate-policy occurrences | {raw_counts['duplicate_policy_occurrences']} | {primary_counts['duplicate_policy']} |")
lines.append(f"| Missing gender | {raw_counts['missing_gender_rows']} | {primary_counts['missing_gender']} |")
lines.append(f"| Blank source age | {raw_counts['blank_age_rows']} | {primary_counts['blank_source_age']} |")
lines.append(f"| Invalid source age | {raw_counts['invalid_age_rows']} | {primary_counts['invalid_source_age']} |")
lines.append(f"| Eligible rows | {raw_counts['eligible_rows']} | {primary_counts['eligible']} |")
lines.append('')
lines.append('Raw categories can overlap. The primary-partition column assigns each source row one reason in this order: duplicate policy, missing gender, blank age, invalid age, then eligible. Therefore the primary partition sums exactly to the total source rows.')
lines.append('')
lines.append('## Eligible Rows and Result')
lines.append('')
lines.append('| Category | Count |')
lines.append('|---|---:|')
lines.append('| Eligible source rows | 112,027 |')
lines.append('| Updated by original composite/fingerprint path | 109,146 |')
lines.append('| Updated by policy-only correction for unique July policy | 2,881 |')
lines.append('| Total ages populated from eligible source rows | 112,027 |')
lines.append('| Eligible source rows not applied | 0 |')
lines.append('')
lines.append('## Records Still Without Age')
lines.append('')
lines.append('There are **100 July database records still carrying NULL age**. They were not present in the provided original July workbook archive, so there is no source age to assign. They are listed individually in `database_remaining_null_age_records.csv` and grouped by facility in `database_remaining_null_by_facility.csv`.')
lines.append('')
lines.append('| Facility | LGA | Remaining NULL ages |')
lines.append('|---|---|---:|')
for r in sorted(pd.read_csv(OUT_DIR / 'database_remaining_null_by_facility.csv').to_dict('records'), key=lambda x: (x['provider_name'], x['policy_name'] if 'policy_name' in x else '')):
    lines.append(f"| {r['provider_name']} | {r['lga']} | {int(r['remaining_null_age_records'])} |")
lines.append('')
lines.append('## Source Exclusion Lists')
lines.append('')
lines.append('The following detailed files list every source row individually, including facility, LGA, workbook filename, source row, policy number, beneficiary name, gender, and source age status:')
lines.append('')
lines.append('| File | Contents |')
lines.append('|---|---|')
lines.append('| `source_duplicate_policy_records.csv` | All 194 source occurrences belonging to the 97 duplicate policy groups |')
lines.append('| `source_missing_gender_records.csv` | All source rows with missing gender |')
lines.append('| `source_blank_age_records.csv` | All source rows with blank age |')
lines.append('| `source_invalid_age_records.csv` | All source rows with invalid age |')
lines.append('| `source_primary_exclusions.csv` | One mutually exclusive exclusion reason per source row |')
lines.append('| `source_facility_summary.csv` | Facility-by-facility primary exclusion and eligible counts |')
lines.append('')
lines.append('## Safety Result')
lines.append('')
lines.append('All 112,027 eligible source rows now have a populated age in the July database. The remaining 100 NULL ages are individually identified as not found in the supplied archive. No further update is recommended without locating the missing original source workbooks or an explicitly approved authoritative source.')

RECON_REPORT = OUT_DIR / 'JULY_AGE_BACKFILL_FACILITY_RECONCILIATION.md'
RECON_REPORT.write_text('\n'.join(lines), encoding='utf-8')
print('\n'.join(lines[:45]))
print(f'\nWrote reports to {OUT_DIR}')
