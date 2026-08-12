import { useMockData } from '../common';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { importWorkflowUnavailable, piiAccessNotApproved } from '../../lib/security/secureContracts';
import { ImportBatch, FinancialRecord } from '../../types/financial-data';
import { mockImportBatches } from '../../mocks/financialDataMocks';
import { fetchFinancialRecords } from '../financial-data/financialDataRepository';
import {
  EnrolleeRecord,
  EnrolmentAnalytics,
  EnrolmentCategory,
  EnrolmentFilters,
  EnrolmentSector,
} from '../../types/enrolment/enrolmentTypes';
import { getEnrolleeByIdMock, getEnrolleesMock, insertEnrolleesMock } from '../../mocks/enrolmentMocks';

function matchesFilter(record: EnrolleeRecord, filters: EnrolmentFilters): boolean {
  const query = filters.search?.trim().toLowerCase() || '';
  const searchable = [record.policyNumber, record.firstName, record.lastName, record.providerName, record.providerCode, record.lga, record.state, record.senatorialDistrict]
    .filter(Boolean).join(' ').toLowerCase();
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
  return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function amount(record: FinancialRecord): number {
  return record.amountPaid ?? record.netAmountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.amount ?? 0;
}

function activeFilter(value?: string): string | undefined {
  return value && value !== 'all' ? value : undefined;
}

function analyticsFromRecords(records: EnrolleeRecord[]): EnrolmentAnalytics {
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

function populationArgs(filters: EnrolmentFilters): Record<string, unknown> {
  return {
    p_period: activeFilter(filters.period),
    p_year: filters.year ?? null,
    p_month: filters.month ?? null,
    p_sector: activeFilter(filters.sector),
    p_category: activeFilter(filters.category),
    p_state: activeFilter(filters.state),
    p_lga: activeFilter(filters.lga),
    p_provider_id: activeFilter(filters.providerId),
  };
}

export async function fetchEnrollees(filters: EnrolmentFilters = {}): Promise<EnrolleeRecord[]> {
  if (useMockData) return (await getEnrolleesMock()).filter(record => matchesFilter(record, filters));
  throw piiAccessNotApproved('raw enrollee records');
}

export async function fetchEnrolleeById(id: string): Promise<EnrolleeRecord> {
  if (useMockData) return getEnrolleeByIdMock(id);
  throw piiAccessNotApproved('enrollee detail');
}

export async function insertEnrollee(record: EnrolleeRecord, actor?: { id: string; email: string }): Promise<EnrolleeRecord> {
  const inserted = await insertEnrolleeRecords([record], actor);
  if (!inserted.length) throw new Error('Enrollee record already exists for this policy and period.');
  return inserted[0];
}

export async function insertEnrolleeRecords(records: EnrolleeRecord[], _actor?: { id: string; email: string }, _importBatchId?: string): Promise<EnrolleeRecord[]> {
  if (!records.length) return [];
  if (useMockData) return insertEnrolleesMock(records);
  throw importWorkflowUnavailable();
}

export async function checkDuplicateEnrolmentBatch(period: string, providerNames: string[]): Promise<{ isDuplicate: boolean; batches: ImportBatch[] }> {
  if (!useMockData) throw importWorkflowUnavailable();
  const normalized = new Set(providerNames.map(name => name.trim().toLowerCase()).filter(Boolean));
  const batches = mockImportBatches.filter(batch => batch.dataType === 'enrolment' && batch.periodCovered === period && (() => {
    const providers = Array.isArray(batch.metadata?.providerNames) ? batch.metadata.providerNames as string[] : [];
    return providers.length === 0 || providers.some(name => normalized.has(name.trim().toLowerCase()));
  }));
  return { isDuplicate: batches.length > 0, batches };
}

export async function createEnrolmentImportBatch(
  batch: Omit<ImportBatch, 'id' | 'uploadedAt'>,
  records: EnrolleeRecord[],
  actor?: { id: string; email: string },
): Promise<ImportBatch> {
  if (!useMockData) throw importWorkflowUnavailable();
  const batchId = `mock-enrolment-${Date.now()}`;
  const inserted = await insertEnrolleeRecords(records.map(record => ({ ...record, importBatchId: batchId })), actor, batchId);
  const created: ImportBatch = {
    ...batch,
    id: batchId,
    uploadedAt: new Date().toISOString(),
    importedRows: inserted.length,
    duplicateRows: records.length - inserted.length,
    status: inserted.length === records.length ? 'imported' : 'partially-imported',
  };
  mockImportBatches.unshift(created);
  return created;
}

export async function fetchEnrolmentAnalytics(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  if (!useMockData) return invokeSecureRpc<EnrolmentAnalytics>('nmis_population_analytics', populationArgs(filters));
  return analyticsFromRecords(await fetchEnrollees(filters));
}

export async function fetchEnrolmentAnalyticsWithFinance(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  if (!useMockData) return invokeSecureRpc<EnrolmentAnalytics>('nmis_population_analytics', populationArgs(filters));

  const [analytics, financialRecords] = await Promise.all([
    fetchEnrolmentAnalytics(filters),
    fetchFinancialRecords({ period: activeFilter(filters.period), providerId: activeFilter(filters.providerId), state: activeFilter(filters.state), lga: activeFilter(filters.lga) }),
  ]);
  const expenditure = financialRecords.reduce((total, record) => total + amount(record), 0);
  const expenditureByPeriod = financialRecords.reduce<Record<string, number>>((accumulator, record) => {
    accumulator[record.period] = (accumulator[record.period] || 0) + amount(record);
    return accumulator;
  }, {});
  const pepmTrend = analytics.monthlyTrend.map(item => ({ name: item.name, value: item.value ? Number(((expenditureByPeriod[item.name] || 0) / item.value).toFixed(2)) : 0 }));
  return { ...analytics, financialExpenditure: expenditure, financialRecordCount: financialRecords.length, pepm: analytics.totalEnrollees ? Number((expenditure / analytics.totalEnrollees).toFixed(2)) : 0, pepmTrend };
}

export async function fetchProviderPopulationSummary(providerId: string, filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  if (useMockData) return fetchEnrolmentAnalytics({ ...filters, providerId });
  return invokeSecureRpc<EnrolmentAnalytics>('nmis_provider_population_summary', { p_provider_id: providerId, ...populationArgs(filters) });
}

export const enrolmentCategoryValues: EnrolmentCategory[] = ['principal', 'dependant'];
export const enrolmentSectorValues: EnrolmentSector[] = ['formal', 'informal'];
