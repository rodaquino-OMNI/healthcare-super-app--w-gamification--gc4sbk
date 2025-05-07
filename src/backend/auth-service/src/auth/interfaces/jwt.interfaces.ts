/**
 * JWT interfaces for the AUSTA SuperApp authentication service.
 * Defines standardized structures for JWT tokens, payloads, and authentication responses.
 * These interfaces ensure consistent token handling across all services and journeys.
 */

/**
 * Represents journey-specific claims for cross-journey authorization.
 * Enables fine-grained access control within each journey context.
 */
export interface JourneyClaim {
  /**
   * The journey identifier (e.g., 'health', 'care', 'plan')
   */
  journey: 'health' | 'care' | 'plan' | string;

  /**
   * Journey-specific permissions granted to the user
   */
  permissions: string[];
}

/**
 * Standard JWT payload structure used across all authentication tokens.
 * Contains essential user information and authorization data.
 */
export interface JwtPayload {
  /**
   * Unique identifier for the user
   */
  userId: string;

  /**
   * User's email address (used as username)
   */
  email: string;

  /**
   * User's assigned roles for authorization
   */
  roles: string[];

  /**
   * Token expiration timestamp (in seconds since epoch)
   */
  exp: number;

  /**
   * Token issued at timestamp (in seconds since epoch)
   */
  iat: number;

  /**
   * Journey-specific claims for cross-journey authorization
   * Maps journey identifiers to their specific claims
   */
  journeyClaims?: Record<string, JourneyClaim>;
}

/**
 * Represents a pair of access and refresh tokens for authentication.
 * Used for managing token refresh workflows and session persistence.
 */
export interface TokenPair {
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
 * Standardized response structure for authentication endpoints.
 * Provides consistent token information across all auth operations.
 */
export interface TokenResponse extends TokenPair {
  /**
   * The type of token, typically 'Bearer'
   */
  tokenType: string;
}

/**
 * Configuration options for JWT token generation.
 * Allows customization of token properties during creation.
 */
export interface JwtOptions {
  /**
   * Custom expiration time in seconds
   * Overrides the default expiration time
   */
  expiresIn?: number;

  /**
   * Additional custom claims to include in the token
   */
  additionalClaims?: Record<string, any>;

  /**
   * Whether to include journey claims in the token
   * Defaults to true
   */
  includeJourneyClaims?: boolean;
}

/**
 * Represents the structure of a JWT token in its encoded form.
 * Used for token validation and blacklisting operations.
 */
export interface JwtToken {
  /**
   * The encoded JWT token string
   */
  token: string;

  /**
   * The decoded payload of the token
   */
  payload: JwtPayload;
}

/**
 * Represents a blacklisted token in the token store.
 * Used for implementing secure token invalidation.
 */
export interface BlacklistedToken {
  /**
   * The token identifier (typically the token's jti claim)
   */
  tokenId: string;

  /**
   * When the token was blacklisted
   */
  blacklistedAt: number;

  /**
   * When the token expires
   * Used for cleanup of expired blacklisted tokens
   */
  expiresAt: number;
}