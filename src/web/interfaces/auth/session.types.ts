/**
 * Authentication session types for the AUSTA SuperApp
 * @packageDocumentation
 * @module @austa/interfaces/auth
 */

/**
 * Represents an authentication session with tokens and expiration
 * 
 * This interface is used to store and manage JWT authentication tokens
 * across the application. It contains the necessary information to
 * authenticate API requests and determine when tokens need to be refreshed.
 * 
 * @example
 * ```typescript
 * // Using AuthSession in an API request
 * const makeAuthenticatedRequest = async (url: string, session: AuthSession) => {
 *   const response = await fetch(url, {
 *     headers: {
 *       Authorization: `Bearer ${session.accessToken}`
 *     }
 *   });
 *   
 *   return response.json();
 * };
 * 
 * // Checking if a session is expired
 * const isSessionExpired = (session: AuthSession): boolean => {
 *   return Date.now() >= session.expiresAt;
 * };
 * ```
 */
export interface AuthSession {
  /**
   * JWT access token for API authorization
   * 
   * This token should be included in the Authorization header
   * for all authenticated API requests. It contains encoded user
   * information and permissions.
   */
  accessToken: string;
  
  /**
   * JWT refresh token used to obtain a new access token when expired
   * 
   * This token has a longer lifespan than the access token and is used
   * to request a new access token when the current one expires, without
   * requiring the user to log in again.
   */
  refreshToken: string;
  
  /**
   * Timestamp (in milliseconds since epoch) when the access token expires
   * 
   * This value can be compared with Date.now() to determine if the
   * access token has expired and needs to be refreshed.
   */
  expiresAt: number;
}