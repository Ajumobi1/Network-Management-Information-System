import { getApiClient, handleSupabaseError } from './client';
import { SettingsRow } from '../lib/supabase/database.types';

export async function getSettings() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('settings').select('*');
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getSettingByKey(key: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('settings').select('*').eq('key', key).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateSetting(key: string, value: unknown) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('settings').upsert({ key, value }).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
