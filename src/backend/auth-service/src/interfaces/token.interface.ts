/**
 * Token interfaces for the AUSTA SuperApp Auth Service
 * 
 * This file defines shared token-related interfaces used across all auth-service modules.
 * It includes JWT token structure, payload format, and token validation interfaces.
 * 
 * @module interfaces/token
 */

// Import shared token types from @austa/interfaces
import { IJwtTokenBase, IJwtPayloadBase, ITokenValidationResult } from '@austa/interfaces/auth';

/**
 * Interface representing the structure of JWT tokens in the system
 */
export interface IJwtTokens {
  /** Short-lived access token for API authorization */
  accessToken: string;
  /** Long-lived refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Timestamp when the access token expires (in milliseconds) */
  expiresAt: number;
  /** Type of token (usually 'Bearer') */
  tokenType: string;
}

/**
 * Interface for standard JWT payload claims
 * Extends the base JWT payload from shared interfaces
 */
export interface IJwtPayload extends IJwtPayloadBase {
  /** User ID (subject) */
  sub: string;
  /** Token issued at timestamp */
  iat: number;
  /** Token expiration timestamp */
  exp: number;
  /** Token issuer */
  iss: string;
  /** Audience this token is intended for */
  aud: string;
  /** JWT ID (unique identifier for this token) */
  jti: string;
  /** User roles array */
  roles: string[];
  /** User permissions array */
  permissions: string[];
  /** Journey-specific claims */
  journeyClaims: IJourneySpecificClaims;
}

/**
 * Interface for journey-specific claims in the JWT payload
 * Contains claims specific to each journey in the AUSTA SuperApp
 */
export interface IJourneySpecificClaims {
  /** Health journey specific claims */
  health?: IHealthJourneyClaims;
  /** Care journey specific claims */
  care?: ICareJourneyClaims;
  /** Plan journey specific claims */
  plan?: IPlanJourneyClaims;
}

/**
 * Interface for Health journey specific claims
 */
export interface IHealthJourneyClaims {
  /** User's active health goals */
  activeGoals?: string[];
  /** Connected health devices */
  connectedDevices?: string[];
  /** Health data sharing preferences */
  sharingPreferences?: string;
}

/**
 * Interface for Care journey specific claims
 */
export interface ICareJourneyClaims {
  /** Active care plans */
  activePlans?: string[];
  /** Upcoming appointments */
  upcomingAppointments?: boolean;
  /** Medication reminders enabled */
  medicationReminders?: boolean;
}

/**
 * Interface for Plan journey specific claims
 */
export interface IPlanJourneyClaims {
  /** Active insurance plan IDs */
  activePlans?: string[];
  /** Pending claims count */
  pendingClaims?: number;
  /** Benefits verification status */
  benefitsVerified?: boolean;
}

/**
 * Interface for token validation options
 */
export interface ITokenValidationOptions {
  /** Whether to validate the issuer claim */
  validateIssuer?: boolean;
  /** Whether to validate the audience claim */
  validateAudience?: boolean;
  /** Whether to validate the expiration time */
  validateLifetime?: boolean;
  /** List of valid issuers */
  validIssuers?: string[];
  /** List of valid audiences */
  validAudiences?: string[];
  /** Clock skew in seconds to allow for server time differences */
  clockSkew?: number;
}

/**
 * Interface for token validation service
 * Defines methods for validating and decoding JWT tokens
 */
export interface ITokenValidationService {
  /**
   * Validates a JWT token and returns the validation result
   * @param token - The JWT token to validate
   * @param options - Validation options
   */
  validateToken(token: string, options?: ITokenValidationOptions): Promise<ITokenValidationResult>;
  
  /**
   * Decodes a JWT token without validating it
   * @param token - The JWT token to decode
   */
  decodeToken(token: string): IJwtPayload | null;
  
  /**
   * Generates a new access token from a refresh token
   * @param refreshToken - The refresh token to use
   */
  refreshAccessToken(refreshToken: string): Promise<IJwtTokens>;
}

/**
 * Interface for token generation service
 * Defines methods for creating and signing JWT tokens
 */
export interface ITokenGenerationService {
  /**
   * Generates JWT tokens for a user
   * @param userId - The user ID
   * @param roles - User roles
   * @param permissions - User permissions
   * @param journeyClaims - Journey-specific claims
   */
  generateTokens(userId: string, roles: string[], permissions: string[], journeyClaims?: IJourneySpecificClaims): Promise<IJwtTokens>;
  
  /**
   * Revokes a refresh token
   * @param refreshToken - The refresh token to revoke
   */
  revokeRefreshToken(refreshToken: string): Promise<boolean>;
  
  /**
   * Revokes all refresh tokens for a user
   * @param userId - The user ID
   */
  revokeAllUserTokens(userId: string): Promise<boolean>;
}