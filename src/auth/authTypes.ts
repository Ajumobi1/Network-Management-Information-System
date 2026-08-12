export type UserRole =
  | 'super-admin'
  | 'executive'
  | 'head-of-network'
  | 'network-officer'
  | 'inspector'
  | 'finance'
  | 'claims'
  | 'customer-service'
  | 'provider';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  avatarUrl?: string;
  isActive?: boolean;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAt: string;
};

export type AuthInvitation = {
  id: string;
  token: string;
  email: string;
  providerName: string;
  providerCompany: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
};

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NETWORK = 'NETWORK',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
