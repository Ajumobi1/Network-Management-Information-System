import { 
  FinancialRecord, 
  ImportBatch, 
  FinancialDataType, 
  RecordValidationStatus 
} from '../../types/financial-data';
import { mockFinancialRecords, mockImportBatches } from '../../mocks/financialDataMocks';

const normalizeFingerprintValue = (value: unknown) => String(value ?? '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
const recordFingerprint = (record: FinancialRecord) => [
  record.providerCode || record.providerName,
  record.period,
  record.dataType,
  record.claimsCategory || '',
  record.claimCount ?? record.encounterCount ?? '',
  record.amountSubmitted ?? record.amountClaimed ?? '',
  record.amountApproved ?? '',
  record.amountPaid ?? record.netAmountPaid ?? record.amount ?? '',
].map(normalizeFingerprintValue).join('|');

export interface FinancialFilters {
  dataType?: FinancialDataType;
  year?: number;
  month?: number;
  period?: string;
  state?: string;
  lga?: string;
  facilityType?: string;
  ownership?: string;
  providerId?: string;
  batchId?: string;
  claimsCategory?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: RecordValidationStatus;
  search?: string;
}

export async function fetchFinancialRecords(filters: FinancialFilters = {}): Promise<FinancialRecord[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filtered = [...mockFinancialRecords];
  
  if (filters.dataType) {
    filtered = filtered.filter(r => r.dataType === filters.dataType);
  }
  
  if (filters.year) {
    filtered = filtered.filter(r => r.reportingYear === filters.year);
  }
  
  if (filters.month) {
    filtered = filtered.filter(r => r.reportingMonth === filters.month);
  }
  
  if (filters.batchId) {
    filtered = filtered.filter(r => r.importBatchId === filters.batchId);
  }

  if (filters.period) {
    filtered = filtered.filter(r => r.period === filters.period);
  }

  if (filters.providerId) {
    filtered = filtered.filter(r => r.providerId === filters.providerId);
  }

  if (filters.claimsCategory) {
    filtered = filtered.filter(r => r.claimsCategory === filters.claimsCategory);
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    filtered = filtered.filter(r => {
      const amount = r.netAmountPaid ?? r.amountPaid ?? r.amountApproved ?? r.amount ?? 0;
      return (filters.minAmount === undefined || amount >= filters.minAmount)
        && (filters.maxAmount === undefined || amount <= filters.maxAmount);
    });
  }

  if (filters.state) {
    filtered = filtered.filter(r => r.state === filters.state);
  }

  if (filters.lga) {
    filtered = filtered.filter(r => r.lga === filters.lga);
  }

  if (filters.facilityType) {
    filtered = filtered.filter(r => r.facilityType === filters.facilityType);
  }

  if (filters.ownership) {
    filtered = filtered.filter(r => r.ownership === filters.ownership);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(r => 
      r.providerName.toLowerCase().includes(search) || 
      r.providerCode?.toLowerCase().includes(search) ||
      r.state?.toLowerCase().includes(search) ||
      r.lga?.toLowerCase().includes(search)
    );
  }
  
  return filtered;
}

export interface FinancialBreakdown {
  name: string;
  value: number;
}

export interface ClaimsAnalytics {
  totalExpenditure: number;
  totalClaims: number;
  totalCapitation: number;
  totalFFS: number;
  recordCount: number;
  providerCount: number;
  totalClaimCount: number;
  averageClaimAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  byCategory: FinancialBreakdown[];
  trends: FinancialBreakdown[];
  byState: FinancialBreakdown[];
  byLga: FinancialBreakdown[];
  byFacilityType: FinancialBreakdown[];
  byOwnership: FinancialBreakdown[];
  byClaimsCategory: FinancialBreakdown[];
  topFacilitiesByAmount: FinancialBreakdown[];
  topFacilitiesByVolume: FinancialBreakdown[];
  paidVsRejected: FinancialBreakdown[];
}

function amountForRecord(record: FinancialRecord): number {
  return record.netAmountPaid ?? record.amountPaid ?? record.netAmount ?? record.amountApproved ?? record.amount ?? 0;
}

function submittedClaimsAmount(record: FinancialRecord): number {
  return record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.amountPaid ?? 0;
}

function rejectedClaimsAmount(record: FinancialRecord): number {
  return record.amountRejected ?? record.amountDisallowed ?? Math.max(submittedClaimsAmount(record) - (record.amountApproved ?? record.amountPaid ?? 0), 0);
}

function claimVolume(record: FinancialRecord): number {
  return record.claimCount ?? record.encounterCount ?? 0;
}

function groupAmount(records: FinancialRecord[], key: (record: FinancialRecord) => string, amount: (record: FinancialRecord) => number = amountForRecord): FinancialBreakdown[] {
  const grouped = records.reduce<Record<string, number>>((acc, record) => {
    const group = key(record);
    acc[group] = (acc[group] ?? 0) + amount(record);
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export async function fetchFinancialAnalytics(filters: FinancialFilters = {}): Promise<ClaimsAnalytics> {
  const records = await fetchFinancialRecords(filters);
  const claimsRecords = records.filter(record => record.dataType === 'claims');
  const capitationRecords = records.filter(record => record.dataType === 'capitation');
  const ffsRecords = records.filter(record => record.dataType === 'ffs');
  const totalExpenditure = records.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalClaims = claimsRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalCapitation = capitationRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalFFS = ffsRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalClaimCount = claimsRecords.reduce((sum, record) => sum + claimVolume(record), 0);
  const paidAmount = claimsRecords.reduce((sum, record) => sum + amountForRecord(record), 0);
  const rejectedAmount = claimsRecords.reduce((sum, record) => sum + rejectedClaimsAmount(record), 0);

  const byCategory = groupAmount(records, record => record.dataType);
  const trends = groupAmount(records, record => record.period);
  const byState = groupAmount(records, record => record.state || 'Unknown');
  const byLga = groupAmount(records, record => record.lga || 'Unknown');
  const byFacilityType = groupAmount(records, record => record.facilityType || 'Other');
  const byOwnership = groupAmount(records, record => record.ownership || 'Unknown');
  const byClaimsCategory = groupAmount(claimsRecords, record => record.claimsCategory || 'Uncategorised');
  const topFacilitiesByAmount = groupAmount(claimsRecords, record => record.providerName || 'Unknown');
  const topFacilitiesByVolume = groupAmount(claimsRecords, record => record.providerName || 'Unknown', claimVolume);

  return {
    totalExpenditure,
    totalClaims,
    totalCapitation,
    totalFFS,
    recordCount: records.length,
    providerCount: new Set(records.map(record => record.providerId || record.providerCode || record.providerName)).size,
    totalClaimCount,
    averageClaimAmount: totalClaimCount > 0 ? paidAmount / totalClaimCount : 0,
    paidAmount,
    rejectedAmount,
    byCategory,
    trends,
    byState,
    byLga,
    byFacilityType,
    byOwnership,
    byClaimsCategory,
    topFacilitiesByAmount: topFacilitiesByAmount.slice(0, 10),
    topFacilitiesByVolume: topFacilitiesByVolume.slice(0, 10),
    paidVsRejected: [{ name: 'Paid', value: paidAmount }, { name: 'Rejected / disallowed', value: rejectedAmount }],
  };
}

export interface FinancialRegisterSummary {
  totalRecords: number;
  totalClaimCount: number;
  totalSubmittedAmount: number;
  totalApprovedAmount: number;
  totalRejectedAmount: number;
  totalPaidAmount: number;
  averageClaimValue: number;
  providerCount: number;
}

export async function fetchFinancialRegisterSummary(filters: FinancialFilters = {}): Promise<FinancialRegisterSummary> {
  const records = await fetchFinancialRecords(filters);
  const totalClaimCount = records.reduce((sum, record) => sum + (record.claimCount ?? record.encounterCount ?? 0), 0);
  const totalSubmittedAmount = records.reduce((sum, record) => sum + (record.amountSubmitted ?? record.amountClaimed ?? 0), 0);
  const totalApprovedAmount = records.reduce((sum, record) => sum + (record.amountApproved ?? record.amountPaid ?? 0), 0);
  const totalRejectedAmount = records.reduce((sum, record) => sum + (record.amountRejected ?? record.amountDisallowed ?? 0), 0);
  const totalPaidAmount = records.reduce((sum, record) => sum + (record.netAmountPaid ?? record.amountPaid ?? record.netAmount ?? record.amount ?? 0), 0);

  return {
    totalRecords: records.length,
    totalClaimCount,
    totalSubmittedAmount,
    totalApprovedAmount,
    totalRejectedAmount,
    totalPaidAmount,
    averageClaimValue: totalClaimCount > 0 ? totalPaidAmount / totalClaimCount : 0,
    providerCount: new Set(records.map(record => record.providerId || record.providerCode || record.providerName)).size,
  };
}

export async function fetchImportBatches(): Promise<ImportBatch[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockImportBatches];
}

export async function fetchImportBatchById(id: string): Promise<ImportBatch | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockImportBatches.find(b => b.id === id) || null;
}

export async function createImportBatch(
  batch: Omit<ImportBatch, 'id' | 'uploadedAt'>,
  records?: FinancialRecord[]
): Promise<ImportBatch> {
  const batchId = `batch-${Date.now()}`;
  const newBatch: ImportBatch = {
    ...batch,
    id: batchId,
    uploadedAt: new Date().toISOString(),
  };
  
  let recordsToImport: FinancialRecord[] = [];
  let duplicateRecords = 0;

  if (records && records.length > 0) {
    const existingFingerprints = new Set(mockFinancialRecords.map(record => record.fingerprint || recordFingerprint(record)));
    const batchFingerprints = new Set<string>();
    const preparedRecords = records.map(record => ({
      ...record,
      fingerprint: record.fingerprint || recordFingerprint(record),
    }));

    recordsToImport = preparedRecords.filter(record => {
      if (batchFingerprints.has(record.fingerprint!) || existingFingerprints.has(record.fingerprint!)) {
        duplicateRecords += 1;
        return false;
      }
      batchFingerprints.add(record.fingerprint!);
      return true;
    }).map(record => ({
      ...record,
      importBatchId: batchId,
      id: record.id.includes('pending') ? `rec-${batchId}-${Math.random().toString(36).substr(2, 9)}` : record.id,
    }));

    mockFinancialRecords.push(...recordsToImport);
  }

  const duplicateRows = (batch.duplicateRows ?? 0) + duplicateRecords;
  const importStatus: ImportBatch['status'] = records && records.length > 0
    ? recordsToImport.length === 0 ? 'superseded' : duplicateRows > 0 ? 'partially-imported' : batch.status
    : batch.status;
  const persistedBatch: ImportBatch = {
    ...newBatch,
    importedRows: records ? recordsToImport.length : newBatch.importedRows,
    duplicateRows,
    status: importStatus,
  };
  mockImportBatches.unshift(persistedBatch);

  return persistedBatch;
}

export async function checkDuplicateBatch(period: string, dataType: FinancialDataType): Promise<ImportBatch | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockImportBatches.find(b => b.periodCovered === period && b.dataType === dataType && ['imported', 'partially-imported', 'superseded'].includes(b.status)) || null;
}
