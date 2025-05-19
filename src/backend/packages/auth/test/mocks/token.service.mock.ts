/**
 * @file token.service.mock.ts
 * @description Mock implementation of the TokenService for testing purposes.
 * Provides test utilities for generating, validating, and refreshing authentication tokens
 * without dependencies on JWT libraries and Redis.
 */

import { Injectable } from '@nestjs/common';
import { ITokenPayload, ITokenValidationOptions, ITokenResponse } from '../../src/interfaces/token.interface';
import { IJwtProvider, IJwtRefreshOptions } from '../../src/providers/jwt/jwt.interface';
import { JourneyType } from '../../src/interfaces/role.interface';

/**
 * Configuration options for the MockTokenService.
 */
export interface MockTokenServiceOptions {
  /**
   * Default validation behavior (true = valid, false = invalid)
   */
  defaultValidationResult?: boolean;

  /**
   * Map of tokens to their validation results for specific test cases
   */
  validationOverrides?: Map<string, boolean>;

  /**
   * Map of tokens to their decoded payloads for specific test cases
   */
  tokenPayloads?: Map<string, ITokenPayload>;

  /**
   * Map of refresh tokens to their corresponding access tokens
   */
  refreshTokenMap?: Map<string, string>;

  /**
   * Set of blacklisted tokens
   */
  blacklistedTokens?: Set<string>;

  /**
   * Default token expiration time in seconds
   */
  defaultExpiresIn?: number;

  /**
   * Default token issuer
   */
  defaultIssuer?: string;

  /**
   * Default token audience
   */
  defaultAudience?: string | string[];
}

/**
 * Mock implementation of the TokenService for testing purposes.
 * Eliminates dependencies on JWT libraries and Redis while maintaining
 * the same interface as the real service.
 * 
 * @template TUser The user entity type
 */
@Injectable()
export class MockTokenService<TUser extends Record<string, any>> implements IJwtProvider<TUser> {
  private defaultValidationResult: boolean;
  private validationOverrides: Map<string, boolean>;
  private tokenPayloads: Map<string, ITokenPayload>;
  private refreshTokenMap: Map<string, string>;
  private blacklistedTokens: Set<string>;
  private defaultExpiresIn: number;
  private defaultIssuer: string;
  private defaultAudience: string | string[];

  /**
   * Creates a new instance of the MockTokenService.
   * 
   * @param options Configuration options for the mock service
   */
  constructor(options: MockTokenServiceOptions = {}) {
    this.defaultValidationResult = options.defaultValidationResult ?? true;
    this.validationOverrides = options.validationOverrides ?? new Map<string, boolean>();
    this.tokenPayloads = options.tokenPayloads ?? new Map<string, ITokenPayload>();
    this.refreshTokenMap = options.refreshTokenMap ?? new Map<string, string>();
    this.blacklistedTokens = options.blacklistedTokens ?? new Set<string>();
    this.defaultExpiresIn = options.defaultExpiresIn ?? 3600; // 1 hour
    this.defaultIssuer = options.defaultIssuer ?? 'test-issuer';
    this.defaultAudience = options.defaultAudience ?? 'test-audience';
  }

  /**
   * Validates a JWT token and returns the associated payload.
   * Returns a predefined result based on configuration or defaults to valid.
   * 
   * @param token JWT token to validate
   * @param options Additional validation options
   * @returns Promise resolving to the validated token payload or null if validation fails
   */
  async validateToken(token: string, options?: ITokenValidationOptions): Promise<ITokenPayload | null> {
    // Check if token is blacklisted
    if (this.blacklistedTokens.has(token)) {
      return null;
    }

    // Check if there's a specific validation result for this token
    if (this.validationOverrides.has(token)) {
      const isValid = this.validationOverrides.get(token);
      if (!isValid) {
        return null;
      }
    } else if (!this.defaultValidationResult) {
      // Use default validation result if no override exists
      return null;
    }

    // Return the predefined payload or generate a default one
    if (this.tokenPayloads.has(token)) {
      return this.tokenPayloads.get(token) || null;
    }

    // Generate a default payload if none exists
    return {
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      roles: [1], // Basic user role
      permissions: ['read:profile'],
      iat: Math.floor(Date.now() / 1000) - 60, // Issued 1 minute ago
      exp: Math.floor(Date.now() / 1000) + this.defaultExpiresIn,
      iss: this.defaultIssuer,
      aud: this.defaultAudience,
    };
  }

  /**
   * Generates a JWT token for the authenticated user.
   * Creates a predictable token string based on user properties.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds or string (e.g., '1h', '7d')
   * @param journeyType Optional journey context to include in the token
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number | string, journeyType?: JourneyType): Promise<string> {
    const expiration = typeof expiresIn === 'number' ? expiresIn : this.defaultExpiresIn;
    const now = Math.floor(Date.now() / 1000);
    
    // Create a payload based on user properties
    const payload: ITokenPayload = {
      sub: String(user.id || user._id || 'test-user-id'),
      email: user.email || 'test@example.com',
      name: user.name || user.fullName || user.displayName || 'Test User',
      roles: user.roles || [1],
      permissions: user.permissions || ['read:profile'],
      journeyContext: journeyType,
      iat: now,
      exp: now + expiration,
      iss: this.defaultIssuer,
      aud: this.defaultAudience,
      jti: this.generateTokenId(),
    };

    // Generate a predictable token string
    const token = `mock_token.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
    
    // Store the payload for later validation
    this.tokenPayloads.set(token, payload);
    
    return token;
  }

  /**
   * Decodes a JWT token and returns its payload without validation.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<ITokenPayload | null> {
    if (!token) {
      return null;
    }

    // Return the predefined payload if it exists
    if (this.tokenPayloads.has(token)) {
      return this.tokenPayloads.get(token) || null;
    }

    // Try to decode the token if it follows the expected format
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
        return JSON.parse(payloadJson) as ITokenPayload;
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return null;
  }

  /**
   * Extracts the JWT token from the request.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    if (!request) {
      return null;
    }

    // Extract from Authorization header
    if (request.headers?.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // Extract from query parameter
    if (request.query?.access_token) {
      return request.query.access_token;
    }

    // Extract from cookies
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }

    return null;
  }

  /**
   * Revokes a JWT token, making it invalid for future authentication.
   * Adds the token to the blacklist.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    this.blacklistedTokens.add(token);
    return true;
  }

  /**
   * Refreshes an existing token and returns a new one.
   * Uses the refreshTokenMap to determine the new access token.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    if (!refreshToken || this.blacklistedTokens.has(refreshToken)) {
      return null;
    }

    // Check if there's a mapping for this refresh token
    if (this.refreshTokenMap.has(refreshToken)) {
      return this.refreshTokenMap.get(refreshToken) || null;
    }

    // Generate a new access token with default payload
    const now = Math.floor(Date.now() / 1000);
    const payload: ITokenPayload = {
      sub: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      roles: [1],
      permissions: ['read:profile'],
      iat: now,
      exp: now + this.defaultExpiresIn,
      iss: this.defaultIssuer,
      aud: this.defaultAudience,
      jti: this.generateTokenId(),
    };

    const newToken = `mock_token.${Buffer.from(JSON.stringify(payload)).toString('base64')}.refreshed`;
    this.tokenPayloads.set(newToken, payload);
    this.refreshTokenMap.set(refreshToken, newToken);

    return newToken;
  }

  /**
   * Generates a complete token response including access token, refresh token, and expiration.
   * Useful for testing authentication flows.
   * 
   * @param user User to generate tokens for
   * @param journeyType Optional journey context
   * @returns Promise resolving to the token response
   */
  async generateTokenResponse(user: TUser, journeyType?: JourneyType): Promise<ITokenResponse> {
    const accessToken = await this.generateToken(user, this.defaultExpiresIn, journeyType);
    const refreshToken = `refresh_token.${this.generateTokenId()}`;
    const expiresAt = Date.now() + this.defaultExpiresIn * 1000;

    // Store the refresh token mapping
    this.refreshTokenMap.set(refreshToken, accessToken);

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer',
    };
  }

  /**
   * Sets a specific validation result for a token.
   * Useful for testing different validation scenarios.
   * 
   * @param token Token to set validation result for
   * @param isValid Whether the token should be considered valid
   */
  setTokenValidation(token: string, isValid: boolean): void {
    this.validationOverrides.set(token, isValid);
  }

  /**
   * Sets a specific payload for a token.
   * Useful for testing with specific token claims.
   * 
   * @param token Token to set payload for
   * @param payload Payload to associate with the token
   */
  setTokenPayload(token: string, payload: ITokenPayload): void {
    this.tokenPayloads.set(token, payload);
  }

  /**
   * Sets a specific refresh token mapping.
   * Useful for testing token refresh flows.
   * 
   * @param refreshToken Refresh token
   * @param accessToken Access token to return when the refresh token is used
   */
  setRefreshTokenMapping(refreshToken: string, accessToken: string): void {
    this.refreshTokenMap.set(refreshToken, accessToken);
  }

  /**
   * Adds a token to the blacklist.
   * Useful for testing token revocation.
   * 
   * @param token Token to blacklist
   */
  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * Removes a token from the blacklist.
   * Useful for testing token restoration.
   * 
   * @param token Token to remove from blacklist
   * @returns Whether the token was in the blacklist
   */
  removeFromBlacklist(token: string): boolean {
    return this.blacklistedTokens.delete(token);
  }

  /**
   * Clears all blacklisted tokens.
   * Useful for resetting the mock between tests.
   */
  clearBlacklist(): void {
    this.blacklistedTokens.clear();
  }

  /**
   * Resets all mock data to initial state.
   * Useful for cleaning up between tests.
   */
  reset(): void {
    this.validationOverrides.clear();
    this.tokenPayloads.clear();
    this.refreshTokenMap.clear();
    this.blacklistedTokens.clear();
  }

  /**
   * Generates a unique token ID.
   * Used for the jti claim and refresh tokens.
   * 
   * @returns Unique token ID
   */
  private generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}