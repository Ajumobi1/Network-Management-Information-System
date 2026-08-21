import type { Session } from '@supabase/supabase-js';
import {
  AuthErrorCode,
  AuthResult,
  AuthSession,
  AuthUser,
  UserRole,
} from '../../auth/authTypes';
import { supabase } from '../../lib/supabase/supabaseClient';

const controlledRoles: readonly UserRole[] = [
  'super-admin',
  'network-officer',
];

function controlledRole(session: Session): UserRole | null {
  const candidate = session.user.app_metadata?.nmis_role;
  return typeof candidate === 'string' && (controlledRoles as readonly string[]).includes(candidate)
    ? candidate as UserRole
    : null;
}

function mapSession(session: Session | null): AuthSession | null {
  if (!session) return null;

  const email = session.user.email ?? '';
  const displayName = typeof session.user.user_metadata?.full_name === 'string'
    ? session.user.user_metadata.full_name
    : email || 'NMIS User';
  const avatarUrl = typeof session.user.user_metadata?.avatar_url === 'string'
    ? session.user.user_metadata.avatar_url
    : undefined;

  const user: AuthUser = {
    id: session.user.id,
    name: displayName,
    email,
    role: controlledRole(session),
    avatarUrl,
  };

  return {
    token: session.access_token,
    user,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
  };
}

function mapAuthError(message: string): AuthResult<never> {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
    return { success: false, error: { code: AuthErrorCode.INVALID_CREDENTIALS, message: 'Email or password is incorrect.' } };
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return { success: false, error: { code: AuthErrorCode.NETWORK, message: 'Unable to reach the authentication service.' } };
  }
  return { success: false, error: { code: AuthErrorCode.UNAUTHORIZED, message: 'Authentication could not be completed.' } };
}

export const authService = {
  async signIn(email: string, password: string, remember: boolean): Promise<AuthResult<AuthSession>> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.session) return mapAuthError(error?.message ?? 'No session was returned.');

    const mapped = mapSession(data.session);
    if (!mapped) return mapAuthError('No session was returned.');
    return { success: true, data: mapped };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession();
    return mapSession(data.session);
  },

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(mapSession(session)));
    return () => data.subscription.unsubscribe();
  },

  async forgotPassword(email: string): Promise<AuthResult<null>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },

  async resetPassword(password: string): Promise<AuthResult<null>> {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },
};
