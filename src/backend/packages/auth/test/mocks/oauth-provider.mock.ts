/**
 * @file OAuth Provider Mock
 * @description Base mock class for OAuth providers that simulates external identity provider authentication.
 * This abstract mock class serves as the foundation for provider-specific implementations and provides
 * common OAuth functionality like profile normalization and token validation.
 */

import { OAuthProfile, OAuthToken, OAuthConfig } from '../../src/providers/oauth/interfaces';

/**
 * Abstract base class for OAuth provider mocks
 * Provides common functionality for simulating OAuth authentication flows
 */
export abstract class BaseOAuthProviderMock {
  /**
   * Provider name (e.g., 'google', 'facebook', 'apple')
   */
  abstract readonly providerName: string;

  /**
   * Mock configuration for the provider
   */
  protected config: OAuthConfig;

  /**
   * Predefined test profiles for different test scenarios
   */
  protected testProfiles: Record<string, OAuthProfile> = {};

  /**
   * Predefined test tokens for different test scenarios
   */
  protected testTokens: Record<string, OAuthToken> = {};

  /**
   * Creates an instance of BaseOAuthProviderMock
   * @param config - Mock configuration for the provider
   */
  constructor(config: OAuthConfig) {
    this.config = config;
    this.initializeTestData();
  }

  /**
   * Initializes test data for the provider
   * This method should be implemented by concrete provider mocks
   */
  protected abstract initializeTestData(): void;

  /**
   * Simulates validating a token with the provider
   * @param token - The token to validate
   * @returns The validated user profile
   * @throws Error if token validation fails
   */
  async validateToken(token: string): Promise<OAuthProfile> {
    // Check if this is one of our test tokens
    const tokenId = this.getTokenId(token);
    if (tokenId && this.testProfiles[tokenId]) {
      return this.testProfiles[tokenId];
    }

    // Simulate token validation failure
    throw new Error('Invalid token');
  }

  /**
   * Simulates exchanging an authorization code for tokens
   * @param code - The authorization code to exchange
   * @returns The OAuth tokens
   * @throws Error if code exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    // Check if this is one of our test codes
    if (this.testTokens[code]) {
      return this.testTokens[code];
    }

    // Simulate code exchange failure
    throw new Error('Invalid authorization code');
  }

  /**
   * Simulates refreshing an expired access token
   * @param refreshToken - The refresh token to use
   * @returns The new OAuth tokens
   * @throws Error if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    // Check if this is one of our test refresh tokens
    const tokenId = this.getTokenId(refreshToken);
    if (tokenId && this.testTokens[tokenId]) {
      return {
        ...this.testTokens[tokenId],
        accessToken: `new_access_token_${tokenId}`,
      };
    }

    // Simulate token refresh failure
    throw new Error('Invalid refresh token');
  }

  /**
   * Gets a test profile by ID
   * @param profileId - The ID of the test profile to retrieve
   * @returns The test profile or undefined if not found
   */
  getTestProfile(profileId: string): OAuthProfile | undefined {
    return this.testProfiles[profileId];
  }

  /**
   * Gets a test token by ID
   * @param tokenId - The ID of the test token to retrieve
   * @returns The test token or undefined if not found
   */
  getTestToken(tokenId: string): OAuthToken | undefined {
    return this.testTokens[tokenId];
  }

  /**
   * Creates a test token with the specified profile ID
   * @param profileId - The ID of the profile to associate with the token
   * @param expiresIn - Optional token expiration in seconds (default: 3600)
   * @returns The created test token
   */
  createTestToken(profileId: string, expiresIn: number = 3600): string {
    const tokenId = `test_token_${profileId}`;
    this.testTokens[tokenId] = {
      accessToken: tokenId,
      refreshToken: `refresh_${tokenId}`,
      idToken: `id_${tokenId}`,
      tokenType: 'Bearer',
      expiresIn,
      scope: 'email profile',
    };
    return tokenId;
  }

  /**
   * Extracts the token ID from a token string
   * @param token - The token string
   * @returns The token ID or undefined if not found
   */
  protected getTokenId(token: string): string | undefined {
    // In a real implementation, this would decode the JWT
    // For the mock, we just check if it's one of our test tokens
    return Object.keys(this.testTokens).find(id => 
      token === this.testTokens[id].accessToken ||
      token === this.testTokens[id].refreshToken ||
      token === this.testTokens[id].idToken
    );
  }

  /**
   * Simulates token validation failure
   * @param errorType - The type of error to simulate
   * @returns A function that throws the specified error
   */
  simulateTokenValidationFailure(errorType: 'expired' | 'invalid' | 'malformed'): () => never {
    return () => {
      switch (errorType) {
        case 'expired':
          const error = new Error('Token expired') as Error & { name: string };
          error.name = 'TokenExpiredError';
          throw error;
        case 'malformed':
          const malformedError = new Error('Token malformed') as Error & { name: string };
          malformedError.name = 'JsonWebTokenError';
          throw malformedError;
        case 'invalid':
        default:
          throw new Error('Invalid token');
      }
    };
  }

  /**
   * Resets all test data to initial state
   */
  reset(): void {
    this.testProfiles = {};
    this.testTokens = {};
    this.initializeTestData();
  }
}