import pandas as pd

file_path = '/home/ubuntu/upload/2025CAPANDFFS.xlsx'
df = pd.read_excel(file_path, sheet_name='2025 CAP AND FFS')
print(df.head(10).to_string())
