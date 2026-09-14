import subprocess
import json
import os
from pathlib import Path

PROJECT_ID = 'tnklirwrnrdvbfjsdtel'
OUT_FILE = Path('/home/ubuntu/july_identities.jsonl')
CHUNK_SIZE = 20000

def fetch_chunk(offset):
    query = f"SELECT policy_number, first_name, last_name, provider_id, id FROM public.enrollees WHERE period = '2026-07' ORDER BY id LIMIT {CHUNK_SIZE} OFFSET {offset}"
    cmd = [
        'manus-mcp-cli', 'tool', 'call', 'execute_sql',
        '--server', 'supabase',
        '--input', json.dumps({'project_id': PROJECT_ID, 'query': query})
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error fetching chunk at offset {offset}: {result.stderr}")
        return None
    
    # The output might be truncated or wrapped, we need to find the JSON result
    # For now, let's assume it's saved to a file by the CLI as usual
    # We'll look for the most recent result file
    results_dir = Path('/home/ubuntu/.mcp/tool-results')
    files = sorted(results_dir.glob('*.json'), key=os.path.getmtime, reverse=True)
    if not files:
        return None
    
    with open(files[0], 'r') as f:
        data = json.load(f)
        if 'result' in data:
            # The result is a string containing a JSON block
            import re
            match = re.search(r'<untrusted-data-.*?>(.*?)</untrusted-data-.*?>', data['result'], re.DOTALL)
            if match:
                return json.loads(match.group(1))
    return None

offset = 0
all_data = []
with OUT_FILE.open('w') as f:
    while True:
        print(f"Fetching chunk at offset {offset}...")
        chunk = fetch_chunk(offset)
        if not chunk:
            break
        for row in chunk:
            f.write(json.dumps(row) + '\n')
        print(f"Fetched {len(chunk)} records.")
        if len(chunk) < CHUNK_SIZE:
            break
        offset += CHUNK_SIZE

print(f"Finished. Data saved to {OUT_FILE}")
