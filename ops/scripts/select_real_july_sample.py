from pathlib import Path
import pandas as pd

root = Path('/home/ubuntu/july_capitation_archive/2026 CAPITATION/JULY 2026 CAPITATION')
files = sorted([p for p in root.rglob('*.xlsx') if not p.name.startswith('~$')])
selected=[]
for path in files:
    raw = pd.read_excel(path, header=None, dtype=object)
    header_idx = None
    for i, row in raw.iterrows():
        vals = [str(v).strip().upper() for v in row.tolist() if pd.notna(v)]
        if 'POLICY NUMBER' in vals and 'GENDER' in vals and 'AGE' in vals:
            header_idx = i
            headers = [str(v).strip().upper() if pd.notna(v) else '' for v in row.tolist()]
            break
    if header_idx is None:
        continue
    df = raw.iloc[header_idx+1:].copy()
    df.columns = headers
    def get(row, name):
        return row.get(name) if name in row.index else None
    for _, row in df.iterrows():
        policy = get(row, 'POLICY NUMBER')
        gender = get(row, 'GENDER')
        age = get(row, 'AGE')
        if pd.isna(policy) or pd.isna(gender) or pd.isna(age):
            continue
        policy = str(policy).strip()
        gender = str(gender).strip()
        try:
            age_int = int(float(age))
        except Exception:
            continue
        if not policy or not gender or age_int < 0:
            continue
        selected.append({
            'file': path.name,
            'lga_dir': path.parent.name,
            'policy': policy,
            'gender': gender,
            'age': age_int,
            'category': str(get(row, 'CATEGORY')).strip() if pd.notna(get(row, 'CATEGORY')) else '',
            'first_name': str(get(row, 'FIRST NAME')).strip() if pd.notna(get(row, 'FIRST NAME')) else '',
            'last_name': str(get(row, 'LAST NAME')).strip() if pd.notna(get(row, 'LAST NAME')) else '',
        })
        if len(selected) >= 5:
            break
    if len(selected) >= 5:
        break
print('REAL_SAMPLE')
for x in selected:
    print(x)
