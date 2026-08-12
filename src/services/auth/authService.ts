import type { Session } from '@supabase/supabase-js';
import {
  AuthErrorCode,
  AuthResult,
  AuthSession,
  AuthUser,
  UserRole,
} from '../../auth/authTypes';
import { useMockData } from '../../lib/runtime';
import { supabase } from '../../lib/supabase/supabaseClient';
import * as mockAuth from '@nmis/mock-auth';

const controlledRoles: readonly UserRole[] = [
  'super-admin',
  'executive',
  'head-of-network',
  'network-officer',
  'inspector',
  'finance',
  'claims',
  'customer-service',
  'provider',
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
    if (useMockData) return mockAuth.signIn(email, password, remember);

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) return mapAuthError(error?.message ?? 'No session was returned.');

    const mapped = mapSession(data.session);
    if (!mapped) return mapAuthError('No session was returned.');
    return { success: true, data: mapped };
  },

  async signOut(): Promise<void> {
    if (useMockData) return mockAuth.signOut();
    await supabase.auth.signOut();
  },

  async getSession(): Promise<AuthSession | null> {
    if (useMockData) return mockAuth.getSession();
    const { data } = await supabase.auth.getSession();
    return mapSession(data.session);
  },

  subscribe(listener: (session: AuthSession | null) => void): () => void {
    if (useMockData) return mockAuth.subscribe(listener);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => listener(mapSession(session)));
    return () => data.subscription.unsubscribe();
  },

  async forgotPassword(email: string): Promise<AuthResult<null>> {
    if (useMockData) return mockAuth.forgotPassword(email);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },

  async resetPassword(password: string): Promise<AuthResult<null>> {
    if (useMockData) return mockAuth.resetPassword(password);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },
};
