import * as providersRepository from '../../repositories/providers';
import { ProvidersRow } from '../../lib/supabase/database.types';
import { ProviderDirectoryFilters, ProviderDirectoryItem, ProviderProfile, ProviderRegistrationDraft } from '../../types/providers/providerTypes';

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

export async function fetchProviderContacts(providerId: string) {
  return providersRepository.getProviderContacts(providerId);
}

export async function fetchProviderFacilities(providerId: string) {
  return providersRepository.getProviderFacilities(providerId);
}

export async function fetchProviderDirectory(filters?: ProviderDirectoryFilters): Promise<ProviderDirectoryItem[]> {
  const providers = await providersRepository.getProviderDirectory();
  const activeFilters =
    filters ?? {
      search: '',
      status: 'all',
      contractStatus: 'all',
      credentialStatus: 'all',
      inspectionStatus: 'all',
      capitationStatus: 'all',
      state: 'all',
      lga: 'all',
      category: 'all',
      subcategory: 'all',
      ownership: 'all',
    };
  const searchTerm = activeFilters.search.trim().toLowerCase();

  return providers.filter(provider => {
    const matchesSearch =
      !searchTerm ||
      [provider.providerCode, provider.providerName, provider.category, provider.subcategory, provider.ownership, provider.contactPerson, provider.phone, provider.email, provider.state, provider.lga]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);
    const matchesStatus = activeFilters.status === 'all' || provider.status === activeFilters.status;
    const matchesContract = activeFilters.contractStatus === 'all' || provider.contractStatus === activeFilters.contractStatus;
    const matchesCredential = activeFilters.credentialStatus === 'all' || provider.credentialStatus === activeFilters.credentialStatus;
    const matchesInspection = activeFilters.inspectionStatus === 'all' || provider.inspectionStatus === activeFilters.inspectionStatus;
    const matchesCapitation = activeFilters.capitationStatus === 'all' || provider.capitationStatus === activeFilters.capitationStatus;
    const matchesState = activeFilters.state === 'all' || provider.state === activeFilters.state;
    const matchesLga = activeFilters.lga === 'all' || provider.lga === activeFilters.lga;
    const matchesCategory = activeFilters.category === 'all' || provider.category === activeFilters.category;
    const matchesSubcategory = activeFilters.subcategory === 'all' || provider.subcategory === activeFilters.subcategory;
    const matchesOwnership = activeFilters.ownership === 'all' || provider.ownership === activeFilters.ownership;

    return matchesSearch && matchesStatus && matchesContract && matchesCredential && matchesInspection && matchesCapitation && matchesState && matchesLga && matchesCategory && matchesSubcategory && matchesOwnership;
  });
}

export async function fetchProviderProfile(providerId: string): Promise<ProviderProfile> {
  return providersRepository.getProviderProfile(providerId);
}

export async function fetchProviderRegistrationDraft(): Promise<ProviderRegistrationDraft> {
  return providersRepository.getProviderRegistrationDraft();
}
