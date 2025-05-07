/**
 * Redis interfaces for authentication token storage and management.
 * These interfaces define the structure for Redis-based token operations,
 * including token blacklisting, refresh token storage, and configuration options.
 */

import { RedisClientOptions } from 'redis';
import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Configuration options for token storage in Redis.
 */
export interface TokenStorageOptions {
  /**
   * Redis key prefix for all token-related keys to avoid collisions.
   * @default 'auth:'
   */
  keyPrefix: string;

  /**
   * TTL (Time-To-Live) in seconds for access tokens in Redis.
   * @default 3600 (1 hour)
   */
  accessTokenTtl: number;

  /**
   * TTL (Time-To-Live) in seconds for refresh tokens in Redis.
   * @default 2592000 (30 days)
   */
  refreshTokenTtl: number;

  /**
   * TTL (Time-To-Live) in seconds for blacklisted tokens in Redis.
   * This should match or exceed the JWT token expiration time.
   * @default 86400 (24 hours)
   */
  blacklistTtl: number;

  /**
   * Whether to encrypt refresh tokens before storing in Redis.
   * @default true
   */
  encryptRefreshTokens: boolean;

  /**
   * Whether to enable automatic cleanup of expired tokens.
   * @default true
   */
  enableAutoCleanup: boolean;

  /**
   * Interval in seconds for automatic cleanup of expired tokens.
   * @default 3600 (1 hour)
   */
  cleanupInterval: number;
}

/**
 * Redis client configuration for token storage.
 * Extends the standard Redis client options with token-specific settings.
 */
export interface TokenRedisClientConfig {
  /**
   * Redis client options for connecting to the Redis server.
   */
  redisOptions: RedisClientOptions;

  /**
   * Token storage specific options.
   */
  tokenOptions: TokenStorageOptions;
}

/**
 * Structure for a blacklisted token record in Redis.
 */
export interface TokenBlacklistRecord {
  /**
   * The JWT token ID (jti) that has been blacklisted.
   */
  jti: string;

  /**
   * User ID associated with the blacklisted token.
   */
  userId: string;

  /**
   * Timestamp when the token was blacklisted.
   */
  blacklistedAt: number;

  /**
   * Timestamp when the token expires.
   */
  expiresAt: number;

  /**
   * Optional reason for blacklisting the token.
   */
  reason?: string;
}

/**
 * Structure for a refresh token record in Redis.
 */
export interface RefreshTokenRecord {
  /**
   * The refresh token ID.
   */
  id: string;

  /**
   * User ID associated with the refresh token.
   */
  userId: string;

  /**
   * The access token ID (jti) associated with this refresh token.
   */
  accessTokenId: string;

  /**
   * Device identifier for the device that issued the token.
   */
  deviceId?: string;

  /**
   * IP address from which the token was issued.
   */
  ipAddress?: string;

  /**
   * User agent information from the client that requested the token.
   */
  userAgent?: string;

  /**
   * Timestamp when the token was issued.
   */
  issuedAt: number;

  /**
   * Timestamp when the token expires.
   */
  expiresAt: number;

  /**
   * Whether this token has been used for rotation.
   * Once a refresh token is used to generate a new token pair,
   * it should be marked as used to prevent replay attacks.
   */
  used: boolean;

  /**
   * Optional family ID to group related refresh tokens for token rotation.
   * Useful for implementing token rotation with family-based invalidation.
   */
  familyId?: string;

  /**
   * Scope of the token, defining what resources it can access.
   */
  scope?: string[];

  /**
   * Journey context for the token, if it's specific to a journey.
   */
  journeyContext?: string;

  /**
   * Security fingerprint for additional validation.
   * This can be a hash of device-specific information to prevent token theft.
   */
  securityFingerprint?: string;

  /**
   * Number of times this token has been used for authentication.
   * Useful for detecting potential token theft or misuse.
   */
  usageCount: number;

  /**
   * Last time this token was used for authentication.
   */
  lastUsedAt?: number;
}

/**
 * Interface for token blacklist operations.
 */
export interface TokenBlacklistOperations {
  /**
   * Add a token to the blacklist.
   * @param jti The JWT token ID to blacklist
   * @param payload The JWT payload associated with the token
   * @param reason Optional reason for blacklisting
   * @returns Promise resolving to true if successful
   */
  addToBlacklist(jti: string, payload: JwtPayload, reason?: string): Promise<boolean>;

  /**
   * Check if a token is blacklisted.
   * @param jti The JWT token ID to check
   * @returns Promise resolving to true if token is blacklisted
   */
  isBlacklisted(jti: string): Promise<boolean>;

  /**
   * Get blacklist record for a token.
   * @param jti The JWT token ID to retrieve
   * @returns Promise resolving to the blacklist record or null if not found
   */
  getBlacklistRecord(jti: string): Promise<TokenBlacklistRecord | null>;

  /**
   * Remove a token from the blacklist.
   * @param jti The JWT token ID to remove
   * @returns Promise resolving to true if successful
   */
  removeFromBlacklist(jti: string): Promise<boolean>;

  /**
   * Get all blacklisted tokens for a user.
   * @param userId The user ID to get blacklisted tokens for
   * @returns Promise resolving to an array of blacklist records
   */
  getUserBlacklistedTokens(userId: string): Promise<TokenBlacklistRecord[]>;

  /**
   * Blacklist all tokens for a user.
   * @param userId The user ID to blacklist tokens for
   * @param reason Optional reason for blacklisting
   * @returns Promise resolving to the number of tokens blacklisted
   */
  blacklistAllUserTokens(userId: string, reason?: string): Promise<number>;

  /**
   * Clean up expired blacklisted tokens.
   * @returns Promise resolving to the number of tokens removed
   */
  cleanupBlacklist(): Promise<number>;
}

/**
 * Interface for refresh token operations.
 */
export interface RefreshTokenOperations {
  /**
   * Store a refresh token.
   * @param token The refresh token record to store
   * @returns Promise resolving to true if successful
   */
  storeRefreshToken(token: RefreshTokenRecord): Promise<boolean>;

  /**
   * Get a refresh token by ID.
   * @param id The refresh token ID
   * @returns Promise resolving to the refresh token record or null if not found
   */
  getRefreshToken(id: string): Promise<RefreshTokenRecord | null>;

  /**
   * Mark a refresh token as used (for token rotation).
   * @param id The refresh token ID to mark as used
   * @returns Promise resolving to true if successful
   */
  markRefreshTokenAsUsed(id: string): Promise<boolean>;

  /**
   * Delete a refresh token.
   * @param id The refresh token ID to delete
   * @returns Promise resolving to true if successful
   */
  deleteRefreshToken(id: string): Promise<boolean>;

  /**
   * Get all refresh tokens for a user.
   * @param userId The user ID to get refresh tokens for
   * @returns Promise resolving to an array of refresh token records
   */
  getUserRefreshTokens(userId: string): Promise<RefreshTokenRecord[]>;

  /**
   * Invalidate all refresh tokens for a user.
   * @param userId The user ID to invalidate tokens for
   * @returns Promise resolving to the number of tokens invalidated
   */
  invalidateAllUserRefreshTokens(userId: string): Promise<number>;

  /**
   * Invalidate all refresh tokens in a token family.
   * @param familyId The token family ID to invalidate
   * @returns Promise resolving to the number of tokens invalidated
   */
  invalidateTokenFamily(familyId: string): Promise<number>;

  /**
   * Clean up expired refresh tokens.
   * @returns Promise resolving to the number of tokens removed
   */
  cleanupRefreshTokens(): Promise<number>;
}

/**
 * Interface for access token operations.
 */
export interface AccessTokenOperations {
  /**
   * Store metadata for an access token.
   * @param jti The JWT token ID
   * @param payload The JWT payload associated with the token
   * @param metadata Optional additional metadata
   * @returns Promise resolving to true if successful
   */
  storeAccessTokenMetadata(
    jti: string,
    payload: JwtPayload,
    metadata?: Record<string, any>
  ): Promise<boolean>;

  /**
   * Get metadata for an access token.
   * @param jti The JWT token ID
   * @returns Promise resolving to the token metadata or null if not found
   */
  getAccessTokenMetadata(jti: string): Promise<Record<string, any> | null>;

  /**
   * Delete metadata for an access token.
   * @param jti The JWT token ID
   * @returns Promise resolving to true if successful
   */
  deleteAccessTokenMetadata(jti: string): Promise<boolean>;

  /**
   * Get all access tokens for a user.
   * @param userId The user ID to get access tokens for
   * @returns Promise resolving to an array of token IDs
   */
  getUserAccessTokens(userId: string): Promise<string[]>;

  /**
   * Validate an access token against the blacklist and metadata.
   * @param jti The JWT token ID
   * @param payload The JWT payload to validate
   * @returns Promise resolving to true if the token is valid
   */
  validateAccessToken(jti: string, payload: JwtPayload): Promise<boolean>;
}

/**
 * Combined interface for all token storage operations.
 */
export interface TokenStorageOperations extends 
  TokenBlacklistOperations,
  RefreshTokenOperations,
  AccessTokenOperations {
  
  /**
   * Initialize the token storage.
   * @returns Promise resolving when initialization is complete
   */
  initialize(): Promise<void>;

  /**
   * Close the token storage connection.
   * @returns Promise resolving when connection is closed
   */
  close(): Promise<void>;

  /**
   * Get the Redis client instance.
   * @returns The Redis client instance
   */
  getClient(): any;

  /**
   * Run a cleanup operation for all token types.
   * @returns Promise resolving to an object with counts of removed tokens
   */
  runCleanup(): Promise<{ blacklisted: number; refreshTokens: number }>;

  /**
   * Perform a complete logout for a user, invalidating all tokens.
   * This will blacklist all access tokens and invalidate all refresh tokens.
   * @param userId The user ID to log out
   * @param reason Optional reason for the logout
   * @returns Promise resolving to an object with counts of invalidated tokens
   */
  logoutUser(userId: string, reason?: string): Promise<{ 
    blacklisted: number; 
    refreshTokens: number 
  }>;

  /**
   * Perform a security audit of all tokens for a user.
   * @param userId The user ID to audit
   * @returns Promise resolving to an audit report object
   */
  auditUserTokens(userId: string): Promise<{
    activeAccessTokens: number;
    activeRefreshTokens: number;
    blacklistedTokens: number;
    usedRefreshTokens: number;
    suspiciousTokens: number;
    oldestTokenDate: Date | null;
    newestTokenDate: Date | null;
    uniqueDevices: number;
    uniqueIpAddresses: number;
  }>;

  /**
   * Generate a secure token rotation.
   * This will invalidate the old refresh token and create a new token pair.
   * @param oldRefreshTokenId The ID of the refresh token to rotate
   * @param payload The JWT payload for the new tokens
   * @param metadata Optional metadata for the new tokens
   * @returns Promise resolving to true if rotation was successful
   */
  rotateTokens(oldRefreshTokenId: string, payload: JwtPayload, metadata?: Record<string, any>): Promise<boolean>;
}