import { CredentialingApplication, CredentialingStatus } from '../types/credentialing/credentialingTypes';

export const credentialingApplicationsMock: CredentialingApplication[] = [];

export async function getCredentialingApplicationsMock(): Promise<CredentialingApplication[]> {
  return [];
}

export async function getCredentialingApplicationByIdMock(id: string): Promise<CredentialingApplication> {
  throw new Error('Credentialing application not found');
}

export async function updateCredentialingStatusMock(id: string, status: CredentialingStatus, comment?: string, reviewer?: string): Promise<CredentialingApplication> {
  throw new Error('Credentialing application not found');
}
