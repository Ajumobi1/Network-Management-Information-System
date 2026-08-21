import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  HeadingLevel,
  ImageRun,
  PageOrientation,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import type { InspectionReportPdfInput } from './inspectionReportPdf';

type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType];

const COLORS = {
  navy: '0B3858',
  blue: '0F5C8F',
  orange: 'F07816',
  lightBlue: 'EAF3F9',
  lightOrange: 'FFF2E5',
  lightGray: 'F4F7FA',
  line: 'C9D4DE',
  ink: '17212B',
  muted: '5B6975',
  green: '18753F',
  lightGreen: 'E9F6EE',
  red: 'B72222',
  lightRed: 'FDECEC',
  white: 'FFFFFF',
};

const borders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
  left: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
  right: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLORS.line },
};

function safeText(value: unknown) {
  return String(value ?? '').trim() || 'Not recorded';
}

function formatDate(value: string) {
  if (!value) return 'Not recorded';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? safeText(value) : date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shortResponse(item: InspectionReportPdfInput['items'][number], response: InspectionReportPdfInput['responses'][string] | undefined) {
  if (!response) return 'Not answered';
  if (item.response_type === 'boolean') return response.boolean === null || response.boolean === undefined ? 'Not answered' : response.boolean ? 'YES' : 'NO';
  return response.number || 'Not answered';
}

function run(text: string, options: { bold?: boolean; color?: string; size?: number; italic?: boolean } = {}) {
  return new TextRun({ text: safeText(text), bold: options.bold, color: options.color || COLORS.ink, size: options.size || 20, italics: options.italic });
}

function paragraph(text: string, options: { bold?: boolean; color?: string; size?: number; align?: DocxAlignment; spacingAfter?: number; spacingBefore?: number; italic?: boolean } = {}) {
  return new Paragraph({
    alignment: options.align,
    spacing: { after: options.spacingAfter ?? 80, before: options.spacingBefore ?? 0 },
    children: [run(text, options)],
  });
}

function cell(text: string, options: { bold?: boolean; color?: string; fill?: string; width?: number; align?: DocxAlignment; size?: number } = {}) {
  return new TableCell({
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    shading: { fill: options.fill || COLORS.white, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({ alignment: options.align, spacing: { after: 0 }, children: [run(text, { bold: options.bold, color: options.color, size: options.size || 18 })] })],
  });
}

function headerCell(text: string, width?: number) {
  return cell(text, { bold: true, color: COLORS.white, fill: COLORS.blue, width, size: 16 });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 220, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.orange, space: 4 } },
    children: [run(text, { bold: true, color: COLORS.navy, size: 24 })],
  });
}

function imageBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function recommendationColor(recommendation: string) {
  const value = recommendation.toLowerCase();
  return value.includes('recommended') && !value.includes('not') ? COLORS.green : value.includes('conditional') ? COLORS.orange : COLORS.red;
}

export function inspectionReportDocxFileName(providerName: string, inspectionDate: string) {
  const safeName = providerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'provider';
  return `odchc-nmis-inspection-outcome-${safeName}-${inspectionDate || new Date().toISOString().slice(0, 10)}.docx`;
}

export async function exportInspectionDocx(input: InspectionReportPdfInput) {
  const summaryRows = new Table({
    width: { size: 10000, type: WidthType.DXA },
    borders,
    rows: [
      new TableRow({ children: [headerCell('OVERALL SCORE', 3333), headerCell('CREDENTIALING', 3333), headerCell('ACCREDITATION', 3334)] }),
      new TableRow({ children: [cell(`${input.score.percentage}%\n${input.score.points} / ${input.score.possible}`, { bold: true, fill: COLORS.lightBlue, align: AlignmentType.CENTER, size: 28 }), cell(`${input.score.credentialingPoints} / ${input.score.credentialingPossible}`, { bold: true, fill: COLORS.lightBlue, align: AlignmentType.CENTER, size: 25 }), cell(`${input.score.accreditationPoints} / ${input.score.accreditationPossible}`, { bold: true, fill: COLORS.lightOrange, align: AlignmentType.CENTER, size: 25 })] }),
    ],
  });

  const profileValues: Array<[string, string]> = [
    ['Facility', safeText(input.profile.facility_name || input.providerName)],
    ['Provider Code', safeText(input.providerCode)],
    ['Address', safeText(input.profile.address)],
    ['Telephone', safeText(input.profile.telephone)],
    ['Facility Email', safeText(input.profile.facility_email)],
    ['Inspection Date', formatDate(input.profile.inspection_date || input.inspectionDate)],
    ['Physician / Superintendent', safeText(input.profile.physician_in_charge || input.profile.superintendent_pharmacist)],
    ['Desk Officer / Contact', safeText(input.profile.desk_officer || input.profile.contact_person)],
    ['Hospital Beds', safeText(input.profile.hospital_beds)],
    ['NHIA Registration', safeText(input.profile.nhia_reg_no || input.profile.nhia_registration_no)],
    ['SMOH Registration', safeText(input.profile.smoh_reg_no || input.profile.smoh_pcn_registration_no)],
  ];
  const profileRows: TableRow[] = [];
  for (let index = 0; index < profileValues.length; index += 2) {
    const left = profileValues[index];
    const right = profileValues[index + 1];
    profileRows.push(new TableRow({ children: [cell(`${left[0]}\n${left[1]}`, { width: 5000, fill: COLORS.lightGray }), right ? cell(`${right[0]}\n${right[1]}`, { width: 5000, fill: COLORS.lightGray }) : cell('', { width: 5000, fill: COLORS.lightGray })] }));
  }

  const eligibilityRows = [new TableRow({ children: [headerCell('No.', 600), headerCell('Criterion', 6400), headerCell('Status', 1200), headerCell('Evidence / Remarks', 1800)] })];
  input.eligibility.forEach((criterion, index) => {
    const met = criterion.met;
    eligibilityRows.push(new TableRow({ children: [cell(String(index + 1), { align: AlignmentType.CENTER, fill: met ? COLORS.lightGreen : COLORS.lightRed }), cell(criterion.criterion_label, { fill: met ? COLORS.lightGreen : COLORS.lightRed }), cell(met ? 'MET' : 'NOT MET', { bold: true, color: met ? COLORS.green : COLORS.red, fill: met ? COLORS.lightGreen : COLORS.lightRed, align: AlignmentType.CENTER }), cell(criterion.notes || '', { fill: met ? COLORS.lightGreen : COLORS.lightRed })] }));
  });

  const itemsBySection = input.sections
    .filter(section => !['A', 'PROFILE', 'ELIGIBILITY', 'REMARKS', 'TEAM'].includes(section.section_code.toUpperCase()))
    .map(section => ({ section, items: input.items.filter(item => item.section_code === section.section_code) }))
    .filter(group => group.items.length > 0);
  const checklistChildren: (Paragraph | Table)[] = [];
  itemsBySection.forEach(group => {
    checklistChildren.push(new Paragraph({ spacing: { before: 140, after: 70 }, children: [run(group.section.section_label, { bold: true, color: COLORS.blue, size: 20 })] }));
    const rows = [new TableRow({ children: [headerCell('Code', 800), headerCell('Checklist Item', 4300), headerCell('Response', 1000), headerCell('Score', 900), headerCell('Max', 700), headerCell('Evidence / Remarks', 2300)] })];
    group.items.forEach(item => {
      const response = input.responses[item.item_code];
      const score = response?.manual_score || response?.awarded_points || 0;
      rows.push(new TableRow({ children: [cell(item.item_code, { width: 800, size: 15 }), cell(item.item_label, { width: 4300, size: 15 }), cell(shortResponse(item, response), { width: 1000, size: 15, align: AlignmentType.CENTER }), cell(String(score), { width: 900, size: 15, align: AlignmentType.CENTER }), cell(String(item.max_points), { width: 700, size: 15, align: AlignmentType.CENTER }), cell(response?.remark || '', { width: 2300, size: 15 })] }));
    });
    checklistChildren.push(new Table({ width: { size: 10000, type: WidthType.DXA }, borders, rows }));
  });

  const teamRows: TableRow[] = [new TableRow({ children: [headerCell('Name', 3000), headerCell('Role', 2200), headerCell('Inspection Date', 1700), headerCell('Signature', 3100)] })];
  for (const member of input.team) {
    const signatureChildren = member.signature_data
      ? [new Paragraph({ children: [new ImageRun({ type: 'png', data: imageBytes(member.signature_data), transformation: { width: 190, height: 55 } })] })]
      : [paragraph('Signature not recorded', { color: COLORS.red, size: 16 })];
    teamRows.push(new TableRow({ children: [cell(member.name, { width: 3000 }), cell(member.role || 'Inspector', { width: 2200 }), cell(formatDate(member.inspection_date), { width: 1700 }), new TableCell({ width: { size: 3100, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 120, right: 120 }, children: signatureChildren })] }));
  }
  if (!input.team.length) teamRows.push(new TableRow({ children: [cell('No inspection team member was recorded.', { width: 10000, color: COLORS.red })] }));

  const children: (Paragraph | Table)[] = [
    new Table({
      width: { size: 10000, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE, size: 0, color: COLORS.white }, bottom: { style: BorderStyle.NONE, size: 0, color: COLORS.white }, left: { style: BorderStyle.NONE, size: 0, color: COLORS.white }, right: { style: BorderStyle.NONE, size: 0, color: COLORS.white }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: COLORS.white }, insideVertical: { style: BorderStyle.NONE, size: 0, color: COLORS.white } },
      rows: [new TableRow({ children: [cell('ODCHC NMIS', { width: 6000, fill: COLORS.navy, color: COLORS.white, bold: true, size: 30 }), cell('INSPECTION OUTCOME REPORT', { width: 4000, fill: COLORS.orange, color: COLORS.white, bold: true, size: 17, align: AlignmentType.RIGHT })] })],
    }),
    paragraph(input.templateName, { bold: true, color: COLORS.navy, size: 30, spacingBefore: 220, spacingAfter: 70 }),
    paragraph(`${input.facilityType} - ${input.providerName}`, { bold: true, color: COLORS.ink, size: 22, spacingAfter: 40 }),
    paragraph(`Inspection date: ${formatDate(input.inspectionDate)}   |   Report ID: ${input.inspectionId}`, { color: COLORS.muted, size: 16, spacingAfter: 160 }),
    summaryRows,
    paragraph(`Recommendation: ${input.score.recommendation}`, { bold: true, color: recommendationColor(input.score.recommendation), size: 22, spacingBefore: 130, spacingAfter: 40 }),
    paragraph(`Thresholds: >=${input.passingThreshold}% recommended; ${input.conditionalThreshold}-${Math.max(input.passingThreshold - 1, input.conditionalThreshold)}% conditional; below ${input.conditionalThreshold}% not recommended`, { color: COLORS.muted, size: 15, spacingAfter: 140 }),
    sectionHeading('Facility Profile'),
    new Table({ width: { size: 10000, type: WidthType.DXA }, borders, rows: profileRows }),
    sectionHeading('Eligibility Criteria'),
    new Table({ width: { size: 10000, type: WidthType.DXA }, borders, rows: eligibilityRows }),
    sectionHeading('Checklist Assessment'),
    ...checklistChildren,
    sectionHeading('General Remarks / Recommendation'),
    new Table({ width: { size: 10000, type: WidthType.DXA }, borders, rows: [new TableRow({ children: [cell(input.generalRemarks || 'No general remarks were recorded.', { width: 10000, fill: COLORS.lightGray })] })] }),
    sectionHeading('Inspection Team'),
    new Table({ width: { size: 10000, type: WidthType.DXA }, borders, rows: teamRows }),
    paragraph('This report is generated by ODCHC NMIS. It is a controlled inspection outcome record and should be retained with the facility accreditation file.', { color: COLORS.muted, size: 14, italic: true, spacingBefore: 180 }),
  ];

  const document = new DocxDocument({
    creator: 'ODCHC NMIS',
    title: `Inspection Outcome - ${input.providerName}`,
    subject: 'Provider accreditation inspection outcome',
    description: 'Official ODCHC NMIS inspection outcome report',
    styles: { default: { document: { run: { font: 'Arial', size: 20, color: COLORS.ink }, paragraph: { spacing: { after: 80 } } } } },
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE, width: 15840, height: 12240 },
          margin: { top: 560, bottom: 560, left: 720, right: 720 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(document);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = inspectionReportDocxFileName(input.providerName, input.inspectionDate);
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
