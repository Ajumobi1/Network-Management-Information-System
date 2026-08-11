import { fetchTable, fetchSingle, updateRow, useMockData } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { apiMocks } from '../../mocks';
import { InspectionsRow, InspectionChecklistRow } from '../../lib/supabase/database.types';

export async function getInspections() {
  if (useMockData) {
    return apiMocks.getInspections();
  }

  return fetchTable<InspectionsRow>('inspections');
}

export async function getInspectionById(id: string) {
  if (useMockData) {
    return apiMocks.getInspectionById(id);
  }

  return fetchSingle<InspectionsRow>('inspections', 'id', id);
}

export async function getInspectionChecklist(inspectionId: string) {
  if (useMockData) {
    return apiMocks.getInspectionChecklist(inspectionId);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('inspection_checklists').select('*').eq('inspection_id', inspectionId);
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>) {
  if (useMockData) {
    return apiMocks.updateInspection(id, payload);
  }

  return updateRow<InspectionsRow>('inspections', id, payload);
}
