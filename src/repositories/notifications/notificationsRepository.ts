import { fetchTable, useMockData } from '../common';
import { getApiClient } from '../../api/client';
import { formatSupabaseError } from '../../utils/api';
import { apiMocks } from '../../mocks';
import { NotificationsRow } from '../../lib/supabase/database.types';

export async function getNotifications() {
  if (useMockData) {
    return apiMocks.getNotifications();
  }

  return fetchTable<NotificationsRow>('notifications');
}

export async function markNotificationRead(id: string) {
  if (useMockData) {
    return apiMocks.markNotificationRead(id);
  }

  const supabase = getApiClient();
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).single();
  if (error) {
    throw formatSupabaseError(error);
  }

  return data;
}
