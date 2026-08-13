import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { getCapitationRecords as getMockRecords, getCapitationRecordById as getMockRecordById } from '../../mocks/capitationMocks';
import { CapitationAction, CapitationFilters, CapitationRecord } from '../../types/capitation';
import { ProviderCategory, ProviderOwnership, ProviderLifecycleStatus, ProviderWorkflowStatus } from '../../types/providers/providerTypes';

export interface CapitationSummaryRecord {
  id: string;
  provider_id: string;
  provider_name: string;
  provider_code: string;
  period: string;
  enrollee_denominator: number;
  eligible_population: number;
  capitation_rate: number;
  gross_amount: number;
  adjustments: number;
  deductions: number;
  net_amount: number;
  status: string;
  payment_status: string;
  reconciliation_status: string;
  updated_at: string;
}

function mapRecord(c: CapitationSummaryRecord): CapitationRecord {
  return {
    id: c.id,
    providerId: c.provider_id,
    facilityName: c.provider_name,
    providerCode: c.provider_code,
    period: c.period,
    periodStart: `${c.period}-01`,
    periodEnd: `${c.period}-28`, // Approximation
    beneficiaryCount: c.eligible_population,
    eligibleBeneficiaryCount: c.enrollee_denominator,
    capitationRate: Number(c.capitation_rate),
    grossAmount: Number(c.gross_amount),
    netPayable: Number(c.net_amount),
    adjustments: [], 
    deductions: [],  
    paymentStatus: (c.payment_status?.toLowerCase() || 'pending') as any,
    paymentDate: null,
    paymentReference: null,
    approvalStatus: (c.status?.toLowerCase() || 'draft') as any,
    reconciliationStatus: (c.reconciliation_status?.toLowerCase() || 'pending') as any,
    reconciledAmount: null,
    batchNumber: null,
    notes: null,
    auditTrail: [],
    updatedAt: c.updated_at || new Date().toISOString(),
    state: 'Ondo', 
    lga: 'Unknown',
    facilityType: ProviderCategory.Hospital,
    ownership: ProviderOwnership.Government,
    providerLifecycleStatus: ProviderLifecycleStatus.Active,
    credentialingStatus: ProviderWorkflowStatus.Complete,
  };
}

export const capitationRepository = {
  async fetchCapitationRecords(filters: CapitationFilters): Promise<CapitationRecord[]> {
    if (useMockData) {
      const records = await getMockRecords();
      const query = filters.search.trim().toLowerCase();
      return records.filter(record => {
        const matchesSearch = !query || [record.providerCode, record.facilityName, record.state, record.lga].some(value => value.toLowerCase().includes(query));
        const matchesPeriod = filters.period === 'all' || record.period === filters.period;
        const matchesType = filters.facilityType === 'all' || record.facilityType === filters.facilityType;
        const matchesOwnership = filters.ownership === 'all' || record.ownership === filters.ownership;
        const matchesState = filters.state === 'all' || record.state === filters.state;
        const matchesLga = filters.lga === 'all' || record.lga === filters.lga;
        const matchesPayment = filters.paymentStatus === 'all' || record.paymentStatus === filters.paymentStatus;
        const matchesReconciliation = filters.reconciliationStatus === 'all' || record.reconciliationStatus === filters.reconciliationStatus;
        const matchesApproval = filters.approvalStatus === 'all' || record.approvalStatus === filters.approvalStatus;
        return matchesSearch && matchesPeriod && matchesType && matchesOwnership && matchesState && matchesLga && matchesPayment && matchesReconciliation && matchesApproval;
      });
    }

    const { data, error } = await supabase.rpc('nmis_list_capitation', {
      p_period: filters.period === 'all' ? null : filters.period,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to list capitation records');
    }

    return (data || []).map(mapRecord);
  },

  async fetchCapitationRecord(id: string): Promise<CapitationRecord> {
    if (useMockData) {
      return getMockRecordById(id);
    }

    const { data, error } = await supabase.rpc('nmis_list_capitation', {
      p_provider_id: id, 
    });

    if (error || !data || data.length === 0) {
      throw new Error('Capitation record not found');
    }

    return mapRecord(data[0] as CapitationSummaryRecord);
  },

  async transitionCapitationRecord(id: string, action: CapitationAction, comment?: string): Promise<{ success: boolean; status: string }> {
    if (useMockData) {
      return { success: true, status: 'Updated' };
    }

    const { data, error } = await supabase.rpc('nmis_transition_capitation', {
      p_capitation_id: id,
      p_action: action,
      p_comment: comment || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to transition capitation record');
    }

    return data;
  },

  async saveCapitationRecord(_id: string, _updates: Partial<CapitationRecord>): Promise<CapitationRecord> {
    throw new Error('Direct capitation updates are restricted. Use transition workflow.');
  }
};

export const fetchCapitationRecords = capitationRepository.fetchCapitationRecords;
export const fetchCapitationRecord = capitationRepository.fetchCapitationRecord;
export const transitionCapitationRecord = capitationRepository.transitionCapitationRecord;
export const saveCapitationRecord = capitationRepository.saveCapitationRecord;
