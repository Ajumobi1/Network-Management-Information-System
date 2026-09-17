import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import type { InspectionTemplate, InspectionTemplateItem, InspectionTemplateOption } from '../inspections/structuredInspectionRepository';

export type AccreditationResponse = {
  item_code: string;
  response_number?: number | null;
  manual_score?: number | null;
  response_boolean?: boolean | null;
  remark: string;
};

export type AccreditationPayload = {
  mode: 'draft' | 'submit';
  step: string;
  template_code: string;
  scheduled_date: string;
  facility_profile: Record<string, string | boolean | null>;
  eligibility: Array<{ criterion_code: string; criterion_label: string; met: boolean; notes: string }>;
  responses: AccreditationResponse[];
  team: Array<{ name: string; role: string; inspection_date: string; signature_data: string }>;
};

export type AccreditationListItem = {
  id: string;
  facility_name: string;
  facility_type_code: string;
  facility_type_name: string;
  template_code: string;
  assessment_date: string;
  status: string;
  workflow_step: string;
  overall_score: number | null;
  total_points: number;
  total_possible: number;
  credentialing_points: number;
  credentialing_possible: number;
  accreditation_points: number;
  accreditation_possible: number;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  report_path?: string | null;
  report_file_name?: string | null;
};

function secureError(error: { code?: string; message?: string }, fallback: string): SecureContractError {
  const code = error.code === 'P0001' && error.message?.includes('ACCESS_RESTRICTED') ? 'ACCESS_RESTRICTED' : 'SECURE_CONTRACT_UNAVAILABLE';
  return new SecureContractError(code, error.message || fallback);
}

export async function listAccreditations(): Promise<AccreditationListItem[]> {
  if (useMockData) return [];
  const { data, error } = await supabase.rpc('nmis_list_accreditations');
  if (error) throw secureError(error, 'Failed to load accreditation records');
  return (data || []) as AccreditationListItem[];
}

export async function getAccreditation(id: string) {
  const { data, error } = await supabase.rpc('nmis_get_accreditation', { p_accreditation_id: id });
  if (error) throw secureError(error, 'Failed to load the accreditation record');
  return data as {
    accreditation: AccreditationListItem & { template_id: string; created_by: string | null };
    template: InspectionTemplate;
    facility_profile: Record<string, unknown>;
    eligibility: Array<{ criterion_code: string; criterion_label: string; met: boolean; notes: string }>;
    responses: Array<{ item_code: string; response_number: number | null; response_boolean: boolean | null; manual_score: number | null; remark: string | null }>;
    team: Array<{ id: string; member_name: string; member_role: string; inspection_date: string; signature_data: string }>;
  };
}

export async function saveAccreditation(accreditationId: string | null, payload: AccreditationPayload) {
  if (useMockData) {
    return {
      accreditation_id: accreditationId || `mock-accreditation-${Date.now()}`,
      status: payload.mode === 'submit' ? 'Submitted' : 'Draft',
      total_points: 0,
      total_possible: 0,
      overall_score: 0,
      credentialing_points: 0,
      credentialing_possible: 0,
      accreditation_points: 0,
      accreditation_possible: 0,
      recommendation: 'Not Recommended for Accreditation',
    };
  }
  const { data, error } = await supabase.rpc('nmis_save_accreditation', {
    p_accreditation_id: accreditationId,
    p_payload: payload,
  });
  if (error) throw secureError(error, 'Failed to save the accreditation record');
  return data as {
    accreditation_id: string;
    status: string;
    total_points: number;
    total_possible: number;
    overall_score: number;
    credentialing_points: number;
    credentialing_possible: number;
    accreditation_points: number;
    accreditation_possible: number;
    recommendation: string;
    template_code: string;
    facility_type_code: string;
  };
}

export async function registerAccreditationReport(input: { accreditationId: string; filePath: string; fileName: string }) {
  const { data, error } = await supabase.rpc('nmis_register_accreditation_report', {
    p_accreditation_id: input.accreditationId,
    p_file_path: input.filePath,
    p_file_name: input.fileName,
  });
  if (error) throw secureError(error, 'Failed to register the accreditation report');
  return data as { success: boolean; accreditation_id: string; file_path: string; file_name: string };
}

export async function uploadAccreditationReport(filePath: string, file: Blob) {
  const { error } = await supabase.storage.from('accreditation-reports').upload(filePath, file, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(error.message || 'Failed to upload accreditation report');
}

export async function getAccreditationReportUrl(filePath: string) {
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const { data, error } = await supabase.storage.from('accreditation-reports').createSignedUrl(filePath, 900);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Unable to create a secure accreditation report download link');
  return data.signedUrl;
}

export type AccreditationTemplateOption = InspectionTemplateOption & { facility_type: InspectionTemplateOption['facility_type'] };

export type { InspectionTemplateItem };
