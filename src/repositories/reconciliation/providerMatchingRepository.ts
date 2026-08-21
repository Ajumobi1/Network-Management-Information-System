import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';

export interface ProviderMatchCandidate {
  id: string;
  provider_code: string;
  provider_name: string;
  category: string;
  ownership: string;
  state: string;
  lga: string;
  status: string;
  match_score: number;
  match_reason: string;
}

export interface MatchCandidatesResult {
  import_session_id: string;
  query_name: string;
  candidates: ProviderMatchCandidate[];
}

export const providerMatchingRepository = {
  async getMatchCandidates(
    importSessionId: string,
    providerName: string,
    providerCode?: string,
    lga?: string,
    state?: string
  ): Promise<MatchCandidatesResult> {
    const { data, error } = await supabase.rpc('nmis_import_match_candidates', {
      p_import_session_id: importSessionId,
      p_provider_name: providerName,
      p_provider_code: providerCode || null,
      p_lga: lga || null,
      p_state: state || null,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to fetch match candidates');
    }

    return data as MatchCandidatesResult;
  },

  async resolveMatch(
    importSessionId: string,
    candidateProviderId: string,
    matchToken: string
  ): Promise<{ success: boolean; resolution_id: string; matched_provider: any }> {
    const { data, error } = await supabase.rpc('nmis_resolve_provider_match', {
      p_import_session_id: importSessionId,
      p_candidate_provider_id: candidateProviderId,
      p_match_token: matchToken,
    });

    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to resolve provider match');
    }

    return data;
  },
};
