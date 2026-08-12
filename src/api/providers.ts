import { ProvidersRow } from '../lib/supabase/database.types';
import { accessRestricted, trustedOperationRequired } from '../lib/security/secureContracts';

/**
 * Legacy compatibility surface only. Production provider access must follow
 * hooks → services → repository → named secure contract/trusted workflow.
 */
export async function getProviders(): Promise<ProvidersRow[]> {
  throw accessRestricted('legacy provider list API');
}

export async function getProviderById(_id: string): Promise<ProvidersRow> {
  throw accessRestricted('legacy provider detail API');
}

export async function createProvider(_payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  throw trustedOperationRequired('provider registration');
}

export async function updateProvider(_id: string, _payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  throw trustedOperationRequired('provider edit');
}

export async function deleteProvider(_id: string): Promise<boolean> {
  throw trustedOperationRequired('provider retention or correction');
}

export async function getProviderContacts(_providerId: string): Promise<never> {
  throw accessRestricted('provider contact data');
}

export async function getProviderFacilities(_providerId: string): Promise<never> {
  throw accessRestricted('provider facility data');
}
