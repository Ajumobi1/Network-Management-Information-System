from pathlib import Path
from openpyxl import load_workbook

workbook_path = Path('/home/ubuntu/nmis-frontend-authoritative/2025CAPANDFFS.xlsx')
wb = load_workbook(workbook_path, read_only=True, data_only=True)
ws = wb[wb.sheetnames[0]]
rows = [list(row) for row in ws.iter_rows(values_only=True)]

header_keywords = [
    'provider', 'providers', 'facility', 'hospital', 'policy', 'enrollee', 'beneficiary',
    'amount', 'date', 'month', 'year', 'claims', 'capitation', 'ffs', 'fee for service',
    'category', 's/n', 'sn', 'serial', 'first name', 'last name', 'phone', 'gender',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
]
schema_keywords = {
    'provider', 'providers', 'facility', 'policy', 'category', 'amount', 'month', 'year',
    'claims', 'capitation', 'ffs', 's/n', 'sn', 'serial', 'first name', 'last name',
    'gender', 'phone', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep',
    'sept', 'oct', 'nov', 'dec'
}
full_months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
short_months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

def month_index(value):
    normalized = str(value or '').lower().strip().replace('_', ' ').replace('-', ' ')
    first = normalized.split()[0] if normalized.split() else ''
    if first in full_months:
        return full_months.index(first)
    if first == 'sept':
        return 8
    return short_months.index(first) if first in short_months else -1

best_index = 0
best_score = float('-inf')
for index, row in enumerate(rows):
    cells = [str(cell).strip() for cell in row if cell is not None and str(cell).strip()]
    if len(cells) < 2:
        continue
    normalized = [cell.lower().replace('_', ' ').replace('-', ' ').strip() for cell in cells]
    header_matches = sum(any(cell == keyword or keyword in cell for keyword in header_keywords) for cell in normalized)
    exact_schema_matches = sum(cell in schema_keywords for cell in normalized)
    month_matches = sum(month_index(cell) >= 0 for cell in normalized)
    numeric_cells = sum(bool(__import__('re').fullmatch(r'[-+₦$\d,\.\s]+', cell)) for cell in cells)
    long_text_cells = sum(len(cell) > 28 for cell in cells)
    duplicate_cells = len(cells) - len(set(normalized))
    score = (header_matches * 2) + (exact_schema_matches * 3) + (month_matches * 2) + (1 if len(cells) >= 3 else 0) - (numeric_cells * 1.5) - (long_text_cells * 0.5) - duplicate_cells
    if score > best_score:
        best_index, best_score = index, score

header = [str(cell or '').strip() for cell in rows[best_index]]
month_columns = [cell for cell in header if month_index(cell) >= 0]
print(f'sheet={ws.title}')
print(f'rows={len(rows)}')
print(f'header_row_zero_based={best_index}')
print(f'header_row_one_based={best_index + 1}')
print(f'headers={header}')
print(f'month_columns={month_columns}')
print(f'month_count={len(month_columns)}')
assert best_index == 0, f'expected header row 1, got {best_index + 1}'
assert month_columns == ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'], month_columns
print('REGRESSION=PASS')
wb.close()

def main():
    pass

if __name__ == '__main__':
    main()
