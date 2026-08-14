import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProviderDirectory, fetchProviderProfile, fetchProviderRegistrationDraft, registerNewProvider, editDirectoryProvider, changeProviderStatus, removeDirectoryProvider } from '../../services/providers/providersService';
import { ProviderDirectoryFilters, ProviderLifecycleStatus } from '../../types/providers/providerTypes';
import type { ProviderOperationalUpdate, ProviderRegistrationCommand } from '../../repositories/providers/providersRepository';

function invalidateProviderIntelligence(queryClient: ReturnType<typeof useQueryClient>, providerId?: string) {
  queryClient.invalidateQueries({ queryKey: ['providers', 'directory'] });
  if (providerId) queryClient.invalidateQueries({ queryKey: ['providers', 'profile', providerId] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

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

export function useRegisterProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProviderRegistrationCommand) => registerNewProvider(payload),
    onSuccess: provider => {
      invalidateProviderIntelligence(queryClient, provider.id);
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProviderOperationalUpdate }) => editDirectoryProvider(id, payload),
    onSuccess: (_, variables) => {
      invalidateProviderIntelligence(queryClient, variables.id);
    },
  });
}

export function useUpdateProviderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderLifecycleStatus }) => changeProviderStatus(id, status),
    onSuccess: (_, variables) => {
      invalidateProviderIntelligence(queryClient, variables.id);
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeDirectoryProvider(id),
    onSuccess: (_, id) => {
      invalidateProviderIntelligence(queryClient, id);
    },
  });
}
