import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import type { InspectionTemplateItem } from '../../repositories/inspections/structuredInspectionRepository';

export type InspectionReportResponse = {
  number: string;
  manual_score: string;
  boolean: boolean | null;
  remark: string;
  awarded_points?: number;
  included_in_denominator?: boolean;
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
    .replace(/\u20A6/g, 'NGN ')
    .replace(/\u2265/g, '>=')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u00B7\u2022]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .normalize('NFKD')
    .replace(/[^\x00-\xFF]/g, '?');
}

const COLORS = {
  blue: rgb(0.035, 0.22, 0.38),
  blue2: rgb(0.04, 0.31, 0.51),
  orange: rgb(0.94, 0.48, 0.08),
  ink: rgb(0.08, 0.12, 0.18),
  muted: rgb(0.34, 0.40, 0.47),
  line: rgb(0.82, 0.86, 0.90),
  soft: rgb(0.96, 0.975, 0.99),
  softBlue: rgb(0.93, 0.96, 0.99),
  softOrange: rgb(1, 0.97, 0.91),
  success: rgb(0.07, 0.47, 0.28),
  softSuccess: rgb(0.91, 0.97, 0.93),
  danger: rgb(0.72, 0.13, 0.13),
  softDanger: rgb(1, 0.94, 0.94),
  white: rgb(1, 1, 1),
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
  return Number.isNaN(date.getTime()) ? pdfSafeText(value) : date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function displayValue(value: string | boolean | null | undefined) {
  if (value === undefined || value === null || value === '') return 'Not recorded';
  return pdfSafeText(value);
}

class ReportWriter {
  private page: PDFPage;
  private y: number;
  private readonly width = 612;
  private readonly height = 792;
  private readonly margin = 42;
  private readonly bottom = 48;
  private readonly regular: PDFFont;
  private readonly bold: PDFFont;
  private readonly document: PDFDocument;
  private pageNumber = 0;

  constructor(document: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.document = document;
    this.regular = regular;
    this.bold = bold;
    this.page = document.addPage([this.width, this.height]);
    this.pageNumber = 1;
    this.drawChrome();
    this.y = 710;
  }

  private drawChrome() {
    this.page.drawRectangle({ x: 0, y: 0, width: this.width, height: this.height, color: COLORS.white });
    this.page.drawRectangle({ x: 0, y: 748, width: this.width, height: 44, color: COLORS.blue });
    this.page.drawRectangle({ x: 0, y: 744, width: this.width, height: 4, color: COLORS.orange });
    this.page.drawText('ODCHC NMIS', { x: this.margin, y: 766, size: 16, font: this.bold, color: COLORS.white });
    this.page.drawText('INSPECTION OUTCOME REPORT', { x: this.margin, y: 753, size: 7, font: this.bold, color: rgb(0.88, 0.94, 1) });
  }

  private nextPage() {
    this.page = this.document.addPage([this.width, this.height]);
    this.pageNumber += 1;
    this.drawChrome();
    this.y = 710;
  }

  private ensure(height: number) {
    if (this.y - height < this.bottom) this.nextPage();
  }

  private breakLongWord(word: string, font: PDFFont, size: number, maxWidth: number) {
    const chunks: string[] = [];
    let chunk = '';
    for (const character of word) {
      const candidate = chunk + character;
      if (chunk && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        chunks.push(chunk);
        chunk = character;
      } else chunk = candidate;
    }
    if (chunk) chunks.push(chunk);
    return chunks.length ? chunks : [''];
  }

  wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
    const words = pdfSafeText(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const pieces = this.breakLongWord(word, font, size, maxWidth);
      for (const piece of pieces) {
        const candidate = line ? `${line} ${piece}` : piece;
        if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
        else {
          lines.push(line);
          line = piece;
        }
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  text(text: string, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number; gap?: number } = {}) {
    const size = options.size || 9;
    const font = options.font || this.regular;
    const color = options.color || COLORS.ink;
    const maxWidth = options.maxWidth || this.width - (this.margin * 2);
    const lineHeight = options.lineHeight || size + 4;
    const gap = options.gap ?? 4;
    const lines = this.wrap(text, font, size, maxWidth);
    this.ensure((lines.length * lineHeight) + gap);
    lines.forEach((line, index) => this.page.drawText(line, { x: this.margin, y: this.y - (index * lineHeight), size, font, color }));
    this.y -= (lines.length * lineHeight) + gap;
    return lines.length * lineHeight;
  }

  textAt(text: string, x: number, y: number, options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth: number; lineHeight?: number }) {
    const size = options.size || 9;
    const font = options.font || this.regular;
    const color = options.color || COLORS.ink;
    const lineHeight = options.lineHeight || size + 4;
    const lines = this.wrap(text, font, size, options.maxWidth);
    lines.forEach((line, index) => this.page.drawText(line, { x, y: y - (index * lineHeight), size, font, color }));
    return lines.length * lineHeight;
  }

  heading(text: string, size = 12) {
    this.ensure(34);
    this.page.drawRectangle({ x: this.margin, y: this.y - 19, width: this.width - this.margin * 2, height: 24, color: COLORS.softBlue });
    this.page.drawRectangle({ x: this.margin, y: this.y - 19, width: 4, height: 24, color: COLORS.orange });
    this.page.drawText(pdfSafeText(text), { x: this.margin + 12, y: this.y - 11, size, font: this.bold, color: COLORS.blue });
    this.y -= 34;
  }

  twoColumn(values: Array<[string, string]>) {
    const columnWidth = (this.width - (this.margin * 2) - 18) / 2;
    for (let index = 0; index < values.length; index += 2) {
      const left = values[index];
      const right = values[index + 1];
      const measure = (entry: [string, string]) => {
        const labelLines = this.wrap(entry[0].toUpperCase(), this.bold, 7, columnWidth - 16).length;
        const valueLines = this.wrap(entry[1], this.regular, 9, columnWidth - 16).length;
        return Math.max(30, (labelLines * 9) + (valueLines * 11) + 18);
      };
      const rowHeight = Math.max(measure(left), right ? measure(right) : 0);
      this.ensure(rowHeight + 8);
      const rowY = this.y;
      [left, right].filter(Boolean).forEach((entry, entryIndex) => {
        const x = this.margin + entryIndex * (columnWidth + 18);
        this.page.drawRectangle({ x, y: rowY - rowHeight + 4, width: columnWidth, height: rowHeight, color: COLORS.white, borderColor: COLORS.line, borderWidth: 0.6 });
        const labelLines = this.wrap(entry[0].toUpperCase(), this.bold, 7, columnWidth - 16);
        const valueLines = this.wrap(entry[1], this.regular, 9, columnWidth - 16);
        labelLines.forEach((line, lineIndex) => this.page.drawText(line, { x: x + 8, y: rowY - 12 - (lineIndex * 9), size: 7, font: this.bold, color: COLORS.muted }));
        const valueY = rowY - 12 - (labelLines.length * 9) - 3;
        valueLines.forEach((line, lineIndex) => this.page.drawText(line, { x: x + 8, y: valueY - (lineIndex * 11), size: 9, font: this.regular, color: COLORS.ink }));
      });
      this.y = rowY - rowHeight - 8;
    }
  }

  drawEligibilityRow(index: number, criterion: { criterion_label: string; met: boolean; notes: string }) {
    const contentWidth = this.width - this.margin * 2;
    const statusWidth = 68;
    const labelWidth = contentWidth - statusWidth - 42;
    const labelLines = this.wrap(criterion.criterion_label, this.regular, 9, labelWidth);
    const evidenceLines = criterion.notes ? this.wrap(`Evidence: ${criterion.notes}`, this.regular, 8, contentWidth - 20) : [];
    const bodyHeight = Math.max(labelLines.length * 11, 11) + (evidenceLines.length ? evidenceLines.length * 10 + 4 : 0);
    const rowHeight = bodyHeight + 20;
    this.ensure(rowHeight + 6);
    const top = this.y;
    const statusColor = criterion.met ? COLORS.success : COLORS.danger;
    const fill = criterion.met ? COLORS.softSuccess : COLORS.softDanger;
    this.page.drawRectangle({ x: this.margin, y: top - rowHeight + 4, width: contentWidth, height: rowHeight, color: fill, borderColor: COLORS.line, borderWidth: 0.6 });
    this.page.drawText(`${index + 1}.`, { x: this.margin + 9, y: top - 14, size: 9, font: this.bold, color: COLORS.blue2 });
    this.textAt(criterion.criterion_label, this.margin + 28, top - 14, { size: 9, font: this.regular, color: COLORS.ink, maxWidth: labelWidth, lineHeight: 11 });
    this.page.drawRectangle({ x: this.width - this.margin - statusWidth - 8, y: top - 28, width: statusWidth, height: 18, color: COLORS.white, borderColor: statusColor, borderWidth: 0.8 });
    this.page.drawText(criterion.met ? 'MET' : 'NOT MET', { x: this.width - this.margin - statusWidth + 3, y: top - 22, size: 7, font: this.bold, color: statusColor });
    if (evidenceLines.length) this.textAt(`Evidence: ${criterion.notes}`, this.margin + 10, top - 14 - (labelLines.length * 11) - 4, { size: 8, font: this.regular, color: COLORS.muted, maxWidth: contentWidth - 20, lineHeight: 10 });
    this.y = top - rowHeight - 6;
  }

  drawChecklistRow(code: string, label: string, responseText: string, scoreText: string, remark: string) {
    const contentWidth = this.width - this.margin * 2;
    const scoreWidth = 112;
    const leftWidth = contentWidth - scoreWidth - 20;
    const labelLines = this.wrap(label, this.bold, 9, leftWidth - 28);
    const responseLines = this.wrap(responseText, this.regular, 8, leftWidth - 28);
    const evidenceLines = remark ? this.wrap(`Evidence: ${remark}`, this.regular, 8, leftWidth - 28) : [];
    const leftHeight = (labelLines.length * 11) + 4 + (responseLines.length * 10) + (evidenceLines.length ? evidenceLines.length * 10 + 4 : 0);
    const scoreLines = this.wrap(scoreText, this.bold, 8, scoreWidth - 16);
    const rowHeight = Math.max(56, leftHeight + 18, (scoreLines.length * 10) + 24);
    this.ensure(rowHeight + 8);
    const top = this.y;
    const scoreX = this.width - this.margin - scoreWidth;
    this.page.drawRectangle({ x: this.margin, y: top - rowHeight + 4, width: contentWidth, height: rowHeight, color: COLORS.white, borderColor: COLORS.line, borderWidth: 0.6 });
    this.page.drawRectangle({ x: scoreX, y: top - rowHeight + 4, width: scoreWidth, height: rowHeight, color: COLORS.softOrange, borderColor: COLORS.line, borderWidth: 0.6 });
    this.page.drawText(pdfSafeText(code), { x: this.margin + 9, y: top - 14, size: 8, font: this.bold, color: COLORS.blue2 });
    this.textAt(label, this.margin + 30, top - 14, { size: 9, font: this.bold, color: COLORS.ink, maxWidth: leftWidth - 30, lineHeight: 11 });
    let leftY = top - 14 - (labelLines.length * 11) - 3;
    this.textAt(responseText, this.margin + 30, leftY, { size: 8, font: this.regular, color: COLORS.muted, maxWidth: leftWidth - 30, lineHeight: 10 });
    leftY -= responseLines.length * 10 + 2;
    if (evidenceLines.length) this.textAt(`Evidence: ${remark}`, this.margin + 30, leftY, { size: 8, font: this.regular, color: COLORS.muted, maxWidth: leftWidth - 30, lineHeight: 10 });
    this.textAt(scoreText, scoreX + 8, top - 16, { size: 8, font: this.bold, color: COLORS.blue2, maxWidth: scoreWidth - 16, lineHeight: 10 });
    this.y = top - rowHeight - 8;
  }

  box(text: string, x: number, width: number, color = COLORS.soft) {
    const lines = this.wrap(text, this.regular, 9, width - 20);
    const height = Math.max(42, (lines.length * 12) + 24);
    this.ensure(height + 6);
    const top = this.y;
    this.page.drawRectangle({ x, y: top - height + 4, width, height, color, borderColor: COLORS.line, borderWidth: 0.7 });
    lines.forEach((line, index) => this.page.drawText(line, { x: x + 10, y: top - 15 - (index * 12), size: 9, font: this.regular, color: COLORS.ink }));
    this.y = top - height - 6;
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
  getPageNumber() { return this.pageNumber; }
}

function recommendationColor(recommendation: string) {
  const value = recommendation.toLowerCase();
  return value.includes('recommended') && !value.includes('not') ? COLORS.success : value.includes('conditional') ? COLORS.orange : COLORS.danger;
}

export async function buildInspectionReportPdf(input: InspectionReportPdfInput) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const writer = new ReportWriter(document, regular, bold);
  const pageWidth = writer.getWidth();
  const margin = writer.getMargin();
  const isScored = input.passingThreshold > 0;

  writer.setY(710);
  writer.text(input.templateName, { size: 16, font: bold, color: COLORS.blue2, lineHeight: 20, gap: 3 });
  writer.text(`${input.facilityType} - ${input.providerName}`, { size: 11, font: bold, color: COLORS.ink, gap: 3 });
  writer.text(`Inspection date: ${formatDate(input.inspectionDate)} - Report ID: ${input.inspectionId}`, { size: 8, color: COLORS.muted, gap: 10 });

  const scoreBoxes = [
    [`OVERALL SCORE\n${input.score.percentage}%\n${input.score.points} / ${input.score.possible}`, COLORS.soft],
    [`CREDENTIALING\n${input.score.credentialingPoints} / ${input.score.credentialingPossible}`, COLORS.softBlue],
    [`ACCREDITATION\n${input.score.accreditationPoints} / ${input.score.accreditationPossible}`, COLORS.softOrange],
  ] as const;
  const boxWidth = (pageWidth - (margin * 2) - 20) / 3;
  writer.ensureSpace(76);
  const scoreY = writer.getY();
  scoreBoxes.forEach(([label, color], index) => {
    const x = margin + index * (boxWidth + 10);
    writer.getPage().drawRectangle({ x, y: scoreY - 62, width: boxWidth, height: 62, color, borderColor: COLORS.line, borderWidth: 0.7 });
    label.split('\n').forEach((line, lineIndex) => writer.getPage().drawText(pdfSafeText(line), { x: x + 9, y: scoreY - 16 - lineIndex * 15, size: lineIndex === 0 ? 7 : 11, font: lineIndex === 0 ? bold : regular, color: lineIndex === 0 ? COLORS.muted : COLORS.ink }));
  });
  writer.setY(scoreY - 78);
  writer.text(`Recommendation: ${input.score.recommendation}`, { size: 11, font: bold, color: recommendationColor(input.score.recommendation), gap: 3 });
  writer.text(`Thresholds: >=${input.passingThreshold}% recommended - ${input.conditionalThreshold}-${Math.max(input.passingThreshold - 1, input.conditionalThreshold)}% conditional - below ${input.conditionalThreshold}% not recommended`, { size: 8, color: COLORS.muted, gap: 10 });

  writer.heading('Facility profile');
  writer.twoColumn([
    ['Facility', displayValue(input.profile.facility_name || input.providerName)],
    ['Provider code', displayValue(input.providerCode)],
    ['Reference Quarter', displayValue(input.profile.reference_quarter)],
    ['Reference Year', displayValue(input.profile.reference_year)],
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

  if (isScored) {
    writer.heading('Eligibility criteria');
    if (!input.eligibility.length) writer.text('No eligibility criteria were configured for this template.', { size: 9, color: COLORS.muted });
    input.eligibility.forEach((criterion, index) => writer.drawEligibilityRow(index, criterion));
  }

  const sections = input.sections.filter(section => !['A', 'PROFILE', 'ELIGIBILITY', 'REMARKS', 'TEAM'].includes(section.section_code.toUpperCase()) && input.items.some(item => item.section_code === section.section_code));
  sections.forEach(section => {
    writer.heading(section.section_label);
    const items = input.items.filter(item => item.section_code === section.section_code);
    items.forEach(item => {
      const quarterStr = input.profile.reference_quarter || '';
      const q = quarterStr.trim();
      const formattedLabel = item.item_label
        .replace(/·?\s*Quarter:\s*\(select quarter(\s+in\s+Section\s+A)?\)/gi, q ? `· Quarter: ${q}` : '· Quarter: (Select Quarter in Section A)')
        .replace(/\(Select Quarter( Above)?\)/gi, q ? `(${q})` : '(Select Quarter Above)')
        .replace(/—\s*\(Select Quarter( Above)?\)/gi, q ? `— ${q}` : '— (Select Quarter Above)');

      const response = input.responses[item.item_code] || { number: '', manual_score: '', boolean: null, remark: '' };
      let responseText = '';
      let scoreText = '';
      
      if (item.response_type === 'json') {
        try {
          const tableData = JSON.parse(response.remark || '[]');
          const q = (input.profile.reference_quarter || '').trim();
          const quarterMonths: Record<string, string[]> = {
            'Q1': ['January', 'February', 'March'],
            'Q2': ['April', 'May', 'June'],
            'Q3': ['July', 'August', 'September'],
            'Q4': ['October', 'November', 'December'],
          };
          const key = Object.keys(quarterMonths).find(k => q.startsWith(k)) || '';
          const months = quarterMonths[key] || ['Month 1', 'Month 2', 'Month 3'];
          
          responseText = Array.isArray(tableData) 
            ? tableData.map((r: any, idx: number) => {
                const monthLabel = months[idx] || r.month || `Month ${idx + 1}`;
                return `${monthLabel}: NGN ${r.amount || '0.00'}`;
              }).join('; ') 
            : 'No data';
        } catch {
          responseText = response.remark || 'No data';
        }
      } else if (item.response_type === 'boolean') {
        const available = response.boolean === null ? 'Not answered' : response.boolean ? 'YES' : 'NO';
        responseText = `Response: ${available}`;
      } else if (item.response_type === 'text') {
        responseText = response.remark || 'Not recorded';
      } else {
        const available = displayValue(response.number);
        responseText = `Observed count: ${available}`;
      }

      if (isScored) {
        const available = item.response_type === 'number' ? displayValue(response.number) : response.boolean === null ? 'Not answered' : response.boolean ? 'YES' : 'NO';
        scoreText = (item.scoring_method === 'manual_only' || item.manual_score_allowed) && response.manual_score !== '' ? `Awarded: ${response.manual_score} / ${item.max_points}` : response.boolean === null && response.number === '' ? `Not scored / ${item.max_points} max` : `${available} - ${item.max_points} max`;
      } else {
        scoreText = 'Observation';
      }

      writer.drawChecklistRow(item.item_code.replace(/[^0-9A-Za-z.-]/g, ''), formattedLabel, responseText, scoreText, item.response_type === 'json' || item.response_type === 'text' ? '' : response.remark || '');
    });
  });

  writer.heading('General remarks / recommendation');
  writer.box(input.generalRemarks || 'No general remarks were recorded.', margin, pageWidth - margin * 2, COLORS.soft);

  writer.heading('Inspection team');
  if (!input.team.length) writer.text('No inspection team member was recorded.', { size: 9, color: COLORS.danger });
  for (const member of input.team) {
    writer.ensureSpace(106);
    const teamY = writer.getY();
    const teamName = pdfSafeText(member.name || 'Unnamed team member');
    writer.getPage().drawText(teamName, { x: margin, y: teamY, size: 10, font: bold, color: COLORS.ink });
    writer.getPage().drawText(pdfSafeText(`${member.role || 'Inspector'} - ${formatDate(member.inspection_date)}`), { x: margin, y: teamY - 14, size: 8, font: regular, color: COLORS.muted });
    writer.getPage().drawLine({ start: { x: margin, y: teamY - 84 }, end: { x: margin + 190, y: teamY - 84 }, thickness: 0.6, color: COLORS.line });
    if (member.signature_data) {
      try {
        const signature = await document.embedPng(toBytes(member.signature_data));
        writer.getPage().drawImage(signature, { x: margin, y: teamY - 76, width: 180, height: 48 });
      } catch {
        writer.getPage().drawText('Signature recorded in system', { x: margin, y: teamY - 68, size: 8, font: regular, color: COLORS.muted });
      }
    } else writer.getPage().drawText('Signature not recorded', { x: margin, y: teamY - 68, size: 8, font: regular, color: COLORS.danger });
    writer.setY(teamY - 104);
  }

  const pages = document.getPages();
  pages.forEach((page, index) => page.drawText(`ODCHC NMIS - Inspection Outcome Report - Page ${index + 1} of ${pages.length}`, { x: margin, y: 24, size: 7, font: regular, color: COLORS.muted }));
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
