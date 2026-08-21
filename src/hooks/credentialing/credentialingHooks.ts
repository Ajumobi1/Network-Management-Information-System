import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCredentialingApplications, fetchCredentialingApplicationById, changeCredentialingStatus } from '../../services/credentialing/credentialingService';
import { CredentialingFilters, CredentialingStatus } from '../../types/credentialing/credentialingTypes';

export function useCredentialingApplications(filters: CredentialingFilters) {
  return useQuery({
    queryKey: ['credentialing', 'applications', filters],
    queryFn: () => fetchCredentialingApplications(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCredentialingApplication(id: string) {
  return useQuery({
    queryKey: ['credentialing', 'application', id],
    queryFn: () => fetchCredentialingApplicationById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateCredentialingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, comment, reviewer }: { id: string; status: CredentialingStatus; comment?: string; reviewer?: string }) =>
      changeCredentialingStatus(id, status, comment, reviewer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['credentialing', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['credentialing', 'application', variables.id] });
    },
  });
}
