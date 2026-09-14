import json
import subprocess
from pathlib import Path

MANIFEST = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')

def get_sample_records(n=5):
    samples = []
    with MANIFEST.open('r') as f:
        for line in f:
            row = json.loads(line)
            if row['age_source'] is not None and row['age_source'] > 0:
                samples.append(row)
                if len(samples) >= n:
                    break
    return samples

samples = get_sample_records(5)
print("Selected 5 sample workbook rows:")
for s in samples:
    print(s)

# We will generate a SQL script to test updating these 5 records
sql_statements = []
for s in samples:
    policy = s['policy_number']
    fname = s['beneficiary_name'].split()[0] if s['beneficiary_name'] else ''
    lname = " ".join(s['beneficiary_name'].split()[1:]) if len(s['beneficiary_name'].split()) > 1 else ''
    age = s['age_source']
    
    # SQL to update only if age IS NULL
    sql = f"""
    UPDATE public.enrollees
    SET age = {age}, updated_at = NOW()
    WHERE period = '2026-07'
      AND policy_number = '{policy}'
      AND first_name ILIKE '{fname}'
      AND last_name ILIKE '{lname}'
      AND age IS NULL;
    """
    sql_statements.append(sql.strip())

print("\nGenerated SQL statements for test:")
for stmt in sql_statements:
    print(stmt)
    print("-" * 40)
