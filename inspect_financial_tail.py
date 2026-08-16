import openpyxl, json
path='/home/ubuntu/upload/2025CAPANDFFS.xlsx'
wb=openpyxl.load_workbook(path, read_only=True, data_only=True)
ws=wb[wb.sheetnames[0]]
rows=list(ws.iter_rows(values_only=True))
print(json.dumps({'row_count':len(rows),'tail':rows[-8:]}, indent=2, default=str))
