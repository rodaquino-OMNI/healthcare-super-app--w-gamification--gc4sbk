import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile, OAuthToken } from '../../src/providers/oauth/interfaces';
import { OAuthProviderMock } from './oauth-provider.mock';

/**
 * Mock implementation of the Apple OAuth provider for testing.
 * Extends the base OAuth provider mock with Apple-specific functionality.
 */
export class AppleProviderMock extends OAuthProviderMock {
  /**
   * Predefined Apple user profiles for testing different scenarios.
   */
  private readonly predefinedProfiles = {
    /**
     * Standard user with all information provided.
     */
    standard: {
      id: 'apple.123456789',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      provider: 'apple',
      emailVerified: true,
      isPrivateEmail: false,
      raw: {
        sub: 'apple.123456789',
        email: 'user@example.com',
        email_verified: 'true',
        is_private_email: 'false',
      },
    },

    /**
     * User with private email relay.
     */
    privateEmail: {
      id: 'apple.987654321',
      email: 'private@privaterelay.appleid.com',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Jane Smith',
      provider: 'apple',
      emailVerified: true,
      isPrivateEmail: true,
      raw: {
        sub: 'apple.987654321',
        email: 'private@privaterelay.appleid.com',
        email_verified: 'true',
        is_private_email: 'true',
      },
    },

    /**
     * User without name information (Apple allows users to hide their name).
     */
    noName: {
      id: 'apple.555555555',
      email: 'noname@example.com',
      firstName: null,
      lastName: null,
      displayName: null,
      provider: 'apple',
      emailVerified: true,
      isPrivateEmail: false,
      raw: {
        sub: 'apple.555555555',
        email: 'noname@example.com',
        email_verified: 'true',
        is_private_email: 'false',
      },
    },

    /**
     * User with unverified email (rare case but possible in testing).
     */
    unverifiedEmail: {
      id: 'apple.111111111',
      email: 'unverified@example.com',
      firstName: 'Unverified',
      lastName: 'User',
      displayName: 'Unverified User',
      provider: 'apple',
      emailVerified: false,
      isPrivateEmail: false,
      raw: {
        sub: 'apple.111111111',
        email: 'unverified@example.com',
        email_verified: 'false',
        is_private_email: 'false',
      },
    },
  };

  /**
   * Constructor for the Apple provider mock.
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
      this.addMockProfile(`apple_token_${key}`, profile as OAuthProfile);
      
      // Create corresponding mock tokens for each profile
      this.addMockToken(`apple_code_${key}`, {
        accessToken: `apple_access_token_${key}`,
        refreshToken: `apple_refresh_token_${key}`,
        idToken: this.generateMockJwt(profile as OAuthProfile),
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });
  }

  /**
   * Generates a mock JWT token for Apple authentication.
   * @param profile The user profile to encode in the token
   * @returns A mock JWT token string
   */
  private generateMockJwt(profile: OAuthProfile): string {
    // Create JWT header
    const header = {
      alg: 'RS256',
      kid: 'APPLE_KEY_ID_123',
      typ: 'JWT',
    };

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: 'https://appleid.apple.com',
      aud: 'com.austa.superapp',
      exp: now + 600, // Expires in 10 minutes (Apple standard)
      iat: now,
      sub: profile.id,
      c_hash: 'MOCK_HASH_VALUE',
      email: profile.email,
      email_verified: profile.emailVerified ? 'true' : 'false',
      is_private_email: profile.isPrivateEmail ? 'true' : 'false',
      auth_time: now,
    };

    // Encode header and payload (simplified for mock purposes)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Mock signature (not a real signature, just for testing)
    const mockSignature = 'MOCK_SIGNATURE_FOR_TESTING_PURPOSES_ONLY';

    // Combine to form JWT
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
  }

  /**
   * Validates an Apple JWT token and returns the decoded payload.
   * This is a mock implementation for testing purposes.
   * @param token The JWT token to validate
   * @returns The decoded payload or null if validation fails
   */
  async validateAppleJwt(token: string): Promise<Record<string, any> | null> {
    this.logger.debug(`[AppleProviderMock] Validating Apple JWT: ${token}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[AppleProviderMock] JWT validation failed (simulated)');
      return null;
    }

    // In a real implementation, this would verify the signature
    // For testing, we just decode the payload part
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        this.logger.debug('[AppleProviderMock] Invalid JWT format');
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logger.debug('[AppleProviderMock] JWT token expired');
        return null;
      }

      this.logger.debug('[AppleProviderMock] JWT validated successfully');
      return payload;
    } catch (error) {
      this.logger.error(`[AppleProviderMock] JWT validation error: ${error.message}`);
      return null;
    }
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
    return this.mockTokens[`apple_code_${key}`] || null;
  }

  /**
   * Simulates the Sign in with Apple flow for a predefined profile.
   * @param key The key of the predefined profile to use
   * @returns An object containing the authorization code and identity token
   */
  simulateSignInWithApple(key: keyof typeof this.predefinedProfiles): {
    authorizationCode: string;
    identityToken: string;
    user: string;
  } | null {
    const profile = this.getPredefinedProfile(key);
    const token = this.getMockTokenForPredefinedProfile(key);
    
    if (!profile || !token) {
      return null;
    }

    return {
      authorizationCode: `apple_code_${key}`,
      identityToken: token.idToken,
      user: profile.id,
    };
  }
}