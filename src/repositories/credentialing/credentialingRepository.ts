import { fetchTable, fetchSingle, updateRow, useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { CredentialingRow } from '../../lib/supabase/database.types';

export async function getCredentialingRequests() {
  if (useMockData) {
    return apiMocks.getCredentialingRequests();
  }

  return fetchTable<CredentialingRow>('credentialing');
}

export async function getCredentialingById(id: string) {
  if (useMockData) {
    return apiMocks.getCredentialingById(id);
  }

  return fetchSingle<CredentialingRow>('credentialing', 'id', id);
}

export async function updateCredentialing(id: string, payload: Partial<CredentialingRow>) {
  if (useMockData) {
    return apiMocks.updateCredentialing(id, payload);
  }

  return updateRow<CredentialingRow>('credentialing', id, payload);
}
