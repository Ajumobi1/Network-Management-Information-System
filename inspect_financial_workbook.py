import json
from pathlib import Path
import openpyxl

path = Path('/home/ubuntu/upload/2025CAPANDFFS.xlsx')
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
report = {'sheets': wb.sheetnames, 'samples': {}}
for ws in wb.worksheets:
    rows = ws.iter_rows(values_only=True)
    samples = []
    for idx, row in enumerate(rows):
        if idx >= 8:
            break
        samples.append(list(row))
    report['samples'][ws.title] = samples
print(json.dumps(report, indent=2, default=str))
