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
    status: session.user.app_metadata?.nmis_status as any,
  };

  return {
    token: session.access_token,
    user,
    expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
  };
}

function mapAuthError(message: string): AuthResult<never> {
  const normalized = message.toLowerCase();
  if (normalized.includes('rate limit') || normalized.includes('too many requests') || normalized.includes('too many attempts') || normalized.includes('429')) {
    return { success: false, error: { code: AuthErrorCode.RATE_LIMITED, message: 'Too many authentication attempts were detected. Wait a few minutes before trying again.' } };
  }
  if (normalized.includes('email not confirmed') || normalized.includes('email_not_confirmed')) {
    return { success: false, error: { code: AuthErrorCode.EMAIL_NOT_CONFIRMED, message: 'This account has not been confirmed. Open the latest confirmation email, then sign in with the exact email address used to create the account.' } };
  }
  if (normalized.includes('invalid login') || normalized.includes('invalid credentials')) {
    return { success: false, error: { code: AuthErrorCode.INVALID_CREDENTIALS, message: 'Email or password is incorrect.' } };
  }
  if (normalized.includes('network') || normalized.includes('fetch')) {
    return { success: false, error: { code: AuthErrorCode.NETWORK, message: 'Unable to reach the authentication service.' } };
  }
  return { success: false, error: { code: AuthErrorCode.UNAUTHORIZED, message: 'Authentication could not be completed.' } };
}

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResult<AuthSession>> {
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

  // Administration & User Management
  async listUsers(): Promise<AuthResult<AuthUser[]>> {
    const { data, error } = await supabase.rpc('nmis_admin_list_users');
    if (error) return mapAuthError(error.message);
    
    const users: AuthUser[] = (data as any[]).map(u => ({
      id: u.id,
      email: u.email,
      name: u.full_name || u.email,
      role: u.role as UserRole,
      isActive: u.status === 'active',
      status: u.status as any
    }));

    return { success: true, data: users };
  },

  async provisionUser(name: string, email: string, password: string, role: UserRole): Promise<AuthResult<null>> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (error) return mapAuthError(error.message);

    if (data.user) {
      // 1. Set the role
      const { error: roleError } = await supabase.rpc('nmis_admin_update_user_role', {
        p_user_id: data.user.id,
        p_role: role
      });
      if (roleError) return mapAuthError(roleError.message);

      // 2. Auto-confirm the user to bypass email verification
      const { error: confirmationError } = await supabase.rpc('nmis_admin_confirm_user', {
        p_user_id: data.user.id
      });
      if (confirmationError) return mapAuthError(confirmationError.message);
    }

    return { success: true, data: null };
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'locked'): Promise<AuthResult<null>> {
    const { error } = await supabase.rpc('nmis_admin_update_user_status', {
      p_user_id: userId,
      p_status: status
    });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },

  async deleteUser(userId: string): Promise<AuthResult<null>> {
    const { error } = await supabase.rpc('nmis_admin_delete_user', {
      p_user_id: userId
    });
    if (error) return mapAuthError(error.message);
    return { success: true, data: null };
  },
  
  async checkUserStatus(userId: string): Promise<'active' | 'suspended' | 'locked' | 'pending' | 'deleted'> {
    try {
      const { data, error } = await supabase.rpc('nmis_check_user_status', {
        p_user_id: userId
      });
      
      if (error) {
        // If RPC fails because user doesn't exist, they are likely deleted
        if (error.message.includes('not found') || error.code === 'P0002') return 'deleted';
        return 'active'; // Default to active on transient errors
      }
      
      if (!data) return 'deleted';
      return data as any;
    } catch {
      return 'active';
    }
  }
};
