/**
 * JWT Provider Interfaces
 * 
 * This file defines the interfaces for JWT operations including token generation,
 * validation, verification, and blacklisting. It establishes a contract that must
 * be followed by all JWT provider implementations, ensuring consistent authentication
 * behavior across the platform.
 */

import { ITokenPayload, ITokenVerificationOptions } from '../../interfaces/token.interface';

/**
 * Interface for JWT token operations
 * Defines the contract for all JWT provider implementations
 */
export interface IJwtProvider {
  /**
   * Generates a JWT token with the provided payload
   * 
   * @param payload Data to include in the token
   * @returns Generated JWT token string
   * @throws Error if token generation fails
   */
  generateToken<T = any>(payload: T): Promise<string>;

  /**
   * Validates a JWT token
   * 
   * @param token JWT token to validate
   * @param options Optional verification options
   * @returns Decoded token payload if valid, null otherwise
   * @throws Error if token validation fails with specific error types
   */
  validateToken<T = any>(token: string, options?: ITokenVerificationOptions): Promise<T | null>;

  /**
   * Decodes a JWT token without validation
   * 
   * @param token JWT token to decode
   * @returns Decoded token payload or null if decoding fails
   */
  decodeToken<T = any>(token: string): T | null;
}

/**
 * Interface for JWT token blacklisting operations
 * Extends the base JWT provider with token invalidation capabilities
 */
export interface IJwtBlacklistProvider extends IJwtProvider {
  /**
   * Invalidates a JWT token by adding it to the blacklist
   * 
   * @param token JWT token to invalidate
   * @param ttl Optional time-to-live in seconds (defaults to token's remaining lifetime)
   * @returns True if the token was successfully blacklisted, false otherwise
   */
  invalidateToken(token: string, ttl?: number): Promise<boolean>;

  /**
   * Invalidates all tokens for a specific user
   * 
   * @param userId User ID to invalidate tokens for
   * @param ttl Optional time-to-live in seconds
   * @returns True if the operation was successful, false otherwise
   */
  invalidateAllUserTokens(userId: string, ttl?: number): Promise<boolean>;

  /**
   * Checks if a token is blacklisted
   * 
   * @param token JWT token to check
   * @returns True if the token is blacklisted, false otherwise
   */
  isTokenBlacklisted(token: string): Promise<boolean>;

  /**
   * Clears the entire token blacklist
   * Use with caution - this will allow all previously invalidated tokens to work again
   * 
   * @returns True if the operation was successful, false otherwise
   */
  clearBlacklist(): Promise<boolean>;
}

/**
 * Options for JWT token blacklisting
 */
export interface IJwtBlacklistOptions {
  /**
   * Storage provider for blacklisted tokens
   * Default is 'redis'
   */
  provider?: 'redis' | 'memory' | 'database';

  /**
   * Default time-to-live for blacklisted tokens in seconds
   * If not specified, defaults to the token's remaining lifetime
   */
  defaultTtl?: number;

  /**
   * Redis connection options if using Redis provider
   */
  redis?: {
    /**
     * Redis host
     * @default 'localhost'
     */
    host?: string;

    /**
     * Redis port
     * @default 6379
     */
    port?: number;

    /**
     * Redis password
     */
    password?: string;

    /**
     * Redis database index
     * @default 0
     */
    db?: number;

    /**
     * Key prefix for Redis keys
     * @default 'jwt:blacklist:'
     */
    keyPrefix?: string;
  };

  /**
   * Whether to enable automatic cleanup of expired blacklist entries
   * @default true
   */
  enableCleanup?: boolean;

  /**
   * Interval in seconds for automatic cleanup of expired blacklist entries
   * Only applicable if enableCleanup is true
   * @default 3600 (1 hour)
   */
  cleanupInterval?: number;
}

/**
 * Result of a token validation operation
 */
export interface ITokenValidationResult<T = any> {
  /**
   * Whether the token is valid
   */
  isValid: boolean;

  /**
   * Decoded token payload if valid
   */
  payload?: T;

  /**
   * Error message if validation failed
   */
  error?: string;

  /**
   * Error code if validation failed
   */
  errorCode?: string;
}

/**
 * Token generation result
 */
export interface ITokenGenerationResult {
  /**
   * Generated JWT token
   */
  token: string;

  /**
   * Token expiration timestamp (in seconds since epoch)
   */
  expiresAt: number;

  /**
   * Token ID (jti claim) if generated
   */
  tokenId?: string;
}

/**
 * Factory function type for creating JWT providers
 */
export type JwtProviderFactory = () => IJwtProvider;

/**
 * Factory function type for creating JWT blacklist providers
 */
export type JwtBlacklistProviderFactory = (options?: IJwtBlacklistOptions) => IJwtBlacklistProvider;