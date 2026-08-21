import { ProviderCategory, ProviderOwnership } from '../providers/providerTypes';

export type ContractStatus = 'Active' | 'Renewal' | 'Expired' | 'Pending';

export interface ProviderContract {
  id: string;
  providerId: string;
  providerName: string;
  providerCode: string;
  category: ProviderCategory;
  ownership: ProviderOwnership;
  contractType: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  value?: number;
}

export interface ContractSummary {
  totalCount: number;
  activeCount: number;
  renewalCount: number;
  expiredCount: number;
}
