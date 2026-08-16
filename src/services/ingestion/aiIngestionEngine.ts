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

export const aiIngestionEngine = {
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
