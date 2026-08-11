import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth/authService';
import { AuthError, AuthSession } from '../auth/authTypes';

type AuthContextState = {
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
  signIn: (email: string, password: string, remember: boolean) => Promise<boolean>;
  signOut: () => void;
  forgotPassword: (email: string) => Promise<AuthError | null>;
  resetPassword: (token: string, password: string) => Promise<AuthError | null>;
};

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const currentSession = authService.getSession();
    setSession(currentSession);
    setLoading(false);
  }, []);

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

  const signOut = useCallback(() => {
    authService.signOut();
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

  const resetPassword = useCallback(async (token: string, password: string) => {
    setError(null);
    setLoading(true);
    const response = await authService.resetPassword(token, password);
    setLoading(false);
    if (!response.success) {
      setError(response.error);
      return response.error;
    }
    return null;
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      error,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
    }),
    [session, loading, error, signIn, signOut, forgotPassword, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
