import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintService } from '../../services/complaints/complaintService';
import { ComplaintFilters, ComplaintRecord, ComplaintStatus, ComplaintCategory, ComplaintPriority } from '../../types/complaints/complaintTypes';

export function useComplaints(filters: ComplaintFilters) {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: () => complaintService.getComplaints(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      providerId: string;
      title: string;
      category: ComplaintCategory;
      priority: ComplaintPriority;
      description: string;
      assignedTo?: string;
    }) => complaintService.createComplaint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, resolutionNotes }: { id: string; status: ComplaintStatus; resolutionNotes?: string }) =>
      complaintService.updateStatus(id, status, resolutionNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint-history', variables.id] });
    },
  });
}

export function useComplaintHistory(id: string) {
  return useQuery({
    queryKey: ['complaint-history', id],
    queryFn: () => complaintService.getComplaintHistory(id),
    enabled: !!id,
  });
}

export function useComplaintMessages(id: string) {
  return useQuery({
    queryKey: ['complaint-messages', id],
    queryFn: () => complaintService.getComplaintMessages(id),
    enabled: !!id,
  });
}

export function useSendComplaintMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      complaintId: string;
      senderType: 'staff' | 'complainant';
      senderName: string;
      senderEmail?: string;
      message: string;
    }) => complaintService.sendMessage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['complaint-messages', variables.complaintId] });
    },
  });
}
