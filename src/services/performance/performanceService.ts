import * as performanceRepository from '../../repositories/performance/performanceRepository';

export async function fetchPerformanceStats() {
  return performanceRepository.getPerformanceStats();
}

export async function fetchProviderRankings() {
  return performanceRepository.getProviderRankings();
}
