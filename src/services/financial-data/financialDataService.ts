import { 
  FinancialRecord, 
  FinancialDataType, 
  ColumnMapping, 
  ProviderMatch 
} from '../../types/financial-data';
import { providersMocks } from '../../mocks';

/**
 * Service to handle business logic for financial data hub
 */
export const financialDataService = {
  /**
   * Suggest a data type based on headers
   */
  detectDataType(headers: string[]): FinancialDataType {
    const headerStr = headers.join(' ').toLowerCase();
    
    if (headerStr.includes('claim') || headerStr.includes('dental') || headerStr.includes('optical')) {
      return 'claims';
    }
    
    if (headerStr.includes('capitation') || headerStr.includes('enrollee')) {
      return 'capitation';
    }
    
    if (headerStr.includes('ffs') || headerStr.includes('fee for service')) {
      return 'ffs';
    }
    
    if (headerStr.includes('enrolment') || headerStr.includes('informal')) {
      return 'enrolment';
    }
    
    return 'other';
  },

  /**
   * Suggest column mappings based on headers
   */
  suggestMappings(headers: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    
    const knownMappings: Record<string, keyof FinancialRecord> = {
      'provider': 'providerName',
      'facility': 'providerName',
      'outlet': 'providerName',
      'code': 'providerCode',
      'amount': 'amountPaid',
      'paid': 'amountPaid',
      'claimed': 'amountClaimed',
      'approved': 'amountApproved',
      'category': 'claimsCategory',
      'state': 'state',
      'lga': 'lga',
      'period': 'period',
      'month': 'reportingMonth',
      'year': 'reportingYear',
    };

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      let matchedField: keyof FinancialRecord | 'ignored' = 'ignored';
      let confidence = 0;

      for (const [key, field] of Object.entries(knownMappings)) {
        if (normalizedHeader.includes(key)) {
          matchedField = field;
          confidence = 0.9;
          break;
        }
      }

      mappings.push({
        excelField: header,
        nmisField: matchedField,
        confidence
      });
    });

    return mappings;
  },

  /**
   * Attempt to match a provider name to the directory
   */
  matchProvider(name: string): ProviderMatch {
    const providers = providersMocks.providerDirectory;
    const normalizedSearch = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // 1. Exact match
    const exactMatch = providers.find(p => p.providerName.toLowerCase().trim() === name.toLowerCase().trim());
    if (exactMatch) {
      return {
        excelName: name,
        matchedProviderId: exactMatch.id,
        matchedProviderName: exactMatch.providerName,
        matchedProviderCode: exactMatch.providerCode,
        confidence: 1.0,
        matchType: 'exact',
        status: 'confirmed'
      };
    }

    // 2. Normalized match (fuzzy-ish)
    const fuzzyMatch = providers.find(p => {
      const normalizedP = p.providerName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return normalizedP === normalizedSearch || normalizedP.includes(normalizedSearch) || normalizedSearch.includes(normalizedP);
    });

    if (fuzzyMatch) {
      return {
        excelName: name,
        matchedProviderId: fuzzyMatch.id,
        matchedProviderName: fuzzyMatch.providerName,
        matchedProviderCode: fuzzyMatch.providerCode,
        confidence: 0.85,
        matchType: 'normalized',
        status: 'pending'
      };
    }

    return {
      excelName: name,
      confidence: 0,
      matchType: 'none',
      status: 'pending'
    };
  },

  /**
   * Calculate summary metrics for a list of records
   */
  calculateSummary(records: FinancialRecord[]) {
    return {
      totalAmount: records.reduce((sum, r) => sum + (r.amountPaid || r.netAmount || r.amount || 0), 0),
      totalClaims: records.filter(r => r.dataType === 'claims').reduce((sum, r) => sum + (r.amountPaid || 0), 0),
      totalCapitation: records.filter(r => r.dataType === 'capitation').reduce((sum, r) => sum + (r.netAmount || 0), 0),
      totalFFS: records.filter(r => r.dataType === 'ffs').reduce((sum, r) => sum + (r.amount || 0), 0),
      recordCount: records.length,
      providerCount: new Set(records.map(r => r.providerId || r.providerName)).size
    };
  }
};
