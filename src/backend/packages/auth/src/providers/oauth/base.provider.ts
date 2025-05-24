/**
 * @file Base OAuth Provider
 * 
 * Abstract base class for OAuth providers that serves as the foundation for all
 * identity provider implementations. Defines common OAuth functionality including
 * profile extraction, token validation, and user creation.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticationError } from '@austa/errors';

import {
  OAuthProfile,
  OAuthToken,
  OAuthConfig,
  OAuthUserData,
  SupportedOAuthProfile,
  OAuthProviderType
} from './interfaces';

/**
 * Abstract base class for all OAuth providers.
 * This class defines the common interface and shared functionality that all
 * OAuth provider implementations must support.
 */
@Injectable()
export abstract class BaseOAuthProvider {
  protected readonly logger = new Logger(this.constructor.name);
  protected abstract readonly providerType: OAuthProviderType;

  /**
   * Creates an instance of BaseOAuthProvider.
   * 
   * @param configService - NestJS ConfigService for accessing environment variables
   * @param jwtService - NestJS JwtService for token validation and generation
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly jwtService: JwtService
  ) {}

  /**
   * Validates an OAuth token and extracts the user profile.
   * This method should be implemented by each provider to handle their specific
   * token validation logic.
   * 
   * @param token - The OAuth token to validate
   * @returns A promise that resolves to the validated user profile
   * @throws AuthenticationError if the token is invalid
   */
  abstract validateToken(token: string): Promise<SupportedOAuthProfile>;

  /**
   * Extracts standardized user data from an OAuth profile.
   * This method normalizes provider-specific profile data into a common format.
   * 
   * @param profile - The OAuth profile to extract data from
   * @returns Standardized user data
   */
  protected extractUserData(profile: SupportedOAuthProfile): OAuthUserData {
    return {
      provider: this.providerType,
      providerId: profile.id,
      email: profile.email,
      name: profile.displayName,
      picture: profile.picture,
      providerData: profile._json
    };
  }

  /**
   * Handles OAuth authentication errors in a standardized way.
   * 
   * @param error - The error that occurred during authentication
   * @param message - A custom error message
   * @throws AuthenticationError with appropriate context
   */
  protected handleAuthError(error: any, message: string): never {
    this.logger.error(`${message}: ${error.message}`, error.stack);
    throw new AuthenticationError(
      message,
      {
        provider: this.providerType,
        originalError: error.message
      },
      error
    );
  }

  /**
   * Gets the configuration for the OAuth provider.
   * This method should be implemented by each provider to retrieve their specific
   * configuration from environment variables or other sources.
   * 
   * @returns The OAuth provider configuration
   */
  abstract getConfig(): OAuthConfig;

  /**
   * Generates an authorization URL for the OAuth flow.
   * 
   * @param state - Optional state parameter for CSRF protection
   * @param scopes - Optional scopes to request
   * @returns The authorization URL
   */
  abstract generateAuthUrl(state?: string, scopes?: string[]): string;

  /**
   * Exchanges an authorization code for an access token.
   * 
   * @param code - The authorization code to exchange
   * @returns A promise that resolves to the OAuth token
   */
  abstract exchangeCode(code: string): Promise<OAuthToken>;
}