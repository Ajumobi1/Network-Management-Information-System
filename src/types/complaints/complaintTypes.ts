export type ComplaintCategory = 'payment' | 'claims' | 'credentialing' | 'inspection' | 'enrolment' | 'other';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ComplaintStatus = 'open' | 'in-review' | 'escalated' | 'resolved' | 'closed';

export interface ComplaintRecord {
  id: string;
  referenceNumber: string;
  source: 'internal' | 'public';
  providerId: string | null;
  providerName: string;
  providerCode: string | null;
  title: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  description: string;
  resolutionNotes: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintHistoryItem {
  id: string;
  statusFrom: string | null;
  statusTo: string;
  notes: string | null;
  createdByEmail: string;
  createdAt: string;
}

export interface ComplaintFilters {
  search: string;
  status: 'all' | ComplaintStatus;
  category: 'all' | ComplaintCategory;
  priority: 'all' | ComplaintPriority;
}

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  'open': 'Open',
  'in-review': 'In Review',
  'escalated': 'Escalated',
  'resolved': 'Resolved',
  'closed': 'Closed',
};

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  'payment': 'Payment & Capitation',
  'claims': 'Claims Processing',
  'credentialing': 'Credentialing & Licensing',
  'inspection': 'Facility Inspection',
  'enrolment': 'Enrolment & Beneficiary',
  'other': 'Other Issues',
};

export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'urgent': 'Urgent',
};
