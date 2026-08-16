import json
from pathlib import Path

migration = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260815_july_age_backfill_rpc.sql').read_text(encoding='utf-8')
payload = {
    'project_id': 'tnklirwrnrdvbfjsdtel',
    'name': 'july_age_backfill_rpc',
    'query': migration,
}
Path('/home/ubuntu/nmis-frontend-authoritative/backfill_rpc_input.json').write_text(json.dumps(payload), encoding='utf-8')
