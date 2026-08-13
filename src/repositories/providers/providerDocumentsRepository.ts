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
