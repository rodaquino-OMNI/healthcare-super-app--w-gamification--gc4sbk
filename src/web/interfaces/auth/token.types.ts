/**
 * Token interfaces for the AUSTA SuperApp authentication system
 * Defines detailed JWT token interfaces, payload structures, and validation mechanisms.
 */

import { AuthSession } from './session.types';

/**
 * Represents the standard JWT claims as defined in RFC 7519
 * https://tools.ietf.org/html/rfc7519
 */
export interface StandardJwtClaims {
  /**
   * Issuer - identifies the principal that issued the JWT
   */
  iss?: string;

  /**
   * Subject - identifies the principal that is the subject of the JWT
   */
  sub?: string;

  /**
   * Audience - identifies the recipients that the JWT is intended for
   */
  aud?: string | string[];

  /**
   * Expiration Time - identifies the expiration time on or after which the JWT must not be accepted
   * Represented as NumericDate (seconds since Unix epoch)
   */
  exp?: number;

  /**
   * Not Before - identifies the time before which the JWT must not be accepted
   * Represented as NumericDate (seconds since Unix epoch)
   */
  nbf?: number;

  /**
   * Issued At - identifies the time at which the JWT was issued
   * Represented as NumericDate (seconds since Unix epoch)
   */
  iat?: number;

  /**
   * JWT ID - provides a unique identifier for the JWT
   */
  jti?: string;
}

/**
 * AUSTA SuperApp specific JWT claims for journey-based authentication
 */
export interface AustaJwtClaims {
  /**
   * User roles within the application
   */
  roles?: string[];
  
  /**
   * User permissions for specific actions
   */
  permissions?: string[];
  
  /**
   * Current active journey context (health, care, plan)
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * User profile identifier
   */
  profileId?: string;
  
  /**
   * Authentication type used (password, biometric, social, etc.)
   */
  authType?: string;
  
  /**
   * Device identifier for mobile authentication
   */
  deviceId?: string;
  
  /**
   * Confirmation claim for Proof of Possession tokens
   * Used with mTLS authentication
   */
  cnf?: {
    /**
     * X.509 Certificate SHA-1 Thumbprint
     */
    x5t?: string;
  };
}

/**
 * Complete JWT payload structure combining standard and AUSTA-specific claims
 */
export interface JwtPayload extends StandardJwtClaims, AustaJwtClaims {
  /**
   * Any additional custom claims not covered by standard or AUSTA-specific interfaces
   */
  [key: string]: any;
}

/**
 * JWT token header structure
 */
export interface JwtHeader {
  /**
   * Algorithm used for token signing
   */
  alg: string;
  
  /**
   * Token type (always 'JWT' for JSON Web Tokens)
   */
  typ: string;
  
  /**
   * Key ID - identifies which key was used to secure the JWT
   */
  kid?: string;
  
  /**
   * JSON Web Key Set URL - URL to the JWK Set containing the public key
   */
  jku?: string;
  
  /**
   * X.509 URL - URL to the X.509 certificate
   */
  x5u?: string;
}

/**
 * Complete JWT structure with all components
 */
export interface JsonWebToken {
  /**
   * JWT header containing metadata about the token
   */
  header: JwtHeader;
  
  /**
   * JWT payload containing the claims
   */
  payload: JwtPayload;
  
  /**
   * Original encoded JWT string
   */
  token: string;
  
  /**
   * Signature part of the JWT
   */
  signature: string;
}

/**
 * Options for JWT token validation
 */
export interface TokenValidationOptions {
  /**
   * List of valid issuers to accept
   */
  validIssuers?: string[];
  
  /**
   * List of valid audiences to accept
   */
  validAudiences?: string[];
  
  /**
   * Whether to validate the token expiration
   * @default true
   */
  validateExpiration?: boolean;
  
  /**
   * Whether to validate the token not-before time
   * @default true
   */
  validateNotBefore?: boolean;
  
  /**
   * Clock skew tolerance in seconds
   * @default 300 (5 minutes)
   */
  clockSkew?: number;
  
  /**
   * Whether to validate the issuer
   * @default true
   */
  validateIssuer?: boolean;
  
  /**
   * Whether to validate the audience
   * @default true
   */
  validateAudience?: boolean;
  
  /**
   * Required claims that must be present in the token
   */
  requiredClaims?: string[];
}

/**
 * Result of JWT token validation
 */
export interface TokenValidationResult {
  /**
   * Whether the token is valid
   */
  isValid: boolean;
  
  /**
   * Error message if validation failed
   */
  error?: string;
  
  /**
   * Decoded token if validation succeeded
   */
  token?: JsonWebToken;
  
  /**
   * Specific validation errors by category
   */
  validationErrors?: {
    /**
     * Expiration validation error
     */
    expiration?: string;
    
    /**
     * Not-before validation error
     */
    notBefore?: string;
    
    /**
     * Issuer validation error
     */
    issuer?: string;
    
    /**
     * Audience validation error
     */
    audience?: string;
    
    /**
     * Required claims validation errors
     */
    requiredClaims?: string[];
    
    /**
     * Signature validation error
     */
    signature?: string;
  };
}

/**
 * Options for JWT token verification
 * Verification is the process of checking the token signature
 */
export interface TokenVerificationOptions {
  /**
   * Secret key for HMAC algorithms
   */
  secret?: string;
  
  /**
   * Public key for RSA and ECDSA algorithms
   */
  publicKey?: string;
  
  /**
   * JSON Web Key Set URL for dynamic key retrieval
   */
  jwksUri?: string;
  
  /**
   * Cache TTL for JWKS keys in seconds
   * @default 3600 (1 hour)
   */
  jwksCacheTtl?: number;
  
  /**
   * Expected algorithm for token verification
   */
  algorithms?: string[];
  
  /**
   * Whether to ignore expiration during verification
   * @default false
   */
  ignoreExpiration?: boolean;
  
  /**
   * Complete validation options to apply after verification
   */
  validationOptions?: TokenValidationOptions;
}

/**
 * Result of JWT token verification
 */
export interface TokenVerificationResult extends TokenValidationResult {
  /**
   * Whether the token signature is valid
   */
  hasValidSignature: boolean;
  
  /**
   * Algorithm used for verification
   */
  algorithm?: string;
  
  /**
   * Key ID used for verification
   */
  keyId?: string;
}

/**
 * Extended AuthSession with token details
 * Provides more granular access to token information while maintaining compatibility
 * with the basic AuthSession interface
 */
export interface TokenSession extends AuthSession {
  /**
   * Decoded access token
   */
  decodedAccessToken?: JwtPayload;
  
  /**
   * Decoded refresh token
   */
  decodedRefreshToken?: JwtPayload;
  
  /**
   * Whether the access token has been verified
   */
  verified?: boolean;
  
  /**
   * Timestamp when the refresh token expires
   */
  refreshExpiresAt?: number;
}

/**
 * Token manipulation utilities for encoding, decoding, and validating JWTs
 */
export interface TokenUtils {
  /**
   * Decode a JWT token without verifying the signature
   * @param token - The JWT token string to decode
   */
  decode(token: string): JsonWebToken | null;
  
  /**
   * Verify a JWT token signature and validate its claims
   * @param token - The JWT token string to verify
   * @param options - Verification options
   */
  verify(token: string, options: TokenVerificationOptions): Promise<TokenVerificationResult>;
  
  /**
   * Validate a JWT token's claims without verifying its signature
   * @param token - The JWT token or decoded token to validate
   * @param options - Validation options
   */
  validate(token: string | JsonWebToken, options: TokenValidationOptions): TokenValidationResult;
  
  /**
   * Extract specific claims from a JWT token
   * @param token - The JWT token or decoded token
   * @param claims - Array of claim names to extract
   */
  extractClaims<T extends keyof JwtPayload>(token: string | JsonWebToken, claims: T[]): Pick<JwtPayload, T>;
}