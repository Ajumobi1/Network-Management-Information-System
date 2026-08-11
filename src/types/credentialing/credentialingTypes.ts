import { ProviderCategory, ProviderOwnership } from '../providers/providerTypes';

export type CredentialingStatus =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'additional-info-required'
  | 'approved'
  | 'rejected'
  | 'expired';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export type CredentialingDocument = {
  id: string;
  name: string;
  type: string;
  documentNumber?: string;
  issueDate: string;
  expiryDate: string;
  status: DocumentVerificationStatus;
  uploadedDate: string;
  reviewer?: string;
  notes?: string;
};

export type CredentialingAuditItem = {
  id: string;
  date: string;
  user: string;
  action: string;
  previousStatus: CredentialingStatus;
  newStatus: CredentialingStatus;
  comment?: string;
};

export type CredentialingApplication = {
  id: string;
  providerId: string;
  providerCode: string;
  providerName: string;
  category: ProviderCategory;
  ownership: ProviderOwnership;
  state: string;
  lga: string;
  status: CredentialingStatus;
  applicationDate: string;
  expiryDate: string;
  reviewer: string;
  lastUpdated: string;
  notes: string;
  documents: CredentialingDocument[];
  auditTrail: CredentialingAuditItem[];
};

export type CredentialingFilters = {
  search: string;
  status: 'all' | CredentialingStatus;
  category: 'all' | string;
  ownership: 'all' | string;
  state: 'all' | string;
};
