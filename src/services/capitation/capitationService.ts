import * as capitationRepository from '../../repositories/capitation/capitationRepository';
import {
  CapitationAction,
  CapitationBreakdownPoint,
  CapitationFilters,
  CapitationRecord,
  CapitationRecordStatus,
  CapitationSummary,
  CapitationTrendPoint,
} from '../../types/capitation';

export type CapitationCalculationOptions = {
  requireActiveProvider?: boolean;
  requireApprovedCredentialing?: boolean;
};

const DEFAULT_CALCULATION_OPTIONS: Required<CapitationCalculationOptions> = {
  requireActiveProvider: true,
  requireApprovedCredentialing: true,
};

const allowedTransitions: Record<CapitationAction, CapitationRecordStatus[]> = {
  calculate: ['draft', 'rejected', 'suspended'],
  submit: ['calculated', 'rejected'],
  review: ['submitted'],
  approve: ['reviewed'],
  'start-payment': ['approved'],
  'mark-paid': ['payment-processing'],
  reconcile: ['paid'],
  reject: ['submitted', 'reviewed'],
  suspend: ['draft', 'calculated', 'submitted', 'reviewed', 'approved'],
  'raise-exception': ['paid', 'reconciled'],
};

export function calculateCapitation(record: CapitationRecord, options: CapitationCalculationOptions = {}): Pick<CapitationRecord, 'grossAmount' | 'netPayable' | 'eligibleBeneficiaryCount'> {
  const config = { ...DEFAULT_CALCULATION_OPTIONS, ...options };
  const providerEligible = (!config.requireActiveProvider || record.providerLifecycleStatus === 'active') && (!config.requireApprovedCredentialing || record.credentialingStatus === 'complete');
  if (!providerEligible) {
    throw new Error(`Provider ${record.providerCode} is not eligible for payable capitation. Check lifecycle and credentialing status.`);
  }
  const grossAmount = record.eligibleBeneficiaryCount * record.capitationRate;
  const adjustmentTotal = record.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
  const deductionTotal = record.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  return { eligibleBeneficiaryCount: record.eligibleBeneficiaryCount, grossAmount, netPayable: grossAmount + adjustmentTotal - deductionTotal };
}

export function getCapitationSummary(records: CapitationRecord[]): CapitationSummary {
  const sum = (selector: (record: CapitationRecord) => number) => records.reduce((total, record) => total + selector(record), 0);
  const deductions = sum(record => record.deductions.reduce((total, deduction) => total + deduction.amount, 0));
  const paidAmount = sum(record => record.paymentStatus === 'paid' ? (record.reconciledAmount ?? record.netPayable) : record.paymentStatus === 'partial' ? (record.reconciledAmount ?? 0) : 0);
  return {
    totalBeneficiaries: sum(record => record.eligibleBeneficiaryCount),
    totalProviders: new Set(records.map(record => record.providerId)).size,
    grossAmount: sum(record => record.grossAmount),
    deductions,
    netPayable: sum(record => record.netPayable),
    paidAmount,
    outstandingAmount: Math.max(0, sum(record => record.netPayable) - paidAmount),
    pendingApprovals: records.filter(record => ['submitted', 'reviewed'].includes(record.approvalStatus)).length,
    reconciliationExceptions: records.filter(record => record.reconciliationStatus === 'exception' || record.approvalStatus === 'reconciliation-exception').length,
  };
}

export function getMonthlyTrend(records: CapitationRecord[]): CapitationTrendPoint[] {
  const periods = [...new Set(records.map(record => record.period))].sort();
  return periods.map(period => {
    const periodRecords = records.filter(record => record.period === period);
    return {
      period,
      gross: periodRecords.reduce((sum, record) => sum + record.grossAmount, 0),
      net: periodRecords.reduce((sum, record) => sum + record.netPayable, 0),
      paid: periodRecords.reduce((sum, record) => sum + (record.paymentStatus === 'paid' ? (record.reconciledAmount ?? record.netPayable) : 0), 0),
    };
  });
}

export function getBreakdown(records: CapitationRecord[], key: 'facilityType' | 'ownership' | 'state'): CapitationBreakdownPoint[] {
  const groups = new Map<string, CapitationBreakdownPoint>();
  records.forEach(record => {
    const label = record[key];
    const existing = groups.get(label) ?? { label, value: 0, beneficiaries: 0 };
    existing.value += record.netPayable;
    existing.beneficiaries += record.eligibleBeneficiaryCount;
    groups.set(label, existing);
  });
  return [...groups.values()].sort((a, b) => b.value - a.value);
}

export function getAvailableActions(status: CapitationRecordStatus): CapitationAction[] {
  return (Object.keys(allowedTransitions) as CapitationAction[]).filter(action => allowedTransitions[action].includes(status));
}

export function validateTransition(record: CapitationRecord, action: CapitationAction, comment?: string): void {
  if (!allowedTransitions[action].includes(record.approvalStatus)) {
    throw new Error(`${action} is not permitted while this record is ${record.approvalStatus}.`);
  }
  if (['reject', 'suspend', 'raise-exception'].includes(action) && !comment?.trim()) {
    throw new Error('A reason or comment is required for this action.');
  }
  if (action === 'approve' && record.reconciliationStatus === 'exception') {
    throw new Error('Resolve reconciliation exceptions before approving this record.');
  }
}

export async function fetchCapitationRecords(filters: CapitationFilters): Promise<CapitationRecord[]> {
  return capitationRepository.fetchCapitationRecords(filters);
}

export async function fetchCapitationRecord(id: string): Promise<CapitationRecord> {
  return capitationRepository.fetchCapitationRecord(id);
}

export async function transitionCapitation(id: string, action: CapitationAction, comment?: string): Promise<any> {
  const record = await fetchCapitationRecord(id);
  validateTransition(record, action, comment);
  return capitationRepository.transitionCapitationRecord(id, action, comment);
}

export function exportCapitationsCsv(records: CapitationRecord[]): string {
  const headers = ['Provider', 'Code', 'Period', 'Denominator', 'Rate', 'Gross', 'Net', 'Status', 'Payment'];
  const rows = records.map(r => [
    r.facilityName,
    r.providerCode,
    r.period,
    r.eligibleBeneficiaryCount,
    r.capitationRate,
    r.grossAmount,
    r.netPayable,
    r.approvalStatus,
    r.paymentStatus
  ]);
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
