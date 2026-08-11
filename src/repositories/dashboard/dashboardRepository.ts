import { useMockData } from '../common';
import * as dashboardMocks from '../../mocks/dashboardMocks';
import { getProviderDirectory } from '../providers/providersRepository';
import { fetchFinancialRecords } from '../financial-data/financialDataRepository';
import { ProviderLifecycleStatus } from '../../constants/providerNetwork';
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

export async function fetchKpiMetrics(): Promise<KpiMetric[]> {
  const providers = await getProviderDirectory();
  const financialRecords = await fetchFinancialRecords();
  
  const totalProviders = providers.length;
  const activeProviders = providers.filter(p => p.status === ProviderLifecycleStatus.Active).length;
  const totalExpenditure = financialRecords.reduce((sum, r) => sum + (r.netAmountPaid ?? r.amountPaid ?? r.amount ?? 0), 0);
  
  const baseMetrics = await dashboardMocks.getKpiMetrics();

  return baseMetrics.map(m => {
    if (m.id === 'total-providers') return { ...m, value: totalProviders.toLocaleString() };
    if (m.id === 'active-providers') return { ...m, value: activeProviders.toLocaleString() };
    if (m.id === 'monthly-capitation') {
      const bValue = totalExpenditure / 1000000000;
      const displayValue = bValue >= 0.01 ? `₦${bValue.toFixed(2)}B` : `₦${(totalExpenditure / 1000000).toFixed(2)}M`;
      return { 
        ...m, 
        label: 'Total Network Expenditure', 
        value: displayValue, 
        subtitle: 'Aggregated claims, capitation, and FFS' 
      };
    }
    return m;
  });
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
