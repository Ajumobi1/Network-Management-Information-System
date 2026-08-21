import * as credentialingRepository from '../../repositories/credentialing/credentialingRepository';
import { CredentialingApplication, CredentialingStatus, CredentialingFilters } from '../../types/credentialing/credentialingTypes';

export async function fetchCredentialingApplications(filters?: CredentialingFilters): Promise<CredentialingApplication[]> {
  return credentialingRepository.getCredentialingApplications(filters);
}

export async function fetchCredentialingApplicationById(id: string): Promise<CredentialingApplication> {
  return credentialingRepository.getCredentialingApplicationById(id);
}

export async function changeCredentialingStatus(id: string, status: CredentialingStatus, comment?: string, reviewer?: string): Promise<CredentialingApplication> {
  // Business logic validation for status transitions
  const app = await credentialingRepository.getCredentialingApplicationById(id);
  if (!app) throw new Error('Credentialing application not found');

  if ((status === 'rejected' || status === 'additional-info-required') && !comment) {
    throw new Error('A comment or reason is required when rejecting or requesting additional information.');
  }

  return credentialingRepository.updateCredentialingStatus(id, status, comment, reviewer);
}
