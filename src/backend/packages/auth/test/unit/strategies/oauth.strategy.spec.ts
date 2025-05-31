import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import the strategy and interfaces
import { OAuthStrategy } from '@austa/auth/strategies/oauth.strategy';
import { IOAuthProfile, IOAuthTokens } from '@austa/interfaces/auth';
import { AuthenticationError } from '@austa/errors';

// Import test fixtures and mocks
import { oauthFixtures } from './strategy.fixtures';
import { MockConfigService, MockLoggerService, MockAuthService, createTestModuleConfig } from './strategy.mocks';

/**
 * Concrete implementation of the abstract OAuthStrategy for testing
 */
class TestOAuthStrategy extends OAuthStrategy {
  constructor(name: string, strategy: any) {
    super(name, strategy);
  }

  // Expose protected methods for testing
  public testNormalizeProfile(profile: Partial<IOAuthProfile>): IOAuthProfile {
    return this.normalizeProfile(profile);
  }

  public testNormalizeTokens(tokens: Partial<IOAuthTokens>): IOAuthTokens {
    return this.normalizeTokens(tokens);
  }
}

describe('OAuthStrategy', () => {
  let strategy: TestOAuthStrategy;
  let module: TestingModule;
  let mockLogger: MockLoggerService;
  let mockConfigService: MockConfigService;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    // Create a test module with mock providers
    module = await Test.createTestingModule(createTestModuleConfig()).compile();

    // Get mock instances
    mockLogger = module.get<MockLoggerService>(Logger);
    mockConfigService = module.get<MockConfigService>(ConfigService);
    mockAuthService = module.get<MockAuthService>('AuthService');

    // Clear logs before each test
    mockLogger.clear();

    // Create a test strategy instance
    strategy = new TestOAuthStrategy('test-provider', {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize the strategy with the provided name and strategy', () => {
      // Create a new strategy with a mock passport strategy
      const mockPassportStrategy = { name: 'test-strategy' };
      const testStrategy = new TestOAuthStrategy('test-provider', mockPassportStrategy);
      
      // Verify that initialization was logged
      expect(mockLogger.hasLoggedMessage('Initialized test-provider OAuth strategy', 'log')).toBe(true);
    });
  });

  describe('normalizeProfile', () => {
    it('should normalize a complete Google profile correctly', () => {
      const profile = oauthFixtures.googleProfile;
      const normalized = strategy.testNormalizeProfile(profile);

      // Verify all fields are preserved and normalized
      expect(normalized).toEqual(profile);
      expect(normalized.provider).toBe('google');
      expect(normalized.email).toBe('test@gmail.com');
      expect(normalized.name).toBe('Test User');
      expect(normalized.firstName).toBe('Test');
      expect(normalized.lastName).toBe('User');
      expect(normalized.picture).toBe('https://lh3.googleusercontent.com/a/photo.jpg');
      expect(normalized.locale).toBe('en');
      expect(normalized.isVerified).toBe(true);
    });

    it('should normalize a complete Facebook profile correctly', () => {
      const profile = oauthFixtures.facebookProfile;
      const normalized = strategy.testNormalizeProfile(profile);

      // Verify all fields are preserved and normalized
      expect(normalized).toEqual(profile);
      expect(normalized.provider).toBe('facebook');
    });

    it('should normalize a minimal profile with default values', () => {
      const profile = oauthFixtures.minimalProfile;
      const normalized = strategy.testNormalizeProfile(profile);

      // Verify required fields are preserved
      expect(normalized.provider).toBe(profile.provider);
      expect(normalized.providerId).toBe(profile.providerId);
      expect(normalized.email).toBe(profile.email);
      expect(normalized.name).toBe(profile.name);
      
      // Verify default values for optional fields
      expect(normalized.firstName).toBe('');
      expect(normalized.lastName).toBe('');
      expect(normalized.picture).toBe('');
      expect(normalized.locale).toBe('en');
      expect(normalized.isVerified).toBe(false);
    });

    it('should generate name from firstName and lastName if name is missing', () => {
      const profile = {
        provider: 'google',
        providerId: '123456789',
        email: 'test@gmail.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      const normalized = strategy.testNormalizeProfile(profile);
      expect(normalized.name).toBe('John Doe');
    });

    it('should handle missing firstName or lastName when generating name', () => {
      // Only firstName provided
      const profileWithFirstName = {
        provider: 'google',
        providerId: '123456789',
        email: 'test@gmail.com',
        firstName: 'John'
      };

      const normalizedWithFirstName = strategy.testNormalizeProfile(profileWithFirstName);
      expect(normalizedWithFirstName.name).toBe('John');

      // Only lastName provided
      const profileWithLastName = {
        provider: 'google',
        providerId: '123456789',
        email: 'test@gmail.com',
        lastName: 'Doe'
      };

      const normalizedWithLastName = strategy.testNormalizeProfile(profileWithLastName);
      expect(normalizedWithLastName.name).toBe('Doe');
    });

    it('should throw AuthenticationError if provider is missing', () => {
      const profile = {
        providerId: '123456789',
        email: 'test@gmail.com',
        name: 'Test User'
      };

      expect(() => strategy.testNormalizeProfile(profile)).toThrow(AuthenticationError);
      expect(() => strategy.testNormalizeProfile(profile)).toThrow('Missing provider in OAuth profile');
    });

    it('should throw AuthenticationError if providerId is missing', () => {
      const profile = {
        provider: 'google',
        email: 'test@gmail.com',
        name: 'Test User'
      };

      expect(() => strategy.testNormalizeProfile(profile)).toThrow(AuthenticationError);
      expect(() => strategy.testNormalizeProfile(profile)).toThrow('Missing providerId in OAuth profile');
    });

    it('should throw AuthenticationError if email is missing', () => {
      const profile = {
        provider: 'google',
        providerId: '123456789',
        name: 'Test User'
      };

      expect(() => strategy.testNormalizeProfile(profile)).toThrow(AuthenticationError);
      expect(() => strategy.testNormalizeProfile(profile)).toThrow('Missing email in OAuth profile');
    });

    it('should log debug information when normalizing a profile', () => {
      const profile = oauthFixtures.googleProfile;
      strategy.testNormalizeProfile(profile);

      // Verify that debug log was created
      expect(mockLogger.hasLoggedMessage(
        `Normalized OAuth profile for ${profile.provider}:${profile.providerId}`,
        'debug'
      )).toBe(true);
    });
  });

  describe('normalizeTokens', () => {
    it('should normalize complete token data correctly', () => {
      const tokens = oauthFixtures.googleTokens;
      const normalized = strategy.testNormalizeTokens(tokens);

      // Verify all fields are preserved
      expect(normalized).toEqual(tokens);
    });

    it('should provide default values for missing token fields', () => {
      // Minimal token with only accessToken
      const minimalTokens = {
        accessToken: 'test-access-token'
      };

      const normalized = strategy.testNormalizeTokens(minimalTokens);

      // Verify required field is preserved
      expect(normalized.accessToken).toBe(minimalTokens.accessToken);
      
      // Verify default values for optional fields
      expect(normalized.refreshToken).toBe('');
      expect(normalized.idToken).toBe('');
      expect(normalized.expiresIn).toBe(3600);
      expect(normalized.tokenType).toBe('Bearer');
    });

    it('should handle different token types', () => {
      const tokens = {
        accessToken: 'test-access-token',
        tokenType: 'MAC'
      };

      const normalized = strategy.testNormalizeTokens(tokens);
      expect(normalized.tokenType).toBe('MAC');
    });

    it('should handle custom expiration times', () => {
      const tokens = {
        accessToken: 'test-access-token',
        expiresIn: 7200 // 2 hours
      };

      const normalized = strategy.testNormalizeTokens(tokens);
      expect(normalized.expiresIn).toBe(7200);
    });
  });
});