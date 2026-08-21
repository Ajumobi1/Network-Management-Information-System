import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCapitationSettings, saveCapitationRate } from '../../services/settings/settingsService';

export function useCapitationSettings() {
  return useQuery({
    queryKey: ['settings', 'capitation-rate'],
    queryFn: fetchCapitationSettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateCapitationRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rate: number) => saveCapitationRate(rate),
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings', 'capitation-rate'], settings);
      queryClient.invalidateQueries({ queryKey: ['enrolment', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-data'] });
    },
  });
}
