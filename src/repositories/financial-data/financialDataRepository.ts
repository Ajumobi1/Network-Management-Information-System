import { 
  FinancialRecord, 
  ImportBatch, 
  FinancialDataType, 
  RecordValidationStatus 
} from '../../types/financial-data';
import { mockFinancialRecords, mockImportBatches } from '../../mocks/financialDataMocks';
import { useMockData, fetchTable, insertRow, fetchSingle } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { FinancialRecordsRow, ImportBatchesRow } from '../../lib/supabase/database.types';
import { logAction } from '../audit/auditRepository';

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

// Helper to map Supabase row to UI type
function mapFinancialRowToUI(r: FinancialRecordsRow): FinancialRecord {
  return {
    id: r.id,
    providerId: r.provider_id || undefined,
    providerCode: r.provider_code || undefined,
    providerName: r.provider_name,
    facilityType: r.facility_type as any,
    ownership: r.ownership as any,
    state: r.state || undefined,
    lga: r.lga || undefined,
    reportingYear: r.reporting_year,
    reportingMonth: r.reporting_month,
    period: r.period,
    dataType: r.data_type as FinancialDataType,
    amountSubmitted: r.amount_submitted || undefined,
    amountClaimed: r.amount_claimed || undefined,
    amountApproved: r.amount_approved || undefined,
    amountPaid: r.amount_paid || undefined,
    netAmountPaid: r.net_amount_paid || undefined,
    claimCount: r.claim_count || undefined,
    encounterCount: r.encounter_count || undefined,
    eligibleLives: r.eligible_lives || undefined,
    sourceFile: r.source_file || '',
    importBatchId: r.import_batch_id || '',
    recordStatus: r.record_status as RecordValidationStatus,
    fingerprint: r.fingerprint || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Helper to map ImportBatch row to UI type
function mapImportBatchRowToUI(r: ImportBatchesRow): ImportBatch {
  return {
    id: r.id,
    fileName: r.file_name,
    dataType: r.data_type as FinancialDataType,
    reportingYear: r.reporting_year || undefined,
    reportingMonth: r.reporting_month || undefined,
    uploadedBy: r.uploaded_by,
    uploadedAt: r.uploaded_at,
    totalRows: r.total_rows,
    importedRows: r.imported_rows,
    warningRows: r.warning_rows,
    errorRows: r.error_rows,
    duplicateRows: r.duplicate_rows,
    unmatchedProviders: r.unmatched_providers,
    totalAmount: r.total_amount || undefined,
    status: r.status as any,
    periodCovered: r.period_covered || undefined,
    metadata: r.metadata as Record<string, any>,
  };
}

export async function fetchFinancialRecords(filters: FinancialFilters = {}): Promise<FinancialRecord[]> {
  if (useMockData) {
    let filtered = [...mockFinancialRecords];
    
    if (filters.dataType) filtered = filtered.filter(r => r.dataType === filters.dataType);
    if (filters.year) filtered = filtered.filter(r => r.reportingYear === filters.year);
    if (filters.month) filtered = filtered.filter(r => r.reportingMonth === filters.month);
    if (filters.batchId) filtered = filtered.filter(r => r.importBatchId === filters.batchId);
    if (filters.period) filtered = filtered.filter(r => r.period === filters.period);
    if (filters.providerId) filtered = filtered.filter(r => r.providerId === filters.providerId);
    if (filters.claimsCategory) filtered = filtered.filter(r => r.claimsCategory === filters.claimsCategory);
    
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      filtered = filtered.filter(r => {
        const amount = r.netAmountPaid ?? r.amountPaid ?? r.amountApproved ?? r.amount ?? 0;
        return (filters.minAmount === undefined || amount >= filters.minAmount)
          && (filters.maxAmount === undefined || amount <= filters.maxAmount);
      });
    }

    if (filters.state) filtered = filtered.filter(r => r.state === filters.state);
    if (filters.lga) filtered = filtered.filter(r => r.lga === filters.lga);
    if (filters.facilityType) filtered = filtered.filter(r => r.facilityType === filters.facilityType);
    if (filters.ownership) filtered = filtered.filter(r => r.ownership === filters.ownership);
    
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

  const supabase = getApiClient();
  let query = supabase.from('financial_records').select('*');

  if (filters.dataType) query = query.eq('data_type', filters.dataType);
  if (filters.year) query = query.eq('reporting_year', filters.year);
  if (filters.month) query = query.eq('reporting_month', filters.month);
  if (filters.batchId) query = query.eq('import_batch_id', filters.batchId);
  if (filters.period) query = query.eq('period', filters.period);
  if (filters.providerId) query = query.eq('provider_id', filters.providerId);
  if (filters.state) query = query.eq('state', filters.state);
  if (filters.lga) query = query.eq('lga', filters.lga);
  if (filters.facilityType) query = query.eq('facility_type', filters.facilityType);
  if (filters.ownership) query = query.eq('ownership', filters.ownership);
  
  if (filters.search) {
    query = query.or(`provider_name.ilike.%${filters.search}%,provider_code.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('period', { ascending: false });
  if (error) throw formatSupabaseError(error);

  return (data as FinancialRecordsRow[]).map(mapFinancialRowToUI);
}

// Analytics and breakdown logic remains the same as it operates on the fetched records
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
  return record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amount ?? 0;
}

function submittedClaimsAmount(record: FinancialRecord): number {
  return record.amountSubmitted ?? record.amountClaimed ?? record.amountApproved ?? record.amountPaid ?? 0;
}

function rejectedClaimsAmount(record: FinancialRecord): number {
  return record.amountRejected ?? Math.max(submittedClaimsAmount(record) - (record.amountApproved ?? record.amountPaid ?? 0), 0);
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
    byCategory: groupAmount(records, record => record.dataType),
    trends: groupAmount(records, record => record.period),
    byState: groupAmount(records, record => record.state || 'Unknown'),
    byLga: groupAmount(records, record => record.lga || 'Unknown'),
    byFacilityType: groupAmount(records, record => record.facilityType || 'Other'),
    byOwnership: groupAmount(records, record => record.ownership || 'Unknown'),
    byClaimsCategory: groupAmount(claimsRecords, record => record.claimsCategory || 'Uncategorised'),
    topFacilitiesByAmount: groupAmount(claimsRecords, record => record.providerName || 'Unknown').slice(0, 10),
    topFacilitiesByVolume: groupAmount(claimsRecords, record => record.providerName || 'Unknown', claimVolume).slice(0, 10),
    paidVsRejected: [{ name: 'Paid', value: paidAmount }, { name: 'Rejected', value: rejectedAmount }],
  };
}

export async function fetchImportBatches(): Promise<ImportBatch[]> {
  if (useMockData) {
    return [...mockImportBatches];
  }
  const batches = await fetchTable<ImportBatchesRow>('import_batches', { column: 'uploaded_at', ascending: false });
  return batches.map(mapImportBatchRowToUI);
}

export async function fetchImportBatchById(id: string): Promise<ImportBatch | null> {
  if (useMockData) {
    return mockImportBatches.find(b => b.id === id) || null;
  }
  const batch = await fetchSingle<ImportBatchesRow>('import_batches', 'id', id);
  return mapImportBatchRowToUI(batch);
}

export async function createImportBatch(
  batch: Omit<ImportBatch, 'id' | 'uploadedAt'>,
  records?: FinancialRecord[],
  actor?: { id: string; email: string }
): Promise<ImportBatch> {
  if (useMockData) {
    const batchId = `batch-${Date.now()}`;
    const newBatch: ImportBatch = { ...batch, id: batchId, uploadedAt: new Date().toISOString() };
    
    if (records && records.length > 0) {
      const existingFingerprints = new Set(mockFinancialRecords.map(record => record.fingerprint || recordFingerprint(record)));
      const preparedRecords = records.map(record => ({
        ...record,
        fingerprint: record.fingerprint || recordFingerprint(record),
        importBatchId: batchId,
        id: `rec-${batchId}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      const recordsToImport = preparedRecords.filter(record => !existingFingerprints.has(record.fingerprint!));
      mockFinancialRecords.push(...recordsToImport);
      newBatch.importedRows = recordsToImport.length;
      newBatch.duplicateRows = records.length - recordsToImport.length;
    }
    mockImportBatches.unshift(newBatch);
    
    await logAction({
      action: 'IMPORT_BATCH_CREATED',
      entity: 'import_batches',
      entityId: batchId,
      metadata: { fileName: batch.fileName, dataType: batch.dataType, totalRows: batch.totalRows }
    });

    return newBatch;
  }

  const supabase = getApiClient();
  
  // 1. Create the batch
  const batchRow: Partial<ImportBatchesRow> = {
    file_name: batch.fileName,
    data_type: batch.dataType,
    reporting_year: batch.reportingYear,
    reporting_month: batch.reportingMonth,
    uploaded_by: actor?.email || batch.uploadedBy,
    total_rows: batch.totalRows,
    status: batch.status,
    period_covered: batch.periodCovered,
    metadata: batch.metadata as any,
  };
  
  const { data: createdBatch, error: batchError } = await supabase.from('import_batches').insert(batchRow).select().single();
  if (batchError) throw formatSupabaseError(batchError);

  // 2. Insert records if provided
  if (records && records.length > 0) {
    const recordRows: Partial<FinancialRecordsRow>[] = records.map(r => ({
      provider_id: r.providerId,
      provider_code: r.providerCode,
      provider_name: r.providerName,
      facility_type: r.facilityType,
      ownership: r.ownership,
      state: r.state,
      lga: r.lga,
      reporting_year: r.reportingYear,
      reporting_month: r.reportingMonth,
      period: r.period,
      data_type: r.dataType,
      amount_submitted: r.amountSubmitted,
      amount_claimed: r.amountClaimed,
      amount_approved: r.amountApproved,
      amount_paid: r.amountPaid,
      net_amount_paid: r.netAmountPaid,
      claim_count: r.claimCount,
      encounter_count: r.encounterCount,
      eligible_lives: r.eligibleLives,
      source_file: r.sourceFile,
      import_batch_id: createdBatch.id,
      record_status: r.recordStatus,
      fingerprint: r.fingerprint || recordFingerprint(r),
    }));

    // Chunked insert to avoid payload size limits
    const chunkSize = 500;
    for (let i = 0; i < recordRows.length; i += chunkSize) {
      const chunk = recordRows.slice(i, i + chunkSize);
      const { error: recordsError } = await supabase.from('financial_records').insert(chunk);
      if (recordsError) throw formatSupabaseError(recordsError);
    }
    
    // Update batch with final counts (simple version for now)
    await supabase.from('import_batches').update({ 
      imported_rows: records.length,
      status: 'imported' 
    }).eq('id', createdBatch.id);
  }

  await logAction({
    userId: actor?.id,
    userEmail: actor?.email,
    action: 'IMPORT_BATCH_CREATED',
    entity: 'import_batches',
    entityId: createdBatch.id,
    metadata: { fileName: batch.fileName, dataType: batch.dataType, totalRows: batch.totalRows }
  });

  return mapImportBatchRowToUI(createdBatch as ImportBatchesRow);
}

export async function checkDuplicateBatch(period: string, dataType: FinancialDataType): Promise<ImportBatch | null> {
  if (useMockData) {
    return mockImportBatches.find(b => b.periodCovered === period && b.dataType === dataType && ['imported', 'partially-imported'].includes(b.status)) || null;
  }
  
  const supabase = getApiClient();
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .eq('period_covered', period)
    .eq('data_type', dataType)
    .in('status', ['imported', 'partially-imported'])
    .maybeSingle();
    
  if (error) throw formatSupabaseError(error);
  return data ? mapImportBatchRowToUI(data as ImportBatchesRow) : null;
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
  const totalRejectedAmount = records.reduce((sum, record) => sum + (record.amountRejected ?? 0), 0);
  const totalPaidAmount = records.reduce((sum, record) => sum + (record.netAmountPaid ?? record.amountPaid ?? record.amount ?? 0), 0);

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
