import type { PostgrestError } from '@supabase/supabase-js';

export function formatSupabaseError(error: unknown): Error {
  if (!error) {
    return new Error('An unexpected API error occurred.');
  }

  if (error instanceof Error) {
    return error;
  }

  if (isPostgrestError(error)) {
    return new Error(error.message || 'An unexpected Supabase error occurred.');
  }

  return new Error(typeof error === 'string' ? error : 'An unexpected API error occurred.');
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string';
}
