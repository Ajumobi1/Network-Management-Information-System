import json
from pathlib import Path

migration = Path('/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260818220000_enrich_provider_addresses_batch.sql').read_text()
request = {'project_id': 'tnklirwrnrdvbfjsdtel', 'query': migration}
Path('/home/ubuntu/nmis-frontend-authoritative/audit/apply_batch3_addresses.json').write_text(json.dumps(request))
