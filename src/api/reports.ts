import { getApiClient, handleSupabaseError } from './client';
import { ReportsRow } from '../lib/supabase/database.types';

export async function getReports() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getReportById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function createReport(payload: Partial<ReportsRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('reports').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
