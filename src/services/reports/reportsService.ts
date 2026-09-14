import { getProviderDirectory } from '../../repositories/providers/providersRepository';
import { getInspections } from '../../repositories/inspections/inspectionsRepository';
import { fetchEnrollees } from '../../repositories/enrolment/enrolmentRepository';

export async function generateProviderReport() {
  try {
    const providers = await getProviderDirectory({ pageSize: -1 });
    const headers = ['Provider Code', 'Provider Name', 'Category', 'Ownership', 'State', 'LGA', 'Status', 'Rating'];
    const rows = providers.map(p => [
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
  } catch (error) {
    console.error('Failed to generate provider report:', error);
    throw new Error('Unable to generate provider network report. Please try again.');
  }
}

export async function generateInspectionReport() {
  try {
    const inspections = await getInspections();
    const headers = [
      'Inspection ID',
      'Provider',
      'Provider Code',
      'Type',
      'Date',
      'Inspector',
      'Overall Score',
      'Credentialing Score',
      'Accreditation Score',
      'Rating',
      'Status',
    ];
    const rows = inspections.map(i => [
      i.id,
      i.provider_name || 'Provider Facility',
      i.provider_code || 'NMIS-FAC',
      i.inspection_type,
      i.scheduled_date,
      i.inspector_name || 'Unassigned',
      i.score ?? 'N/A',
      `${i.credentialing_points ?? 0}/${i.credentialing_possible ?? 0}`,
      `${i.accreditation_points ?? 0}/${i.accreditation_possible ?? 0}`,
      i.rating || 'N/A',
      i.status,
    ]);

    return exportToCsv('inspection-compliance-score-breakdown', headers, rows);
  } catch (error) {
    console.error('Failed to generate inspection report:', error);
    throw new Error('Unable to generate inspection compliance report.');
  }
}

export async function generateFinancialSummaryReport() {
  try {
    // Mocking financial summary for now as there's no direct financial repo yet
    const headers = ['Period', 'Total Capitation', 'Total Claims', 'Net Payable', 'Status'];
    const rows = [
      ['2026-08', '750000', '1200000', '1950000', 'Paid'],
      ['2026-07', '745000', '1150000', '1895000', 'Paid'],
      ['2026-06', '740000', '1100000', '1840000', 'Paid'],
    ];
    return exportToCsv('financial-summary-report', headers, rows);
  } catch (error) {
    throw new Error('Unable to generate financial summary report.');
  }
}

export async function generateEnrolmentReport() {
  try {
    const enrollees = await fetchEnrollees({ pageSize: 10000 }); // Limit to 10k for performance
    const headers = [
      'Policy Number', 
      'First Name', 
      'Last Name', 
      'Gender', 
      'Category', 
      'Sector', 
      'LGA', 
      'Provider Name', 
      'Provider Code', 
      'Period'
    ];
    const rows = enrollees.map(e => [
      e.policyNumber,
      e.firstName,
      e.lastName,
      e.gender,
      e.category,
      e.sector,
      e.lga,
      e.providerName,
      e.providerCode,
      e.period
    ]);

    return exportToCsv('population-demographics-report', headers, rows);
  } catch (error) {
    console.error('Failed to generate enrolment report:', error);
    throw new Error('Unable to generate population demographics report.');
  }
}

export async function generateInspectionPdfReport() {
  try {
    const inspections = await getInspections();
    const printable = window.open('', '_blank', 'noopener,noreferrer');
    if (!printable) throw new Error('Allow pop-ups to generate the inspection PDF report.');

    const escapeHtml = (value: unknown) => String(value ?? '—')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const rows = inspections.map(i => `<tr>
      <td>${escapeHtml(i.provider_name || 'Provider Facility')}<small>${escapeHtml(i.provider_code || 'NMIS-FAC')}</small></td>
      <td>${escapeHtml(i.inspection_type)}</td>
      <td>${escapeHtml(i.scheduled_date)}</td>
      <td class="score overall">${escapeHtml(i.score ?? '—')}%</td>
      <td class="score">${escapeHtml(`${i.credentialing_points ?? 0}/${i.credentialing_possible ?? 0}`)}</td>
      <td class="score">${escapeHtml(`${i.accreditation_points ?? 0}/${i.accreditation_possible ?? 0}`)}</td>
      <td>${escapeHtml(i.status)}</td>
    </tr>`).join('');

    printable.document.write(`<!doctype html><html><head><title>ODCHC Inspection Compliance Report</title><style>
      @page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#123b5d;margin:0}header{border-bottom:4px solid #f28c28;padding:0 0 14px;margin-bottom:20px}h1{font-size:20px;margin:0;color:#0b4f82}p{margin:5px 0;color:#55738b;font-size:11px}.brand{color:#f28c28;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#0b4f82;color:#fff;text-align:left;padding:9px 7px;font-size:9px;text-transform:uppercase;letter-spacing:.04em}td{border-bottom:1px solid #d6e5f0;padding:8px 7px;vertical-align:top}tbody tr:nth-child(even){background:#f5f9fc}td small{display:block;color:#55738b;margin-top:3px}.score{font-weight:700;color:#0b4f82;text-align:center}.overall{color:#f28c28}footer{margin-top:18px;font-size:9px;color:#55738b;display:flex;justify-content:space-between}@media print{.no-print{display:none}}
    </style></head><body><header><div class="brand">Ondo State Contributory Health Commission</div><h1>Inspection Compliance Report — Credentialing &amp; Accreditation Score Breakdown</h1><p>Generated ${escapeHtml(new Date().toLocaleString('en-NG'))}. Personnel licensing and facility-standard subtotals are shown alongside the overall score.</p></header><table><thead><tr><th>Provider / Facility</th><th>Facility Type</th><th>Date</th><th>Overall</th><th>Credentialing<br>(Personnel)</th><th>Accreditation<br>(Infrastructure + Services)</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="7">No inspection records available.</td></tr>'}</tbody></table><footer><span>ODCHC ORANGHIS · NMIS</span><span>Use the browser print dialog to save as PDF.</span></footer><script>window.onload=function(){window.focus();window.print();}</script></body></html>`);
    printable.document.close();
    return true;
  } catch (error) {
    console.error('Failed to generate inspection PDF report:', error);
    throw new Error('Unable to generate inspection PDF report.');
  }
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
