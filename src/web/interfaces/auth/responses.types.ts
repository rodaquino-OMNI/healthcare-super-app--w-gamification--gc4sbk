/**
 * Authentication API Response Interfaces
 * 
 * This file defines TypeScript interfaces for all authentication-related API responses
 * in the AUSTA SuperApp, ensuring consistency between backend responses and frontend
 * expectations for both web and mobile platforms.
 */

import { AuthSession } from './session.types';
import { UserProfile } from './user.types';

/**
 * Standard error response structure for authentication operations
 */
export interface AuthErrorResponse {
  /**
   * Error code identifying the specific error type
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Optional field-specific validation errors
   */
  validationErrors?: Record<string, string[]>;
}

/**
 * Response returned after successful user registration
 */
export interface RegisterResponse {
  /**
   * Indicates successful registration
   */
  success: true;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
  
  /**
   * Whether email verification is required
   */
  requiresEmailVerification?: boolean;
}

/**
 * Response returned after successful user login
 */
export interface LoginResponse {
  /**
   * Indicates successful login
   */
  success: true;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
  
  /**
   * Whether multi-factor authentication is required
   */
  requiresMfa?: boolean;
  
  /**
   * MFA verification ID if MFA is required
   */
  mfaVerificationId?: string;
}

/**
 * Response returned after successful token refresh
 */
export interface RefreshTokenResponse {
  /**
   * Indicates successful token refresh
   */
  success: true;
  
  /**
   * New authentication session with updated tokens
   */
  session: AuthSession;
}

/**
 * Response returned after initiating password reset
 */
export interface RequestPasswordResetResponse {
  /**
   * Indicates successful password reset request
   */
  success: true;
  
  /**
   * Email address to which the reset link was sent
   */
  email: string;
}

/**
 * Response returned after completing password reset
 */
export interface CompletePasswordResetResponse {
  /**
   * Indicates successful password reset
   */
  success: true;
  
  /**
   * Whether the user is automatically logged in after reset
   */
  autoLogin: boolean;
  
  /**
   * Authentication session if auto-login is enabled
   */
  session?: AuthSession;
}

/**
 * Response returned after verifying email address
 */
export interface VerifyEmailResponse {
  /**
   * Indicates successful email verification
   */
  success: true;
  
  /**
   * Email address that was verified
   */
  email: string;
}

/**
 * Response returned after completing multi-factor authentication
 */
export interface CompleteMfaResponse {
  /**
   * Indicates successful MFA verification
   */
  success: true;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Authentication session with tokens
   */
  session: AuthSession;
}

/**
 * Response returned after successful logout
 */
export interface LogoutResponse {
  /**
   * Indicates successful logout
   */
  success: true;
}

/**
 * Union type of all successful authentication responses
 */
export type AuthSuccessResponse =
  | RegisterResponse
  | LoginResponse
  | RefreshTokenResponse
  | RequestPasswordResetResponse
  | CompletePasswordResetResponse
  | VerifyEmailResponse
  | CompleteMfaResponse
  | LogoutResponse;

/**
 * Union type of all authentication responses (success or error)
 */
export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;