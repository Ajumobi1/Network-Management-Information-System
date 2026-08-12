import { AuthErrorCode, AuthResult, AuthSession, AuthUser } from '../../auth/authTypes';

const mockUsers: Record<string, AuthUser & { password: string }> = {
  'admin@nmis.org': { id: 'mock-admin', name: 'Super Admin', email: 'admin@nmis.org', password: 'Admin123!', role: 'super-admin' },
  'executive@nmis.org': { id: 'mock-executive', name: 'Executive Leader', email: 'executive@nmis.org', password: 'Exec123!', role: 'executive' },
  'inspector@nmis.org': { id: 'mock-inspector', name: 'Field Inspector', email: 'inspector@nmis.org', password: 'Insp123!', role: 'inspector' },
};

let currentSession: AuthSession | null = null;
const listeners = new Set<(session: AuthSession | null) => void>();

function notify(): void {
  listeners.forEach(listener => listener(currentSession));
}

export async function signIn(email: string, password: string, remember: boolean): Promise<AuthResult<AuthSession>> {
  const user = mockUsers[email.trim().toLowerCase()];
  if (!user || user.password !== password) {
    return { success: false, error: { code: AuthErrorCode.INVALID_CREDENTIALS, message: 'Email or password is incorrect.' } };
  }

  currentSession = {
    token: `mock-session-${user.id}-${Date.now()}`,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    expiresAt: new Date(Date.now() + (remember ? 30 : 2) * 60 * 60 * 1000).toISOString(),
  };
  notify();
  return { success: true, data: currentSession };
}

export async function signOut(): Promise<void> {
  currentSession = null;
  notify();
}

export async function getSession(): Promise<AuthSession | null> {
  return currentSession;
}

export function subscribe(listener: (session: AuthSession | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function forgotPassword(email: string): Promise<AuthResult<null>> {
  return mockUsers[email.trim().toLowerCase()]
    ? { success: true, data: null }
    : { success: false, error: { code: AuthErrorCode.NOT_FOUND, message: 'We could not find an account with that email address.' } };
}

export async function resetPassword(_password: string): Promise<AuthResult<null>> {
  return { success: true, data: null };
}
