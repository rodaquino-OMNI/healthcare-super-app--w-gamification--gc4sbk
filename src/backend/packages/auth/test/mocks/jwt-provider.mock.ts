/**
 * @file jwt-provider.mock.ts
 * @description Mock implementation of the JWT provider that simulates token generation, validation,
 * and verification without cryptographic operations. This mock enables testing of JWT-dependent
 * authentication flows without relying on actual JWT signing and verification.
 */

import { IJwtProvider, IJwtBlacklist } from '../../src/providers/jwt/jwt.interface';
import { ITokenPayload, ITokenValidationOptions } from '../../src/interfaces/token.interface';
import { JourneyType } from '../../src/interfaces/role.interface';

/**
 * Configuration options for the mock JWT provider.
 */
export interface MockJwtProviderOptions {
  /**
   * Default validation response for token validation.
   * If true, all tokens will be considered valid by default.
   * Default: true
   */
  defaultValidationResponse?: boolean;

  /**
   * Default token payload to use when generating tokens.
   * This will be merged with any payload provided during token generation.
   */
  defaultPayload?: Partial<ITokenPayload>;

  /**
   * Whether to simulate token expiration based on the exp claim.
   * Default: true
   */
  simulateExpiration?: boolean;

  /**
   * Whether to automatically blacklist revoked tokens.
   * Default: true
   */
  blacklistRevokedTokens?: boolean;
}

/**
 * Mock implementation of the JWT provider for testing purposes.
 * Simulates token generation, validation, and verification without cryptographic operations.
 * 
 * @template TUser The user entity type
 */
export class MockJwtProvider<TUser extends Record<string, any>> implements IJwtProvider<TUser>, IJwtBlacklist {
  /**
   * Map of blacklisted tokens.
   * Key: token string, Value: expiration timestamp
   */
  private blacklistedTokens: Map<string, number> = new Map();

  /**
   * Map of generated tokens.
   * Key: token string, Value: token payload
   */
  private tokenStore: Map<string, ITokenPayload> = new Map();

  /**
   * Map of refresh tokens to access tokens.
   * Key: refresh token, Value: access token
   */
  private refreshTokenStore: Map<string, string> = new Map();

  /**
   * Map of user IDs to tokens.
   * Key: user ID, Value: array of tokens
   */
  private userTokens: Map<string, string[]> = new Map();

  /**
   * Map of tokens to validation responses.
   * Key: token string, Value: validation response
   */
  private validationResponses: Map<string, boolean | ITokenPayload | null> = new Map();

  /**
   * Creates a new instance of the MockJwtProvider.
   * 
   * @param options Configuration options for the mock provider
   */
  constructor(private options: MockJwtProviderOptions = {}) {
    this.options = {
      defaultValidationResponse: true,
      simulateExpiration: true,
      blacklistRevokedTokens: true,
      ...options
    };
  }

  /**
   * Validates user credentials and returns the authenticated user.
   * This is a mock implementation that always returns the provided user.
   * 
   * @param credentials User credentials
   * @returns Promise resolving to the authenticated user
   */
  async validateCredentials(credentials: Record<string, any>): Promise<TUser | null> {
    // This method is not directly related to JWT operations
    // In a real implementation, it would validate username/password
    // For the mock, we'll just return null as it's not typically used in JWT tests
    return null;
  }

  /**
   * Validates a JWT token and returns the associated user.
   * This is a mock implementation that returns a user based on the token payload.
   * 
   * @param token JWT token to validate
   * @returns Promise resolving to the authenticated user or null if validation fails
   */
  async validateToken(token: string, options?: ITokenValidationOptions): Promise<ITokenPayload | null> {
    // Check if a specific validation response has been set for this token
    if (this.validationResponses.has(token)) {
      const response = this.validationResponses.get(token);
      if (typeof response === 'boolean') {
        return response ? this.tokenStore.get(token) || null : null;
      }
      return response;
    }

    // Check if the token is blacklisted
    if (await this.isTokenBlacklisted(token)) {
      return null;
    }

    // Check if the token exists in our store
    if (!this.tokenStore.has(token)) {
      return null;
    }

    const payload = this.tokenStore.get(token)!;

    // Simulate token expiration if enabled
    if (this.options.simulateExpiration && payload.exp && !options?.ignoreExpiration) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }
    }

    // Validate audience if specified in options
    if (options?.audience && payload.aud) {
      const audience = Array.isArray(options.audience) ? options.audience : [options.audience];
      const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      
      if (!audience.some(aud => tokenAudience.includes(aud))) {
        return null;
      }
    }

    // Validate issuer if specified in options
    if (options?.issuer && payload.iss !== options.issuer) {
      return null;
    }

    // Validate required claims if specified in options
    if (options?.requiredClaims) {
      for (const claim of options.requiredClaims) {
        if (!(claim in payload)) {
          return null;
        }
      }
    }

    return payload;
  }

  /**
   * Retrieves a user by their unique identifier.
   * This is a mock implementation that always returns null.
   * 
   * @param id User identifier
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(id: string): Promise<TUser | null> {
    // This method is not directly related to JWT operations
    // In a real implementation, it would retrieve the user from a database
    // For the mock, we'll just return null as it's typically mocked separately
    return null;
  }

  /**
   * Generates a JWT token for the authenticated user.
   * This is a mock implementation that creates a token with the provided payload.
   * 
   * @param user Authenticated user
   * @param expiresIn Token expiration time in seconds or string (e.g., '1h', '7d')
   * @param journeyType Optional journey context to include in the token
   * @returns Promise resolving to the generated token
   */
  async generateToken(user: TUser, expiresIn?: number | string, journeyType?: JourneyType): Promise<string> {
    // Create a basic payload with required fields
    const now = Math.floor(Date.now() / 1000);
    let expiration: number;
    
    if (typeof expiresIn === 'number') {
      expiration = now + expiresIn;
    } else if (typeof expiresIn === 'string') {
      // Simple parsing for common formats like '1h', '7d'
      const match = expiresIn.match(/^(\d+)([smhd])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        
        switch (unit) {
          case 's': expiration = now + value; break;
          case 'm': expiration = now + value * 60; break;
          case 'h': expiration = now + value * 3600; break;
          case 'd': expiration = now + value * 86400; break;
          default: expiration = now + 3600; // Default to 1 hour
        }
      } else {
        expiration = now + 3600; // Default to 1 hour
      }
    } else {
      expiration = now + 3600; // Default to 1 hour
    }

    // Create the token payload
    const payload: ITokenPayload = {
      sub: user.id?.toString() || 'unknown',
      email: user.email || 'user@example.com',
      name: user.name || 'Test User',
      roles: user.roles || [],
      permissions: user.permissions || [],
      iat: now,
      exp: expiration,
      ...(journeyType && { journeyContext: journeyType }),
      ...(this.options.defaultPayload || {})
    };

    // Generate a simple token (in a real implementation, this would be a signed JWT)
    const token = `mock_jwt_${Buffer.from(JSON.stringify(payload)).toString('base64')}`;

    // Store the token and its payload
    this.tokenStore.set(token, payload);

    // Associate the token with the user
    const userId = user.id?.toString() || 'unknown';
    if (!this.userTokens.has(userId)) {
      this.userTokens.set(userId, []);
    }
    this.userTokens.get(userId)!.push(token);

    // Generate a refresh token and associate it with the access token
    const refreshToken = `mock_refresh_${Buffer.from(JSON.stringify({ sub: userId, jti: Math.random().toString(36).substring(2) })).toString('base64')}`;
    this.refreshTokenStore.set(refreshToken, token);

    return token;
  }

  /**
   * Decodes a JWT token and returns its payload without validation.
   * This is a mock implementation that retrieves the stored payload for the token.
   * 
   * @param token JWT token to decode
   * @returns Promise resolving to the decoded token payload or null if decoding fails
   */
  async decodeToken(token: string): Promise<ITokenPayload | null> {
    return this.tokenStore.get(token) || null;
  }

  /**
   * Extracts the JWT token from the request.
   * This is a mock implementation that extracts the token from the Authorization header.
   * 
   * @param request HTTP request object
   * @returns Extracted token or null if not found
   */
  extractTokenFromRequest(request: any): string | null {
    if (!request) return null;

    // Extract from Authorization header
    if (request.headers?.authorization) {
      const authHeader = request.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    // Extract from query parameter
    if (request.query?.token) {
      return request.query.token;
    }

    // Extract from cookies
    if (request.cookies?.token) {
      return request.cookies.token;
    }

    return null;
  }

  /**
   * Revokes a JWT token, making it invalid for future authentication.
   * This is a mock implementation that adds the token to the blacklist.
   * 
   * @param token JWT token to revoke
   * @returns Promise resolving to true if revocation was successful, false otherwise
   */
  async revokeToken(token: string): Promise<boolean> {
    if (!this.tokenStore.has(token)) {
      return false;
    }

    if (this.options.blacklistRevokedTokens) {
      const payload = this.tokenStore.get(token)!;
      return this.addToBlacklist(token, payload);
    }

    return true;
  }

  /**
   * Refreshes an existing token and returns a new one.
   * This is a mock implementation that generates a new token based on the refresh token.
   * 
   * @param refreshToken Refresh token
   * @returns Promise resolving to the new access token or null if refresh fails
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    if (!this.refreshTokenStore.has(refreshToken)) {
      return null;
    }

    const oldToken = this.refreshTokenStore.get(refreshToken)!;
    const payload = this.tokenStore.get(oldToken);

    if (!payload) {
      return null;
    }

    // Revoke the old token
    await this.revokeToken(oldToken);

    // Create a new token with the same payload but updated expiration
    const now = Math.floor(Date.now() / 1000);
    const newPayload: ITokenPayload = {
      ...payload,
      iat: now,
      exp: now + 3600, // Default to 1 hour
      jti: Math.random().toString(36).substring(2) // New unique ID
    };

    const newToken = `mock_jwt_${Buffer.from(JSON.stringify(newPayload)).toString('base64')}`;
    this.tokenStore.set(newToken, newPayload);

    // Update the refresh token mapping
    this.refreshTokenStore.set(refreshToken, newToken);

    // Update user tokens
    const userId = payload.sub;
    if (this.userTokens.has(userId)) {
      const tokens = this.userTokens.get(userId)!;
      const index = tokens.indexOf(oldToken);
      if (index !== -1) {
        tokens[index] = newToken;
      } else {
        tokens.push(newToken);
      }
    }

    return newToken;
  }

  /**
   * Adds a token to the blacklist, making it invalid for future authentication.
   * 
   * @param token JWT token to blacklist
   * @param payload Decoded token payload
   * @returns Promise resolving to true if the token was added to the blacklist, false otherwise
   */
  async addToBlacklist(token: string, payload: ITokenPayload): Promise<boolean> {
    // Use the token expiration as the blacklist expiration
    const expiration = payload.exp || Math.floor(Date.now() / 1000) + 3600;
    this.blacklistedTokens.set(token, expiration);
    return true;
  }

  /**
   * Checks if a token is blacklisted.
   * 
   * @param token JWT token to check
   * @returns Promise resolving to true if the token is blacklisted, false otherwise
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    if (!this.blacklistedTokens.has(token)) {
      return false;
    }

    // Check if the blacklist entry has expired
    const expiration = this.blacklistedTokens.get(token)!;
    const now = Math.floor(Date.now() / 1000);

    if (now > expiration) {
      // Remove expired entries from the blacklist
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Removes a token from the blacklist, making it valid again.
   * This is primarily used for testing and administrative purposes.
   * 
   * @param token JWT token to remove from the blacklist
   * @returns Promise resolving to true if the token was removed from the blacklist, false otherwise
   */
  async removeFromBlacklist(token: string): Promise<boolean> {
    return this.blacklistedTokens.delete(token);
  }

  /**
   * Clears all blacklisted tokens.
   * This is primarily used for testing and administrative purposes.
   * 
   * @returns Promise resolving to true if the blacklist was cleared, false otherwise
   */
  async clearBlacklist(): Promise<boolean> {
    this.blacklistedTokens.clear();
    return true;
  }

  /**
   * Sets a specific validation response for a token.
   * This allows tests to control the behavior of token validation.
   * 
   * @param token JWT token
   * @param response Validation response (true/false or a payload)
   */
  setValidationResponse(token: string, response: boolean | ITokenPayload | null): void {
    this.validationResponses.set(token, response);
  }

  /**
   * Clears all validation responses.
   * This resets the mock to use the default validation behavior.
   */
  clearValidationResponses(): void {
    this.validationResponses.clear();
  }

  /**
   * Clears all stored tokens and related data.
   * This is useful for resetting the mock between tests.
   */
  reset(): void {
    this.blacklistedTokens.clear();
    this.tokenStore.clear();
    this.refreshTokenStore.clear();
    this.userTokens.clear();
    this.validationResponses.clear();
  }

  /**
   * Gets all tokens associated with a user.
   * This is useful for testing token management.
   * 
   * @param userId User ID
   * @returns Array of tokens associated with the user
   */
  getUserTokens(userId: string): string[] {
    return this.userTokens.get(userId) || [];
  }

  /**
   * Manually adds a token to the token store.
   * This is useful for testing with predefined tokens.
   * 
   * @param token JWT token
   * @param payload Token payload
   */
  addToken(token: string, payload: ITokenPayload): void {
    this.tokenStore.set(token, payload);
    
    // Associate the token with the user
    const userId = payload.sub;
    if (!this.userTokens.has(userId)) {
      this.userTokens.set(userId, []);
    }
    this.userTokens.get(userId)!.push(token);
  }
}