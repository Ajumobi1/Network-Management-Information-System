import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  EnrolmentFilters,
  EnrolleeRecord,
} from '../../types/enrolment/enrolmentTypes';
import { ImportBatch } from '../../types/financial-data';
import { enrolmentService } from '../../services/enrolment/enrolmentService';

export function useEnrolmentFilterOptions() {
  return useQuery({
    queryKey: ['enrolment', 'filter-options'],
    queryFn: () => enrolmentService.fetchEnrolmentFilterOptions(),
    staleTime: 1000 * 60 * 10,
  });
}

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

export function useProviderPopulationSummary(providerId: string, filters: EnrolmentFilters = {}) {
  return useQuery({
    queryKey: ['enrolment', 'provider-population-summary', providerId, filters],
    queryFn: () => enrolmentService.fetchProviderPopulationSummary(providerId, filters),
    enabled: Boolean(providerId),
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
