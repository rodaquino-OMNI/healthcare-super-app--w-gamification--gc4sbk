/**
 * Interface for token storage configuration options.
 */
export interface TokenStorageOptions {
  /**
   * Redis key prefix for token storage.
   */
  keyPrefix?: string;
  
  /**
   * Default TTL for tokens in seconds.
   */
  defaultTtl?: number;
}

/**
 * Interface for blacklisted token records in Redis.
 */
export interface TokenBlacklistRecord {
  /**
   * Unique token identifier (jti claim).
   */
  jti: string;
  
  /**
   * User ID associated with the token.
   */
  userId: string;
  
  /**
   * Timestamp when the token was blacklisted.
   */
  blacklistedAt: number;
}

/**
 * Interface for refresh token records in Redis.
 */
export interface RefreshTokenRecord {
  /**
   * Unique token identifier (jti claim).
   */
  jti: string;
  
  /**
   * User ID associated with the token.
   */
  userId: string;
  
  /**
   * Timestamp when the token was created.
   */
  createdAt: number;
  
  /**
   * Timestamp when the token expires.
   */
  expiresAt: number;
  
  /**
   * Whether the token has been used for refresh.
   */
  used?: boolean;
}

/**
 * Interface for Redis client operations.
 */
export interface RedisClient {
  /**
   * Sets a key-value pair in Redis with optional expiration.
   */
  set(key: string, value: string, expiryMode?: string, time?: number): Promise<'OK'>;
  
  /**
   * Gets a value from Redis by key.
   */
  get(key: string): Promise<string | null>;
  
  /**
   * Deletes a key from Redis.
   */
  del(key: string): Promise<number>;
  
  /**
   * Checks if a key exists in Redis.
   */
  exists(key: string): Promise<number>;
  
  /**
   * Sets a key's time to live in seconds.
   */
  expire(key: string, seconds: number): Promise<number>;
}