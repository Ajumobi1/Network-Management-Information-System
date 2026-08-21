import { useQuery } from '@tanstack/react-query';
import { financialIntelligenceService } from '../../services/financial-intelligence/financialIntelligenceService';
import { FinancialIntelligenceFilters } from '../../types/financial-intelligence';

export function useFinancialIntelligence(filters: FinancialIntelligenceFilters = {}) {
  return useQuery({
    queryKey: ['financial-intelligence', filters],
    queryFn: () => financialIntelligenceService.fetchFinancialIntelligence(filters),
    staleTime: 1000 * 60 * 5,
  });
}
