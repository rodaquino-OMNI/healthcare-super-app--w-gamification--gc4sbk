/**
 * @file OAuth Provider Mock
 * @description Mock implementation of the base OAuth provider that simulates external identity
 * provider authentication. This abstract mock class serves as the foundation for provider-specific
 * implementations and provides common OAuth functionality like profile normalization and token validation.
 *
 * This mock enables testing of OAuth-dependent authentication flows without external API calls,
 * supporting different identity provider scenarios and verifying OAuth profile normalization in tests.
 */

import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { BaseOAuthProvider, OAuthProfile, OAuthToken, OAuthProviderConfig } from '../../src/providers/oauth/base.provider';
import { OAuthProviderType } from '../../src/providers/oauth/interfaces';

/**
 * Mock OAuth token response structure for testing
 */
export interface MockOAuthToken extends OAuthToken {
  /** Flag to simulate token validation failure */
  simulateInvalid?: boolean;
}

/**
 * Mock OAuth profile structure for testing
 */
export interface MockOAuthProfile extends OAuthProfile {
  /** Flag to simulate profile retrieval failure */
  simulateError?: boolean;
}

/**
 * Mock OAuth provider configuration for testing
 */
export interface MockOAuthProviderConfig extends OAuthProviderConfig {
  /** Predefined mock tokens for testing */
  mockTokens?: Record<string, MockOAuthToken>;
  
  /** Predefined mock profiles for testing */
  mockProfiles?: Record<string, MockOAuthProfile>;
  
  /** Simulated delay in milliseconds for API responses */
  simulatedDelay?: number;
  
  /** Flag to simulate network errors */
  simulateNetworkError?: boolean;
  
  /** Flag to simulate rate limiting */
  simulateRateLimiting?: boolean;
  
  /** Flag to simulate server errors */
  simulateServerError?: boolean;
}

/**
 * Abstract mock implementation of the BaseOAuthProvider for testing
 * 
 * This class provides a foundation for testing OAuth authentication flows without
 * requiring actual external API calls. It implements all the abstract methods from
 * BaseOAuthProvider with configurable test data and simulation capabilities.
 */
export abstract class MockOAuthProvider extends BaseOAuthProvider {
  /** Mock configuration with test data */
  protected mockConfig: MockOAuthProviderConfig;
  
  /** Default mock token for testing */
  protected defaultToken: MockOAuthToken = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    idToken: 'mock-id-token',
    expiresIn: 3600,
    scope: 'email profile',
    tokenType: 'Bearer'
  };
  
  /** Default mock profile for testing */
  protected defaultProfile: MockOAuthProfile = {
    id: 'mock-user-id',
    provider: 'mock-provider' as OAuthProviderType,
    email: 'mock-user@example.com',
    name: 'Mock User',
    firstName: 'Mock',
    lastName: 'User',
    picture: 'https://example.com/mock-user.jpg',
    locale: 'en-US',
    raw: { original: 'data' }
  };
  
  /**
   * Creates a new instance of the mock OAuth provider
   * 
   * @param configService - NestJS config service for retrieving environment variables
   * @param logger - Logger service for standardized logging
   * @param mockConfig - Optional mock configuration with test data
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: LoggerService,
    mockConfig?: Partial<MockOAuthProviderConfig>
  ) {
    super(configService, logger);
    
    // Merge provided mock config with defaults
    this.mockConfig = {
      ...this.config,
      mockTokens: {},
      mockProfiles: {},
      simulatedDelay: 0,
      simulateNetworkError: false,
      simulateRateLimiting: false,
      simulateServerError: false,
      ...mockConfig
    };
    
    this.logger.debug(`Initialized ${this.providerName} Mock OAuth provider`);
  }
  
  /**
   * Simulates a network delay based on the configured simulatedDelay
   * 
   * @returns A promise that resolves after the simulated delay
   */
  protected async simulateDelay(): Promise<void> {
    if (this.mockConfig.simulatedDelay && this.mockConfig.simulatedDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.mockConfig.simulatedDelay));
    }
  }
  
  /**
   * Simulates various error conditions based on the mock configuration
   * 
   * @throws Error if any error simulation is enabled
   */
  protected simulateErrors(): void {
    if (this.mockConfig.simulateNetworkError) {
      throw new Error(`Network error connecting to ${this.providerName} OAuth server`);
    }
    
    if (this.mockConfig.simulateRateLimiting) {
      throw new Error(`Rate limit exceeded for ${this.providerName} OAuth API`);
    }
    
    if (this.mockConfig.simulateServerError) {
      throw new Error(`${this.providerName} OAuth server returned an error: Internal Server Error`);
    }
  }
  
  /**
   * Validates an OAuth token with the provider's API
   * This mock implementation simulates token validation without external API calls
   * 
   * @param token - The token to validate
   * @returns A promise that resolves to a boolean indicating if the token is valid
   */
  public async validateToken(token: OAuthToken): Promise<boolean> {
    await this.simulateDelay();
    this.simulateErrors();
    
    this.logger.debug(`Mock validating ${this.providerName} OAuth token`, {
      tokenPreview: token.accessToken.substring(0, 8) + '...'
    });
    
    // Check if this is a mock token with simulateInvalid flag
    const mockToken = token as MockOAuthToken;
    if (mockToken.simulateInvalid) {
      return false;
    }
    
    // In mock implementation, all tokens are considered valid unless specified otherwise
    return true;
  }
  
  /**
   * Exchanges an authorization code for OAuth tokens
   * This mock implementation returns predefined tokens without external API calls
   * 
   * @param code - The authorization code received from the OAuth provider
   * @param redirectUri - Optional override for the callback URL
   * @returns A promise that resolves to the OAuth tokens
   */
  public async exchangeCodeForToken(code: string, redirectUri?: string): Promise<OAuthToken> {
    await this.simulateDelay();
    this.simulateErrors();
    
    this.logger.debug(`Mock exchanging code for ${this.providerName} OAuth token`, {
      codePreview: code.substring(0, 8) + '...',
      redirectUri
    });
    
    // Check if we have a predefined token for this code
    const mockToken = this.mockConfig.mockTokens?.[code];
    if (mockToken) {
      return mockToken;
    }
    
    // Return default mock token
    return { ...this.defaultToken };
  }
  
  /**
   * Retrieves the user profile from the OAuth provider using the access token
   * This mock implementation returns predefined profiles without external API calls
   * 
   * @param token - The OAuth tokens containing the access token
   * @returns A promise that resolves to the normalized user profile
   */
  public async getUserProfile(token: OAuthToken): Promise<OAuthProfile> {
    await this.simulateDelay();
    this.simulateErrors();
    
    this.logger.debug(`Mock retrieving ${this.providerName} user profile`, {
      tokenPreview: token.accessToken.substring(0, 8) + '...'
    });
    
    // Check if we have a predefined profile for this token
    const mockProfile = this.mockConfig.mockProfiles?.[token.accessToken];
    if (mockProfile) {
      // Check if we should simulate an error with this profile
      if (mockProfile.simulateError) {
        throw new Error(`Error retrieving profile from ${this.providerName}`);
      }
      return mockProfile;
    }
    
    // Return default mock profile with the correct provider
    return {
      ...this.defaultProfile,
      provider: this.providerName as OAuthProviderType
    };
  }
  
  /**
   * Creates or updates a user based on the OAuth profile
   * This mock implementation returns a simulated user entity
   * 
   * @param profile - The normalized OAuth profile
   * @returns A promise that resolves to the user entity or DTO
   */
  public async createOrUpdateUser(profile: OAuthProfile): Promise<any> {
    await this.simulateDelay();
    this.simulateErrors();
    
    this.logger.debug(`Mock creating/updating user from ${this.providerName} profile`, {
      userId: profile.id,
      email: profile.email
    });
    
    // Return a mock user entity based on the profile
    return {
      id: `user-${profile.id}`,
      email: profile.email,
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      locale: profile.locale,
      provider: profile.provider,
      providerId: profile.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
  }
  
  /**
   * Generates the authorization URL for initiating the OAuth flow
   * This mock implementation returns a simulated authorization URL
   * 
   * @param state - Optional state parameter for CSRF protection
   * @param additionalParams - Additional provider-specific parameters
   * @returns The authorization URL
   */
  public getAuthorizationUrl(state?: string, additionalParams?: Record<string, string>): string {
    const baseUrl = `https://mock-${this.providerName.toLowerCase()}.example.com/oauth2/auth`;
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      response_type: 'code',
      scope: this.config.scope.join(' ')
    });
    
    if (state) {
      params.append('state', state);
    }
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        params.append(key, value);
      });
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Sets up a mock token for a specific authorization code
   * 
   * @param code - The authorization code to associate with the token
   * @param token - The mock token to return for this code
   */
  public setupMockToken(code: string, token: Partial<MockOAuthToken>): void {
    this.mockConfig.mockTokens = {
      ...this.mockConfig.mockTokens,
      [code]: {
        ...this.defaultToken,
        ...token
      }
    };
  }
  
  /**
   * Sets up a mock profile for a specific access token
   * 
   * @param accessToken - The access token to associate with the profile
   * @param profile - The mock profile to return for this token
   */
  public setupMockProfile(accessToken: string, profile: Partial<MockOAuthProfile>): void {
    this.mockConfig.mockProfiles = {
      ...this.mockConfig.mockProfiles,
      [accessToken]: {
        ...this.defaultProfile,
        provider: this.providerName as OAuthProviderType,
        ...profile
      }
    };
  }
  
  /**
   * Configures error simulation settings
   * 
   * @param options - Error simulation options
   */
  public setupErrorSimulation(options: {
    networkError?: boolean;
    rateLimiting?: boolean;
    serverError?: boolean;
    delay?: number;
  }): void {
    this.mockConfig = {
      ...this.mockConfig,
      simulateNetworkError: options.networkError ?? this.mockConfig.simulateNetworkError,
      simulateRateLimiting: options.rateLimiting ?? this.mockConfig.simulateRateLimiting,
      simulateServerError: options.serverError ?? this.mockConfig.simulateServerError,
      simulatedDelay: options.delay ?? this.mockConfig.simulatedDelay
    };
  }
  
  /**
   * Resets all mock configurations to their defaults
   */
  public resetMocks(): void {
    this.mockConfig = {
      ...this.config,
      mockTokens: {},
      mockProfiles: {},
      simulatedDelay: 0,
      simulateNetworkError: false,
      simulateRateLimiting: false,
      simulateServerError: false
    };
  }
}