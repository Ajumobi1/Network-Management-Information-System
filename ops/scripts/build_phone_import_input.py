import json
from pathlib import Path
sql = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260815_add_phone_to_import_rpc.sql').read_text(encoding='utf-8')
payload = {'project_id': 'tnklirwrnrdvbfjsdtel', 'name': 'add_phone_to_import_rpc', 'query': sql}
Path('/home/ubuntu/nmis-frontend-authoritative/phone_import_input.json').write_text(json.dumps(payload), encoding='utf-8')
