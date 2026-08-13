import { providerMatchingRepository, MatchCandidatesResult } from '../../repositories/reconciliation/providerMatchingRepository';

export const providerMatchingService = {
  async fetchMatchCandidates(
    importSessionId: string,
    providerName: string,
    providerCode?: string,
    lga?: string,
    state?: string
  ): Promise<MatchCandidatesResult> {
    return providerMatchingRepository.getMatchCandidates(
      importSessionId,
      providerName,
      providerCode,
      lga,
      state
    );
  },

  async persistMatchResolution(
    importSessionId: string,
    candidateProviderId: string,
    matchToken: string
  ) {
    return providerMatchingRepository.resolveMatch(
      importSessionId,
      candidateProviderId,
      matchToken
    );
  },
};
