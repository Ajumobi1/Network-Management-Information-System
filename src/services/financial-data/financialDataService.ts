import {
  FinancialRecord,
  FinancialDataType,
  ColumnMapping,
  ProviderMatch
} from '../../types/financial-data';
import { getProviderDirectory, getPersistedProviderMatches, saveProviderMatchResolution } from '../../repositories/providers/providersRepository';
import { providerMatchingService } from '../reconciliation/providerMatchingService';
import { useMockData } from '../../repositories/common';

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
const buildFingerprint = (record: FinancialRecord) => [
  record.providerCode || normalizeText(record.providerName),
  record.period,
  record.dataType,
  record.claimsCategory || '',
  record.claimCount ?? record.encounterCount ?? '',
  record.amountSubmitted ?? record.amountClaimed ?? '',
  record.amountApproved ?? '',
  record.amountPaid ?? record.netAmountPaid ?? record.amount ?? '',
].map(value => normalizeText(value)).join('|');

export const isSummaryRow = (providerName: string): boolean => {
  const normalized = providerName.trim().toUpperCase();
  // Exact matches for summary keywords
  const exactKeywords = ['TOTAL', 'GRAND TOTAL', 'SUBTOTAL', 'SUMMARY', 'TOTALS'];
  if (exactKeywords.includes(normalized)) return true;
  
  // Check for "TOTAL" followed by common summary labels, but exclude valid provider name parts
  // We avoid startsWith('TOTAL ') because it catches "Total Care", "Total Health", etc.
  const summaryPrefixes = ['TOTAL ', 'GRAND TOTAL ', 'SUBTOTAL '];
  const summaryLabels = ['AMOUNT', 'COUNT', 'RECORDS', 'ENROLLEES', 'BENEFICIARIES', 'PAYABLE', 'GROSS', 'NET'];
  
  for (const prefix of summaryPrefixes) {
    if (normalized.startsWith(prefix)) {
      const remainder = normalized.substring(prefix.length).trim();
      // If the remainder is just a summary label or a number/punctuation, it's a summary row
      if (summaryLabels.includes(remainder) || /^[0-9#,\.\-\/ ]+$/.test(remainder)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Service to handle business logic for financial data hub
 */
export const financialDataService = {
  /**
   * Suggest a data type based on headers
   */
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
      { field: 'providerName', keywords: ['provider', 'facility', 'hospital', 'outlet', 'health facility', 'account name as it appears'], weight: 1.0 },
      { field: 'providerCode', keywords: ['provider code', 'facility code', 'hcp code', 'code'], weight: 0.95 },
      { field: 'ownership', keywords: ['ownership', 'category', 'sector'], weight: 0.8, context: ['provider-network'] },
      { field: 'facilityType', keywords: ['facility type', 'type of facility'], weight: 0.8, context: ['provider-network'] },
      { field: 'amountPaid', keywords: ['amount paid', 'total paid', 'net paid', 'payment', 'paid'], weight: 1.0 },
      { field: 'amountClaimed', keywords: ['amount claimed', 'gross claimed', 'claimed', 'submission'], weight: 0.95 },
      { field: 'amountApproved', keywords: ['amount approved', 'approved', 'vetted', 'vetting'], weight: 0.95 },
      { field: 'amountRejected', keywords: ['amount rejected', 'rejected', 'disallowed'], weight: 0.95 },
      { field: 'amount', keywords: ['capitation fee', 'gross amount', 'total amount', 'amount'], weight: 0.8 },
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
      return { ...persistedMatch, status: 'confirmed', confidence: 1 };
    }

    const asCandidates = (items: typeof providers) => items.map(provider => ({ id: provider.id, name: provider.providerName, code: provider.providerCode, lga: provider.lga, state: provider.state, senatorialDistrict: undefined, facilityType: provider.category, ownership: provider.ownership }));
    const confirmed = (provider: (typeof providers)[number], confidence: number, matchType: ProviderMatch['matchType']): ProviderMatch => ({
      excelName: name,
      matchedProviderId: provider.id,
      matchedProviderName: provider.providerName,
      matchedProviderCode: provider.providerCode,
      matchedProviderLga: provider.lga,
      matchedProviderState: provider.state,
      matchedProviderFacilityType: provider.category,
      matchedProviderOwnership: provider.ownership,
      confidence,
      matchType,
      status: 'confirmed',
    });
    const pending = (items: typeof providers, confidence: number, matchType: ProviderMatch['matchType']): ProviderMatch => ({
      excelName: name,
      matchedProviderId: items.length === 1 ? items[0].id : undefined,
      matchedProviderName: items.length === 1 ? items[0].providerName : undefined,
      matchedProviderCode: items.length === 1 ? items[0].providerCode : undefined,
      matchedProviderLga: items.length === 1 ? items[0].lga : undefined,
      matchedProviderState: items.length === 1 ? items[0].state : undefined,
      matchedProviderFacilityType: items.length === 1 ? items[0].category : undefined,
      matchedProviderOwnership: items.length === 1 ? items[0].ownership : undefined,
      candidates: asCandidates(items),
      confidence,
      matchType,
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
   * Normalize raw Excel data into FinancialRecord objects
   */
  normalizeData(
    rows: any[],
    mappings: ColumnMapping[],
    dataType: FinancialDataType,
    batchId: string,
    fileName: string,
    sourceSheet?: string,
    periodOverride?: { reportingYear: number; reportingMonth: number }
  ): FinancialRecord[] {
    const records: FinancialRecord[] = [];
    const now = new Date().toISOString();

    // Identify month columns for horizontal-to-vertical transformation
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthColumnIndex = (fieldName: string) => {
      const field = fieldName.toLowerCase().trim();
      const fullIndex = monthNames.indexOf(field);
      if (fullIndex >= 0) return fullIndex;
      if (field === 'sept') return 8;
      return monthShortNames.indexOf(field);
    };

    const monthColumns = mappings.filter(m => monthColumnIndex(m.excelField) >= 0);

    let inheritedProviderName = '';
    rows.forEach((row, index) => {
      // Financial schedules commonly put the provider only on the CAPITATION row and leave it blank on the following FFS row.
      const providerMapping = mappings.find(m => m.nmisField === 'providerName');
      const explicitProviderName = providerMapping ? String(row[providerMapping.excelField] || '').trim() : '';
      if (explicitProviderName) inheritedProviderName = explicitProviderName;
      const rawProviderName = explicitProviderName || inheritedProviderName;

      if (!rawProviderName || isSummaryRow(rawProviderName)) {
        return; // Skip empty or summary rows
      }

      const baseData: Partial<FinancialRecord> = {
        id: `rec-${batchId}-${index}`,
        importBatchId: batchId,
        sourceFile: fileName,
        sourceSheet,
        sourceRow: index + 2,
        dataType,
        createdAt: now,
        updatedAt: now,
        recordStatus: 'valid'
      };

      // Map fixed columns
      mappings.forEach(mapping => {
        if (mapping.nmisField !== 'ignored' && !monthColumns.includes(mapping)) {
          const rawValue = mapping.nmisField === 'providerName' && !row[mapping.excelField]
            ? inheritedProviderName
            : row[mapping.excelField];
          const normalizedValue = this.smartNormalize(mapping.nmisField as keyof FinancialRecord, rawValue);
          (baseData as any)[mapping.nmisField] = normalizedValue;
        }
      });
      // The inherited provider is authoritative for companion rows whose provider cell is blank.
      baseData.providerName = inheritedProviderName;


      // Apply the shared workbook/file detection or the manual fallback selected by the user.
      if (periodOverride) {
        baseData.reportingYear = periodOverride.reportingYear;
        baseData.reportingMonth = periodOverride.reportingMonth;
      }

      // Last-resort filename detection for callers outside the uploader UI.
      // Never substitute the current date when the workbook has no period.
      if (!baseData.reportingYear || !baseData.reportingMonth) {
        const lowerName = fileName.toLowerCase();
        const monthNamesList = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const mIdx = monthNamesList.findIndex(m => lowerName.includes(m) || lowerName.includes(m.slice(0, 3)));
        const yMatch = lowerName.match(/20\d{2}/);
        if (!baseData.reportingMonth && mIdx !== -1) baseData.reportingMonth = mIdx + 1;
        if (!baseData.reportingYear && yMatch) baseData.reportingYear = Number(yMatch[0]);
      }

      const hasValidYear = Number.isInteger(baseData.reportingYear) && Number(baseData.reportingYear) >= 2000 && Number(baseData.reportingYear) <= 2100;
      const hasValidMonth = Number.isInteger(baseData.reportingMonth) && Number(baseData.reportingMonth) >= 1 && Number(baseData.reportingMonth) <= 12;
      if (monthColumns.length > 0) {
        // A horizontal schedule derives the month from each month column. Only the year is required at this stage.
        if (!hasValidYear) {
          baseData.reportingYear = 0;
          baseData.reportingMonth = 0;
          baseData.period = '';
          baseData.recordStatus = 'error';
          baseData.validationErrors = [...(baseData.validationErrors || []), 'Reporting year is required for a month-column schedule.'];
        } else {
          baseData.reportingMonth = 0;
          baseData.period = '';
        }
      } else if (hasValidYear && hasValidMonth) {
        baseData.period = baseData.period || `${baseData.reportingYear}-${Number(baseData.reportingMonth).toString().padStart(2, '0')}`;
      } else {
        baseData.reportingYear = 0;
        baseData.reportingMonth = 0;
        baseData.period = '';
        baseData.recordStatus = 'error';
        baseData.validationErrors = [...(baseData.validationErrors || []), 'Reporting month and year are required.'];
      }

      // Handle horizontal months if present
      if (monthColumns.length > 0) {
        monthColumns.forEach(mCol => {
          const monthVal = row[mCol.excelField];
          if (monthVal !== undefined && monthVal !== null && monthVal !== '') {
            const finalMonthIdx = monthColumnIndex(mCol.excelField);

            const monthRecord: FinancialRecord = {
              ...(baseData as FinancialRecord),
              id: `${baseData.id}-${mCol.excelField}`,
              reportingMonth: finalMonthIdx + 1,
              reportingYear: Number(baseData.reportingYear || 0),
              period: hasValidYear && finalMonthIdx >= 0 ? `${baseData.reportingYear}-${(finalMonthIdx + 1).toString().padStart(2, '0')}` : '',
              amount: toNumber(monthVal)
            };
            monthRecord.fingerprint = buildFingerprint(monthRecord);
            records.push(monthRecord);
          }
        });
      } else {
        // Single record per row
        const record = baseData as FinancialRecord;
        record.fingerprint = buildFingerprint(record);
        records.push(record);
      }
    });

    return records;
  },

  /**
   * Generate a fingerprint for a record to detect duplicates
   */
  generateFingerprint(record: FinancialRecord): string {
    return buildFingerprint(record);
  }
};
