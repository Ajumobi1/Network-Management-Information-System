import pandas as pd
import os

file_path = '/home/ubuntu/upload/2025CAPANDFFS.xlsx'

def inspect_workbook(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    xl = pd.ExcelFile(path)
    print(f"Sheets: {xl.sheet_names}")
    
    all_providers = set()
    
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet_name)
        print(f"\nSheet: {sheet_name}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Look for columns that might contain provider names
        # Based on previous interactions, common names are 'PROVIDER', 'Facility Name', etc.
        provider_cols = [col for col in df.columns if any(keyword in str(col).upper() for keyword in ['PROVIDER', 'FACILITY', 'NAME'])]
        
        if provider_cols:
            print(f"Found provider columns: {provider_cols}")
            for col in provider_cols:
                names = df[col].dropna().unique()
                for name in names:
                    clean_name = str(name).strip()
                    if clean_name and not clean_name.upper().startswith('TOTAL') and not clean_name.upper() == 'S/N':
                        all_providers.add(clean_name)
        else:
            # If no obvious column, check first few rows to see if names are there
            print("No obvious provider column, checking first few rows...")
            print(df.head(5))

    print(f"\nTotal unique providers found in workbook: {len(all_providers)}")
    
    # Save to a text file for comparison
    with open('/home/ubuntu/nmis-frontend-authoritative/workbook_providers.txt', 'w') as f:
        for provider in sorted(list(all_providers)):
            f.write(f"{provider}\n")

if __name__ == "__main__":
    inspect_workbook(file_path)
