import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile, OAuthToken } from '../../src/providers/oauth/interfaces';
import { OAuthProviderMock } from './oauth-provider.mock';

/**
 * Mock implementation of the Google OAuth provider for testing.
 * Extends the base OAuth provider mock with Google-specific functionality.
 */
export class GoogleProviderMock extends OAuthProviderMock {
  /**
   * Predefined Google user profiles for testing different scenarios.
   */
  private readonly predefinedProfiles = {
    /**
     * Standard user with all information provided.
     */
    standard: {
      id: '123456789012345678901',
      provider: 'google',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
      picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
      locale: 'en',
      _raw: '{"sub":"123456789012345678901","name":"John Doe","given_name":"John","family_name":"Doe","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg","email":"john.doe@example.com","email_verified":true,"locale":"en"}',
      _json: {
        sub: '123456789012345678901',
        name: 'John Doe',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
        email: 'john.doe@example.com',
        email_verified: true,
        locale: 'en'
      }
    },

    /**
     * User with minimal profile information.
     */
    minimal: {
      id: '987654321098765432109',
      provider: 'google',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      emailVerified: true,
      picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
      _raw: '{"sub":"987654321098765432109","name":"Jane Smith","given_name":"Jane","family_name":"Smith","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg","email":"jane.smith@example.com","email_verified":true}',
      _json: {
        sub: '987654321098765432109',
        name: 'Jane Smith',
        given_name: 'Jane',
        family_name: 'Smith',
        picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
        email: 'jane.smith@example.com',
        email_verified: true
      }
    },

    /**
     * User with G Suite hosted domain.
     */
    gSuite: {
      id: '555555555555555555555',
      provider: 'google',
      displayName: 'Alex Corporate',
      firstName: 'Alex',
      lastName: 'Corporate',
      email: 'alex@company.com',
      emailVerified: true,
      picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
      locale: 'en',
      _raw: '{"sub":"555555555555555555555","name":"Alex Corporate","given_name":"Alex","family_name":"Corporate","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg","email":"alex@company.com","email_verified":true,"locale":"en","hd":"company.com"}',
      _json: {
        sub: '555555555555555555555',
        name: 'Alex Corporate',
        given_name: 'Alex',
        family_name: 'Corporate',
        picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
        email: 'alex@company.com',
        email_verified: true,
        locale: 'en',
        hd: 'company.com'
      }
    },

    /**
     * User with unverified email.
     */
    unverifiedEmail: {
      id: '111111111111111111111',
      provider: 'google',
      displayName: 'Sam Unverified',
      firstName: 'Sam',
      lastName: 'Unverified',
      email: 'sam.unverified@example.com',
      emailVerified: false,
      picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
      locale: 'pt-BR',
      _raw: '{"sub":"111111111111111111111","name":"Sam Unverified","given_name":"Sam","family_name":"Unverified","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg","email":"sam.unverified@example.com","email_verified":false,"locale":"pt-BR"}',
      _json: {
        sub: '111111111111111111111',
        name: 'Sam Unverified',
        given_name: 'Sam',
        family_name: 'Unverified',
        picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
        email: 'sam.unverified@example.com',
        email_verified: false,
        locale: 'pt-BR'
      }
    },

    /**
     * User with additional profile information.
     */
    extended: {
      id: '222222222222222222222',
      provider: 'google',
      displayName: 'Maria Extended',
      firstName: 'Maria',
      middleName: 'Profile',
      lastName: 'Extended',
      email: 'maria.extended@example.com',
      emailVerified: true,
      picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
      gender: 'female',
      birthdate: '1990-01-01',
      locale: 'es',
      _raw: '{"sub":"222222222222222222222","name":"Maria Profile Extended","given_name":"Maria","middle_name":"Profile","family_name":"Extended","picture":"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg","email":"maria.extended@example.com","email_verified":true,"gender":"female","birthdate":"1990-01-01","locale":"es"}',
      _json: {
        sub: '222222222222222222222',
        name: 'Maria Profile Extended',
        given_name: 'Maria',
        middle_name: 'Profile',
        family_name: 'Extended',
        picture: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg',
        email: 'maria.extended@example.com',
        email_verified: true,
        gender: 'female',
        birthdate: '1990-01-01',
        locale: 'es'
      }
    }
  };

  /**
   * Constructor for the Google provider mock.
   * @param logger Mock logger service
   * @param configService Mock config service
   */
  constructor(
    protected readonly logger: LoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(logger, configService);
    this.initializeMockData();
  }

  /**
   * Initializes mock data with predefined profiles and tokens.
   */
  private initializeMockData(): void {
    // Add predefined profiles to mock profiles
    Object.entries(this.predefinedProfiles).forEach(([key, profile]) => {
      this.addMockProfile(`google_token_${key}`, profile as OAuthProfile);
      
      // Create corresponding mock tokens for each profile
      this.addMockToken(`google_code_${key}`, {
        access_token: `google_access_token_${key}`,
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: `google_id_token_${key}`,
        refresh_token: `google_refresh_token_${key}`,
        scope: 'openid profile email',
        issued_at: new Date().toISOString(),
        expires_at: Math.floor(Date.now() / 1000) + 3600
      });
    });
  }

  /**
   * Simulates Google token validation by checking against the tokeninfo endpoint.
   * This is a mock implementation for testing purposes.
   * @param idToken The Google ID token to validate
   * @returns A boolean indicating whether the token is valid
   */
  async validateGoogleIdToken(idToken: string): Promise<boolean> {
    this.logger.debug(`[GoogleProviderMock] Validating Google ID token: ${idToken}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[GoogleProviderMock] Token validation failed (simulated)');
      return false;
    }

    // Check if the token exists in our mock profiles
    const isValidToken = Object.keys(this.mockProfiles).some(token => {
      return token.includes(idToken.replace('google_id_token_', 'google_token_'));
    });

    if (!isValidToken) {
      this.logger.debug('[GoogleProviderMock] Token not found');
      return false;
    }

    this.logger.debug('[GoogleProviderMock] Token validated successfully');
    return true;
  }

  /**
   * Simulates the Google tokeninfo endpoint response.
   * @param idToken The Google ID token to get info for
   * @returns A mock tokeninfo response or null if validation fails
   */
  async getTokenInfo(idToken: string): Promise<Record<string, any> | null> {
    this.logger.debug(`[GoogleProviderMock] Getting token info: ${idToken}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[GoogleProviderMock] Token info failed (simulated)');
      return null;
    }

    // Extract the profile key from the token
    const profileKey = idToken.replace('google_id_token_', '');
    const profile = this.predefinedProfiles[profileKey as keyof typeof this.predefinedProfiles];
    
    if (!profile) {
      this.logger.debug('[GoogleProviderMock] Profile not found for token');
      return null;
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') || 'mock_client_id';
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // 1 hour from now

    return {
      iss: 'https://accounts.google.com',
      azp: clientId,
      aud: clientId,
      sub: profile.id,
      email: profile.email,
      email_verified: profile.emailVerified,
      at_hash: 'mock_at_hash',
      name: profile.displayName,
      picture: profile.picture,
      given_name: profile.firstName,
      family_name: profile.lastName,
      locale: profile._json?.locale,
      iat: now - 60, // Issued 1 minute ago
      exp: expiresAt,
      hd: profile._json?.hd // Hosted domain for G Suite users
    };
  }

  /**
   * Gets a predefined profile by key.
   * @param key The key of the predefined profile
   * @returns The profile or undefined if not found
   */
  getPredefinedProfile(key: keyof typeof this.predefinedProfiles): OAuthProfile | undefined {
    return this.predefinedProfiles[key] as OAuthProfile;
  }

  /**
   * Gets a mock token for a predefined profile by key.
   * @param key The key of the predefined profile
   * @returns The token or null if not found
   */
  getMockTokenForPredefinedProfile(key: keyof typeof this.predefinedProfiles): OAuthToken | null {
    return this.mockTokens[`google_code_${key}`] || null;
  }

  /**
   * Simulates the Google login flow for a predefined profile.
   * @param key The key of the predefined profile to use
   * @returns An object containing the authorization code, access token, and ID token
   */
  simulateGoogleLogin(key: keyof typeof this.predefinedProfiles): {
    authorizationCode: string;
    accessToken: string;
    idToken: string;
    userId: string;
  } | null {
    const profile = this.getPredefinedProfile(key);
    const token = this.getMockTokenForPredefinedProfile(key);
    
    if (!profile || !token) {
      return null;
    }

    return {
      authorizationCode: `google_code_${key}`,
      accessToken: token.access_token,
      idToken: token.id_token || '',
      userId: profile.id,
    };
  }

  /**
   * Simulates the Google userinfo endpoint response.
   * @param accessToken The Google access token
   * @returns A mock userinfo response or null if token is invalid
   */
  async getUserInfo(accessToken: string): Promise<Record<string, any> | null> {
    this.logger.debug(`[GoogleProviderMock] Getting user info for access token: ${accessToken}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[GoogleProviderMock] User info failed (simulated)');
      return null;
    }

    // Extract the profile key from the token
    const profileKey = accessToken.replace('google_access_token_', '');
    const profile = this.predefinedProfiles[profileKey as keyof typeof this.predefinedProfiles];
    
    if (!profile) {
      this.logger.debug('[GoogleProviderMock] Profile not found for access token');
      return null;
    }

    // Return the profile in userinfo endpoint format
    return {
      sub: profile.id,
      name: profile.displayName,
      given_name: profile.firstName,
      family_name: profile.lastName,
      middle_name: profile.middleName,
      picture: profile.picture,
      email: profile.email,
      email_verified: profile.emailVerified,
      gender: profile._json?.gender,
      birthdate: profile._json?.birthdate,
      locale: profile._json?.locale,
      hd: profile._json?.hd
    };
  }

  /**
   * Simulates token revocation for Google OAuth.
   * @param token The token to revoke
   * @returns A boolean indicating whether the revocation was successful
   */
  async revokeToken(token: string): Promise<boolean> {
    this.logger.debug(`[GoogleProviderMock] Revoking token: ${token}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[GoogleProviderMock] Token revocation failed (simulated)');
      return false;
    }

    // Check if the token exists in our mock profiles or tokens
    const isValidToken = Object.keys(this.mockProfiles).some(key => key.includes(token)) ||
      Object.values(this.mockTokens).some(t => 
        t.access_token === token || t.refresh_token === token || t.id_token === token
      );

    if (!isValidToken) {
      this.logger.debug('[GoogleProviderMock] Token not found for revocation');
      return false;
    }

    this.logger.debug('[GoogleProviderMock] Token revoked successfully');
    return true;
  }

  /**
   * Simulates refreshing an access token using a refresh token.
   * @param refreshToken The refresh token to use
   * @returns A new token response or null if refresh fails
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthToken | null> {
    this.logger.debug(`[GoogleProviderMock] Refreshing access token with refresh token: ${refreshToken}`);
    
    if (this.shouldFailTokenRetrieval) {
      this.logger.debug('[GoogleProviderMock] Token refresh failed (simulated)');
      return null;
    }

    // Find the profile key associated with this refresh token
    const profileKey = refreshToken.replace('google_refresh_token_', '');
    const existingToken = this.mockTokens[`google_code_${profileKey}`];
    
    if (!existingToken) {
      this.logger.debug('[GoogleProviderMock] Refresh token not found');
      return null;
    }

    // Create a new token with updated expiration
    const newToken: OAuthToken = {
      access_token: `google_access_token_${profileKey}_refreshed`,
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: existingToken.id_token,
      refresh_token: existingToken.refresh_token,
      scope: existingToken.scope,
      issued_at: new Date().toISOString(),
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    this.logger.debug('[GoogleProviderMock] Access token refreshed successfully');
    return newToken;
  }
}