import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthError, AuthSession } from '../auth/authTypes';
import { authService } from '../services/auth/authService';

type AuthContextState = {
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<AuthError | null>;
  resetPassword: (password: string) => Promise<AuthError | null>;
};

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let active = true;
    void authService.getSession()
      .then(currentSession => {
        if (active) setSession(currentSession);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = authService.subscribe(nextSession => {
      if (active) {
        if (nextSession?.user?.status === 'locked') {
          authService.signOut();
          setSession(null);
        } else {
          setSession(nextSession);
        }
      }
    });

    // Security Heartbeat: Periodically verify session validity against database
    const heartbeat = setInterval(async () => {
      if (active && session?.user?.id) {
        const status = await authService.checkUserStatus(session.user.id);
        if (status === 'locked' || status === 'deleted') {
          await authService.signOut();
          setSession(null);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      active = false;
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, [session?.user?.id]);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    setError(null);
    setLoading(true);
    const response = await authService.signIn(email, password, remember);
    setLoading(false);

    if (!response.success) {
      setError(response.error);
      return false;
    }

    setSession(response.data);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);
    const response = await authService.forgotPassword(email);
    setLoading(false);
    if (!response.success) {
      setError(response.error);
      return response.error;
    }
    return null;
  }, []);

  const resetPassword = useCallback(async (password: string) => {
    setError(null);
    setLoading(true);
    const response = await authService.resetPassword(password);
    setLoading(false);
    if (!response.success) {
      setError(response.error);
      return response.error;
    }
    return null;
  }, []);

  const value = useMemo(
    () => ({ session, loading, error, signIn, signOut, forgotPassword, resetPassword }),
    [session, loading, error, signIn, signOut, forgotPassword, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
