import { getApiClient, handleSupabaseError } from './client';
import { ProvidersRow, ProviderContactsRow, FacilitiesRow } from '../lib/supabase/database.types';

export async function getProviders() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('providers').select('*');
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getProviderById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('providers').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function createProvider(payload: Partial<ProvidersRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('providers').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateProvider(id: string, payload: Partial<ProvidersRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('providers').update(payload).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function deleteProvider(id: string) {
  const supabase = getApiClient();
  const { error } = await supabase.from('providers').delete().eq('id', id);
  if (error) throw handleSupabaseError(error);
  return true;
}

export async function getProviderContacts(providerId: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('provider_contacts').select('*').eq('provider_id', providerId);
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getProviderFacilities(providerId: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('facilities').select('*').eq('provider_id', providerId);
  if (error) throw handleSupabaseError(error);
  return data;
}
