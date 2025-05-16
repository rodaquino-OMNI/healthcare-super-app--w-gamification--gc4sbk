/**
 * @file jwt.interface.ts
 * @description Defines interfaces for JWT operations including token generation, validation,
 * verification, and blacklisting. Establishes a contract that must be followed by all JWT
 * provider implementations, ensuring consistent authentication behavior across the platform.
 */

import { IAuthProvider } from '../auth-provider.interface';
import { ITokenPayload, ITokenValidationOptions, ITokenGenerationOptions } from '../../interfaces/token.interface';
import { JourneyType } from '../../interfaces/role.interface';

/**
 * Interface for JWT token blacklisting operations.
 * Defines methods for adding tokens to a blacklist and checking if tokens are blacklisted.
 */
export interface IJwtBlacklist {
  /**
   * Adds a token to the blacklist, making it invalid for future authentication.
   * 
   * @param token JWT token to blacklist
   * @param payload Decoded token payload
   * @returns Promise resolving to true if the token was added to the blacklist, false otherwise
   */
  addToBlacklist(token: string, payload: ITokenPayload): Promise<boolean>;

  /**
   * Checks if a token is blacklisted.
   * 
   * @param token JWT token to check
   * @returns Promise resolving to true if the token is blacklisted, false otherwise
   */
  isTokenBlacklisted(token: string): Promise<boolean>;

  /**
   * Removes a token from the blacklist, making it valid again.
   * This is primarily used for testing and administrative purposes.
   * 
   * @param token JWT token to remove from the blacklist
   * @returns Promise resolving to true if the token was removed from the blacklist, false otherwise
   */
  removeFromBlacklist(token: string): Promise<boolean>;

  /**
   * Clears all blacklisted tokens.
   * This is primarily used for testing and administrative purposes.
   * 
   * @returns Promise resolving to true if the blacklist was cleared, false otherwise
   */
  clearBlacklist(): Promise<boolean>;
}

/**
 * Interface for JWT token operations.
 * Extends the base authentication provider interface with JWT-specific methods.
 * 
 * @template TUser The user entity type
 */
export interface IJwtProvider<TUser extends Record<string, any>> extends IAuthProvider<TUser, any, ITokenPayload> {
  /**
   * Validates a JWT token and returns the associated payload.
   * Performs comprehensive validation including signature, expiration, and claims.
   * 
   * @param token JWT token to validate
   * @param options Additional validation options
   * @returns Promise resolving to the validated token payload or null if validation fails
   */
  validateToken(token: string, options?: ITokenValidationOptions): Promise<ITokenPayload | null>;

  /**
   * Generates a JWT token for the authenticated user.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds or string (e.g., '1h', '7d')
   * @param journeyType Optional journey context to include in the token
   * @returns Promise resolving to the generated token
   */
  generateToken(user: TUser, expiresIn?: number | string, journeyType?: JourneyType): Promise<string>;

  /**
   * Decodes a JWT token and returns its payload without validation.
   * This method does not verify the token signature or expiration.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  decodeToken(token: string): Promise<ITokenPayload | null>;

  /**
   * Extracts the JWT token from the request.
   * Supports multiple extraction methods: Authorization header, query parameter, and cookies.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null;

  /**
   * Revokes a JWT token, making it invalid for future authentication.
   * Implementations should add the token to a blacklist or revocation list.
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
 * Interface for JWT token verification options.
 * Extends the base token validation options with JWT-specific verification options.
 */
export interface IJwtVerificationOptions extends ITokenValidationOptions {
  /**
   * List of algorithms allowed for token verification.
   * Default: ['HS256']
   */
  algorithms?: string[];

  /**
   * Clock tolerance in seconds to account for server time drift.
   * Default: 0
   */
  clockTolerance?: number;

  /**
   * Whether to verify the token's subject claim.
   * Default: false
   */
  subject?: string;

  /**
   * Whether to verify the token's JWT ID claim.
   * Default: false
   */
  jwtid?: string;

  /**
   * Whether to verify the token's not before claim.
   * Default: false
   */
  ignoreNotBefore?: boolean;
}

/**
 * Interface for JWT token generation options.
 * Extends the base token generation options with JWT-specific signing options.
 */
export interface IJwtSignOptions extends ITokenGenerationOptions {
  /**
   * Whether to include a unique JWT ID in the token.
   * Default: false
   */
  includeJwtId?: boolean;

  /**
   * Not before time in seconds.
   * Default: undefined (token valid immediately)
   */
  notBefore?: number | string;

  /**
   * Key ID to use for signing.
   * Default: undefined
   */
  keyid?: string;

  /**
   * Whether to include the issued at claim.
   * Default: true
   */
  noTimestamp?: boolean;

  /**
   * Header fields to include in the token.
   * Default: undefined
   */
  header?: Record<string, any>;

  /**
   * Whether to mutate the payload directly.
   * Default: false
   */
  mutatePayload?: boolean;
}

/**
 * Interface for JWT token refresh options.
 */
export interface IJwtRefreshOptions {
  /**
   * Whether to revoke the old token after refresh.
   * Default: true
   */
  revokeOldToken?: boolean;

  /**
   * Whether to verify the refresh token before using it.
   * Default: true
   */
  verifyRefreshToken?: boolean;

  /**
   * Expiration time for the new token in seconds or string (e.g., '1h', '7d').
   * Default: undefined (use the default expiration time)
   */
  newTokenExpiresIn?: number | string;

  /**
   * Additional claims to include in the new token.
   * Default: undefined
   */
  additionalClaims?: Record<string, any>;
}

/**
 * Interface for JWT token revocation options.
 */
export interface IJwtRevocationOptions {
  /**
   * Whether to force revocation even if the token is expired.
   * Default: false
   */
  forceRevocation?: boolean;

  /**
   * Whether to revoke all tokens for the user.
   * Default: false
   */
  revokeAllUserTokens?: boolean;

  /**
   * Reason for token revocation (for audit purposes).
   * Default: undefined
   */
  reason?: string;
}