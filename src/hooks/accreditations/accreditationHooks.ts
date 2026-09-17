import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAccreditation,
  listAccreditations,
  registerAccreditationReport,
  saveAccreditation,
  uploadAccreditationReport,
  AccreditationPayload,
} from '../../repositories/accreditations/accreditationRepository';

export function useAccreditations() {
  return useQuery({
    queryKey: ['accreditations'],
    queryFn: listAccreditations,
    staleTime: 1000 * 30,
  });
}

export function useAccreditation(id: string | null) {
  return useQuery({
    queryKey: ['accreditation', id],
    queryFn: () => (id ? getAccreditation(id) : null),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveAccreditation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accreditationId, payload }: { accreditationId: string | null; payload: AccreditationPayload }) => saveAccreditation(accreditationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations'] });
    },
  });
}

export function useUploadAccreditationReport() {
  return useMutation({
    mutationFn: ({ filePath, file }: { filePath: string; file: Blob }) => uploadAccreditationReport(filePath, file),
  });
}

export function useRegisterAccreditationReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerAccreditationReport,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accreditations'] });
      queryClient.invalidateQueries({ queryKey: ['accreditation', variables.accreditationId] });
    },
  });
}
