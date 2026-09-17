import json
from pathlib import Path
sql = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260815_july_phone_backfill_rpc.sql').read_text(encoding='utf-8')
payload = {'project_id': 'tnklirwrnrdvbfjsdtel', 'name': 'july_phone_backfill_rpc', 'query': sql}
Path('/home/ubuntu/nmis-frontend-authoritative/phone_backfill_input.json').write_text(json.dumps(payload), encoding='utf-8')
