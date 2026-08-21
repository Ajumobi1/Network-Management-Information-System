import { providerDocumentsRepository, ProviderDocumentRecord } from '../../repositories/providers/providerDocumentsRepository';

export const providerDocumentsService = {
  async getDocuments(providerId: string): Promise<ProviderDocumentRecord[]> {
    return providerDocumentsRepository.listDocuments(providerId);
  },

  async reviewDocument(documentId: string, status: string, reviewNotes?: string) {
    return providerDocumentsRepository.reviewDocument(documentId, status, reviewNotes);
  },
};
