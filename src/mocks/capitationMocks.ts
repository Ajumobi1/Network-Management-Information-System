import { providerDirectory } from './providersMocks';
import {
  CapitationAction,
  CapitationAdjustment,
  CapitationAuditEntry,
  CapitationDeduction,
  CapitationRecord,
  CapitationRecordStatus,
  PaymentBatch,
  PaymentStatus,
  ReconciliationStatus,
} from '../types/capitation';
import { ProviderDirectoryItem } from '../types/providers/providerTypes';

const periods = [
  { value: '2026-06', start: '2026-06-01', end: '2026-06-30' },
  { value: '2026-07', start: '2026-07-01', end: '2026-07-31' },
  { value: '2026-08', start: '2026-08-01', end: '2026-08-31' },
];

const beneficiarySeeds: Record<string, number> = {
  'prov-1': 4280,
  'prov-2': 3120,
  'prov-3': 1860,
  'prov-4': 2380,
  'prov-5': 1640,
  'prov-6': 920,
  'prov-7': 4920,
};

const rateSeeds: Record<string, number> = {
  'prov-1': 4250,
  'prov-2': 3200,
  'prov-3': 2700,
  'prov-4': 2950,
  'prov-5': 3850,
  'prov-6': 3150,
  'prov-7': 4600,
};

const statusMatrix: CapitationRecordStatus[][] = [
  ['reconciled', 'paid', 'approved'],
  ['reconciled', 'paid', 'submitted'],
  ['reconciliation-exception', 'payment-failed', 'suspended'],
  ['paid', 'approved', 'reviewed'],
  ['reconciled', 'paid', 'calculated'],
  ['suspended', 'rejected', 'draft'],
  ['reconciled', 'paid', 'submitted'],
];

function paymentForStatus(status: CapitationRecordStatus, index: number): { paymentStatus: PaymentStatus; reconciliationStatus: ReconciliationStatus; paymentDate: string | null; paymentReference: string | null; reconciledAmount: number | null } {
  if (status === 'reconciled') {
    return { paymentStatus: 'paid', reconciliationStatus: 'reconciled', paymentDate: `2026-0${6 + index}-18`, paymentReference: `NIBSS-2026-${String(index + 1).padStart(3, '0')}`, reconciledAmount: null };
  }
  if (status === 'paid') {
    return { paymentStatus: 'paid', reconciliationStatus: index % 2 === 0 ? 'pending' : 'partial', paymentDate: `2026-0${6 + index}-20`, paymentReference: `NIBSS-2026-${String(index + 11).padStart(3, '0')}`, reconciledAmount: null };
  }
  if (status === 'payment-failed') {
    return { paymentStatus: 'failed', reconciliationStatus: 'exception', paymentDate: null, paymentReference: `NIBSS-ERR-${String(index + 1).padStart(3, '0')}`, reconciledAmount: 0 };
  }
  if (status === 'reconciliation-exception') {
    return { paymentStatus: 'paid', reconciliationStatus: 'exception', paymentDate: '2026-07-19', paymentReference: 'NIBSS-DIFF-2026-004', reconciledAmount: 1620000 };
  }
  if (status === 'payment-processing') {
    return { paymentStatus: 'processing', reconciliationStatus: 'not-started', paymentDate: null, paymentReference: null, reconciledAmount: null };
  }
  if (status === 'approved') {
    return { paymentStatus: 'pending', reconciliationStatus: 'not-started', paymentDate: null, paymentReference: null, reconciledAmount: null };
  }
  return { paymentStatus: 'not-ready', reconciliationStatus: 'not-started', paymentDate: null, paymentReference: null, reconciledAmount: null };
}

function buildAudit(recordId: string, status: CapitationRecordStatus, period: string): CapitationAuditEntry[] {
  const created: CapitationAuditEntry = {
    id: `${recordId}-audit-1`,
    action: 'Capitation calculated',
    actor: 'Capitation Engine',
    timestamp: `${period}-05T09:30:00Z`,
    previousStatus: 'draft',
    newStatus: 'calculated',
    comment: 'Monthly eligible beneficiary count validated against provider register.',
  };
  if (status === 'draft') return [created];

  const submitted: CapitationAuditEntry = {
    id: `${recordId}-audit-2`,
    action: 'Submitted for review',
    actor: 'Amina Yusuf',
    timestamp: `${period}-06T11:15:00Z`,
    previousStatus: 'calculated',
    newStatus: 'submitted',
  };
  if (status === 'submitted' || status === 'rejected') return [submitted, created];

  const reviewed: CapitationAuditEntry = {
    id: `${recordId}-audit-3`,
    action: 'Reviewed',
    actor: 'Chinedu Okeke',
    timestamp: `${period}-08T14:40:00Z`,
    previousStatus: 'submitted',
    newStatus: 'reviewed',
    comment: 'Provider classification and beneficiary variance reviewed.',
  };
  if (status === 'reviewed') return [reviewed, submitted, created];

  const approved: CapitationAuditEntry = {
    id: `${recordId}-audit-4`,
    action: 'Approved',
    actor: 'Finance Controller',
    timestamp: `${period}-10T16:10:00Z`,
    previousStatus: 'reviewed',
    newStatus: 'approved',
    comment: 'Approved for payment batch inclusion.',
  };
  if (status === 'approved') return [approved, reviewed, submitted, created];

  const paid: CapitationAuditEntry = {
    id: `${recordId}-audit-5`,
    action: 'Payment completed',
    actor: 'Treasury Operations',
    timestamp: `${period}-20T10:05:00Z`,
    previousStatus: 'approved',
    newStatus: status === 'reconciled' ? 'paid' : status,
    comment: 'Payment instruction processed through approved settlement channel.',
  };
  return [paid, approved, reviewed, submitted, created];
}

function createRecord(provider: ProviderDirectoryItem, periodIndex: number): CapitationRecord {
  const period = periods[periodIndex];
  const status = statusMatrix[Number(provider.id.replace('prov-', '')) - 1][periodIndex];
  const beneficiaries = beneficiarySeeds[provider.id] + (periodIndex - 1) * 56;
  const eligible = provider.status === 'active' && provider.credentialStatus === 'complete'
    ? beneficiaries - periodIndex * 24
    : Math.max(0, beneficiaries - 220 - periodIndex * 18);
  const rate = rateSeeds[provider.id];
  const grossAmount = eligible * rate;
  const adjustments: CapitationAdjustment[] = [
    { id: `${provider.id}-${period.value}-adj-1`, label: periodIndex === 0 ? 'Continuity incentive' : 'Service utilization adjustment', amount: periodIndex === 0 ? Math.round(grossAmount * 0.012) : Math.round(grossAmount * 0.008), reason: periodIndex === 0 ? 'Quarter opening network continuity incentive' : 'Validated service utilization variance' },
  ];
  const deductions: CapitationDeduction[] = [
    { id: `${provider.id}-${period.value}-ded-1`, label: 'Withholding tax', amount: Math.round(grossAmount * 0.01), reason: 'Statutory withholding applied at source' },
    ...(provider.status !== 'active' ? [{ id: `${provider.id}-${period.value}-ded-2`, label: 'Compliance hold', amount: Math.round(grossAmount * 0.015), reason: 'Provider lifecycle or credentialing exception hold' }] : []),
  ];
  const netPayable = grossAmount + adjustments.reduce((sum, item) => sum + item.amount, 0) - deductions.reduce((sum, item) => sum + item.amount, 0);
  const payment = paymentForStatus(status, Number(provider.id.replace('prov-', '')) + periodIndex);
  return {
    id: `cap-${provider.id}-${period.value}`,
    providerId: provider.id,
    providerCode: provider.providerCode,
    facilityName: provider.providerName,
    facilityType: provider.category,
    ownership: provider.ownership,
    state: provider.state,
    lga: provider.lga,
    providerLifecycleStatus: provider.status,
    credentialingStatus: provider.credentialStatus,
    period: period.value,
    periodStart: period.start,
    periodEnd: period.end,
    beneficiaryCount: beneficiaries,
    eligibleBeneficiaryCount: eligible,
    capitationRate: rate,
    grossAmount,
    adjustments,
    deductions,
    netPayable,
    paymentStatus: payment.paymentStatus,
    paymentDate: payment.paymentDate,
    paymentReference: payment.paymentReference,
    approvalStatus: status,
    reconciliationStatus: payment.reconciliationStatus,
    reconciledAmount: payment.reconciledAmount ?? (status === 'reconciled' ? netPayable : null),
    batchNumber: ['reconciled', 'paid'].includes(status) ? `CAP-${period.value.replace('-', '')}-0${Number(provider.id.replace('prov-', ''))}` : null,
    notes: status === 'reconciliation-exception' ? 'Settlement amount does not match approved net payable. Review bank advice.' : status === 'suspended' ? 'Automatically excluded from payable batch pending provider compliance resolution.' : null,
    auditTrail: buildAudit(`cap-${provider.id}-${period.value}`, status, period.value),
    updatedAt: `${period.value}-25T12:00:00Z`,
  };
}

export const capitationRecords: CapitationRecord[] = providerDirectory.flatMap(provider => periods.map((_, periodIndex) => createRecord(provider, periodIndex)));

export const paymentBatches: PaymentBatch[] = [
  {
    batchNumber: 'CAP-202608-001', period: '2026-08', recordIds: capitationRecords.filter(record => record.period === '2026-08' && record.approvalStatus === 'approved').map(record => record.id), providerCount: 1, beneficiaryCount: 4200, grossAmount: 17850000, deductions: 178500, netAmount: 17671500, approvalStatus: 'approved', paymentStatus: 'pending', paymentDate: null, paymentReference: null,
  },
  {
    batchNumber: 'CAP-202607-004', period: '2026-07', recordIds: capitationRecords.filter(record => record.period === '2026-07' && record.paymentStatus === 'paid').map(record => record.id), providerCount: 4, beneficiaryCount: 12072, grossAmount: 46672800, deductions: 801600, netAmount: 46228100, approvalStatus: 'approved', paymentStatus: 'paid', paymentDate: '2026-07-20', paymentReference: 'NIBSS-BATCH-2026-07-004',
  },
];

export async function getCapitationRecords(): Promise<CapitationRecord[]> {
  return capitationRecords;
}

export async function getCapitationRecordById(id: string): Promise<CapitationRecord> {
  const record = capitationRecords.find(item => item.id === id);
  if (!record) throw new Error('Capitation record not found');
  return record;
}

export async function updateCapitationRecord(id: string, updates: Partial<CapitationRecord>): Promise<CapitationRecord> {
  const index = capitationRecords.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Capitation record not found');
  capitationRecords[index] = { ...capitationRecords[index], ...updates, updatedAt: new Date().toISOString() };
  return capitationRecords[index];
}

export async function applyCapitationAction(id: string, action: CapitationAction, comment?: string): Promise<CapitationRecord> {
  const record = await getCapitationRecordById(id);
  const transition: Record<CapitationAction, CapitationRecordStatus> = {
    calculate: 'calculated', submit: 'submitted', review: 'reviewed', approve: 'approved', 'start-payment': 'payment-processing', 'mark-paid': 'paid', reconcile: 'reconciled', reject: 'rejected', suspend: 'suspended', 'raise-exception': 'reconciliation-exception',
  };
  const nextStatus = transition[action];
  const audit: CapitationAuditEntry = {
    id: `${id}-audit-${Date.now()}`,
    action: action === 'start-payment' ? 'Payment initiated' : action === 'mark-paid' ? 'Payment completed' : action === 'raise-exception' ? 'Exception raised' : `${action.charAt(0).toUpperCase()}${action.slice(1)}d`,
    actor: 'Current Finance User',
    timestamp: new Date().toISOString(),
    previousStatus: record.approvalStatus,
    newStatus: nextStatus,
    comment,
  };
  const paymentStatus: PaymentStatus = action === 'mark-paid' ? 'paid' : action === 'start-payment' ? 'processing' : action === 'reconcile' ? 'paid' : record.paymentStatus;
  const reconciliationStatus: ReconciliationStatus = action === 'reconcile' ? 'reconciled' : action === 'raise-exception' ? 'exception' : record.reconciliationStatus;
  return updateCapitationRecord(id, {
    approvalStatus: nextStatus,
    paymentStatus,
    reconciliationStatus,
    paymentDate: action === 'mark-paid' ? new Date().toISOString().split('T')[0] : record.paymentDate,
    paymentReference: action === 'mark-paid' ? `NIBSS-MANUAL-${Date.now().toString().slice(-6)}` : record.paymentReference,
    reconciledAmount: action === 'reconcile' ? record.netPayable : record.reconciledAmount,
    auditTrail: [audit, ...record.auditTrail],
    notes: comment ?? record.notes,
  });
}
