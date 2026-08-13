import { providerPerformanceRepository } from '../../repositories/performance/providerPerformanceRepository';
import { PerformanceFilters, ProviderPerformanceRecord, PerformanceSummaryStats } from '../../types/performance/providerPerformanceTypes';

export const providerPerformanceService = {
  async getPerformanceRecords(filters: PerformanceFilters): Promise<ProviderPerformanceRecord[]> {
    return providerPerformanceRepository.fetchPerformanceRecords(filters);
  },

  async getSummaryStats(): Promise<PerformanceSummaryStats> {
    return providerPerformanceRepository.fetchSummaryStats();
  }
};
