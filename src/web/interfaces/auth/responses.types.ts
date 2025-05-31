/**
 * Authentication Response Types for the AUSTA SuperApp
 * 
 * This file defines TypeScript interfaces for all authentication-related API responses,
 * ensuring consistency between backend responses and frontend expectations.
 * These interfaces enable type-safe API interactions for authentication operations
 * across both web and mobile platforms.
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
   * Optional additional details about the error
   */
  details?: Record<string, any>;
}

/**
 * Base interface for all authentication responses
 */
export interface BaseAuthResponse {
  /**
   * Indicates if the operation was successful
   */
  success: boolean;
  
  /**
   * Error information if success is false
   */
  error?: AuthErrorResponse;
}

/**
 * Response for successful login operations
 */
export interface LoginResponse extends BaseAuthResponse {
  /**
   * Authentication session with tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Indicates if multi-factor authentication is required
   */
  requiresMfa?: boolean;
  
  /**
   * Temporary token for completing MFA if required
   */
  mfaToken?: string;
}

/**
 * Response for successful registration operations
 */
export interface RegisterResponse extends BaseAuthResponse {
  /**
   * Authentication session with tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
  
  /**
   * Indicates if email verification is required
   */
  requiresEmailVerification?: boolean;
}

/**
 * Response for token refresh operations
 */
export interface RefreshTokenResponse extends BaseAuthResponse {
  /**
   * New authentication session with updated tokens and expiration
   */
  session: AuthSession;
}

/**
 * Response for password reset request operations
 */
export interface PasswordResetRequestResponse extends BaseAuthResponse {
  /**
   * Email address to which the reset instructions were sent
   */
  email: string;
  
  /**
   * Expiration time of the reset token in milliseconds since epoch
   */
  expiresAt: number;
}

/**
 * Response for password reset confirmation operations
 */
export interface PasswordResetConfirmResponse extends BaseAuthResponse {
  /**
   * Indicates if the user should be redirected to login
   */
  redirectToLogin: boolean;
  
  /**
   * Optional session if auto-login is enabled after password reset
   */
  session?: AuthSession;
}

/**
 * Response for email verification operations
 */
export interface EmailVerificationResponse extends BaseAuthResponse {
  /**
   * Indicates if the email was successfully verified
   */
  verified: boolean;
  
  /**
   * Optional session if auto-login is enabled after verification
   */
  session?: AuthSession;
}

/**
 * Response for multi-factor authentication verification
 */
export interface MfaVerificationResponse extends BaseAuthResponse {
  /**
   * Authentication session with tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User profile information
   */
  user: UserProfile;
}

/**
 * Response for logout operations
 */
export interface LogoutResponse extends BaseAuthResponse {
  /**
   * Timestamp of when the logout occurred
   */
  loggedOutAt: number;
}

/**
 * Response for checking authentication status
 */
export interface AuthStatusResponse extends BaseAuthResponse {
  /**
   * Current authentication status
   */
  status: 'authenticated' | 'unauthenticated';
  
  /**
   * User profile if authenticated
   */
  user?: UserProfile;
  
  /**
   * Session information if authenticated
   */
  session?: AuthSession;
}