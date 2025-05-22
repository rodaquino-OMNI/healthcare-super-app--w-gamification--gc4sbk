/**
 * Authentication Response Interfaces
 * 
 * This module defines TypeScript interfaces for authentication response payloads
 * used across the AUSTA SuperApp backend. These interfaces standardize the structure
 * of API responses for operations like login, registration, and token validation,
 * ensuring consistent response handling across all services.
 */

/**
 * Interface representing the authentication session with tokens and expiration
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
 * Response DTO for successful login operations
 * Contains authentication tokens and basic user information
 */
export interface LoginResponseDto {
  /**
   * Authentication session containing tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User information returned after successful authentication
   */
  user: {
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
    name: string;
    
    /**
     * List of roles assigned to the user
     */
    roles: string[];
  };
  
  /**
   * Optional message providing additional context about the login operation
   */
  message?: string;
}

/**
 * Response DTO for successful registration operations
 * Contains authentication tokens and newly created user information
 */
export interface RegisterResponseDto {
  /**
   * Authentication session containing tokens and expiration
   */
  session: AuthSession;
  
  /**
   * Newly created user information
   */
  user: {
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
    name: string;
    
    /**
     * List of roles assigned to the user
     */
    roles: string[];
    
    /**
     * Timestamp when the user was created
     */
    createdAt: string;
  };
  
  /**
   * Optional message providing additional context about the registration operation
   */
  message?: string;
}

/**
 * Response DTO for token validation operations
 * Indicates whether a token is valid and provides user information if applicable
 */
export interface TokenValidationResponseDto {
  /**
   * Indicates whether the token is valid
   */
  isValid: boolean;
  
  /**
   * User information associated with the token (if valid)
   */
  user?: {
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
    name: string;
    
    /**
     * List of roles assigned to the user
     */
    roles: string[];
  };
  
  /**
   * Optional message providing additional context about the validation operation
   */
  message?: string;
  
  /**
   * Optional error code if validation fails
   */
  errorCode?: string;
}

/**
 * Response DTO for multi-factor authentication verification operations
 * Contains authentication tokens and user information after successful MFA verification
 */
export interface MfaVerificationResponseDto {
  /**
   * Authentication session containing tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User information after successful MFA verification
   */
  user: {
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
    name: string;
    
    /**
     * List of roles assigned to the user
     */
    roles: string[];
  };
  
  /**
   * Optional message providing additional context about the MFA verification
   */
  message?: string;
}

/**
 * Response DTO for token refresh operations
 * Contains new authentication tokens after successful refresh
 */
export interface RefreshTokenResponseDto {
  /**
   * New authentication session containing refreshed tokens and expiration
   */
  session: AuthSession;
  
  /**
   * Optional message providing additional context about the refresh operation
   */
  message?: string;
}

/**
 * Response DTO for social login operations
 * Contains authentication tokens and user information after successful social authentication
 */
export interface SocialLoginResponseDto {
  /**
   * Authentication session containing tokens and expiration
   */
  session: AuthSession;
  
  /**
   * User information after successful social authentication
   */
  user: {
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
    name: string;
    
    /**
     * List of roles assigned to the user
     */
    roles: string[];
    
    /**
     * Social provider used for authentication (e.g., 'google', 'apple', 'facebook')
     */
    provider: string;
  };
  
  /**
   * Optional message providing additional context about the social login operation
   */
  message?: string;
}