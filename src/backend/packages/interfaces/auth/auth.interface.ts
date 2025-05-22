/**
 * Authentication interfaces for the AUSTA SuperApp backend
 * Defines standardized data structures for authentication across all services.
 */

/**
 * Represents an authentication session with tokens and expiration
 * Used for maintaining user sessions across the application
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
 * Standard payload structure for JWT tokens used across the application
 * Ensures consistent token content across all services
 * Implements RFC 7519 registered claims with AUSTA SuperApp specific extensions
 */
export interface JwtPayload {
  /**
   * Issuer (RFC 7519) - Identifies the principal that issued the JWT
   * In AUSTA SuperApp, this is typically the auth service URL or identifier
   */
  iss: string;
  
  /**
   * Subject (RFC 7519) - Identifies the principal that is the subject of the JWT
   * In AUSTA SuperApp, this is the user ID
   */
  sub: string;
  
  /**
   * Audience (RFC 7519) - Identifies the recipients that the JWT is intended for
   * Can be a string or an array of strings
   */
  aud: string | string[];
  
  /**
   * Expiration Time (RFC 7519) - Identifies when the JWT expires
   * Timestamp in seconds since epoch (NumericDate)
   */
  exp: number;
  
  /**
   * Not Before (RFC 7519) - Identifies the time before which the JWT must not be accepted
   * Timestamp in seconds since epoch (NumericDate)
   */
  nbf?: number;
  
  /**
   * Issued At (RFC 7519) - Identifies when the JWT was issued
   * Timestamp in seconds since epoch (NumericDate)
   */
  iat: number;
  
  /**
   * JWT ID (RFC 7519) - Provides a unique identifier for the JWT
   * Used to prevent the JWT from being replayed (allows a token to be used only once)
   */
  jti?: string;
  
  /**
   * User's roles for authorization purposes
   * AUSTA SuperApp specific claim for role-based access control
   */
  roles: string[];
  
  /**
   * User's permissions for fine-grained access control
   * AUSTA SuperApp specific claim for attribute-based access control
   */
  permissions?: string[];
  
  /**
   * Journey context for the token (if applicable)
   * AUSTA SuperApp specific claim for journey-based context
   */
  journeyContext?: string;
}

/**
 * Authentication request payload for login
 */
export interface AuthLoginRequest {
  /**
   * User's email address or username
   */
  username: string;
  
  /**
   * User's password
   */
  password: string;
  
  /**
   * Optional MFA code for multi-factor authentication
   */
  mfaCode?: string;
}

/**
 * Authentication response containing session information
 */
export interface AuthLoginResponse {
  /**
   * Authentication session data
   */
  session: AuthSession;
  
  /**
   * User information returned after successful authentication
   */
  user: {
    /**
     * User's unique identifier
     */
    id: string;
    
    /**
     * User's email address
     */
    email: string;
    
    /**
     * User's display name
     */
    name: string;
    
    /**
     * User's assigned roles
     */
    roles: string[];
  };
  
  /**
   * Whether multi-factor authentication is required
   */
  requiresMfa?: boolean;
}

/**
 * Request to refresh an authentication token
 */
export interface AuthRefreshRequest {
  /**
   * Refresh token used to obtain a new access token
   */
  refreshToken: string;
}

/**
 * OAuth provider types supported by the application
 */
export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  HEALTHCARE_PROVIDER = 'healthcare_provider'
}

/**
 * OAuth authentication request
 */
export interface OAuthRequest {
  /**
   * OAuth provider to authenticate with
   */
  provider: OAuthProvider;
  
  /**
   * Authorization code from the OAuth provider
   */
  code: string;
  
  /**
   * Redirect URI used in the OAuth flow
   */
  redirectUri: string;
}

/**
 * Multi-factor authentication configuration
 */
export interface MfaConfig {
  /**
   * Whether MFA is enabled for the user
   */
  enabled: boolean;
  
  /**
   * Type of MFA method (e.g., 'totp', 'sms')
   */
  method: 'totp' | 'sms' | 'email';
  
  /**
   * Phone number for SMS-based MFA (if applicable)
   */
  phoneNumber?: string;
  
  /**
   * Email address for email-based MFA (if applicable)
   */
  email?: string;
}