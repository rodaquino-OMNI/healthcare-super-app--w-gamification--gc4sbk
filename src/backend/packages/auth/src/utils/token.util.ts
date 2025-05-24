/**
 * @file Token Utilities
 * 
 * Provides low-level JWT token utilities for encoding, decoding, and validating token
 * payloads without external service dependencies. These pure functions handle JWT operations
 * independently from the token service, focusing on cryptographic operations while leaving
 * business logic to services.
 */

import * as jwt from 'jsonwebtoken';
import { TokenPayload, TokenType, JwtClaims } from '../types';
import { ERROR_CODES, JWT_CLAIMS } from '../constants';

/**
 * Error class for token-related errors
 */
export class TokenError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * Options for encoding a JWT token
 */
export interface EncodeOptions {
  /** Secret key for signing the token */
  secret: string;
  /** Token expiration time in seconds */
  expiresIn?: number;
  /** Token issuer */
  issuer?: string;
  /** Token audience */
  audience?: string | string[];
  /** Token algorithm */
  algorithm?: jwt.Algorithm;
  /** Not before time in seconds */
  notBefore?: number;
  /** JWT ID */
  jwtid?: string;
  /** Subject */
  subject?: string;
  /** Additional headers */
  headers?: Record<string, any>;
}

/**
 * Options for decoding a JWT token
 */
export interface DecodeOptions {
  /** Whether to complete the signature verification */
  complete?: boolean;
  /** Whether to force JSON.parse on the payload */
  json?: boolean;
}

/**
 * Options for verifying a JWT token
 */
export interface VerifyOptions {
  /** Secret key for verifying the token */
  secret: string;
  /** Expected issuer */
  issuer?: string | string[];
  /** Expected audience */
  audience?: string | string[];
  /** Expected algorithm */
  algorithms?: jwt.Algorithm[];
  /** Clock tolerance in seconds */
  clockTolerance?: number;
  /** Maximum allowed age for token (in seconds) */
  maxAge?: number;
  /** Expected subject */
  subject?: string;
  /** Expected JWT ID */
  jwtid?: string;
  /** Whether to ignore token expiration */
  ignoreExpiration?: boolean;
  /** Whether to ignore not before time */
  ignoreNotBefore?: boolean;
}

/**
 * Encodes a payload into a JWT token
 * 
 * @param payload - The payload to encode
 * @param options - Options for encoding
 * @returns The encoded JWT token
 * @throws {TokenError} If encoding fails
 */
export function encodeToken(payload: Partial<TokenPayload>, options: EncodeOptions): string {
  try {
    const jwtOptions: jwt.SignOptions = {
      expiresIn: options.expiresIn,
      issuer: options.issuer,
      audience: options.audience,
      algorithm: options.algorithm || 'HS256',
      notBefore: options.notBefore,
      jwtid: options.jwtid,
      subject: options.subject,
      header: options.headers,
    };

    return jwt.sign(payload, options.secret, jwtOptions);
  } catch (error) {
    throw new TokenError(
      `Failed to encode token: ${error.message}`,
      ERROR_CODES.INVALID_TOKEN
    );
  }
}

/**
 * Decodes a JWT token without verification
 * 
 * @param token - The token to decode
 * @param options - Options for decoding
 * @returns The decoded token payload
 * @throws {TokenError} If decoding fails
 */
export function decodeToken<T = TokenPayload>(token: string, options?: DecodeOptions): T {
  try {
    const decoded = jwt.decode(token, {
      complete: options?.complete || false,
      json: options?.json || true,
    });

    if (!decoded) {
      throw new Error('Invalid token');
    }

    return decoded as unknown as T;
  } catch (error) {
    throw new TokenError(
      `Failed to decode token: ${error.message}`,
      ERROR_CODES.INVALID_TOKEN
    );
  }
}

/**
 * Verifies a JWT token
 * 
 * @param token - The token to verify
 * @param options - Options for verification
 * @returns The verified token payload
 * @throws {TokenError} If verification fails
 */
export function verifyToken<T = TokenPayload>(token: string, options: VerifyOptions): T {
  try {
    const jwtOptions: jwt.VerifyOptions = {
      issuer: options.issuer,
      audience: options.audience,
      algorithms: options.algorithms || ['HS256'],
      clockTolerance: options.clockTolerance,
      maxAge: options.maxAge,
      subject: options.subject,
      jwtid: options.jwtid,
      ignoreExpiration: options.ignoreExpiration || false,
      ignoreNotBefore: options.ignoreNotBefore || false,
    };

    return jwt.verify(token, options.secret, jwtOptions) as unknown as T;
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      throw new TokenError(
        `Token expired: ${error.message}`,
        ERROR_CODES.TOKEN_EXPIRED
      );
    } else if (error.name === 'JsonWebTokenError') {
      throw new TokenError(
        `Invalid token: ${error.message}`,
        ERROR_CODES.INVALID_TOKEN
      );
    } else if (error.name === 'NotBeforeError') {
      throw new TokenError(
        `Token not active: ${error.message}`,
        ERROR_CODES.INVALID_TOKEN
      );
    }

    throw new TokenError(
      `Failed to verify token: ${error.message}`,
      ERROR_CODES.INVALID_TOKEN
    );
  }
}

/**
 * Validates a token payload against expected claims
 * 
 * @param payload - The token payload to validate
 * @param expectedClaims - Expected claims in the payload
 * @returns True if the payload is valid
 * @throws {TokenError} If validation fails
 */
export function validateTokenPayload(
  payload: TokenPayload,
  expectedClaims: Partial<Record<keyof TokenPayload, any>>
): boolean {
  try {
    // Check if payload is an object
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid payload: not an object');
    }

    // Validate required claims
    if (!payload.sub) {
      throw new Error(`Missing required claim: ${JWT_CLAIMS.SUBJECT}`);
    }

    if (!payload.type) {
      throw new Error('Missing required claim: type');
    }

    // Validate token type
    if (expectedClaims.type && payload.type !== expectedClaims.type) {
      throw new Error(`Invalid token type: expected ${expectedClaims.type}, got ${payload.type}`);
    }

    // Validate expiration
    if (payload.exp && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new Error('Token expired');
      }
    }

    // Validate not before
    if (payload.nbf && typeof payload.nbf === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.nbf > now) {
        throw new Error('Token not active yet');
      }
    }

    // Validate issuer
    if (expectedClaims.iss && payload.iss !== expectedClaims.iss) {
      throw new Error(`Invalid issuer: expected ${expectedClaims.iss}, got ${payload.iss}`);
    }

    // Validate audience
    if (expectedClaims.aud) {
      const expectedAud = Array.isArray(expectedClaims.aud) 
        ? expectedClaims.aud 
        : [expectedClaims.aud];
      
      const actualAud = Array.isArray(payload.aud) 
        ? payload.aud 
        : [payload.aud];
      
      const hasValidAudience = actualAud.some(aud => expectedAud.includes(aud as string));
      
      if (!hasValidAudience) {
        throw new Error(`Invalid audience: expected one of [${expectedAud.join(', ')}], got [${actualAud.join(', ')}]`);
      }
    }

    // Validate subject
    if (expectedClaims.sub && payload.sub !== expectedClaims.sub) {
      throw new Error(`Invalid subject: expected ${expectedClaims.sub}, got ${payload.sub}`);
    }

    // Validate JWT ID
    if (expectedClaims.jti && payload.jti !== expectedClaims.jti) {
      throw new Error(`Invalid JWT ID: expected ${expectedClaims.jti}, got ${payload.jti}`);
    }

    return true;
  } catch (error) {
    throw new TokenError(
      `Payload validation failed: ${error.message}`,
      ERROR_CODES.INVALID_TOKEN
    );
  }
}

/**
 * Checks if a token is expired
 * 
 * @param payload - The token payload to check
 * @param graceSeconds - Optional grace period in seconds
 * @returns True if the token is expired
 */
export function isTokenExpired(payload: TokenPayload, graceSeconds = 0): boolean {
  if (!payload.exp || typeof payload.exp !== 'number') {
    return false; // No expiration claim, consider not expired
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp + graceSeconds < now;
}

/**
 * Checks if a token is in the grace period for refresh
 * 
 * @param payload - The token payload to check
 * @param gracePeriodSeconds - Grace period in seconds
 * @returns True if the token is in the grace period
 */
export function isTokenInGracePeriod(payload: TokenPayload, gracePeriodSeconds: number): boolean {
  if (!payload.exp || typeof payload.exp !== 'number') {
    return false; // No expiration claim, consider not in grace period
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now && payload.exp + gracePeriodSeconds > now;
}

/**
 * Generates a secure token ID for refresh tokens
 * 
 * @returns A unique token ID
 */
export function generateTokenId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Creates a hash of a token for storage or comparison
 * 
 * @param token - The token to hash
 * @returns The hashed token
 */
export function hashToken(token: string): string {
  // In a real implementation, this would use a secure hashing algorithm
  // For simplicity, we're just returning a placeholder
  // In production, use a proper crypto library like crypto.createHash
  return `hashed_${token.substring(0, 10)}`;
}

/**
 * Extracts token from authorization header
 * 
 * @param authHeader - The authorization header
 * @returns The extracted token or null if not found
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Creates a token pair (access and refresh tokens)
 * 
 * @param payload - Base payload for both tokens
 * @param options - Options for encoding
 * @returns Object containing access and refresh tokens
 */
export function createTokenPair(
  payload: Omit<TokenPayload, 'type' | 'exp' | 'iat' | 'jti'>,
  options: EncodeOptions
): { accessToken: string; refreshToken: string } {
  // Create access token
  const accessPayload: Partial<TokenPayload> = {
    ...payload,
    type: TokenType.ACCESS,
    iat: Math.floor(Date.now() / 1000),
  };

  const accessToken = encodeToken(accessPayload, options);

  // Create refresh token with longer expiration and a unique ID
  const refreshPayload: Partial<TokenPayload> = {
    ...payload,
    type: TokenType.REFRESH,
    iat: Math.floor(Date.now() / 1000),
    jti: generateTokenId(),
  };

  // If refresh token expiration is not specified, use a default (e.g., 7 days)
  const refreshOptions: EncodeOptions = {
    ...options,
    expiresIn: options.expiresIn ? options.expiresIn * 7 : 604800, // 7 days default
  };

  const refreshToken = encodeToken(refreshPayload, refreshOptions);

  return { accessToken, refreshToken };
}

/**
 * Rotates a refresh token, creating a new token pair
 * 
 * @param oldRefreshToken - The old refresh token
 * @param options - Options for encoding
 * @returns Object containing new access and refresh tokens
 * @throws {TokenError} If rotation fails
 */
export function rotateRefreshToken(
  oldRefreshToken: string,
  options: VerifyOptions & EncodeOptions
): { accessToken: string; refreshToken: string; oldTokenId: string } {
  try {
    // Verify the old refresh token
    const payload = verifyToken<TokenPayload>(oldRefreshToken, options);

    // Ensure it's a refresh token
    if (payload.type !== TokenType.REFRESH) {
      throw new Error('Invalid token type: not a refresh token');
    }

    // Store the old token ID for blacklisting
    const oldTokenId = payload.jti || generateTokenId();

    // Create a new token pair
    const basePayload: Omit<TokenPayload, 'type' | 'exp' | 'iat' | 'jti'> = {
      sub: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      permissions: payload.permissions,
      iss: payload.iss,
      aud: payload.aud,
    };

    const { accessToken, refreshToken } = createTokenPair(basePayload, options);

    return { accessToken, refreshToken, oldTokenId };
  } catch (error) {
    if (error instanceof TokenError) {
      throw error;
    }

    throw new TokenError(
      `Failed to rotate refresh token: ${error.message}`,
      ERROR_CODES.INVALID_REFRESH_TOKEN
    );
  }
}