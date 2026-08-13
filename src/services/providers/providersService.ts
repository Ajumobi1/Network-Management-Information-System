import { ProvidersRow } from '../../lib/supabase/database.types';
import { ProviderDirectoryFilters, ProviderDirectoryItem, ProviderLifecycleStatus, ProviderProfile, ProviderRegistrationDraft } from '../../types/providers/providerTypes';
import * as providersRepository from '../../repositories/providers/providersRepository';
import type { ProviderOperationalUpdate, ProviderRegistrationCommand } from '../../repositories/providers/providersRepository';

export async function fetchProviders(): Promise<ProvidersRow[]> {
  return providersRepository.getProviders();
}

export async function fetchProviderById(id: string): Promise<ProvidersRow> {
  return providersRepository.getProviderById(id);
}

export async function createProvider(payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  return providersRepository.createProvider(payload);
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>): Promise<ProvidersRow> {
  return providersRepository.updateProvider(id, payload);
}

export async function deleteProvider(id: string): Promise<boolean> {
  return providersRepository.deleteProvider(id);
}

export async function registerNewProvider(payload: ProviderRegistrationCommand): Promise<ProviderDirectoryItem> {
  return providersRepository.createDirectoryProvider(payload) as unknown as ProviderDirectoryItem;
}

export async function editDirectoryProvider(id: string, payload: ProviderOperationalUpdate): Promise<ProviderDirectoryItem> {
  return providersRepository.updateDirectoryProvider(id, payload) as unknown as ProviderDirectoryItem;
}

export async function changeProviderStatus(id: string, status: ProviderLifecycleStatus): Promise<ProviderDirectoryItem> {
  return providersRepository.setProviderLifecycleStatus(id, status) as unknown as ProviderDirectoryItem;
}

export async function fetchProviderContacts(providerId: string) {
  return providersRepository.getProviderContacts(providerId);
}

export async function fetchProviderFacilities(providerId: string) {
  return providersRepository.getProviderFacilities(providerId);
}

export async function fetchProviderDirectory(filters?: ProviderDirectoryFilters & { page?: number; pageSize?: number }): Promise<ProviderDirectoryItem[] & { totalCount?: number }> {
  const activeFilters =
    filters ?? {
      search: '',
      status: 'all',
      contractStatus: 'all',
      credentialStatus: 'all',
      inspectionStatus: 'all',
      capitationStatus: 'all',
      lga: 'all',
      category: 'all',
      subcategory: 'all',
      ownership: 'all',
      page: 1,
      pageSize: 50,
    };
  
  return providersRepository.getProviderDirectory(activeFilters);
}

export async function findProviderMatchCandidates(query: string, limit?: number): Promise<ProviderDirectoryItem[]> {
  return providersRepository.findSafeProviderMatchCandidates(query, limit);
}

export async function fetchProviderProfile(providerId: string): Promise<ProviderProfile> {
  return providersRepository.getProviderProfile(providerId);
}

export async function fetchProviderRegistrationDraft(): Promise<ProviderRegistrationDraft> {
  return providersRepository.getProviderRegistrationDraft();
}
