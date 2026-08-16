import {
  FinancialRecord,
  FinancialDataType,
  ColumnMapping,
  ProviderMatch
} from '../../types/financial-data';
import { getProviderDirectory, getPersistedProviderMatches, saveProviderMatchResolution } from '../../repositories/providers/providersRepository';
import { providerMatchingService } from '../reconciliation/providerMatchingService';
import { useMockData } from '../../repositories/common';
import { aiIngestionEngine } from '../ingestion/aiIngestionEngine';

const normalizeText = (value: unknown) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
const numericFields = new Set<string>([
  'reportingMonth', 'reportingYear', 'claimCount', 'encounterCount', 'eligibleLives',
  'formalEnrollees', 'informalEnrollees', 'amount', 'amountSubmitted', 'amountClaimed',
  'amountApproved', 'amountRejected', 'amountDisallowed', 'amountPaid', 'netAmountPaid',
  'netAmount', 'rate', 'grossAmount', 'adjustments', 'deductions',
]);

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined || String(value).trim() === '') return undefined;
  const parsed = Number(String(value).replace(/[₦,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildFingerprint = (record: Partial<FinancialRecord>) => [
  record.providerCode || normalizeText(record.providerName),
  record.period,
  record.dataType,
  record.claimsCategory || '',
  record.claimCount ?? record.encounterCount ?? '',
  record.amountSubmitted ?? record.amountClaimed ?? '',
  record.amountApproved ?? '',
  record.amountPaid ?? record.netAmountPaid ?? record.amount ?? '',
].map(value => normalizeText(value)).join('|');

export interface FinancialIntegritySummary {
  scannedRows: number;
  normalizedRecords: number;
  inheritedProviderRows: number;
  suppressedSummaryRows: number;
  skippedEmptyScheduleCells: number;
  skippedRowsWithoutAmounts: number;
  invalidAmountCells: number;
  detectedDataTypes: string[];
  detectedPeriods: string[];
  warnings: string[];
}

const isBlankScheduleValue = (value: unknown): boolean => {
  const text = String(value ?? '').trim().toLowerCase();
  return text === '' || text === '-' || text === '—' || text === 'n/a' || text === 'na';
};

export const isSummaryRow = (providerName: string): boolean => aiIngestionEngine.isSummaryRow(providerName);

/**
 * Service to handle business logic for financial data hub
 */
export const financialDataService = {
  /**
   * Automatically identify the header row index by looking for common financial keywords.
   */
  detectHeaderRowIndex(matrix: unknown[][]): number {
    return aiIngestionEngine.detectHeaderRowIndex(matrix);
  },

  /**
   * Extract workbook-level metadata from rows above the header.
   */
  extractWorkbookContext(matrix: unknown[][], headerIndex: number): { facilityName?: string; lga?: string; period?: string } {
    return aiIngestionEngine.extractWorkbookContext(matrix, headerIndex);
  },

  extractFacilityNameFromFilename(fileName: string): string | undefined {
    return aiIngestionEngine.extractFacilityNameFromFilename(fileName);
  },

  /**
   * Suggest a data type based on headers
   */
  isMonthColumn(value: string): boolean {
    return aiIngestionEngine.isMonthColumn(value);
  },

  detectDataType(headers: string[], sourceName = ''): FinancialDataType {
    const headerStr = [...headers, sourceName].join(' ').toLowerCase().replace(/[-_/]+/g, ' ');

    // Claims, FFS, and Fee-for-Service are one workflow. Keep the stored row type
    // as claims/ffs for reporting, but detect all common source spellings equally.
    if (headerStr.includes('ffs') || headerStr.includes('fee for service')) {
      return 'ffs';
    }

    if (headerStr.includes('claim') || headerStr.includes('dental') || headerStr.includes('optical') || headerStr.includes('diagnostic')) {
      return 'claims';
    }

    if (headerStr.includes('capitation') || headerStr.includes('cap fee') || (headerStr.includes('enrollee') && headerStr.includes('amount'))) {
      return 'capitation';
    }

    if (headerStr.includes('enrolment') || headerStr.includes('informal') || headerStr.includes('formal')) {
      return 'enrolment';
    }

    if (headerStr.includes('provider') || headerStr.includes('facility') || headerStr.includes('ownership') || headerStr.includes('category')) {
      return 'provider-network';
    }

    return 'other';
  },

  /**
   * Suggest column mappings based on headers using fuzzy AI-like logic
   */
  suggestMappings(headers: string[], dataType?: FinancialDataType, sampleRows: Array<Record<string, unknown>> = []): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const normalized = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9/ ]/g, '');
    const amountFields = new Set<keyof FinancialRecord>(['amount', 'amountSubmitted', 'amountClaimed', 'amountApproved', 'amountRejected', 'amountPaid', 'netAmountPaid', 'netAmount', 'grossAmount']);
    const knownMappings: Array<{ field: keyof FinancialRecord | 'ignored'; keywords: string[]; weight: number; context?: FinancialDataType[] }> = [
      { field: 'ignored', keywords: ['s/n', 'sn', 'index', 'id', 'account number', 'bank', 'number of enrollees', 'number of formal enrollees', 'number of informal enrollees', 'number of enrollees on capitation list'], weight: 1.0 },
      { field: 'providerName', keywords: ['provider', 'facility', 'hospital', 'outlet', 'health facility', 'account name as it appears', 'name of facility'], weight: 1.0 },
      { field: 'providerCode', keywords: ['provider code', 'facility code', 'hcp code', 'code'], weight: 0.95 },
      { field: 'ownership', keywords: ['ownership', 'category', 'sector', 'ownership type'], weight: 0.8 },
      { field: 'facilityType', keywords: ['facility type', 'type of facility', 'level'], weight: 0.8 },
      { field: 'amountPaid', keywords: ['amount paid', 'total paid', 'net paid', 'payment', 'paid', 'amt paid', 'payable'], weight: 1.0 },
      { field: 'amountClaimed', keywords: ['amount claimed', 'gross claimed', 'claimed', 'submission', 'amt claimed'], weight: 0.95 },
      { field: 'amountApproved', keywords: ['amount approved', 'approved', 'vetted', 'vetting', 'amt approved'], weight: 0.95 },
      { field: 'amountRejected', keywords: ['amount rejected', 'rejected', 'disallowed', 'amt rejected'], weight: 0.95 },
      { field: 'amount', keywords: ['capitation fee', 'gross amount', 'total amount', 'amount', 'amt'], weight: 0.8 },
      { field: 'claimsCategory', keywords: ['claims category', 'service type', 'benefit'], weight: 0.8 },
      { field: 'state', keywords: ['state', 'region'], weight: 0.7 },
      { field: 'lga', keywords: ['lga', 'local government', 'area'], weight: 0.7 },
      { field: 'reportingMonth', keywords: ['reporting month', 'month'], weight: 0.8 },
      { field: 'reportingYear', keywords: ['reporting year', 'year'], weight: 0.8 },
      { field: 'eligibleLives', keywords: ['eligible lives', 'total enrollees', 'enrollee count', 'population'], weight: 0.8 },
      { field: 'claimCount', keywords: ['claim count', 'number of claims', 'claims count'], weight: 0.8 },
    ];

    headers.forEach(header => {
      const normalizedHeader = normalized(header);
      const values = sampleRows.slice(0, 50).map(row => String(row[header] ?? '').trim().toUpperCase().replace(/[-_/]+/g, ' '));
      const monthIndex = aiIngestionEngine.getMonthIndex(header);
      if (monthIndex >= 0) {
        mappings.push({
          excelField: header,
          nmisField: 'amountPaid',
          confidence: 'HIGH',
          confidenceScore: 1,
          isCustom: true,
        });
        return;
      }
      const looksLikeRowType = values.some(value => value === 'CAPITATION' || value === 'FFS' || value === 'FEE FOR SERVICE');
      if (looksLikeRowType) {
        mappings.push({ excelField: header, nmisField: 'dataType', confidence: 'HIGH', confidenceScore: 1 });
        return;
      }

      let bestMatch: keyof FinancialRecord | 'ignored' = 'ignored';
      let maxScore = 0;
      for (const config of knownMappings) {
        const contextBoost = dataType && config.context?.includes(dataType) ? 1.2 : 1;
        for (const keyword of config.keywords) {
          const normalizedKeyword = normalized(keyword);
          let score = 0;
          if (normalizedHeader === normalizedKeyword) score = 1;
          else if (normalizedHeader.startsWith(normalizedKeyword) || normalizedHeader.endsWith(normalizedKeyword)) score = 0.85;
          else if (normalizedHeader.includes(normalizedKeyword)) score = 0.7;
          score *= config.weight * contextBoost;
          if (score > maxScore) { maxScore = score; bestMatch = config.field; }
        }
      }
      mappings.push({
        excelField: header,
        nmisField: bestMatch,
        confidence: maxScore > 0.9 ? 'HIGH' : maxScore > 0.6 ? 'MEDIUM' : 'LOW',
        confidenceScore: maxScore,
      });
    });

    // Prevent a generic amount mapping from stealing a more specific amount field.
    const mappedAmountFields = mappings.filter(mapping => amountFields.has(mapping.nmisField as keyof FinancialRecord));
    if (mappedAmountFields.length > 1) {
      const strongest = mappedAmountFields.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
      mappings.forEach(mapping => {
        if (amountFields.has(mapping.nmisField as keyof FinancialRecord) && mapping !== strongest && mapping.confidenceScore < strongest.confidenceScore) {
          mapping.nmisField = 'ignored';
          mapping.confidence = 'LOW';
        }
      });
    }
    return mappings;
  },

  /**
   * Smart normalization for values (standardizing typos like PRVATE)
   */
  smartNormalize(field: keyof FinancialRecord, value: unknown): any {
    if (value === null || value === undefined) return value;
    const text = String(value).trim();
    const upper = text.toUpperCase();
    const normalizedUpper = upper.replace(/[-_/]+/g, ' ');

    if (field === 'ownership') {
      if (upper.includes('PRVATE') || upper.includes('PRIVATE')) return 'Private';
      if (upper.includes('GOV') || upper.includes('PUBLIC')) return 'Government';
      return 'Private'; // Default fallback
    }

    if (field === 'facilityType') {
      if (upper.includes('HOSPITAL')) return 'Hospital';
      if (upper.includes('PHC') || upper.includes('PRIMARY')) return 'Primary Health Centre (PHC)';
      return text;
    }

    if (field === 'state') {
      return 'Ondo';
    }

    if (field === 'dataType') {
      if (normalizedUpper.includes('FFS') || normalizedUpper.includes('FEE FOR SERVICE')) return 'ffs';
      if (normalizedUpper.includes('CAPITATION') || normalizedUpper.includes('CAP')) return 'capitation';
      if (normalizedUpper.includes('CLAIM')) return 'claims';
      return text.toLowerCase();
    }

    if (numericFields.has(String(field))) return toNumber(value);

    return text;
  },

  /**
   * Attempt to match a provider name to the directory using priority rules
   */
  async matchProvider(name: string, code?: string, lga?: string, state?: string, importSessionId?: string): Promise<ProviderMatch> {
    if (!useMockData) {
      try {
        const sessionId = importSessionId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000001');
        const result = await providerMatchingService.fetchMatchCandidates(sessionId, name, code, lga, state);
        const candidates = result.candidates || [];
        const top = candidates[0];

        if (candidates.length === 1 && top && top.match_score >= 95) {
          return {
            excelName: name,
            matchedProviderId: top.id,
            matchedProviderName: top.provider_name,
            matchedProviderCode: top.provider_code,
            matchedProviderLga: top.lga,
            matchedProviderState: top.state,
            matchedProviderFacilityType: top.category as any,
            matchedProviderOwnership: top.ownership as any,
            confidence: top.match_score / 100,
            matchType: 'exact',
            status: 'confirmed',
          };
        }

        return {
          excelName: name,
          matchedProviderId: candidates.length === 1 ? top.id : undefined,
          matchedProviderName: candidates.length === 1 ? top.provider_name : undefined,
          matchedProviderCode: candidates.length === 1 ? top.provider_code : undefined,
          matchedProviderLga: candidates.length === 1 ? top.lga : undefined,
          matchedProviderState: candidates.length === 1 ? top.state : undefined,
          matchedProviderFacilityType: candidates.length === 1 ? (top.category as any) : undefined,
          matchedProviderOwnership: candidates.length === 1 ? (top.ownership as any) : undefined,
          candidates: candidates.map(c => ({
            id: c.id,
            name: c.provider_name,
            code: c.provider_code,
            lga: c.lga,
            state: c.state,
            facilityType: c.category as any,
            ownership: c.ownership as any,
          })),
          confidence: top ? top.match_score / 100 : 0,
          matchType: top?.match_reason.toLowerCase().includes('code') ? 'exact' : 'normalized',
          status: candidates.length === 1 && top.match_score >= 75 ? 'confirmed' : 'pending',
        };
      } catch (err) {
        // Fallback to local matching if live RPC fails or returns secure unavailable
      }
    }

    const providers = await getProviderDirectory();
    const persistedMatches = await getPersistedProviderMatches();
    const normalizedName = normalizeText(name);

    // 0. Check persisted manual resolutions first
    const persistedMatch = persistedMatches[name.toLowerCase().trim()];
    if (persistedMatch) {
      return { ...persistedMatch, status: 'confirmed', confidence: 1, matchType: 'manual' };
    }

    const confirmed = (p: any, conf: number, type: any): ProviderMatch => ({
      excelName: name,
      matchedProviderId: p.id,
      matchedProviderName: p.providerName,
      matchedProviderCode: p.providerCode,
      matchedProviderLga: p.lga,
      matchedProviderState: p.state,
      matchedProviderFacilityType: p.facilityType,
      matchedProviderOwnership: p.ownership,
      confidence: conf,
      matchType: type,
      status: 'confirmed',
    });

    const pending = (matches: any[], conf: number, type: any): ProviderMatch => ({
      excelName: name,
      candidates: matches.map(p => ({
        id: p.id,
        name: p.providerName,
        code: p.providerCode,
        lga: p.lga,
        state: p.state,
        facilityType: p.facilityType,
        ownership: p.ownership,
      })),
      confidence: conf,
      matchType: type,
      status: 'pending',
    });

    // 1. Match by Provider Code
    if (code) {
      const codeMatches = providers.filter(provider => normalizeText(provider.providerCode) === normalizeText(code));
      if (codeMatches.length === 1) return confirmed(codeMatches[0], 1, 'exact');
      if (codeMatches.length > 1) return pending(codeMatches, 0.99, 'exact');
    }

    // 2. Match by Exact Provider Name
    const exactNameMatches = providers.filter(provider => normalizeText(provider.providerName) === normalizedName);
    if (exactNameMatches.length === 1) return confirmed(exactNameMatches[0], 0.98, 'exact');
    if (exactNameMatches.length > 1) return pending(exactNameMatches, 0.98, 'exact');

    // 3. Match by Name + Location
    const sameLocation = (provider: (typeof providers)[number]) => {
      const sameLga = Boolean(lga) && normalizeText(provider.lga) === normalizeText(lga);
      const sameState = Boolean(state) && normalizeText(provider.state) === normalizeText(state);
      return sameLga || sameState;
    };
    const locationMatches = providers.filter(provider => {
      const providerName = normalizeText(provider.providerName);
      const similarName = providerName.includes(normalizedName) || normalizedName.includes(providerName);
      return similarName && sameLocation(provider);
    });
    if (locationMatches.length === 1) return confirmed(locationMatches[0], 0.93, 'location');
    if (locationMatches.length > 1) return pending(locationMatches, 0.93, 'location');

    // 4. Normalized/Fuzzy Match (with auto-confirm for single substring match)
    const fuzzyMatches = providers.filter(provider => {
      const pName = normalizeText(provider.providerName);
      // Remove common legal/suffix words to compare core name
      const cleanTarget = normalizedName.replace(/hospital|memorial|clinic|health|center|centre|akungba|akure|ondo/g, '').trim();
      const cleanProvider = pName.replace(/hospital|memorial|clinic|health|center|centre|akungba|akure|ondo/g, '').trim();
      return pName.includes(normalizedName) || normalizedName.includes(pName) || (cleanTarget.length > 3 && cleanProvider.includes(cleanTarget));
    });
    if (fuzzyMatches.length === 1) return confirmed(fuzzyMatches[0], 0.88, 'normalized');
    if (fuzzyMatches.length > 1) return pending(fuzzyMatches, 0.7, 'normalized');

    // 5. Absolute Fallback: if any provider contains part of the name
    if (providers.length > 0) {
      const firstWords = normalizedName.split(' ')[0];
      const partialMatches = providers.filter(p => normalizeText(p.providerName).includes(firstWords));
      if (partialMatches.length === 1) return confirmed(partialMatches[0], 0.75, 'normalized');
    }

    return { excelName: name, confidence: 0, matchType: 'none', status: 'pending' };
  },

  /**
   * Persist a manual provider match resolution
   */
  async resolveMatch(match: ProviderMatch, resolvedBy?: string, importSessionId?: string, candidateProviderId?: string, matchToken?: string) {
    if (!useMockData && importSessionId && candidateProviderId) {
      try {
        return await providerMatchingService.persistMatchResolution(
          importSessionId,
          candidateProviderId,
          matchToken || 'manual-match-token'
        );
      } catch (err) {
        // Fallback to repository save if live RPC fails
      }
    }
    return saveProviderMatchResolution(match, resolvedBy);
  },

  /**
   * Generate a unique fingerprint for a financial record
   */
  generateFingerprint(record: Partial<FinancialRecord>): string {
    return buildFingerprint(record);
  },

  /**
   * Explain the autonomous actions taken during normalization. This is read-only
   * metadata for the Validation Preview and never changes persistence decisions.
   */
  analyzeIntegrity(
    rows: Array<Record<string, unknown>>,
    mappings: ColumnMapping[],
    records: FinancialRecord[],
    horizontalSchedule: boolean,
  ): FinancialIntegritySummary {
    const providerMapping = mappings.find(mapping => mapping.nmisField === 'providerName');
    const amountMappings = mappings.filter(mapping => numericFields.has(String(mapping.nmisField)) && mapping.nmisField !== 'reportingMonth' && mapping.nmisField !== 'reportingYear');
    const monthColumns = mappings.filter(mapping => aiIngestionEngine.isMonthColumn(mapping.excelField));
    let inheritedProviderRows = 0;
    let suppressedSummaryRows = 0;
    let skippedEmptyScheduleCells = 0;
    let skippedRowsWithoutAmounts = 0;
    let invalidAmountCells = 0;
    let inheritedProvider = '';

    rows.forEach(row => {
      const explicitProvider = providerMapping ? String(row[providerMapping.excelField] ?? '').trim() : '';
      if (explicitProvider && isSummaryRow(explicitProvider)) {
        suppressedSummaryRows += 1;
      }
      if (explicitProvider) inheritedProvider = explicitProvider;
      else if (inheritedProvider || !providerMapping) inheritedProviderRows += 1;

      if (horizontalSchedule && monthColumns.length > 0) {
        monthColumns.forEach(mapping => {
          const raw = row[mapping.excelField];
          if (isBlankScheduleValue(raw) || toNumber(raw) === 0) {
            skippedEmptyScheduleCells += 1;
          } else if (toNumber(raw) === undefined) {
            invalidAmountCells += 1;
          }
        });
      } else {
        const hasAmount = amountMappings.some(mapping => toNumber(row[mapping.excelField]) !== undefined);
        if (!hasAmount) skippedRowsWithoutAmounts += 1;
        amountMappings.forEach(mapping => {
          const raw = row[mapping.excelField];
          if (!isBlankScheduleValue(raw) && toNumber(raw) === undefined) invalidAmountCells += 1;
        });
      }
    });

    const warnings: string[] = [];
    if (invalidAmountCells > 0) warnings.push(`${invalidAmountCells.toLocaleString()} non-empty amount cell(s) could not be parsed and were excluded.`);
    if (suppressedSummaryRows > 0) warnings.push(`${suppressedSummaryRows.toLocaleString()} summary row(s) were excluded from normalized records.`);
    if (skippedRowsWithoutAmounts > 0) warnings.push(`${skippedRowsWithoutAmounts.toLocaleString()} row(s) contained no usable financial amount and were excluded.`);

    return {
      scannedRows: rows.length,
      normalizedRecords: records.length,
      inheritedProviderRows,
      suppressedSummaryRows,
      skippedEmptyScheduleCells,
      skippedRowsWithoutAmounts,
      invalidAmountCells,
      detectedDataTypes: [...new Set(records.map(record => record.dataType).filter(Boolean))],
      detectedPeriods: [...new Set(records.map(record => record.period).filter(Boolean))].sort(),
      warnings,
    };
  },

  aiIngestionEngine,

  /**
   * Normalize raw Excel data into FinancialRecord objects
   */
  normalizeData(
    rows: any[],
    mappings: ColumnMapping[],
    dataType: FinancialDataType,
    batchId: string,
    fileName: string,
    sourceSheet?: string,
    periodOverride?: { reportingYear: number; reportingMonth: number },
    fallbackContext?: { facilityName?: string; lga?: string; state?: string }
  ): FinancialRecord[] {
    const records: FinancialRecord[] = [];
    const now = new Date().toISOString();

    // Identify month columns for horizontal-to-vertical transformation
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const getMonthIndex = (fieldName: string) => {
      const field = fieldName.toLowerCase().trim();
      const fullIndex = monthNames.indexOf(field);
      if (fullIndex >= 0) return fullIndex;
      if (field === 'sept') return 8;
      const shortIndex = monthShortNames.indexOf(field);
      if (shortIndex >= 0) return shortIndex;
      // Also check for "JAN 2025" or "JAN-25"
      const firstPart = field.split(/[\s\-]/)[0];
      const shortIdxPart = monthShortNames.indexOf(firstPart);
      if (shortIdxPart >= 0) return shortIdxPart;
      return -1;
    };

    const monthColumns = mappings.filter(m => getMonthIndex(m.excelField) >= 0);
    const providerMapping = mappings.find(m => m.nmisField === 'providerName');
    const codeMapping = mappings.find(m => m.nmisField === 'providerCode');
    const lgaMapping = mappings.find(m => m.nmisField === 'lga');
    const stateMapping = mappings.find(m => m.nmisField === 'state');
    const enrichedRows = aiIngestionEngine.inheritRowContext(rows, {
      providerName: providerMapping?.excelField,
      providerCode: codeMapping?.excelField,
      lga: lgaMapping?.excelField,
      state: stateMapping?.excelField,
    });

    let inheritedProviderName = fallbackContext?.facilityName || '';
    let inheritedProviderCode = '';
    let inheritedLga = fallbackContext?.lga || '';
    let inheritedState = fallbackContext?.state || 'Ondo';

    enrichedRows.forEach((row, index) => {
      // AI Self-Healing: provider context was inherited by the shared engine.
      const explicitProviderName = providerMapping ? String(row[providerMapping.excelField] || '').trim() : '';
      const explicitProviderCode = codeMapping ? String(row[codeMapping.excelField] || '').trim() : '';
      const explicitLga = lgaMapping ? String(row[lgaMapping.excelField] || '').trim() : '';
      const explicitState = stateMapping ? String(row[stateMapping.excelField] || '').trim() : '';

      if (explicitProviderName) inheritedProviderName = explicitProviderName;
      if (explicitProviderCode) inheritedProviderCode = explicitProviderCode;
      if (explicitLga) inheritedLga = explicitLga;
      if (explicitState) inheritedState = explicitState;

      const rawProviderName = explicitProviderName || inheritedProviderName;
      const rawProviderCode = explicitProviderCode || inheritedProviderCode;
      const rawLga = explicitLga || inheritedLga;

      if (!rawProviderName || isSummaryRow(rawProviderName)) {
        return; // Skip empty or summary rows
      }

      const baseData: Partial<FinancialRecord> = {
        id: `rec-${batchId}-${index}`,
        importBatchId: batchId,
        sourceFile: fileName,
        sourceSheet,
        sourceRow: index + 2,
        recordStatus: 'pending' as any,
        createdAt: now,
        updatedAt: now,
        reportingYear: periodOverride?.reportingYear,
        reportingMonth: periodOverride?.reportingMonth,
        providerName: rawProviderName,
        providerCode: rawProviderCode,
        lga: rawLga,
        state: inheritedState,
      };

      mappings.forEach(mapping => {
        if (mapping.nmisField === 'ignored') return;
        const val = row[mapping.excelField];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          (baseData as any)[mapping.nmisField] = this.smartNormalize(mapping.nmisField as keyof FinancialRecord, val);
        }
      });

      if (monthColumns.length > 0) {
        // Horizontal-to-vertical transformation
        monthColumns.forEach(m => {
          const amount = toNumber(row[m.excelField]);
          // Autonomous Cleaning: Skip months with no amount
          if (amount === undefined || amount === 0) return;

          const monthIdx = getMonthIndex(m.excelField);
          const finalRecord: FinancialRecord = {
            ...baseData,
            dataType: baseData.dataType || dataType,
            reportingMonth: monthIdx + 1,
            amountPaid: amount,
            period: `${baseData.reportingYear}-${String(monthIdx + 1).padStart(2, '0')}`,
          } as FinancialRecord;

          records.push({ ...finalRecord, fingerprint: buildFingerprint(finalRecord) });
        });
      } else {
        // Autonomous Cleaning: Skip rows that have no financial amount
        const hasAmount = ['amount', 'amountSubmitted', 'amountClaimed', 'amountApproved', 'amountPaid', 'netAmountPaid'].some(f => (baseData as any)[f] !== undefined);
        if (!hasAmount) return;

        const finalRecord: FinancialRecord = {
          ...baseData,
          dataType: baseData.dataType || dataType,
          period: baseData.reportingYear && baseData.reportingMonth ? `${baseData.reportingYear}-${String(baseData.reportingMonth).padStart(2, '0')}` : undefined,
        } as FinancialRecord;

        records.push({ ...finalRecord, fingerprint: buildFingerprint(finalRecord) });
      }
    });

    return records;
  },
};
