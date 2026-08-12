import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  inertSupabaseRuntimeConfig,
  supabaseRuntimeConfig,
  useMockData,
} from '../runtime';

const runtime = useMockData ? inertSupabaseRuntimeConfig : supabaseRuntimeConfig;

export const supabase: SupabaseClient = createClient(runtime.url || inertSupabaseRuntimeConfig.url, runtime.anonKey || inertSupabaseRuntimeConfig.anonKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
