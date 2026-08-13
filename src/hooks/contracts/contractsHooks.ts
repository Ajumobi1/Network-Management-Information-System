import { useQuery } from '@tanstack/react-query';
import * as contractsRepository from '../../repositories/contracts/contractsRepository';

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
