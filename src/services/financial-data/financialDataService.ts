import { 
  FinancialRecord, 
  FinancialDataType, 
  ColumnMapping, 
  ProviderMatch 
} from '../../types/financial-data';
import { getProviderDirectory, getPersistedProviderMatches, saveProviderMatchResolution } from '../../repositories/providers/providersRepository';

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
    
    return 'other';
  },

  /**
   * Suggest column mappings based on headers
   */
  suggestMappings(headers: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    
    const knownMappings: Record<string, { field: keyof FinancialRecord, keywords: string[] }> = {
      'providerName': { field: 'providerName', keywords: ['provider', 'facility', 'outlet', 'hospital', 'name'] },
      'providerCode': { field: 'providerCode', keywords: ['code', 'id', 'sn'] },
      'amountPaid': { field: 'amountPaid', keywords: ['paid', 'amount', 'payment', 'total paid'] },
      'amountClaimed': { field: 'amountClaimed', keywords: ['claimed', 'gross claimed'] },
      'amountApproved': { field: 'amountApproved', keywords: ['approved', 'vetting'] },
      'claimsCategory': { field: 'claimsCategory', keywords: ['category', 'service type', 'type'] },
      'state': { field: 'state', keywords: ['state', 'region'] },
      'lga': { field: 'lga', keywords: ['lga', 'area', 'local govt'] },
      'reportingMonth': { field: 'reportingMonth', keywords: ['month', 'period'] },
      'reportingYear': { field: 'reportingYear', keywords: ['year'] },
      'eligibleLives': { field: 'eligibleLives', keywords: ['enrollee', 'lives', 'count', 'total enrollees'] },
    };

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      let matchedField: keyof FinancialRecord | 'ignored' = 'ignored';
      let confidenceScore = 0;

      for (const [key, config] of Object.entries(knownMappings)) {
        const keywordMatch = config.keywords.find(kw => normalizedHeader.includes(kw));
        if (keywordMatch) {
          matchedField = config.field;
          // Exact match gets higher confidence
          confidenceScore = config.keywords.includes(normalizedHeader) ? 0.95 : 0.75;
          break;
        }
      }

      mappings.push({
        excelField: header,
        nmisField: matchedField,
        confidence: confidenceScore > 0.9 ? 'HIGH' : confidenceScore > 0.6 ? 'MEDIUM' : 'LOW',
        confidenceScore
      });
    });

    return mappings;
  },

  /**
   * Attempt to match a provider name to the directory using priority rules
   */
  async matchProvider(name: string, code?: string, lga?: string, state?: string): Promise<ProviderMatch> {
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
  async resolveMatch(match: ProviderMatch, resolvedBy?: string) {
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
          let value = row[mapping.excelField];
          
          // Clean numeric values
          if (numericFields.has(String(mapping.nmisField))) value = toNumber(value);
          (baseData as any)[mapping.nmisField] = value;
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
  },

  /**
   * Calculate summary metrics for a list of records
   */
  calculateSummary(records: FinancialRecord[]) {
    return {
      totalAmount: records.reduce((sum, r) => sum + (r.amountPaid || r.netAmountPaid || r.amount || 0), 0),
      totalClaims: records.filter(r => r.dataType === 'claims').reduce((sum, r) => sum + (r.amountPaid || 0), 0),
      totalCapitation: records.filter(r => r.dataType === 'capitation').reduce((sum, r) => sum + (r.netAmount || 0), 0),
      totalFFS: records.filter(r => r.dataType === 'ffs').reduce((sum, r) => sum + (r.amount || 0), 0),
      recordCount: records.length,
      providerCount: new Set(records.map(r => r.providerId || r.providerName)).size
    };
  }
};
