/**
 * Authentication state types for the AUSTA SuperApp
 * 
 * This file defines the AuthState interface that tracks the current authentication status
 * and session within the application. It is used by components that need to render
 * differently based on authentication state (e.g., protected routes, conditional UI elements)
 * and provides a standardized way to handle authentication state management across platforms.
 */

import { AuthSession } from './session.types';

/**
 * Represents the current state of authentication in the application
 * 
 * This interface is used by authentication providers, hooks, and UI components
 * to determine the current authentication status and access the session data
 * when available.
 * 
 * @example
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
 * return <AuthenticatedContent userId={session.userId} />;
 */
export interface AuthState {
  /**
   * The current authentication session if available, null otherwise
   * 
   * Contains the JWT tokens and expiration information needed for
   * authenticated API requests and session management.
   */
  session: AuthSession | null;
  
  /**
   * Current authentication status
   * 
   * - 'authenticated': User is logged in with a valid session
   * - 'loading': Authentication state is being determined (e.g., during token validation)
   * - 'unauthenticated': User is not logged in or session has expired
   */
  status: 'authenticated' | 'loading' | 'unauthenticated';
}