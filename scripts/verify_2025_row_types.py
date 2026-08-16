from pathlib import Path
from collections import Counter
from openpyxl import load_workbook

path = Path('/home/ubuntu/nmis-frontend-authoritative/2025CAPANDFFS.xlsx')
workbook = load_workbook(path, read_only=True, data_only=True)
sheet = workbook[workbook.sheetnames[0]]
rows = list(sheet.iter_rows(values_only=True))
headers = [str(value or '').strip() for value in rows[0]]
type_index = 2
month_indices = [index for index, header in enumerate(headers) if header.upper() in {'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'}]
counts = Counter()
rows_with_amounts = Counter()
for row in rows[1:]:
    row_type = str(row[type_index] or '').strip().upper()
    if row_type in {'CAPITATION', 'FFS'}:
        counts[row_type] += 1
        if any(row[index] not in (None, '', '-', '—') for index in month_indices):
            rows_with_amounts[row_type] += 1

print(f'sheet={sheet.title}')
print(f'data_rows={len(rows) - 1}')
print(f'type_counts={dict(counts)}')
print(f'rows_with_month_amounts={dict(rows_with_amounts)}')
assert counts['CAPITATION'] > 0
assert counts['FFS'] > 0
assert rows_with_amounts['CAPITATION'] > 0
assert rows_with_amounts['FFS'] > 0
print('ROW_TYPE_REGRESSION=PASS')
workbook.close()
