import json
from pathlib import Path

source = Path('/home/ubuntu/.mcp/tool-results/2026-08-18_16-12-32.404000654_supabase_execute_sql_5f0d702c.json')
data = json.loads(source.read_text())
raw = data['result']
start = raw.find('[{')
end = raw.rfind(']') + 1
rows = json.loads(raw[start:end])
print(json.dumps(rows, indent=2, ensure_ascii=False))
print(f'COUNT={len(rows)}')
