/**
 * JWT Token interfaces for the AUSTA SuperApp
 * Defines detailed interfaces for JWT token structure, claims, and validation.
 * Extends upon the basic token information in AuthSession.
 */

/**
 * Represents the structure of a decoded JWT token
 */
export interface JwtToken {
  /**
   * The header section of the JWT token
   */
  header: JwtHeader;
  
  /**
   * The payload section of the JWT token containing all claims
   */
  payload: JwtPayload;
  
  /**
   * The original encoded JWT token string
   */
  raw: string;
}

/**
 * Represents the header section of a JWT token
 */
export interface JwtHeader {
  /**
   * The algorithm used to sign the token
   */
  alg: 'HS256' | 'RS256' | 'ES256' | 'none';
  
  /**
   * The type of token (always "JWT" for JWT tokens)
   */
  typ: 'JWT';
  
  /**
   * Optional key ID that indicates which key was used to secure the JWT
   */
  kid?: string;
}

/**
 * Represents the payload section of a JWT token containing all claims
 */
export interface JwtPayload extends JwtStandardClaims, JwtCustomClaims {}

/**
 * Standard registered JWT claims as defined in the JWT specification
 */
export interface JwtStandardClaims {
  /**
   * Issuer - identifies the principal that issued the JWT
   */
  iss?: string;
  
  /**
   * Subject - identifies the principal that is the subject of the JWT
   * Usually the user ID
   */
  sub?: string;
  
  /**
   * Audience - identifies the recipients that the JWT is intended for
   */
  aud?: string | string[];
  
  /**
   * Expiration Time - identifies the expiration time on or after which the JWT must not be accepted
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  exp?: number;
  
  /**
   * Not Before - identifies the time before which the JWT must not be accepted
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  nbf?: number;
  
  /**
   * Issued At - identifies the time at which the JWT was issued
   * Expressed as NumericDate (seconds since Unix epoch)
   */
  iat?: number;
  
  /**
   * JWT ID - provides a unique identifier for the JWT
   */
  jti?: string;
}

/**
 * Custom claims specific to the AUSTA SuperApp
 */
export interface JwtCustomClaims {
  /**
   * User roles within the application
   */
  roles?: string[];
  
  /**
   * User permissions within the application
   */
  permissions?: string[];
  
  /**
   * User's preferred journey within the application
   * Can be one of: "health", "care", or "plan"
   */
  preferredJourney?: 'health' | 'care' | 'plan';
  
  /**
   * User's email address
   */
  email?: string;
  
  /**
   * Indicates if the user's email has been verified
   */
  email_verified?: boolean;
  
  /**
   * User's full name
   */
  name?: string;
  
  /**
   * User's preferred language
   */
  locale?: string;
  
  /**
   * The authentication method used
   */
  authMethod?: 'password' | 'social' | 'sso' | 'otp' | 'biometric';
  
  /**
   * The device ID from which the authentication originated
   */
  deviceId?: string;
  
  /**
   * Additional custom claims
   * This allows for extending the token with additional custom claims
   * without modifying the interface
   */
  [key: string]: any;
}

/**
 * Options for token validation
 */
export interface TokenValidationOptions {
  /**
   * Whether to validate the issuer claim
   * @default true
   */
  validateIssuer?: boolean;
  
  /**
   * The expected issuer value
   */
  issuer?: string;
  
  /**
   * Whether to validate the audience claim
   * @default true
   */
  validateAudience?: boolean;
  
  /**
   * The expected audience value
   */
  audience?: string | string[];
  
  /**
   * Whether to validate the expiration time
   * @default true
   */
  validateExpiration?: boolean;
  
  /**
   * Whether to validate the not before time
   * @default true
   */
  validateNotBefore?: boolean;
  
  /**
   * Clock tolerance in seconds for exp, nbf validation
   * @default 0
   */
  clockTolerance?: number;
  
  /**
   * Whether to validate the JWT ID
   * @default false
   */
  validateJti?: boolean;
  
  /**
   * Required claims that must be present in the token
   */
  requiredClaims?: string[];
}

/**
 * Result of token validation
 */
export interface TokenValidationResult {
  /**
   * Whether the token is valid
   */
  isValid: boolean;
  
  /**
   * The decoded token if validation was successful
   */
  token?: JwtToken;
  
  /**
   * Error message if validation failed
   */
  error?: string;
  
  /**
   * Error code if validation failed
   */
  errorCode?: TokenValidationErrorCode;
}

/**
 * Error codes for token validation failures
 */
export enum TokenValidationErrorCode {
  INVALID_FORMAT = 'invalid_format',
  INVALID_SIGNATURE = 'invalid_signature',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_NOT_ACTIVE = 'token_not_active',
  INVALID_ISSUER = 'invalid_issuer',
  INVALID_AUDIENCE = 'invalid_audience',
  INVALID_SUBJECT = 'invalid_subject',
  MISSING_REQUIRED_CLAIM = 'missing_required_claim',
  INVALID_CLAIM_VALUE = 'invalid_claim_value',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Interface for token verification
 */
export interface TokenVerifier {
  /**
   * Verifies a JWT token
   * @param token The token to verify
   * @param options Options for verification
   * @returns A promise that resolves to the verification result
   */
  verify(token: string, options?: TokenValidationOptions): Promise<TokenValidationResult>;
  
  /**
   * Decodes a JWT token without verifying it
   * @param token The token to decode
   * @returns The decoded token or null if decoding fails
   */
  decode(token: string): JwtToken | null;
}