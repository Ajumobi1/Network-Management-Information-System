import { getApiClient, handleSupabaseError } from './client';
import { InspectionsRow, InspectionChecklistRow } from '../lib/supabase/database.types';

export async function getInspections() {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('inspections').select('*').order('scheduled_at', { ascending: true });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getInspectionById(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('inspections').select('*').eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function getInspectionChecklist(inspectionId: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('inspection_checklists').select('*').eq('inspection_id', inspectionId);
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('inspections').update(payload).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
