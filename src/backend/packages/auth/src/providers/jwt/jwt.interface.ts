import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Interface for JWT token operations.
 * Defines the contract that must be followed by all JWT provider implementations.
 */
export interface IJwtProvider<TUser extends Record<string, any>> {
  /**
   * Validates a JWT token and returns the associated user.
   * 
   * @param token JWT token to validate
   * @returns Promise resolving to the user or null if validation fails
   */
  validateToken(token: string): Promise<TUser | null>;

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  generateToken(user: TUser, expiresIn?: number): Promise<string>;

  /**
   * Decodes a JWT token and returns its payload without validation.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  decodeToken(token: string): Promise<JwtPayload | null>;

  /**
   * Extracts the JWT token from the request.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null;

  /**
   * Revokes a JWT token, making it invalid for future authentication.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  revokeToken(token: string): Promise<boolean>;

  /**
   * Refreshes an existing token and returns a new one.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  refreshToken(refreshToken: string): Promise<string | null>;
}

/**
 * Interface for token blacklisting operations.
 * Defines methods for managing a token blacklist.
 */
export interface ITokenBlacklist {
  /**
   * Adds a token to the blacklist.
   * 
   * @param token JWT token to blacklist
   * @param ttl Time-to-live in seconds (optional)
   * @returns Promise resolving to true if the token was added to the blacklist, false otherwise
   */
  addToBlacklist(token: string, ttl?: number): Promise<boolean>;

  /**
   * Checks if a token is blacklisted.
   * 
   * @param token JWT token to check
   * @returns Promise resolving to true if the token is blacklisted, false otherwise
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * Removes a token from the blacklist.
   * 
   * @param token JWT token to remove from the blacklist
   * @returns Promise resolving to true if the token was removed from the blacklist, false otherwise
   */
  removeFromBlacklist(token: string): Promise<boolean>;

  /**
   * Clears all tokens from the blacklist.
   * 
   * @returns Promise resolving to true if the blacklist was cleared, false otherwise
   */
  clearBlacklist(): Promise<boolean>;
}