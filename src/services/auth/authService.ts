import { AuthErrorCode, AuthResult, AuthSession, AuthUser, UserRole } from '../../auth/authTypes';

const SESSION_KEY = 'nmis-auth-session';

const fakeUsers: Record<string, AuthUser & { password: string }> = {
  'admin@nmis.org': {
    id: '1',
    name: 'Super Admin',
    email: 'admin@nmis.org',
    password: 'Admin123!',
    role: 'super-admin',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  },
  'executive@nmis.org': {
    id: '2',
    name: 'Executive Leader',
    email: 'executive@nmis.org',
    password: 'Exec123!',
    role: 'executive',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
  'inspector@nmis.org': {
    id: '3',
    name: 'Field Inspector',
    email: 'inspector@nmis.org',
    password: 'Insp123!',
    role: 'inspector',
    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
  },
};

function createSession(user: AuthUser, remember: boolean): AuthSession {
  const expiresAt = new Date(Date.now() + (remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 2)).toISOString();

  return {
    token: `nmis-token-${user.id}-${Date.now()}`,
    user,
    expiresAt,
  };
}

export const authService = {
  async signIn(email: string, password: string, remember: boolean): Promise<AuthResult<AuthSession>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      const normalizedEmail = email.trim().toLowerCase();
      const user = fakeUsers[normalizedEmail];

      if (!user || user.password !== password) {
        return {
          success: false,
          error: {
            code: AuthErrorCode.INVALID_CREDENTIALS,
            message: 'Email or password is incorrect.',
          },
        };
      }

      const session = createSession({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }, remember);

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, data: session };
    } catch (error) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.NETWORK,
          message: 'Unable to reach the authentication server. Please try again.',
        },
      };
    }
  },

  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expiresAt) <= new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async forgotPassword(email: string): Promise<AuthResult<null>> {
    await new Promise(resolve => setTimeout(resolve, 700));
    const normalizedEmail = email.trim().toLowerCase();
    if (!fakeUsers[normalizedEmail]) {
      return {
        success: false,
        error: {
          code: AuthErrorCode.NOT_FOUND,
          message: 'We could not find an account with that email address.',
        },
      };
    }

    return { success: true, data: null };
  },

  async resetPassword(token: string, password: string): Promise<AuthResult<null>> {
    await new Promise(resolve => setTimeout(resolve, 700));
    if (token !== 'reset-token') {
      return {
        success: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid or expired reset token.',
        },
      };
    }

    return { success: true, data: null };
  },
};
