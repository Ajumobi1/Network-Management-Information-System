import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';

export type InspectionTemplateItem = {
  section_code: 'B' | 'C' | 'D';
  item_code: string;
  item_label: string;
  response_type: 'number' | 'boolean';
  min_required: number | null;
  max_points: number;
  scored_when_no: boolean;
  manual_score_allowed: boolean;
  sort_order: number;
};

export type InspectionTemplate = {
  template: {
    id: string;
    code: string;
    name: string;
    version: string;
    passing_threshold: number;
    conditional_threshold: number;
  };
  eligibility: Array<{
    criterion_code: string;
    criterion_label: string;
    required: boolean;
    sort_order: number;
  }>;
  items: InspectionTemplateItem[];
};

export type StructuredInspectionPayload = {
  mode: 'draft' | 'submit';
  step: string;
  template_code: string;
  provider_id: string;
  inspection_type: string;
  scheduled_date: string;
  inspector_name: string;
  facility_profile: Record<string, string | boolean | null>;
  eligibility: Array<{ criterion_code: string; criterion_label: string; met: boolean; notes: string }>;
  responses: Array<{
    item_code: string;
    response_number?: number | null;
    response_boolean?: boolean | null;
    remark: string;
  }>;
  team: Array<{ name: string; role: string; inspection_date: string; signature_data: string }>;
};

function secureError(error: { code?: string; message?: string }, fallback: string): SecureContractError {
  const code = error.code === 'P0001' && error.message?.includes('ACCESS_RESTRICTED')
    ? 'ACCESS_RESTRICTED'
    : 'SECURE_CONTRACT_UNAVAILABLE';
  return new SecureContractError(code, error.message || fallback);
}

export async function getInspectionTemplate(code = 'pharmacy-accreditation'): Promise<InspectionTemplate> {
  if (useMockData) {
    return {
      template: { id: 'mock-template', code, name: 'Pharmacy Facility Accreditation Inspection', version: '1.0', passing_threshold: 75, conditional_threshold: 60 },
      eligibility: [
        { criterion_code: 'NHIA_ACCREDITED', criterion_label: 'Accredited by the National Health Insurance Authority (NHIA)', required: true, sort_order: 1 },
        { criterion_code: 'SMOH_REGISTERED', criterion_label: 'Registered with the Ondo State Ministry of Health (SMOH)', required: true, sort_order: 2 },
        { criterion_code: 'FEES_PAID', criterion_label: 'Prescribed fees paid', required: true, sort_order: 3 },
        { criterion_code: 'STAFF_HEALTH_PLAN', criterion_label: 'Health Insurance Plan for facility staff in place', required: true, sort_order: 4 },
      ],
      items: [],
    };
  }
  const { data, error } = await supabase.rpc('nmis_get_inspection_template', { p_template_code: code });
  if (error) throw secureError(error, 'Failed to load the inspection template');
  return data as InspectionTemplate;
}

export async function saveStructuredInspection(inspectionId: string | null, payload: StructuredInspectionPayload) {
  if (useMockData) {
    return { inspection_id: inspectionId || `mock-inspection-${Date.now()}`, status: payload.mode === 'submit' ? 'Submitted' : 'Draft', eligibility_met: payload.eligibility.every(item => item.met), total_points: 0, total_possible: 0, overall_score: 0, recommendation: 'Not Recommended for Accreditation' };
  }
  const { data, error } = await supabase.rpc('nmis_save_structured_inspection', {
    p_inspection_id: inspectionId,
    p_payload: payload,
  });
  if (error) throw secureError(error, 'Failed to save the structured inspection');
  return data as { inspection_id: string; status: string; eligibility_met: boolean; total_points: number; total_possible: number; overall_score: number; recommendation: string };
}

export async function getStructuredInspection(inspectionId: string) {
  const { data, error } = await supabase.rpc('nmis_get_structured_inspection', { p_inspection_id: inspectionId });
  if (error) throw secureError(error, 'Failed to load the structured inspection');
  return data;
}
