/**
 * @file token.interface.ts
 * @description Defines interfaces related to JWT tokens including payload structure, token details,
 * response formats, and refresh mechanisms. These interfaces ensure consistent token representation
 * and validation across the application.
 */

import { JourneyType } from './role.interface';

/**
 * Interface representing the standard JWT payload with user data.
 * This is the decoded content of a JWT token used for authentication.
 */
export interface ITokenPayload {
  /**
   * Subject of the token (typically the user ID)
   */
  sub: string;

  /**
   * User's email address
   */
  email: string;

  /**
   * User's full name
   */
  name: string;

  /**
   * Array of role IDs assigned to the user
   */
  roles: number[];

  /**
   * Array of permission codes the user has (including those from roles)
   */
  permissions: string[];

  /**
   * Current active journey context for the user
   */
  journeyContext?: JourneyType;

  /**
   * Issued at timestamp (seconds since epoch)
   */
  iat: number;

  /**
   * Expiration timestamp (seconds since epoch)
   */
  exp: number;

  /**
   * Token issuer
   */
  iss?: string;

  /**
   * Audience for the token
   */
  aud?: string | string[];

  /**
   * JWT ID (unique identifier for the token)
   */
  jti?: string;

  /**
   * Not before timestamp (seconds since epoch)
   */
  nbf?: number;

  /**
   * Additional custom claims
   */
  [key: string]: any;
}

/**
 * Interface representing token details including the token string and metadata.
 */
export interface IToken {
  /**
   * The JWT token string
   */
  token: string;

  /**
   * Type of token (e.g., 'access', 'refresh')
   */
  type: 'access' | 'refresh';

  /**
   * Expiration timestamp (milliseconds since epoch)
   */
  expiresAt: number;

  /**
   * Decoded payload of the token
   */
  payload?: ITokenPayload;
}

/**
 * Interface representing the token response returned to clients after authentication.
 * This is the data structure sent to the frontend after successful login or token refresh.
 */
export interface ITokenResponse {
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

  /**
   * Type of token (typically 'Bearer')
   */
  tokenType: string;
}

/**
 * Interface representing the payload for a token refresh request.
 * This is the data structure sent by the client to refresh an expired access token.
 */
export interface IRefreshTokenRequest {
  /**
   * The refresh token string
   */
  refreshToken: string;
}

/**
 * Interface for token validation options.
 * Used to configure how tokens are validated.
 */
export interface ITokenValidationOptions {
  /**
   * Whether to ignore token expiration during validation
   */
  ignoreExpiration?: boolean;

  /**
   * List of required claims that must be present in the token
   */
  requiredClaims?: string[];

  /**
   * Audience that should be included in the token
   */
  audience?: string | string[];

  /**
   * Issuer that should have issued the token
   */
  issuer?: string;

  /**
   * Maximum age of the token in seconds
   */
  maxAge?: number;
}

/**
 * Interface for token generation options.
 * Used to configure how tokens are generated.
 */
export interface ITokenGenerationOptions {
  /**
   * Secret key used to sign the token
   */
  secret: string;

  /**
   * Token expiration time in seconds
   */
  expiresIn: number;

  /**
   * Issuer to include in the token
   */
  issuer?: string;

  /**
   * Audience to include in the token
   */
  audience?: string | string[];

  /**
   * Subject of the token (typically the user ID)
   */
  subject?: string;

  /**
   * Algorithm to use for signing the token
   */
  algorithm?: string;

  /**
   * Additional custom claims to include in the token
   */
  additionalClaims?: Record<string, any>;
}