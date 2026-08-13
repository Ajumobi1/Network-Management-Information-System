import { ProviderCategory, ProviderLifecycleStatus, ProviderOwnership, ProviderWorkflowStatus } from '../../constants/providerNetwork';

export { ProviderCategory, ProviderLifecycleStatus, ProviderOwnership, ProviderWorkflowStatus };
export type ProviderDocumentType =
  | 'Facility License'
  | 'Practice License'
  | 'CAC Certificate'
  | 'Tax Clearance'
  | 'Professional Certificate'
  | 'Insurance'
  | 'Photo'
  | 'Contract'
  | 'Inspection Report';

export type ProviderDirectoryItem = {
  id: string;
  providerCode: string;
  providerName: string;
  category: ProviderCategory;
  subcategory: string;
  ownership: ProviderOwnership;
  lga: string;
  state: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: ProviderLifecycleStatus;
  contractStatus: ProviderWorkflowStatus;
  credentialStatus: ProviderWorkflowStatus;
  inspectionStatus: ProviderWorkflowStatus;
  capitationStatus: ProviderWorkflowStatus;
  inspectionRating: string;
  lastInspectionDate: string;
};

export type ProviderDocument = {
  id: string;
  providerId: string;
  type: ProviderDocumentType;
  name: string;
  expiryDate: string;
  version: string;
  status: ProviderWorkflowStatus;
};

export type ProviderTimelineItem = {
  id: string;
  date: string;
  title: string;
  description: string;
  actor: string;
};

export type ProviderPerformance = {
  inspectionRating: number;
  complaintScore: number;
  utilization: number;
  claimsTrend: string;
  capitationTrend: string;
  compliance: number;
};

export type ProviderProfile = ProviderDirectoryItem & {
  address: string;
  services: string[];
  departments: string[];
  staffStrength: number;
  equipment: string[];
  bankName: string;
  accountName: string;
  accountNumber: string;
  documents: ProviderDocument[];
  timeline: ProviderTimelineItem[];
  performance: ProviderPerformance;
  communicationHistory: ProviderTimelineItem[];
  registerPosition?: number;
};

export type ProviderDirectoryFilters = {
  search: string;
  status: 'all' | ProviderLifecycleStatus;
  contractStatus: 'all' | ProviderWorkflowStatus;
  credentialStatus: 'all' | ProviderWorkflowStatus;
  inspectionStatus: 'all' | ProviderWorkflowStatus;
  capitationStatus: 'all' | ProviderWorkflowStatus;
  lga: 'all' | string;
  category: 'all' | string;
  subcategory: 'all' | string;
  ownership: 'all' | ProviderOwnership;
  page?: number;
  pageSize?: number;
};

export type ProviderRegistrationDraft = {
  basicInformation: Record<string, string>;
  facilityInformation: Record<string, string>;
  ownership: Record<string, string>;
  medicalServices: string[];
  departments: string[];
  staffStrength: Record<string, string>;
  equipment: string[];
  bankDetails: Record<string, string>;
  documents: ProviderDocument[];
};
