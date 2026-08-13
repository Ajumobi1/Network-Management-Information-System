import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '../../services/communication/communicationService';
import { CommunicationFilters, CommunicationType, CommunicationChannel, CommunicationPriority } from '../../types/communication/communicationTypes';

export function useCommunications(filters: CommunicationFilters) {
  return useQuery({
    queryKey: ['communications', filters],
    queryFn: () => communicationService.getCommunications(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCommunication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      providerId: string;
      type: CommunicationType;
      subject: string;
      message: string;
      channel: CommunicationChannel;
      priority?: CommunicationPriority;
      assignedOfficer?: string;
      followUpDate?: string;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }) => communicationService.createCommunication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => communicationService.completeFollowUp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });
}
