import { useQuery } from '@tanstack/react-query';
import * as performanceService from '../../services/performance/performanceService';

export function usePerformanceStats() {
  return useQuery({
    queryKey: ['performance', 'stats'],
    queryFn: () => performanceService.fetchPerformanceStats(),
  });
}

export function useProviderRankings() {
  return useQuery({
    queryKey: ['performance', 'rankings'],
    queryFn: () => performanceService.fetchProviderRankings(),
  });
}
