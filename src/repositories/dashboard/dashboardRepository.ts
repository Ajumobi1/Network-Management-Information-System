import { fetchTable, useMockData } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import * as dashboardMocks from '../../mocks/dashboardMocks';
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
    return dashboardMocks.getExecutiveSummary();
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_summary').select('*').single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as ExecutiveSummary;
}

export async function fetchKpiMetrics(): Promise<KpiMetric[]> {
  if (useMockData) {
    return dashboardMocks.getKpiMetrics();
  }

  return fetchTable<KpiMetric>('dashboard_kpis');
}

export async function fetchProviderDistribution(): Promise<DistributionPoint[]> {
  if (useMockData) {
    return dashboardMocks.getProviderDistribution();
  }

  return fetchTable<DistributionPoint>('dashboard_provider_distribution');
}

export async function fetchProviderCategories(): Promise<DistributionPoint[]> {
  if (useMockData) {
    return dashboardMocks.getProviderCategories();
  }

  return fetchTable<DistributionPoint>('dashboard_provider_categories');
}

export async function fetchMonthlyGrowth(): Promise<GrowthPoint[]> {
  if (useMockData) {
    return dashboardMocks.getMonthlyGrowth();
  }

  return fetchTable<GrowthPoint>('dashboard_monthly_growth');
}

export async function fetchInspectionCompletion(): Promise<CompletionPoint[]> {
  if (useMockData) {
    return dashboardMocks.getInspectionCompletion();
  }

  return fetchTable<CompletionPoint>('dashboard_inspection_completion');
}

export async function fetchPerformanceRating(): Promise<PerformancePoint[]> {
  if (useMockData) {
    return dashboardMocks.getPerformanceRating();
  }

  return fetchTable<PerformancePoint>('dashboard_performance_rating');
}

export async function fetchCapitationTrend(): Promise<TrendPoint[]> {
  if (useMockData) {
    return dashboardMocks.getCapitationTrend();
  }

  return fetchTable<TrendPoint>('dashboard_capitation_trend');
}

export async function fetchUtilizationTrend(): Promise<TrendPoint[]> {
  if (useMockData) {
    return dashboardMocks.getUtilizationTrend();
  }

  return fetchTable<TrendPoint>('dashboard_utilization_trend');
}

export async function fetchCoverageLocations(): Promise<CoverageLocation[]> {
  if (useMockData) {
    return dashboardMocks.getCoverageLocations();
  }

  return fetchTable<CoverageLocation>('dashboard_coverage_locations');
}

export async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  if (useMockData) {
    return dashboardMocks.getDashboardTasks();
  }

  return fetchTable<DashboardTask>('dashboard_tasks', { column: 'due_date', ascending: true });
}

export async function fetchDashboardActivities(): Promise<ActivityItem[]> {
  if (useMockData) {
    return dashboardMocks.getDashboardActivities();
  }

  return fetchTable<ActivityItem>('dashboard_activities', { column: 'created_at', ascending: false });
}

export async function fetchUpcomingActivities(): Promise<UpcomingActivity[]> {
  if (useMockData) {
    return dashboardMocks.getUpcomingActivities();
  }

  return fetchTable<UpcomingActivity>('dashboard_upcoming_activities', { column: 'date', ascending: true });
}

export async function fetchDashboardNotifications(): Promise<NotificationSummary> {
  if (useMockData) {
    return dashboardMocks.getDashboardNotifications();
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('dashboard_notifications').select('*').single();

  if (error) {
    throw formatSupabaseError(error);
  }

  return data as NotificationSummary;
}

export async function fetchAiInsights(): Promise<AiInsight[]> {
  if (useMockData) {
    return dashboardMocks.getAiInsights();
  }

  return fetchTable<AiInsight>('dashboard_ai_insights', { column: 'created_at', ascending: false });
}

export async function fetchPerformanceGauges(): Promise<PerformanceGauge[]> {
  if (useMockData) {
    return dashboardMocks.getPerformanceGauges();
  }

  return fetchTable<PerformanceGauge>('dashboard_performance_gauges');
}
