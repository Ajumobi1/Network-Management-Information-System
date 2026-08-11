import { fetchTable, fetchSingle, insertRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { CapitationRow, CapitationUploadRow } from '../../lib/supabase/database.types';

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
