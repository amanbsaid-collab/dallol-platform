export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
};

/** Authentication boundary. Replace the implementation with the selected provider. */
export interface AuthProvider {
  getSession(): Promise<AuthSession | null>;
  requireSession(): Promise<AuthSession>;
  signOut(): Promise<void>;
}

export async function requireSession(): Promise<AuthSession> {
  throw new Error('AUTH_NOT_CONFIGURED');
}
