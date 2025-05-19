import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ExternalApiError, 
  ExternalAuthenticationError, 
  ExternalResponseFormatError 
} from '@austa/errors/categories/external.errors';
import { LoggerService } from '@austa/logging';

/**
 * Standard OAuth profile structure with normalized fields
 * across different providers
 */
export interface OAuthProfile {
  id: string;
  provider: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
  raw?: Record<string, any>;
}

/**
 * Standard OAuth token structure with normalized fields
 * across different providers
 */
export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  scope?: string;
  tokenType?: string;
}

/**
 * Base configuration for OAuth providers
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope: string[];
}

/**
 * Abstract base class for OAuth providers that serves as the foundation
 * for all identity provider implementations. Defines common OAuth functionality
 * including profile extraction, token validation, and user creation.
 * 
 * This class is part of the provider pattern that replaces the previous
 * strategy pattern for better code organization and reusability.
 */
@Injectable()
export abstract class BaseOAuthProvider {
  protected readonly config: OAuthProviderConfig;
  protected readonly providerName: string;

  /**
   * Creates a new instance of the OAuth provider
   * 
   * @param configService - NestJS config service for retrieving environment variables
   * @param logger - Logger service for standardized logging
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: LoggerService
  ) {
    this.providerName = this.getProviderName();
    this.config = this.getProviderConfig();
    this.logger.debug(`Initialized ${this.providerName} OAuth provider`);
  }

  /**
   * Returns the name of the OAuth provider (e.g., 'google', 'facebook', 'apple')
   * Used for logging and error messages
   */
  protected abstract getProviderName(): string;

  /**
   * Returns the provider-specific configuration from environment variables
   * Must be implemented by each provider to retrieve its specific config
   */
  protected abstract getProviderConfig(): OAuthProviderConfig;

  /**
   * Validates an OAuth token with the provider's API
   * 
   * @param token - The token to validate
   * @returns A promise that resolves to a boolean indicating if the token is valid
   * @throws ExternalAuthenticationError if token validation fails
   */
  public abstract validateToken(token: OAuthToken): Promise<boolean>;

  /**
   * Exchanges an authorization code for OAuth tokens
   * 
   * @param code - The authorization code received from the OAuth provider
   * @param redirectUri - Optional override for the callback URL
   * @returns A promise that resolves to the OAuth tokens
   * @throws ExternalApiError if token exchange fails
   */
  public abstract exchangeCodeForToken(code: string, redirectUri?: string): Promise<OAuthToken>;

  /**
   * Retrieves the user profile from the OAuth provider using the access token
   * 
   * @param token - The OAuth tokens containing the access token
   * @returns A promise that resolves to the normalized user profile
   * @throws ExternalApiError if profile retrieval fails
   */
  public abstract getUserProfile(token: OAuthToken): Promise<OAuthProfile>;

  /**
   * Creates or updates a user based on the OAuth profile
   * This method should be implemented by the concrete provider or a user service
   * 
   * @param profile - The normalized OAuth profile
   * @returns A promise that resolves to the user entity or DTO
   */
  public abstract createOrUpdateUser(profile: OAuthProfile): Promise<any>;

  /**
   * Handles the OAuth callback by exchanging the code for tokens,
   * retrieving the user profile, and creating or updating the user
   * 
   * @param code - The authorization code received from the OAuth provider
   * @param redirectUri - Optional override for the callback URL
   * @returns A promise that resolves to the user entity or DTO
   */
  public async handleCallback(code: string, redirectUri?: string): Promise<any> {
    try {
      this.logger.debug(`Handling ${this.providerName} OAuth callback`, { code: code.substring(0, 8) + '...' });
      
      // Exchange code for token
      const token = await this.exchangeCodeForToken(code, redirectUri);
      
      // Validate token
      const isValid = await this.validateToken(token);
      if (!isValid) {
        throw new ExternalAuthenticationError(
          `Invalid ${this.providerName} OAuth token`,
          { provider: this.providerName }
        );
      }
      
      // Get user profile
      const profile = await this.getUserProfile(token);
      
      // Create or update user
      return await this.createOrUpdateUser(profile);
    } catch (error) {
      this.logger.error(`Error handling ${this.providerName} OAuth callback`, { 
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // Rethrow as structured error if not already one
      if (error.name && error.name.includes('Error')) {
        throw error;
      }
      
      throw new ExternalApiError(
        `Failed to process ${this.providerName} OAuth callback: ${error.message}`,
        { provider: this.providerName, originalError: error }
      );
    }
  }

  /**
   * Normalizes a profile from provider-specific format to standard format
   * This is a utility method that can be used by concrete providers
   * 
   * @param rawProfile - The raw profile data from the provider
   * @param mapping - A mapping of provider-specific fields to standard fields
   * @returns A normalized OAuth profile
   */
  protected normalizeProfile(rawProfile: Record<string, any>, mapping: Record<string, string>): OAuthProfile {
    try {
      const profile: Partial<OAuthProfile> = {
        provider: this.providerName,
        raw: rawProfile
      };

      // Map fields according to the provided mapping
      for (const [standardField, providerField] of Object.entries(mapping)) {
        const value = this.getNestedProperty(rawProfile, providerField);
        if (value !== undefined) {
          profile[standardField] = value;
        }
      }

      // Ensure required fields are present
      if (!profile.id) {
        throw new ExternalResponseFormatError(
          `Missing required field 'id' in ${this.providerName} profile`,
          { provider: this.providerName, profile: rawProfile }
        );
      }

      if (!profile.email) {
        throw new ExternalResponseFormatError(
          `Missing required field 'email' in ${this.providerName} profile`,
          { provider: this.providerName, profile: rawProfile }
        );
      }

      if (!profile.name) {
        // Try to construct name from firstName and lastName if available
        if (profile.firstName || profile.lastName) {
          profile.name = [profile.firstName, profile.lastName]
            .filter(Boolean)
            .join(' ');
        } else {
          // Use email as fallback for name
          profile.name = profile.email.split('@')[0];
        }
      }

      return profile as OAuthProfile;
    } catch (error) {
      this.logger.error(`Error normalizing ${this.providerName} profile`, { 
        error: error.message,
        stack: error.stack
      });
      
      throw new ExternalResponseFormatError(
        `Failed to normalize ${this.providerName} profile: ${error.message}`,
        { provider: this.providerName, profile: rawProfile }
      );
    }
  }

  /**
   * Safely retrieves a nested property from an object using dot notation
   * 
   * @param obj - The object to retrieve the property from
   * @param path - The path to the property using dot notation (e.g., 'user.profile.name')
   * @returns The value at the specified path or undefined if not found
   */
  protected getNestedProperty(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }

  /**
   * Generates the authorization URL for initiating the OAuth flow
   * 
   * @param state - Optional state parameter for CSRF protection
   * @param additionalParams - Additional provider-specific parameters
   * @returns The authorization URL
   */
  public abstract getAuthorizationUrl(state?: string, additionalParams?: Record<string, string>): string;
}