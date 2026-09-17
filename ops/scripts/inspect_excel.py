import pandas as pd
import os

files = [
    '/home/ubuntu/upload/ADULOJUMEMORIALHOSPITAL,AKUNGBA.xlsx',
    '/home/ubuntu/upload/ST.MICHAELSHOSP.ARAKALEAKURE.xlsx',
    '/home/ubuntu/upload/TOTALCAREMEDICALCLINIC,UGBEAKOKO.xlsx',
    '/home/ubuntu/upload/UAT_ALIAS_MATCH.xlsx',
    '/home/ubuntu/upload/UAT_EXACT_MATCH.xlsx',
    '/home/ubuntu/upload/UAT_HISTORICAL_VARIATION.xlsx',
    '/home/ubuntu/upload/UAT_LARGE_500.xlsx'
]

for f in files:
    if os.path.exists(f):
        try:
            df = pd.read_excel(f, nrows=10)
            print(f"File: {f}")
            print(df.columns.tolist())
            print(df.head(2))
            print("-" * 20)
        except Exception as e:
            print(f"Error reading {f}: {e}")
