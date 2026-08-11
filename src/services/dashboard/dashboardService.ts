import * as dashboardRepository from '../../repositories/dashboard';
import {
  AiInsight,
  CompletionPoint,
  CoverageLocation,
  DashboardAction,
  DashboardTask,
  ExecutiveSummary,
  GrowthPoint,
  KpiMetric,
  NotificationSummary,
  PerformanceGauge,
  PerformancePoint,
  TrendPoint,
  DistributionPoint,
  ActivityItem,
  UpcomingActivity,
} from '../../types/dashboard/dashboardTypes';

export async function fetchExecutiveSummary(): Promise<ExecutiveSummary> {
  return dashboardRepository.fetchExecutiveSummary();
}

export async function fetchKpiMetrics(): Promise<KpiMetric[]> {
  return dashboardRepository.fetchKpiMetrics();
}

export async function fetchProviderDistribution(): Promise<DistributionPoint[]> {
  return dashboardRepository.fetchProviderDistribution();
}

export async function fetchProviderCategories(): Promise<DistributionPoint[]> {
  return dashboardRepository.fetchProviderCategories();
}

export async function fetchMonthlyGrowth(): Promise<GrowthPoint[]> {
  return dashboardRepository.fetchMonthlyGrowth();
}

export async function fetchInspectionCompletion(): Promise<CompletionPoint[]> {
  return dashboardRepository.fetchInspectionCompletion();
}

export async function fetchPerformanceRating(): Promise<PerformancePoint[]> {
  return dashboardRepository.fetchPerformanceRating();
}

export async function fetchCapitationTrend(): Promise<TrendPoint[]> {
  return dashboardRepository.fetchCapitationTrend();
}

export async function fetchUtilizationTrend(): Promise<TrendPoint[]> {
  return dashboardRepository.fetchUtilizationTrend();
}

export async function fetchCoverageLocations(): Promise<CoverageLocation[]> {
  return dashboardRepository.fetchCoverageLocations();
}

export async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  return dashboardRepository.fetchDashboardTasks();
}

export async function fetchDashboardActivities(): Promise<ActivityItem[]> {
  return dashboardRepository.fetchDashboardActivities();
}

export async function fetchUpcomingActivities(): Promise<UpcomingActivity[]> {
  return dashboardRepository.fetchUpcomingActivities();
}

export async function fetchDashboardNotifications(): Promise<NotificationSummary> {
  return dashboardRepository.fetchDashboardNotifications();
}

export async function fetchAiInsights(): Promise<AiInsight[]> {
  return dashboardRepository.fetchAiInsights();
}

export async function fetchPerformanceGauges(): Promise<PerformanceGauge[]> {
  return dashboardRepository.fetchPerformanceGauges();
}
