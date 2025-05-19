/**
 * Authentication Session Interface for the AUSTA SuperApp
 * 
 * This file defines the core interface for managing authentication sessions
 * across both web and mobile platforms. It provides a standardized contract
 * for storing and accessing JWT token data throughout the application.
 * 
 * @packageDocumentation
 */

import { TokenSchema } from '@austa/interfaces/auth';

/**
 * Represents an authenticated user session with JWT tokens and expiration information.
 * 
 * This interface is used across the platform to maintain consistent authentication state
 * and provides the foundation for secure API access through JWT token management.
 * 
 * @example
 * ```typescript
 * // Creating a new auth session
 * const session: AuthSession = {
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   expiresAt: Date.now() + 3600000 // 1 hour from now
 * };
 * ```
 */
export interface AuthSession {
  /**
   * JWT access token used for API authorization
   * 
   * This token should be included in the Authorization header for all authenticated API requests.
   * The token contains encoded user identity and permission claims that are validated by the server.
   * 
   * @see TokenSchema.AccessToken for the detailed token structure
   */
  accessToken: string;
  
  /**
   * JWT refresh token used to obtain a new access token when expired
   * 
   * This token has a longer lifespan than the access token and should be securely stored.
   * It is used to request a new access token without requiring the user to log in again.
   * 
   * @see TokenSchema.RefreshToken for the detailed token structure
   */
  refreshToken: string;
  
  /**
   * Timestamp (in milliseconds since epoch) when the access token expires
   * 
   * This value is used to determine when a token refresh should be triggered.
   * The application should proactively refresh tokens before they expire to
   * maintain a seamless user experience.
   */
  expiresAt: number;
}

/**
 * Type guard to check if an object is a valid AuthSession
 * 
 * @param obj - The object to check
 * @returns True if the object is a valid AuthSession, false otherwise
 */
export function isAuthSession(obj: unknown): obj is AuthSession {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'accessToken' in obj &&
    'refreshToken' in obj &&
    'expiresAt' in obj &&
    typeof (obj as AuthSession).accessToken === 'string' &&
    typeof (obj as AuthSession).refreshToken === 'string' &&
    typeof (obj as AuthSession).expiresAt === 'number'
  );
}