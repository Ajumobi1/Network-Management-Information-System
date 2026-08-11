import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EnrolmentFilters,
  EnrolleeRecord,
} from '../../types/enrolment/enrolmentTypes';
import { ImportBatch } from '../../types/financial-data';
import { enrolmentService } from '../../services/enrolment/enrolmentService';

export function useEnrollees(filters: EnrolmentFilters = {}) {
  return useQuery({
    queryKey: ['enrolment', 'records', filters],
    queryFn: () => enrolmentService.fetchEnrollees(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEnrollee(id: string | null) {
  return useQuery({
    queryKey: ['enrolment', 'record', id],
    queryFn: () => enrolmentService.fetchEnrolleeById(id as string),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEnrolmentAnalytics(filters: EnrolmentFilters = {}) {
  return useQuery({
    queryKey: ['enrolment', 'analytics', filters],
    queryFn: () => enrolmentService.fetchEnrolmentAnalyticsWithFinance(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInsertEnrollees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ records, actor }: { records: EnrolleeRecord[]; actor?: { id: string; email: string } }) => enrolmentService.insertEnrolleeRecords(records, actor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolment'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    },
  });
}

export function useCreateEnrolmentImportBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batch, records, actor }: { batch: Omit<ImportBatch, 'id' | 'uploadedAt'>; records: EnrolleeRecord[]; actor?: { id: string; email: string } }) => enrolmentService.createEnrolmentImportBatch(batch, records, actor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolment'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    },
  });
}
