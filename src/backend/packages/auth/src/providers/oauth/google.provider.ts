/**
 * @file Google OAuth Provider
 * 
 * Handles Google-specific authentication flow, token validation, and profile normalization.
 * Configures client ID, secret, and callback URL from environment variables.
 * Extracts standardized user profile information from Google's response format.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

import { BaseOAuthProvider } from './base.provider';
import {
  GoogleProfile,
  GoogleOAuthConfig,
  OAuthToken,
  OAuthProviderType
} from './interfaces';

/**
 * Google OAuth provider implementation that extends the base provider.
 * Handles Google-specific authentication flow, token validation, and profile normalization.
 */
@Injectable()
export class GoogleOAuthProvider extends BaseOAuthProvider {
  protected readonly providerType: OAuthProviderType = 'google';
  private readonly oAuth2Client: OAuth2Client;
  private readonly logger = new Logger(GoogleOAuthProvider.name);
  
  // Google OAuth endpoints
  private readonly authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly userInfoEndpoint = 'https://www.googleapis.com/oauth2/v3/userinfo';
  
  // Default scopes for Google OAuth
  private readonly defaultScopes = ['email', 'profile', 'openid'];

  /**
   * Creates an instance of GoogleOAuthProvider.
   * 
   * @param configService - NestJS ConfigService for accessing environment variables
   * @param jwtService - NestJS JwtService for token validation and generation
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly jwtService: JwtService
  ) {
    super(configService, jwtService);
    
    const config = this.getConfig();
    this.oAuth2Client = new OAuth2Client(
      config.clientID,
      config.clientSecret,
      config.callbackURL
    );
    
    this.logger.log('Google OAuth provider initialized');
  }

  /**
   * Gets the configuration for the Google OAuth provider from environment variables.
   * 
   * @returns The Google OAuth provider configuration
   */
  getConfig(): GoogleOAuthConfig {
    return {
      clientID: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: this.defaultScopes,
      includeGrantedScopes: true
    };
  }

  /**
   * Generates an authorization URL for the Google OAuth flow.
   * 
   * @param state - Optional state parameter for CSRF protection
   * @param scopes - Optional scopes to request (defaults to email, profile, openid)
   * @returns The Google authorization URL
   */
  generateAuthUrl(state?: string, scopes?: string[]): string {
    const config = this.getConfig();
    
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes || this.defaultScopes,
      state,
      include_granted_scopes: config.includeGrantedScopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchanges an authorization code for a Google access token.
   * 
   * @param code - The authorization code to exchange
   * @returns A promise that resolves to the OAuth token
   * @throws AuthenticationError if the code exchange fails
   */
  async exchangeCode(code: string): Promise<OAuthToken> {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code);
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined,
        tokenType: tokens.token_type,
        scope: tokens.scope
      };
    } catch (error) {
      return this.handleAuthError(
        error,
        'Failed to exchange Google authorization code for tokens'
      );
    }
  }

  /**
   * Validates a Google ID token and extracts the user profile.
   * Uses the Google Auth Library to verify the token's signature, audience, and expiration.
   * 
   * @param token - The Google ID token to validate
   * @returns A promise that resolves to the validated user profile
   * @throws AuthenticationError if the token is invalid
   */
  async validateToken(token: string): Promise<GoogleProfile> {
    try {
      // Verify the ID token using Google Auth Library
      const config = this.getConfig();
      const ticket = await this.oAuth2Client.verifyIdToken({
        idToken: token,
        audience: config.clientID
      });
      
      // Get the payload from the verified token
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new Error('Invalid token payload');
      }
      
      // Extract user profile from the payload
      const profile: GoogleProfile = {
        id: payload.sub,
        provider: 'google',
        displayName: payload.name,
        email: payload.email,
        emailVerified: payload.email_verified,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        locale: payload.locale,
        _json: payload
      };
      
      return profile;
    } catch (error) {
      return this.handleAuthError(
        error,
        'Failed to validate Google ID token'
      );
    }
  }

  /**
   * Fetches the user profile using an access token.
   * This is an alternative to using the ID token for profile information.
   * 
   * @param accessToken - The access token to use for fetching the profile
   * @returns A promise that resolves to the user profile
   * @throws AuthenticationError if the profile fetch fails
   */
  async fetchUserProfile(accessToken: string): Promise<GoogleProfile> {
    try {
      // Fetch user profile from Google's userinfo endpoint
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const data = response.data;
      
      // Map the response to our GoogleProfile interface
      const profile: GoogleProfile = {
        id: data.sub,
        provider: 'google',
        displayName: data.name,
        email: data.email,
        emailVerified: data.email_verified,
        firstName: data.given_name,
        lastName: data.family_name,
        picture: data.picture,
        locale: data.locale,
        _json: data
      };
      
      return profile;
    } catch (error) {
      return this.handleAuthError(
        error,
        'Failed to fetch Google user profile'
      );
    }
  }

  /**
   * Verifies a Google access token and returns token information.
   * This can be used to check the scopes that were provisioned to a given token.
   * 
   * @param accessToken - The access token to verify
   * @returns A promise that resolves to the token information
   * @throws AuthenticationError if the token verification fails
   */
  async verifyAccessToken(accessToken: string): Promise<any> {
    try {
      const tokenInfo = await this.oAuth2Client.getTokenInfo(accessToken);
      return tokenInfo;
    } catch (error) {
      return this.handleAuthError(
        error,
        'Failed to verify Google access token'
      );
    }
  }

  /**
   * Revokes a Google OAuth token.
   * 
   * @param token - The token to revoke
   * @returns A promise that resolves when the token is revoked
   * @throws AuthenticationError if the token revocation fails
   */
  async revokeToken(token: string): Promise<void> {
    try {
      await this.oAuth2Client.revokeToken(token);
    } catch (error) {
      return this.handleAuthError(
        error,
        'Failed to revoke Google token'
      );
    }
  }
}