import json
from pathlib import Path

migration = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260815_provider_directory_repair.sql').read_text(encoding='utf-8')
payload = {
    'project_id': 'tnklirwrnrdvbfjsdtel',
    'name': 'provider_directory_repair',
    'query': migration,
}
Path('/home/ubuntu/nmis-frontend-authoritative/provider_directory_repair_input.json').write_text(json.dumps(payload), encoding='utf-8')
