import json
from pathlib import Path

sql = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260815_policy_only_age_backfill.sql').read_text(encoding='utf-8')
payload = {'project_id': 'tnklirwrnrdvbfjsdtel', 'name': 'policy_only_age_backfill', 'query': sql}
Path('/home/ubuntu/nmis-frontend-authoritative/policy_backfill_input.json').write_text(json.dumps(payload), encoding='utf-8')
