/**
 * @file Token Utilities
 * @description Low-level JWT token utilities for encoding, decoding, and validating token payloads
 * without external service dependencies. These pure functions handle JWT operations independently
 * from the token service, focusing on cryptographic operations while leaving business logic to services.
 */

import { sign, verify, decode, JwtPayload as BaseJwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

import { TokenPayload, AuthenticatedUser } from '../types';
import { JWT_CLAIMS, TOKEN_TYPES, AUTH_ERROR_CODES } from '../constants';

/**
 * Error types for token operations
 */
export enum TokenErrorType {
  EXPIRED = 'TokenExpiredError',
  INVALID = 'JsonWebTokenError',
  NOT_BEFORE = 'NotBeforeError',
  MALFORMED = 'MalformedTokenError',
}

/**
 * Result of token validation
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** The decoded payload if valid */
  payload?: TokenPayload;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: string;
  /** Error type if invalid */
  errorType?: TokenErrorType;
}

/**
 * Options for token generation
 */
export interface TokenGenerationOptions {
  /** Secret key for signing */
  secret: string;
  /** Token expiration in seconds */
  expiresIn?: number;
  /** Token issuer */
  issuer?: string;
  /** Token audience */
  audience?: string | string[];
  /** JWT algorithm to use */
  algorithm?: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
}

/**
 * Encode a payload into a JWT token
 * 
 * @param payload The payload to encode
 * @param options Token generation options
 * @returns The JWT token string
 * @throws Error if encoding fails
 */
export function encodeToken(payload: TokenPayload, options: TokenGenerationOptions): string {
  try {
    const signOptions: SignOptions = {
      algorithm: options.algorithm || 'HS256',
    };

    if (options.expiresIn) {
      signOptions.expiresIn = options.expiresIn;
    }

    if (options.issuer) {
      signOptions.issuer = options.issuer;
    }

    if (options.audience) {
      signOptions.audience = options.audience;
    }

    return sign(payload, options.secret, signOptions);
  } catch (error) {
    throw new Error(`Failed to encode token: ${error.message}`);
  }
}

/**
 * Decode a JWT token without validation
 * 
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Validate a JWT token and return the payload
 * 
 * @param token The JWT token to validate
 * @param secret The secret used to sign the token
 * @param options Validation options
 * @returns TokenValidationResult with validation status and payload
 */
export function validateToken(
  token: string,
  secret: string,
  options?: { ignoreExpiration?: boolean; audience?: string | string[]; issuer?: string }
): TokenValidationResult {
  try {
    const verifyOptions: VerifyOptions = {
      ignoreExpiration: options?.ignoreExpiration || false,
    };

    if (options?.audience) {
      verifyOptions.audience = options.audience;
    }

    if (options?.issuer) {
      verifyOptions.issuer = options.issuer;
    }

    const payload = verify(token, secret, verifyOptions) as TokenPayload;

    // Check if token type is valid (if present)
    if (payload[JWT_CLAIMS.TOKEN_TYPE] && payload[JWT_CLAIMS.TOKEN_TYPE] !== TOKEN_TYPES.ACCESS) {
      return {
        isValid: false,
        error: 'Invalid token type',
        errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
        errorType: TokenErrorType.INVALID,
      };
    }

    return {
      isValid: true,
      payload,
    };
  } catch (error) {
    // Determine specific error type
    let errorCode = AUTH_ERROR_CODES.INVALID_TOKEN;
    let errorMessage = 'Invalid token';
    let errorType = TokenErrorType.INVALID;

    if (error.name === 'TokenExpiredError') {
      errorCode = AUTH_ERROR_CODES.TOKEN_EXPIRED;
      errorMessage = 'Token has expired';
      errorType = TokenErrorType.EXPIRED;
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = AUTH_ERROR_CODES.INVALID_TOKEN;
      errorMessage = 'Invalid token format or signature';
      errorType = TokenErrorType.INVALID;
    } else if (error.name === 'NotBeforeError') {
      errorCode = AUTH_ERROR_CODES.INVALID_TOKEN;
      errorMessage = 'Token not yet valid';
      errorType = TokenErrorType.NOT_BEFORE;
    }

    return {
      isValid: false,
      error: errorMessage,
      errorCode,
      errorType,
    };
  }
}

/**
 * Generate a secure refresh token
 * 
 * This creates a cryptographically secure random token that is not a JWT
 * to avoid the security risks of storing sensitive data in a JWT refresh token
 * 
 * @param length The byte length of the token (default: 48 bytes = 96 hex chars)
 * @returns A secure random token string
 */
export function generateRefreshToken(length = 48): string {
  // Generate a secure random token
  const tokenBytes = randomBytes(length);
  // Convert to a hex string
  return tokenBytes.toString('hex');
}

/**
 * Hash a refresh token for secure storage
 * 
 * @param refreshToken The refresh token to hash
 * @returns The hashed token
 */
export function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}

/**
 * Check if a token is expired
 * 
 * @param token The JWT token to check
 * @returns True if the token is expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true; // If we can't determine expiration, assume it's expired
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true; // If there's an error, assume it's expired
  }
}

/**
 * Check if a token is about to expire
 * 
 * @param token The JWT token to check
 * @param thresholdSeconds Seconds before expiration to consider as "about to expire"
 * @returns True if the token is about to expire
 */
export function isTokenAboutToExpire(token: string, thresholdSeconds = 300): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true; // If we can't determine expiration, assume it's about to expire
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    
    // Token is about to expire if it expires within the threshold
    return exp - now < thresholdSeconds;
  } catch (error) {
    return true; // If there's an error, assume it's about to expire
  }
}

/**
 * Extract user information from a validated JWT payload
 * 
 * @param payload The validated JWT payload
 * @returns AuthenticatedUser object
 */
export function extractUserFromPayload(payload: TokenPayload): AuthenticatedUser {
  return {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles || [],
    permissions: payload.permissions,
    journeyAttributes: payload.journeyClaims,
    lastAuthenticated: payload.iat ? new Date(payload.iat * 1000) : undefined,
  };
}

/**
 * Calculate token expiration time in seconds
 * 
 * @param expiresIn Expiration time in seconds
 * @returns Expiration timestamp in seconds since epoch
 */
export function calculateExpirationTime(expiresIn: number): number {
  return Math.floor(Date.now() / 1000) + expiresIn;
}

/**
 * Create a standard token payload from user data
 * 
 * @param userId User ID to include in the token
 * @param email User email to include in the token
 * @param roles User roles to include in the token
 * @param options Additional payload options
 * @returns TokenPayload object
 */
export function createTokenPayload(
  userId: string,
  email: string,
  roles: string[],
  options?: {
    permissions?: string[];
    journeyClaims?: Record<string, unknown>;
    sessionId?: string;
    deviceId?: string;
    mfaVerified?: boolean;
    tokenType?: string;
    expiresIn?: number;
    issuer?: string;
    audience?: string | string[];
  }
): TokenPayload {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: TokenPayload = {
    sub: userId,
    email,
    roles,
    iat: now,
  };

  // Add optional fields if provided
  if (options?.permissions?.length) {
    payload.permissions = options.permissions;
  }

  if (options?.journeyClaims) {
    payload.journeyClaims = options.journeyClaims;
  }

  if (options?.expiresIn) {
    payload.exp = now + options.expiresIn;
  }

  if (options?.issuer) {
    payload.iss = options.issuer;
  }

  if (options?.audience) {
    payload.aud = options.audience;
  }

  return payload;
}

/**
 * Verify that a refresh token matches its hashed version
 * 
 * @param refreshToken The plain refresh token
 * @param hashedToken The hashed token from storage
 * @returns True if the tokens match
 */
export function verifyRefreshToken(refreshToken: string, hashedToken: string): boolean {
  const hashedRefreshToken = hashRefreshToken(refreshToken);
  return hashedRefreshToken === hashedToken;
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader The Authorization header value
 * @returns The token or null if not found or invalid
 */
export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}