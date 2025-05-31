/**
 * @file Facebook OAuth Provider
 * 
 * This file implements the Facebook OAuth provider for the AUSTA SuperApp.
 * It handles Facebook-specific authentication flow, token validation, and profile normalization.
 * The provider configures app ID, secret, and callback URL from environment variables and
 * extracts standardized user profile information from Facebook's graph API responses.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { AuthenticationError } from '@austa/errors/journey';
import { LoggerService } from '@austa/logging';

import {
  FacebookProfile,
  FacebookOAuthConfig,
  OAuthToken,
  OAuthUserData
} from './interfaces';

/**
 * Facebook OAuth provider implementation that extends the PassportStrategy.
 * Handles Facebook-specific authentication flow, token validation, and profile normalization.
 * 
 * This provider is responsible for:
 * - Configuring the Facebook OAuth strategy with app ID, secret, and callback URL
 * - Validating Facebook access tokens with improved security checks
 * - Normalizing Facebook profile data to a standardized format
 * - Handling Facebook-specific authentication errors
 */
@Injectable()
export class FacebookOAuthProvider extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookOAuthProvider.name);

  /**
   * Creates a new instance of the FacebookOAuthProvider.
   * 
   * @param configService - The NestJS config service for accessing environment variables
   * @param loggerService - The logger service for structured logging
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService
  ) {
    // Configure the Facebook OAuth strategy with app ID, secret, and callback URL
    const config: FacebookOAuthConfig = {
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos', 'gender', 'birthday'],
      enableProof: true, // Enhance security by requiring app secret proof
    };

    super(config);

    this.logger.log('FacebookOAuthProvider initialized');
  }

  /**
   * Validates the Facebook authentication response and normalizes the profile.
   * This method is called by Passport.js after successful authentication with Facebook.
   * 
   * @param accessToken - The Facebook access token
   * @param refreshToken - The Facebook refresh token (if available)
   * @param profile - The Facebook profile information
   * @returns A promise that resolves to the normalized user data
   * @throws AuthenticationError if validation fails
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: FacebookProfile
  ): Promise<OAuthUserData> {
    try {
      this.loggerService.debug('Validating Facebook profile', {
        profileId: profile.id,
        provider: 'facebook'
      });

      // Validate the Facebook access token
      await this.validateAccessToken(accessToken, profile.id);

      // Extract and normalize the user data from the Facebook profile
      const userData: OAuthUserData = {
        provider: 'facebook',
        providerId: profile.id,
        email: this.extractEmail(profile),
        name: profile.displayName || this.constructName(profile),
        picture: this.extractProfilePicture(profile),
        providerData: {
          accessToken,
          refreshToken: refreshToken || undefined,
          gender: profile.gender,
          birthday: profile.birthday,
          profileUrl: profile.profileUrl
        }
      };

      this.loggerService.debug('Facebook profile validated successfully', {
        userId: userData.providerId,
        provider: 'facebook'
      });

      return userData;
    } catch (error) {
      this.loggerService.error('Facebook authentication failed', {
        error: error.message,
        profileId: profile?.id,
        provider: 'facebook'
      });

      throw new AuthenticationError(
        'Failed to authenticate with Facebook',
        { cause: error }
      );
    }
  }

  /**
   * Validates the Facebook access token by making a request to the Facebook Graph API.
   * 
   * @param accessToken - The Facebook access token to validate
   * @param userId - The Facebook user ID to validate against
   * @returns A promise that resolves if the token is valid
   * @throws Error if token validation fails
   */
  private async validateAccessToken(accessToken: string, userId: string): Promise<void> {
    try {
      // Facebook token validation endpoint
      const response = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${this.configService.get<string>('FACEBOOK_APP_ID')}|${this.configService.get<string>('FACEBOOK_APP_SECRET')}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Token validation failed with status: ${response.status}`);
      }

      const data = await response.json();

      // Check if the token is valid and matches the user ID
      if (!data.data?.is_valid || data.data?.user_id !== userId) {
        throw new Error('Invalid access token or user ID mismatch');
      }

      this.loggerService.debug('Facebook access token validated', {
        userId,
        isValid: data.data?.is_valid
      });
    } catch (error) {
      this.loggerService.error('Facebook token validation failed', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Extracts the email address from the Facebook profile.
   * 
   * @param profile - The Facebook profile
   * @returns The email address or undefined if not available
   */
  private extractEmail(profile: FacebookProfile): string | undefined {
    if (profile.emails && profile.emails.length > 0) {
      return profile.emails[0].value;
    }
    return undefined;
  }

  /**
   * Constructs a display name from the Facebook profile if displayName is not available.
   * 
   * @param profile - The Facebook profile
   * @returns The constructed name or 'Facebook User' if name components are not available
   */
  private constructName(profile: FacebookProfile): string {
    if (profile._json && profile._json.first_name && profile._json.last_name) {
      return `${profile._json.first_name} ${profile._json.last_name}`;
    }
    return 'Facebook User';
  }

  /**
   * Extracts the profile picture URL from the Facebook profile.
   * 
   * @param profile - The Facebook profile
   * @returns The profile picture URL or undefined if not available
   */
  private extractProfilePicture(profile: FacebookProfile): string | undefined {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos[0].value;
    }
    
    // Fallback to constructing the picture URL directly
    if (profile.id) {
      return `https://graph.facebook.com/${profile.id}/picture?type=large`;
    }
    
    return undefined;
  }
}