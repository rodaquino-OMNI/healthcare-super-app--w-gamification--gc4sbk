/**
 * Authentication interfaces for the AUSTA SuperApp
 * Defines standardized interfaces for authentication operations across the platform
 */

/**
 * Represents the result of an authentication operation
 */
export interface IAuthResult {
  /**
   * Whether the authentication operation was successful
   */
  success: boolean;
  
  /**
   * JWT access token for authenticated requests
   */
  accessToken?: string;
  
  /**
   * Temporary token for multi-factor authentication flow
   */
  tempToken?: string;
  
  /**
   * Indicates if multi-factor authentication is required
   */
  mfaRequired?: boolean;
  
  /**
   * User information returned after successful authentication
   */
  user?: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    [key: string]: any;
  };
  
  /**
   * Error message if authentication failed
   */
  error?: {
    code: string;
    message: string;
    details?: any;
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
   * Remember user session (extended token expiration)
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
   * User's phone number (optional)
   */
  phone?: string;
  
  /**
   * Acceptance of terms and conditions
   */
  acceptedTerms: boolean;
  
  /**
   * Optional additional user data
   */
  [key: string]: any;
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
   * Social provider (e.g., 'google', 'apple', 'facebook')
   */
  provider: string;
  
  /**
   * Provider-specific token or authorization code
   */
  token: string;
  
  /**
   * Additional provider-specific data
   */
  [key: string]: any;
}

/**
 * Token refresh request
 */
export interface ITokenRefreshRequest {
  /**
   * Refresh token for obtaining a new access token
   */
  refreshToken?: string;
}

/**
 * Authentication session information
 */
export interface IAuthSession {
  /**
   * JWT access token
   */
  accessToken: string;
  
  /**
   * Refresh token for obtaining new access tokens
   */
  refreshToken?: string;
  
  /**
   * Token expiration timestamp
   */
  expiresAt: number;
  
  /**
   * User information
   */
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    [key: string]: any;
  };
}