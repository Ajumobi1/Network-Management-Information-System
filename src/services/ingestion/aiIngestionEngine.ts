/**
 * NMIS Unified AI Ingestion Engine
 * Provides autonomous header detection, metadata/context extraction,
 * row inheritance (self-healing companion rows), summary row suppression,
 * and horizontal schedule pivoting for both Capitation and Claims/FFS workbooks.
 */

export interface AiIngestionMetadata {
  facilityName?: string;
  lga?: string;
  period?: string;
  reportingYear?: number;
  reportingMonth?: number;
  horizontalSchedule?: boolean;
  headerRowIndex: number;
  headers: string[];
}

export interface AiFinancialBlock {
  sheetName: string;
  blockIndex: number;
  headerRowIndex: number;
  startColumn: number;
  endColumn: number;
  title?: string;
  providerName?: string;
  category?: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  detectedPeriods: string[];
}

const normalizeBlockText = (value: unknown): string => String(value ?? '')
  .toUpperCase()
  .replace(/[‐‑‒–—-]+/g, ' ')
  .replace(/[_/]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const monthAliases: Record<string, number> = {
  JAN: 1, JANUARY: 1, FEB: 2, FEBRUARY: 2, MAR: 3, MARCH: 3, APR: 4, APRIL: 4,
  MAY: 5, JUN: 6, JUNE: 6, JUL: 7, JULY: 7, AUG: 8, AUGUST: 8,
  SEP: 9, SEPT: 9, SEPTEMBER: 9, OCT: 10, OCTOBER: 10, NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12,
};

function monthNumberFromText(value: unknown): number | undefined {
  const text = normalizeBlockText(value);
  const token = text.match(/\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/);
  return token ? monthAliases[token[1]] : undefined;
}

function uniqueBlockHeader(value: unknown, index: number, used: Set<string>): string {
  const base = String(value ?? '').trim() || `Column ${index + 1}`;
  let header = base;
  let suffix = 2;
  while (used.has(header)) header = `${base} ${suffix++}`;
  used.add(header);
  return header;
}

function isSerialHeader(value: unknown): boolean {
  return /^(S\s*[/.]?\s*N(?:O)?|SN(?:O)?|SERIAL(?:\s+NO|\s+NUMBER)?|INDEX)$/i.test(normalizeBlockText(value));
}

function isSummaryCell(value: unknown): boolean {
  const text = normalizeBlockText(value);
  return text === 'TOTAL' || text === 'GRAND TOTAL' || text === 'SUBTOTAL' || text === 'GRAND TOTALS' || text === 'TOTALS';
}

function blockCategoryFromText(text: string): string | undefined {
  const normalized = normalizeBlockText(text);
  if (normalized.includes('PHARM')) return 'PHARMACY';
  if (normalized.includes('OPTICAL') || normalized.includes('OPTOMET')) return 'OPTICAL_CENTRE';
  if (normalized.includes('DENTAL')) return 'DENTAL_CENTRE';
  if (normalized.includes('DIAGNOSTIC') || normalized.includes('IMAGING') || normalized.includes('LABORATORY')) return 'DIAGNOSTIC_CENTRE';
  return undefined;
}

function cleanProviderName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  let cleaned = name.toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\(IDH\)/g, ' IDH ')
    .replace(/&/g, ' AND ')
    .replace(/\bM\.?O\.?H\b/g, ' MINISTRY OF HEALTH ')
    .replace(/\bS\.?S\.?H\b/g, ' STATE SPECIALIST HOSPITAL ')
    .replace(/\bG\.?H\b/g, ' GENERAL HOSPITAL ')
    .replace(/\bC\.?H\.?C\b/g, ' COMPREHENSIVE HEALTH CENTRE ')
    .replace(/\bP\.?H\.?C\b/g, ' PRIMARY HEALTH CENTRE ')
    .replace(/\bRD\.?\b/g, ' ROAD ')
    .replace(/\bLGA\b/g, ' ')
    .replace(/\bONDO STATE\b/g, ' ')
    .replace(/\bAKURE\b/g, ' ')
    .replace(/\bLIMITED\b/g, ' ')
    .replace(/\bLTD\b/g, ' ')
    .replace(/\bHOSPITALS\b/g, ' HOSPITAL ')
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If the name is now very short or empty, revert to original uppercase
  if (cleaned.length < 3) return name.toUpperCase().trim();
  return cleaned;
}

function providerNameFromBlockTitle(title: string | undefined, headerProvider: string | undefined): string | undefined {
  let name: string | undefined;
  if (title) {
    const oranghis = title.match(/^(.+?)\s+ORANGHIS\b/i);
    if (oranghis?.[1]) name = oranghis[1].trim();
    else {
      const report = title.match(/^(.+?)\s+CLAIMS?\s+SUMMARY/i);
      if (report?.[1]) name = report[1].trim();
    }
  }
  if (!name) name = headerProvider?.trim();
  
  return cleanProviderName(name);
}

function parseBlockRange(title: string | undefined): { startMonth?: number; startYear?: number; endMonth?: number; endYear?: number } {
  const text = normalizeBlockText(title);
  const years = [...text.matchAll(/\b(20\d{2})\b/g)].map(match => Number(match[1]));
  const monthMatches = [...text.matchAll(/\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEPT?(?:EMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\b/g)]
    .map(match => monthAliases[match[1]]).filter(Boolean);
  if (monthMatches.length < 2) return { startYear: years[0], endYear: years[years.length - 1] || years[0] };
  return {
    startMonth: monthMatches[0],
    endMonth: monthMatches[monthMatches.length - 1],
    startYear: years[0],
    endYear: years[years.length - 1] || years[0],
  };
}

function parseBlockPeriod(value: unknown): { month?: number; year?: number } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return { month: value.getMonth() + 1, year: value.getFullYear() };
  const text = normalizeBlockText(value);
  if (!text) return {};
  const explicitYear = text.match(/\b(20\d{2})\b/);
  const month = monthNumberFromText(text);
  if (month) return { month, year: explicitYear ? Number(explicitYear[1]) : undefined };
  const numeric = text.match(/^(0?[1-9]|1[0-2])$/);
  return numeric ? { month: Number(numeric[1]), year: undefined } : {};
}

function resolveBlockYear(month: number | undefined, explicitYear: number | undefined, range: ReturnType<typeof parseBlockRange>): number | undefined {
  if (explicitYear) return explicitYear;
  if (!month) return range.startYear || range.endYear;
  if (range.startMonth && range.endMonth && range.startYear && range.endYear && range.startYear !== range.endYear) {
    return month >= range.startMonth ? range.startYear : range.endYear;
  }
  return range.startYear || range.endYear;
}

export const aiIngestionEngine = {
  /**
   * Extract one or more provider tables embedded in a worksheet. This handles
   * grouped side-by-side tables, banner rows, repeated S/N columns, provider
   * names in titles, and period columns that are not named Month.
   */
  extractFinancialBlocks(matrix: unknown[][], sheetName = 'Sheet1'): AiFinancialBlock[] {
    const candidateScores = matrix.map((row, index) => {
      if (!Array.isArray(row)) return { index, score: Number.NEGATIVE_INFINITY };
      const cells = row.map(cell => normalizeBlockText(cell)).filter(Boolean);
      const schemaMatches = cells.filter(cell =>
        isSerialHeader(cell) || cell === 'PERIOD' || cell.includes('PAYMENT') || cell.includes('DATE PAID') || cell.includes('AMOUNT') || cell.includes('CLAIM')
      ).length;
      const serialCount = cells.filter(isSerialHeader).length;
      const monthCount = cells.filter(cell => Boolean(monthNumberFromText(cell))).length;
      const score = (schemaMatches * 4) + (serialCount * 5) + (monthCount * 1.5) + (cells.length >= 3 ? 1 : 0);
      return { index, score };
    });
    const headerRowIndex = candidateScores.sort((a, b) => b.score - a.score)[0]?.index ?? 0;
    const headerRow = Array.isArray(matrix[headerRowIndex]) ? matrix[headerRowIndex] : [];
    const serialStarts = headerRow
      .map((cell, index) => isSerialHeader(cell) ? index : -1)
      .filter(index => index >= 0);
    const repeatedTableStarts = headerRow
      .map((cell, index) => {
        const normalized = normalizeBlockText(cell);
        return normalized === 'PERIOD' || normalized === 'MONTH' || normalized === 'REPORTING MONTH' ? Math.max(0, index - 1) : -1;
      })
      .filter(index => index >= 0);
    const starts = [...new Set(serialStarts.length > 0 ? serialStarts : repeatedTableStarts.length > 0 ? repeatedTableStarts : [0])].sort((a, b) => a - b);
    const blocks: AiFinancialBlock[] = [];
    const syntheticProviderHeader = 'Provider / facility name (AI inferred)';
    const syntheticMonthHeader = 'Reporting month (AI inferred)';
    const syntheticYearHeader = 'Reporting year (AI inferred)';
    const syntheticCategoryHeader = 'Facility type (AI inferred)';

    starts.forEach((startColumn, blockIndex) => {
      const endColumn = (starts[blockIndex + 1] ?? headerRow.length) - 1;
      const titleCells: string[] = [];
      for (let rowIndex = headerRowIndex - 1; rowIndex >= 0; rowIndex -= 1) {
        const row = matrix[rowIndex] || [];
        const values = row.slice(startColumn, endColumn + 1).map(cell => String(cell ?? '').trim()).filter(Boolean);
        if (values.length > 0) {
          titleCells.push(values.join(' '));
          break;
        }
      }
      const title = titleCells[0];
      const headerEntries: Array<{ column: number; header: string }> = [];
      const usedHeaders = new Set<string>();
      for (let column = startColumn; column <= endColumn; column += 1) {
        const rawHeader = headerRow[column];
        const hasData = matrix.slice(headerRowIndex + 1).some(row => String(row?.[column] ?? '').trim() !== '');
        if (!String(rawHeader ?? '').trim() && !hasData) continue;
        headerEntries.push({ column, header: uniqueBlockHeader(rawHeader, column, usedHeaders) });
      }
      if (headerEntries.length === 0) return;

      const periodEntry = headerEntries.find(entry => normalizeBlockText(entry.header) === 'PERIOD' || normalizeBlockText(entry.header).includes('REPORTING MONTH'));
      const headerProvider = headerEntries
        .map(entry => entry.header)
        .find(header => {
          const normalized = normalizeBlockText(header);
          const genericProviderHeader = new Set(['PROVIDER', 'PROVIDERS', 'FACILITY', 'FACILITIES', 'OUTLET', 'OUTLETS', 'FACILITY NAME', 'PROVIDER NAME', 'NAME', 'CATEGORY', 'TYPE', 'ROW TYPE', 'FINANCIAL ROW TYPE', 'MONTH', 'YEAR']);
          return normalized && !/^COLUMN \d+$/.test(normalized) && !monthNumberFromText(normalized) && !genericProviderHeader.has(normalized) && !isSerialHeader(normalized) && normalized !== 'PERIOD' && !normalized.includes('PAYMENT') && !normalized.includes('DATE') && !normalized.includes('AMOUNT') && !normalized.includes('TOTAL');
        });
      const providerName = providerNameFromBlockTitle(title, headerProvider);
      const category = blockCategoryFromText(`${sheetName} ${title || ''} ${providerName || ''}`);
      const range = parseBlockRange([sheetName, title].filter(Boolean).join(' '));
      const rows: Array<Record<string, unknown>> = [];
      const detectedPeriods = new Set<string>();
      const scheduleYear = range.startYear || range.endYear;
      headerEntries.forEach(entry => {
        const month = monthNumberFromText(entry.header);
        if (month && scheduleYear) detectedPeriods.add(`${scheduleYear}-${String(month).padStart(2, '0')}`);
      });
      const rawHeaders = headerEntries.map(entry => entry.header);
      const headers = [syntheticProviderHeader, syntheticMonthHeader, syntheticYearHeader, syntheticCategoryHeader, ...rawHeaders];

      matrix.slice(headerRowIndex + 1).forEach(row => {
        const values = headerEntries.map(entry => row?.[entry.column]);
        if (!values.some(value => String(value ?? '').trim() !== '')) return;
        if (values.some(value => isSummaryCell(value))) return;
        const mapped: Record<string, unknown> = {};
        mapped[syntheticProviderHeader] = providerName || '';
        mapped[syntheticCategoryHeader] = category || '';
        const periodValue = periodEntry ? row?.[periodEntry.column] : undefined;
        const parsedPeriod = parseBlockPeriod(periodValue);
        const resolvedYear = resolveBlockYear(parsedPeriod.month, parsedPeriod.year, range);
        if (parsedPeriod.month) mapped[syntheticMonthHeader] = parsedPeriod.month;
        if (resolvedYear) mapped[syntheticYearHeader] = resolvedYear;
        if (parsedPeriod.month && resolvedYear) detectedPeriods.add(`${resolvedYear}-${String(parsedPeriod.month).padStart(2, '0')}`);
        headerEntries.forEach((entry, index) => {
          mapped[entry.header] = values[index];
        });
        rows.push(mapped);
      });

      if (rows.length > 0) {
        blocks.push({
          sheetName,
          blockIndex,
          headerRowIndex,
          startColumn,
          endColumn,
          title,
          providerName,
          category,
          headers,
          rows,
          detectedPeriods: [...detectedPeriods].sort(),
        });
      }
    });

    return blocks;
  },

  /**
   * Automatically detect the strongest header row anywhere in the worksheet.
   * The scan is deliberately whole-file rather than limited to the first N rows.
   * Data rows are down-ranked because they contain numeric values and long names,
   * while headers contain repeated schema vocabulary such as PROVIDER, MONTH,
   * CATEGORY, AMOUNT, S/N, POLICY, or JAN–DEC.
   */
  detectHeaderRowIndex(matrix: unknown[][]): number {
    const headerKeywords = [
      'provider', 'providers', 'facility', 'hospital', 'policy', 'enrollee', 'beneficiary',
      'amount', 'date', 'month', 'year', 'claims', 'capitation', 'ffs', 'fee for service',
      'category', 's/n', 'sn', 'serial', 'first name', 'last name', 'phone', 'gender',
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
    ];
    const schemaKeywords = new Set([
      'provider', 'providers', 'facility', 'policy', 'category', 'amount', 'month', 'year',
      'claims', 'capitation', 'ffs', 's/n', 'sn', 'serial', 'first name', 'last name',
      'gender', 'phone', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep',
      'sept', 'oct', 'nov', 'dec'
    ]);

    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    matrix.forEach((row, index) => {
      if (!Array.isArray(row)) return;
      const cells = row.map(cell => String(cell ?? '').trim()).filter(Boolean);
      if (cells.length < 2) return;

      const normalized = cells.map(cell => cell.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim());
      const headerMatches = normalized.filter(cell => headerKeywords.some(keyword => cell === keyword || cell.includes(keyword))).length;
      const exactSchemaMatches = normalized.filter(cell => schemaKeywords.has(cell)).length;
      const monthMatches = normalized.filter(cell => this.isMonthColumn(cell)).length;
      const numericCells = cells.filter(cell => /^[-+₦$\d,\.\s]+$/.test(cell)).length;
      const longTextCells = cells.filter(cell => cell.length > 28).length;
      const duplicateCells = cells.length - new Set(normalized).size;

      // Strongly reward schema vocabulary and month columns; penalize data-shaped rows.
      const score = (headerMatches * 2) + (exactSchemaMatches * 3) + (monthMatches * 2)
        + (cells.length >= 3 ? 1 : 0) - (numericCells * 1.5) - (longTextCells * 0.5) - duplicateCells;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  },

  /** Return the zero-based month index for a JAN–DEC header, or -1. */
  getMonthIndex(value: string): number {
    const normalized = String(value ?? '').toLowerCase().trim().replace(/[_-]+/g, ' ');
    const fullMonths = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const firstPart = normalized.split(/\s+/)[0];
    const fullIndex = fullMonths.indexOf(firstPart);
    if (fullIndex >= 0) return fullIndex;
    if (firstPart === 'sept') return 8;
    return shortMonths.indexOf(firstPart);
  },

  isMonthColumn(value: string): boolean {
    return this.getMonthIndex(value) >= 0;
  },

  /**
   * Extract workbook metadata (facility name, LGA, period) from rows above the header.
   */
  extractWorkbookContext(matrix: unknown[][], headerIndex: number): { facilityName?: string; lga?: string; period?: string } {
    const context: { facilityName?: string; lga?: string; period?: string } = {};
    const lgaNames = [
      'akoko north east', 'akoko north west', 'akoko south east', 'akoko south west',
      'akure north', 'akure south', 'ese odo', 'idanre', 'ifedore', 'ilaje',
      'ile oluji', 'irele', 'odigbo', 'okitipupa', 'ondo east', 'ondo west', 'ose', 'owo'
    ];

    for (let i = 0; i < headerIndex; i++) {
      const row = matrix[i];
      if (!Array.isArray(row)) continue;
      const text = row.join(' ').toLowerCase();

      if (!context.facilityName) {
        const nameMatch = text.match(/(?:facility|provider|hospital|clinic)(?:\s+name)?\s*[:\-]\s*([^,\|]+)/i);
        if (nameMatch) {
          context.facilityName = nameMatch[1].trim().toUpperCase();
        } else {
          // Scan cells for hospital/clinic terms
          for (const cell of row) {
            const cellText = String(cell ?? '').trim();
            const upper = cellText.toUpperCase();
            if (upper.length > 5 && (upper.includes('HOSPITAL') || upper.includes('CLINIC') || upper.includes('MEDICAL CENTRE') || upper.includes('HEALTH CENTRE'))) {
              context.facilityName = cellText.replace(/^["']|["']$/g, '').trim();
              break;
            }
          }
        }
      }

      if (!context.lga) {
        const foundLga = lgaNames.find(lga => text.includes(lga));
        if (foundLga) {
          context.lga = foundLga.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }

      if (!context.period) {
        const yearMatch = text.match(/20\d\d/);
        if (yearMatch) {
          context.period = yearMatch[0];
        }
      }
    }

    return context;
  },

  /**
   * Detect summary rows to suppress noise during ingestion.
   */
  isSummaryRow(name: string): boolean {
    const normalized = String(name ?? '').trim().toUpperCase();
    if (!normalized) return true;

    const exactKeywords = ['TOTAL', 'GRAND TOTAL', 'SUBTOTAL', 'SUMMARY', 'TOTALS', 'PAYMENT SCHEDULE', 'GRAND TOTALS'];
    if (exactKeywords.includes(normalized)) return true;

    if (normalized.includes('PAYMENT SCHEDULE') || normalized.includes('ORANGHIS PROVIDERS')) return true;

    const summaryPrefixes = ['TOTAL ', 'GRAND TOTAL ', 'SUBTOTAL ', 'TOTALS '];
    const summaryLabels = ['AMOUNT', 'COUNT', 'RECORDS', 'ENROLLEES', 'BENEFICIARIES', 'PAYABLE', 'GROSS', 'NET', 'PAID', 'DUE'];

    for (const prefix of summaryPrefixes) {
      if (normalized.startsWith(prefix)) {
        const remainder = normalized.substring(prefix.length).trim();
        if (summaryLabels.includes(remainder) || /^[0-9#,\.\-\/ ]+$/.test(remainder)) {
          return true;
        }
      }
    }

    return false;
  },

  /**
   * Inherit provider context across companion rows while preserving explicit values.
   * This is intentionally column-driven so both enrolment and financial workbooks
   * can use it without imposing a schema on the source workbook.
   */
  inheritRowContext<T extends Record<string, unknown>>(
    rows: T[],
    fields: { providerName?: string; providerCode?: string; lga?: string; state?: string }
  ): T[] {
    let inheritedProviderName = '';
    let inheritedProviderCode = '';
    let inheritedLga = '';
    let inheritedState = '';

    return rows.map(row => {
      const next: Record<string, unknown> = { ...row };
      const read = (field?: string) => field ? String(row[field] ?? '').trim() : '';
      const explicitProviderName = read(fields.providerName);
      const explicitProviderCode = read(fields.providerCode);
      const explicitLga = read(fields.lga);
      const explicitState = read(fields.state);

      if (explicitProviderName) inheritedProviderName = explicitProviderName;
      if (explicitProviderCode) inheritedProviderCode = explicitProviderCode;
      if (explicitLga) inheritedLga = explicitLga;
      if (explicitState) inheritedState = explicitState;

      if (fields.providerName && !explicitProviderName && inheritedProviderName) next[fields.providerName] = inheritedProviderName;
      if (fields.providerCode && !explicitProviderCode && inheritedProviderCode) next[fields.providerCode] = inheritedProviderCode;
      if (fields.lga && !explicitLga && inheritedLga) next[fields.lga] = inheritedLga;
      if (fields.state && !explicitState && inheritedState) next[fields.state] = inheritedState;

      return next as T;
    });
  },

  /**
   * Extract a facility name from a descriptive workbook filename.
   */
  extractFacilityNameFromFilename(fileName: string): string | undefined {
    const baseName = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const facilityTerms = /(hospital|hosp|clinic|medical|med\.?|health|centre|center|maternity|diagnostic|community|pharmacy|laboratory)/i;
    const genericOnly = /^(capitation|enrol?ment|enrollee|beneficiar(?:y|ies)|member|data|upload|workbook|sheet|file|list)(?:[ _-]*(?:list|data|upload|workbook|sheet|file|202[0-9]|20[0-9]{2}))?$/i;
    if (baseName.length < 8 || genericOnly.test(baseName) || !facilityTerms.test(baseName)) return undefined;
    return baseName;
  },

  /**
   * Generate robust fingerprint for duplicate detection.
   */
  generateFingerprint(parts: Array<string | number | undefined>): string {
    return parts.map(p => String(p ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '')).join('|');
  }
};
