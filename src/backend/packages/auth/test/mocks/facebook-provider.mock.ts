import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile, OAuthToken } from '../../src/providers/oauth/interfaces';
import { OAuthProviderMock } from './oauth-provider.mock';

/**
 * Mock implementation of the Facebook OAuth provider for testing.
 * Extends the base OAuth provider mock with Facebook-specific functionality.
 */
export class FacebookProviderMock extends OAuthProviderMock {
  /**
   * Predefined Facebook user profiles for testing different scenarios.
   */
  private readonly predefinedProfiles = {
    /**
     * Standard user with all information provided.
     */
    standard: {
      id: '1234567890',
      provider: 'facebook',
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      emailVerified: true,
      picture: 'https://graph.facebook.com/1234567890/picture?type=large',
      gender: 'male',
      locale: 'en_US',
      timezone: -5,
      _raw: '{"id":"1234567890","name":"John Doe","first_name":"John","last_name":"Doe","email":"john.doe@example.com","picture":{"data":{"height":200,"is_silhouette":false,"url":"https://graph.facebook.com/1234567890/picture?type=large","width":200}},"gender":"male","locale":"en_US","timezone":-5}',
      _json: {
        id: '1234567890',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        picture: {
          data: {
            height: 200,
            is_silhouette: false,
            url: 'https://graph.facebook.com/1234567890/picture?type=large',
            width: 200
          }
        },
        gender: 'male',
        locale: 'en_US',
        timezone: -5
      }
    },

    /**
     * User with minimal profile information.
     */
    minimal: {
      id: '9876543210',
      provider: 'facebook',
      displayName: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      emailVerified: true,
      picture: 'https://graph.facebook.com/9876543210/picture?type=large',
      _raw: '{"id":"9876543210","name":"Jane Smith","first_name":"Jane","last_name":"Smith","email":"jane.smith@example.com","picture":{"data":{"height":200,"is_silhouette":false,"url":"https://graph.facebook.com/9876543210/picture?type=large","width":200}}}',
      _json: {
        id: '9876543210',
        name: 'Jane Smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        picture: {
          data: {
            height: 200,
            is_silhouette: false,
            url: 'https://graph.facebook.com/9876543210/picture?type=large',
            width: 200
          }
        }
      }
    },

    /**
     * User without email (privacy settings restricted).
     */
    noEmail: {
      id: '5555555555',
      provider: 'facebook',
      displayName: 'Alex Privacy',
      firstName: 'Alex',
      lastName: 'Privacy',
      emailVerified: false,
      picture: 'https://graph.facebook.com/5555555555/picture?type=large',
      gender: 'non_binary',
      locale: 'en_US',
      _raw: '{"id":"5555555555","name":"Alex Privacy","first_name":"Alex","last_name":"Privacy","picture":{"data":{"height":200,"is_silhouette":false,"url":"https://graph.facebook.com/5555555555/picture?type=large","width":200}},"gender":"non_binary","locale":"en_US"}',
      _json: {
        id: '5555555555',
        name: 'Alex Privacy',
        first_name: 'Alex',
        last_name: 'Privacy',
        picture: {
          data: {
            height: 200,
            is_silhouette: false,
            url: 'https://graph.facebook.com/5555555555/picture?type=large',
            width: 200
          }
        },
        gender: 'non_binary',
        locale: 'en_US'
      }
    },

    /**
     * User with default silhouette picture (no profile photo).
     */
    defaultPicture: {
      id: '1111111111',
      provider: 'facebook',
      displayName: 'Sam Default',
      firstName: 'Sam',
      lastName: 'Default',
      email: 'sam.default@example.com',
      emailVerified: true,
      picture: 'https://graph.facebook.com/1111111111/picture?type=large',
      locale: 'pt_BR',
      _raw: '{"id":"1111111111","name":"Sam Default","first_name":"Sam","last_name":"Default","email":"sam.default@example.com","picture":{"data":{"height":200,"is_silhouette":true,"url":"https://graph.facebook.com/1111111111/picture?type=large","width":200}},"locale":"pt_BR"}',
      _json: {
        id: '1111111111',
        name: 'Sam Default',
        first_name: 'Sam',
        last_name: 'Default',
        email: 'sam.default@example.com',
        picture: {
          data: {
            height: 200,
            is_silhouette: true,
            url: 'https://graph.facebook.com/1111111111/picture?type=large',
            width: 200
          }
        },
        locale: 'pt_BR'
      }
    }
  };

  /**
   * Constructor for the Facebook provider mock.
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
      this.addMockProfile(`facebook_token_${key}`, profile as OAuthProfile);
      
      // Create corresponding mock tokens for each profile
      this.addMockToken(`facebook_code_${key}`, {
        access_token: `facebook_access_token_${key}`,
        token_type: 'Bearer',
        expires_in: 3600,
        issued_at: new Date().toISOString(),
        expires_at: Math.floor(Date.now() / 1000) + 3600
      });
    });
  }

  /**
   * Simulates Facebook token validation by checking against the debug_token endpoint.
   * This is a mock implementation for testing purposes.
   * @param accessToken The Facebook access token to validate
   * @param userId The Facebook user ID to validate against
   * @returns A boolean indicating whether the token is valid
   */
  async validateFacebookToken(accessToken: string, userId: string): Promise<boolean> {
    this.logger.debug(`[FacebookProviderMock] Validating Facebook token: ${accessToken} for user: ${userId}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[FacebookProviderMock] Token validation failed (simulated)');
      return false;
    }

    // Check if the token exists in our mock profiles
    const isValidToken = Object.keys(this.mockProfiles).some(token => {
      const profile = this.mockProfiles[token];
      return token.includes(accessToken) && profile.id === userId;
    });

    if (!isValidToken) {
      this.logger.debug('[FacebookProviderMock] Token not found or user ID mismatch');
      return false;
    }

    this.logger.debug('[FacebookProviderMock] Token validated successfully');
    return true;
  }

  /**
   * Simulates the Facebook debug_token endpoint response.
   * @param accessToken The Facebook access token to debug
   * @returns A mock debug_token response or null if validation fails
   */
  async getDebugTokenInfo(accessToken: string): Promise<Record<string, any> | null> {
    this.logger.debug(`[FacebookProviderMock] Getting debug token info: ${accessToken}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[FacebookProviderMock] Debug token failed (simulated)');
      return null;
    }

    // Find the profile associated with this token
    const tokenKey = Object.keys(this.mockProfiles).find(key => key.includes(accessToken));
    if (!tokenKey) {
      this.logger.debug('[FacebookProviderMock] Token not found in mock profiles');
      return null;
    }

    const profile = this.mockProfiles[tokenKey];
    const appId = this.configService.get<string>('FACEBOOK_APP_ID') || 'mock_app_id';
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // 1 hour from now

    return {
      data: {
        app_id: appId,
        type: 'USER',
        application: 'AUSTA SuperApp',
        data_access_expires_at: expiresAt + 86400 * 60, // 60 days from now
        expires_at: expiresAt,
        is_valid: true,
        issued_at: now - 60, // Issued 1 minute ago
        scopes: ['email', 'public_profile'],
        user_id: profile.id,
        granular_scopes: [
          { scope: 'email', target_ids: [] },
          { scope: 'public_profile', target_ids: [] }
        ]
      }
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
    return this.mockTokens[`facebook_code_${key}`] || null;
  }

  /**
   * Simulates the Facebook login flow for a predefined profile.
   * @param key The key of the predefined profile to use
   * @returns An object containing the authorization code and access token
   */
  simulateFacebookLogin(key: keyof typeof this.predefinedProfiles): {
    authorizationCode: string;
    accessToken: string;
    userId: string;
  } | null {
    const profile = this.getPredefinedProfile(key);
    const token = this.getMockTokenForPredefinedProfile(key);
    
    if (!profile || !token) {
      return null;
    }

    return {
      authorizationCode: `facebook_code_${key}`,
      accessToken: token.access_token,
      userId: profile.id,
    };
  }

  /**
   * Simulates the Facebook Graph API response for a user profile.
   * @param userId The Facebook user ID
   * @returns A mock Graph API response or null if user not found
   */
  async getGraphApiProfile(userId: string): Promise<Record<string, any> | null> {
    this.logger.debug(`[FacebookProviderMock] Getting Graph API profile for user: ${userId}`);
    
    // Find the profile with the matching user ID
    const profile = Object.values(this.predefinedProfiles).find(p => p.id === userId);
    if (!profile) {
      this.logger.debug('[FacebookProviderMock] User not found in predefined profiles');
      return null;
    }

    // Return the _json property which contains the Graph API response format
    return profile._json as Record<string, any>;
  }
}