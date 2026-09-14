import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../../services/notifications/notificationsService';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsService.getNotifications(unreadOnly),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
