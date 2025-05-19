import { Injectable, Inject, Logger, LoggerService, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';

import { BaseError } from '@austa/errors';
import { ERROR_CODES, CONFIG_KEYS, JWT_CLAIMS, TOKEN_TYPES } from './constants';
import { JwtPayload, TokenPair, TokenResponse, JwtConfig, AuthenticatedUser } from './types';

/**
 * Options for token generation
 */
export interface TokenOptions {
  /** User ID to include in the token */
  userId: string;
  /** User email to include in the token */
  email: string;
  /** User roles to include in the token */
  roles: string[];
  /** Optional permissions to include in the token */
  permissions?: string[];
  /** Optional journey-specific claims */
  journeyClaims?: Record<string, unknown>;
  /** Optional session ID to include in the token */
  sessionId?: string;
  /** Optional device ID to include in the token */
  deviceId?: string;
  /** Whether MFA has been verified for this session */
  mfaVerified?: boolean;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  /** Whether the token is valid */
  isValid: boolean;
  /** The decoded payload if valid */
  payload?: JwtPayload;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: string;
}

/**
 * Service responsible for JWT token operations
 * 
 * This service encapsulates all token-related functionality to separate concerns
 * from the main AuthService, improving maintainability and testability.
 */
@Injectable()
export class TokenService {
  private readonly defaultConfig: JwtConfig;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() @Inject(Logger) private readonly logger?: LoggerService,
  ) {
    // Initialize default configuration from environment variables
    this.defaultConfig = {
      secret: this.configService.get<string>(CONFIG_KEYS.JWT_SECRET),
      accessTokenExpiration: this.configService.get<number>(CONFIG_KEYS.JWT_ACCESS_EXPIRATION, 3600), // 1 hour default
      refreshTokenExpiration: this.configService.get<number>(CONFIG_KEYS.JWT_REFRESH_EXPIRATION, 2592000), // 30 days default
      issuer: this.configService.get<string>(CONFIG_KEYS.JWT_ISSUER, 'austa-superapp'),
      audience: this.configService.get<string>(CONFIG_KEYS.JWT_AUDIENCE, 'austa-users'),
      includeTimestampClaims: true,
      algorithm: 'HS256',
    };

    this.logger?.log('TokenService initialized with configuration', { 
      issuer: this.defaultConfig.issuer,
      accessTokenExpiration: this.defaultConfig.accessTokenExpiration,
      refreshTokenExpiration: this.defaultConfig.refreshTokenExpiration,
    });
  }

  /**
   * Generate a new access token
   * 
   * @param options Token generation options
   * @param config Optional JWT configuration override
   * @returns The generated JWT token string
   */
  async generateAccessToken(options: TokenOptions, config?: Partial<JwtConfig>): Promise<string> {
    try {
      const mergedConfig = { ...this.defaultConfig, ...config };
      const now = Math.floor(Date.now() / 1000);

      const payload: JwtPayload = {
        [JWT_CLAIMS.USER_ID]: options.userId,
        [JWT_CLAIMS.EMAIL]: options.email,
        [JWT_CLAIMS.ROLES]: options.roles,
      };

      // Add optional claims
      if (options.permissions?.length) {
        payload[JWT_CLAIMS.PERMISSIONS] = options.permissions;
      }

      if (options.journeyClaims) {
        payload[JWT_CLAIMS.JOURNEY_ACCESS] = options.journeyClaims;
      }

      if (options.sessionId) {
        payload[JWT_CLAIMS.SESSION_ID] = options.sessionId;
      }

      if (options.deviceId) {
        payload[JWT_CLAIMS.DEVICE_ID] = options.deviceId;
      }

      if (options.mfaVerified !== undefined) {
        payload[JWT_CLAIMS.MFA_VERIFIED] = options.mfaVerified;
      }

      // Add token type claim
      payload[JWT_CLAIMS.TOKEN_TYPE] = TOKEN_TYPES.ACCESS;

      // Add timestamp claims if configured
      if (mergedConfig.includeTimestampClaims) {
        payload[JWT_CLAIMS.ISSUED_AT] = now;
        payload[JWT_CLAIMS.EXPIRATION] = now + mergedConfig.accessTokenExpiration;
      }

      // Add issuer and audience if configured
      if (mergedConfig.issuer) {
        payload[JWT_CLAIMS.ISSUER] = mergedConfig.issuer;
      }

      if (mergedConfig.audience) {
        payload[JWT_CLAIMS.AUDIENCE] = mergedConfig.audience;
      }

      // Sign the token
      const token = await this.jwtService.signAsync(payload, {
        secret: mergedConfig.secret,
        expiresIn: mergedConfig.accessTokenExpiration,
        algorithm: mergedConfig.algorithm,
      });

      this.logger?.debug('Generated access token', { userId: options.userId });
      return token;
    } catch (error) {
      this.logger?.error('Failed to generate access token', { error, userId: options.userId });
      throw new BaseError({
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Failed to generate access token',
        cause: error,
      });
    }
  }

  /**
   * Generate a secure refresh token
   * 
   * This creates a cryptographically secure random token that is not a JWT
   * to avoid the security risks of storing sensitive data in a JWT refresh token
   * 
   * @returns A secure random token string
   */
  generateRefreshToken(): string {
    // Generate a secure random token (48 bytes = 96 hex chars)
    const tokenBytes = randomBytes(48);
    // Convert to a hex string
    return tokenBytes.toString('hex');
  }

  /**
   * Hash a refresh token for secure storage
   * 
   * @param refreshToken The refresh token to hash
   * @returns The hashed token
   */
  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  /**
   * Generate a token pair (access token + refresh token)
   * 
   * @param options Token generation options
   * @param config Optional JWT configuration override
   * @returns TokenPair containing access and refresh tokens
   */
  async generateTokenPair(options: TokenOptions, config?: Partial<JwtConfig>): Promise<TokenPair> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const now = Math.floor(Date.now() / 1000);

    // Generate access token
    const accessToken = await this.generateAccessToken(options, mergedConfig);
    
    // Generate refresh token
    const refreshToken = this.generateRefreshToken();

    // Calculate expiration timestamp
    const expiresAt = now + mergedConfig.accessTokenExpiration;

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Generate a complete token response for client authentication
   * 
   * @param options Token generation options
   * @param config Optional JWT configuration override
   * @returns TokenResponse for client authentication
   */
  async generateTokenResponse(options: TokenOptions, config?: Partial<JwtConfig>): Promise<TokenResponse> {
    const tokenPair = await this.generateTokenPair(options, config);
    
    return {
      ...tokenPair,
      tokenType: 'Bearer',
    };
  }

  /**
   * Validate and decode a JWT token
   * 
   * @param token The JWT token to validate
   * @param ignoreExpiration Whether to ignore token expiration
   * @returns TokenValidationResult with validation status and payload
   */
  async validateToken(token: string, ignoreExpiration = false): Promise<TokenValidationResult> {
    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.defaultConfig.secret,
        ignoreExpiration,
      });

      // Check if token type is valid
      if (payload[JWT_CLAIMS.TOKEN_TYPE] !== TOKEN_TYPES.ACCESS) {
        return {
          isValid: false,
          error: 'Invalid token type',
          errorCode: ERROR_CODES.INVALID_TOKEN,
        };
      }

      return {
        isValid: true,
        payload,
      };
    } catch (error) {
      this.logger?.debug('Token validation failed', { error });

      // Determine specific error type
      let errorCode = ERROR_CODES.INVALID_TOKEN;
      let errorMessage = 'Invalid token';

      if (error.name === 'TokenExpiredError') {
        errorCode = ERROR_CODES.TOKEN_EXPIRED;
        errorMessage = 'Token has expired';
      } else if (error.name === 'JsonWebTokenError') {
        errorCode = ERROR_CODES.INVALID_TOKEN;
        errorMessage = 'Invalid token format or signature';
      }

      return {
        isValid: false,
        error: errorMessage,
        errorCode,
      };
    }
  }

  /**
   * Decode a JWT token without validation
   * 
   * @param token The JWT token to decode
   * @returns The decoded payload or null if invalid
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      this.logger?.debug('Token decoding failed', { error });
      return null;
    }
  }

  /**
   * Extract user information from a validated JWT payload
   * 
   * @param payload The validated JWT payload
   * @returns AuthenticatedUser object
   */
  extractUserFromPayload(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload[JWT_CLAIMS.USER_ID],
      email: payload[JWT_CLAIMS.EMAIL],
      roles: payload[JWT_CLAIMS.ROLES] || [],
      permissions: payload[JWT_CLAIMS.PERMISSIONS],
      journeyAttributes: payload[JWT_CLAIMS.JOURNEY_ACCESS],
      lastAuthenticated: payload[JWT_CLAIMS.ISSUED_AT] 
        ? new Date(payload[JWT_CLAIMS.ISSUED_AT] * 1000) 
        : undefined,
    };
  }

  /**
   * Calculate token expiration time in seconds
   * 
   * @param expiresIn Expiration time in seconds
   * @returns Expiration timestamp in seconds since epoch
   */
  calculateExpirationTime(expiresIn: number): number {
    return Math.floor(Date.now() / 1000) + expiresIn;
  }

  /**
   * Check if a token is about to expire
   * 
   * @param token The JWT token to check
   * @param thresholdSeconds Seconds before expiration to consider as "about to expire"
   * @returns True if the token is about to expire
   */
  async isTokenAboutToExpire(token: string, thresholdSeconds = 300): Promise<boolean> {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded[JWT_CLAIMS.EXPIRATION]) {
        return true; // If we can't determine expiration, assume it's about to expire
      }

      const now = Math.floor(Date.now() / 1000);
      const exp = decoded[JWT_CLAIMS.EXPIRATION];
      
      // Token is about to expire if it expires within the threshold
      return exp - now < thresholdSeconds;
    } catch (error) {
      this.logger?.debug('Error checking token expiration', { error });
      return true; // If there's an error, assume it's about to expire
    }
  }
}