import { providerMatchingRepository, type MatchCandidatesResult, type ProviderMatchCandidate } from '../../repositories/reconciliation/providerMatchingRepository';
import { getFacilityMatchingNames } from '../../constants/facilityAliases';

export const providerMatchingService = {
  async fetchMatchCandidates(
    importSessionId: string,
    providerName: string,
    providerCode?: string,
    lga?: string,
    state?: string
  ): Promise<MatchCandidatesResult> {
    const matchingNames = getFacilityMatchingNames(providerName);
    const candidateResults = await Promise.all(
      matchingNames.map(name => providerMatchingRepository.getMatchCandidates(importSessionId, name, providerCode, lga, state))
    );
    const candidates = new Map<string, ProviderMatchCandidate>();

    candidateResults.forEach(result => {
      result.candidates.forEach(candidate => {
        const previous = candidates.get(candidate.id);
        if (!previous || candidate.match_score > previous.match_score) {
          candidates.set(candidate.id, candidate);
        }
      });
    });

    const primary = candidateResults[0];
    return {
      ...(primary || { import_session_id: importSessionId, query_name: providerName }),
      query_name: providerName,
      candidates: [...candidates.values()].sort((left, right) => right.match_score - left.match_score),
    };
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
