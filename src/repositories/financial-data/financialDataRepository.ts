import { FinancialDataType, FinancialRecord, ImportBatch, RecordValidationStatus } from '../../types/financial-data';
import { mockFinancialRecords, mockImportBatches } from '../../mocks/financialDataMocks';
import { useMockData } from '../common';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { accessRestricted, importWorkflowUnavailable } from '../../lib/security/secureContracts';

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

function applyMockFilters(records: FinancialRecord[], filters: FinancialFilters): FinancialRecord[] {
  let filtered = [...records];
  if (filters.dataType) filtered = filtered.filter(record => record.dataType === filters.dataType);
  if (filters.year) filtered = filtered.filter(record => record.reportingYear === filters.year);
  if (filters.month) filtered = filtered.filter(record => record.reportingMonth === filters.month);
  if (filters.batchId) filtered = filtered.filter(record => record.importBatchId === filters.batchId);
  if (filters.period) filtered = filtered.filter(record => record.period === filters.period);
  if (filters.providerId) filtered = filtered.filter(record => record.providerId === filters.providerId);
  if (filters.claimsCategory) filtered = filtered.filter(record => record.claimsCategory === filters.claimsCategory);
  if (filters.state) filtered = filtered.filter(record => record.state === filters.state);
  if (filters.lga) filtered = filtered.filter(record => record.lga === filters.lga);
  if (filters.facilityType) filtered = filtered.filter(record => record.facilityType === filters.facilityType);
  if (filters.ownership) filtered = filtered.filter(record => record.ownership === filters.ownership);
  if (filters.status) filtered = filtered.filter(record => record.recordStatus === filters.status);
  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) filtered = filtered.filter(record => {
    const value = amountForRecord(record);
    return (filters.minAmount === undefined || value >= filters.minAmount) && (filters.maxAmount === undefined || value <= filters.maxAmount);
  });
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(record => [record.providerName, record.providerCode, record.state, record.lga].filter(Boolean).join(' ').toLowerCase().includes(query));
  }
  return filtered;
}

function reportingArgs(filters: FinancialFilters): Record<string, unknown> {
  return {
    p_year: filters.year ?? null,
    p_month: filters.month ?? null,
    p_period: filters.period ?? null,
    p_sector: null,
    p_state: filters.state ?? null,
    p_lga: filters.lga ?? null,
    p_provider_id: filters.providerId ?? null,
    p_facility_type: filters.facilityType ?? null,
    p_ownership: filters.ownership ?? null,
    p_data_type: filters.dataType ?? null,
  };
}

/** Raw financial registers remain denied until claims/finance scope is approved. */
export async function fetchFinancialRecords(filters: FinancialFilters = {}): Promise<FinancialRecord[]> {
  if (useMockData) return applyMockFilters(mockFinancialRecords, filters);
  throw accessRestricted('raw financial record register');
}

export interface FinancialBreakdown { name: string; value: number; }

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
  return record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amount ?? 0;
}
function submittedClaimsAmount(record: FinancialRecord): number {
  return record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.amountPaid ?? 0;
}
function rejectedClaimsAmount(record: FinancialRecord): number {
  return record.amountRejected ?? Math.max(submittedClaimsAmount(record) - (record.amountApproved ?? record.amountPaid ?? 0), 0);
}
function claimVolume(record: FinancialRecord): number { return record.claimCount ?? record.encounterCount ?? 0; }
function groupAmount(records: FinancialRecord[], key: (record: FinancialRecord) => string, amount: (record: FinancialRecord) => number = amountForRecord): FinancialBreakdown[] {
  const grouped = records.reduce<Record<string, number>>((accumulator, record) => {
    const group = key(record);
    accumulator[group] = (accumulator[group] ?? 0) + amount(record);
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export async function fetchFinancialAnalytics(filters: FinancialFilters = {}): Promise<ClaimsAnalytics> {
  if (!useMockData) return invokeSecureRpc<ClaimsAnalytics>('nmis_financial_intelligence', reportingArgs(filters));
  const records = await fetchFinancialRecords(filters);
  const claims = records.filter(record => record.dataType === 'claims');
  const capitation = records.filter(record => record.dataType === 'capitation');
  const ffs = records.filter(record => record.dataType === 'ffs');
  const totalExpenditure = records.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalClaims = claims.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalCapitation = capitation.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalFFS = ffs.reduce((sum, record) => sum + amountForRecord(record), 0);
  const totalClaimCount = claims.reduce((sum, record) => sum + claimVolume(record), 0);
  const paidAmount = claims.reduce((sum, record) => sum + amountForRecord(record), 0);
  const rejectedAmount = claims.reduce((sum, record) => sum + rejectedClaimsAmount(record), 0);
  return {
    totalExpenditure, totalClaims, totalCapitation, totalFFS,
    recordCount: records.length,
    providerCount: new Set(records.map(record => record.providerId || record.providerCode || record.providerName)).size,
    totalClaimCount,
    averageClaimAmount: totalClaimCount ? paidAmount / totalClaimCount : 0,
    paidAmount, rejectedAmount,
    byCategory: groupAmount(records, record => record.dataType),
    trends: groupAmount(records, record => record.period),
    byState: groupAmount(records, record => record.state || 'Unknown'),
    byLga: groupAmount(records, record => record.lga || 'Unknown'),
    byFacilityType: groupAmount(records, record => record.facilityType || 'Other'),
    byOwnership: groupAmount(records, record => record.ownership || 'Unknown'),
    byClaimsCategory: groupAmount(claims, record => record.claimsCategory || 'Uncategorised'),
    topFacilitiesByAmount: groupAmount(claims, record => record.providerName || 'Unknown').slice(0, 10),
    topFacilitiesByVolume: groupAmount(claims, record => record.providerName || 'Unknown', claimVolume).slice(0, 10),
    paidVsRejected: [{ name: 'Paid', value: paidAmount }, { name: 'Rejected', value: rejectedAmount }],
  };
}

export async function fetchImportBatches(): Promise<ImportBatch[]> {
  if (useMockData) return [...mockImportBatches];
  throw importWorkflowUnavailable();
}

export async function fetchImportBatchById(id: string): Promise<ImportBatch | null> {
  if (useMockData) return mockImportBatches.find(batch => batch.id === id) || null;
  throw importWorkflowUnavailable();
}

export async function createImportBatch(batch: Omit<ImportBatch, 'id' | 'uploadedAt'>, records?: FinancialRecord[], _actor?: { id: string; email: string }): Promise<ImportBatch> {
  if (!useMockData) throw importWorkflowUnavailable();
  const batchId = `batch-${Date.now()}`;
  const newBatch: ImportBatch = { ...batch, id: batchId, uploadedAt: new Date().toISOString() };
  if (records?.length) {
    const fingerprints = new Set(mockFinancialRecords.map(record => record.fingerprint || recordFingerprint(record)));
    const prepared = records.map(record => ({ ...record, id: `rec-${batchId}-${Math.random().toString(36).slice(2, 9)}`, fingerprint: record.fingerprint || recordFingerprint(record), importBatchId: batchId }));
    const newRecords = prepared.filter(record => !fingerprints.has(record.fingerprint!));
    mockFinancialRecords.push(...newRecords);
    newBatch.importedRows = newRecords.length;
    newBatch.duplicateRows = records.length - newRecords.length;
  }
  mockImportBatches.unshift(newBatch);
  return newBatch;
}

export async function checkDuplicateBatch(period: string, dataType: FinancialDataType): Promise<ImportBatch | null> {
  if (!useMockData) throw importWorkflowUnavailable();
  return mockImportBatches.find(batch => batch.periodCovered === period && batch.dataType === dataType && ['imported', 'partially-imported'].includes(batch.status)) || null;
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
  if (!useMockData) return invokeSecureRpc<FinancialRegisterSummary>('nmis_financial_intelligence', reportingArgs(filters));
  const records = await fetchFinancialRecords(filters);
  const totalClaimCount = records.reduce((sum, record) => sum + claimVolume(record), 0);
  const totalSubmittedAmount = records.reduce((sum, record) => sum + submittedClaimsAmount(record), 0);
  const totalApprovedAmount = records.reduce((sum, record) => sum + (record.amountApproved ?? record.amountPaid ?? 0), 0);
  const totalRejectedAmount = records.reduce((sum, record) => sum + rejectedClaimsAmount(record), 0);
  const totalPaidAmount = records.reduce((sum, record) => sum + amountForRecord(record), 0);
  return { totalRecords: records.length, totalClaimCount, totalSubmittedAmount, totalApprovedAmount, totalRejectedAmount, totalPaidAmount, averageClaimValue: totalClaimCount ? totalPaidAmount / totalClaimCount : 0, providerCount: new Set(records.map(record => record.providerId || record.providerCode || record.providerName)).size };
}
