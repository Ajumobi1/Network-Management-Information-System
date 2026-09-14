import { notificationsRepository } from '../../repositories/notifications/notificationsRepository';
import { SystemNotification } from '../../types/notifications/notificationTypes';

export const notificationsService = {
  async getNotifications(unreadOnly = false): Promise<SystemNotification[]> {
    return notificationsRepository.fetchNotifications(unreadOnly);
  },

  async markAsRead(id: string): Promise<boolean> {
    return notificationsRepository.markAsRead(id);
  },
};
