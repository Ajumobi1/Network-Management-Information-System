import { supabase } from '../lib/supabase/supabaseClient';

export function getApiClient() {
  return supabase;
}

export function handleSupabaseError(error: any) {
  if (!error) {
    return null;
  }

  return new Error(error.message ?? 'An unexpected Supabase error occurred.');
}
