import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProviderDirectory, fetchProviderProfile, fetchProviderRegistrationDraft, registerNewProvider, editDirectoryProvider, changeProviderStatus } from '../../services/providers/providersService';
import { ProviderDirectoryFilters, ProviderDirectoryItem, ProviderLifecycleStatus } from '../../types/providers/providerTypes';

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
    mutationFn: (payload: Omit<ProviderDirectoryItem, 'id'>) => registerNewProvider(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers', 'directory'] });
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProviderDirectoryItem> }) => editDirectoryProvider(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providers', 'directory'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'profile', variables.id] });
    },
  });
}

export function useUpdateProviderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderLifecycleStatus }) => changeProviderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providers', 'directory'] });
      queryClient.invalidateQueries({ queryKey: ['providers', 'profile', variables.id] });
    },
  });
}

