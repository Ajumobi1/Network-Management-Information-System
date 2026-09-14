import subprocess
import json
from pathlib import Path

SQL_FILE = Path('/home/ubuntu/nmis-frontend-authoritative/july_age_backfill.sql')
lines = SQL_FILE.read_text(encoding='utf-8').splitlines()

# Extract statements
statements = []
current_stmt = []
for line in lines:
    current_stmt.append(line)
    if line.strip().endswith(';'):
        statements.append("\n".join(current_stmt))
        current_stmt = []

print(f"Total SQL statements parsed: {len(statements)}")

def run_sql(sql):
    payload = json.dumps({'project_id': 'tnklirwrnrdvbfjsdtel', 'query': sql})
    cmd = ['manus-mcp-cli', 'tool', 'call', 'execute_sql', '--server', 'supabase', '--input', payload]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0, res.stdout, res.stderr

print("Executing BEGIN & TEMP TABLE creation...")
success, out, err = run_sql(statements[0] + "\n" + statements[1])
print(f"Success: {success}, Out: {out[:200]}, Err: {err[:200]}")

# Execute INSERT statements
inserts = statements[2:-3]
print(f"Executing {len(inserts)} insert batches...")
for idx, ins in enumerate(inserts):
    success, out, err = run_sql(ins)
    if not success:
        print(f"Error at insert batch {idx}: {err}")
    else:
        if idx % 10 == 0:
            print(f"Completed {idx}/{len(inserts)} insert batches.")

print("Executing UPDATE and COMMIT...")
update_commit_sql = "\n".join(statements[-3:])
success, out, err = run_sql(update_commit_sql)
print(f"Update & Commit Success: {success}, Out: {out}, Err: {err}")
