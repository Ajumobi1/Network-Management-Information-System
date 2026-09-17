import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { loadOfflineInspectionPack } from '../../lib/offline/inspectionOfflineStore';

export type InspectionTemplateItem = {
  section_code: string;
  item_code: string;
  item_label: string;
  response_type: 'number' | 'boolean' | 'text' | 'json';
  min_required: number | null;
  max_points: number;
  scored_when_no: boolean;
  manual_score_allowed: boolean;
  scoring_method: 'headcount_formula' | 'yes_no_with_points' | 'manual_only';
  sort_order: number;
};

export type InspectionFacilityType = {
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  sort_order: number;
};

export type InspectionTemplateSection = {
  section_code: string;
  section_label: string;
  description?: string | null;
  sort_order: number;
};

export type InspectionTemplate = {
  facility_type?: InspectionFacilityType | null;
  template: {
    id: string;
    code: string;
    name: string;
    version: string;
    passing_threshold: number;
    conditional_threshold: number;
    facility_type_code?: string | null;
    facility_profile_fields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'email' | 'boolean' | 'select';
      required: boolean;
      sort_order: number;
      options?: string[];
      pair_with?: string;
      hidden?: boolean;
    }>;
  };
  sections: InspectionTemplateSection[];
  eligibility: Array<{
    criterion_code: string;
    criterion_label: string;
    required: boolean;
    sort_order: number;
  }>;
  items: InspectionTemplateItem[];
};

export type InspectionTemplateOption = {
  facility_type: InspectionFacilityType;
  template: InspectionTemplate['template'] | null;
  configured: boolean;
};

export type InspectionScoreBreakdown = {
  credentialing_points: number;
  credentialing_possible: number;
  accreditation_points: number;
  accreditation_possible: number;
};

export type StructuredInspectionPayload = {
  mode: 'draft' | 'submit';
  step: string;
  template_code: string;
  provider_id: string | null;
  inspection_type: string;
  scheduled_date: string;
  inspector_name: string;
  facility_profile: Record<string, string | boolean | null>;
  eligibility: Array<{ criterion_code: string; criterion_label: string; met: boolean; notes: string }>;
  responses: Array<{
    item_code: string;
    response_number?: number | null;
    manual_score?: number | null;
    response_boolean?: boolean | null;
    remark: string;
  }>;
  team: Array<{ name: string; role: string; inspection_date: string; signature_data: string }>;
};

function secureError(error: { code?: string; message?: string }, fallback: string): SecureContractError {
  const code = error.code === 'P0001' && error.message?.includes('ACCESS_RESTRICTED') ? 'ACCESS_RESTRICTED' : 'SECURE_CONTRACT_UNAVAILABLE';
  return new SecureContractError(code, error.message || fallback);
}

export async function getInspectionTemplate(templateCode: string) {
  if (useMockData) return null as InspectionTemplate | null;
  const { data, error } = await supabase.rpc('nmis_get_inspection_template', { p_template_code: templateCode });
  if (error) throw secureError(error, 'Failed to load the inspection template');
  return data as InspectionTemplate;
}

export async function getInspectionTemplateOptions() {
  if (useMockData) return [] as InspectionTemplateOption[];
  const { data, error } = await supabase.rpc('nmis_list_inspection_template_options');
  if (error) throw secureError(error, 'Failed to load inspection facility types');
  return (data || []) as InspectionTemplateOption[];
}

export async function saveStructuredInspection(inspectionId: string | null, payload: StructuredInspectionPayload) {
  if (useMockData) return { inspection_id: inspectionId || `mock-inspection-${Date.now()}` };
  const { data, error } = await supabase.rpc('nmis_save_structured_inspection', { p_inspection_id: inspectionId, p_payload: payload });
  if (error) throw secureError(error, 'Failed to save the structured inspection');
  return data as {
    inspection_id: string;
    status: string;
    total_points: number;
    total_possible: number;
    overall_score: number;
    credentialing_points: number;
    credentialing_possible: number;
    accreditation_points: number;
    accreditation_possible: number;
    recommendation: string;
  };
}

export async function getStructuredInspection(inspectionId: string) {
  if (useMockData) return null;
  const { data, error } = await supabase.rpc('nmis_get_structured_inspection', { p_inspection_id: inspectionId });
  if (error) throw secureError(error, 'Failed to load the structured inspection');
  return data;
}
