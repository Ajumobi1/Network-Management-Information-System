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

type CsvRow = Record<string, string | number | boolean | null | undefined>;

const columns = [
  'Record Type',
  'Inspection ID',
  'Provider / Facility',
  'Provider Code',
  'Facility Type',
  'Template',
  'Inspection Date',
  'Status',
  'Overall Score (%)',
  'Overall Points',
  'Overall Possible',
  'Credentialing Score',
  'Credentialing Possible',
  'Accreditation Score',
  'Accreditation Possible',
  'Recommendation',
  'Eligibility Criterion',
  'Eligibility Status',
  'Eligibility Evidence',
  'Section Code',
  'Checklist Item Code',
  'Checklist Item',
  'Response',
  'Observed Count',
  'Manual Score',
  'Awarded Points',
  'Maximum Points',
  'Included in Score',
  'Evidence Remark',
  'General Remarks',
  'Inspector / Team Member',
  'Team Role',
  'Team Date',
  'Signature Captured',
];

function csvValue(value: unknown) {
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
  if (response.manual_score !== undefined && response.manual_score !== '') return response.manual_score;
  return response.number || 'Not answered';
}

export function inspectionCsvFileName(providerName: string, inspectionDate: string) {
  const safeName = providerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'provider';
  return `odchc-nmis-inspection-outcome-${safeName}-${inspectionDate || new Date().toISOString().slice(0, 10)}.csv`;
}

export function exportInspectionCsv(input: InspectionReportCsvInput) {
  const rows: CsvRow[] = [];
  const summary = input.score;
  rows.push({
    'Record Type': 'OUTCOME SUMMARY',
    'Inspection ID': input.inspectionId,
    'Provider / Facility': input.providerName,
    'Provider Code': input.providerCode,
    'Facility Type': input.facilityType,
    Template: input.templateName,
    'Inspection Date': input.inspectionDate,
    Status: input.status,
    'Overall Score (%)': summary.percentage,
    'Overall Points': summary.points,
    'Overall Possible': summary.possible,
    'Credentialing Score': summary.credentialingPoints,
    'Credentialing Possible': summary.credentialingPossible,
    'Accreditation Score': summary.accreditationPoints,
    'Accreditation Possible': summary.accreditationPossible,
    Recommendation: summary.recommendation,
    'General Remarks': input.generalRemarks,
  });

  input.eligibility.forEach(criterion => rows.push({
    'Record Type': 'ELIGIBILITY',
    'Inspection ID': input.inspectionId,
    'Provider / Facility': input.providerName,
    'Provider Code': input.providerCode,
    'Facility Type': input.facilityType,
    Template: input.templateName,
    'Inspection Date': input.inspectionDate,
    Status: input.status,
    'Eligibility Criterion': criterion.criterion_label,
    'Eligibility Status': criterion.met ? 'MET' : 'NOT MET',
    'Eligibility Evidence': criterion.notes,
  }));

  input.items.forEach(item => {
    const response = input.responses[item.item_code];
    rows.push({
      'Record Type': 'CHECKLIST ITEM',
      'Inspection ID': input.inspectionId,
      'Provider / Facility': input.providerName,
      'Provider Code': input.providerCode,
      'Facility Type': input.facilityType,
      Template: input.templateName,
      'Inspection Date': input.inspectionDate,
      Status: input.status,
      'Section Code': item.section_code,
      'Checklist Item Code': item.item_code,
      'Checklist Item': item.item_label,
      Response: responseText(item, response),
      'Observed Count': response?.number,
      'Manual Score': response?.manual_score,
      'Awarded Points': response?.awarded_points,
      'Maximum Points': item.max_points,
      'Included in Score': Boolean(response?.included_in_denominator),
      'Evidence Remark': response?.remark,
    });
  });

  input.team.forEach(member => rows.push({
    'Record Type': 'INSPECTION TEAM',
    'Inspection ID': input.inspectionId,
    'Provider / Facility': input.providerName,
    'Provider Code': input.providerCode,
    'Facility Type': input.facilityType,
    Template: input.templateName,
    'Inspection Date': input.inspectionDate,
    Status: input.status,
    'Inspector / Team Member': member.name,
    'Team Role': member.role,
    'Team Date': member.inspection_date,
    'Signature Captured': Boolean(member.signature_data),
  }));

  const csv = [columns.join(','), ...rows.map(row => columns.map(column => csvValue(row[column])).join(','))].join('\r\n');
  downloadCsv(csv, inspectionCsvFileName(input.providerName, input.inspectionDate));
}
