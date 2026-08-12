import { AuthErrorCode, AuthResult, AuthSession } from '../../auth/authTypes';

const blocked = <T>(): AuthResult<T> => ({
  success: false,
  error: {
    code: AuthErrorCode.UNAUTHORIZED,
    message: 'Development mock authentication is unavailable outside a development build.',
  },
});

export async function signIn(_email: string, _password: string, _remember: boolean): Promise<AuthResult<AuthSession>> {
  return blocked<AuthSession>();
}

export async function signOut(): Promise<void> {
  return undefined;
}

export async function getSession(): Promise<AuthSession | null> {
  return null;
}

export function subscribe(_listener: (session: AuthSession | null) => void): () => void {
  return () => undefined;
}

export async function forgotPassword(_email: string): Promise<AuthResult<null>> {
  return blocked<null>();
}

export async function resetPassword(_password: string): Promise<AuthResult<null>> {
  return blocked<null>();
}
