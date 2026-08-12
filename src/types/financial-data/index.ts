import { ProviderCategory, ProviderOwnership } from '../providers/providerTypes';

export type FinancialDataType = 'claims' | 'capitation' | 'ffs' | 'enrolment' | 'provider-network' | 'other';

export type ImportStatus =
  | 'uploaded'
  | 'processing'
  | 'validation-required'
  | 'ready-for-review'
  | 'imported'
  | 'partially-imported'
  | 'failed'
  | 'superseded';

export type RecordValidationStatus = 'valid' | 'warning' | 'error' | 'match-review-required' | 'duplicate';

export interface FinancialRecord {
  id: string;
  providerId?: string;
  providerCode?: string;
  providerName: string;
  facilityType?: ProviderCategory;
  ownership?: ProviderOwnership;
  state?: string;
  lga?: string;
  reportingYear: number;
  reportingMonth: number;
  period: string; // YYYY-MM
  dataType: FinancialDataType;

  // Claims-specific fields supplied by processed Claims/payment workbooks
  claimsCategory?: string;
  claimsType?: string;
  serviceType?: string;
  claimCount?: number;
  encounterCount?: number;
  amountSubmitted?: number;
  amountClaimed?: number;
  amountApproved?: number;
  amountRejected?: number;
  amountDisallowed?: number;
  amountPaid?: number;
  netAmountPaid?: number;

  // Capitation specific
  eligibleLives?: number;
  formalEnrollees?: number;
  informalEnrollees?: number;
  capitationRate?: number;
  grossAmount?: number;
  adjustments?: number;
  deductions?: number;
  netAmount?: number;

  // FFS specific
  ffsCategory?: string;

  // General
  amount?: number;
  paymentStatus?: 'pending' | 'processing' | 'paid' | 'failed';
  paymentDate?: string;

  // Source metadata
  sourceFile: string;
  sourceSheet?: string;
  sourceRow?: number;
  importBatchId: string;
  importDate?: string;
  dataPeriod?: string;
  recordStatus: RecordValidationStatus;
  validationErrors?: string[];
  fingerprint?: string; // For duplicate detection

  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  dataType: FinancialDataType;
  reportingYear?: number;
  reportingMonth?: number;
  uploadedBy: string;
  uploadedAt: string;
  totalRows: number;
  importedRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
  unmatchedProviders: number;
  totalAmount?: number;
  status: ImportStatus;
  periodCovered?: string;
  metadata?: Record<string, any>;
}

export interface ColumnMapping {
  excelField: string;
  nmisField: keyof FinancialRecord | 'ignored';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  isCustom?: boolean;
}

export interface ProviderMatch {
  excelName: string;
  matchedProviderId?: string;
  matchedProviderName?: string;
  matchedProviderCode?: string;
  matchedProviderLga?: string;
  matchedProviderState?: string;
  matchedProviderSenatorialDistrict?: string;
  matchedProviderFacilityType?: ProviderCategory;
  matchedProviderOwnership?: ProviderOwnership;
  candidates?: Array<{ id: string; name: string; code: string; lga?: string; state?: string; senatorialDistrict?: string; facilityType?: ProviderCategory; ownership?: ProviderOwnership }>;
  confidence: number;
  matchType: 'exact' | 'normalized' | 'alias' | 'location' | 'manual' | 'none';
  status: 'confirmed' | 'pending' | 'rejected';
}
