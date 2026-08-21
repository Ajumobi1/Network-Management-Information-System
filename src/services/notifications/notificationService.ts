import { notificationRepository } from '../../repositories/notifications/notificationRepository';
import { SystemNotification } from '../../types/notifications/notificationTypes';

export const notificationService = {
  async getNotifications(unreadOnly = false): Promise<SystemNotification[]> {
    return notificationRepository.fetchNotifications(unreadOnly);
  },

  async markAsRead(id: string): Promise<boolean> {
    return notificationRepository.markAsRead(id);
  }
};
