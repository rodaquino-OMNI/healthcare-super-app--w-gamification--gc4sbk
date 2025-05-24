/**
 * @file Facebook OAuth Provider Mock
 * @description Mock implementation of the Facebook OAuth provider that extends the base OAuth provider mock.
 * This mock simulates Facebook-specific authentication behavior with predefined test profiles and token responses.
 * It enables testing of Facebook login flows without requiring actual Facebook API credentials or network connectivity.
 */

import { BaseOAuthProviderMock } from './oauth-provider.mock';
import { FacebookOAuthConfig, FacebookProfile, OAuthToken } from '../../src/providers/oauth/interfaces';

/**
 * Mock implementation of the Facebook OAuth provider
 * Simulates Facebook-specific authentication behavior for testing
 */
export class FacebookOAuthProviderMock extends BaseOAuthProviderMock {
  /**
   * Provider name
   */
  readonly providerName = 'facebook';

  /**
   * Facebook-specific configuration
   */
  protected config: FacebookOAuthConfig;

  /**
   * Creates an instance of FacebookOAuthProviderMock
   * @param config - Mock configuration for the Facebook provider
   */
  constructor(config?: Partial<FacebookOAuthConfig>) {
    // Create default Facebook OAuth configuration for testing
    const defaultConfig: FacebookOAuthConfig = {
      clientID: 'test_facebook_app_id',
      clientSecret: 'test_facebook_app_secret',
      callbackURL: 'https://austa.app/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos', 'gender', 'birthday'],
      enableProof: true,
      scope: ['email', 'public_profile'],
    };

    super({ ...defaultConfig, ...config });
    this.config = { ...defaultConfig, ...config } as FacebookOAuthConfig;
  }

  /**
   * Initializes test data for Facebook authentication scenarios
   */
  protected initializeTestData(): void {
    // Standard user with all profile information
    this.testProfiles['standard'] = {
      id: 'facebook_user_123456',
      provider: 'facebook',
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      gender: 'male',
      birthday: '01/01/1990',
      profileUrl: 'https://facebook.com/john.doe',
      photos: [
        { value: 'https://graph.facebook.com/facebook_user_123456/picture?type=large' }
      ],
      emails: [
        { value: 'user@example.com', type: 'account' }
      ],
      name: {
        familyName: 'Doe',
        givenName: 'John',
        middleName: '',
      },
      _raw: JSON.stringify({
        id: 'facebook_user_123456',
        email: 'user@example.com',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'male',
        birthday: '01/01/1990',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_123456/picture?type=large',
            is_silhouette: false
          }
        }
      }),
      _json: {
        id: 'facebook_user_123456',
        email: 'user@example.com',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        gender: 'male',
        birthday: '01/01/1990',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_123456/picture?type=large',
            is_silhouette: false
          }
        }
      },
    };

    // User with limited profile information (no email)
    this.testProfiles['limited'] = {
      id: 'facebook_user_789012',
      provider: 'facebook',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      gender: 'female',
      photos: [
        { value: 'https://graph.facebook.com/facebook_user_789012/picture?type=large' }
      ],
      name: {
        familyName: 'Smith',
        givenName: 'Jane',
        middleName: '',
      },
      _raw: JSON.stringify({
        id: 'facebook_user_789012',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        gender: 'female',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_789012/picture?type=large',
            is_silhouette: false
          }
        }
      }),
      _json: {
        id: 'facebook_user_789012',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        gender: 'female',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_789012/picture?type=large',
            is_silhouette: false
          }
        }
      },
    };

    // User with minimal profile information
    this.testProfiles['minimal'] = {
      id: 'facebook_user_345678',
      provider: 'facebook',
      displayName: 'FB User',
      photos: [
        { value: 'https://graph.facebook.com/facebook_user_345678/picture?type=large' }
      ],
      _raw: JSON.stringify({
        id: 'facebook_user_345678',
        name: 'FB User',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_345678/picture?type=large',
            is_silhouette: true
          }
        }
      }),
      _json: {
        id: 'facebook_user_345678',
        name: 'FB User',
        picture: {
          data: {
            url: 'https://graph.facebook.com/facebook_user_345678/picture?type=large',
            is_silhouette: true
          }
        }
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
      const tokenId = `facebook_${profileId}`;
      this.testTokens[tokenId] = {
        accessToken: `facebook_access_token_${profileId}`,
        refreshToken: `facebook_refresh_token_${profileId}`,
        idToken: undefined, // Facebook doesn't use ID tokens
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'email,public_profile',
      };
    });

    // Add a special expired token
    this.testTokens['expired'] = {
      accessToken: 'facebook_expired_token',
      refreshToken: 'facebook_expired_refresh_token',
      idToken: undefined,
      tokenType: 'Bearer',
      expiresIn: -3600, // Negative value to indicate expiration
      scope: 'email,public_profile',
    };

    // Add a special invalid token
    this.testTokens['invalid'] = {
      accessToken: 'facebook_invalid_token',
      refreshToken: 'facebook_invalid_refresh_token',
      idToken: undefined,
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: 'email,public_profile',
    };
  }

  /**
   * Simulates validating a Facebook access token
   * @param token - The access token to validate
   * @returns The validated user profile
   * @throws Error if token validation fails
   */
  async validateToken(token: string): Promise<FacebookProfile> {
    // Special case for expired token
    if (token === this.testTokens['expired']?.accessToken) {
      const error = new Error('Token expired') as Error & { name: string };
      error.name = 'TokenExpiredError';
      throw error;
    }

    // Special case for invalid token
    if (token === this.testTokens['invalid']?.accessToken) {
      throw new Error('Invalid access token or user ID mismatch');
    }

    // Use the base implementation for other tokens
    return super.validateToken(token) as Promise<FacebookProfile>;
  }

  /**
   * Simulates exchanging an authorization code for Facebook tokens
   * @param code - The authorization code to exchange
   * @returns The OAuth tokens from Facebook
   * @throws Error if code exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    // Check if this is a special test code
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }

    if (code === 'server_error') {
      throw new Error('Facebook server error');
    }

    // Map profile codes to tokens
    if (code.startsWith('profile_')) {
      const profileId = code.replace('profile_', '');
      const tokenId = `facebook_${profileId}`;
      if (this.testTokens[tokenId]) {
        return this.testTokens[tokenId];
      }
    }

    // Use the base implementation for other codes
    return super.exchangeCodeForToken(code);
  }

  /**
   * Simulates refreshing a Facebook access token
   * @param refreshToken - The refresh token to use
   * @returns The new OAuth tokens from Facebook
   * @throws Error if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    // Check if this is a special test refresh token
    if (refreshToken === 'invalid_refresh') {
      throw new Error('Invalid refresh token');
    }

    if (refreshToken === 'server_error_refresh') {
      throw new Error('Facebook server error during refresh');
    }

    // Use the base implementation for other refresh tokens
    return super.refreshToken(refreshToken);
  }

  /**
   * Simulates validating a Facebook access token with the Graph API
   * @param accessToken - The access token to validate
   * @param userId - The Facebook user ID to validate against
   * @returns A promise that resolves if the token is valid
   * @throws Error if token validation fails
   */
  async validateAccessToken(accessToken: string, userId: string): Promise<void> {
    // Special case for expired token
    if (accessToken === this.testTokens['expired']?.accessToken) {
      throw new Error('Token expired');
    }

    // Special case for invalid token
    if (accessToken === this.testTokens['invalid']?.accessToken) {
      throw new Error('Invalid access token or user ID mismatch');
    }

    // Check if this is one of our test tokens
    const tokenId = this.getTokenId(accessToken);
    if (!tokenId) {
      throw new Error('Invalid access token');
    }

    // Check if the user ID matches the token
    const profile = this.testProfiles[tokenId.replace('facebook_', '')];
    if (profile && profile.id !== userId) {
      throw new Error('User ID mismatch');
    }

    // Token is valid
    return Promise.resolve();
  }

  /**
   * Gets a test profile by scenario name
   * @param scenario - The scenario name ('standard', 'limited', 'minimal')
   * @returns The test profile for the scenario
   */
  getProfileByScenario(scenario: 'standard' | 'limited' | 'minimal'): FacebookProfile {
    return this.testProfiles[scenario] as FacebookProfile;
  }

  /**
   * Gets a test token by scenario name
   * @param scenario - The scenario name ('standard', 'limited', 'minimal', 'expired', 'invalid')
   * @returns The test token for the scenario
   */
  getTokenByScenario(scenario: 'standard' | 'limited' | 'minimal' | 'expired' | 'invalid'): OAuthToken {
    const tokenId = ['expired', 'invalid'].includes(scenario) ? scenario : `facebook_${scenario}`;
    return this.testTokens[tokenId];
  }

  /**
   * Creates a test authorization code for a specific profile scenario
   * @param scenario - The profile scenario to create a code for
   * @returns A test authorization code
   */
  createAuthorizationCode(scenario: 'standard' | 'limited' | 'minimal'): string {
    return `profile_${scenario}`;
  }

  /**
   * Simulates a Facebook Graph API response for a user profile
   * @param userId - The Facebook user ID
   * @returns A mock Graph API response
   */
  simulateGraphApiResponse(userId: string): Record<string, any> {
    // Find the profile by ID
    const profile = Object.values(this.testProfiles).find(p => p.id === userId);
    if (!profile) {
      throw new Error('User not found');
    }

    // Return a mock Graph API response based on the profile
    return {
      id: profile.id,
      name: profile.displayName,
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      gender: profile.gender,
      birthday: profile.birthday,
      picture: {
        data: {
          url: profile.photos?.[0]?.value || `https://graph.facebook.com/${profile.id}/picture?type=large`,
          is_silhouette: !profile.photos || profile.photos.length === 0
        }
      }
    };
  }
}