import { useMockData } from '../common';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { importWorkflowUnavailable, isSecureContractError } from '../../lib/security/secureContracts';
import { ImportBatch, FinancialRecord } from '../../types/financial-data';
import { mockImportBatches } from '../../mocks/financialDataMocks';
import { fetchFinancialRecords } from '../financial-data/financialDataRepository';
import {
  EnrolleeRecord,
  EnrolmentAnalytics,
  EnrolmentCategory,
  EnrolmentFilterOptions,
  EnrolmentFilters,
  EnrolmentSector,
} from '../../types/enrolment/enrolmentTypes';
import { getEnrolleeByIdMock, getEnrolleesMock, insertEnrolleesMock } from '../../mocks/enrolmentMocks';
import { Dashboard2Intelligence } from '../../types/dashboard/dashboardIntelligenceTypes';

type SecureEnrolleeRow = {
  id: string;
  policy_number: string;
  category: string;
  sector: string;
  first_name: string;
  last_name: string;
  gender: string;
  age?: number | null;
  phone_number?: string | null;
  provider_id?: string | null;
  provider_code?: string | null;
  provider_name: string;
  facility_type?: string | null;
  ownership?: string | null;
  lga: string;
  state: string;
  senatorial_district?: string | null;
  reporting_year: number;
  reporting_month: number;
  period: string;
  source_file?: string | null;
  import_batch_id?: string | null;
  source_row?: number | null;
  record_status: string;
  fingerprint: string;
  created_at: string;
  updated_at: string;
  total_count?: number | null;
};

function mapSecureEnrolleeRow(row: SecureEnrolleeRow): EnrolleeRecord {
  return {
    id: row.id,
    policyNumber: row.policy_number,
    category: row.category as EnrolleeRecord['category'],
    sector: row.sector as EnrolleeRecord['sector'],
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender as EnrolleeRecord['gender'],
    age: row.age !== null && row.age !== undefined ? Number(row.age) : undefined,
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
    fingerprint: row.fingerprint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalCount: row.total_count ? Number(row.total_count) : undefined,
  };
}

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
    capitationRate: 750,
    capitationExpenditure: totalEnrollees * 750,
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

export async function fetchEnrolmentFilterOptions(): Promise<EnrolmentFilterOptions> {
  if (useMockData) {
    return { periods: [], states: [], lgas: [], districts: [], providers: [] };
  }

  const raw = await invokeSecureRpc<Partial<EnrolmentFilterOptions>>('nmis_get_enrolment_filter_options');
  return {
    periods: Array.isArray(raw.periods)
      ? raw.periods.filter((value): value is string => typeof value === 'string').sort((a, b) => b.localeCompare(a))
      : [],
    states: Array.isArray(raw.states) ? raw.states.filter((value): value is string => typeof value === 'string') : [],
    lgas: Array.isArray(raw.lgas) ? raw.lgas.filter((value): value is string => typeof value === 'string') : [],
    districts: Array.isArray(raw.districts) ? raw.districts.filter((value): value is string => typeof value === 'string') : [],
    providers: Array.isArray(raw.providers)
      ? raw.providers.filter((value): value is { id: string; name: string } => Boolean(value && typeof value.id === 'string' && typeof value.name === 'string'))
      : [],
  };
}

export async function fetchEnrollees(filters: EnrolmentFilters = {}): Promise<EnrolleeRecord[]> {
  if (useMockData) return (await getEnrolleesMock()).filter(record => matchesFilter(record, filters));

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50000;
  const offset = (page - 1) * pageSize;

  const rows = await invokeSecureRpc<SecureEnrolleeRow[]>('nmis_list_enrollee_register', {
    p_search: filters.search || null,
    p_sector: activeFilter(filters.sector),
    p_category: activeFilter(filters.category),
    p_gender: activeFilter(filters.gender),
    p_state: activeFilter(filters.state),
    p_lga: activeFilter(filters.lga),
    p_senatorial_district: activeFilter(filters.senatorialDistrict),
    p_provider_id: activeFilter(filters.providerId),
    p_period: activeFilter(filters.period),
    p_year: filters.year ?? null,
    p_month: filters.month ?? null,
    p_offset: offset,
    p_page_size: pageSize,
    p_sort: filters.sortField === 'providerName' ? 'provider_name' :
            filters.sortField === 'policyNumber' ? 'policy_number' :
            filters.sortField === 'beneficiary' ? 'beneficiary' :
            filters.sortField === 'district' ? 'senatorial_district' :
            filters.sortField === 'gender' ? 'gender' :
            filters.sortField === 'category' ? 'category' :
            filters.sortField === 'sector' ? 'sector' :
            filters.sortField || 'policy_number',
    p_sort_direction: filters.sortDirection || 'asc',
  });
  return rows.map(mapSecureEnrolleeRow);
}

export async function fetchEnrolleeById(id: string): Promise<EnrolleeRecord | undefined> {
  if (useMockData) return getEnrolleeByIdMock(id);
  const rows = await invokeSecureRpc<SecureEnrolleeRow[]>('nmis_get_enrollee_detail', { p_enrollee_id: id });
  return rows[0] ? mapSecureEnrolleeRow(rows[0]) : undefined;
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
  if (!useMockData) {
    try {
      const result = await invokeSecureRpc<ImportBatch | null>('nmis_check_duplicate_batch', {
        p_period: period,
        p_data_type: 'enrolment',
      });
      return { isDuplicate: !!result, batches: result ? [result] : [] };
    } catch (error) {
      throw error;
    }
  }
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
  _actor?: { id: string; email: string },
): Promise<ImportBatch> {
  if (!useMockData) {
    // For live mode, we use chunked import to avoid statement timeouts with large workbooks
    const batchId = await invokeSecureRpc<string>('nmis_init_import_batch', {
      p_file_name: batch.fileName,
      p_data_type: 'enrolment',
      p_period_covered: batch.periodCovered || null,
      p_total_rows: batch.totalRows,
      p_metadata: batch.metadata || {},
    });

    // Chunk records (500 per chunk is a safe balance for Supabase timeouts)
    const chunkSize = 500;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await invokeSecureRpc('nmis_append_import_records', {
        p_batch_id: batchId,
        p_data_type: 'enrolment',
        p_records: chunk,
      });
    }

    // Finalize the batch
    const result = await invokeSecureRpc<ImportBatch>('nmis_finalize_import_batch', {
      p_batch_id: batchId,
    });
    return result;
  }
  const batchId = `mock-enrolment-${Date.now()}`;
  const inserted = await insertEnrolleeRecords(records.map(record => ({ ...record, importBatchId: batchId })), _actor, batchId);
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


function analyticsFromDashboardIntelligence(intelligence: Dashboard2Intelligence): EnrolmentAnalytics {
  const population = intelligence.population;
  const totalEnrollees = Number(population.total || 0);
  const formalCount = Number(population.formal || 0);
  const informalCount = Number(population.informal || 0);
  const principalCount = Number(population.principal || 0);
  const dependantCount = Number(population.dependant || 0);
  const percentage = (count: number) => totalEnrollees > 0 ? Number(((count / totalEnrollees) * 100).toFixed(1)) : 0;

  return {
    totalEnrollees,
    formalCount,
    informalCount,
    principalCount,
    dependantCount,
    maleCount: 0,
    femaleCount: 0,
    providerCount: Number(intelligence.provider.total || 0),
    lgaCount: population.byLga?.length || 0,
    senatorialDistrictCount: 0,
    formalPercentage: percentage(formalCount),
    informalPercentage: percentage(informalCount),
    principalPercentage: percentage(principalCount),
    dependantPercentage: percentage(dependantCount),
    bySector: population.bySector || [],
    byCategory: population.byCategory || [],
    byGender: [],
    byState: totalEnrollees > 0 ? [{ name: 'Ondo', value: totalEnrollees }] : [],
    byLga: population.byLga || [],
    bySenatorialDistrict: [],
    byFacility: population.topFacilities || [],
    monthlyTrend: population.monthlyTrend || [],
    financialExpenditure: Number(intelligence.financial.totalExpenditure || 0),
    financialRecordCount: Number(intelligence.matchedFinancialRecords || 0),
    capitationRate: Number(intelligence.population.capitationRate || 750),
    capitationExpenditure: Number(intelligence.population.capitationExpenditure || 0),
    pepm: Number(intelligence.efficiency.networkPepm || 0),
    pepmTrend: intelligence.efficiency.trend || [],
  };
}

async function fetchLiveEnrolmentAnalytics(filters: EnrolmentFilters): Promise<EnrolmentAnalytics> {
  try {
    const rows = await invokeSecureRpc<Array<{
      total_count: number;
      formal_count: number;
      informal_count: number;
      principal_count: number;
      dependant_count: number;
      male_count: number;
      female_count: number;
      provider_count: number;
      lga_count: number;
      senatorial_district_count: number;
      capitation_rate: number;
      capitation_expenditure: number;
      financial_expenditure: number;
      financial_record_count: number;
      pepm: number;
      monthly_trend: any[];
      pepm_trend: any[];
      by_sector: any[];
      by_category: any[];
      by_gender: any[];
      by_state: any[];
      by_lga: any[];
      by_senatorial_district: any[];
      top_facilities: any[];
    }>>('nmis_get_enrolment_analytics', populationArgs(filters));

    if (!rows || rows.length === 0) {
      throw new Error('No analytics data returned');
    }

    const row = rows[0];
    return {
      totalEnrollees: Number(row.total_count || 0),
      formalCount: Number(row.formal_count || 0),
      informalCount: Number(row.informal_count || 0),
      principalCount: Number(row.principal_count || 0),
      dependantCount: Number(row.dependant_count || 0),
      maleCount: Number(row.male_count || 0),
      femaleCount: Number(row.female_count || 0),
      providerCount: Number(row.provider_count || 0),
      lgaCount: Number(row.lga_count || 0),
      senatorialDistrictCount: Number(row.senatorial_district_count || 0),
      capitationRate: Number(row.capitation_rate || 750),
      capitationExpenditure: Number(row.capitation_expenditure || 0),
      financialExpenditure: Number(row.financial_expenditure || 0),
      financialRecordCount: Number(row.financial_record_count || 0),
      pepm: Number(row.pepm || 0),
      monthlyTrend: row.monthly_trend || [],
      pepmTrend: row.pepm_trend || [],
      bySector: row.by_sector || [],
      byCategory: row.by_category || [],
      byGender: row.by_gender || [],
      byState: row.by_state || [],
      byLga: row.by_lga || [],
      bySenatorialDistrict: row.by_senatorial_district || [],
      byFacility: row.top_facilities || [],
      formalPercentage: row.total_count > 0 ? Number(((row.formal_count / row.total_count) * 100).toFixed(1)) : 0,
      informalPercentage: row.total_count > 0 ? Number(((row.informal_count / row.total_count) * 100).toFixed(1)) : 0,
      principalPercentage: row.total_count > 0 ? Number(((row.principal_count / row.total_count) * 100).toFixed(1)) : 0,
      dependantPercentage: row.total_count > 0 ? Number(((row.dependant_count / row.total_count) * 100).toFixed(1)) : 0,
    };
  } catch (error) {
    if (isSecureContractError(error)) throw error;
    return analyticsFromRecords([]);
  }
}

export async function fetchEnrolmentAnalytics(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  if (useMockData) return analyticsFromRecords(await fetchEnrollees(filters));
  return fetchLiveEnrolmentAnalytics(filters);
}

export async function fetchEnrolmentAnalyticsWithFinance(filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  return fetchEnrolmentAnalytics(filters);
}

export async function fetchProviderPopulationSummary(providerId: string, filters: EnrolmentFilters = {}): Promise<EnrolmentAnalytics> {
  if (!providerId) return analyticsFromRecords([]);
  if (useMockData) return analyticsFromRecords(await fetchEnrollees({ ...filters, providerId }));

  const raw = await invokeSecureRpc<Partial<EnrolmentAnalytics>>('nmis_population_analytics', {
    p_year: filters.year ?? null,
    p_month: filters.month ?? null,
    p_period: activeFilter(filters.period),
    p_sector: activeFilter(filters.sector),
    p_category: activeFilter(filters.category),
    p_state: activeFilter(filters.state),
    p_lga: activeFilter(filters.lga),
    p_provider_id: providerId,
  });

  const totalEnrollees = Number(raw.totalEnrollees || 0);
  const formalCount = Number(raw.formalCount || 0);
  const informalCount = Number(raw.informalCount || 0);
  const principalCount = Number(raw.principalCount || 0);
  const dependantCount = Number(raw.dependantCount || 0);
  const percentage = (count: number) => totalEnrollees > 0 ? Number(((count / totalEnrollees) * 100).toFixed(1)) : 0;

  return {
    totalEnrollees,
    formalCount,
    informalCount,
    principalCount,
    dependantCount,
    maleCount: Number(raw.maleCount || 0),
    femaleCount: Number(raw.femaleCount || 0),
    providerCount: Number(raw.providerCount || 0),
    lgaCount: Number(raw.lgaCount || 0),
    senatorialDistrictCount: Number(raw.senatorialDistrictCount || 0),
    formalPercentage: Number(raw.formalPercentage ?? percentage(formalCount)),
    informalPercentage: Number(raw.informalPercentage ?? percentage(informalCount)),
    principalPercentage: Number(raw.principalPercentage ?? percentage(principalCount)),
    dependantPercentage: Number(raw.dependantPercentage ?? percentage(dependantCount)),
    bySector: raw.bySector || [],
    byCategory: raw.byCategory || [],
    byGender: raw.byGender || [],
    byState: raw.byState || [],
    byLga: raw.byLga || [],
    bySenatorialDistrict: raw.bySenatorialDistrict || [],
    byFacility: raw.byFacility || [],
    monthlyTrend: raw.monthlyTrend || [],
    financialExpenditure: Number(raw.financialExpenditure || 0),
    financialRecordCount: Number(raw.financialRecordCount || 0),
    capitationRate: Number(raw.capitationRate || 750),
    capitationExpenditure: Number(raw.capitationExpenditure || 0),
    pepm: Number(raw.pepm || 0),
    pepmTrend: raw.pepmTrend || [],
  };
}
