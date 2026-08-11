import * as capitationRepository from '../../repositories/capitation';
import { CapitationRow, CapitationUploadRow } from '../../lib/supabase/database.types';
import {
  CapitationAction,
  CapitationBreakdownPoint,
  CapitationFilters,
  CapitationRecord,
  CapitationRecordStatus,
  CapitationSummary,
  CapitationTrendPoint,
  PaymentBatch,
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

export async function transitionCapitation(id: string, action: CapitationAction, comment?: string): Promise<CapitationRecord> {
  const record = await fetchCapitationRecord(id);
  validateTransition(record, action, comment);
  if (action === 'calculate') {
    const calculation = calculateCapitation(record);
    return capitationRepository.saveCapitationRecord(id, { ...calculation, approvalStatus: 'calculated' });
  }
  return capitationRepository.transitionCapitationRecord(id, action, comment);
}

export function buildPaymentBatch(records: CapitationRecord[]): PaymentBatch {
  if (!records.length) throw new Error('Select at least one capitation record.');
  if (records.some(record => record.approvalStatus !== 'approved')) throw new Error('Only approved records can be added to a payment batch.');
  const period = records[0].period;
  if (records.some(record => record.period !== period)) throw new Error('Payment batches must contain a single capitation period.');
  return {
    batchNumber: `CAP-${period.replace('-', '')}-${String(Date.now()).slice(-3)}`,
    period,
    recordIds: records.map(record => record.id),
    providerCount: new Set(records.map(record => record.providerId)).size,
    beneficiaryCount: records.reduce((sum, record) => sum + record.eligibleBeneficiaryCount, 0),
    grossAmount: records.reduce((sum, record) => sum + record.grossAmount, 0),
    deductions: records.reduce((sum, record) => sum + record.deductions.reduce((total, deduction) => total + deduction.amount, 0), 0),
    netAmount: records.reduce((sum, record) => sum + record.netPayable, 0),
    approvalStatus: 'approved',
    paymentStatus: 'pending',
    paymentDate: null,
    paymentReference: null,
  };
}

export function exportCapitationsCsv(records: CapitationRecord[]): string {
  const headers = ['Provider Code', 'Facility Name', 'Facility Type', 'Ownership', 'State', 'LGA', 'Period', 'Beneficiaries', 'Eligible Beneficiaries', 'Rate', 'Gross Amount', 'Adjustments', 'Deductions', 'Net Payable', 'Payment Status', 'Reconciliation Status', 'Payment Date', 'Payment Reference'];
  const lines = records.map(record => {
    const adjustmentTotal = record.adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
    const deductionTotal = record.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
    return [record.providerCode, record.facilityName, record.facilityType, record.ownership, record.state, record.lga, record.period, record.beneficiaryCount, record.eligibleBeneficiaryCount, record.capitationRate, record.grossAmount, adjustmentTotal, deductionTotal, record.netPayable, record.paymentStatus, record.reconciliationStatus, record.paymentDate ?? '', record.paymentReference ?? ''].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...lines].join('\\n');
}

export async function fetchCapitations(): Promise<CapitationRow[]> {
  return capitationRepository.getCapitations();
}

export async function fetchCapitationById(id: string): Promise<CapitationRow> {
  return capitationRepository.getCapitationById(id);
}

export async function createCapitation(payload: Partial<CapitationRow>): Promise<CapitationRow> {
  return capitationRepository.createCapitation(payload);
}

export async function uploadCapitationFile(payload: Partial<CapitationUploadRow>): Promise<CapitationUploadRow> {
  return capitationRepository.uploadCapitationFile(payload);
}
