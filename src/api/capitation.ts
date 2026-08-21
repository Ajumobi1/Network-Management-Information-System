import { getApiClient, handleSupabaseError } from './client';
import { CapitationRow, CapitationUploadRow } from '../lib/supabase/database.types';

export async function getCapitations() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('capitation').select('*').order('period_start', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getCapitationById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('capitation').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function createCapitation(payload: Partial<CapitationRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('capitation').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function uploadCapitationFile(payload: Partial<CapitationUploadRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('capitation_uploads').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
