import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { InspectionTemplateItem } from '../../repositories/inspections/structuredInspectionRepository';

export type InspectionReportResponse = {
  number: string;
  manual_score: string;
  boolean: boolean | null;
  remark: string;
};

export type InspectionReportTeamMember = {
  name: string;
  role: string;
  inspection_date: string;
  signature_data: string;
};

export type InspectionReportSection = {
  section_code: string;
  section_label: string;
};

export type InspectionReportPdfInput = {
  inspectionId: string;
  providerName: string;
  providerCode?: string;
  facilityType: string;
  inspectionDate: string;
  templateName: string;
  passingThreshold: number;
  conditionalThreshold: number;
  profile: Record<string, string>;
  eligibility: Array<{ criterion_label: string; met: boolean; notes: string }>;
  items: InspectionTemplateItem[];
  sections: InspectionReportSection[];
  responses: Record<string, InspectionReportResponse>;
  generalRemarks: string;
  team: InspectionReportTeamMember[];
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

function pdfSafeText(value: unknown) {
  return String(value ?? '')
    .replace(/\u20A6/g, 'NGN ') // ₦
    .replace(/\u2265/g, '>=')   // ≥
    .replace(/[\u2013\u2014]/g, '-') // – —
    .replace(/[\u00B7\u2022]/g, '-') // · •
    .replace(/[\u201C\u201D]/g, '"') // “ ”
    .replace(/[\u2018\u2019]/g, "'") // ‘ ’
    .normalize('NFKD')
    .replace(/[^\x00-\xFF]/g, '?');
}

const COLORS = {
  blue: rgb(0.04, 0.31, 0.51),
  orange: rgb(0.94, 0.48, 0.08),
  ink: rgb(0.08, 0.12, 0.18),
  muted: rgb(0.34, 0.40, 0.47),
  line: rgb(0.84, 0.88, 0.92),
  soft: rgb(0.95, 0.97, 0.99),
  success: rgb(0.07, 0.47, 0.28),
  danger: rgb(0.72, 0.13, 0.13),
};

function toBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function formatDate(value: string) {
  if (!value) return 'Not recorded';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function displayValue(value: string | boolean | null | undefined) {
  if (value === undefined || value === null || value === '') return 'Not recorded';
  return String(value);
}

class ReportWriter {
  private page: PDFPage;
  private y: number;
  private readonly width = 612;
  private readonly height = 792;
  private readonly margin = 42;
  private readonly regular: PDFFont;
  private readonly bold: PDFFont;
  private readonly document: PDFDocument;

  constructor(document: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.document = document;
    this.regular = regular;
    this.bold = bold;
    this.page = document.addPage([this.width, this.height]);
    this.y = this.height - this.margin;
  }

  private nextPage() {
    this.page = this.document.addPage([this.width, this.height]);
    this.y = this.height - this.margin;
  }

  private ensure(height: number) {
    if (this.y - height < this.margin) this.nextPage();
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
    const words = pdfSafeText(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  text(text: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number } = {}) {
    const size = options.size || 9;
    const font = options.font || this.regular;
    const color = options.color || COLORS.ink;
    const maxWidth = options.maxWidth || this.width - (this.margin * 2);
    const lineHeight = options.lineHeight || size + 4;
    const lines = this.wrap(text, font, size, maxWidth);
    this.ensure(lines.length * lineHeight + 2);
    lines.forEach(line => {
      this.page.drawText(line, { x: this.margin, y: this.y, size, font, color });
      this.y -= lineHeight;
    });
    this.y -= 2;
  }

  wrapForLayout(text: string, font: PDFFont, size: number, maxWidth: number) {
    return this.wrap(text, font, size, maxWidth);
  }

  textAt(text: string, x: number, y: number, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth: number; lineHeight?: number }) {
    const size = options.size || 9;
    const font = options.font || this.regular;
    const color = options.color || COLORS.ink;
    const lineHeight = options.lineHeight || size + 4;
    const lines = this.wrap(text, font, size, options.maxWidth);
    lines.forEach((line, index) => {
      this.page.drawText(line, { x, y: y - (index * lineHeight), size, font, color });
    });
    return lines.length * lineHeight;
  }

  heading(text: string, size = 13) {
    this.ensure(size + 18);
    this.page.drawText(pdfSafeText(text), { x: this.margin, y: this.y, size, font: this.bold, color: COLORS.blue });
    this.y -= size + 8;
    this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.width - this.margin, y: this.y }, thickness: 0.8, color: COLORS.line });
    this.y -= 12;
  }

  labelValue(label: string, value: string, x: number, width: number) {
    const labelHeight = this.textAt(label.toUpperCase(), x, this.y, { size: 7, font: this.bold, color: COLORS.muted, maxWidth: width, lineHeight: 9 });
    return labelHeight + this.textAt(value, x, this.y - labelHeight - 2, { size: 9, font: this.regular, color: COLORS.ink, maxWidth: width, lineHeight: 11 });
  }

  twoColumn(values: Array<[string, string]>) {
    const columnWidth = (this.width - (this.margin * 2) - 18) / 2;
    for (let index = 0; index < values.length; index += 2) {
      const measure = (entry: [string, string]) => {
        const labelLines = this.wrap(entry[0].toUpperCase(), this.bold, 7, columnWidth).length;
        const valueLines = this.wrap(entry[1], this.regular, 9, columnWidth).length;
        return (labelLines * 9) + (valueLines * 11) + 2;
      };
      const rowHeight = Math.max(measure(values[index]), values[index + 1] ? measure(values[index + 1]) : 0) + 14;
      this.ensure(rowHeight);
      this.labelValue(values[index][0], values[index][1], this.margin, columnWidth);
      if (values[index + 1]) this.labelValue(values[index + 1][0], values[index + 1][1], this.margin + columnWidth + 18, columnWidth);
      this.y -= rowHeight;
    }
  }

  box(text: string, x: number, width: number, color = COLORS.soft) {
    const lines = this.wrap(text, this.regular, 9, width - 20);
    const height = Math.max(32, (lines.length * 12) + 18);
    this.page.drawRectangle({ x, y: this.y - height + 5, width, height, color, borderColor: COLORS.line, borderWidth: 0.7 });
    lines.forEach((line, index) => this.page.drawText(line, { x: x + 10, y: this.y - 10 - (index * 12), size: 9, font: this.regular, color: COLORS.ink }));
    this.y -= height;
    return height;
  }

  setY(value: number) { this.y = value; }
  getY() { return this.y; }
  getPage() { return this.page; }
  getMargin() { return this.margin; }
  getWidth() { return this.width; }
  getRegular() { return this.regular; }
  getBold() { return this.bold; }
  ensureSpace(height: number) { this.ensure(height); }
  addGap(height: number) { this.y -= height; }
}

function recommendationColor(recommendation: string) {
  return recommendation.toLowerCase().includes('recommended') && !recommendation.toLowerCase().includes('not') ? COLORS.success : recommendation.toLowerCase().includes('conditional') ? COLORS.orange : COLORS.danger;
}

export async function buildInspectionReportPdf(input: InspectionReportPdfInput) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const writer = new ReportWriter(document, regular, bold);
  const pageWidth = writer.getWidth();
  const margin = writer.getMargin();

  writer.getPage().drawRectangle({ x: 0, y: 0, width: pageWidth, height: 792, color: rgb(1, 1, 1) });
  writer.getPage().drawRectangle({ x: 0, y: 748, width: pageWidth, height: 44, color: COLORS.blue });
  writer.getPage().drawRectangle({ x: 0, y: 744, width: pageWidth, height: 4, color: COLORS.orange });
  writer.getPage().drawText('ODCHC NMIS', { x: margin, y: 765, size: 16, font: bold, color: rgb(1, 1, 1) });
  writer.getPage().drawText('INSPECTION OUTCOME REPORT', { x: margin, y: 753, size: 7, font: bold, color: rgb(0.88, 0.94, 1) });
  writer.setY(720);

  writer.text(input.templateName, { size: 16, font: bold, color: COLORS.blue, lineHeight: 20 });
  writer.text(`${input.facilityType} - ${input.providerName}`, { size: 11, font: bold, color: COLORS.ink });
  writer.text(`Inspection date: ${formatDate(input.inspectionDate)} - Report ID: ${input.inspectionId}`, { size: 8, color: COLORS.muted });
  writer.addGap(8);

  const scoreBoxes = [
    [`OVERALL SCORE\n${input.score.percentage}%\n${input.score.points} / ${input.score.possible}`, COLORS.soft],
    [`CREDENTIALING\n${input.score.credentialingPoints} / ${input.score.credentialingPossible}`, rgb(0.96, 0.98, 1)],
    [`ACCREDITATION\n${input.score.accreditationPoints} / ${input.score.accreditationPossible}`, rgb(1, 0.98, 0.94)],
  ] as const;
  const boxWidth = (pageWidth - (margin * 2) - 20) / 3;
  writer.ensureSpace(72);
  const scoreY = writer.getY();
  scoreBoxes.forEach(([label, color], index) => {
    const x = margin + index * (boxWidth + 10);
    writer.getPage().drawRectangle({ x, y: scoreY - 58, width: boxWidth, height: 58, color, borderColor: COLORS.line, borderWidth: 0.7 });
    const lines = label.split('\n');
    lines.forEach((line, lineIndex) => writer.getPage().drawText(pdfSafeText(line), { x: x + 9, y: scoreY - 14 - lineIndex * 14, size: lineIndex === 0 ? 7 : 11, font: lineIndex === 0 ? bold : regular, color: lineIndex === 0 ? COLORS.muted : COLORS.ink }));
  });
  writer.setY(scoreY - 76);
  writer.text(`Recommendation: ${input.score.recommendation}`, { size: 11, font: bold, color: recommendationColor(input.score.recommendation) });
  writer.text(`Thresholds: >=${input.passingThreshold}% recommended - ${input.conditionalThreshold}-${Math.max(input.passingThreshold - 1, input.conditionalThreshold)}% conditional - below ${input.conditionalThreshold}% not recommended`, { size: 8, color: COLORS.muted });

  writer.heading('Facility profile');
  writer.twoColumn([
    ['Facility', displayValue(input.profile.facility_name || input.providerName)],
    ['Provider code', displayValue(input.providerCode)],
    ['Address', displayValue(input.profile.address)],
    ['Telephone', displayValue(input.profile.telephone)],
    ['Facility email', displayValue(input.profile.facility_email)],
    ['Inspection date', formatDate(input.profile.inspection_date || input.inspectionDate)],
    ['Physician / superintendent', displayValue(input.profile.physician_in_charge || input.profile.superintendent_pharmacist)],
    ['Desk officer / contact', displayValue(input.profile.desk_officer || input.profile.contact_person)],
    ['Hospital beds', displayValue(input.profile.hospital_beds)],
    ['NHIA registration', displayValue(input.profile.nhia_reg_no || input.profile.nhia_registration_no)],
    ['SMOH registration', displayValue(input.profile.smoh_reg_no || input.profile.smoh_pcn_registration_no)],
  ]);

  writer.heading('Eligibility criteria');
  if (!input.eligibility.length) writer.text('No eligibility criteria were configured for this template.', { size: 9, color: COLORS.muted });
  input.eligibility.forEach((criterion, index) => {
    const labelWidth = pageWidth - margin * 2 - 96;
    const labelLines = writer.wrapForLayout(criterion.criterion_label, regular, 9, labelWidth);
    const evidenceLines = criterion.notes ? writer.wrapForLayout(`Evidence: ${criterion.notes}`, regular, 8, pageWidth - margin * 2 - 18) : [];
    const rowHeight = Math.max(22, labelLines.length * 11) + (evidenceLines.length ? evidenceLines.length * 10 + 4 : 0) + 8;
    writer.ensureSpace(rowHeight);
    const rowY = writer.getY();
    const status = criterion.met ? 'MET' : 'NOT MET';
    const statusColor = criterion.met ? COLORS.success : COLORS.danger;
    writer.getPage().drawText(`${index + 1}.`, { x: margin, y: rowY, size: 9, font: bold, color: COLORS.blue });
    writer.textAt(criterion.criterion_label, margin + 18, rowY, { size: 9, font: regular, color: COLORS.ink, maxWidth: labelWidth, lineHeight: 11 });
    writer.getPage().drawText(status, { x: pageWidth - margin - 58, y: rowY, size: 8, font: bold, color: statusColor });
    writer.setY(rowY - Math.max(22, labelLines.length * 11));
    if (criterion.notes) writer.text(`Evidence: ${criterion.notes}`, { size: 8, color: COLORS.muted, maxWidth: pageWidth - margin * 2 - 18, lineHeight: 10 });
    writer.addGap(6);
  });

  const sections = input.sections.filter(section => !['A', 'PROFILE', 'ELIGIBILITY', 'REMARKS', 'TEAM'].includes(section.section_code.toUpperCase()) && input.items.some(item => item.section_code === section.section_code));
  sections.forEach(section => {
    writer.heading(section.section_label);
    const items = input.items.filter(item => item.section_code === section.section_code);
    items.forEach(item => {
      const response = input.responses[item.item_code] || { number: '', manual_score: '', boolean: null, remark: '' };
      const available = item.response_type === 'number' ? displayValue(response.number) : response.boolean === null ? 'Not answered' : response.boolean ? 'YES' : 'NO';
      const score = (item.scoring_method === 'manual_only' || item.manual_score_allowed) && response.manual_score !== '' ? `${response.manual_score} / ${item.max_points}` : response.boolean === null && response.number === '' ? `Not scored / ${item.max_points}` : `${available} - ${item.max_points} max`;
      const labelWidth = pageWidth - margin * 2 - 150;
      const labelLines = writer.wrapForLayout(item.item_label, bold, 9, labelWidth);
      const itemHeight = Math.max(18, labelLines.length * 11) + (item.response_type === 'number' ? 14 : 0) + (response.remark ? 20 : 0) + 12;
      writer.ensureSpace(itemHeight);
      const itemY = writer.getY();
      writer.getPage().drawText(pdfSafeText(item.item_code.replace(/[^0-9A-Za-z]/g, '')), { x: margin, y: itemY, size: 8, font: bold, color: COLORS.blue });
      writer.textAt(item.item_label, margin + 28, itemY, { size: 9, font: bold, color: COLORS.ink, maxWidth: labelWidth, lineHeight: 11 });
      writer.textAt(score, pageWidth - margin - 120, itemY, { size: 8, font: bold, color: COLORS.blue, maxWidth: 120, lineHeight: 10 });
      writer.setY(itemY - Math.max(18, labelLines.length * 11));
      if (item.response_type === 'number') writer.text(`Observed: ${available}`, { size: 8, color: COLORS.muted });
      if (response.remark) writer.text(`Evidence: ${response.remark}`, { size: 8, color: COLORS.muted });
      writer.getPage().drawLine({ start: { x: margin, y: writer.getY() }, end: { x: pageWidth - margin, y: writer.getY() }, thickness: 0.45, color: COLORS.line });
      writer.addGap(7);
    });
  });

  writer.heading('General remarks / recommendation');
  writer.box(input.generalRemarks || 'No general remarks were recorded.', margin, pageWidth - margin * 2, COLORS.soft);
  writer.addGap(12);

  writer.heading('Inspection team');
  if (!input.team.length) writer.text('No inspection team member was recorded.', { size: 9, color: COLORS.danger });
  for (const member of input.team) {
    writer.ensureSpace(96);
    const teamY = writer.getY();
    writer.getPage().drawText(pdfSafeText(member.name || 'Unnamed team member'), { x: margin, y: teamY, size: 10, font: bold, color: COLORS.ink });
    writer.getPage().drawText(pdfSafeText(`${member.role || 'Inspector'} - ${formatDate(member.inspection_date)}`), { x: margin, y: teamY - 14, size: 8, font: regular, color: COLORS.muted });
    if (member.signature_data) {
      try {
        const signature = await document.embedPng(toBytes(member.signature_data));
        writer.getPage().drawImage(signature, { x: margin, y: teamY - 76, width: 180, height: 48 });
      } catch {
        writer.getPage().drawText('Signature recorded in system', { x: margin, y: teamY - 42, size: 8, font: regular, color: COLORS.muted });
      }
    } else writer.getPage().drawText('Signature not recorded', { x: margin, y: teamY - 42, size: 8, font: regular, color: COLORS.danger });
    writer.setY(teamY - 92);
  }

  const pages = document.getPages();
  pages.forEach((page, index) => {
    page.drawText(`ODCHC NMIS - Inspection Outcome Report - Page ${index + 1} of ${pages.length}`, { x: margin, y: 20, size: 7, font: regular, color: COLORS.muted });
  });

  return document.save();
}

export function inspectionReportFileName(providerName: string, inspectionDate: string) {
  const safeName = providerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'provider';
  return `odchc-nmis-inspection-report-${safeName}-${inspectionDate || new Date().toISOString().slice(0, 10)}.pdf`;
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function pdfBytesToBlob(bytes: Uint8Array) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type: 'application/pdf' });
}

export function reportStoragePath(providerId: string, inspectionId: string) {
  return `${providerId}/${inspectionId}.pdf`;
}

export function isInspectionReport(documentType: string) {
  return documentType.toLowerCase() === 'inspection report';
}
