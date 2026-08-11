import { getApiClient, handleSupabaseError } from './client';
import { ContractsRow } from '../lib/supabase/database.types';

export async function getContracts() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('contracts').select('*').order('end_date', { ascending: true });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getContractById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function createContract(payload: Partial<ContractsRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('contracts').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateContract(id: string, payload: Partial<ContractsRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('contracts').update(payload).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
