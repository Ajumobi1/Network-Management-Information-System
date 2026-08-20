import os
import requests

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")

migration_path = "/home/ubuntu/nmis-frontend-authoritative/supabase/migrations/20260820200000_update_gov_hospital_qa_labels.sql"
with open(migration_path, "r") as f:
    sql = f.read()

# Execute via Supabase REST endpoint (rpc or SQL execution if available)
print("Applying migration...")
# We can use our MCP tool or psql if connection string is available, or supabase python client
from supabase import create_client
client = create_client(supabase_url, supabase_key)
# Let's run query via postgrest or python psycopg2 if installed
try:
    import psycopg2
    # parse db url from SUPABASE_URL or use env
    # Or use execute_sql tool via mcp
    print("Using psycopg2 or MCP tool")
except Exception as e:
    print("Error:", e)
