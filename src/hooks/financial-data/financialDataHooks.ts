import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchFinancialRecords, 
  fetchImportBatches, 
  fetchImportBatchById,
  createImportBatch,
  fetchFinancialAnalytics,
  fetchFinancialRegisterSummary,
  checkDuplicateBatch,
  FinancialFilters 
} from '../../repositories/financial-data/financialDataRepository';
import { FinancialDataType } from '../../types/financial-data';

export function useFinancialRecords(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: ['financial-data', 'records', filters],
    queryFn: () => fetchFinancialRecords(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useImportBatches() {
  return useQuery({
    queryKey: ['financial-data', 'batches'],
    queryFn: () => fetchImportBatches(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useImportBatch(id: string | null) {
  return useQuery({
    queryKey: ['financial-data', 'batch', id],
    queryFn: () => fetchImportBatchById(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialAnalytics(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: ['financial-data', 'analytics', filters],
    queryFn: () => fetchFinancialAnalytics(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialRegisterSummary(filters: FinancialFilters = {}) {
  return useQuery({
    queryKey: ['financial-data', 'register-summary', filters],
    queryFn: () => fetchFinancialRegisterSummary(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateImportBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batch, records }: { batch: any, records: any[] }) => createImportBatch(batch, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    },
  });
}

export function useCheckDuplicateBatch(period: string, dataType: FinancialDataType) {
  return useQuery({
    queryKey: ['financial-data', 'duplicate-check', period, dataType],
    queryFn: () => checkDuplicateBatch(period, dataType),
    enabled: !!period && !!dataType,
    staleTime: 0, // Always check
  });
}
