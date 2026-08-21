import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerMatchingService } from '../../services/reconciliation/providerMatchingService';

export function useProviderMatchCandidates(
  importSessionId: string | undefined,
  providerName: string | undefined,
  providerCode?: string,
  lga?: string,
  state?: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['provider-match-candidates', importSessionId, providerName, providerCode, lga, state],
    queryFn: () =>
      providerMatchingService.fetchMatchCandidates(
        importSessionId!,
        providerName!,
        providerCode,
        lga,
        state
      ),
    enabled: Boolean(enabled && importSessionId && providerName),
    staleTime: 5 * 60 * 1000,
  });
}

export function useResolveProviderMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      importSessionId,
      candidateProviderId,
      matchToken,
    }: {
      importSessionId: string;
      candidateProviderId: string;
      matchToken: string;
    }) =>
      providerMatchingService.persistMatchResolution(
        importSessionId,
        candidateProviderId,
        matchToken
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-match-candidates'] });
    },
  });
}
