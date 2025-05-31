/**
 * JWT Provider Mock
 * 
 * Mock implementation of the JWT provider that simulates token generation, validation,
 * and verification without cryptographic operations. This mock enables testing of
 * JWT-dependent authentication flows without relying on actual JWT signing and verification.
 * 
 * It supports configurable token payloads, verification responses, and blacklisting behavior.
 */

import { Logger } from '@nestjs/common';
import { IJwtProvider, IJwtBlacklistProvider } from '../../src/providers/jwt/jwt.interface';
import { ITokenPayload, ITokenVerificationOptions } from '../../src/interfaces/token.interface';
import { AppException } from '@austa/errors';

/**
 * Configuration options for the JWT provider mock
 */
export interface JwtProviderMockOptions {
  /**
   * Default behavior for token validation
   * If true, all tokens will be considered valid by default
   * @default true
   */
  defaultValidationResponse?: boolean;

  /**
   * Default behavior for token blacklisting
   * If true, all tokens will be considered not blacklisted by default
   * @default true
   */
  defaultBlacklistResponse?: boolean;

  /**
   * Whether to simulate token expiration based on exp claim
   * @default true
   */
  simulateExpiration?: boolean;

  /**
   * Whether to throw errors for invalid tokens
   * If false, will return null instead of throwing
   * @default true
   */
  throwOnInvalidToken?: boolean;

  /**
   * Whether to log operations
   * @default false
   */
  enableLogging?: boolean;
}

/**
 * Default options for the JWT provider mock
 */
const DEFAULT_OPTIONS: JwtProviderMockOptions = {
  defaultValidationResponse: true,
  defaultBlacklistResponse: true,
  simulateExpiration: true,
  throwOnInvalidToken: true,
  enableLogging: false,
};

/**
 * Mock implementation of the JWT provider interface for testing
 * Implements both IJwtProvider and IJwtBlacklistProvider interfaces
 */
export class JwtProviderMock implements IJwtProvider, IJwtBlacklistProvider {
  private readonly logger = new Logger(JwtProviderMock.name);
  private readonly options: JwtProviderMockOptions;
  
  // Store for simulated token validation responses
  private validationResponses: Map<string, boolean> = new Map();
  
  // Store for simulated token payloads
  private tokenPayloads: Map<string, any> = new Map();
  
  // Store for blacklisted tokens
  private blacklistedTokens: Set<string> = new Set();
  
  // Store for blacklisted users
  private blacklistedUsers: Set<string> = new Set();

  /**
   * Creates a new instance of the JWT provider mock
   * 
   * @param options Configuration options for the mock
   */
  constructor(options: JwtProviderMockOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.log('JWT Provider Mock initialized');
  }

  /**
   * Generates a mock JWT token with the provided payload
   * 
   * @param payload Data to include in the token
   * @returns Generated mock JWT token string
   */
  async generateToken<T = any>(payload: T): Promise<string> {
    try {
      // Create a standardized payload with required JWT claims
      const now = Math.floor(Date.now() / 1000);
      const standardizedPayload = {
        ...payload,
        iat: now,
        exp: now + 3600, // Default expiration: 1 hour
      };

      // Generate a mock token (base64 encoded payload with a prefix)
      const tokenPayload = JSON.stringify(standardizedPayload);
      const base64Payload = Buffer.from(tokenPayload).toString('base64');
      const mockToken = `mock.${base64Payload}.signature`;

      // Store the payload for later retrieval during validation
      this.tokenPayloads.set(mockToken, standardizedPayload);
      
      this.log(`Generated mock token: ${this.getTokenIdentifier(mockToken)}`);
      return mockToken;
    } catch (error) {
      this.log(`Error generating token: ${error.message}`, 'error');
      throw new AppException(
        'AUTH.TOKEN_GENERATION_FAILED',
        'Failed to generate authentication token',
        { originalError: error },
      );
    }
  }

  /**
   * Validates a mock JWT token
   * 
   * @param token JWT token to validate
   * @param options Optional verification options
   * @returns Decoded token payload if valid, null otherwise
   * @throws AppException if token validation fails and throwOnInvalidToken is true
   */
  async validateToken<T = any>(token: string, options?: ITokenVerificationOptions): Promise<T | null> {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        this.log(`Token is blacklisted: ${this.getTokenIdentifier(token)}`);
        if (this.options.throwOnInvalidToken) {
          throw new AppException(
            'AUTH.TOKEN_BLACKLISTED',
            'Authentication token has been revoked',
          );
        }
        return null;
      }

      // Check if we have a specific validation response for this token
      if (this.validationResponses.has(token)) {
        const isValid = this.validationResponses.get(token);
        if (!isValid) {
          this.log(`Token validation failed (configured response): ${this.getTokenIdentifier(token)}`);
          if (this.options.throwOnInvalidToken) {
            throw new AppException(
              'AUTH.INVALID_TOKEN',
              'Invalid authentication token',
            );
          }
          return null;
        }
      }

      // Get the stored payload for this token
      const payload = this.tokenPayloads.get(token);
      if (!payload) {
        // If we don't have a stored payload, try to decode it
        const decoded = this.decodeToken<T>(token);
        if (!decoded) {
          this.log(`Token validation failed (unknown token): ${this.getTokenIdentifier(token)}`);
          if (this.options.throwOnInvalidToken) {
            throw new AppException(
              'AUTH.INVALID_TOKEN',
              'Invalid authentication token',
            );
          }
          return null;
        }
        return decoded;
      }

      // Check token expiration if simulation is enabled
      if (this.options.simulateExpiration && !options?.ignoreExpiration) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          this.log(`Token expired: ${this.getTokenIdentifier(token)}`);
          if (this.options.throwOnInvalidToken) {
            throw new AppException(
              'AUTH.TOKEN_EXPIRED',
              'Authentication token has expired',
            );
          }
          return null;
        }
      }

      // Validate issuer if specified in options
      if (options?.issuer && payload.iss) {
        const issuers = Array.isArray(options.issuer) ? options.issuer : [options.issuer];
        if (!issuers.includes(payload.iss)) {
          this.log(`Token has invalid issuer: ${payload.iss}`);
          if (this.options.throwOnInvalidToken) {
            throw new AppException(
              'AUTH.INVALID_TOKEN_ISSUER',
              'Token issuer does not match expected value',
            );
          }
          return null;
        }
      }

      // Validate audience if specified in options
      if (options?.audience && payload.aud) {
        const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
        const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        
        const hasValidAudience = audiences.some(aud => tokenAudiences.includes(aud));
        if (!hasValidAudience) {
          this.log(`Token has invalid audience: ${payload.aud}`);
          if (this.options.throwOnInvalidToken) {
            throw new AppException(
              'AUTH.INVALID_TOKEN_AUDIENCE',
              'Token audience does not match expected value',
            );
          }
          return null;
        }
      }

      this.log(`Token validated successfully: ${this.getTokenIdentifier(token)}`);
      return payload as unknown as T;
    } catch (error) {
      // If it's already an AppException, just rethrow it
      if (error instanceof AppException) {
        throw error;
      }

      // Otherwise, wrap it in an AppException
      this.log(`Error validating token: ${error.message}`, 'error');
      throw new AppException(
        'AUTH.TOKEN_VALIDATION_FAILED',
        'Failed to validate authentication token',
        { originalError: error },
      );
    }
  }

  /**
   * Decodes a mock JWT token without validation
   * 
   * @param token JWT token to decode
   * @returns Decoded token payload or null if decoding fails
   */
  decodeToken<T = any>(token: string): T | null {
    try {
      // First check if we have this token in our store
      if (this.tokenPayloads.has(token)) {
        return this.tokenPayloads.get(token) as unknown as T;
      }

      // Otherwise, try to decode it from the token format
      if (!token || !token.includes('.')) {
        return null;
      }

      // Extract the payload part (second segment)
      const parts = token.split('.');
      if (parts.length < 2) {
        return null;
      }

      // Decode the base64 payload
      const base64Payload = parts[1];
      const jsonPayload = Buffer.from(base64Payload, 'base64').toString();
      return JSON.parse(jsonPayload) as T;
    } catch (error) {
      this.log(`Error decoding token: ${error.message}`, 'debug');
      return null;
    }
  }

  /**
   * Invalidates a JWT token by adding it to the blacklist
   * 
   * @param token JWT token to invalidate
   * @param ttl Optional time-to-live in seconds (not used in mock)
   * @returns True if the token was successfully blacklisted
   */
  async invalidateToken(token: string, ttl?: number): Promise<boolean> {
    try {
      this.blacklistedTokens.add(token);
      this.log(`Token blacklisted: ${this.getTokenIdentifier(token)}`);
      return true;
    } catch (error) {
      this.log(`Error blacklisting token: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Invalidates all tokens for a specific user
   * 
   * @param userId User ID to invalidate tokens for
   * @param ttl Optional time-to-live in seconds (not used in mock)
   * @returns True if the operation was successful
   */
  async invalidateAllUserTokens(userId: string, ttl?: number): Promise<boolean> {
    try {
      this.blacklistedUsers.add(userId);
      this.log(`All tokens for user ${userId} blacklisted`);
      return true;
    } catch (error) {
      this.log(`Error blacklisting user tokens: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Checks if a token is blacklisted
   * 
   * @param token JWT token to check
   * @returns True if the token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Check if the specific token is blacklisted
      if (this.blacklistedTokens.has(token)) {
        return true;
      }

      // Check if the user is blacklisted
      const decoded = this.decodeToken(token);
      if (decoded && typeof decoded === 'object') {
        const userId = decoded.sub || decoded.id;
        if (userId && this.blacklistedUsers.has(userId)) {
          return true;
        }
      }

      // If no specific configuration, use the default response
      return !this.options.defaultBlacklistResponse;
    } catch (error) {
      this.log(`Error checking token blacklist: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Clears the entire token blacklist
   * 
   * @returns True if the operation was successful
   */
  async clearBlacklist(): Promise<boolean> {
    try {
      this.blacklistedTokens.clear();
      this.blacklistedUsers.clear();
      this.log('Token blacklist cleared');
      return true;
    } catch (error) {
      this.log(`Error clearing token blacklist: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Configures the validation response for a specific token
   * 
   * @param token Token to configure validation for
   * @param isValid Whether the token should be considered valid
   */
  setTokenValidation(token: string, isValid: boolean): void {
    this.validationResponses.set(token, isValid);
    this.log(`Token validation configured for ${this.getTokenIdentifier(token)}: ${isValid}`);
  }

  /**
   * Configures a custom payload for a token
   * 
   * @param token Token to configure payload for
   * @param payload Custom payload to return for this token
   */
  setTokenPayload(token: string, payload: any): void {
    this.tokenPayloads.set(token, payload);
    this.log(`Custom payload configured for ${this.getTokenIdentifier(token)}`);
  }

  /**
   * Resets all mock configurations to defaults
   */
  reset(): void {
    this.validationResponses.clear();
    this.tokenPayloads.clear();
    this.blacklistedTokens.clear();
    this.blacklistedUsers.clear();
    this.log('JWT Provider Mock reset to defaults');
  }

  /**
   * Gets a unique identifier for a token (for logging purposes)
   * 
   * @param token JWT token
   * @returns Token identifier
   */
  private getTokenIdentifier(token: string): string {
    // Use the last 8 characters of the token as an identifier
    return token.slice(-8);
  }

  /**
   * Logs a message if logging is enabled
   * 
   * @param message Message to log
   * @param level Log level
   */
  private log(message: string, level: 'log' | 'debug' | 'error' = 'log'): void {
    if (!this.options.enableLogging) {
      return;
    }

    switch (level) {
      case 'debug':
        this.logger.debug(message);
        break;
      case 'error':
        this.logger.error(message);
        break;
      default:
        this.logger.log(message);
    }
  }
}