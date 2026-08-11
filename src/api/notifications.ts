import { getApiClient, handleSupabaseError } from './client';
import { NotificationsRow } from '../lib/supabase/database.types';

export async function getNotifications(userId: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function markNotificationRead(id: string) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).single();
  if (error) throw handleSupabaseError(error);
  return data;
}

export async function createNotification(payload: Partial<NotificationsRow>) {
  const supabase = getApiClient();
  const { data, error } = await supabase.from('notifications').insert(payload).single();
  if (error) throw handleSupabaseError(error);
  return data;
}
