/**
 * @file Token Service Mock
 * 
 * Mock implementation of the TokenService that provides test utilities for generating,
 * validating, and refreshing authentication tokens. This mock eliminates dependencies
 * on JWT libraries and Redis while maintaining the same interface as the real service.
 * It enables testing of components that rely on token operations without the complexity
 * of actual token management.
 */

import { Injectable } from '@nestjs/common';

import { ERROR_CODES, TOKEN_TYPES } from '../../src/constants';
import {
  TokenPayload,
  TokenResponse,
  TokenType,
  TokenUserInfo,
  RefreshTokenRequest,
  TokenOperation,
} from '../../src/types';

/**
 * Configuration for the mock token service
 */
export interface MockTokenServiceConfig {
  /**
   * Whether token validation should succeed
   * @default true
   */
  validationSucceeds?: boolean;

  /**
   * Whether token refresh should succeed
   * @default true
   */
  refreshSucceeds?: boolean;

  /**
   * Whether tokens should be considered blacklisted
   * @default false
   */
  tokensBlacklisted?: boolean;

  /**
   * Custom error to throw during validation
   */
  validationError?: string;

  /**
   * Access token expiration in seconds
   * @default 3600 (1 hour)
   */
  accessTokenExpiration?: number;

  /**
   * Refresh token expiration in seconds
   * @default 604800 (7 days)
   */
  refreshTokenExpiration?: number;

  /**
   * Token issuer
   * @default 'austa-superapp-test'
   */
  issuer?: string;

  /**
   * Token audience
   * @default 'austa-users-test'
   */
  audience?: string;
}

/**
 * Mock implementation of the TokenService for testing
 */
@Injectable()
export class MockTokenService {
  private config: Required<MockTokenServiceConfig>;
  private blacklistedTokens: Set<string> = new Set();

  /**
   * Create a new instance of the mock token service
   * 
   * @param config Configuration options
   */
  constructor(config: MockTokenServiceConfig = {}) {
    this.config = {
      validationSucceeds: config.validationSucceeds ?? true,
      refreshSucceeds: config.refreshSucceeds ?? true,
      tokensBlacklisted: config.tokensBlacklisted ?? false,
      validationError: config.validationError ?? ERROR_CODES.INVALID_TOKEN,
      accessTokenExpiration: config.accessTokenExpiration ?? 3600,
      refreshTokenExpiration: config.refreshTokenExpiration ?? 604800,
      issuer: config.issuer ?? 'austa-superapp-test',
      audience: config.audience ?? 'austa-users-test',
    };
  }

  /**
   * Update the mock configuration
   * 
   * @param config New configuration options
   */
  updateConfig(config: Partial<MockTokenServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Reset the mock to its initial state
   */
  reset(): void {
    this.blacklistedTokens.clear();
    this.config.validationSucceeds = true;
    this.config.refreshSucceeds = true;
    this.config.tokensBlacklisted = false;
  }

  /**
   * Generate a mock access token
   * 
   * @param userInfo User information to include in the token
   * @returns Mock JWT access token
   */
  async generateAccessToken(userInfo: TokenUserInfo): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      roles: userInfo.roles || [],
      permissions: userInfo.permissions || [],
      type: TokenType.ACCESS,
      iat: now,
      exp: now + this.config.accessTokenExpiration,
      iss: this.config.issuer,
      aud: this.config.audience,
    };

    // Create a predictable token format for testing
    return this.createMockToken(payload);
  }

  /**
   * Generate a mock refresh token
   * 
   * @param userInfo User information to include in the token
   * @returns Mock JWT refresh token
   */
  async generateRefreshToken(userInfo: TokenUserInfo): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      roles: userInfo.roles || [],
      type: TokenType.REFRESH,
      iat: now,
      exp: now + this.config.refreshTokenExpiration,
      iss: this.config.issuer,
      aud: this.config.audience,
      jti: this.generateTokenId(),
    };

    // Create a predictable token format for testing
    return this.createMockToken(payload);
  }

  /**
   * Generate both access and refresh tokens
   * 
   * @param userInfo User information to include in the tokens
   * @returns Token response with access and refresh tokens
   */
  async generateTokens(userInfo: TokenUserInfo): Promise<TokenResponse> {
    const accessToken = await this.generateAccessToken(userInfo);
    const refreshToken = await this.generateRefreshToken(userInfo);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenExpiration,
      tokenType: 'Bearer',
    };
  }

  /**
   * Validate a mock JWT token
   * 
   * @param token JWT token to validate
   * @param tokenType Expected token type
   * @returns Decoded token payload if valid
   * @throws Error if token is invalid or expired based on mock configuration
   */
  async validateToken(token: string, tokenType: TokenType): Promise<TokenPayload> {
    // If validation is configured to fail, throw the configured error
    if (!this.config.validationSucceeds) {
      throw new Error(this.config.validationError);
    }

    // Decode the token
    const payload = this.decodeToken(token);

    // Check token type
    if (payload.type !== tokenType) {
      throw new Error(ERROR_CODES.INVALID_TOKEN);
    }

    // Check if token is blacklisted
    if (this.config.tokensBlacklisted || this.blacklistedTokens.has(token)) {
      throw new Error(ERROR_CODES.TOKEN_REVOKED);
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error(ERROR_CODES.TOKEN_EXPIRED);
    }

    return payload;
  }

  /**
   * Decode a mock JWT token without validation
   * 
   * @param token JWT token to decode
   * @returns Decoded token payload
   */
  decodeToken(token: string): TokenPayload {
    try {
      // Extract the payload from the mock token
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // The payload is the second part (index 1)
      const payloadBase64 = parts[1];
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      return JSON.parse(payloadJson);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error.message}`);
    }
  }

  /**
   * Refresh an access token using a refresh token
   * 
   * @param refreshTokenRequest Refresh token request
   * @returns New token response with fresh access and refresh tokens
   * @throws Error if refresh token is invalid or expired based on mock configuration
   */
  async refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<TokenResponse> {
    const { refreshToken } = refreshTokenRequest;

    // If refresh is configured to fail, throw an error
    if (!this.config.refreshSucceeds) {
      throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
    }

    try {
      // Validate the refresh token
      const payload = await this.validateToken(refreshToken, TokenType.REFRESH);

      // Blacklist the old refresh token
      this.blacklistedTokens.add(refreshToken);

      // Extract user info from payload
      const userInfo: TokenUserInfo = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      };

      // Generate new tokens
      return this.generateTokens(userInfo);
    } catch (error) {
      if (error.message === ERROR_CODES.TOKEN_EXPIRED) {
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      } else if (error.message === ERROR_CODES.INVALID_TOKEN) {
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      } else if (error.message === ERROR_CODES.TOKEN_REVOKED) {
        throw new Error(ERROR_CODES.INVALID_REFRESH_TOKEN);
      }

      throw error;
    }
  }

  /**
   * Revoke a token by adding it to the blacklist
   * 
   * @param token JWT token to revoke
   * @returns True if token was successfully revoked
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      // Decode token to check validity
      const payload = this.decodeToken(token);
      
      // Add token to blacklist
      this.blacklistedTokens.add(token);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a special-purpose token (e.g., password reset, email verification)
   * 
   * @param userId User ID
   * @param tokenType Token type
   * @param expiresIn Token expiration time in seconds
   * @param additionalData Additional data to include in the token
   * @returns Special-purpose JWT token
   */
  async generateSpecialToken(
    userId: string,
    tokenType: TokenType,
    expiresIn: number,
    additionalData?: Record<string, any>,
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: Partial<TokenPayload> = {
      sub: userId,
      type: tokenType,
      iat: now,
      exp: now + expiresIn,
      iss: this.config.issuer,
      jti: this.generateTokenId(),
      ...additionalData,
    };

    return this.createMockToken(payload as TokenPayload);
  }

  /**
   * Perform a token operation (create, verify, refresh, revoke)
   * 
   * @param operation Token operation details
   * @returns Operation result
   */
  async performTokenOperation(operation: TokenOperation): Promise<any> {
    switch (operation.operation) {
      case 'create':
        if (!operation.payload) {
          throw new Error('Payload is required for token creation');
        }
        
        const userInfo: TokenUserInfo = {
          id: operation.payload.sub,
          email: operation.payload.email,
          roles: operation.payload.roles || [],
          permissions: operation.payload.permissions,
        };
        
        return operation.tokenType === TokenType.ACCESS
          ? this.generateAccessToken(userInfo)
          : this.generateRefreshToken(userInfo);
        
      case 'verify':
        if (!operation.token) {
          throw new Error('Token is required for verification');
        }
        return this.validateToken(operation.token, operation.tokenType);
        
      case 'refresh':
        if (!operation.token) {
          throw new Error('Refresh token is required');
        }
        return this.refreshToken({ refreshToken: operation.token });
        
      case 'revoke':
        if (!operation.token) {
          throw new Error('Token is required for revocation');
        }
        return this.revokeToken(operation.token);
        
      default:
        throw new Error(`Unsupported token operation: ${operation.operation}`);
    }
  }

  /**
   * Get all blacklisted tokens
   * 
   * @returns Array of blacklisted tokens
   */
  getBlacklistedTokens(): string[] {
    return Array.from(this.blacklistedTokens);
  }

  /**
   * Check if a token is blacklisted
   * 
   * @param token JWT token
   * @returns True if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.config.tokensBlacklisted || this.blacklistedTokens.has(token);
  }

  /**
   * Create a mock token with the given payload
   * 
   * @param payload Token payload
   * @returns Mock JWT token
   */
  private createMockToken(payload: TokenPayload): string {
    // Create a simplified mock token structure
    // Header.Payload.Signature
    // Where header and signature are fixed for testing
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = 'MOCK_SIGNATURE_FOR_TESTING';

    return `${header}.${payloadBase64}.${signature}`;
  }

  /**
   * Generate a unique token ID
   * 
   * @returns Unique token ID
   */
  private generateTokenId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}