const SESSION_KEY = 'nmis-auth-session';

export function getAuthToken() {
  if (typeof window === 'undefined') return false;

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;

  try {
    const session = JSON.parse(raw) as { expiresAt?: string };
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return false;
  }
}

export function signIn() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'authenticated', expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString() }));
  }
}

export function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
