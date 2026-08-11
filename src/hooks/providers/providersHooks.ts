import { useQuery } from '@tanstack/react-query';
import { fetchProviderDirectory, fetchProviderProfile, fetchProviderRegistrationDraft } from '../../services/providers/providersService';
import { ProviderDirectoryFilters } from '../../types/providers/providerTypes';

export function useProviderDirectory(filters: ProviderDirectoryFilters) {
  return useQuery({
    queryKey: ['providers', 'directory', filters],
    queryFn: () => fetchProviderDirectory(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderProfile(providerId: string) {
  return useQuery({
    queryKey: ['providers', 'profile', providerId],
    queryFn: () => fetchProviderProfile(providerId),
    enabled: Boolean(providerId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProviderRegistrationDraft() {
  return useQuery({
    queryKey: ['providers', 'registrationDraft'],
    queryFn: fetchProviderRegistrationDraft,
    staleTime: 1000 * 60 * 5,
  });
}

