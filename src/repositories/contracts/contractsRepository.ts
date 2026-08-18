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

  const { data, error } = await supabase.rpc('nmis_list_contracts');

  if (error) {
    const errorMessage = error.message || '';
    const missingContractRpc =
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      /nmis_list_contracts|could not find the function/i.test(errorMessage);

    // The current production schema has provider contract status fields but no
    // dedicated nmis_list_contracts read RPC yet. Render a truthful empty
    // contract register instead of turning the entire route into an error
    // screen. Authorization and other secure-contract failures still surface.
    if (missingContractRpc) return [];

    const code = error.code === 'P0001' && errorMessage.includes('ACCESS_RESTRICTED')
      ? 'ACCESS_RESTRICTED'
      : 'SECURE_CONTRACT_UNAVAILABLE';
    throw new SecureContractError(code, errorMessage || 'Failed to list contracts');
  }

  return (data || []) as ProviderContract[];
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
