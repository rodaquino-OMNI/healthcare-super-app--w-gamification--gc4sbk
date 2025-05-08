/**
 * @file Authentication response interfaces for the AUSTA SuperApp
 * @module @austa/interfaces/auth/response
 * 
 * This file defines standardized response interfaces for authentication operations
 * across the AUSTA SuperApp backend. These interfaces ensure consistent response
 * structures for operations like login, registration, and token validation.
 */

import { IBaseUser } from './user.interface';

/**
 * Represents the authentication tokens returned after successful authentication.
 * Used in login, registration, and token refresh operations.
 */
export interface IAuthTokens {
  /**
   * JWT access token for API authorization
   * Used for authenticating subsequent API requests
   */
  accessToken: string;
  
  /**
   * JWT refresh token used to obtain a new access token when expired
   * Typically has a longer lifetime than the access token
   */
  refreshToken: string;
  
  /**
   * Timestamp (in milliseconds since epoch) when the access token expires
   * Used by clients to proactively refresh tokens before expiration
   */
  expiresAt: number;
}

/**
 * Response data structure for successful login operations.
 * Contains authentication tokens and user information.
 * 
 * This interface supports the journey-centered architecture by providing
 * authentication data that can be used across all three user journeys
 * ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 */
export interface LoginResponseDto {
  /**
   * Authentication tokens for the user session
   */
  tokens: IAuthTokens;
  
  /**
   * User data for the authenticated user
   * Contains basic user information without sensitive data
   */
  user: IBaseUser;
  
  /**
   * Indicates if this is the user's first login
   * Used for onboarding flows and first-time user experience
   */
  isFirstLogin?: boolean;
  
  /**
   * Indicates if multi-factor authentication is required
   * When true, the client should redirect to the MFA verification flow
   */
  requiresMfa?: boolean;
  
  /**
   * Temporary token for MFA verification if requiresMfa is true
   * This token has limited permissions and a short lifetime
   */
  mfaToken?: string;
}

/**
 * Response data structure for successful user registration.
 * Similar to login response but may include additional registration-specific data.
 */
export interface RegisterResponseDto {
  /**
   * Authentication tokens for the newly registered user
   */
  tokens: IAuthTokens;
  
  /**
   * User data for the newly registered user
   * Contains basic user information without sensitive data
   */
  user: IBaseUser;
  
  /**
   * Indicates if email verification is required before full access is granted
   * When true, the client should show appropriate messaging about verification
   */
  requiresEmailVerification?: boolean;
  
  /**
   * Indicates if the user needs to complete their profile
   * Used to guide users to profile completion flows after registration
   */
  requiresProfileCompletion?: boolean;
}

/**
 * Response data structure for token validation operations.
 * Used to verify if a token is valid and retrieve associated user information.
 */
export interface TokenValidationResponseDto {
  /**
   * Indicates if the token is valid
   */
  isValid: boolean;
  
  /**
   * User data associated with the token if valid
   * Will be undefined if the token is invalid
   */
  user?: IBaseUser;
  
  /**
   * Timestamp (in milliseconds since epoch) when the token expires
   * Will be undefined if the token is invalid
   */
  expiresAt?: number;
  
  /**
   * List of permissions associated with the token
   * Used for authorization checks on the client side
   */
  permissions?: string[];
  
  /**
   * List of roles associated with the token
   * Used for role-based access control on the client side
   */
  roles?: string[];
}

/**
 * Response data structure for token refresh operations.
 * Contains new authentication tokens after a successful refresh.
 */
export interface TokenRefreshResponseDto {
  /**
   * New authentication tokens for the user session
   */
  tokens: IAuthTokens;
  
  /**
   * Indicates if the refresh was successful
   */
  success: boolean;
}

/**
 * Response data structure for logout operations.
 * Confirms successful termination of the user session.
 */
export interface LogoutResponseDto {
  /**
   * Indicates if the logout was successful
   */
  success: boolean;
  
  /**
   * Optional message providing additional context about the logout
   */
  message?: string;
}

/**
 * Response data structure for password reset request operations.
 * Confirms that a password reset email has been sent.
 */
export interface PasswordResetRequestResponseDto {
  /**
   * Indicates if the password reset request was successful
   */
  success: boolean;
  
  /**
   * Email address to which the reset instructions were sent (partially masked for privacy)
   */
  email?: string;
  
  /**
   * Expiration time of the reset token in minutes
   */
  expiresInMinutes?: number;
}

/**
 * Response data structure for password reset confirmation operations.
 * Confirms that a password has been successfully reset.
 */
export interface PasswordResetConfirmResponseDto {
  /**
   * Indicates if the password reset was successful
   */
  success: boolean;
  
  /**
   * Optional new authentication tokens if the user is automatically logged in after reset
   */
  tokens?: IAuthTokens;
}