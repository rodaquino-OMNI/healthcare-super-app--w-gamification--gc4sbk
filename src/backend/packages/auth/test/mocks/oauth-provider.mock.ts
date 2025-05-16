import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProfile, OAuthToken } from '../../src/providers/oauth/interfaces';

/**
 * Base mock class for OAuth providers used in testing.
 * This abstract class provides common functionality for all OAuth provider mocks.
 */
export abstract class OAuthProviderMock {
  /**
   * Mock profiles that can be returned by the provider.
   */
  protected mockProfiles: Record<string, OAuthProfile> = {};

  /**
   * Mock tokens that can be returned by the provider.
   */
  protected mockTokens: Record<string, OAuthToken> = {};

  /**
   * Flag to simulate validation failures.
   */
  protected shouldFailValidation = false;

  /**
   * Flag to simulate token retrieval failures.
   */
  protected shouldFailTokenRetrieval = false;

  /**
   * Constructor for the OAuth provider mock.
   * @param logger Mock logger service
   * @param configService Mock config service
   */
  constructor(
    protected readonly logger: LoggerService,
    protected readonly configService: ConfigService,
  ) {}

  /**
   * Validates a token and returns a normalized user profile.
   * @param token The token to validate
   * @returns A normalized user profile or null if validation fails
   */
  async validateToken(token: string): Promise<OAuthProfile | null> {
    this.logger.debug(`[OAuthProviderMock] Validating token: ${token}`);
    
    if (this.shouldFailValidation) {
      this.logger.debug('[OAuthProviderMock] Token validation failed (simulated)');
      return null;
    }

    const profile = this.mockProfiles[token];
    if (!profile) {
      this.logger.debug('[OAuthProviderMock] Token not found in mock profiles');
      return null;
    }

    this.logger.debug(`[OAuthProviderMock] Token validated successfully for user: ${profile.id}`);
    return profile;
  }

  /**
   * Retrieves a token using an authorization code.
   * @param code The authorization code
   * @returns A token or null if retrieval fails
   */
  async getTokenFromCode(code: string): Promise<OAuthToken | null> {
    this.logger.debug(`[OAuthProviderMock] Getting token from code: ${code}`);
    
    if (this.shouldFailTokenRetrieval) {
      this.logger.debug('[OAuthProviderMock] Token retrieval failed (simulated)');
      return null;
    }

    const token = this.mockTokens[code];
    if (!token) {
      this.logger.debug('[OAuthProviderMock] Code not found in mock tokens');
      return null;
    }

    this.logger.debug('[OAuthProviderMock] Token retrieved successfully');
    return token;
  }

  /**
   * Configures the mock to simulate validation failures.
   * @param shouldFail Whether validation should fail
   */
  setValidationFailure(shouldFail: boolean): void {
    this.shouldFailValidation = shouldFail;
  }

  /**
   * Configures the mock to simulate token retrieval failures.
   * @param shouldFail Whether token retrieval should fail
   */
  setTokenRetrievalFailure(shouldFail: boolean): void {
    this.shouldFailTokenRetrieval = shouldFail;
  }

  /**
   * Adds a mock profile that can be returned by the provider.
   * @param token The token associated with the profile
   * @param profile The profile to return
   */
  addMockProfile(token: string, profile: OAuthProfile): void {
    this.mockProfiles[token] = profile;
  }

  /**
   * Adds a mock token that can be returned by the provider.
   * @param code The authorization code associated with the token
   * @param token The token to return
   */
  addMockToken(code: string, token: OAuthToken): void {
    this.mockTokens[code] = token;
  }

  /**
   * Clears all mock profiles and tokens.
   */
  clearMocks(): void {
    this.mockProfiles = {};
    this.mockTokens = {};
    this.shouldFailValidation = false;
    this.shouldFailTokenRetrieval = false;
  }
}