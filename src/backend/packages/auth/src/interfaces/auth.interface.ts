/**
 * Authentication interfaces for the AUSTA SuperApp
 * Defines standardized interfaces for authentication requests and responses
 * across all journeys and platforms (web and mobile).
 */

/**
 * Represents the result of an authentication operation
 * Contains the authentication token, user information, and status
 */
export interface IAuthResult {
  /**
   * JWT access token for authenticated requests
   */
  accessToken: string;
  
  /**
   * JWT refresh token for obtaining new access tokens
   */
  refreshToken?: string;
  
  /**
   * User information returned after successful authentication
   */
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    journeyPreferences?: Record<string, unknown>;
  };
  
  /**
   * Indicates if multi-factor authentication is required
   */
  requiresMfa?: boolean;
  
  /**
   * Temporary token provided when MFA is required
   * Used to complete the MFA verification process
   */
  tempToken?: string;
  
  /**
   * Token expiration timestamp in seconds since epoch
   */
  expiresAt: number;
  
  /**
   * Optional error information if authentication was not successful
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Login request payload
 */
export interface ILoginRequest {
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's password
   */
  password: string;
  
  /**
   * Optional remember me flag for extended session
   */
  rememberMe?: boolean;
}

/**
 * Registration request payload
 */
export interface IRegisterRequest {
  /**
   * User's email address
   */
  email: string;
  
  /**
   * User's password
   */
  password: string;
  
  /**
   * User's full name
   */
  name: string;
  
  /**
   * Optional phone number for SMS verification
   */
  phoneNumber?: string;
  
  /**
   * Optional journey-specific preferences
   */
  journeyPreferences?: Record<string, unknown>;
}

/**
 * Multi-factor authentication verification request
 */
export interface IMfaVerifyRequest {
  /**
   * Verification code entered by the user
   */
  code: string;
  
  /**
   * Temporary token received after initial authentication
   */
  tempToken: string;
}

/**
 * Social login request payload
 */
export interface ISocialLoginRequest {
  /**
   * The social provider (e.g., 'google', 'apple', 'facebook')
   */
  provider: string;
  
  /**
   * Provider-specific token or authorization code
   */
  token: string;
  
  /**
   * Additional provider-specific data
   */
  providerData?: Record<string, unknown>;
}

/**
 * Token refresh request payload
 */
export interface IRefreshTokenRequest {
  /**
   * Refresh token used to obtain a new access token
   */
  refreshToken: string;
}

/**
 * Password reset request payload
 */
export interface IPasswordResetRequest {
  /**
   * User's email address
   */
  email: string;
}

/**
 * Password update request payload
 */
export interface IPasswordUpdateRequest {
  /**
   * Reset token received via email
   */
  resetToken: string;
  
  /**
   * New password
   */
  newPassword: string;
}

/**
 * Authentication session information
 * Used by client applications to manage the user session
 */
export interface IAuthSession {
  /**
   * JWT access token for authenticated requests
   */
  accessToken: string;
  
  /**
   * JWT refresh token for obtaining new access tokens
   */
  refreshToken?: string;
  
  /**
   * User information
   */
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    journeyPreferences?: Record<string, unknown>;
  };
  
  /**
   * Token expiration timestamp in seconds since epoch
   */
  expiresAt: number;
}