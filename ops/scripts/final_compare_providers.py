import json
import re
import os

def normalize(text):
    if not text:
        return ""
    return re.sub(r'[^a-z0-9]', '', str(text).lower())

def load_json_result(path):
    with open(path, 'r') as f:
        data = json.load(f)
    # The MCP result is a string inside the 'result' key, which contains a JSON array
    # We need to extract that array.
    raw_result = data.get('result', '')
    # Extract the part between <untrusted-data-*> boundaries
    match = re.search(r'<untrusted-data-[^>]+>\s*(\[.*\])\s*</untrusted-data-[^>]+>', raw_result, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    return []

def main():
    providers = load_json_result('/home/ubuntu/.mcp/tool-results/2026-08-16_17-58-20.297176142_supabase_execute_sql_56289821.json')
    aliases = load_json_result('/home/ubuntu/.mcp/tool-results/2026-08-16_17-58-31.225867218_supabase_execute_sql_c534475b.json')
    
    print(f"Loaded {len(providers)} providers and {len(aliases)} aliases from DB exports.")
    
    # Map normalized provider name -> provider
    prov_map = {}
    for p in providers:
        prov_map[normalize(p['provider_name'])] = p
        
    # Map normalized alias -> provider name
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
        
        # 1. Exact Provider Match
        if norm_wp in prov_map:
            matched.append((wp, prov_map[norm_wp]['provider_name'], 'Direct Provider Match'))
            continue
            
        # 2. Alias Match
        if norm_wp in alias_map:
            matched.append((wp, alias_map[norm_wp], 'Alias Match'))
            continue
            
        # 3. Substring / Fuzzy Overlap Match
        found = False
        # Check if workbook name is inside a provider name or vice versa
        for norm_p, p_obj in prov_map.items():
            if (len(norm_wp) > 5 and norm_wp in norm_p) or (len(norm_p) > 5 and norm_p in norm_wp):
                matched.append((wp, p_obj['provider_name'], 'Fuzzy Overlap Match'))
                found = True
                break
        
        if not found:
            # Check aliases for overlap too
            for norm_a, p_name in alias_map.items():
                if (len(norm_wp) > 8 and norm_wp in norm_a) or (len(norm_a) > 8 and norm_a in norm_wp):
                    matched.append((wp, p_name, 'Fuzzy Alias Overlap'))
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
        
    # Save results
    results = {
        "matched": [{"workbook_name": m[0], "db_name": m[1], "method": m[2]} for m in matched],
        "unmatched": unmatched
    }
    with open('/home/ubuntu/nmis-frontend-authoritative/comparison_results.json', 'w') as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
