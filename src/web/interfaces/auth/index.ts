/**
 * Authentication Interfaces
 * 
 * This barrel file exports all authentication-related interfaces for the AUSTA SuperApp.
 * It provides a single entry point for importing auth interfaces, simplifying imports
 * and ensuring consistency across the codebase.
 */

/**
 * Represents an authentication session with tokens and expiration
 */
export interface AuthSession {
  /**
   * JWT access token for API authorization
   */
  accessToken: string;
  
  /**
   * JWT refresh token used to obtain a new access token when expired
   */
  refreshToken: string;
  
  /**
   * Timestamp (in milliseconds since epoch) when the access token expires
   */
  expiresAt: number;
}

/**
 * Represents the current state of authentication in the application
 */
export interface AuthState {
  /**
   * The current authentication session if available, null otherwise
   */
  session: AuthSession | null;
  
  /**
   * Current authentication status:
   * - 'authenticated': User is logged in with a valid session
   * - 'loading': Authentication state is being determined
   * - 'unauthenticated': User is not logged in
   */
  status: 'authenticated' | 'loading' | 'unauthenticated';
}

/**
 * Represents a decoded JWT token with standard claims
 */
export interface DecodedToken {
  /**
   * Subject (user ID)
   */
  sub: string;
  
  /**
   * Issuer
   */
  iss: string;
  
  /**
   * Audience
   */
  aud: string;
  
  /**
   * Expiration time (in seconds since epoch)
   */
  exp: number;
  
  /**
   * Issued at (in seconds since epoch)
   */
  iat: number;
  
  /**
   * User roles
   */
  roles?: string[];
  
  /**
   * User permissions
   */
  permissions?: string[];
}

/**
 * Represents a user in the authentication system
 */
export interface AuthUser {
  /**
   * Unique identifier for the user
   */
  id: string;
  
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's display name
   */
  displayName: string;
  
  /**
   * URL to the user's profile picture, if available
   */
  profilePictureUrl?: string;
  
  /**
   * User's roles in the system
   */
  roles: string[];
  
  /**
   * User's permissions in the system
   */
  permissions: string[];
}

/**
 * Response from authentication API endpoints
 */
export interface AuthResponse {
  /**
   * Authentication session information
   */
  session: AuthSession;
  
  /**
   * User information
   */
  user: AuthUser;
}

/**
 * Authentication error response
 */
export interface AuthError {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Additional error details, if available
   */
  details?: Record<string, any>;
}