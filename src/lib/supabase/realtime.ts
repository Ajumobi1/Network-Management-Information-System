import { supabase } from './supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function subscribeToTable<T extends Record<string, unknown>>(table: string, callback: (payload: RealtimePostgresChangesPayload<T>) => void) {
  const channel = supabase
    .channel(`table-changes-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback as (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void)
    .subscribe();

  return channel;
}

export function unsubscribe(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}
