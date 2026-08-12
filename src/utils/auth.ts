import { accessRestricted } from '../lib/security/secureContracts';

/**
 * Legacy compatibility surface only. Browser-created local sessions are not an
 * NMIS authorization source; verified Supabase Auth is required instead.
 */
export function getAuthToken(): null {
  return null;
}

export function signIn(): never {
  throw accessRestricted('legacy local authentication');
}

export function signOut(): void {
  // Verified Supabase session sign-out is owned by AuthContext.
}
