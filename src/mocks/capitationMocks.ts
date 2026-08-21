import { CapitationRecord, PaymentBatch } from '../types/capitation';

export const capitationRecords: CapitationRecord[] = [];
export const paymentBatches: PaymentBatch[] = [];

export async function getCapitationRecords(): Promise<CapitationRecord[]> {
  return [];
}

export async function getCapitationRecordById(id: string): Promise<CapitationRecord> {
  throw new Error('Capitation record not found');
}

export async function updateCapitationRecord(id: string, updates: Partial<CapitationRecord>): Promise<CapitationRecord> {
  throw new Error('Capitation record not found');
}

export async function applyCapitationAction(id: string, action: any, comment?: string): Promise<CapitationRecord> {
  throw new Error('Capitation record not found');
}
