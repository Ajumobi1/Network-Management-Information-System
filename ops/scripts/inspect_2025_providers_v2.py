import pandas as pd
import os

file_path = '/home/ubuntu/upload/2025CAPANDFFS.xlsx'

def inspect_workbook(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    df = pd.read_excel(path, sheet_name='2025 CAP AND FFS')
    
    # Forward fill the PROVIDERS column to associate FFS rows with their provider
    df['PROVIDERS'] = df['PROVIDERS'].ffill()
    
    all_providers = set()
    
    for name in df['PROVIDERS'].dropna().unique():
        clean_name = str(name).strip()
        # Filter out totals and non-provider strings
        if (clean_name and 
            not clean_name.upper().startswith('TOTAL') and 
            not clean_name.upper() == 'S/N' and
            not 'GRAND TOTAL' in clean_name.upper()):
            all_providers.add(clean_name)

    print(f"Total unique providers found in workbook: {len(all_providers)}")
    
    # Save to a text file for comparison
    with open('/home/ubuntu/nmis-frontend-authoritative/workbook_providers.txt', 'w') as f:
        for provider in sorted(list(all_providers)):
            f.write(f"{provider}\n")
            
    # Print the list for quick review
    for p in sorted(list(all_providers)):
        print(p)

if __name__ == "__main__":
    inspect_workbook(file_path)
