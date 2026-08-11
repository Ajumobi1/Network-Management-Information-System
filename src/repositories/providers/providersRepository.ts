import { fetchTable, fetchSingle, insertRow, updateRow, deleteRow, useMockData } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { apiMocks } from '../../mocks';
import { FacilitiesRow, ProviderContactsRow, ProvidersRow } from '../../lib/supabase/database.types';
import { providerDirectory, providerProfiles, providerRegistrationDraft } from '../../mocks/providersMocks';

export async function getProviders() {
  if (useMockData) {
    return apiMocks.getProviders();
  }

  return fetchTable<ProvidersRow>('providers');
}

export async function getProviderById(id: string) {
  if (useMockData) {
    return apiMocks.getProviderById(id);
  }

  return fetchSingle<ProvidersRow>('providers', 'id', id);
}

export async function createProvider(payload: Partial<ProvidersRow>) {
  if (useMockData) {
    return apiMocks.createProvider(payload);
  }

  return insertRow<ProvidersRow>('providers', payload);
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>) {
  if (useMockData) {
    return apiMocks.updateProvider(id, payload);
  }

  return updateRow<ProvidersRow>('providers', id, payload);
}

export async function deleteProvider(id: string) {
  if (useMockData) {
    return apiMocks.deleteProvider(id);
  }

  return deleteRow('providers', id);
}

export async function getProviderContacts(providerId: string) {
  if (useMockData) {
    return apiMocks.getProviderContacts(providerId);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('provider_contacts').select('*').eq('provider_id', providerId);
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}

export async function getProviderFacilities(providerId: string) {
  if (useMockData) {
    return apiMocks.getProviderFacilities(providerId);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('facilities').select('*').eq('provider_id', providerId);
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}

export async function getProviderDirectory() {
  return providerDirectory;
}

export async function getProviderProfile(providerId: string) {
  const profile = providerProfiles.find(provider => provider.id === providerId);

  if (!profile) {
    throw new Error('Provider profile not found');
  }

  return profile;
}

export async function getProviderRegistrationDraft() {
  return providerRegistrationDraft;
}
