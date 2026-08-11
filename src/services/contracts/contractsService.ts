import * as contractsRepository from '../../repositories/contracts';
import { ContractsRow } from '../../lib/supabase/database.types';

export async function fetchContracts(): Promise<ContractsRow[]> {
  return contractsRepository.getContracts();
}

export async function fetchContractById(id: string): Promise<ContractsRow> {
  return contractsRepository.getContractById(id);
}

export async function createContract(payload: Partial<ContractsRow>): Promise<ContractsRow> {
  return contractsRepository.createContract(payload);
}

export async function updateContract(id: string, payload: Partial<ContractsRow>): Promise<ContractsRow> {
  return contractsRepository.updateContract(id, payload);
}
