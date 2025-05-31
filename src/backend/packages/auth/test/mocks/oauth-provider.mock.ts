/**
 * @file OAuth Provider Mock
 * 
 * This file provides mock implementations of OAuth providers for testing authentication
 * flows without external API dependencies. It includes a base mock class and specific
 * implementations for common providers like Google, Facebook, Apple, and Microsoft.
 * 
 * Example usage:
 * 
 * ```typescript
 * // Create a mock logger
 * const mockLogger = new MockLogger();
 * 
 * // Configure the mock provider
 * const mockOptions: MockOAuthProviderOptions = {
 *   clientId: 'test-client-id',
 *   clientSecret: 'test-client-secret',
 *   callbackURL: 'https://example.com/auth/callback',
 *   // Test configuration
 *   mockProfiles: [
 *     {
 *       id: 'test-user-123',
 *       email: 'test@example.com',
 *       displayName: 'Test User',
 *       emailVerified: true
 *     }
 *   ],
 *   // Control test behavior
 *   shouldAuthenticationSucceed: true
 * };
 * 
 * // Create a mock Google provider
 * const googleProvider = new MockGoogleOAuthProvider(mockOptions, mockLogger);
 * 
 * // Use in tests
 * const result = await googleProvider.authenticate('test-code');
 * expect(result.profile.email).toBe('test@example.com');
 * ```
 */

import { BaseOAuthProvider, IOAuthProfile, IOAuthTokens, IOAuthProviderOptions } from '../../src/providers/oauth/base.provider';
import { IUser } from '../../src/interfaces/user.interface';
import { Logger } from '@austa/logging';

/**
 * Mock OAuth profile data for testing
 */
export interface MockOAuthProfileData {
  /** Provider-specific user ID */
  id: string;
  /** User's email address */
  email?: string;
  /** User's display name */
  displayName?: string;
  /** Whether the email is verified */
  emailVerified?: boolean;
  /** URL to user's profile picture */
  photoURL?: string;
  /** User's first name */
  firstName?: string;
  /** User's last name */
  lastName?: string;
  /** Additional provider-specific fields */
  [key: string]: any;
}

/**
 * Mock OAuth tokens for testing
 */
export interface MockOAuthTokens extends IOAuthTokens {
  /** Whether the token should be considered valid in tests */
  isValid?: boolean;
  /** Custom expiration time for testing token expiration */
  customExpiresAt?: Date;
}

/**
 * Configuration options for the mock OAuth provider
 */
export interface MockOAuthProviderOptions extends IOAuthProviderOptions {
  /** Predefined profiles to use in tests */
  mockProfiles?: MockOAuthProfileData[];
  /** Predefined tokens to use in tests */
  mockTokens?: Record<string, MockOAuthTokens>;
  /** Whether authentication should succeed or fail */
  shouldAuthenticationSucceed?: boolean;
  /** Whether token validation should succeed or fail */
  shouldTokenValidationSucceed?: boolean;
  /** Whether token refresh should succeed or fail */
  shouldTokenRefreshSucceed?: boolean;
  /** Whether token revocation should succeed or fail */
  shouldTokenRevocationSucceed?: boolean;
  /** Whether to simulate network errors */
  simulateNetworkError?: boolean;
  /** Custom error message for simulated failures */
  errorMessage?: string;
}

/**
 * Abstract mock implementation of the BaseOAuthProvider for testing
 * 
 * This class provides a foundation for testing OAuth authentication flows
 * without requiring external API calls. It implements all the abstract methods
 * from BaseOAuthProvider with configurable test behaviors.
 */
export abstract class MockOAuthProvider extends BaseOAuthProvider {
  /** 
   * Default mock profile used when no specific profile is provided 
   */
  protected readonly defaultProfile: MockOAuthProfileData = {
    id: 'mock-user-123',
    email: 'mock-user@example.com',
    displayName: 'Mock User',
    emailVerified: true,
    photoURL: 'https://example.com/mock-user.jpg',
    firstName: 'Mock',
    lastName: 'User'
  };

  /**
   * Default mock tokens used when no specific tokens are provided
   */
  protected readonly defaultTokens: MockOAuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    idToken: 'mock-id-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    isValid: true
  };

  /**
   * Mock options with testing configuration
   */
  protected readonly mockOptions: MockOAuthProviderOptions;

  /**
   * Collection of mock profiles for testing different scenarios
   */
  protected mockProfiles: MockOAuthProfileData[];

  /**
   * Collection of mock tokens for testing different scenarios
   */
  protected mockTokens: Record<string, MockOAuthTokens>;

  /**
   * Creates an instance of MockOAuthProvider
   * 
   * @param options Provider configuration and mock options
   * @param logger Logger instance
   */
  constructor(options: MockOAuthProviderOptions, logger: Logger) {
    super(options, logger);
    this.mockOptions = options;
    this.mockProfiles = options.mockProfiles || [this.defaultProfile];
    this.mockTokens = options.mockTokens || { 'default': this.defaultTokens };
  }

  /**
   * Simulates authenticating a user with the OAuth provider
   * 
   * @param code Mock authorization code
   * @returns Promise resolving to mock tokens and profile
   * @throws Error if authentication is configured to fail
   */
  async authenticate(code: string): Promise<{ tokens: IOAuthTokens; profile: IOAuthProfile }> {
    // Simulate network delay
    await this.simulateNetworkDelay();

    // Check if we should simulate a network error
    if (this.mockOptions.simulateNetworkError) {
      throw new Error('Network error during authentication');
    }

    // Check if authentication should fail
    if (this.mockOptions.shouldAuthenticationSucceed === false) {
      throw new Error(this.mockOptions.errorMessage || 'Authentication failed');
    }

    // Get mock profile and tokens
    const profile = this.getMockProfileByCode(code);
    const tokens = this.getMockTokensByCode(code);

    // Return normalized profile and tokens
    return {
      tokens,
      profile: this.normalizeProfile(profile)
    };
  }

  /**
   * Simulates validating an OAuth token
   * 
   * @param token Token to validate
   * @returns Promise resolving to validation result and profile
   * @throws Error if token validation is configured to fail
   */
  async validateToken(token: string): Promise<{ valid: boolean; profile?: IOAuthProfile }> {
    // Simulate network delay
    await this.simulateNetworkDelay();

    // Check if we should simulate a network error
    if (this.mockOptions.simulateNetworkError) {
      throw new Error('Network error during token validation');
    }

    // Check if token validation should fail
    if (this.mockOptions.shouldTokenValidationSucceed === false) {
      return { valid: false };
    }

    // Get mock token and check if it's valid
    const mockToken = this.getMockTokenByAccessToken(token);
    if (!mockToken || mockToken.isValid === false) {
      return { valid: false };
    }

    // Check if token is expired
    if (mockToken.customExpiresAt && mockToken.customExpiresAt < new Date()) {
      return { valid: false };
    }

    // Get associated profile
    const profile = this.getMockProfileByToken(token);
    if (!profile) {
      return { valid: true };
    }

    // Return validation result with normalized profile
    return {
      valid: true,
      profile: this.normalizeProfile(profile)
    };
  }

  /**
   * Simulates refreshing an OAuth token
   * 
   * @param refreshToken Refresh token to use
   * @returns Promise resolving to new mock tokens
   * @throws Error if token refresh is configured to fail
   */
  async refreshToken(refreshToken: string): Promise<IOAuthTokens> {
    // Simulate network delay
    await this.simulateNetworkDelay();

    // Check if we should simulate a network error
    if (this.mockOptions.simulateNetworkError) {
      throw new Error('Network error during token refresh');
    }

    // Check if token refresh should fail
    if (this.mockOptions.shouldTokenRefreshSucceed === false) {
      throw new Error(this.mockOptions.errorMessage || 'Token refresh failed');
    }

    // Find token by refresh token
    const tokenEntry = Object.entries(this.mockTokens).find(
      ([_, token]) => token.refreshToken === refreshToken
    );

    if (!tokenEntry) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const [tokenKey, oldToken] = tokenEntry;
    const newToken: MockOAuthTokens = {
      ...oldToken,
      accessToken: `${oldToken.accessToken}-refreshed-${Date.now()}`,
      expiresIn: oldToken.expiresIn || 3600
    };

    // Update token in collection
    this.mockTokens[tokenKey] = newToken;

    return newToken;
  }

  /**
   * Simulates revoking an OAuth token
   * 
   * @param token Token to revoke
   * @returns Promise resolving to revocation result
   * @throws Error if token revocation is configured to fail
   */
  async revokeToken(token: string): Promise<boolean> {
    // Simulate network delay
    await this.simulateNetworkDelay();

    // Check if we should simulate a network error
    if (this.mockOptions.simulateNetworkError) {
      throw new Error('Network error during token revocation');
    }

    // Check if token revocation should fail
    if (this.mockOptions.shouldTokenRevocationSucceed === false) {
      return false;
    }

    // Find token by access token
    const tokenEntry = Object.entries(this.mockTokens).find(
      ([_, t]) => t.accessToken === token
    );

    if (!tokenEntry) {
      return false;
    }

    // Mark token as invalid
    const [tokenKey, oldToken] = tokenEntry;
    this.mockTokens[tokenKey] = {
      ...oldToken,
      isValid: false
    };

    return true;
  }

  /**
   * Creates a mock user from an OAuth profile
   * 
   * @param profile Normalized OAuth profile
   * @returns Promise resolving to created user
   */
  async createUserFromProfile(profile: IOAuthProfile): Promise<IUser> {
    // Build basic user from profile
    const userData = this.buildUserFromProfile(profile);
    
    // Add mock user ID and provider information
    return {
      ...userData,
      id: `user-${profile.id}`,
      providerId: profile.id,
      provider: profile.provider
    } as IUser;
  }

  /**
   * Gets the authorization URL for the OAuth flow
   * 
   * @param state Optional state parameter
   * @param additionalParams Additional URL parameters
   * @returns Mock authorization URL
   */
  getAuthorizationUrl(state?: string, additionalParams?: Record<string, string>): string {
    // Build query parameters
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: this.options.callbackURL,
      response_type: 'code',
      ...(state ? { state } : {}),
      ...(this.options.scope ? { scope: Array.isArray(this.options.scope) ? this.options.scope.join(' ') : this.options.scope } : {}),
      ...(additionalParams || {})
    });

    // Return mock authorization URL
    return `https://mock-${this.providerName}-auth.example.com/oauth2/auth?${params.toString()}`;
  }

  /**
   * Adds a mock profile for testing
   * 
   * @param profile Mock profile data
   * @returns The added profile
   */
  addMockProfile(profile: MockOAuthProfileData): MockOAuthProfileData {
    this.mockProfiles.push(profile);
    return profile;
  }

  /**
   * Adds mock tokens for testing
   * 
   * @param key Token identifier
   * @param tokens Mock token data
   * @returns The added tokens
   */
  addMockTokens(key: string, tokens: MockOAuthTokens): MockOAuthTokens {
    this.mockTokens[key] = tokens;
    return tokens;
  }

  /**
   * Gets a mock profile by authorization code
   * 
   * @param code Authorization code
   * @returns Mock profile or default profile
   */
  protected getMockProfileByCode(code: string): MockOAuthProfileData {
    // Try to find profile by code
    const profile = this.mockProfiles.find(p => p.id === code || p.authCode === code);
    return profile || this.defaultProfile;
  }

  /**
   * Gets mock tokens by authorization code
   * 
   * @param code Authorization code
   * @returns Mock tokens
   */
  protected getMockTokensByCode(code: string): MockOAuthTokens {
    // Try to find tokens by code
    const tokens = this.mockTokens[code] || this.defaultTokens;
    return { ...tokens };
  }

  /**
   * Gets a mock token by access token
   * 
   * @param accessToken Access token
   * @returns Mock token or undefined
   */
  protected getMockTokenByAccessToken(accessToken: string): MockOAuthTokens | undefined {
    const tokenEntry = Object.entries(this.mockTokens).find(
      ([_, token]) => token.accessToken === accessToken
    );
    return tokenEntry ? tokenEntry[1] : undefined;
  }

  /**
   * Gets a mock profile by access token
   * 
   * @param accessToken Access token
   * @returns Mock profile or undefined
   */
  protected getMockProfileByToken(accessToken: string): MockOAuthProfileData | undefined {
    // Find token by access token
    const tokenEntry = Object.entries(this.mockTokens).find(
      ([_, token]) => token.accessToken === accessToken
    );

    if (!tokenEntry) {
      return undefined;
    }

    // Use token key to find associated profile
    const [tokenKey] = tokenEntry;
    const profile = this.mockProfiles.find(p => p.id === tokenKey || p.tokenKey === tokenKey);
    return profile || this.defaultProfile;
  }

  /**
   * Simulates a network delay for more realistic testing
   * 
   * @param minMs Minimum delay in milliseconds
   * @param maxMs Maximum delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  protected async simulateNetworkDelay(minMs = 10, maxMs = 50): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Override the normalizeProfile method to test profile normalization
   * 
   * @param rawProfile Raw profile data
   * @returns Normalized OAuth profile
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    // Call the parent method for basic normalization
    const normalizedProfile = super.normalizeProfile(rawProfile);
    
    // Add provider-specific normalization if needed
    return {
      ...normalizedProfile,
      // Map photoURL to picture for consistency
      photoURL: rawProfile.photoURL || rawProfile.picture,
      // Ensure provider name is set correctly
      provider: this.providerName
    };
  }
}

/**
 * Mock Google OAuth Provider implementation
 */
export class MockGoogleOAuthProvider extends MockOAuthProvider {
  readonly providerName = 'google';

  /**
   * Override normalizeProfile to handle Google-specific profile format
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    const baseProfile = super.normalizeProfile(rawProfile);
    
    // Add Google-specific normalization
    return {
      ...baseProfile,
      email: rawProfile.email || (rawProfile.emails?.[0]?.value),
      emailVerified: rawProfile.email_verified || rawProfile.verified_email || baseProfile.emailVerified,
      firstName: rawProfile.given_name || rawProfile.firstName || baseProfile.firstName,
      lastName: rawProfile.family_name || rawProfile.lastName || baseProfile.lastName,
      photoURL: rawProfile.picture || (rawProfile.photos?.[0]?.value) || baseProfile.photoURL
    };
  }
}

/**
 * Mock Facebook OAuth Provider implementation
 */
export class MockFacebookOAuthProvider extends MockOAuthProvider {
  readonly providerName = 'facebook';

  /**
   * Override normalizeProfile to handle Facebook-specific profile format
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    const baseProfile = super.normalizeProfile(rawProfile);
    
    // Add Facebook-specific normalization
    return {
      ...baseProfile,
      email: rawProfile.email || (rawProfile.emails?.[0]?.value),
      firstName: rawProfile.first_name || rawProfile.firstName || baseProfile.firstName,
      lastName: rawProfile.last_name || rawProfile.lastName || baseProfile.lastName,
      photoURL: rawProfile.picture?.data?.url || (rawProfile.photos?.[0]?.value) || baseProfile.photoURL
    };
  }
}

/**
 * Mock Apple OAuth Provider implementation
 */
export class MockAppleOAuthProvider extends MockOAuthProvider {
  readonly providerName = 'apple';

  /**
   * Override normalizeProfile to handle Apple-specific profile format
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    const baseProfile = super.normalizeProfile(rawProfile);
    
    // Add Apple-specific normalization
    return {
      ...baseProfile,
      email: rawProfile.email || (rawProfile.emails?.[0]?.value),
      firstName: rawProfile.name?.firstName || rawProfile.firstName || baseProfile.firstName,
      lastName: rawProfile.name?.lastName || rawProfile.lastName || baseProfile.lastName,
      // Apple doesn't provide profile pictures
      photoURL: undefined
    };
  }
}

/**
 * Mock Microsoft OAuth Provider implementation
 */
export class MockMicrosoftOAuthProvider extends MockOAuthProvider {
  readonly providerName = 'microsoft';

  /**
   * Override normalizeProfile to handle Microsoft-specific profile format
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    const baseProfile = super.normalizeProfile(rawProfile);
    
    // Add Microsoft-specific normalization
    return {
      ...baseProfile,
      email: rawProfile.mail || rawProfile.userPrincipalName || (rawProfile.emails?.[0]?.value),
      firstName: rawProfile.givenName || rawProfile.firstName || baseProfile.firstName,
      lastName: rawProfile.surname || rawProfile.lastName || baseProfile.lastName,
      photoURL: (rawProfile.photos?.[0]?.value) || baseProfile.photoURL
    };
  }
}

/**
 * Factory function to create a mock OAuth provider for a specific provider type
 * 
 * @param providerName Name of the OAuth provider
 * @param options Mock provider options
 * @param logger Logger instance
 * @returns Configured mock OAuth provider
 */
export function createMockOAuthProvider(
  providerName: string,
  options: MockOAuthProviderOptions,
  logger: Logger
): MockOAuthProvider {
  // Create provider based on name
  switch (providerName.toLowerCase()) {
    case 'google':
      return new MockGoogleOAuthProvider(options, logger);
    case 'facebook':
      return new MockFacebookOAuthProvider(options, logger);
    case 'apple':
      return new MockAppleOAuthProvider(options, logger);
    case 'microsoft':
      return new MockMicrosoftOAuthProvider(options, logger);
    default:
      // Create a generic provider for other types
      return new class GenericMockOAuthProvider extends MockOAuthProvider {
        readonly providerName = providerName;
      }(options, logger);
  }
}

/**
 * Predefined test scenarios for common OAuth testing situations
 */
export const MockOAuthTestScenarios = {
  /**
   * Successful authentication with valid user
   */
  SUCCESSFUL_AUTH: {
    shouldAuthenticationSucceed: true,
    shouldTokenValidationSucceed: true,
    shouldTokenRefreshSucceed: true,
    shouldTokenRevocationSucceed: true,
    mockProfiles: [
      {
        id: 'valid-user-123',
        email: 'valid-user@example.com',
        displayName: 'Valid Test User',
        emailVerified: true,
        firstName: 'Valid',
        lastName: 'User',
        photoURL: 'https://example.com/photos/valid-user.jpg'
      }
    ],
    mockTokens: {
      'valid-user-123': {
        accessToken: 'valid-access-token-123',
        refreshToken: 'valid-refresh-token-123',
        idToken: 'valid-id-token-123',
        expiresIn: 3600,
        tokenType: 'Bearer',
        isValid: true
      }
    }
  },

  /**
   * Authentication failure scenario
   */
  FAILED_AUTH: {
    shouldAuthenticationSucceed: false,
    errorMessage: 'Invalid authorization code',
    mockProfiles: [],
    mockTokens: {}
  },

  /**
   * Token validation failure scenario
   */
  INVALID_TOKEN: {
    shouldAuthenticationSucceed: true,
    shouldTokenValidationSucceed: false,
    mockProfiles: [
      {
        id: 'user-with-invalid-token',
        email: 'invalid-token@example.com',
        displayName: 'Invalid Token User',
        emailVerified: true
      }
    ],
    mockTokens: {
      'user-with-invalid-token': {
        accessToken: 'invalid-access-token',
        refreshToken: 'invalid-refresh-token',
        expiresIn: 3600,
        isValid: false
      }
    }
  },

  /**
   * Expired token scenario
   */
  EXPIRED_TOKEN: {
    shouldAuthenticationSucceed: true,
    shouldTokenValidationSucceed: true,
    mockProfiles: [
      {
        id: 'user-with-expired-token',
        email: 'expired-token@example.com',
        displayName: 'Expired Token User',
        emailVerified: true
      }
    ],
    mockTokens: {
      'user-with-expired-token': {
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresIn: 0,
        customExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        isValid: true
      }
    }
  },

  /**
   * Network error scenario
   */
  NETWORK_ERROR: {
    simulateNetworkError: true,
    errorMessage: 'Network error during authentication',
    mockProfiles: [],
    mockTokens: {}
  },

  /**
   * Unverified email scenario
   */
  UNVERIFIED_EMAIL: {
    shouldAuthenticationSucceed: true,
    shouldTokenValidationSucceed: true,
    mockProfiles: [
      {
        id: 'unverified-email-user',
        email: 'unverified@example.com',
        displayName: 'Unverified Email User',
        emailVerified: false,
        firstName: 'Unverified',
        lastName: 'User'
      }
    ],
    mockTokens: {
      'unverified-email-user': {
        accessToken: 'unverified-email-token',
        refreshToken: 'unverified-email-refresh',
        expiresIn: 3600,
        isValid: true
      }
    }
  },

  /**
   * Missing email scenario
   */
  MISSING_EMAIL: {
    shouldAuthenticationSucceed: true,
    shouldTokenValidationSucceed: true,
    mockProfiles: [
      {
        id: 'missing-email-user',
        displayName: 'Missing Email User',
        firstName: 'Missing',
        lastName: 'Email'
        // email intentionally omitted
      }
    ],
    mockTokens: {
      'missing-email-user': {
        accessToken: 'missing-email-token',
        refreshToken: 'missing-email-refresh',
        expiresIn: 3600,
        isValid: true
      }
    }
  }
};

/**
 * Test utilities for working with mock OAuth providers
 */
export const MockOAuthTestUtils = {
  /**
   * Creates a mock authorization code for testing
   * 
   * @param prefix Optional prefix for the code
   * @returns Random authorization code
   */
  createMockAuthCode: (prefix = 'auth'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  },

  /**
   * Creates a mock access token for testing
   * 
   * @param prefix Optional prefix for the token
   * @returns Random access token
   */
  createMockAccessToken: (prefix = 'access'): string => {
    return `${prefix}-token-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Creates a mock refresh token for testing
   * 
   * @param prefix Optional prefix for the token
   * @returns Random refresh token
   */
  createMockRefreshToken: (prefix = 'refresh'): string => {
    return `${prefix}-token-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Creates a mock ID token (JWT) for testing
   * 
   * @param payload Token payload
   * @returns Mock JWT token
   */
  createMockIdToken: (payload: Record<string, any>): string => {
    // Create a simple mock JWT (not cryptographically valid)
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify({
      iss: 'https://mock-oauth-provider.example.com',
      aud: 'mock-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      ...payload
    })).toString('base64');
    const signature = Buffer.from('MOCK_SIGNATURE').toString('base64');

    return `${header}.${body}.${signature}`;
  },

  /**
   * Creates a complete set of mock OAuth tokens
   * 
   * @param userId User ID to include in the ID token
   * @param options Additional token options
   * @returns Complete set of mock tokens
   */
  createMockTokenSet: (userId: string, options?: Partial<MockOAuthTokens>): MockOAuthTokens => {
    return {
      accessToken: MockOAuthTestUtils.createMockAccessToken(),
      refreshToken: MockOAuthTestUtils.createMockRefreshToken(),
      idToken: MockOAuthTestUtils.createMockIdToken({ sub: userId, email: `user-${userId}@example.com` }),
      expiresIn: 3600,
      tokenType: 'Bearer',
      isValid: true,
      ...options
    };
  },

  /**
   * Creates a mock OAuth profile for testing
   * 
   * @param provider Provider name
   * @param id User ID
   * @param options Additional profile options
   * @returns Mock OAuth profile
   */
  createMockProfile: (provider: string, id: string, options?: Partial<MockOAuthProfileData>): MockOAuthProfileData => {
    return {
      id,
      provider,
      email: `${id}@example.com`,
      displayName: `Test User ${id}`,
      emailVerified: true,
      firstName: 'Test',
      lastName: `User ${id}`,
      photoURL: `https://example.com/photos/${id}.jpg`,
      ...options
    };
  },

  /**
   * Creates a mock OAuth error response
   * 
   * @param code Error code
   * @param message Error message
   * @returns Mock error object
   */
  createMockError: (code: string, message: string): { error: string; error_description: string } => {
    return {
      error: code,
      error_description: message
    };
  },

  /**
   * Creates a mock logger for testing
   * 
   * @returns Simple mock logger that doesn't actually log
   */
  createMockLogger: (): Logger => {
    return {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      createChildLogger: jest.fn().mockReturnThis()
    } as unknown as Logger;
  }
};

/**
 * Example usage in tests:
 * 
 * ```typescript
 * // auth.service.spec.ts
 * import { Test } from '@nestjs/testing';
 * import { AuthService } from '../src/auth.service';
 * import { MockGoogleOAuthProvider, MockOAuthTestScenarios, MockOAuthTestUtils } from './mocks/oauth-provider.mock';
 * 
 * describe('AuthService', () => {
 *   let authService: AuthService;
 *   let mockGoogleProvider: MockGoogleOAuthProvider;
 * 
 *   beforeEach(async () => {
 *     // Create mock provider with successful auth scenario
 *     const mockLogger = MockOAuthTestUtils.createMockLogger();
 *     mockGoogleProvider = new MockGoogleOAuthProvider({
 *       clientId: 'test-client-id',
 *       clientSecret: 'test-client-secret',
 *       callbackURL: 'https://example.com/auth/callback',
 *       ...MockOAuthTestScenarios.SUCCESSFUL_AUTH
 *     }, mockLogger);
 * 
 *     const moduleRef = await Test.createTestingModule({
 *       providers: [
 *         AuthService,
 *         {
 *           provide: 'GOOGLE_OAUTH_PROVIDER',
 *           useValue: mockGoogleProvider
 *         }
 *       ],
 *     }).compile();
 * 
 *     authService = moduleRef.get<AuthService>(AuthService);
 *   });
 * 
 *   it('should authenticate with Google', async () => {
 *     const result = await authService.authenticateWithGoogle('valid-user-123');
 *     expect(result.user).toBeDefined();
 *     expect(result.token).toBeDefined();
 *     expect(result.user.email).toBe('valid-user@example.com');
 *   });
 * 
 *   it('should handle authentication failure', async () => {
 *     // Override provider to use failure scenario
 *     Object.assign(mockGoogleProvider, {
 *       authenticate: jest.fn().mockRejectedValue(new Error('Authentication failed'))
 *     });
 * 
 *     await expect(authService.authenticateWithGoogle('invalid-code'))
 *       .rejects.toThrow('Authentication failed');
 *   });
 * });
 * ```
 */