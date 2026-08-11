import { 
  FinancialRecord, 
  FinancialDataType, 
  ColumnMapping, 
  ProviderMatch 
} from '../../types/financial-data';
import { getProviderDirectory } from '../../repositories/providers/providersRepository';

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
    const normalizedName = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // 1. Priority: Exact provider code
    if (code) {
      const codeMatch = providers.find(p => p.providerCode.toLowerCase() === code.toLowerCase());
      if (codeMatch) {
        return {
          excelName: name,
          matchedProviderId: codeMatch.id,
          matchedProviderName: codeMatch.providerName,
          matchedProviderCode: codeMatch.providerCode,
          confidence: 1.0,
          matchType: 'exact',
          status: 'confirmed'
        };
      }
    }

    // 2. Exact name match
    const exactNameMatch = providers.find(p => p.providerName.toLowerCase().trim() === name.toLowerCase().trim());
    if (exactNameMatch) {
      return {
        excelName: name,
        matchedProviderId: exactNameMatch.id,
        matchedProviderName: exactNameMatch.providerName,
        matchedProviderCode: exactNameMatch.providerCode,
        confidence: 0.98,
        matchType: 'exact',
        status: 'confirmed'
      };
    }

    // 3. Name + Location (LGA or State)
    if (lga || state) {
      const locationMatch = providers.find(p => 
        p.providerName.toLowerCase().includes(normalizedName) && 
        ((lga && p.lga.toLowerCase() === lga.toLowerCase()) || (state && p.state.toLowerCase() === state.toLowerCase()))
      );
      if (locationMatch) {
        return {
          excelName: name,
          matchedProviderId: locationMatch.id,
          matchedProviderName: locationMatch.providerName,
          matchedProviderCode: locationMatch.providerCode,
          confidence: 0.95,
          matchType: 'location',
          status: 'confirmed'
        };
      }
    }

    // 4. Normalized fuzzy match
    const fuzzyMatch = providers.find(p => {
      const normalizedP = p.providerName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      return normalizedP === normalizedName || normalizedP.includes(normalizedName) || normalizedName.includes(normalizedP);
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
   * Normalize raw Excel data into FinancialRecord objects
   */
  normalizeData(
    rows: any[], 
    mappings: ColumnMapping[], 
    dataType: FinancialDataType,
    batchId: string,
    fileName: string
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
          if (typeof value === 'string' && (mapping.nmisField.toString().toLowerCase().includes('amount') || mapping.nmisField === 'eligibleLives')) {
            value = parseFloat(value.replace(/,/g, ''));
          }
          
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
              amount: typeof monthVal === 'string' ? parseFloat(monthVal.replace(/,/g, '')) : monthVal
            };
            records.push(monthRecord);
          }
        });
      } else {
        // Single record per row
        records.push(baseData as FinancialRecord);
      }
    });

    return records;
  },

  /**
   * Generate a fingerprint for a record to detect duplicates
   */
  generateFingerprint(record: FinancialRecord): string {
    const components = [
      record.providerName,
      record.providerCode,
      record.period,
      record.dataType,
      record.amountPaid || record.amount || 0,
      record.eligibleLives || 0
    ];
    return components.map(c => String(c).toLowerCase().trim()).join('|');
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
