export function downloadCsvReport(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const csvCell = (value: unknown) => {
    const text = value === undefined || value === null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportBatchErrorsAndDuplicatesReport(
  batchName: string,
  records: Array<{
    sourceRow?: number;
    providerName?: string;
    period?: string;
    dataType?: string;
    policyNumber?: string;
    firstName?: string;
    lastName?: string;
    recordStatus?: string;
    validationErrors?: string[];
  }>
) {
  const issues = records.filter(r => r.recordStatus === 'error' || r.recordStatus === 'duplicate' || (r.validationErrors && r.validationErrors.length > 0));
  if (issues.length === 0) return;

  const headers = ['Source Row', 'Status', 'Provider / Facility', 'Period', 'Policy Number', 'Beneficiary', 'Error / Issue Details'];
  const rows = issues.map(r => [
    r.sourceRow ?? '—',
    r.recordStatus?.toUpperCase() ?? 'ERROR',
    r.providerName ?? '—',
    r.period ?? '—',
    r.policyNumber ?? '—',
    [r.firstName, r.lastName].filter(Boolean).join(' ') || '—',
    r.validationErrors?.join('; ') || 'Record flagged by AI validation or duplicate protection',
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = batchName.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCsvReport(`nmis-import-report-${safeName}-${timestamp}.csv`, headers, rows);
}

export function exportUnifiedQueueReport(
  queueName: string,
  allIssues: Array<{
    fileName: string;
    sourceRow?: number;
    providerName?: string;
    period?: string;
    policyNumber?: string;
    firstName?: string;
    lastName?: string;
    recordStatus?: string;
    validationErrors?: string[];
  }>
) {
  if (allIssues.length === 0) return;

  const headers = ['Source File', 'Source Row', 'Status', 'Provider / Facility', 'Period', 'Policy Number', 'Beneficiary', 'Error / Issue Details'];
  const rows = allIssues.map(r => [
    r.fileName,
    r.sourceRow ?? '—',
    r.recordStatus?.toUpperCase() ?? 'ERROR',
    r.providerName ?? '—',
    r.period ?? '—',
    r.policyNumber ?? '—',
    [r.firstName, r.lastName].filter(Boolean).join(' ') || '—',
    r.validationErrors?.join('; ') || 'Record flagged by AI validation or duplicate protection',
  ]);

  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = queueName.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadCsvReport(`nmis-unified-batch-report-${safeName}-${timestamp}.csv`, headers, rows);
}
