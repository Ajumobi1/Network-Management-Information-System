import { providerDirectory } from '../../mocks/providersMocks';
import { mockInspections } from '../../mocks/inspectionsMocks';

export async function generateProviderReport() {
  const headers = ['Provider Code', 'Provider Name', 'Category', 'Ownership', 'State', 'LGA', 'Status', 'Rating'];
  const rows = providerDirectory.map(p => [
    p.providerCode,
    p.providerName,
    p.category,
    p.ownership,
    p.state,
    p.lga,
    p.status,
    p.inspectionRating || 'N/A'
  ]);

  return exportToCsv('provider-network-report', headers, rows);
}

export async function generateInspectionReport() {
  const headers = ['Inspection ID', 'Provider', 'Type', 'Date', 'Inspector', 'Score', 'Rating', 'Status'];
  const rows = mockInspections.map(i => [
    i.id,
    i.providerName,
    i.type,
    new Date(i.scheduledAt).toLocaleDateString(),
    i.inspectorName,
    i.score || 'N/A',
    i.rating || 'N/A',
    i.status
  ]);

  return exportToCsv('inspection-compliance-report', headers, rows);
}

function exportToCsv(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nmis-${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
