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

const isSummaryRow = (providerName: string): boolean => {
  const normalized = providerName.trim().toUpperCase();
  return (
    normalized === 'TOTAL' ||
    normalized === 'GRAND TOTAL' ||
    normalized === 'SUBTOTAL' ||
    normalized.startsWith('TOTAL ') ||
    normalized.startsWith('GRAND TOTAL ') ||
    normalized.startsWith('SUBTOTAL ')
  );
};

/**
 * Service to handle business logic for financial data hub
 */
export const financialDataService = {
  /**
   * Suggest a data type based on headers
   */
  detectDataType(headers: string[]): FinancialDataType {
    const headerStr = headers.join(' ').toLowerCase();

    if (headerStr.includes('claim') || headerStr.includes('dental') || headerStr.includes('optical') || headerStr.includes('diagnostic')) {
      return 'claims';
    }

    if (headerStr.includes('capitation') || headerStr.includes('cap fee') || (headerStr.includes('enrollee') && headerStr.includes('amount'))) {
      return 'capitation';
    }

    if (headerStr.includes('ffs') || headerStr.includes('fee for service')) {
      return 'ffs';
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
  suggestMappings(headers: string[], dataType?: FinancialDataType): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];

    const knownMappings: Array<{ field: keyof FinancialRecord | 'ignored', keywords: string[], weight: number, context?: FinancialDataType[] }> = [
      { field: 'ignored', keywords: ['s/n', 'sn', 'index', 'id', 'account number', 'bank', 'number of enrollees', 'number of formal enrollees', 'number of informal enrollees', 'number of enrollees on capitation list'], weight: 1.0 },
      { field: 'providerName', keywords: ['provider', 'facility', 'hospital', 'name', 'outlet', 'health facility', 'account name as it appears'], weight: 1.0 },
      { field: 'providerCode', keywords: ['code', 'provider code', 'facility code', 'hcp code'], weight: 0.9 },
      { field: 'ownership', keywords: ['category', 'ownership', 'type of facility', 'sector'], weight: 0.8, context: ['provider-network'] },
      { field: 'facilityType', keywords: ['category', 'facility type', 'type'], weight: 0.8, context: ['provider-network'] },
      { field: 'amountPaid', keywords: ['paid', 'net paid', 'amount paid', 'payment', 'total paid', 'net amount', 'amount'], weight: 1.0 },
      { field: 'amountClaimed', keywords: ['claimed', 'gross claimed', 'amount claimed', 'submission'], weight: 0.9 },
      { field: 'amountApproved', keywords: ['approved', 'vetted', 'vetting', 'amount approved'], weight: 0.9 },
      { field: 'amount', keywords: ['amount', 'capitation fee'], weight: 0.8 },
      { field: 'claimsCategory', keywords: ['claims category', 'service type', 'benefit'], weight: 0.8 },
      { field: 'state', keywords: ['state', 'region', 'location'], weight: 0.7 },
      { field: 'lga', keywords: ['lga', 'local government', 'area'], weight: 0.7 },
      { field: 'reportingMonth', keywords: ['month', 'period', 'reporting month'], weight: 0.8 },
      { field: 'reportingYear', keywords: ['year', 'reporting year'], weight: 0.8 },
      { field: 'eligibleLives', keywords: ['enrollee', 'lives', 'count', 'total enrollees', 'population', 'number of enrollees'], weight: 0.8 },
    ];

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9/ ]/g, '');
      let bestMatch: keyof FinancialRecord | 'ignored' = 'ignored';
      let maxScore = 0;

      for (const config of knownMappings) {
        // Boost score if context matches
        const contextBoost = (dataType && config.context && config.context.includes(dataType)) ? 1.2 : 1.0;

        for (const kw of config.keywords) {
          let score = 0;
          if (normalizedHeader === kw) score = 1.0;
          else if (normalizedHeader.startsWith(kw) || normalizedHeader.endsWith(kw)) score = 0.85;
          else if (normalizedHeader.includes(kw)) score = 0.7;
          
          score *= config.weight * contextBoost;
          if (score > maxScore) {
            maxScore = score;
            bestMatch = config.field;
          }
        }
      }

      mappings.push({
        excelField: header,
        nmisField: bestMatch,
        confidence: maxScore > 0.9 ? 'HIGH' : maxScore > 0.6 ? 'MEDIUM' : 'LOW',
        confidenceScore: maxScore
      });
    });

    return mappings;
  },

  /**
   * Smart normalization for values (standardizing typos like PRVATE)
   */
  smartNormalize(field: keyof FinancialRecord, value: unknown): any {
    if (value === null || value === undefined) return value;
    const text = String(value).trim();
    const upper = text.toUpperCase();

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

    if (numericFields.has(String(field))) return toNumber(value);
    
    return text;
  },

  /**
   * Attempt to match a provider name to the directory using priority rules
   */
  async matchProvider(name: string, code?: string, lga?: string, state?: string, importSessionId?: string): Promise<ProviderMatch> {
    if (!useMockData) {
      try {
        const sessionId = importSessionId || 'default-session';
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
          status: candidates.length === 1 && top.match_score >= 85 ? 'confirmed' : 'pending',
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

    // 4. Normalized/Fuzzy Match
    const fuzzyMatches = providers.filter(provider => {
      const providerName = normalizeText(provider.providerName);
      return providerName.includes(normalizedName) || normalizedName.includes(providerName);
    });
    if (fuzzyMatches.length === 1) return pending(fuzzyMatches, 0.82, 'normalized');
    if (fuzzyMatches.length > 1) return pending(fuzzyMatches, 0.7, 'normalized');

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
    sourceSheet?: string
  ): FinancialRecord[] {
    const records: FinancialRecord[] = [];
    const now = new Date().toISOString();

    // Identify month columns for horizontal-to-vertical transformation
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthShortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    const monthColumns = mappings.filter(m => {
      const field = m.excelField.toLowerCase();
      return monthNames.includes(field) || monthShortNames.includes(field);
    });

    rows.forEach((row, index) => {
      // Check if this is a summary row based on provider name
      const providerMapping = mappings.find(m => m.nmisField === 'providerName');
      const rawProviderName = providerMapping ? String(row[providerMapping.excelField] || '').trim() : '';
      
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
          const rawValue = row[mapping.excelField];
          const normalizedValue = this.smartNormalize(mapping.nmisField as keyof FinancialRecord, rawValue);
          (baseData as any)[mapping.nmisField] = normalizedValue;
        }
      });

      // Handle horizontal months if present
      if (monthColumns.length > 0) {
        monthColumns.forEach(mCol => {
          const monthVal = row[mCol.excelField];
          if (monthVal !== undefined && monthVal !== null && monthVal !== '') {
            const monthIdx = monthNames.indexOf(mCol.excelField.toLowerCase());
            const finalMonthIdx = monthIdx !== -1 ? monthIdx : monthShortNames.indexOf(mCol.excelField.toLowerCase());

            const monthRecord: FinancialRecord = {
              ...(baseData as FinancialRecord),
              id: `${baseData.id}-${mCol.excelField}`,
              reportingMonth: finalMonthIdx + 1,
              reportingYear: baseData.reportingYear || new Date().getFullYear(),
              period: `${baseData.reportingYear || new Date().getFullYear()}-${(finalMonthIdx + 1).toString().padStart(2, '0')}`,
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
