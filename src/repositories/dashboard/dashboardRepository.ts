import { useMockData } from '../common';
import { invokeSecureRpc } from '../contracts/secureRpcRepository';
import { SecureContractError } from '../../lib/security/secureContracts';
import * as dashboardMocks from '../../mocks/dashboardMocks';
import { getProviderDirectory } from '../providers/providersRepository';
import { ProviderLifecycleStatus } from '../../constants/providerNetwork';
import { EnrolleeRecord, EnrolmentAnalytics, EnrolmentFilters } from '../../types/enrolment/enrolmentTypes';
import { FinancialRecord, ImportBatch } from '../../types/financial-data';
import { fetchEnrollees, fetchEnrolmentAnalyticsWithFinance } from '../enrolment/enrolmentRepository';
import { fetchFinancialRecords, fetchImportBatches } from '../financial-data/financialDataRepository';
import { fetchAuditLogs, AuditLogEntry } from '../audit/auditRepository';
import { Dashboard2Intelligence, DashboardAttentionItem, DashboardActivityItem, DashboardBreakdown, DashboardFilters } from '../../types/dashboard/dashboardIntelligenceTypes';
import {
  AiInsight,
  ActivityItem,
  CompletionPoint,
  DashboardTask,
  ExecutiveSummary,
  GrowthPoint,
  KpiMetric,
  NotificationSummary,
  PerformanceGauge,
  PerformancePoint,
  TrendPoint,
  CoverageLocation,
  UpcomingActivity,
  DistributionPoint,
} from '../../types/dashboard/dashboardTypes';

export async function fetchExecutiveSummary(): Promise<ExecutiveSummary> {
  const summary = await dashboardMocks.getExecutiveSummary();
  const providers = await getProviderDirectory({ pageSize: -1 });
  const activeCount = (providers as any).activeCount ?? providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
  
  return {
    ...summary,
    todayFocus: `${activeCount} providers are currently active in the network. ${summary.todayFocus}`,
  };
}

function formatNaira(value: number): string {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  return `₦${Math.round(value).toLocaleString('en-NG')}`;
}

export async function fetchKpiMetrics(): Promise<KpiMetric[]> {
  if (!useMockData) {
    const intelligence = await fetchDashboardIntelligence();
    let capitationRate = 750;
    try {
      const settings = await invokeSecureRpc<{ rate?: number }>('nmis_get_capitation_settings');
      capitationRate = Number(settings.rate || 750);
    } catch {
      // Keep the approved default if the settings read is temporarily unavailable.
    }
    return [
      { id: 'total-providers', label: 'Total providers', value: intelligence.provider.total.toLocaleString(), delta: 'Secure aggregate', trend: 'steady', color: 'indigo', icon: 'Users', subtitle: 'Provider network' },
      { id: 'active-providers', label: 'Active providers', value: intelligence.provider.active.toLocaleString(), delta: 'Secure aggregate', trend: 'steady', color: 'emerald', icon: 'ShieldCheck', subtitle: 'Active provider network' },
      { id: 'total-enrollees', label: 'Total enrollees', value: intelligence.population.total.toLocaleString(), delta: 'Secure aggregate', trend: 'steady', color: 'sky', icon: 'Users', subtitle: 'Population aggregate' },
      { id: 'monthly-capitation', label: 'Monthly capitation due', value: formatNaira(intelligence.population.total * capitationRate), delta: `₦${capitationRate.toLocaleString('en-NG')} per enrollee`, trend: 'steady', color: 'indigo', icon: 'CurrencyNaira', subtitle: 'Current configured capitation' },
      { id: 'network-expenditure', label: 'Network expenditure', value: formatNaira(intelligence.financial.totalExpenditure), delta: 'Secure aggregate', trend: 'steady', color: 'emerald', icon: 'CurrencyNaira', subtitle: 'Financial aggregate' },
      { id: 'pepm', label: 'Expenditure per enrollee', value: formatNaira(intelligence.efficiency.networkPepm), delta: 'Secure aggregate', trend: 'steady', color: 'rose', icon: 'CurrencyNaira', subtitle: 'PEPM analytical view' },
    ];
  }

  const [providers, financialRecords, population] = await Promise.all([
    getProviderDirectory({ pageSize: -1 }),
    fetchFinancialRecords(),
    fetchEnrolmentAnalyticsWithFinance(),
  ]);

  const totalProviders = (providers as any).totalCount ?? providers.length;
  const activeProviders = (providers as any).activeCount ?? providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
  const totalExpenditure = financialRecords.reduce((sum, r) => sum + (r.netAmountPaid ?? r.amountPaid ?? r.amount ?? r.netAmount ?? 0), 0);
  const baseMetrics = await dashboardMocks.getKpiMetrics();
  const baseById = new Map(baseMetrics.map(metric => [metric.id, metric]));
  const totalProvidersMetric = baseById.get('total-providers');
  const activeProvidersMetric = baseById.get('active-providers');

  return [
    {
      ...(totalProvidersMetric || { id: 'total-providers', delta: 'Live', trend: 'steady' as const, color: 'indigo' as const, icon: 'Users', subtitle: 'Authoritative Provider Directory' }),
      label: 'Total providers',
      value: totalProviders.toLocaleString(),
    },
    {
      ...(activeProvidersMetric || { id: 'active-providers', delta: 'Live', trend: 'steady' as const, color: 'emerald' as const, icon: 'ShieldCheck', subtitle: 'Active in the Provider Directory' }),
      label: 'Active providers',
      value: activeProviders.toLocaleString(),
    },
    {
      id: 'total-enrollees',
      label: 'Total enrollees',
      value: population.totalEnrollees.toLocaleString(),
      delta: `${population.providerCount} facilities`,
      trend: 'steady',
      color: 'sky',
      icon: 'Users',
      subtitle: 'Normalized monthly population',
    },
    {
      id: 'formal-enrollees',
      label: 'Formal enrollees',
      value: population.formalCount.toLocaleString(),
      delta: `${population.formalPercentage}% of population`,
      trend: 'steady',
      color: 'indigo',
      icon: 'ShieldCheck',
      subtitle: 'Policy numbers containing /C/',
    },
    {
      id: 'informal-enrollees',
      label: 'Informal enrollees',
      value: population.informalCount.toLocaleString(),
      delta: `${population.informalPercentage}% of population`,
      trend: 'steady',
      color: 'amber',
      icon: 'Users',
      subtitle: 'Policy numbers containing /D/',
    },
    {
      id: 'monthly-capitation',
      label: 'Monthly capitation due',
      value: formatNaira(population.capitationExpenditure),
      delta: `₦${population.capitationRate.toLocaleString('en-NG')} per enrollee`,
      trend: 'steady',
      color: 'indigo',
      icon: 'CurrencyNaira',
      subtitle: 'Current configured capitation',
    },
    {
      id: 'network-expenditure',
      label: 'Network expenditure',
      value: formatNaira(totalExpenditure),
      delta: `${financialRecords.length} financial records`,
      trend: 'steady',
      color: 'emerald',
      icon: 'CurrencyNaira',
      subtitle: 'Claims, capitation, and FFS',
    },
    {
      id: 'pepm',
      label: 'Expenditure per enrollee',
      value: formatNaira(population.pepm),
      delta: `${population.financialRecordCount} linked records`,
      trend: 'steady',
      color: 'rose',
      icon: 'CurrencyNaira',
      subtitle: 'PEPM analytical view',
    },
  ];
}

export async function fetchPopulationSnapshot(): Promise<EnrolmentAnalytics> {
  return fetchEnrolmentAnalyticsWithFinance();
}

export async function fetchProviderDistribution(): Promise<DistributionPoint[]> {
  if (!useMockData) return (await fetchDashboardIntelligence()).provider.byLga.map(item => ({ category: item.name, value: item.value }));
  const providers = await getProviderDirectory({ pageSize: -1 });
  const distribution = providers.reduce((acc, p) => {
    const region = p.state || 'Other';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(distribution).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

export async function fetchProviderCategories(): Promise<DistributionPoint[]> {
  if (!useMockData) return (await fetchDashboardIntelligence()).provider.byFacilityType.map(item => ({ category: item.name, value: item.value }));
  const providers = await getProviderDirectory({ pageSize: -1 });
  const categories = providers.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categories).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

export async function fetchMonthlyGrowth(): Promise<GrowthPoint[]> {
  // Mock growth for now as it requires historical data
  return dashboardMocks.getMonthlyGrowth();
}

export async function fetchInspectionCompletion(): Promise<CompletionPoint[]> {
  return dashboardMocks.getInspectionCompletion();
}

export async function fetchPerformanceRating(): Promise<PerformancePoint[]> {
  return dashboardMocks.getPerformanceRating();
}

export async function fetchCapitationTrend(): Promise<TrendPoint[]> {
  return dashboardMocks.getCapitationTrend();
}

export async function fetchUtilizationTrend(): Promise<TrendPoint[]> {
  return dashboardMocks.getUtilizationTrend();
}

export async function fetchCoverageLocations(): Promise<CoverageLocation[]> {
  return dashboardMocks.getCoverageLocations();
}

export async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  return dashboardMocks.getDashboardTasks();
}

export async function fetchDashboardActivities(): Promise<ActivityItem[]> {
  return dashboardMocks.getDashboardActivities();
}

export async function fetchUpcomingActivities(): Promise<UpcomingActivity[]> {
  return dashboardMocks.getUpcomingActivities();
}

export async function fetchDashboardNotifications(): Promise<NotificationSummary> {
  return dashboardMocks.getDashboardNotifications();
}

export async function fetchAiInsights(): Promise<AiInsight[]> {
  return dashboardMocks.getAiInsights();
}

export async function fetchPerformanceGauges(): Promise<PerformanceGauge[]> {
  return dashboardMocks.getPerformanceGauges();
}


function normalizeValue(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized && normalized !== 'all' ? normalized : undefined;
}

function recordProviderKeys(record: { providerId?: string; providerCode?: string; providerName: string }): string[] {
  return [record.providerId, record.providerCode, record.providerName]
    .map(value => normalizeValue(value))
    .filter((value): value is string => Boolean(value));
}

function providerMatchesDirectory(record: { providerId?: string; providerCode?: string; providerName: string }, allowedKeys: Set<string>): boolean {
  return recordProviderKeys(record).some(key => allowedKeys.has(key));
}

function amountForDashboardRecord(record: FinancialRecord): number {
  return record.netAmountPaid ?? record.amountPaid ?? record.amountApproved ?? record.amountClaimed ?? record.amountSubmitted ?? record.netAmount ?? record.amount ?? 0;
}

function groupDashboardValues<T>(records: T[], key: (record: T) => string | undefined, value: (record: T) => number = () => 1): DashboardBreakdown[] {
  const grouped = records.reduce<Record<string, number>>((accumulator, record) => {
    const name = key(record)?.trim() || 'Unknown';
    accumulator[name] = (accumulator[name] || 0) + value(record);
    return accumulator;
  }, {});
  return Object.entries(grouped).map(([name, total]) => ({ name, value: total })).sort((a, b) => b.value - a.value);
}

function sortPeriods(points: DashboardBreakdown[]): DashboardBreakdown[] {
  return [...points].sort((a, b) => a.name.localeCompare(b.name));
}

function percentageChange(points: DashboardBreakdown[]): number | undefined {
  if (points.length < 2) return undefined;
  const previous = points[points.length - 2].value;
  const current = points[points.length - 1].value;
  if (previous === 0) return current === 0 ? 0 : undefined;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function scopedProviderKeys(providers: Awaited<ReturnType<typeof getProviderDirectory>>, filters: DashboardFilters): Set<string> {
  const scoped = providers.filter(provider => {
    const facilityType = normalizeValue(filters.facilityType);
    const ownership = normalizeValue(filters.ownership);
    const state = normalizeValue(filters.state);
    const lga = normalizeValue(filters.lga);
    return (!state || normalizeValue(provider.state) === state)
      && (!lga || normalizeValue(provider.lga) === lga)
      && (!facilityType || normalizeValue(String(provider.category)) === facilityType)
      && (!ownership || normalizeValue(String(provider.ownership)) === ownership);
  });

  return new Set(scoped.flatMap(provider => recordProviderKeys({
    providerId: provider.id,
    providerCode: provider.providerCode,
    providerName: provider.providerName,
  })));
}

function filterByProviderDirectory<T extends { providerId?: string; providerCode?: string; providerName: string }>(records: T[], allowedKeys: Set<string>, shouldScope: boolean): T[] {
  return shouldScope ? records.filter(record => providerMatchesDirectory(record, allowedKeys)) : records;
}

function allocateFinancialRecordsBySector(records: FinancialRecord[], enrollees: EnrolleeRecord[], sector?: 'formal' | 'informal'): FinancialRecord[] {
  if (!sector) return records;

  const totalByProviderPeriod = new Map<string, number>();
  const sectorByProviderPeriod = new Map<string, number>();
  enrollees.forEach(enrollee => {
    const key = `${normalizeValue(enrollee.providerId || enrollee.providerCode || enrollee.providerName) || 'unknown'}|${enrollee.period}`;
    totalByProviderPeriod.set(key, (totalByProviderPeriod.get(key) || 0) + 1);
    if (enrollee.sector === sector) sectorByProviderPeriod.set(key, (sectorByProviderPeriod.get(key) || 0) + 1);
  });

  return records.map(record => {
    const key = `${normalizeValue(record.providerId || record.providerCode || record.providerName) || 'unknown'}|${record.period}`;
    const total = totalByProviderPeriod.get(key) || 0;
    const sectorCount = sectorByProviderPeriod.get(key) || 0;
    const share = total > 0 ? sectorCount / total : 0;
    const allocatedAmount = amountForDashboardRecord(record) * share;
    return { ...record, amountPaid: allocatedAmount, netAmountPaid: allocatedAmount, amount: allocatedAmount };
  });
}

function sumDashboardAmount(records: FinancialRecord[]): number {
  return records.reduce((total, record) => total + amountForDashboardRecord(record), 0);
}

function latestPeriodFromRecords(records: Array<{ reportingYear?: number; reportingMonth?: number; period?: string }>): { year: number; month: number; period: string } | undefined {
  return records
    .filter(record => Number.isInteger(record.reportingYear) && Number.isInteger(record.reportingMonth) && Number(record.reportingYear) > 0 && Number(record.reportingMonth) > 0)
    .map(record => ({
      year: Number(record.reportingYear),
      month: Number(record.reportingMonth),
      period: record.period || `${record.reportingYear}-${String(record.reportingMonth).padStart(2, '0')}`,
    }))
    .sort((a, b) => (b.year - a.year) || (b.month - a.month))[0];
}

function formatActivityLabel(dataType: ImportBatch['dataType']): string {
  if (dataType === 'enrolment') return 'Enrolment dataset imported';
  if (dataType === 'claims') return 'Claims dataset imported';
  if (dataType === 'capitation') return 'Capitation dataset imported';
  if (dataType === 'ffs') return 'FFS dataset imported';
  return 'Financial dataset imported';
}

function toActivityFromBatch(batch: ImportBatch): DashboardActivityItem {
  return {
    id: `batch-${batch.id}`,
    timestamp: batch.uploadedAt,
    title: formatActivityLabel(batch.dataType),
    description: `${batch.importedRows.toLocaleString()} of ${batch.totalRows.toLocaleString()} rows imported from ${batch.fileName}.`,
    badge: batch.status,
    href: batch.dataType === 'enrolment' ? '/population/enrolment' : '/financial/history',
  };
}

function auditLabel(log: AuditLogEntry): { title: string; description: string; badge: string; href?: string } | null {
  if (log.action === 'PROVIDER_REGISTERED') return { title: 'Provider registered', description: 'A provider was added to the authoritative Provider Directory.', badge: 'Provider', href: '/providers' };
  if (log.action === 'PROVIDER_STATUS_CHANGED') return { title: 'Provider status changed', description: 'A provider lifecycle status was updated.', badge: 'Provider', href: '/providers' };
  if (log.action === 'PROVIDER_MATCH_RESOLVED') return { title: 'Provider match resolved', description: 'An uploaded entity was linked to a Provider Directory record.', badge: 'Matching', href: '/financial/history' };
  if (log.action === 'ENROLMENT_IMPORT_COMMITTED') return { title: 'Enrolment dataset imported', description: 'An enrolment import was committed to the population register.', badge: 'Enrolment', href: '/population/enrolment' };
  return null;
}

function buildAttentionItems(
  intelligence: {
    population: { growthPercentage?: number };
    financial: { growthPercentage?: number };
    efficiency: { networkPepm: number; byLga: DashboardBreakdown[]; byProvider: DashboardBreakdown[] };
    unmatchedProviderCount: number;
  },
  batches: ImportBatch[],
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];
  const highPepmLga = intelligence.efficiency.byLga.find(item => item.value > intelligence.efficiency.networkPepm * 1.15 && (item.secondaryValue || 0) > 0);
  const highPepmProvider = intelligence.efficiency.byProvider.find(item => item.value > intelligence.efficiency.networkPepm * 1.25 && (item.secondaryValue || 0) > 0);
  const latestImportWithWarnings = batches.find(batch => batch.warningRows > 0 || batch.errorRows > 0 || batch.duplicateRows > 0 || batch.unmatchedProviders > 0);
  const populationGrowth = intelligence.population.growthPercentage;
  const financialGrowth = intelligence.financial.growthPercentage;

  if (highPepmLga) items.push({ id: 'high-pepm-lga', level: 'warning', title: 'High PEPM LGA', subject: highPepmLga.name, detail: `PEPM is ${Math.round(((highPepmLga.value / intelligence.efficiency.networkPepm) - 1) * 100)}% above the network average.`, href: '/dashboard' });
  if (highPepmProvider) items.push({ id: 'high-pepm-provider', level: 'warning', title: 'High PEPM provider', subject: highPepmProvider.name, detail: `PEPM is ${Math.round(((highPepmProvider.value / intelligence.efficiency.networkPepm) - 1) * 100)}% above the network average.`, href: '/dashboard' });
  if (populationGrowth !== undefined && populationGrowth <= -10) items.push({ id: 'enrolment-decline', level: 'critical', title: 'Enrolment decline', subject: 'Latest reporting period', detail: `Enrolment decreased by ${Math.abs(populationGrowth)}% compared with the previous period.`, href: '/population/enrolment/register' });
  if (financialGrowth !== undefined && financialGrowth >= 25) items.push({ id: 'financial-increase', level: 'warning', title: 'Large financial increase', subject: 'Latest reporting period', detail: `Expenditure increased by ${financialGrowth}% compared with the previous period.`, href: '/dashboard' });
  if (intelligence.unmatchedProviderCount > 0) items.push({ id: 'unmatched-providers', level: 'critical', title: 'Data quality', subject: `${intelligence.unmatchedProviderCount} unmatched provider${intelligence.unmatchedProviderCount === 1 ? '' : 's'} remain`, detail: 'Review provider matching before using the latest financial data for decisions.', href: '/financial/upload' });
  if (latestImportWithWarnings) items.push({ id: `import-warning-${latestImportWithWarnings.id}`, level: 'warning', title: 'Import warnings', subject: latestImportWithWarnings.fileName, detail: `${latestImportWithWarnings.warningRows + latestImportWithWarnings.errorRows + latestImportWithWarnings.duplicateRows + latestImportWithWarnings.unmatchedProviders} warning, error, duplicate, or unmatched rows were recorded.`, href: '/financial/history' });
  return items.slice(0, 6);
}

function getEmptyIntelligence(filters: DashboardFilters): Dashboard2Intelligence {
  return {
    reportingPeriod: filters.year && filters.month ? `${filters.year}-${String(filters.month).padStart(2, '0')}` : filters.year ? String(filters.year) : 'All periods',
    lastUpdatedAt: new Date().toISOString(),
    provider: { total: 0, active: 0, inactive: 0, byLga: [], bySenatorialDistrict: [], byFacilityType: [], byOwnership: [], byLifecycle: [] },
    population: { total: 0, formal: 0, informal: 0, principal: 0, dependant: 0, bySector: [], byCategory: [], byLga: [], bySenatorialDistrict: [], topFacilities: [], monthlyTrend: [] },
    financial: { totalExpenditure: 0, claims: 0, capitation: 0, ffs: 0, byFundingType: [], monthlyTrend: [], topLgas: [], topProviders: [] },
    efficiency: { networkPepm: 0, bySector: [], byLga: [], byProvider: [], trend: [] },
    managementAttention: [],
    recentActivity: [],
    filterOptions: { years: [], months: [], states: [], lgas: [], facilityTypes: [], ownerships: [] },
    matchedFinancialRecords: 0,
    unmatchedProviderCount: 0,
  };
}

export async function fetchDashboardIntelligence(filters: DashboardFilters = {}): Promise<Dashboard2Intelligence> {
  if (!useMockData) {
    try {
      return await invokeSecureRpc<Dashboard2Intelligence>('nmis_dashboard_intelligence', {
        p_year: filters.year ?? null,
        p_month: filters.month ?? null,
        p_sector: normalizeValue(filters.sector),
        p_state: normalizeValue(filters.state),
        p_lga: normalizeValue(filters.lga),
        p_facility_type: normalizeValue(filters.facilityType),
        p_ownership: normalizeValue(filters.ownership),
      });
    } catch (error) {
      // Propagate secure contract and backend errors so the UI displays the correct error/restricted state instead of deceptive zeros
      throw error;
    }
  }

  const providerDirectory = await getProviderDirectory({ pageSize: -1 });
  const shouldScopeToDirectory = Boolean(normalizeValue(filters.state) || normalizeValue(filters.lga) || normalizeValue(filters.facilityType) || normalizeValue(filters.ownership));
  const providerKeys = scopedProviderKeys(providerDirectory, filters);
  const enrolmentFilters: EnrolmentFilters = {
    year: filters.year,
    month: filters.month,
    state: filters.state,
    lga: filters.lga,
  };

  const [allEnrolmentRecords, financialRecords, importBatches, auditLogs] = await Promise.all([
    fetchEnrollees(enrolmentFilters),
    fetchFinancialRecords({ year: filters.year, month: filters.month, state: filters.state, lga: filters.lga }),
    fetchImportBatches(),
    fetchAuditLogs(),
  ]);

  const scopedEnrolmentHistory = filterByProviderDirectory(allEnrolmentRecords, providerKeys, shouldScopeToDirectory);
  const scopedFinancialHistory = filterByProviderDirectory(financialRecords, providerKeys, shouldScopeToDirectory);
  const hasExplicitPeriod = Boolean(filters.year || filters.month || (filters as DashboardFilters & { period?: string }).period);
  const latestPeriod = hasExplicitPeriod ? undefined : latestPeriodFromRecords([...scopedEnrolmentHistory, ...scopedFinancialHistory]);
  const isCurrentSnapshot = (record: { reportingYear?: number; reportingMonth?: number }) => !latestPeriod
    || (record.reportingYear === latestPeriod.year && record.reportingMonth === latestPeriod.month);
  const scopedEnrolmentRecords = scopedEnrolmentHistory.filter(isCurrentSnapshot);
  const scopedFinancialRecords = scopedFinancialHistory.filter(isCurrentSnapshot);
  const selectedEnrolmentRecords = filters.sector && filters.sector !== 'all'
    ? scopedEnrolmentRecords.filter(record => record.sector === filters.sector)
    : scopedEnrolmentRecords;
  const selectedSector = filters.sector && filters.sector !== 'all' ? filters.sector : undefined;
  const allocatedFinancialRecords = allocateFinancialRecordsBySector(scopedFinancialRecords, scopedEnrolmentRecords, selectedSector);
  const scopedProviders = providerDirectory.filter(provider => {
    const state = normalizeValue(filters.state);
    const lga = normalizeValue(filters.lga);
    const facilityType = normalizeValue(filters.facilityType);
    const ownership = normalizeValue(filters.ownership);
    return (!state || normalizeValue(provider.state) === state)
      && (!lga || normalizeValue(provider.lga) === lga)
      && (!facilityType || normalizeValue(String(provider.category)) === facilityType)
      && (!ownership || normalizeValue(String(provider.ownership)) === ownership);
  });

  const formalCount = selectedEnrolmentRecords.filter(record => record.sector === 'formal').length;
  const informalCount = selectedEnrolmentRecords.filter(record => record.sector === 'informal').length;
  const principalCount = selectedEnrolmentRecords.filter(record => record.category === 'principal').length;
  const dependantCount = selectedEnrolmentRecords.filter(record => record.category === 'dependant').length;
  const totalExpenditure = sumDashboardAmount(allocatedFinancialRecords);
  const financialByType = groupDashboardValues(allocatedFinancialRecords, record => record.dataType, amountForDashboardRecord);
  const financialMonthlyTrend = sortPeriods(groupDashboardValues(scopedFinancialHistory, record => record.period, amountForDashboardRecord));
  const populationMonthlyTrend = sortPeriods(groupDashboardValues(scopedEnrolmentHistory, record => record.period));
  const allFinancialProviderKeys = new Set(providerDirectory.flatMap(provider => recordProviderKeys({ providerId: provider.id, providerCode: provider.providerCode, providerName: provider.providerName })));
  const unmatchedProviderCount = new Set(scopedFinancialRecords.filter(record => !providerMatchesDirectory(record, allFinancialProviderKeys)).flatMap(record => recordProviderKeys(record))).size;
  const networkPepm = selectedEnrolmentRecords.length > 0 ? totalExpenditure / selectedEnrolmentRecords.length : 0;
  const sectorOptions: Array<'formal' | 'informal'> = selectedSector ? [selectedSector] : ['formal', 'informal'];
  const bySectorEfficiency = sectorOptions.map(sector => {
    const sectorRecords = allocateFinancialRecordsBySector(scopedFinancialRecords, scopedEnrolmentRecords, sector).filter(record => amountForDashboardRecord(record) > 0 || scopedEnrolmentRecords.some(enrollee => enrollee.sector === sector));
    const enrolleeCount = scopedEnrolmentRecords.filter(record => record.sector === sector).length;
    return { name: sector, value: enrolleeCount > 0 ? Number((sumDashboardAmount(sectorRecords) / enrolleeCount).toFixed(2)) : 0, secondaryValue: enrolleeCount };
  });
  const byLgaEfficiency = groupDashboardValues(selectedEnrolmentRecords, record => record.lga).map(item => {
    const lgaRecords = allocatedFinancialRecords.filter(record => record.lga === item.name);
    return { name: item.name, value: item.value > 0 ? Number((sumDashboardAmount(lgaRecords) / item.value).toFixed(2)) : 0, secondaryValue: item.value };
  }).sort((a, b) => b.value - a.value).slice(0, 10);
  const byProviderEfficiency = groupDashboardValues(selectedEnrolmentRecords, record => record.providerName).map(item => {
    const providerRecords = allocatedFinancialRecords.filter(record => record.providerName === item.name || record.providerCode === item.name || record.providerId === item.name);
    return { name: item.name, value: item.value > 0 ? Number((sumDashboardAmount(providerRecords) / item.value).toFixed(2)) : 0, secondaryValue: item.value };
  }).sort((a, b) => b.value - a.value).slice(0, 10);
  const attentionBase = {
    population: { growthPercentage: percentageChange(populationMonthlyTrend) },
    financial: { growthPercentage: percentageChange(financialMonthlyTrend) },
    efficiency: { networkPepm, byLga: byLgaEfficiency, byProvider: byProviderEfficiency },
    unmatchedProviderCount,
  };
  const activityItems = [
    ...importBatches.filter(batch => Boolean(batch.uploadedAt)).map(toActivityFromBatch),
    ...auditLogs.filter(log => Boolean(log.createdAt)).flatMap(log => {
      const label = auditLabel(log);
      return label && log.createdAt ? [{ id: `audit-${log.id || log.createdAt}-${log.action}`, timestamp: log.createdAt, ...label }] : [];
    }),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8);
  const timestamps = [
    ...scopedEnrolmentHistory.flatMap(record => [record.updatedAt, record.createdAt]),
    ...scopedFinancialHistory.flatMap(record => [record.updatedAt, record.createdAt]),
    ...importBatches.map(batch => batch.uploadedAt),
    ...auditLogs.flatMap(log => log.createdAt ? [log.createdAt] : []),
  ].filter(Boolean).sort();
  const periodCandidates = [...populationMonthlyTrend, ...financialMonthlyTrend].map(item => item.name).sort();
  const reportingPeriod = filters.year && filters.month
    ? `${filters.year}-${String(filters.month).padStart(2, '0')}`
    : filters.year
      ? String(filters.year)
      : latestPeriod?.period || periodCandidates[periodCandidates.length - 1] || 'No reporting period';
  const filterOptions: Dashboard2Intelligence['filterOptions'] = {
    years: Array.from(new Set([...allEnrolmentRecords.map(record => record.reportingYear), ...financialRecords.map(record => record.reportingYear)].filter(Boolean))).sort((a, b) => b - a),
    months: Array.from(new Set([...allEnrolmentRecords.map(record => record.reportingMonth), ...financialRecords.map(record => record.reportingMonth)].filter(Boolean))).sort((a, b) => a - b),
    states: Array.from(new Set(providerDirectory.map(provider => provider.state).filter(Boolean))).sort(),
    lgas: Array.from(new Set(providerDirectory.map(provider => provider.lga).filter(Boolean))).sort(),
    facilityTypes: Array.from(new Set(providerDirectory.map(provider => String(provider.category)).filter(Boolean))).sort(),
    ownerships: Array.from(new Set(providerDirectory.map(provider => String(provider.ownership)).filter(Boolean))).sort(),
  };

  return {
    reportingPeriod,
    lastUpdatedAt: timestamps[timestamps.length - 1],
    provider: {
      total: scopedProviders.length,
      active: scopedProviders.filter(provider => provider.status === ProviderLifecycleStatus.Active).length,
      inactive: scopedProviders.filter(provider => provider.status !== ProviderLifecycleStatus.Active).length,
      byLga: groupDashboardValues(scopedProviders, provider => provider.lga),
      bySenatorialDistrict: groupDashboardValues(scopedProviders, provider => (provider as any).senatorialDistrict || 'Unknown'),
      byFacilityType: groupDashboardValues(scopedProviders, provider => String(provider.category)),
      byOwnership: groupDashboardValues(scopedProviders, provider => String(provider.ownership)),
      byLifecycle: groupDashboardValues(scopedProviders, provider => String(provider.status)),
    },
    population: {
      total: selectedEnrolmentRecords.length,
      formal: formalCount,
      informal: informalCount,
      principal: principalCount,
      dependant: dependantCount,
      capitationRate: 750, // This is mock/fallback; live mode uses the RPC
      capitationExpenditure: selectedEnrolmentRecords.length * 750,
      bySector: groupDashboardValues(selectedEnrolmentRecords, record => record.sector),
      byCategory: groupDashboardValues(selectedEnrolmentRecords, record => record.category),
      byLga: groupDashboardValues(selectedEnrolmentRecords, record => record.lga),
      bySenatorialDistrict: groupDashboardValues(selectedEnrolmentRecords, record => record.senatorialDistrict || 'Unknown'),
      topFacilities: groupDashboardValues(selectedEnrolmentRecords, record => record.providerName).slice(0, 10),
      monthlyTrend: populationMonthlyTrend,
      growthPercentage: percentageChange(populationMonthlyTrend),
    },
    financial: {
      totalExpenditure,
      claims: financialByType.find(item => item.name === 'claims')?.value || 0,
      capitation: financialByType.find(item => item.name === 'capitation')?.value || 0,
      ffs: financialByType.find(item => item.name === 'ffs')?.value || 0,
      byFundingType: financialByType,
      monthlyTrend: financialMonthlyTrend,
      topLgas: groupDashboardValues(allocatedFinancialRecords, record => record.lga, amountForDashboardRecord).slice(0, 10),
      topProviders: groupDashboardValues(allocatedFinancialRecords, record => record.providerName, amountForDashboardRecord).slice(0, 10),
      growthPercentage: percentageChange(financialMonthlyTrend),
    },
    efficiency: {
      networkPepm: Number(networkPepm.toFixed(2)),
      bySector: bySectorEfficiency,
      byLga: byLgaEfficiency,
      byProvider: byProviderEfficiency,
      trend: sortPeriods(populationMonthlyTrend.map(item => {
        const spend = financialMonthlyTrend.find(financialPoint => financialPoint.name === item.name)?.value || 0;
        return { name: item.name, value: item.value > 0 ? Number((spend / item.value).toFixed(2)) : 0 };
      })),
    },
    managementAttention: buildAttentionItems({ population: attentionBase.population, financial: attentionBase.financial, efficiency: attentionBase.efficiency, unmatchedProviderCount }, importBatches),
    recentActivity: activityItems,
    filterOptions,
    matchedFinancialRecords: scopedFinancialRecords.filter(record => providerMatchesDirectory(record, allFinancialProviderKeys)).length,
    unmatchedProviderCount,
  };
}
