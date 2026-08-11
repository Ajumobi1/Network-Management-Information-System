import { fetchTable, fetchSingle, insertRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { CapitationRow, CapitationUploadRow } from '../../lib/supabase/database.types';
import {
  applyCapitationAction,
  getCapitationRecordById,
  getCapitationRecords,
  updateCapitationRecord,
} from '../../mocks/capitationMocks';
import { CapitationAction, CapitationFilters, CapitationRecord } from '../../types/capitation';

export async function getCapitations() {
  if (useMockData) {
    return apiMocks.getCapitations();
  }
  return fetchTable<CapitationRow>('capitation');
}

export async function getCapitationById(id: string) {
  if (useMockData) {
    return apiMocks.getCapitationById(id);
  }
  return fetchSingle<CapitationRow>('capitation', 'id', id);
}

export async function createCapitation(payload: Partial<CapitationRow>) {
  if (useMockData) {
    return apiMocks.createCapitation(payload);
  }
  return insertRow<CapitationRow>('capitation', payload);
}

export async function uploadCapitationFile(payload: Partial<CapitationUploadRow>) {
  if (useMockData) {
    return apiMocks.uploadCapitationFile(payload);
  }
  return insertRow<CapitationUploadRow>('capitation_uploads', payload);
}

export async function fetchCapitationRecords(filters: CapitationFilters): Promise<CapitationRecord[]> {
  const records = await getCapitationRecords();
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

export async function fetchCapitationRecord(id: string): Promise<CapitationRecord> {
  return getCapitationRecordById(id);
}

export async function transitionCapitationRecord(id: string, action: CapitationAction, comment?: string): Promise<CapitationRecord> {
  return applyCapitationAction(id, action, comment);
}

export async function saveCapitationRecord(id: string, updates: Partial<CapitationRecord>): Promise<CapitationRecord> {
  return updateCapitationRecord(id, updates);
}
