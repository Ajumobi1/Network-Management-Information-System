import { getApiClient, handleSupabaseError } from './client';
import { UsersRow } from '../lib/supabase/database.types';

export async function getUsers() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getUserById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateUser(id: string, payload: Partial<UsersRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('users').update(payload).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
