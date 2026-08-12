import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as inspectionsService from '../../services/inspections/inspectionsService';
import { Inspection, InspectionFilters } from '../../types/inspections/inspectionsTypes';
import { InspectionsRow } from '../../lib/supabase/database.types';

export function useInspections(filters?: InspectionFilters) {
  return useQuery({
    queryKey: ['inspections', filters],
    queryFn: async () => {
      const all = await inspectionsService.fetchInspections();
      if (!filters) return all;

      return all.filter(item => {
        if (filters.status && filters.status !== 'all' && item.status !== filters.status) return false;
        if (filters.type && filters.type !== 'all' && item.type !== filters.type) return false;
        if (filters.rating && filters.rating !== 'all' && item.rating !== filters.rating) return false;
        if (filters.search) {
          const query = filters.search.toLowerCase();
          return (
            item.providerName.toLowerCase().includes(query) ||
            item.providerCode.toLowerCase().includes(query) ||
            item.inspectorName.toLowerCase().includes(query)
          );
        }
        return true;
      });
    },
  });
}

export function useInspection(id: string | null) {
  return useQuery({
    queryKey: ['inspections', id],
    queryFn: () => (id ? inspectionsService.fetchInspectionById(id) : null),
    enabled: !!id,
  });
}

export function useInspectionChecklist(inspectionId: string | null) {
  return useQuery({
    queryKey: ['inspections', inspectionId, 'checklist'],
    queryFn: () => (inspectionId ? inspectionsService.fetchInspectionChecklist(inspectionId) : []),
    enabled: !!inspectionId,
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InspectionsRow> }) =>
      inspectionsService.updateInspection(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspections', variables.id] });
    },
  });
}
