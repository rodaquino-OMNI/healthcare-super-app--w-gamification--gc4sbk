/**
 * JWT Token Helper for Testing
 * 
 * Provides utility functions for generating test JWT tokens with customizable claims and payloads
 * for authentication tests. This file enables developers to create valid/invalid tokens with
 * different permission sets, roles, expiration times, and custom claims for various test scenarios.
 */

import * as jwt from 'jsonwebtoken';
import { ITokenPayload, ITokenGenerationOptions } from '../../src/interfaces/token.interface';
import { TEST_JWT_CONFIG, TEST_TOKEN_PAYLOADS, JOURNEY_TEST_CONSTANTS } from './test-constants.helper';
import { ErrorType } from '@backend/shared/src/exceptions/exceptions.types';

/**
 * Token expiration presets in seconds
 */
export enum TokenExpiration {
  EXPIRED = -3600, // 1 hour in the past
  ABOUT_TO_EXPIRE = 60, // 1 minute in the future
  SHORT_LIVED = 3600, // 1 hour in the future
  MEDIUM_LIVED = 86400, // 1 day in the future
  LONG_LIVED = 604800, // 1 week in the future
}

/**
 * Options for generating test tokens
 */
export interface TestTokenOptions {
  /**
   * User ID to include in the token (sub claim)
   * @default TEST_TOKEN_PAYLOADS.REGULAR_USER.sub
   */
  userId?: string;

  /**
   * User email to include in the token
   * @default TEST_TOKEN_PAYLOADS.REGULAR_USER.email
   */
  email?: string;

  /**
   * Roles to include in the token
   * @default TEST_TOKEN_PAYLOADS.REGULAR_USER.roles
   */
  roles?: string[];

  /**
   * Permissions to include in the token
   * @default TEST_TOKEN_PAYLOADS.REGULAR_USER.permissions
   */
  permissions?: string[];

  /**
   * Token expiration time in seconds from now
   * Can be a positive number for future expiration or negative for past expiration
   * @default TokenExpiration.SHORT_LIVED (3600 seconds / 1 hour)
   */
  expiresIn?: number | TokenExpiration;

  /**
   * Journey ID to include in the token for journey-specific testing
   */
  journey?: string;

  /**
   * Journey-specific context data to include in the token
   */
  journeyContext?: Record<string, any>;

  /**
   * Additional custom claims to include in the token
   */
  customClaims?: Record<string, any>;

  /**
   * Secret key to use for signing the token
   * @default TEST_JWT_CONFIG.secret
   */
  secret?: string;

  /**
   * Whether to include standard JWT claims (iat, nbf, jti)
   * @default true
   */
  includeStandardClaims?: boolean;

  /**
   * Token issuer
   * @default TEST_JWT_CONFIG.issuer
   */
  issuer?: string;

  /**
   * Token audience
   * @default TEST_JWT_CONFIG.audience
   */
  audience?: string | string[];

  /**
   * Token signing algorithm
   * @default 'HS256'
   */
  algorithm?: jwt.Algorithm;
}

/**
 * Result of token generation
 */
export interface TestTokenResult {
  /**
   * Generated JWT token string
   */
  token: string;

  /**
   * Payload used to generate the token
   */
  payload: ITokenPayload;

  /**
   * Expiration timestamp in seconds since epoch
   */
  expiresAt: number;

  /**
   * Whether the token is already expired
   */
  isExpired: boolean;
}

/**
 * Generates a JWT token for testing purposes with customizable claims
 * 
 * @param options Options for token generation
 * @returns Generated token and payload information
 */
export function generateTestToken(options: TestTokenOptions = {}): TestTokenResult {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn ?? TokenExpiration.SHORT_LIVED;
  const expiresAt = now + (typeof expiresIn === 'number' ? expiresIn : 3600);
  
  // Create the token payload
  const payload: ITokenPayload = {
    // Default claims from regular user
    sub: options.userId ?? TEST_TOKEN_PAYLOADS.REGULAR_USER.sub,
    email: options.email ?? TEST_TOKEN_PAYLOADS.REGULAR_USER.email,
    roles: options.roles ?? TEST_TOKEN_PAYLOADS.REGULAR_USER.roles,
    permissions: options.permissions ?? TEST_TOKEN_PAYLOADS.REGULAR_USER.permissions,
    
    // Standard JWT claims
    iss: options.issuer ?? TEST_JWT_CONFIG.issuer,
    aud: options.audience ?? TEST_JWT_CONFIG.audience,
    iat: now,
    exp: expiresAt,
    
    // Optional journey-specific claims
    ...(options.journey && { journey: options.journey }),
    ...(options.journeyContext && { journeyContext: options.journeyContext }),
    
    // Add any custom claims
    ...(options.customClaims || {}),
  };
  
  // Add standard claims if requested
  if (options.includeStandardClaims !== false) {
    payload.nbf = now;
    payload.jti = `test-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // Sign the token
  const token = jwt.sign(
    payload,
    options.secret ?? TEST_JWT_CONFIG.secret,
    {
      algorithm: options.algorithm ?? 'HS256',
    }
  );
  
  return {
    token,
    payload,
    expiresAt,
    isExpired: expiresAt < now,
  };
}

/**
 * Generates an expired JWT token for testing
 * 
 * @param options Additional token options
 * @returns Generated expired token and payload information
 */
export function generateExpiredToken(options: Omit<TestTokenOptions, 'expiresIn'> = {}): TestTokenResult {
  return generateTestToken({
    ...options,
    expiresIn: TokenExpiration.EXPIRED,
  });
}

/**
 * Generates a token that is about to expire (1 minute remaining)
 * 
 * @param options Additional token options
 * @returns Generated token and payload information
 */
export function generateAboutToExpireToken(options: Omit<TestTokenOptions, 'expiresIn'> = {}): TestTokenResult {
  return generateTestToken({
    ...options,
    expiresIn: TokenExpiration.ABOUT_TO_EXPIRE,
  });
}

/**
 * Generates a long-lived JWT token for testing (1 week)
 * 
 * @param options Additional token options
 * @returns Generated token and payload information
 */
export function generateLongLivedToken(options: Omit<TestTokenOptions, 'expiresIn'> = {}): TestTokenResult {
  return generateTestToken({
    ...options,
    expiresIn: TokenExpiration.LONG_LIVED,
  });
}

/**
 * Generates a token with an invalid signature for negative testing
 * 
 * @param options Additional token options
 * @returns Generated token with invalid signature
 */
export function generateInvalidSignatureToken(options: TestTokenOptions = {}): TestTokenResult {
  // Generate a valid token first
  const result = generateTestToken(options);
  
  // Corrupt the signature by changing the signing key
  const invalidToken = jwt.sign(
    result.payload,
    'wrong-secret-key',
    {
      algorithm: options.algorithm ?? 'HS256',
    }
  );
  
  return {
    ...result,
    token: invalidToken,
  };
}

/**
 * Generates a token for a specific user role
 * 
 * @param role Role name to include in the token
 * @param options Additional token options
 * @returns Generated token and payload information
 */
export function generateTokenForRole(role: string, options: TestTokenOptions = {}): TestTokenResult {
  return generateTestToken({
    ...options,
    roles: [role, ...(options.roles || [])],
  });
}

/**
 * Generates a token with specific permissions
 * 
 * @param permissions Array of permission IDs to include in the token
 * @param options Additional token options
 * @returns Generated token and payload information
 */
export function generateTokenWithPermissions(permissions: string[], options: TestTokenOptions = {}): TestTokenResult {
  return generateTestToken({
    ...options,
    permissions: [...permissions, ...(options.permissions || [])],
  });
}

/**
 * Generates a token for a specific journey
 * 
 * @param journeyId Journey ID to include in the token
 * @param options Additional token options
 * @returns Generated token and payload information
 */
export function generateJourneyToken(journeyId: string, options: TestTokenOptions = {}): TestTokenResult {
  const journeyConstants = JOURNEY_TEST_CONSTANTS[journeyId];
  
  if (!journeyConstants) {
    throw new Error(`Unknown journey ID: ${journeyId}`);
  }
  
  return generateTestToken({
    ...options,
    journey: journeyId,
    roles: journeyConstants.tokens.regular.roles,
    permissions: journeyConstants.tokens.regular.permissions,
    journeyContext: options.journeyContext || {},
  });
}

/**
 * Generates a malformed token for negative testing
 * 
 * @returns Malformed token string
 */
export function generateMalformedToken(): string {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
}

/**
 * Decodes a JWT token without verification
 * 
 * @param token JWT token to decode
 * @returns Decoded token payload or null if decoding fails
 */
export function decodeToken<T = any>(token: string): T | null {
  try {
    return jwt.decode(token) as T;
  } catch (error) {
    return null;
  }
}

/**
 * Verifies a JWT token
 * 
 * @param token JWT token to verify
 * @param secret Secret key to use for verification
 * @returns Verified token payload or null if verification fails
 */
export function verifyToken<T = any>(token: string, secret: string = TEST_JWT_CONFIG.secret): T | null {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if a token is expired
 * 
 * @param token JWT token to check
 * @returns True if the token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Creates a mock error for token validation failures
 * 
 * @param message Error message
 * @param code Error code
 * @returns Error object with standardized structure
 */
export function createTokenValidationError(message: string, code: string): Error {
  const error = new Error(message);
  (error as any).type = ErrorType.VALIDATION;
  (error as any).code = code;
  return error;
}