/**
 * @file Google OAuth Provider Implementation
 * @description Handles Google-specific authentication flow, token validation, and profile normalization.
 * Configures client ID, secret, and callback URL from environment variables.
 * Extracts standardized user profile information from Google's response format.
 *
 * This provider is part of the AUSTA SuperApp authentication system and implements
 * the OAuth provider interface for Google authentication. It includes enhanced
 * profile mapping and Google-specific ID token validation.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { Logger } from '@austa/logging';
import { AuthenticationError } from '@austa/errors';

import { BaseOAuthProvider } from './base.provider';
import {
  OAuthProfile,
  OAuthToken,
  GoogleOAuthConfig,
  OAuthProviderType
} from './interfaces';

/**
 * Google OAuth Provider Implementation
 * 
 * Handles Google-specific authentication flow, token validation, and profile normalization.
 * Extends the base OAuth provider with Google-specific functionality.
 */
@Injectable()
export class GoogleOAuthProvider extends BaseOAuthProvider {
  private readonly googleClient: OAuth2Client;
  private readonly logger = new Logger(GoogleOAuthProvider.name);

  /**
   * Creates a new instance of the Google OAuth provider
   * 
   * @param configService - NestJS configuration service for accessing environment variables
   */
  constructor(private readonly configService: ConfigService) {
    // Initialize the base provider with Google-specific configuration
    super({
      provider: 'google',
      clientId: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // Additional Google-specific configuration
      accessType: 'offline',
      includeGrantedScopes: true,
      prompt: 'consent'
    } as GoogleOAuthConfig);

    // Initialize the Google OAuth2 client for token validation
    this.googleClient = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.callbackURL
    );

    this.logger.debug('Google OAuth provider initialized');
  }

  /**
   * Validates a Google ID token
   * 
   * Uses Google's official auth library to verify the token's signature,
   * expiration, audience, and issuer.
   * 
   * @param token - The ID token to validate
   * @returns A promise that resolves to the decoded token payload if valid
   * @throws AuthenticationError if the token is invalid
   */
  async validateToken(token: string): Promise<Record<string, any>> {
    try {
      this.logger.debug('Validating Google ID token');
      
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.config.clientId
      });
      
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new AuthenticationError(
          'INVALID_TOKEN',
          'Google ID token validation failed: empty payload'
        );
      }
      
      this.logger.debug('Google ID token validated successfully');
      return payload;
    } catch (error) {
      this.logger.error('Google ID token validation failed', error);
      throw new AuthenticationError(
        'INVALID_TOKEN',
        `Google ID token validation failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * Exchanges an authorization code for an access token
   * 
   * @param code - The authorization code received from Google
   * @returns A promise that resolves to the OAuth token response
   * @throws AuthenticationError if token exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    try {
      this.logger.debug('Exchanging authorization code for token');
      
      const { tokens } = await this.googleClient.getToken(code);
      
      // Transform the response to match our OAuthToken interface
      const oauthToken: OAuthToken = {
        access_token: tokens.access_token,
        token_type: tokens.token_type || 'Bearer',
        expires_in: tokens.expiry_date ? 
          Math.floor((tokens.expiry_date - Date.now()) / 1000) : 
          3600,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        scope: tokens.scope,
        issued_at: new Date().toISOString(),
        expires_at: tokens.expiry_date
      };
      
      this.logger.debug('Successfully exchanged code for token');
      return oauthToken;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error);
      throw new AuthenticationError(
        'TOKEN_EXCHANGE_FAILED',
        `Failed to exchange authorization code for token: ${error.message}`,
        error
      );
    }
  }

  /**
   * Refreshes an access token using a refresh token
   * 
   * @param refreshToken - The refresh token to use
   * @returns A promise that resolves to the new OAuth token response
   * @throws AuthenticationError if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    try {
      this.logger.debug('Refreshing access token');
      
      this.googleClient.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.googleClient.refreshAccessToken();
      
      // Transform the response to match our OAuthToken interface
      const oauthToken: OAuthToken = {
        access_token: credentials.access_token,
        token_type: credentials.token_type || 'Bearer',
        expires_in: credentials.expiry_date ? 
          Math.floor((credentials.expiry_date - Date.now()) / 1000) : 
          3600,
        refresh_token: credentials.refresh_token || refreshToken,
        id_token: credentials.id_token,
        scope: credentials.scope,
        issued_at: new Date().toISOString(),
        expires_at: credentials.expiry_date
      };
      
      this.logger.debug('Successfully refreshed access token');
      return oauthToken;
    } catch (error) {
      this.logger.error('Failed to refresh access token', error);
      throw new AuthenticationError(
        'TOKEN_REFRESH_FAILED',
        `Failed to refresh access token: ${error.message}`,
        error
      );
    }
  }

  /**
   * Retrieves the user profile from Google using an access token
   * 
   * @param accessToken - The access token to use for the request
   * @returns A promise that resolves to the normalized user profile
   * @throws AuthenticationError if profile retrieval fails
   */
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    try {
      this.logger.debug('Retrieving Google user profile');
      
      // Set the access token on the client
      this.googleClient.setCredentials({
        access_token: accessToken
      });
      
      // Make a request to Google's userinfo endpoint
      const response = await this.googleClient.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo'
      });
      
      const data = response.data;
      
      // Map Google's profile format to our standardized OAuthProfile
      const profile: OAuthProfile = {
        id: data.sub,
        provider: 'google' as OAuthProviderType,
        displayName: data.name,
        firstName: data.given_name,
        lastName: data.family_name,
        email: data.email,
        emailVerified: data.email_verified,
        picture: data.picture,
        locale: data.locale,
        // Store the original response for reference
        _json: data
      };
      
      this.logger.debug('Successfully retrieved Google user profile');
      return profile;
    } catch (error) {
      this.logger.error('Failed to retrieve Google user profile', error);
      throw new AuthenticationError(
        'PROFILE_RETRIEVAL_FAILED',
        `Failed to retrieve Google user profile: ${error.message}`,
        error
      );
    }
  }

  /**
   * Validates an ID token and returns the user profile
   * 
   * This is a convenience method that combines token validation and profile extraction
   * 
   * @param idToken - The ID token to validate
   * @returns A promise that resolves to the normalized user profile
   * @throws AuthenticationError if token validation fails
   */
  async getUserProfileFromIdToken(idToken: string): Promise<OAuthProfile> {
    try {
      this.logger.debug('Extracting user profile from ID token');
      
      // Validate the ID token
      const payload = await this.validateToken(idToken);
      
      // Map the token payload to our standardized OAuthProfile
      const profile: OAuthProfile = {
        id: payload.sub,
        provider: 'google' as OAuthProviderType,
        displayName: payload.name,
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        emailVerified: payload.email_verified,
        picture: payload.picture,
        locale: payload.locale,
        // Store the original payload for reference
        _json: payload
      };
      
      this.logger.debug('Successfully extracted user profile from ID token');
      return profile;
    } catch (error) {
      this.logger.error('Failed to extract user profile from ID token', error);
      throw new AuthenticationError(
        'PROFILE_EXTRACTION_FAILED',
        `Failed to extract user profile from ID token: ${error.message}`,
        error
      );
    }
  }

  /**
   * Revokes access for the given token
   * 
   * @param token - The token to revoke
   * @returns A promise that resolves when the token is revoked
   * @throws AuthenticationError if token revocation fails
   */
  async revokeToken(token: string): Promise<void> {
    try {
      this.logger.debug('Revoking Google token');
      
      await this.googleClient.revokeToken(token);
      
      this.logger.debug('Successfully revoked Google token');
    } catch (error) {
      this.logger.error('Failed to revoke Google token', error);
      throw new AuthenticationError(
        'TOKEN_REVOCATION_FAILED',
        `Failed to revoke Google token: ${error.message}`,
        error
      );
    }
  }

  /**
   * Gets the provider type
   * 
   * @returns The OAuth provider type ('google')
   */
  getProviderType(): OAuthProviderType {
    return 'google';
  }
}