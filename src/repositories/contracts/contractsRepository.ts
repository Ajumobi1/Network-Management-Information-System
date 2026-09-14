import { useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { ProviderContract, ContractSummary } from '../../types/contracts/contractTypes';
import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';

export async function getContracts(): Promise<ProviderContract[]> {
  if (useMockData) {
    const mockList = await apiMocks.getContracts();
    return (mockList || []).map((c: any) => ({
      id: c.id,
      providerId: c.provider_id,
      providerName: 'Provider Facility',
      providerCode: 'NMIS-FAC',
      category: 'hospital' as any,
      ownership: 'Private' as any,
      contractType: 'Full Service',
      startDate: c.start_date,
      endDate: c.end_date,
      status: 'Active' as any,
    }));
  }

  // Attempt RPC first for performance and security
  const { data: rpcData, error: rpcError } = await supabase.rpc('nmis_list_contracts');

  if (!rpcError) {
    return (rpcData || []) as ProviderContract[];
  }

  // Fallback: Read directly from the table if RPC is missing
  const { data: tableData, error: tableError } = await supabase
    .from('provider_contracts')
    .select('*');

  if (tableError) {
    const errorMessage = tableError.message || '';
    const code = tableError.code === 'P0001' && errorMessage.includes('ACCESS_RESTRICTED')
      ? 'ACCESS_RESTRICTED'
      : 'SECURE_CONTRACT_UNAVAILABLE';
    throw new SecureContractError(code, errorMessage || 'Failed to list contracts');
  }

  return (tableData || []).map((c: any) => ({
    id: c.id,
    providerId: c.provider_id,
    providerName: c.metadata?.provider_name || 'Provider Facility',
    providerCode: c.metadata?.provider_code || 'NMIS-FAC',
    category: 'hospital' as any, // Default for fallback
    ownership: 'Private' as any, // Default for fallback
    contractType: c.contract_type,
    startDate: c.start_date,
    endDate: c.end_date,
    status: c.status,
  })) as ProviderContract[];
}

export async function getContractSummary(): Promise<ContractSummary> {
  const contracts = await getContracts();
  return {
    totalCount: contracts.length,
    activeCount: contracts.filter(c => c.status === 'Active').length,
    renewalCount: contracts.filter(c => c.status === 'Renewal').length,
    expiredCount: contracts.filter(c => c.status === 'Expired').length,
  };
}

export async function createContract(contract: Omit<ProviderContract, 'id'>): Promise<ProviderContract> {
  if (useMockData) {
    console.log('Mock: Creating contract', contract);
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...contract,
    };
  }

  const { data, error } = await supabase
    .from('provider_contracts')
    .insert([{
      provider_id: contract.providerId,
      contract_type: contract.contractType,
      start_date: contract.startDate,
      end_date: contract.endDate,
      status: contract.status,
      metadata: {
        provider_name: contract.providerName,
        provider_code: contract.providerCode,
      }
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProviderContract;
}
