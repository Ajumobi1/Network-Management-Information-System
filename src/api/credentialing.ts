import { getApiClient, handleSupabaseError } from './client';
import { CredentialingRow } from '../lib/supabase/database.types';

export async function getCredentialingRequests() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('credentialing').select('*').order('requested_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getCredentialingById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('credentialing').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateCredentialing(id: string, payload: Partial<CredentialingRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('credentialing').update(payload).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
