import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerDocumentsService } from '../../services/providers/providerDocumentsService';

export function useProviderDocuments(providerId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['provider-documents', providerId],
    queryFn: () => providerDocumentsService.getDocuments(providerId!),
    enabled: Boolean(enabled && providerId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewProviderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status, reviewNotes }: { documentId: string; status: string; reviewNotes?: string }) =>
      providerDocumentsService.reviewDocument(documentId, status, reviewNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-documents'] });
    },
  });
}
