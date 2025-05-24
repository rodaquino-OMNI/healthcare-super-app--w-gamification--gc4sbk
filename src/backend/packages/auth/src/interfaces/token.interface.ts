/**
 * Token interfaces for the AUSTA SuperApp
 * Defines standardized interfaces for JWT token generation, validation, and refresh.
 */

/**
 * Standard JWT payload structure with user-specific claims
 * Follows RFC 7519 for registered claims
 */
export interface ITokenPayload {
  /**
   * Issuer - identifies the principal that issued the JWT
   */
  iss?: string;

  /**
   * Subject - identifies the principal that is the subject of the JWT (usually user ID)
   */
  sub: string;

  /**
   * Audience - identifies the recipients that the JWT is intended for
   */
  aud?: string | string[];

  /**
   * Expiration Time - identifies the expiration time on or after which the JWT must not be accepted
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  exp: number;

  /**
   * Not Before - identifies the time before which the JWT must not be accepted
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  nbf?: number;

  /**
   * Issued At - identifies the time at which the JWT was issued
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  iat: number;

  /**
   * JWT ID - provides a unique identifier for the JWT
   */
  jti?: string;

  /**
   * User roles for authorization
   */
  roles?: string[];

  /**
   * User permissions for fine-grained authorization
   */
  permissions?: string[];

  /**
   * User's email address
   */
  email?: string;

  /**
   * User's full name
   */
  name?: string;

  /**
   * Journey-specific context data
   */
  journeyContext?: Record<string, any>;

  /**
   * Additional custom claims
   */
  [key: string]: any;
}

/**
 * Token details including the token string, type, and expiration
 */
export interface IToken {
  /**
   * The JWT token string
   */
  token: string;

  /**
   * Token type (usually "Bearer")
   */
  type: string;

  /**
   * Time in seconds until token expiration
   */
  expiresIn: number;

  /**
   * Timestamp (in milliseconds since epoch) when the token expires
   */
  expiresAt: number;
}

/**
 * Token response returned to clients
 * Compatible with frontend AuthSession interface
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
   * Token type (usually "Bearer")
   */
  tokenType: string;
}

/**
 * Refresh token request payload
 */
export interface IRefreshTokenRequest {
  /**
   * The refresh token used to obtain a new access token
   */
  refreshToken: string;
}

/**
 * Token verification options
 */
export interface ITokenVerificationOptions {
  /**
   * Whether to ignore token expiration during verification
   */
  ignoreExpiration?: boolean;

  /**
   * Expected issuer for verification
   */
  issuer?: string | string[];

  /**
   * Expected audience for verification
   */
  audience?: string | string[];

  /**
   * Required algorithms for verification
   */
  algorithms?: string[];

  /**
   * Clock tolerance in seconds for time-based claims
   */
  clockTolerance?: number;
}

/**
 * Token generation options
 */
export interface ITokenGenerationOptions {
  /**
   * Token issuer
   */
  issuer?: string;

  /**
   * Token audience
   */
  audience?: string | string[];

  /**
   * Token expiration time in seconds
   */
  expiresIn: number;

  /**
   * Token signing algorithm
   */
  algorithm?: string;

  /**
   * Include standard claims (iat, nbf, jti)
   */
  includeStandardClaims?: boolean;

  /**
   * Journey-specific context to include in the token
   */
  journeyContext?: Record<string, any>;
}