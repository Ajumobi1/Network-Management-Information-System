import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { apiMocks } from '../../mocks';
import { InspectionsRow } from '../../lib/supabase/database.types';
import { InspectionChecklistItem } from '../../types/inspections/inspectionsTypes';

export interface InspectionRecord {
  id: string;
  provider_id: string;
  provider_name?: string;
  provider_code?: string;
  providerName?: string;
  providerCode?: string;
  provider_category?: string | null;
  provider_ownership?: string | null;
  template_id?: string | null;
  template_code?: string | null;
  facility_type_code?: string | null;
  inspection_type: string;
  scheduled_date: string;
  inspector_name?: string;
  status: string;
  score?: number;
  rating?: string;
  credentialing_points?: number;
  credentialing_possible?: number;
  accreditation_points?: number;
  accreditation_possible?: number;
  findings?: string;
  corrective_actions?: string;
  created_at?: string;
}

export async function getInspections(providerId?: string): Promise<InspectionRecord[]> {
  if (useMockData) {
    const mockList = await apiMocks.getInspections();
    return (mockList || []).map((i: any) => ({
      id: i.id || `insp-${Math.random()}`,
      provider_id: i.providerId || 'prov-1',
      inspection_type: i.type || 'Routine',
      scheduled_date: i.date || '2026-08-01',
      inspector_name: i.inspector || 'Inspector General',
      status: i.status || 'Scheduled',
      score: i.score || 85,
      rating: i.rating || 'Good',
      findings: i.findings || 'Standard facility compliance observed.',
      corrective_actions: i.correctiveActions || 'None',
    }));
  }

  const { data, error } = await supabase.rpc('nmis_list_inspections', {
    p_provider_id: providerId || null,
  });

  if (error) {
    const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
      ? 'ACCESS_RESTRICTED'
      : 'SECURE_CONTRACT_UNAVAILABLE';
    throw new SecureContractError(code, error.message || 'Failed to list inspections');
  }

  return (data || []) as InspectionRecord[];
}

export async function saveInspection(payload: Partial<InspectionRecord>): Promise<{ success: boolean; inspection_id: string }> {
  if (useMockData) {
    return { success: true, inspection_id: payload.id || `insp-${Date.now()}` };
  }

  const { data, error } = await supabase.rpc('nmis_save_inspection', {
    p_inspection_id: payload.id || null,
    p_provider_id: payload.provider_id || null,
    p_inspection_type: payload.inspection_type || 'Routine',
    p_scheduled_date: payload.scheduled_date || new Date().toISOString().split('T')[0],
    p_inspector_name: payload.inspector_name || null,
    p_status: payload.status || 'Scheduled',
    p_score: payload.score ?? null,
    p_rating: payload.rating || null,
    p_findings: payload.findings || null,
    p_corrective_actions: payload.corrective_actions || null,
  });

  if (error) {
    const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
      ? 'ACCESS_RESTRICTED'
      : 'SECURE_CONTRACT_UNAVAILABLE';
    throw new SecureContractError(code, error.message || 'Failed to save inspection');
  }

  return data;
}

export async function getInspectionById(id: string): Promise<InspectionRecord | null> {
  const list = await getInspections();
  return list.find(i => i.id === id) || null;
}

export async function getInspectionChecklist(inspectionId: string): Promise<InspectionChecklistItem[]> {
  if (useMockData) {
    return apiMocks.getInspectionChecklist(inspectionId) as any;
  }

  const { data, error } = await supabase.rpc('nmis_get_inspection_checklist', {
    p_inspection_id: inspectionId,
  });

  if (error) {
    const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
      ? 'ACCESS_RESTRICTED'
      : 'SECURE_CONTRACT_UNAVAILABLE';
    throw new SecureContractError(code, error.message || 'Failed to load inspection checklist');
  }

  return (data || []) as InspectionChecklistItem[];
}

export async function updateInspection(id: string, payload: Partial<InspectionsRow>) {
  return saveInspection({ ...payload, id } as any);
}
