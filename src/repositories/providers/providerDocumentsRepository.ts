import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { providerDirectory } from '../../mocks/providersMocks';

export interface ProviderDocumentRecord {
  id: string;
  provider_id: string;
  type: string;
  name: string;
  expiry_date?: string;
  version?: string;
  status: string;
  created_at?: string;
  file_url?: string | null;
}

export const providerDocumentsRepository = {
  async listDocuments(providerId: string): Promise<ProviderDocumentRecord[]> {
    if (useMockData) {
      const provider = providerDirectory.find((p: { id: string }) => p.id === providerId);
      return ((provider as any)?.documents || []).map((doc: { id?: string; type: string; expiryDate?: string; version?: string; status?: string }, idx: number) => ({
        id: doc.id || `doc-${idx}`,
        provider_id: providerId,
        type: doc.type,
        name: doc.type,
        expiry_date: doc.expiryDate,
        version: doc.version || '1.0',
        status: doc.status || 'Approved',
      }));
    }

    const { data, error } = await supabase.rpc('nmis_list_provider_documents', {
      p_provider_id: providerId,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to list provider documents');
    }

    return (data || []) as ProviderDocumentRecord[];
  },

  async uploadInspectionReport(filePath: string, file: Blob): Promise<void> {
    if (useMockData) return;
    const { error } = await supabase.storage.from('inspection-reports').upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) throw new Error(error.message || 'Failed to upload inspection report');
  },

  async registerInspectionReport(input: { providerId: string; inspectionId: string; filePath: string; fileName: string; version?: string }): Promise<ProviderDocumentRecord> {
    if (useMockData) {
      return { id: `mock-report-${input.inspectionId}`, provider_id: input.providerId, type: 'Inspection Report', name: input.fileName, version: input.version || '1.0', status: 'Approved', file_url: input.filePath };
    }
    const { data, error } = await supabase.rpc('nmis_register_inspection_report', {
      p_provider_id: input.providerId,
      p_inspection_id: input.inspectionId,
      p_file_path: input.filePath,
      p_file_name: input.fileName,
      p_version: input.version || '1.0',
    });
    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to register inspection report');
    }
    return data as ProviderDocumentRecord;
  },

  async getDownloadUrl(filePath: string): Promise<string> {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    if (useMockData) return filePath;
    const { data, error } = await supabase.storage.from('inspection-reports').createSignedUrl(filePath, 900);
    if (error || !data?.signedUrl) throw new Error(error?.message || 'Unable to create a secure inspection report download link');
    return data.signedUrl;
  },

  async reviewDocument(documentId: string, status: string, reviewNotes?: string): Promise<{ success: boolean; status: string }> {
    if (useMockData) {
      return { success: true, status };
    }

    const { data, error } = await supabase.rpc('nmis_review_provider_document', {
      p_document_id: documentId,
      p_status: status,
      p_review_notes: reviewNotes || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to review document');
    }

    return data;
  },
};
