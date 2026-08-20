import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUpsertInspectionTemplate, getInspectionTemplate, getInspectionTemplateOptions, getStructuredInspection, saveStructuredInspection, StructuredInspectionPayload, InspectionTemplateAdminPayload } from '../../repositories/inspections/structuredInspectionRepository';

export function useInspectionTemplate(code = 'pharmacy-accreditation', enabled = true) {
  return useQuery({
    queryKey: ['inspection-template', code],
    queryFn: () => getInspectionTemplate(code),
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useInspectionTemplateOptions() {
  return useQuery({
    queryKey: ['inspection-template-options'],
    queryFn: getInspectionTemplateOptions,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useStructuredInspection(id: string | null) {
  return useQuery({
    queryKey: ['structured-inspection', id],
    queryFn: () => (id ? getStructuredInspection(id) : null),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAdminUpsertInspectionTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InspectionTemplateAdminPayload) => adminUpsertInspectionTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-template-options'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-template'] });
    },
  });
}

export function useSaveStructuredInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inspectionId, payload }: { inspectionId: string | null; payload: StructuredInspectionPayload }) => saveStructuredInspection(inspectionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    },
  });
}
