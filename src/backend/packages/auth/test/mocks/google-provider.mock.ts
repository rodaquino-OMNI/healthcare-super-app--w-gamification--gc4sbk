/**
 * @file Google OAuth Provider Mock
 * @description Mock implementation of the Google OAuth provider that extends the base OAuth provider mock.
 * This mock simulates Google-specific authentication behavior with predefined test profiles and token responses.
 * It enables testing of Google login flows without requiring actual Google API credentials or network connectivity.
 */

import { BaseOAuthProviderMock } from './oauth-provider.mock';
import { GoogleOAuthConfig, GoogleProfile, OAuthToken } from '../../src/providers/oauth/interfaces';

/**
 * Mock implementation of the Google OAuth provider
 * Simulates Google-specific authentication behavior for testing
 */
export class GoogleOAuthProviderMock extends BaseOAuthProviderMock {
  /**
   * Provider name
   */
  readonly providerName = 'google';

  /**
   * Google-specific configuration
   */
  protected config: GoogleOAuthConfig;

  /**
   * Creates an instance of GoogleOAuthProviderMock
   * @param config - Mock configuration for the Google provider
   */
  constructor(config?: Partial<GoogleOAuthConfig>) {
    // Create default Google OAuth configuration for testing
    const defaultConfig: GoogleOAuthConfig = {
      clientID: 'test_google_client_id',
      clientSecret: 'test_google_client_secret',
      callbackURL: 'https://austa.app/auth/google/callback',
      scope: ['email', 'profile'],
      includeGrantedScopes: true,
      hostedDomain: '',
      includeProfile: true,
    };

    super({ ...defaultConfig, ...config });
    this.config = { ...defaultConfig, ...config } as GoogleOAuthConfig;
  }

  /**
   * Initializes test data for Google authentication scenarios
   */
  protected initializeTestData(): void {
    // Standard user with all profile information
    this.testProfiles['standard'] = {
      id: 'google_user_123456',
      provider: 'google',
      email: 'user@example.com',
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      picture: 'https://lh3.googleusercontent.com/a/google_user_123456',
      locale: 'en',
      gender: 'male',
      photos: [
        { value: 'https://lh3.googleusercontent.com/a/google_user_123456' }
      ],
      emails: [
        { value: 'user@example.com', verified: true }
      ],
      _raw: JSON.stringify({
        sub: 'google_user_123456',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://lh3.googleusercontent.com/a/google_user_123456',
        email: 'user@example.com',
        email_verified: true,
        locale: 'en',
        gender: 'male'
      }),
      _json: {
        sub: 'google_user_123456',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://lh3.googleusercontent.com/a/google_user_123456',
        email: 'user@example.com',
        email_verified: true,
        locale: 'en',
        gender: 'male'
      },
    };

    // User with work domain email
    this.testProfiles['work'] = {
      id: 'google_user_789012',
      provider: 'google',
      email: 'employee@company.com',
      emailVerified: true,
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      picture: 'https://lh3.googleusercontent.com/a/google_user_789012',
      locale: 'en',
      photos: [
        { value: 'https://lh3.googleusercontent.com/a/google_user_789012' }
      ],
      emails: [
        { value: 'employee@company.com', verified: true }
      ],
      _raw: JSON.stringify({
        sub: 'google_user_789012',
        name: 'Jane Smith',
        given_name: 'Jane',
        family_name: 'Smith',
        picture: 'https://lh3.googleusercontent.com/a/google_user_789012',
        email: 'employee@company.com',
        email_verified: true,
        hd: 'company.com',
        locale: 'en'
      }),
      _json: {
        sub: 'google_user_789012',
        name: 'Jane Smith',
        given_name: 'Jane',
        family_name: 'Smith',
        picture: 'https://lh3.googleusercontent.com/a/google_user_789012',
        email: 'employee@company.com',
        email_verified: true,
        hd: 'company.com',
        locale: 'en'
      },
    };

    // User with minimal profile information
    this.testProfiles['minimal'] = {
      id: 'google_user_345678',
      provider: 'google',
      email: 'minimal@example.com',
      emailVerified: true,
      displayName: 'Minimal User',
      picture: 'https://lh3.googleusercontent.com/a/google_user_345678',
      photos: [
        { value: 'https://lh3.googleusercontent.com/a/google_user_345678' }
      ],
      emails: [
        { value: 'minimal@example.com', verified: true }
      ],
      _raw: JSON.stringify({
        sub: 'google_user_345678',
        name: 'Minimal User',
        picture: 'https://lh3.googleusercontent.com/a/google_user_345678',
        email: 'minimal@example.com',
        email_verified: true
      }),
      _json: {
        sub: 'google_user_345678',
        name: 'Minimal User',
        picture: 'https://lh3.googleusercontent.com/a/google_user_345678',
        email: 'minimal@example.com',
        email_verified: true
      },
    };

    // User with unverified email
    this.testProfiles['unverified'] = {
      id: 'google_user_901234',
      provider: 'google',
      email: 'unverified@example.com',
      emailVerified: false,
      firstName: 'Unverified',
      lastName: 'User',
      displayName: 'Unverified User',
      picture: 'https://lh3.googleusercontent.com/a/google_user_901234',
      photos: [
        { value: 'https://lh3.googleusercontent.com/a/google_user_901234' }
      ],
      emails: [
        { value: 'unverified@example.com', verified: false }
      ],
      _raw: JSON.stringify({
        sub: 'google_user_901234',
        name: 'Unverified User',
        given_name: 'Unverified',
        family_name: 'User',
        picture: 'https://lh3.googleusercontent.com/a/google_user_901234',
        email: 'unverified@example.com',
        email_verified: false
      }),
      _json: {
        sub: 'google_user_901234',
        name: 'Unverified User',
        given_name: 'Unverified',
        family_name: 'User',
        picture: 'https://lh3.googleusercontent.com/a/google_user_901234',
        email: 'unverified@example.com',
        email_verified: false
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
      const tokenId = `google_${profileId}`;
      this.testTokens[tokenId] = {
        accessToken: `google_access_token_${profileId}`,
        refreshToken: `google_refresh_token_${profileId}`,
        idToken: `google_id_token_${profileId}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'email profile',
      };
    });

    // Add a special expired token
    this.testTokens['expired'] = {
      accessToken: 'google_expired_token',
      refreshToken: 'google_expired_refresh_token',
      idToken: 'google_expired_id_token',
      tokenType: 'Bearer',
      expiresIn: -3600, // Negative value to indicate expiration
      scope: 'email profile',
    };

    // Add a special invalid token
    this.testTokens['invalid'] = {
      accessToken: 'google_invalid_token',
      refreshToken: 'google_invalid_refresh_token',
      idToken: 'google_invalid_id_token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      scope: 'email profile',
    };
  }

  /**
   * Simulates validating a Google access token
   * @param token - The access token or ID token to validate
   * @returns The validated user profile
   * @throws Error if token validation fails
   */
  async validateToken(token: string): Promise<GoogleProfile> {
    // Special case for expired token
    if (token === this.testTokens['expired']?.accessToken || 
        token === this.testTokens['expired']?.idToken) {
      const error = new Error('Token expired') as Error & { name: string };
      error.name = 'TokenExpiredError';
      throw error;
    }

    // Special case for invalid token
    if (token === this.testTokens['invalid']?.accessToken || 
        token === this.testTokens['invalid']?.idToken) {
      throw new Error('Invalid token');
    }

    // Use the base implementation for other tokens
    return super.validateToken(token) as Promise<GoogleProfile>;
  }

  /**
   * Simulates exchanging an authorization code for Google tokens
   * @param code - The authorization code to exchange
   * @returns The OAuth tokens from Google
   * @throws Error if code exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    // Check if this is a special test code
    if (code === 'invalid_code') {
      throw new Error('Invalid authorization code');
    }

    if (code === 'server_error') {
      throw new Error('Google server error');
    }

    // Map profile codes to tokens
    if (code.startsWith('profile_')) {
      const profileId = code.replace('profile_', '');
      const tokenId = `google_${profileId}`;
      if (this.testTokens[tokenId]) {
        return this.testTokens[tokenId];
      }
    }

    // Use the base implementation for other codes
    return super.exchangeCodeForToken(code);
  }

  /**
   * Simulates refreshing a Google access token
   * @param refreshToken - The refresh token to use
   * @returns The new OAuth tokens from Google
   * @throws Error if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    // Check if this is a special test refresh token
    if (refreshToken === 'invalid_refresh') {
      throw new Error('Invalid refresh token');
    }

    if (refreshToken === 'server_error_refresh') {
      throw new Error('Google server error during refresh');
    }

    // Use the base implementation for other refresh tokens
    return super.refreshToken(refreshToken);
  }

  /**
   * Simulates validating a Google ID token
   * @param idToken - The ID token to validate
   * @returns The payload of the ID token if valid
   * @throws Error if token validation fails
   */
  async verifyIdToken(idToken: string): Promise<Record<string, any>> {
    // Special case for expired token
    if (idToken === this.testTokens['expired']?.idToken) {
      throw new Error('ID token expired');
    }

    // Special case for invalid token
    if (idToken === this.testTokens['invalid']?.idToken) {
      throw new Error('Invalid ID token');
    }

    // Check if this is one of our test tokens
    const tokenId = this.getTokenId(idToken);
    if (!tokenId) {
      throw new Error('Invalid ID token');
    }

    // Get the profile associated with this token
    const profileId = tokenId.replace('google_', '');
    const profile = this.testProfiles[profileId];
    if (!profile) {
      throw new Error('Profile not found for token');
    }

    // Return a simulated ID token payload based on the profile
    return {
      iss: 'https://accounts.google.com',
      sub: profile.id,
      aud: this.config.clientID,
      iat: Math.floor(Date.now() / 1000) - 100,
      exp: Math.floor(Date.now() / 1000) + 3500,
      email: profile.email,
      email_verified: profile.emailVerified,
      name: profile.displayName,
      picture: profile.picture,
      given_name: profile.firstName,
      family_name: profile.lastName,
      locale: (profile as GoogleProfile).locale,
      hd: (profile._json as any).hd,
    };
  }

  /**
   * Gets a test profile by scenario name
   * @param scenario - The scenario name ('standard', 'work', 'minimal', 'unverified')
   * @returns The test profile for the scenario
   */
  getProfileByScenario(scenario: 'standard' | 'work' | 'minimal' | 'unverified'): GoogleProfile {
    return this.testProfiles[scenario] as GoogleProfile;
  }

  /**
   * Gets a test token by scenario name
   * @param scenario - The scenario name ('standard', 'work', 'minimal', 'unverified', 'expired', 'invalid')
   * @returns The test token for the scenario
   */
  getTokenByScenario(scenario: 'standard' | 'work' | 'minimal' | 'unverified' | 'expired' | 'invalid'): OAuthToken {
    const tokenId = ['expired', 'invalid'].includes(scenario) ? scenario : `google_${scenario}`;
    return this.testTokens[tokenId];
  }

  /**
   * Creates a test authorization code for a specific profile scenario
   * @param scenario - The profile scenario to create a code for
   * @returns A test authorization code
   */
  createAuthorizationCode(scenario: 'standard' | 'work' | 'minimal' | 'unverified'): string {
    return `profile_${scenario}`;
  }

  /**
   * Simulates a Google userinfo API response
   * @param accessToken - The access token to use for the request
   * @returns A mock userinfo API response
   * @throws Error if the access token is invalid
   */
  async getUserInfo(accessToken: string): Promise<Record<string, any>> {
    // Special case for expired token
    if (accessToken === this.testTokens['expired']?.accessToken) {
      throw new Error('Access token expired');
    }

    // Special case for invalid token
    if (accessToken === this.testTokens['invalid']?.accessToken) {
      throw new Error('Invalid access token');
    }

    // Check if this is one of our test tokens
    const tokenId = this.getTokenId(accessToken);
    if (!tokenId) {
      throw new Error('Invalid access token');
    }

    // Get the profile associated with this token
    const profileId = tokenId.replace('google_', '');
    const profile = this.testProfiles[profileId];
    if (!profile) {
      throw new Error('Profile not found for token');
    }

    // Return a simulated userinfo response based on the profile
    return {
      sub: profile.id,
      name: profile.displayName,
      given_name: profile.firstName,
      family_name: profile.lastName,
      picture: profile.picture,
      email: profile.email,
      email_verified: profile.emailVerified,
      locale: (profile as GoogleProfile).locale,
      hd: (profile._json as any).hd,
    };
  }

  /**
   * Simulates a hosted domain check for Google Workspace accounts
   * @param profile - The Google profile to check
   * @param allowedDomain - The allowed hosted domain
   * @returns True if the profile's domain matches the allowed domain
   */
  checkHostedDomain(profile: GoogleProfile, allowedDomain: string): boolean {
    // If no domain restriction is set, allow all domains
    if (!allowedDomain) {
      return true;
    }

    // Check if the profile has a hosted domain
    const hostedDomain = (profile._json as any).hd;
    if (!hostedDomain) {
      return false;
    }

    // Check if the hosted domain matches the allowed domain
    return hostedDomain === allowedDomain;
  }
}