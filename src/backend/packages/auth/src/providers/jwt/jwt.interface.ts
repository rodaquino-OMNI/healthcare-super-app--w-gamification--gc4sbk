/**
 * Interface for JWT token operations
 */
export interface IJwtProvider {
  /**
   * Generates a JWT token with the provided payload
   * @param payload Data to include in the token
   * @returns Generated JWT token
   */
  generateToken<T = any>(payload: T): Promise<string>;

  /**
   * Validates a JWT token
   * @param token JWT token to validate
   * @returns Decoded token payload if valid, null otherwise
   */
  validateToken<T = any>(token: string): Promise<T | null>;

  /**
   * Decodes a JWT token without validation
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken<T = any>(token: string): T | null;
}

/**
 * Interface for JWT token blacklisting operations
 * Extends the base JWT provider interface with token invalidation capabilities
 */
export interface IJwtBlacklistProvider extends IJwtProvider {
  /**
   * Invalidates a JWT token by adding it to the blacklist
   * @param token JWT token to invalidate
   * @param ttl Optional time-to-live in seconds
   * @returns True if the token was successfully blacklisted, false otherwise
   */
  invalidateToken(token: string, ttl?: number): Promise<boolean>;

  /**
   * Invalidates all tokens for a specific user
   * @param userId User ID to invalidate tokens for
   * @param ttl Optional time-to-live in seconds
   * @returns True if the operation was successful, false otherwise
   */
  invalidateAllUserTokens(userId: string, ttl?: number): Promise<boolean>;

  /**
   * Checks if a token is blacklisted
   * @param token JWT token to check
   * @returns True if the token is blacklisted, false otherwise
   */
  isTokenBlacklisted(token: string): Promise<boolean>;
}