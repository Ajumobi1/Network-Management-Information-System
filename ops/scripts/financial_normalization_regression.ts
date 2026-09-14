import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { financialDataService } from './src/services/financial-data/financialDataService.ts';

const workbook = XLSX.read(readFileSync('./2025CAPANDFFS.xlsx'), { cellDates: true });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
const headers = (matrix[0] || []).map((value, index) => String(value ?? '').trim() || `Column ${index + 1}`);
const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: headers, range: 1, defval: '', raw: false }).filter(row => Object.values(row).some(value => String(value).trim() !== ''));
const mappings = financialDataService.suggestMappings(headers, 'capitation', rows.slice(0, 50));
const records = financialDataService.normalizeData(rows, mappings, 'capitation', 'regression', '2025CAPANDFFS.xlsx', workbook.SheetNames[0], { reportingYear: 2025, reportingMonth: 1 });

const result = {
  sheets: workbook.SheetNames,
  headers,
  mappings: mappings.map(mapping => ({ field: mapping.excelField, target: mapping.nmisField, confidence: mapping.confidence })),
  recordCount: records.length,
  dataTypes: [...new Set(records.map(record => record.dataType))],
  providers: [...new Set(records.map(record => record.providerName))],
  periodCount: new Set(records.map(record => record.period)).size,
  periods: [...new Set(records.map(record => record.period))].sort(),
  emptyPeriods: records.filter(record => !record.period).length,
  validationErrorCount: records.filter(record => (record.validationErrors || []).length > 0).length,
  firstRecords: records.slice(0, 4).map(record => ({ provider: record.providerName, dataType: record.dataType, period: record.period, amount: record.amount, fingerprint: record.fingerprint })),
  errors: records.flatMap(record => record.validationErrors || []),
};
console.log(JSON.stringify(result, null, 2));
