import os
import re
import json

def get_db_connection():
    # Use environment variables or direct connection details if available. 
    # Since we use SUPABASE_URL/SUPABASE_KEY via Python, we can query via python-supabase or direct psycopg2 if DATABASE_URL exists.
    # Let's check environment or use supabase python client.
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    return create_client(url, key)

def normalize(text):
    if not text:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(text).lower())

def main():
    supabase = get_db_connection()
    
    # Fetch providers
    providers_res = supabase.table('providers').select('id, provider_name, provider_code').execute()
    providers = providers_res.data
    
    # Fetch aliases
    aliases_res = supabase.table('provider_name_aliases').select('alias_name, provider_id').execute()
    aliases = aliases_res.data
    
    print(f"Loaded {len(providers)} providers and {len(aliases)} aliases from Supabase.")
    
    # Build dictionaries for matching
    # Map normalized provider name -> provider
    prov_map = {}
    for p in providers:
        prov_map[normalize(p['provider_name'])] = p
        
    # Map normalized alias -> provider
    alias_map = {}
    for a in aliases:
        # Find provider name for this alias
        prov = next((p for p in providers if p['id'] == a['provider_id']), None)
        prov_name = prov['provider_name'] if prov else 'Unknown'
        alias_map[normalize(a['alias_name'])] = prov_name

    # Read workbook providers
    with open('/home/ubuntu/nmis-frontend-authoritative/workbook_providers.txt', 'r') as f:
        wb_providers = [line.strip() for line in f if line.strip()]

    matched = []
    unmatched = []

    for wp in wb_providers:
        norm_wp = normalize(wp)
        
        # Check direct provider match
        if norm_wp in prov_map:
            matched.append((wp, prov_map[norm_wp]['name'], 'Direct Provider Match'))
            continue
            
        # Check alias match
        if norm_wp in alias_map:
            matched.append((wp, alias_map[norm_wp], 'Alias Match'))
            continue
            
        # Try substring or fuzzy matching if needed, or list as unmatched
        # Let's check if any provider name contains key terms or vice versa
        found = False
        for norm_p, p_obj in prov_map.items():
            # If significant overlap
            if norm_wp in norm_p or norm_p in norm_wp:
                matched.append((wp, p_obj['name'], 'Fuzzy/Substring Match'))
                found = True
                break
                
        if not found:
            unmatched.append(wp)

    print(f"\n--- MATCHED ({len(matched)}) ---")
    for wp, matched_name, method in matched:
        print(f"WB: {wp} --> DB: {matched_name} [{method}]")

    print(f"\n--- UNMATCHED / REQUIRE ALIASES ({len(unmatched)}) ---")
    for wp in unmatched:
        print(f"UNMATCHED: {wp}")

if __name__ == "__main__":
    main()
