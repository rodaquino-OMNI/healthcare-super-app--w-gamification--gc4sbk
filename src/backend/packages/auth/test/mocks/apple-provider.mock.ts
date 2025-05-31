/**
 * @file Apple OAuth Provider Mock
 * @description Mock implementation of the Apple OAuth provider that extends the base OAuth provider mock.
 * This mock simulates Apple-specific authentication behavior with predefined test profiles and token responses.
 * It enables testing of Sign in with Apple flows without requiring actual Apple Developer credentials or network connectivity.
 */

import { BaseOAuthProviderMock } from './oauth-provider.mock';
import { AppleOAuthConfig, AppleProfile, OAuthToken } from '../../src/providers/oauth/interfaces';

/**
 * Mock implementation of the Apple OAuth provider
 * Simulates Apple-specific authentication behavior for testing
 */
export class AppleOAuthProviderMock extends BaseOAuthProviderMock {
  /**
   * Provider name
   */
  readonly providerName = 'apple';

  /**
   * Apple-specific configuration
   */
  protected config: AppleOAuthConfig;

  /**
   * Creates an instance of AppleOAuthProviderMock
   * @param config - Mock configuration for the Apple provider
   */
  constructor(config?: Partial<AppleOAuthConfig>) {
    // Create default Apple OAuth configuration for testing
    const defaultConfig: AppleOAuthConfig = {
      clientID: 'test.apple.client.id',
      clientSecret: 'test_apple_client_secret',
      callbackURL: 'https://austa.app/auth/apple/callback',
      teamID: 'TEST_TEAM_ID',
      keyID: 'TEST_KEY_ID',
      privateKeyLocation: '/path/to/mock/private/key.p8',
      scope: ['name', 'email'],
    };

    super({ ...defaultConfig, ...config });
    this.config = { ...defaultConfig, ...config } as AppleOAuthConfig;
  }

  /**
   * Initializes test data for Apple authentication scenarios
   */
  protected initializeTestData(): void {
    // Standard user with all profile information
    this.testProfiles['standard'] = {
      id: 'apple_user_123456',
      provider: 'apple',
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'John',
      lastName: 'Appleseed',
      displayName: 'John Appleseed',
      name: {
        firstName: 'John',
        lastName: 'Appleseed',
      },
      _raw: {
        sub: 'apple_user_123456',
        email: 'user@example.com',
        email_verified: true,
        name: {
          firstName: 'John',
          lastName: 'Appleseed',
        },
      },
      _json: {
        sub: 'apple_user_123456',
        email: 'user@example.com',
        email_verified: true,
        name: {
          firstName: 'John',
          lastName: 'Appleseed',
        },
      },
    };

    // User with private email relay
    this.testProfiles['private_email'] = {
      id: 'apple_user_789012',
      provider: 'apple',
      email: 'private_relay_token@privaterelay.appleid.com',
      emailVerified: true,
      isPrivateEmail: true,
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Jane Doe',
      name: {
        firstName: 'Jane',
        lastName: 'Doe',
      },
      _raw: {
        sub: 'apple_user_789012',
        email: 'private_relay_token@privaterelay.appleid.com',
        email_verified: true,
        name: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
      },
      _json: {
        sub: 'apple_user_789012',
        email: 'private_relay_token@privaterelay.appleid.com',
        email_verified: true,
        name: {
          firstName: 'Jane',
          lastName: 'Doe',
        },
      },
    };

    // User without name information (subsequent sign-ins)
    this.testProfiles['no_name'] = {
      id: 'apple_user_345678',
      provider: 'apple',
      email: 'no_name@example.com',
      emailVerified: true,
      _raw: {
        sub: 'apple_user_345678',
        email: 'no_name@example.com',
        email_verified: true,
      },
      _json: {
        sub: 'apple_user_345678',
        email: 'no_name@example.com',
        email_verified: true,
      },
    };

    // Create test tokens for each profile
    this.createTestTokensForProfiles();
  }

  /**
   * Creates test tokens for each predefined profile
   */
  private createTestTokensForProfiles(): void {
    // Create tokens for each profile
    Object.keys(this.testProfiles).forEach(profileId => {
      const tokenId = `apple_${profileId}`;
      this.testTokens[tokenId] = {
        accessToken: `apple_access_token_${profileId}`,
        refreshToken: `apple_refresh_token_${profileId}`,
        idToken: this.createMockIdToken(profileId),
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'name email',
      };
    });

    // Add a special expired token
    this.testTokens['expired'] = {
      accessToken: 'apple_expired_token',
      refreshToken: 'apple_expired_refresh_token',
      idToken: 'apple_expired_id_token',
      tokenType: 'Bearer',
      expiresIn: -3600, // Negative value to indicate expiration
      scope: 'name email',
    };
  }

  /**
   * Creates a mock Apple ID token for testing
   * @param profileId - The profile ID to use for the token
   * @returns A mock ID token string
   */
  private createMockIdToken(profileId: string): string {
    // In a real implementation, this would create a proper JWT
    // For the mock, we just return a predictable string
    return `apple_id_token_${profileId}`;
  }

  /**
   * Simulates validating an Apple ID token
   * @param token - The ID token to validate
   * @returns The validated user profile
   * @throws Error if token validation fails
   */
  async validateToken(token: string): Promise<AppleProfile> {
    // Special case for expired token
    if (token === this.testTokens['expired']?.idToken) {
      const error = new Error('Token expired') as Error & { name: string };
      error.name = 'TokenExpiredError';
      throw error;
    }

    // Use the base implementation for other tokens
    return super.validateToken(token) as Promise<AppleProfile>;
  }

  /**
   * Simulates exchanging an authorization code for Apple tokens
   * @param code - The authorization code to exchange
   * @returns The OAuth tokens from Apple
   * @throws Error if code exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    // Check if this is a special test code
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }

    if (code === 'server_error') {
      throw new Error('Apple server error');
    }

    // Map profile codes to tokens
    if (code.startsWith('profile_')) {
      const profileId = code.replace('profile_', '');
      const tokenId = `apple_${profileId}`;
      if (this.testTokens[tokenId]) {
        return this.testTokens[tokenId];
      }
    }

    // Use the base implementation for other codes
    return super.exchangeCodeForToken(code);
  }

  /**
   * Simulates refreshing an Apple access token
   * @param refreshToken - The refresh token to use
   * @returns The new OAuth tokens from Apple
   * @throws Error if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    // Check if this is a special test refresh token
    if (refreshToken === 'invalid_refresh') {
      throw new Error('Invalid refresh token');
    }

    if (refreshToken === 'server_error_refresh') {
      throw new Error('Apple server error during refresh');
    }

    // Use the base implementation for other refresh tokens
    return super.refreshToken(refreshToken);
  }

  /**
   * Simulates generating a client secret for Apple authentication
   * @returns A mock client secret
   */
  generateClientSecret(): string {
    return 'mock_apple_client_secret_jwt';
  }

  /**
   * Gets a test profile by scenario name
   * @param scenario - The scenario name ('standard', 'private_email', 'no_name')
   * @returns The test profile for the scenario
   */
  getProfileByScenario(scenario: 'standard' | 'private_email' | 'no_name'): AppleProfile {
    return this.testProfiles[scenario] as AppleProfile;
  }

  /**
   * Gets a test token by scenario name
   * @param scenario - The scenario name ('standard', 'private_email', 'no_name', 'expired')
   * @returns The test token for the scenario
   */
  getTokenByScenario(scenario: 'standard' | 'private_email' | 'no_name' | 'expired'): OAuthToken {
    const tokenId = scenario === 'expired' ? 'expired' : `apple_${scenario}`;
    return this.testTokens[tokenId];
  }

  /**
   * Creates a test authorization code for a specific profile scenario
   * @param scenario - The profile scenario to create a code for
   * @returns A test authorization code
   */
  createAuthorizationCode(scenario: 'standard' | 'private_email' | 'no_name'): string {
    return `profile_${scenario}`;
  }
}