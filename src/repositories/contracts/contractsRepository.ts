import { fetchTable, fetchSingle, insertRow, updateRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { ContractsRow } from '../../lib/supabase/database.types';

export async function getContracts() {
  if (useMockData) {
    return apiMocks.getContracts();
  }

  return fetchTable<ContractsRow>('contracts');
}

export async function getContractById(id: string) {
  if (useMockData) {
    return apiMocks.getContractById(id);
  }

  return fetchSingle<ContractsRow>('contracts', 'id', id);
}

export async function createContract(payload: Partial<ContractsRow>) {
  if (useMockData) {
    return apiMocks.createContract(payload);
  }

  return insertRow<ContractsRow>('contracts', payload);
}

export async function updateContract(id: string, payload: Partial<ContractsRow>) {
  if (useMockData) {
    return apiMocks.updateContract(id, payload);
  }

  return updateRow<ContractsRow>('contracts', id, payload);
}
