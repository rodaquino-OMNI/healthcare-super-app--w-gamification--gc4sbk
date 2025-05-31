import { JwtPayload } from '@austa/interfaces/auth';

/**
 * Generic interface for all authentication providers in the AUSTA SuperApp.
 * This interface establishes a consistent contract that all authentication
 * mechanisms must implement, enabling uniform authentication handling across services.
 * 
 * @typeParam TUser - The user model type that the provider will work with
 * @typeParam TCredentials - The credentials type used for authentication
 */
export interface AuthProvider<TUser, TCredentials = { email: string; password: string }> {
  /**
   * Validates user credentials and returns the authenticated user if valid.
   * 
   * @param credentials - The credentials to validate (typically email/password)
   * @returns A promise that resolves to the authenticated user or null if credentials are invalid
   * @throws AppException with appropriate error code if validation fails
   */
  validateCredentials(credentials: TCredentials): Promise<TUser | null>;

  /**
   * Validates a JWT token and returns the associated user if valid.
   * 
   * @param payload - The decoded JWT payload to validate
   * @returns A promise that resolves to the authenticated user or null if token is invalid
   * @throws AppException with appropriate error code if validation fails
   */
  validateToken(payload: JwtPayload): Promise<TUser | null>;

  /**
   * Retrieves a user by their unique identifier.
   * 
   * @param userId - The unique identifier of the user to retrieve
   * @returns A promise that resolves to the user if found, or null if not found
   * @throws AppException with appropriate error code if retrieval fails
   */
  findUserById(userId: string): Promise<TUser | null>;

  /**
   * Retrieves a user by their email address.
   * 
   * @param email - The email address of the user to retrieve
   * @returns A promise that resolves to the user if found, or null if not found
   * @throws AppException with appropriate error code if retrieval fails
   */
  findUserByEmail(email: string): Promise<TUser | null>;

  /**
   * Creates a new access token for the authenticated user.
   * 
   * @param user - The user for whom to create the token
   * @returns A promise that resolves to the generated access token
   * @throws AppException with appropriate error code if token creation fails
   */
  createAccessToken(user: TUser): Promise<string>;

  /**
   * Creates a new refresh token for the authenticated user.
   * 
   * @param user - The user for whom to create the token
   * @returns A promise that resolves to the generated refresh token
   * @throws AppException with appropriate error code if token creation fails
   */
  createRefreshToken(user: TUser): Promise<string>;

  /**
   * Validates a refresh token and returns a new access token if valid.
   * 
   * @param refreshToken - The refresh token to validate
   * @returns A promise that resolves to a new access token if the refresh token is valid, or null if invalid
   * @throws AppException with appropriate error code if validation fails
   */
  refreshAccessToken(refreshToken: string): Promise<string | null>;

  /**
   * Revokes all active tokens for a user (used for logout or security purposes).
   * 
   * @param userId - The unique identifier of the user whose tokens should be revoked
   * @returns A promise that resolves when the operation is complete
   * @throws AppException with appropriate error code if revocation fails
   */
  revokeTokens(userId: string): Promise<void>;
}