import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInspectionTemplate, saveStructuredInspection, StructuredInspectionPayload } from '../../repositories/inspections/structuredInspectionRepository';

export function useInspectionTemplate(code = 'pharmacy-accreditation') {
  return useQuery({
    queryKey: ['inspection-template', code],
    queryFn: () => getInspectionTemplate(code),
    staleTime: 1000 * 60 * 10,
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
