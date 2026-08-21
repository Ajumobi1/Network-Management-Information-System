import * as contractsRepository from '../../repositories/contracts';
import { ProviderContract } from '../../types/contracts/contractTypes';

export async function fetchContracts(): Promise<ProviderContract[]> {
  return contractsRepository.getContracts();
}

export async function fetchContractById(id: string): Promise<ProviderContract | null> {
  const contracts = await contractsRepository.getContracts();
  return contracts.find(c => c.id === id) || null;
}
