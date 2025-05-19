import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Core interface for all authentication providers in the system.
 * Establishes a consistent contract that all authentication mechanisms must implement,
 * enabling uniform authentication handling across services.
 * 
 * @template TUser The user entity type
 * @template TCredentials The credentials type used for authentication
 * @template TTokenPayload The token payload type, defaults to JwtPayload
 */
export interface IAuthProvider<
  TUser extends Record<string, any>,
  TCredentials extends Record<string, any>,
  TTokenPayload extends Record<string, any> = JwtPayload
> {
  /**
   * Validates user credentials and returns the authenticated user
   * 
   * @param credentials User credentials (username/password, API key, etc.)
   * @returns Promise resolving to the authenticated user or null if authentication fails
   */
  validateCredentials(credentials: TCredentials): Promise<TUser | null>;

  /**
   * Validates a token and returns the associated user
   * 
   * @param token Authentication token (JWT, session token, etc.)
   * @returns Promise resolving to the authenticated user or null if validation fails
   */
  validateToken(token: string): Promise<TUser | null>;

  /**
   * Retrieves a user by their unique identifier
   * 
   * @param id User identifier
   * @returns Promise resolving to the user or null if not found
   */
  getUserById(id: string): Promise<TUser | null>;

  /**
   * Generates a token for the authenticated user
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds (optional)
   * @returns Promise resolving to the generated token
   */
  generateToken(user: TUser, expiresIn?: number): Promise<string>;

  /**
   * Decodes a token and returns its payload without validation
   * 
   * @param token Authentication token
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  decodeToken(token: string): Promise<TTokenPayload | null>;

  /**
   * Extracts the token from the request
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null;

  /**
   * Revokes a token, making it invalid for future authentication
   * 
   * @param token Authentication token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  revokeToken(token: string): Promise<boolean>;

  /**
   * Refreshes an existing token and returns a new one
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  refreshToken(refreshToken: string): Promise<string | null>;
}