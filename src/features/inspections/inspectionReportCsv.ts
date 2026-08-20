export type InspectionReportCsvInput = {
  inspectionId: string;
  providerName: string;
  providerCode?: string;
  facilityType: string;
  inspectionDate: string;
  status?: string;
  templateName: string;
  eligibility: Array<{ criterion_label: string; met: boolean; notes?: string }>;
  items: Array<{
    section_code: string;
    item_code: string;
    item_label: string;
    response_type: string;
    max_points: number;
    scoring_method?: string;
    manual_score_allowed?: boolean;
  }>;
  responses: Record<string, {
    number?: string;
    manual_score?: string;
    boolean?: boolean | null;
    remark?: string;
    awarded_points?: number;
    included_in_denominator?: boolean;
  }>;
  generalRemarks: string;
  team: Array<{ name: string; role: string; inspection_date: string; signature_data?: string }>;
  score: {
    points: number;
    possible: number;
    percentage: number;
    recommendation: string;
    credentialingPoints: number;
    credentialingPossible: number;
    accreditationPoints: number;
    accreditationPossible: number;
  };
};

type CsvValue = string | number | boolean | null | undefined;

function csvValue(value: CsvValue) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function responseText(item: InspectionReportCsvInput['items'][number], response: InspectionReportCsvInput['responses'][string] | undefined) {
  if (!response) return 'Not answered';
  if (item.response_type === 'boolean') return response.boolean === null || response.boolean === undefined ? 'Not answered' : response.boolean ? 'YES' : 'NO';
  return response.number || 'Not answered';
}

export function inspectionCsvFileName(providerName: string, inspectionDate: string) {
  const safeName = providerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'provider';
  return `odchc-nmis-inspection-outcome-${safeName}-${inspectionDate || new Date().toISOString().slice(0, 10)}.csv`;
}

export function exportInspectionCsv(input: InspectionReportCsvInput) {
  const rows: CsvValue[][] = [];
  const push = (...values: CsvValue[]) => rows.push(values);
  const blank = () => rows.push([]);
  const summary = input.score;

  push('ODCHC NMIS', 'INSPECTION OUTCOME REPORT');
  push('Report ID', input.inspectionId);
  push('Generated', new Date().toLocaleString('en-NG'));
  blank();

  push('OUTCOME SUMMARY');
  push('Field', 'Value');
  push('Provider / Facility', input.providerName);
  push('Provider Code', input.providerCode || 'Not recorded');
  push('Facility Type', input.facilityType);
  push('Inspection Template', input.templateName);
  push('Inspection Date', input.inspectionDate);
  push('Status', input.status || 'Not recorded');
  push('Overall Score', `${summary.percentage}%`);
  push('Overall Points', `${summary.points} / ${summary.possible}`);
  push('Credentialing Score', `${summary.credentialingPoints} / ${summary.credentialingPossible}`);
  push('Accreditation Score', `${summary.accreditationPoints} / ${summary.accreditationPossible}`);
  push('Recommendation', summary.recommendation);
  push('General Remarks', input.generalRemarks || 'No general remarks were recorded.');
  blank();

  push('ELIGIBILITY CRITERIA');
  push('No.', 'Criterion', 'Status', 'Evidence / Remarks');
  if (!input.eligibility.length) push('', 'No eligibility criteria were configured.', '', '');
  input.eligibility.forEach((criterion, index) => push(index + 1, criterion.criterion_label, criterion.met ? 'MET' : 'NOT MET', criterion.notes || ''));
  blank();

  push('CHECKLIST ASSESSMENT');
  push('Section', 'Item Code', 'Checklist Item', 'Response', 'Observed Count', 'Manual Score', 'Awarded Points', 'Maximum Points', 'Included in Score', 'Evidence Remark');
  input.items.forEach(item => {
    const response = input.responses[item.item_code];
    push(
      item.section_code,
      item.item_code,
      item.item_label,
      responseText(item, response),
      response?.number || '',
      response?.manual_score || '',
      response?.awarded_points ?? 0,
      item.max_points,
      response?.included_in_denominator ? 'YES' : 'NO',
      response?.remark || '',
    );
  });
  blank();

  push('INSPECTION TEAM');
  push('Name', 'Role', 'Inspection Date', 'Signature Captured');
  if (!input.team.length) push('No inspection team member was recorded.', '', '', 'NO');
  input.team.forEach(member => push(member.name, member.role, member.inspection_date, member.signature_data ? 'YES' : 'NO'));

  const csv = rows.map(row => row.map(csvValue).join(',')).join('\r\n');
  downloadCsv(csv, inspectionCsvFileName(input.providerName, input.inspectionDate));
}
