import { useMockData } from '../common';
import * as dashboardMocks from '../../mocks/dashboardMocks';
import { getProviderDirectory } from '../providers/providersRepository';
import { fetchFinancialRecords } from '../financial-data/financialDataRepository';
import { fetchEnrolmentAnalyticsWithFinance } from '../enrolment/enrolmentRepository';
import { ProviderLifecycleStatus } from '../../constants/providerNetwork';
import { EnrolmentAnalytics } from '../../types/enrolment/enrolmentTypes';
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
  if (useMockData) {
    const summary = await dashboardMocks.getExecutiveSummary();
    const providers = await getProviderDirectory();
    const activeCount = providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
    return {
      ...summary,
      todayFocus: `${activeCount} providers are currently active in the network. ${summary.todayFocus}`,
    };
  }

  // Fallback to mock for complex summary text, but with real counts
  const summary = await dashboardMocks.getExecutiveSummary();
  const providers = await getProviderDirectory();
  const activeCount = providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
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
  const [providers, financialRecords, population] = await Promise.all([
    getProviderDirectory(),
    fetchFinancialRecords(),
    fetchEnrolmentAnalyticsWithFinance(),
  ]);

  const totalProviders = providers.length;
  const activeProviders = providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
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
  const providers = await getProviderDirectory();
  const distribution = providers.reduce((acc, p) => {
    const region = p.state || 'Other';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(distribution).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value);
}

export async function fetchProviderCategories(): Promise<DistributionPoint[]> {
  const providers = await getProviderDirectory();
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
