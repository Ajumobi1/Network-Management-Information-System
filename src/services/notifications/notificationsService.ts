import * as notificationsRepository from '../../repositories/notifications';
import { NotificationsRow } from '../../lib/supabase/database.types';

export async function fetchNotifications(): Promise<NotificationsRow[]> {
  return notificationsRepository.getNotifications();
}

export async function markNotificationRead(id: string): Promise<NotificationsRow> {
  return notificationsRepository.markNotificationRead(id);
}
