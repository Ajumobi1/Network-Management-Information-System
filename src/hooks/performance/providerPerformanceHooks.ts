import { useQuery } from '@tanstack/react-query';
import { providerPerformanceService } from '../../services/performance/providerPerformanceService';
import { PerformanceFilters } from '../../types/performance/providerPerformanceTypes';

export function useProviderPerformanceRecords(filters: PerformanceFilters) {
  return useQuery({
    queryKey: ['provider-performance', filters],
    queryFn: () => providerPerformanceService.getPerformanceRecords(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderPerformanceSummary() {
  return useQuery({
    queryKey: ['provider-performance-summary'],
    queryFn: () => providerPerformanceService.getSummaryStats(),
    staleTime: 1000 * 60 * 5,
  });
}
