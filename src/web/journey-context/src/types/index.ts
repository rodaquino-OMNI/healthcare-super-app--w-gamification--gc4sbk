/**
 * Journey Context Types
 * 
 * This file exports types used throughout the journey-context package.
 * It provides a central location for type definitions to ensure consistency.
 */

// Re-export auth types for convenience
export { AuthSession, JwtPayload } from '@austa/interfaces/auth';
export { AuthUser } from '@austa/interfaces/auth/user.types';

/**
 * Authentication status type
 */
export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

/**
 * Authentication state interface
 */
export interface AuthState {
  session: AuthSession | null;
  status: AuthStatus;
  user: AuthUser | null;
}

/**
 * Authentication error interface
 */
export interface AuthError extends Error {
  code?: string;
  details?: Record<string, any>;
}

/**
 * Storage hook return type
 */
export interface UseStorageReturn<T> {
  value: T | null;
  setValue: (value: T | null) => Promise<void>;
  removeValue: () => Promise<void>;
  error: Error | null;
  isLoading: boolean;
}