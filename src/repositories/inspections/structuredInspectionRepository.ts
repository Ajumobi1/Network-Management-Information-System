import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';

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
  provider_id: string;
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
  const code = error.code === 'P0001' && error.message?.includes('ACCESS_RESTRICTED')
    ? 'ACCESS_RESTRICTED'
    : 'SECURE_CONTRACT_UNAVAILABLE';
  return new SecureContractError(code, error.message || fallback);
}

export async function getInspectionTemplate(code = 'pharmacy-accreditation'): Promise<InspectionTemplate> {
  if (useMockData) {
    return {
      facility_type: { code: 'pharmacy', name: 'Pharmacy', description: 'Community and hospital pharmacy accreditation inspections.', active: true, sort_order: 1 },
      template: { id: 'mock-template', code, name: 'Pharmacy Facility Accreditation Inspection', version: '1.0', passing_threshold: 75, conditional_threshold: 60, facility_type_code: 'pharmacy', facility_profile_fields: [] },
      sections: [],
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

export async function getInspectionTemplateOptions(): Promise<InspectionTemplateOption[]> {
  if (useMockData) {
    return [
      { facility_type: { code: 'pharmacy', name: 'Pharmacy', description: 'Community and hospital pharmacy accreditation inspections.', active: true, sort_order: 1 }, template: { id: 'mock-template', code: 'pharmacy-accreditation', name: 'Pharmacy Facility Accreditation Inspection', version: '1.0', passing_threshold: 75, conditional_threshold: 60, facility_type_code: 'pharmacy', facility_profile_fields: [] }, configured: true },
      { facility_type: { code: 'hospital', name: 'Hospital', description: 'Hospital facility inspection template.', active: true, sort_order: 2 }, template: null, configured: false },
      { facility_type: { code: 'optical-centre', name: 'Optical Centre', description: 'Optical centre inspection template.', active: true, sort_order: 3 }, template: null, configured: false },
      { facility_type: { code: 'dental-centre', name: 'Dental Centre', description: 'Dental centre inspection template.', active: true, sort_order: 4 }, template: null, configured: false },
      { facility_type: { code: 'diagnostic-centre', name: 'Diagnostic Centre', description: 'Diagnostic centre inspection template.', active: true, sort_order: 5 }, template: null, configured: false },
    ];
  }
  const { data, error } = await supabase.rpc('nmis_list_inspection_template_options');
  if (error) throw secureError(error, 'Failed to load inspection facility types');
  return (data || []) as InspectionTemplateOption[];
}

export type InspectionTemplateAdminPayload = {
  template_code: string;
  facility_type_code: string;
  name: string;
  version: string;
  passing_threshold: number;
  conditional_threshold: number;
  active: boolean;
  facility_profile_fields: Array<Record<string, unknown>>;
  sections: Array<Record<string, unknown>>;
  eligibility: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
};

export async function adminUpsertInspectionTemplate(payload: InspectionTemplateAdminPayload): Promise<InspectionTemplate> {
  const { data, error } = await supabase.rpc('nmis_admin_upsert_inspection_template', { p_payload: payload });
  if (error) throw secureError(error, 'Failed to save the inspection template');
  return data as InspectionTemplate;
}

export async function saveStructuredInspection(inspectionId: string | null, payload: StructuredInspectionPayload) {
  if (useMockData) {
    return { inspection_id: inspectionId || `mock-inspection-${Date.now()}`, status: payload.mode === 'submit' ? 'Submitted' : 'Draft', eligibility_met: payload.eligibility.every(item => item.met), total_points: 0, total_possible: 0, overall_score: 0, credentialing_points: 0, credentialing_possible: 0, accreditation_points: 0, accreditation_possible: 0, recommendation: 'Not Recommended for Accreditation' };
  }
  const { data, error } = await supabase.rpc('nmis_save_structured_inspection', {
    p_inspection_id: inspectionId,
    p_payload: payload,
  });
  if (error) throw secureError(error, 'Failed to save the structured inspection');
  return data as { inspection_id: string; status: string; eligibility_met: boolean; total_points: number; total_possible: number; overall_score: number; credentialing_points: number; credentialing_possible: number; accreditation_points: number; accreditation_possible: number; recommendation: string };
}

export async function getStructuredInspection(inspectionId: string) {
  const { data, error } = await supabase.rpc('nmis_get_structured_inspection', { p_inspection_id: inspectionId });
  if (error) throw secureError(error, 'Failed to load the structured inspection');
  return data;
}
