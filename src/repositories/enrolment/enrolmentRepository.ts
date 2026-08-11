import { fetchTable, insertRow, useMockData } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { EnrolleesRow, ImportBatchesRow } from '../../lib/supabase/database.types';
import { ImportBatch, FinancialRecord } from '../../types/financial-data';
import { mockImportBatches } from '../../mocks/financialDataMocks';
import { fetchFinancialRecords } from '../financial-data/financialDataRepository';
import {
  EnrolleeRecord,
  EnrolmentAnalytics,
  EnrolmentFilters,
  EnrolmentCategory,
  EnrolmentSector,
} from '../../types/enrolment/enrolmentTypes';
import {
  getEnrolleeByIdMock,
  getEnrolleesMock,
  insertEnrolleesMock,
} from '../../mocks/enrolmentMocks';
import { logAction } from '../audit/auditRepository';

function mapRowToEnrollee(row: EnrolleesRow): EnrolleeRecord {
  return {
    id: row.id,
    policyNumber: row.policy_number,
    category: row.category as EnrolmentCategory,
    sector: row.sector as EnrolmentSector,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender as EnrolleeRecord['gender'],
    phoneNumber: row.phone_number || undefined,
    providerId: row.provider_id || undefined,
    providerCode: row.provider_code || undefined,
    providerName: row.provider_name,
    facilityType: row.facility_type as EnrolleeRecord['facilityType'],
    ownership: row.ownership as EnrolleeRecord['ownership'],
    lga: row.lga,
    state: row.state,
    senatorialDistrict: row.senatorial_district || undefined,
    reportingYear: row.reporting_year,
    reportingMonth: row.reporting_month,
    period: row.period,
    sourceFile: row.source_file || '',
    importBatchId: row.import_batch_id || '',
    sourceRow: row.source_row || undefined,
    recordStatus: row.record_status as EnrolleeRecord['recordStatus'],
    fingerprint: row.fingerprint || `${row.policy_number.toLowerCase()}|${row.period}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? row.metadata as Record<string, unknown>
      : undefined,
  };
}

function matchesFilter(record: EnrolleeRecord, filters: EnrolmentFilters): boolean {
  const query = filters.search?.trim().toLowerCase() || '';
  const searchable = [
    record.policyNumber,
    record.firstName,
    record.lastName,
    record.providerName,
    record.providerCode,
    record.lga,
    record.state,
    record.senatorialDistrict,
  ].filter(Boolean).join(' ').toLowerCase();

  return (!query || searchable.includes(query))
    && (!filters.sector || filters.sector === 'all' || record.sector === filters.sector)
    && (!filters.category || filters.category === 'all' || record.category === filters.category)
    && (!filters.gender || filters.gender === 'all' || record.gender === filters.gender)
    && (!filters.state || filters.state === 'all' || record.state === filters.state)
    && (!filters.lga || filters.lga === 'all' || record.lga === filters.lga)
    && (!filters.senatorialDistrict || filters.senatorialDistrict === 'all' || record.senatorialDistrict === filters.senatorialDistrict)
    && (!filters.providerId || filters.providerId === 'all' || record.providerId === filters.providerId)
    && (!filters.period || filters.period === 'all' || record.period === filters.period)
    && (!filters.year || record.reportingYear === filters.year)
    && (!filters.month || record.reportingMonth === filters.month);
}

function groupBy(records: EnrolleeRecord[], key: (record: EnrolleeRecord) => string): Array<{ name: string; value: number }> {
  const grouped = records.reduce<Record<string, number>>((accumulator, record) => {
    const name = key(record) || 'Unknown';
    accumulator[name] = (accumulator[name] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export async function fetchEnrollees(filters: EnrolmentFilters = {}): Promise<EnrolleeRecord[]> {
  const records = useMockData
    ? await getEnrolleesMock()
    : (await fetchTable<EnrolleesRow>('enrollees', { column: 'created_at', ascending: false })).map(mapRowToEnrollee);

  return records.filter(record => matchesFilter(record, filters));
}

export async function fetchEnrolleeById(id: string): Promise<EnrolleeRecord> {
  if (useMockData) return getEnrolleeByIdMock(id);
  const supabase = getApiClient();
  const { data, error } = await supabase.from('enrollees').select('*').eq('id', id).single();
  if (error) throw formatSupabaseError(error);
  return mapRowToEnrollee(data as EnrolleesRow);
}

function mapEnrolleeToRow(record: EnrolleeRecord, importBatchId?: string): Partial<EnrolleesRow> {
  return {
    id: record.id,
    policy_number: record.policyNumber,
    category: record.category,
    sector: record.sector,
    first_name: record.firstName,
    last_name: record.lastName,
    gender: record.gender,
    phone_number: record.phoneNumber,
    provider_id: record.providerId,
    provider_code: record.providerCode,
    provider_name: record.providerName,
    facility_type: record.facilityType,
    ownership: record.ownership,
    lga: record.lga,
    state: record.state,
    senatorial_district: record.senatorialDistrict,
    reporting_year: record.reportingYear,
    reporting_month: record.reportingMonth,
    period: record.period,
    source_file: record.sourceFile,
    import_batch_id: importBatchId || record.importBatchId,
    source_row: record.sourceRow,
    record_status: record.recordStatus,
    fingerprint: record.fingerprint,
    metadata: record.metadata || {},
  };
}

export async function insertEnrollee(record: EnrolleeRecord, actor?: { id: string; email: string }): Promise<EnrolleeRecord> {
  const inserted = await insertEnrolleeRecords([record], actor);
  if (inserted.length === 0) throw new Error('Enrollee record already exists for this policy and period.');
  return inserted[0];
}

export async function insertEnrolleeRecords(records: EnrolleeRecord[], actor?: { id: string; email: string }, importBatchId?: string): Promise<EnrolleeRecord[]> {
  if (records.length === 0) return [];

  if (useMockData) {
    const inserted = await insertEnrolleesMock(records);
    await logAction({
      userId: actor?.id,
      userEmail: actor?.email,
      action: 'ENROLMENT_RECORDS_COMMITTED',
      entity: 'enrollees',
      metadata: { submitted: records.length, inserted: inserted.length, duplicates: records.length - inserted.length },
    });
    return inserted;
  }

  const rows = records.map(record => mapEnrolleeToRow(record, importBatchId));
  const supabase = getApiClient();
  const { data, error } = await supabase.from('enrollees').upsert(rows, { onConflict: 'fingerprint', ignoreDuplicates: true }).select('*');
  if (error) throw formatSupabaseError(error);

  const inserted = (data as EnrolleesRow[]).map(mapRowToEnrollee);
  await logAction({
    userId: actor?.id,
    userEmail: actor?.email,
    action: 'ENROLMENT_RECORDS_COMMITTED',
    entity: 'enrollees',
    metadata: { submitted: records.length, inserted: inserted.length, duplicates: records.length - inserted.length },
  });
  return inserted;
}

export async function checkDuplicateEnrolmentBatch(period: string, providerNames: string[]): Promise<{ isDuplicate: boolean; batches: ImportBatch[] }> {
  const normalizedProviders = new Set(providerNames.map(name => name.trim().toLowerCase()).filter(Boolean));
  if (useMockData) {
    const batches = mockImportBatches.filter(batch => batch.dataType === 'enrolment' && batch.periodCovered === period && (() => {
      const existingProviders = Array.isArray(batch.metadata?.providerNames) ? batch.metadata.providerNames as string[] : [];
      return existingProviders.length === 0 || existingProviders.some(name => normalizedProviders.has(name.trim().toLowerCase()));
    })());
    return { isDuplicate: batches.length > 0, batches };
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('import_batches').select('*').eq('data_type', 'enrolment').eq('period_covered', period).order('uploaded_at', { ascending: false });
  if (error) throw formatSupabaseError(error);
  const batches = (data as ImportBatchesRow[]).map(row => ({
    id: row.id,
    fileName: row.file_name,
    dataType: row.data_type as ImportBatch['dataType'],
    reportingYear: row.reporting_year || undefined,
    reportingMonth: row.reporting_month || undefined,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    warningRows: row.warning_rows,
    errorRows: row.error_rows,
    duplicateRows: row.duplicate_rows,
    unmatchedProviders: row.unmatched_providers,
    totalAmount: row.total_amount || undefined,
    status: row.status as ImportBatch['status'],
    periodCovered: row.period_covered || undefined,
    metadata: row.metadata as Record<string, unknown>,
  })).filter(batch => {
    const existingProviders = Array.isArray(batch.metadata?.providerNames) ? batch.metadata.providerNames as string[] : [];
    return existingProviders.length === 0 || existingProviders.some(name => normalizedProviders.has(name.trim().toLowerCase()));
  });
  return { isDuplicate: batches.length > 0, batches };
}

export async function createEnrolmentImportBatch(
  batch: Omit<ImportBatch, 'id' | 'uploadedAt'>,
  records: EnrolleeRecord[],
  actor?: { id: string; email: string },
): Promise<ImportBatch> {
  if (useMockData) {
    const batchId = `batch-enrolment-${Date.now()}`;
    const recordsWithBatch = records.map(record => ({ ...record, importBatchId: batchId }));
    const inserted = await insertEnrolleesMock(recordsWithBatch);
    const createdBatch: ImportBatch = {
      ...batch,
      id: batchId,
      uploadedAt: new Date().toISOString(),
      importedRows: inserted.length,
      duplicateRows: records.length - inserted.length,
      status: inserted.length === records.length ? 'imported' : 'partially-imported',
    };
    mockImportBatches.unshift(createdBatch);
    await logAction({
      userId: actor?.id,
      userEmail: actor?.email,
      action: 'ENROLMENT_IMPORT_COMMITTED',
      entity: 'import_batches',
      entityId: batchId,
      metadata: batch.metadata,
    });
    return createdBatch;
  }

  const supabase = getApiClient();
  const batchRow: Partial<ImportBatchesRow> = {
    file_name: batch.fileName,
    data_type: 'enrolment',
    reporting_year: batch.reportingYear,
    reporting_month: batch.reportingMonth,
    uploaded_by: actor?.email || batch.uploadedBy,
    total_rows: batch.totalRows,
    imported_rows: 0,
    warning_rows: batch.warningRows,
    error_rows: batch.errorRows,
    duplicate_rows: batch.duplicateRows,
    unmatched_providers: batch.unmatchedProviders,
    status: 'processing',
    period_covered: batch.periodCovered,
    metadata: batch.metadata || {},
  };

  const { data: createdBatch, error: batchError } = await supabase
    .from('import_batches')
    .insert(batchRow)
    .select('*')
    .single();
  if (batchError) throw formatSupabaseError(batchError);

  const recordsWithBatch = records.map(record => ({ ...record, importBatchId: createdBatch.id }));
  let inserted: EnrolleeRecord[] = [];
  try {
    inserted = await insertEnrolleeRecords(recordsWithBatch, actor, createdBatch.id);
    const finalStatus = inserted.length === records.length ? 'imported' : 'partially-imported';
    await supabase.from('import_batches').update({
      imported_rows: inserted.length,
      duplicate_rows: records.length - inserted.length,
      status: finalStatus,
    }).eq('id', createdBatch.id);
  } catch (error) {
    await supabase.from('import_batches').update({ status: 'failed' }).eq('id', createdBatch.id);
    await logAction({
      userId: actor?.id,
      userEmail: actor?.email,
      action: 'ENROLMENT_IMPORT_FAILED',
      entity: 'import_batches',
      entityId: createdBatch.id,
      metadata: { fileName: batch.fileName, message: error instanceof Error ? error.message : 'Unknown error' },
    });
    throw error;
  }

  await logAction({
    userId: actor?.id,
    userEmail: actor?.email,
    action: 'ENROLMENT_IMPORT_COMMITTED',
    entity: 'import_batches',
    entityId: createdBatch.id,
    metadata: { fileName: batch.fileName, submitted: records.length, inserted: inserted.length },
  });

  return {
    ...batch,
    id: createdBatch.id,
    uploadedAt: createdBatch.uploaded_at,
    importedRows: inserted.length,
    duplicateRows: records.length - inserted.length,
    status: inserted.length === records.length ? 'imported' : 'partially-imported',
  };
}

export async function fetchEnrolmentAnalytics(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  const records = await fetchEnrollees(filters);
  const totalEnrollees = records.length;
  const formalCount = records.filter(record => record.sector === 'formal').length;
  const informalCount = records.filter(record => record.sector === 'informal').length;
  const principalCount = records.filter(record => record.category === 'principal').length;
  const dependantCount = records.filter(record => record.category === 'dependant').length;
  const maleCount = records.filter(record => record.gender === 'male').length;
  const femaleCount = records.filter(record => record.gender === 'female').length;
  const percentage = (count: number) => totalEnrollees > 0 ? Number(((count / totalEnrollees) * 100).toFixed(1)) : 0;

  return {
    totalEnrollees,
    formalCount,
    informalCount,
    principalCount,
    dependantCount,
    maleCount,
    femaleCount,
    providerCount: new Set(records.map(record => record.providerId || record.providerName)).size,
    lgaCount: new Set(records.map(record => record.lga)).size,
    senatorialDistrictCount: new Set(records.map(record => record.senatorialDistrict).filter(Boolean)).size,
    formalPercentage: percentage(formalCount),
    informalPercentage: percentage(informalCount),
    principalPercentage: percentage(principalCount),
    dependantPercentage: percentage(dependantCount),
    bySector: groupBy(records, record => record.sector),
    byCategory: groupBy(records, record => record.category),
    byGender: groupBy(records, record => record.gender),
    byState: groupBy(records, record => record.state),
    byLga: groupBy(records, record => record.lga),
    bySenatorialDistrict: groupBy(records, record => record.senatorialDistrict || 'Unknown'),
    byFacility: groupBy(records, record => record.providerName),
    monthlyTrend: groupBy(records, record => record.period).sort((a, b) => a.name.localeCompare(b.name)),
    financialExpenditure: 0,
    financialRecordCount: 0,
    pepm: 0,
    pepmTrend: [],
  };
}

function financialAmount(record: FinancialRecord): number {
  return record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.amount ?? 0;
}

function activeFilter(value?: string): string | undefined {
  return value && value !== 'all' ? value : undefined;
}

export async function fetchEnrolmentAnalyticsWithFinance(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  const [analytics, financialRecords] = await Promise.all([
    fetchEnrolmentAnalytics(filters),
    fetchFinancialRecords({
      period: activeFilter(filters.period),
      providerId: activeFilter(filters.providerId),
      state: activeFilter(filters.state),
      lga: activeFilter(filters.lga),
    }),
  ]);

  const expenditure = financialRecords.reduce((total, record) => total + financialAmount(record), 0);
  const enrolleeCount = analytics.totalEnrollees;
  const expenditureByPeriod = financialRecords.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.period] = (accumulator[record.period] || 0) + financialAmount(record);
    return accumulator;
  }, {});
  const enrolleesByPeriod = analytics.monthlyTrend.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.name] = item.value;
    return accumulator;
  }, {});
  const pepmTrend = Array.from(new Set([...Object.keys(expenditureByPeriod), ...Object.keys(enrolleesByPeriod)]))
    .sort()
    .map(name => ({
      name,
      value: enrolleesByPeriod[name] ? Number((expenditureByPeriod[name] / enrolleesByPeriod[name]).toFixed(2)) : 0,
    }));

  return {
    ...analytics,
    financialExpenditure: expenditure,
    financialRecordCount: financialRecords.length,
    pepm: enrolleeCount > 0 ? Number((expenditure / enrolleeCount).toFixed(2)) : 0,
    pepmTrend,
  };
}
