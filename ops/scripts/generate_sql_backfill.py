import json
from pathlib import Path

MANIFEST = Path('/home/ubuntu/nmis-frontend-authoritative/july_backfill_inventory.jsonl')
SQL_OUT = Path('/home/ubuntu/nmis-frontend-authoritative/july_age_backfill.sql')

print("Reading manifest...")
rows = []
with MANIFEST.open('r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('eligible_for_age_backfill'):
            rows.append(r)

print(f"Generating SQL for {len(rows)} eligible rows...")

sql_lines = [
    "BEGIN;",
    "CREATE TEMP TABLE temp_july_ages (",
    "  policy_number text,",
    "  fname text,",
    "  lname text,",
    "  age int",
    ") ON COMMIT DROP;",
    ""
]

batch = []
for r in rows:
    pol = r['policy_number'].replace("'", "''")
    parts = r['beneficiary_name'].split()
    fname = parts[0].replace("'", "''") if parts else ""
    lname = " ".join(parts[1:]).replace("'", "''") if len(parts) > 1 else ""
    age = int(r['age_source'])
    batch.append(f"('{pol}', '{fname}', '{lname}', {age})")
    
    if len(batch) >= 1000:
        sql_lines.append("INSERT INTO temp_july_ages (policy_number, fname, lname, age) VALUES")
        sql_lines.append(",\n".join(batch) + ";")
        batch = []

if batch:
    sql_lines.append("INSERT INTO temp_july_ages (policy_number, fname, lname, age) VALUES")
    sql_lines.append(",\n".join(batch) + ";")

sql_lines.extend([
    "",
    "-- Perform the safe NULL-only age update",
    "UPDATE public.enrollees e",
    "SET age = t.age,",
    "    updated_at = NOW()",
    "FROM temp_july_ages t",
    "WHERE e.period = '2026-07'",
    "  AND e.policy_number = t.policy_number",
    "  AND lower(e.first_name) = lower(t.fname)",
    "  AND lower(e.last_name) = lower(t.lname)",
    "  AND e.age IS NULL;",
    "",
    "COMMIT;"
])

SQL_OUT.write_text("\n".join(sql_lines), encoding='utf-8')
print(f"SQL script written to {SQL_OUT} (Size: {SQL_OUT.stat().st_size / 1024 / 1024:.2f} MB)")
