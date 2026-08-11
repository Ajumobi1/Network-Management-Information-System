import { ProviderCategory, ProviderLifecycleStatus, ProviderOwnership, ProviderWorkflowStatus } from '../providers/providerTypes';

export type CapitationRecordStatus =
  | 'draft'
  | 'calculated'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'payment-processing'
  | 'paid'
  | 'reconciled'
  | 'rejected'
  | 'payment-failed'
  | 'reconciliation-exception'
  | 'suspended';

export type ReconciliationStatus = 'not-started' | 'pending' | 'reconciled' | 'partial' | 'exception';
export type PaymentStatus = 'not-ready' | 'pending' | 'processing' | 'paid' | 'failed' | 'partial';
export type CapitationAction = 'calculate' | 'submit' | 'review' | 'approve' | 'start-payment' | 'mark-paid' | 'reconcile' | 'reject' | 'suspend' | 'raise-exception';

export type CapitationAuditEntry = {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  previousStatus?: CapitationRecordStatus;
  newStatus?: CapitationRecordStatus;
  previousValue?: string;
  newValue?: string;
  comment?: string;
};

export type CapitationAdjustment = {
  id: string;
  label: string;
  amount: number;
  reason: string;
};

export type CapitationDeduction = {
  id: string;
  label: string;
  amount: number;
  reason: string;
};

export type CapitationRecord = {
  id: string;
  providerId: string;
  providerCode: string;
  facilityName: string;
  facilityType: ProviderCategory;
  ownership: ProviderOwnership;
  state: string;
  lga: string;
  providerLifecycleStatus: ProviderLifecycleStatus;
  credentialingStatus: ProviderWorkflowStatus;
  period: string;
  periodStart: string;
  periodEnd: string;
  beneficiaryCount: number;
  eligibleBeneficiaryCount: number;
  capitationRate: number;
  grossAmount: number;
  adjustments: CapitationAdjustment[];
  deductions: CapitationDeduction[];
  netPayable: number;
  paymentStatus: PaymentStatus;
  paymentDate: string | null;
  paymentReference: string | null;
  approvalStatus: CapitationRecordStatus;
  reconciliationStatus: ReconciliationStatus;
  reconciledAmount: number | null;
  batchNumber: string | null;
  notes: string | null;
  auditTrail: CapitationAuditEntry[];
  updatedAt: string;
};

export type CapitationFilters = {
  search: string;
  period: 'all' | string;
  facilityType: 'all' | ProviderCategory;
  ownership: 'all' | ProviderOwnership;
  state: 'all' | string;
  lga: 'all' | string;
  paymentStatus: 'all' | PaymentStatus;
  reconciliationStatus: 'all' | ReconciliationStatus;
  approvalStatus: 'all' | CapitationRecordStatus;
};

export type CapitationSummary = {
  totalBeneficiaries: number;
  totalProviders: number;
  grossAmount: number;
  deductions: number;
  netPayable: number;
  paidAmount: number;
  outstandingAmount: number;
  pendingApprovals: number;
  reconciliationExceptions: number;
};

export type CapitationTrendPoint = {
  period: string;
  gross: number;
  net: number;
  paid: number;
};

export type CapitationBreakdownPoint = {
  label: string;
  value: number;
  beneficiaries: number;
};

export type PaymentBatch = {
  batchNumber: string;
  period: string;
  recordIds: string[];
  providerCount: number;
  beneficiaryCount: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed';
  paymentDate: string | null;
  paymentReference: string | null;
};

export type CapitationFiltersInput = Partial<CapitationFilters>;

export const CAPITATION_STATUS_LABELS: Record<CapitationRecordStatus, string> = {
  draft: 'Draft',
  calculated: 'Calculated',
  submitted: 'Submitted for Review',
  reviewed: 'Reviewed',
  approved: 'Approved',
  'payment-processing': 'Payment Processing',
  paid: 'Paid',
  reconciled: 'Reconciled',
  rejected: 'Rejected',
  'payment-failed': 'Payment Failed',
  'reconciliation-exception': 'Reconciliation Exception',
  suspended: 'Suspended',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  'not-ready': 'Not Ready',
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  partial: 'Partially Paid',
};

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  'not-started': 'Not Started',
  pending: 'Pending',
  reconciled: 'Reconciled',
  partial: 'Partial',
  exception: 'Exception',
};

export const DEFAULT_CAPITATION_FILTERS: CapitationFilters = {
  search: '',
  period: 'all',
  facilityType: 'all',
  ownership: 'all',
  state: 'all',
  lga: 'all',
  paymentStatus: 'all',
  reconciliationStatus: 'all',
  approvalStatus: 'all',
};
