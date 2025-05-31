/**
 * Authentication state types for the AUSTA SuperApp
 * @packageDocumentation
 * @module @austa/interfaces/auth
 */

import { AuthSession } from './session.types';

/**
 * Represents the current state of authentication in the application
 * 
 * This interface is used by authentication providers and hooks to maintain
 * consistent state management across the application. Components can use this
 * to conditionally render based on authentication status and access session data.
 * 
 * @example
 * ```tsx
 * // Using AuthState in a component
 * const { status, session } = useAuth();
 * 
 * if (status === 'loading') {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (status === 'unauthenticated') {
 *   return <LoginForm />;
 * }
 * 
 * // User is authenticated
 * return <ProtectedContent userId={session.userId} />;
 * ```
 */
export interface AuthState {
  /**
   * The current authentication session if available, null otherwise
   * 
   * Contains the access token, refresh token, and expiration information
   * when the user is authenticated. Will be null when status is 'unauthenticated'
   * or 'loading'.
   */
  session: AuthSession | null;
  
  /**
   * Current authentication status:
   * - 'authenticated': User is logged in with a valid session
   * - 'loading': Authentication state is being determined
   * - 'unauthenticated': User is not logged in
   * 
   * This status can be used to conditionally render components based on
   * the authentication state, such as showing loading indicators, login forms,
   * or protected content.
   */
  status: 'authenticated' | 'loading' | 'unauthenticated';
}