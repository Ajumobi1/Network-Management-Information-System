import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as contractsRepository from '../../repositories/contracts/contractsRepository';
import { ProviderContract } from '../../types/contracts/contractTypes';

export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractsRepository.getContracts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContractSummary() {
  return useQuery({
    queryKey: ['contracts', 'summary'],
    queryFn: () => contractsRepository.getContractSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contract: Omit<ProviderContract, 'id'>) => contractsRepository.createContract(contract),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'summary'] });
    },
  });
}
