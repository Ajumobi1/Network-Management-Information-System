import { useQuery } from '@tanstack/react-query';
import { DashboardFilters } from '../../types/dashboard/dashboardIntelligenceTypes';
import {
  fetchAiInsights,
  fetchCapitationTrend,
  fetchCoverageLocations,
  fetchDashboardActivities,
  fetchDashboardNotifications,
  fetchDashboardTasks,
  fetchExecutiveSummary,
  fetchInspectionCompletion,
  fetchKpiMetrics,
  fetchPerformanceGauges,
  fetchPerformanceRating,
  fetchProviderCategories,
  fetchProviderDistribution,
  fetchMonthlyGrowth,
  fetchPopulationSnapshot,
  fetchUpcomingActivities,
  fetchUtilizationTrend,
  fetchDashboardIntelligence,
} from '../../services/dashboard/dashboardService';

export function useExecutiveSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchExecutiveSummary,
    staleTime: 1000 * 60 * 5,
  });
}

export function useKpiMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: fetchKpiMetrics,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePopulationSnapshot() {
  return useQuery({
    queryKey: ['dashboard', 'populationSnapshot'],
    queryFn: fetchPopulationSnapshot,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderDistribution() {
  return useQuery({
    queryKey: ['dashboard', 'distribution'],
    queryFn: fetchProviderDistribution,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderCategories() {
  return useQuery({
    queryKey: ['dashboard', 'categories'],
    queryFn: fetchProviderCategories,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlyGrowth() {
  return useQuery({
    queryKey: ['dashboard', 'growth'],
    queryFn: fetchMonthlyGrowth,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInspectionCompletion() {
  return useQuery({
    queryKey: ['dashboard', 'inspectionCompletion'],
    queryFn: fetchInspectionCompletion,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceRating() {
  return useQuery({
    queryKey: ['dashboard', 'performanceRating'],
    queryFn: fetchPerformanceRating,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCapitationTrend() {
  return useQuery({
    queryKey: ['dashboard', 'capitationTrend'],
    queryFn: fetchCapitationTrend,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUtilizationTrend() {
  return useQuery({
    queryKey: ['dashboard', 'utilizationTrend'],
    queryFn: fetchUtilizationTrend,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCoverageLocations() {
  return useQuery({
    queryKey: ['dashboard', 'coverageLocations'],
    queryFn: fetchCoverageLocations,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDashboardTasks() {
  return useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: fetchDashboardTasks,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDashboardActivities() {
  return useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: fetchDashboardActivities,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpcomingActivities() {
  return useQuery({
    queryKey: ['dashboard', 'upcomingActivities'],
    queryFn: fetchUpcomingActivities,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: fetchDashboardNotifications,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: ['dashboard', 'aiInsights'],
    queryFn: fetchAiInsights,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePerformanceGauges() {
  return useQuery({
    queryKey: ['dashboard', 'performanceGauges'],
    queryFn: fetchPerformanceGauges,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDashboardIntelligence(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'intelligence', filters],
    queryFn: () => fetchDashboardIntelligence(filters),
    staleTime: 1000 * 60 * 5,
  });
}
