/**
 * @file oauth.strategy.spec.ts
 * @description Tests for the OAuthStrategy base class that powers Google, Facebook, and Apple authentication.
 * Verifies profile extraction, OAuth provider settings, user creation/retrieval, and error handling.
 */

import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// Import using standardized path aliases
import { OAuthStrategy } from '../../../src/strategies/oauth.strategy';
import { AuthService } from '../../../src/auth.service';
import { OAuthProfile, OAuthProviderType } from '../../../src/providers/oauth/interfaces';
import { AppException } from '@app/errors';
import { ErrorType } from '@app/errors/categories/error-type.enum';

// Import test fixtures and mocks
import {
  googleOAuthProfile,
  facebookOAuthProfile,
  appleOAuthProfile,
  incompleteOAuthProfile
} from './strategy.fixtures';
import {
  MockAuthService,
  MockConfigService,
  MockLoggerService,
  createAuthTestingModule
} from './strategy.mocks';

/**
 * Concrete implementation of OAuthStrategy for testing
 * Extends the abstract base class with methods for profile extraction
 */
class TestOAuthStrategy extends OAuthStrategy {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly loggerService: any,
    strategy: string = 'test-strategy'
  ) {
    super(strategy, () => {});
  }

  // Extract email from OAuth profile
  extractEmail(profile: OAuthProfile): string {
    if (!profile.email) {
      this.loggerService.error(
        `Missing email in OAuth profile from ${profile.provider}`,
        undefined,
        'TestOAuthStrategy'
      );
      throw new AppException(ErrorType.VALIDATION, 'AUTH_007', 'Email is required for authentication');
    }
    return profile.email;
  }

  // Extract name from OAuth profile
  extractName(profile: OAuthProfile): string {
    // Try different name properties based on provider
    if (profile.displayName) {
      return profile.displayName;
    }
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    
    if (profile._json && profile._json.name) {
      return profile._json.name;
    }
    
    // Default to email prefix if no name is available
    if (profile.email) {
      return profile.email.split('@')[0];
    }
    
    this.loggerService.warn(
      `Could not extract name from ${profile.provider} profile, using default`,
      'TestOAuthStrategy'
    );
    return 'AUSTA User';
  }

  // Validate OAuth user
  async validateOAuthUser(profile: OAuthProfile): Promise<any> {
    try {
      this.loggerService.log(
        `Validating OAuth user from ${profile.provider}`,
        'TestOAuthStrategy',
        { profileId: profile.id }
      );

      const email = this.extractEmail(profile);
      const name = this.extractName(profile);

      // Check if user exists
      let user = await this.authService.findUserByEmail(email);

      // Create user if not exists
      if (!user) {
        this.loggerService.log(
          `Creating new user from ${profile.provider} OAuth`,
          'TestOAuthStrategy',
          { email }
        );
        user = await this.authService.createUserFromOAuth({
          ...profile,
          email,
          displayName: name
        });
      }

      return user;
    } catch (error) {
      this.loggerService.error(
        `OAuth validation error: ${error.message}`,
        error.stack,
        'TestOAuthStrategy'
      );
      throw error;
    }
  }

  // Get OAuth configuration
  getOAuthConfig(provider: OAuthProviderType): Record<string, any> {
    const configPath = `oauth.${provider}`;
    const config = {
      clientId: this.configService.get(`${configPath}.clientId`),
      clientSecret: this.configService.get(`${configPath}.clientSecret`),
      callbackUrl: this.configService.get(`${configPath}.callbackUrl`)
    };

    // Validate required config
    if (!config.clientId || !config.clientSecret || !config.callbackUrl) {
      this.loggerService.error(
        `Missing OAuth configuration for ${provider}`,
        undefined,
        'TestOAuthStrategy'
      );
      throw new AppException(
        ErrorType.CONFIGURATION,
        'AUTH_008',
        `Incomplete OAuth configuration for ${provider}`
      );
    }

    return config;
  }
}

describe('OAuthStrategy', () => {
  let strategy: TestOAuthStrategy;
  let mockAuthService: MockAuthService;
  let mockConfigService: MockConfigService;
  let mockLoggerService: MockLoggerService;

  beforeEach(async () => {
    // Create testing module with mocks
    const { moduleRef, mockAuthService: authService, mockConfigService: configService, mockLoggerService: loggerService } = 
      await createAuthTestingModule();

    mockAuthService = authService;
    mockConfigService = configService;
    mockLoggerService = loggerService;

    // Create strategy instance
    strategy = new TestOAuthStrategy(
      mockAuthService as any,
      mockConfigService as any,
      mockLoggerService
    );
  });

  afterEach(() => {
    // Reset mocks between tests
    mockAuthService.resetCalls();
    mockLoggerService.clearLogs();
  });

  describe('extractEmail', () => {
    it('should extract email from Google profile', () => {
      const email = strategy.extractEmail(googleOAuthProfile);
      expect(email).toBe('google-user@gmail.com');
    });

    it('should extract email from Facebook profile', () => {
      const email = strategy.extractEmail(facebookOAuthProfile);
      expect(email).toBe('facebook-user@example.com');
    });

    it('should extract email from Apple profile', () => {
      const email = strategy.extractEmail(appleOAuthProfile);
      expect(email).toBe('apple-user@privaterelay.appleid.com');
    });

    it('should throw AppException when email is missing', () => {
      expect(() => {
        strategy.extractEmail(incompleteOAuthProfile);
      }).toThrow(AppException);

      // Verify error logging
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toContain('Missing email in OAuth profile');
    });
  });

  describe('extractName', () => {
    it('should extract displayName from Google profile', () => {
      const name = strategy.extractName(googleOAuthProfile);
      expect(name).toBe('Google Test User');
    });

    it('should extract displayName from Facebook profile', () => {
      const name = strategy.extractName(facebookOAuthProfile);
      expect(name).toBe('Facebook Test User');
    });

    it('should combine firstName and lastName when displayName is missing', () => {
      const modifiedProfile = { ...googleOAuthProfile, displayName: undefined };
      const name = strategy.extractName(modifiedProfile);
      expect(name).toBe('Google User');
    });

    it('should extract name from _json when other properties are missing', () => {
      const modifiedProfile = {
        ...googleOAuthProfile,
        displayName: undefined,
        firstName: undefined,
        lastName: undefined
      };
      const name = strategy.extractName(modifiedProfile);
      expect(name).toBe('Google Test User'); // From _json.name
    });

    it('should use email prefix when no name is available', () => {
      const modifiedProfile = {
        ...googleOAuthProfile,
        displayName: undefined,
        firstName: undefined,
        lastName: undefined,
        _json: { email: 'test-user@example.com' }
      };
      const name = strategy.extractName(modifiedProfile);
      expect(name).toBe('test-user');
    });

    it('should use default name when no other options are available', () => {
      const modifiedProfile = {
        ...incompleteOAuthProfile,
        displayName: undefined,
        firstName: undefined,
        lastName: undefined,
        _json: {}
      };
      const name = strategy.extractName(modifiedProfile);
      expect(name).toBe('AUSTA User');

      // Verify warning log
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBe(1);
      expect(warnLogs[0].message).toContain('Could not extract name');
    });
  });

  describe('validateOAuthUser', () => {
    it('should validate existing user by email', async () => {
      // Setup mock to return existing user
      mockAuthService.findUserByEmail = jest.fn().mockResolvedValue({
        id: '123',
        email: 'google-user@gmail.com',
        name: 'Existing User'
      });

      const user = await strategy.validateOAuthUser(googleOAuthProfile);

      // Verify user was found by email
      expect(mockAuthService.findUserByEmailCalls.length).toBe(1);
      expect(mockAuthService.findUserByEmailCalls[0].email).toBe('google-user@gmail.com');
      
      // Verify user was returned
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
      expect(user.email).toBe('google-user@gmail.com');

      // Verify no user creation was attempted
      expect(mockAuthService.createUserFromOAuthCalls.length).toBe(0);

      // Verify logging
      const infoLogs = mockLoggerService.getLogsByLevel('info');
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].message).toContain('Validating OAuth user');
    });

    it('should create new user when user does not exist', async () => {
      // Setup mock to return no existing user
      mockAuthService.findUserByEmail = jest.fn().mockResolvedValue(null);
      
      // Setup mock for user creation
      mockAuthService.createUserFromOAuth = jest.fn().mockResolvedValue({
        id: 'new-123',
        email: 'google-user@gmail.com',
        name: 'Google Test User',
        oauthProviderId: 'google'
      });

      const user = await strategy.validateOAuthUser(googleOAuthProfile);

      // Verify user lookup was attempted
      expect(mockAuthService.findUserByEmailCalls.length).toBe(1);
      expect(mockAuthService.findUserByEmailCalls[0].email).toBe('google-user@gmail.com');
      
      // Verify user creation was called
      expect(mockAuthService.createUserFromOAuthCalls.length).toBe(1);
      expect(mockAuthService.createUserFromOAuthCalls[0].profile.email).toBe('google-user@gmail.com');
      expect(mockAuthService.createUserFromOAuthCalls[0].profile.displayName).toBe('Google Test User');
      
      // Verify created user was returned
      expect(user).toBeDefined();
      expect(user.id).toBe('new-123');
      expect(user.oauthProviderId).toBe('google');

      // Verify logging
      const logs = mockLoggerService.logs;
      expect(logs.length).toBe(2); // Validation log + creation log
      expect(logs[1].message).toContain('Creating new user');
    });

    it('should handle and log errors during validation', async () => {
      // Setup mock to throw error
      mockAuthService.findUserByEmail = jest.fn().mockRejectedValue(
        new Error('Database connection error')
      );

      // Expect validation to throw
      await expect(strategy.validateOAuthUser(googleOAuthProfile)).rejects.toThrow(
        'Database connection error'
      );

      // Verify error was logged
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toContain('OAuth validation error');
      expect(errorLogs[0].message).toContain('Database connection error');
    });

    it('should throw AppException when email extraction fails', async () => {
      // Expect validation to throw for incomplete profile
      await expect(strategy.validateOAuthUser(incompleteOAuthProfile)).rejects.toThrow(AppException);

      // Verify error was logged
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toContain('Missing email in OAuth profile');
    });
  });

  describe('getOAuthConfig', () => {
    it('should retrieve Google OAuth configuration', () => {
      const config = strategy.getOAuthConfig('google');
      
      expect(config).toEqual({
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        callbackUrl: 'http://localhost:3000/auth/google/callback'
      });
    });

    it('should retrieve Facebook OAuth configuration', () => {
      // Override config to use Facebook-specific keys
      mockConfigService.set('oauth.facebook.clientId', 'facebook-app-id');
      mockConfigService.set('oauth.facebook.clientSecret', 'facebook-app-secret');
      
      const config = strategy.getOAuthConfig('facebook');
      
      expect(config).toEqual({
        clientId: 'facebook-app-id',
        clientSecret: 'facebook-app-secret',
        callbackUrl: 'http://localhost:3000/auth/facebook/callback'
      });
    });

    it('should retrieve Apple OAuth configuration', () => {
      const config = strategy.getOAuthConfig('apple');
      
      expect(config).toEqual({
        clientId: 'apple-client-id',
        clientSecret: 'apple-private-key', // Apple uses private key as secret
        callbackUrl: 'http://localhost:3000/auth/apple/callback'
      });
    });

    it('should throw AppException when configuration is incomplete', () => {
      // Set incomplete configuration
      mockConfigService.set('oauth.google.clientId', undefined);
      
      expect(() => {
        strategy.getOAuthConfig('google');
      }).toThrow(AppException);

      // Verify error was logged
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toContain('Missing OAuth configuration');
    });
  });
});