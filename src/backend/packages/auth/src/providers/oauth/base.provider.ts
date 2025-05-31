import { Injectable } from '@nestjs/common';
import { IUser, IUserCredentials } from '../../interfaces/user.interface';
import { ITokenPayload, IToken } from '../../interfaces/token.interface';
import { ValidationError, InvalidParameterError } from '@austa/errors/categories';
import { Logger } from '@austa/logging';

/**
 * Standard OAuth profile structure with normalized fields
 * This interface provides a consistent representation of user profiles
 * across different OAuth providers
 */
export interface IOAuthProfile {
  /**
   * Provider-specific ID for the user
   */
  id: string;

  /**
   * OAuth provider name (e.g., 'google', 'facebook', 'apple')
   */
  provider: string;

  /**
   * User's display name
   */
  displayName?: string;

  /**
   * User's email address
   */
  email?: string;

  /**
   * Whether the email has been verified by the provider
   */
  emailVerified?: boolean;

  /**
   * User's profile photo URL
   */
  photoURL?: string;

  /**
   * First name
   */
  firstName?: string;

  /**
   * Last name
   */
  lastName?: string;

  /**
   * Raw profile data from the provider
   */
  _raw?: any;

  /**
   * JSON representation of the raw profile
   */
  _json?: any;
}

/**
 * OAuth token information
 */
export interface IOAuthTokens {
  /**
   * Access token for API calls to the provider
   */
  accessToken: string;

  /**
   * Refresh token for obtaining new access tokens
   */
  refreshToken?: string;

  /**
   * ID token (JWT) containing user information (used by OpenID Connect providers)
   */
  idToken?: string;

  /**
   * Token expiration time in seconds
   */
  expiresIn?: number;

  /**
   * Token type (usually 'Bearer')
   */
  tokenType?: string;

  /**
   * Scope of access granted
   */
  scope?: string | string[];
}

/**
 * OAuth provider configuration options
 */
export interface IOAuthProviderOptions {
  /**
   * Client ID from the OAuth provider
   */
  clientId: string;

  /**
   * Client secret from the OAuth provider
   */
  clientSecret: string;

  /**
   * Redirect URI for the OAuth flow
   */
  callbackURL: string;

  /**
   * Requested scopes
   */
  scope?: string | string[];

  /**
   * Whether to automatically create users if they don't exist
   */
  autoCreateUser?: boolean;

  /**
   * Default roles to assign to automatically created users
   */
  defaultRoles?: string[];

  /**
   * Provider-specific options
   */
  [key: string]: any;
}

/**
 * Abstract base class for OAuth providers
 * Serves as the foundation for all identity provider implementations
 * in the AUSTA SuperApp authentication system
 */
@Injectable()
export abstract class BaseOAuthProvider {
  /**
   * Provider name (e.g., 'google', 'facebook', 'apple')
   */
  abstract readonly providerName: string;

  /**
   * Logger instance for the provider
   */
  protected readonly logger: Logger;

  /**
   * Provider configuration
   */
  protected readonly options: IOAuthProviderOptions;

  /**
   * Creates an instance of BaseOAuthProvider
   * @param options Provider configuration options
   * @param logger Logger service for standardized logging
   */
  constructor(options: IOAuthProviderOptions, logger: Logger) {
    this.options = options;
    this.logger = logger.createChildLogger({ context: `OAuth:${this.providerName}` });
    this.validateOptions();
  }

  /**
   * Validates the provider options
   * @throws {ValidationError} If required options are missing
   */
  protected validateOptions(): void {
    const requiredOptions = ['clientId', 'clientSecret', 'callbackURL'];
    
    for (const option of requiredOptions) {
      if (!this.options[option]) {
        this.logger.error(`Missing required option: ${option}`, { provider: this.providerName });
        throw new ValidationError(`Missing required option for ${this.providerName} provider: ${option}`);
      }
    }
  }

  /**
   * Authenticates a user with the OAuth provider using authorization code
   * @param code Authorization code from the OAuth redirect
   * @returns OAuth tokens and normalized user profile
   */
  abstract authenticate(code: string): Promise<{ tokens: IOAuthTokens; profile: IOAuthProfile }>;

  /**
   * Validates an existing OAuth token with the provider
   * @param token Access token to validate
   * @returns Whether the token is valid and the associated profile if available
   */
  abstract validateToken(token: string): Promise<{ valid: boolean; profile?: IOAuthProfile }>;

  /**
   * Refreshes an OAuth access token using a refresh token
   * @param refreshToken Refresh token to use
   * @returns New OAuth tokens
   */
  abstract refreshToken(refreshToken: string): Promise<IOAuthTokens>;

  /**
   * Revokes an OAuth token with the provider
   * @param token Access token to revoke
   * @returns Whether the revocation was successful
   */
  abstract revokeToken(token: string): Promise<boolean>;

  /**
   * Creates a user from an OAuth profile
   * This method should be implemented by concrete providers if they
   * need custom user creation logic
   * 
   * @param profile Normalized OAuth profile
   * @returns Created user
   */
  abstract createUserFromProfile(profile: IOAuthProfile): Promise<IUser>;

  /**
   * Generates an application JWT token from OAuth profile and tokens
   * @param profile Normalized OAuth profile
   * @param user User entity (if exists)
   * @returns JWT token payload
   */
  protected createTokenPayload(profile: IOAuthProfile, user: IUser): ITokenPayload {
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      provider: profile.provider,
      providerId: profile.id
    };
  }

  /**
   * Normalizes a provider-specific profile to the standard format
   * This method provides a default implementation that can be overridden
   * by concrete providers for provider-specific normalization
   * 
   * @param rawProfile Raw profile data from the provider
   * @returns Normalized OAuth profile
   */
  protected normalizeProfile(rawProfile: any): IOAuthProfile {
    if (!rawProfile) {
      throw new InvalidParameterError('Raw profile data is required for normalization');
    }

    // Default implementation with basic normalization
    // Concrete providers should override this with provider-specific logic
    return {
      id: rawProfile.id || rawProfile.sub || '',
      provider: this.providerName,
      displayName: rawProfile.displayName || rawProfile.name || '',
      email: rawProfile.email || '',
      emailVerified: rawProfile.email_verified || false,
      photoURL: rawProfile.picture || rawProfile.photoURL || rawProfile.photo || '',
      firstName: rawProfile.given_name || rawProfile.firstName || '',
      lastName: rawProfile.family_name || rawProfile.lastName || '',
      _raw: rawProfile,
      _json: typeof rawProfile === 'string' ? JSON.parse(rawProfile) : rawProfile
    };
  }

  /**
   * Extracts user credentials from an OAuth profile
   * @param profile Normalized OAuth profile
   * @returns User credentials for authentication
   */
  protected extractCredentials(profile: IOAuthProfile): IUserCredentials {
    if (!profile.email) {
      this.logger.warn('OAuth profile missing email', { provider: this.providerName, profileId: profile.id });
      throw new ValidationError('OAuth profile does not contain an email address');
    }

    return {
      email: profile.email,
      // Password is not used for OAuth authentication
      // This is a placeholder that should be replaced with a secure random value
      // in concrete implementations if needed
      password: ''
    };
  }

  /**
   * Builds a user object from an OAuth profile
   * @param profile Normalized OAuth profile
   * @returns User object for creation
   */
  protected buildUserFromProfile(profile: IOAuthProfile): Omit<IUser, 'id'> {
    const name = profile.displayName || 
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 
      profile.email?.split('@')[0] || 
      'Unknown User';

    return {
      email: profile.email || '',
      name,
      // Other fields can be added here based on the profile data
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Gets the authorization URL for initiating the OAuth flow
   * @param state Optional state parameter for CSRF protection
   * @param additionalParams Additional provider-specific parameters
   * @returns Authorization URL to redirect the user to
   */
  abstract getAuthorizationUrl(state?: string, additionalParams?: Record<string, string>): string;
}