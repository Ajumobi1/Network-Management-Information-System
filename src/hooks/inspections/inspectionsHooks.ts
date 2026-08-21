import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as inspectionsRepository from '../../repositories/inspections/inspectionsRepository';

export function useInspections(providerId?: string) {
  return useQuery({
    queryKey: ['inspections', providerId],
    queryFn: async () => {
      const records = await inspectionsRepository.getInspections(providerId);
      // Map records to match Inspection type expected by UI
      return records.map((i: any) => ({
        id: i.id,
        providerId: i.provider_id || i.providerId,
        providerName: i.providerName || i.provider_name || 'Provider Facility',
        providerCode: i.providerCode || i.provider_code || 'NMIS-FAC',
        providerCategory: i.provider_category || null,
        providerOwnership: i.provider_ownership || null,
        templateId: i.template_id || null,
        templateCode: i.template_code || null,
        facilityTypeCode: i.facility_type_code || null,
        type: i.inspection_type || i.type || 'Routine',
        scheduledAt: i.scheduled_date || i.scheduledAt || new Date().toISOString(),
        inspectorName: i.inspector_name || i.inspectorName || 'Inspector General',
        status: (i.status || 'scheduled').toLowerCase(),
        score: i.score ?? null,
        credentialingPoints: i.credentialing_points ?? null,
        credentialingPossible: i.credentialing_possible ?? null,
        accreditationPoints: i.accreditation_points ?? null,
        accreditationPossible: i.accreditation_possible ?? null,
        rating: i.rating || null,
        findings: i.findings || '',
        correctiveActions: i.corrective_actions || i.correctiveActions || '',
        providerAddress: i.provider_address || null,
        providerLatitude: i.provider_latitude || null,
        providerLongitude: i.provider_longitude || null,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInspection(id: string | null) {
  return useQuery({
    queryKey: ['inspections', id],
    queryFn: async () => {
      if (!id) return null;
      const i = await inspectionsRepository.getInspectionById(id);
      if (!i) return null;
      return {
        id: i.id,
        providerId: i.provider_id,
        providerName: i.providerName || i.provider_name || 'Provider Facility',
        providerCode: i.providerCode || i.provider_code || 'NMIS-FAC',
        providerCategory: i.provider_category || null,
        providerOwnership: i.provider_ownership || null,
        templateId: i.template_id || null,
        templateCode: i.template_code || null,
        facilityTypeCode: i.facility_type_code || null,
        type: i.inspection_type,
        scheduledAt: i.scheduled_date,
        inspectorName: i.inspector_name || 'Inspector General',
        status: (i.status || 'scheduled').toLowerCase(),
        score: i.score ?? null,
        credentialingPoints: i.credentialing_points ?? null,
        credentialingPossible: i.credentialing_possible ?? null,
        accreditationPoints: i.accreditation_points ?? null,
        accreditationPossible: i.accreditation_possible ?? null,
        rating: i.rating || null,
        findings: i.findings || '',
        correctiveActions: i.corrective_actions || '',
      };
    },
    enabled: !!id,
  });
}

export function useInspectionChecklist(inspectionId: string | null) {
  return useQuery({
    queryKey: ['inspections', inspectionId, 'checklist'],
    queryFn: () => (inspectionId ? inspectionsRepository.getInspectionChecklist(inspectionId) : []),
    enabled: !!inspectionId,
  });
}

export function useSaveInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => inspectionsRepository.saveInspection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      inspectionsRepository.updateInspection(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['inspections', variables.id] });
    },
  });
}
