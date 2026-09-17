import os
from supabase import create_client

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
client = create_client(supabase_url, supabase_key)

res = client.table("inspection_templates").select("id").eq("code", "government-hospital-accreditation").execute()
if res.data:
    tid = res.data[0]["id"]
    items = client.table("inspection_template_items").select("item_code, item_label").eq("template_id", tid).order("sort_order").execute()
    for it in items.data:
        print(f"{it['item_code']}: {it['item_label']}")
else:
    print("Template not found")
