import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCapitationRecord, fetchCapitationRecords, transitionCapitation } from '../../services/capitation/capitationService';
import { CapitationAction, CapitationFilters } from '../../types/capitation';

export function useCapitationRecords(filters: CapitationFilters) {
  return useQuery({
    queryKey: ['capitation', 'records', filters],
    queryFn: () => fetchCapitationRecords(filters),
    staleTime: 1000 * 60 * 3,
  });
}

export function useCapitationRecord(id: string | null) {
  return useQuery({
    queryKey: ['capitation', 'record', id],
    queryFn: () => fetchCapitationRecord(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 3,
  });
}

export function useCapitationTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, comment }: { id: string; action: CapitationAction; comment?: string }) => transitionCapitation(id, action, comment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capitation', 'records'] });
      queryClient.invalidateQueries({ queryKey: ['capitation', 'record', variables.id] });
    },
  });
}

export function useBulkCapitationTransition() {
  const transition = useCapitationTransition();
  return useMutation({
    mutationFn: async ({ ids, action, comment }: { ids: string[]; action: CapitationAction; comment?: string }) => {
      const results = [];
      for (const id of ids) {
        results.push(await transition.mutateAsync({ id, action, comment }));
      }
      return results;
    },
  });
}
