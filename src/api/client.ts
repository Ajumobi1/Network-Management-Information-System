import { assertLiveRuntimeConfiguration } from '../lib/runtime';
import { supabase } from '../lib/supabase/supabaseClient';

export function getApiClient() {
  assertLiveRuntimeConfiguration();
  return supabase;
}

export function handleSupabaseError(error: unknown) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'An unexpected Supabase error occurred.';
  return new Error(message);
}
