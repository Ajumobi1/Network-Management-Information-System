from pathlib import Path
import pandas as pd

root = Path('/home/ubuntu/july_capitation_archive/2026 CAPITATION/JULY 2026 CAPITATION')
files = sorted([p for p in root.rglob('*.xlsx') if not p.name.startswith('~$')])
print('FILE_COUNT', len(files))
for path in files[:8]:
    print('\nFILE', path)
    try:
        raw = pd.read_excel(path, header=None, nrows=80, dtype=object)
    except Exception as exc:
        print('READ_ERROR', exc)
        continue
    found = []
    for i, row in raw.iterrows():
        vals = [str(v).strip().upper() for v in row.tolist() if pd.notna(v)]
        joined = ' | '.join(vals)
        if any(k in joined for k in ['POLICY', 'GENDER', 'AGE', 'CATEGORY', 'BENEFICIARY']):
            found.append((i, vals[:20]))
    print('HEADER_CANDIDATES')
    for item in found[:10]:
        print(item)
    print('ROWS_PREVIEW')
    for i in range(min(len(raw), 12)):
        vals = [None if pd.isna(v) else str(v) for v in raw.iloc[i].tolist()]
        print(i, vals[:12])
        
print('\nALL_FILE_NAMES')
for path in files:
    print(path.name)
