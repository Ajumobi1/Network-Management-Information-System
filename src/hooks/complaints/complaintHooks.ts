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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
}
