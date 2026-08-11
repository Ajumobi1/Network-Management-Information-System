import * as credentialingRepository from '../../repositories/credentialing';
import { CredentialingRow } from '../../lib/supabase/database.types';

export async function fetchCredentialingRequests(): Promise<CredentialingRow[]> {
  return credentialingRepository.getCredentialingRequests();
}

export async function fetchCredentialingById(id: string): Promise<CredentialingRow> {
  return credentialingRepository.getCredentialingById(id);
}

export async function updateCredentialing(id: string, payload: Partial<CredentialingRow>): Promise<CredentialingRow> {
  return credentialingRepository.updateCredentialing(id, payload);
}
