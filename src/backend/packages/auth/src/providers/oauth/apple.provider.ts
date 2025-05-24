/**
 * @file Apple OAuth Provider
 * @description Handles Apple's Sign In with Apple flow, including JWT validation, token exchange, and profile normalization.
 * Configures client ID, team ID, key ID, private key, and callback URL from environment variables.
 * Handles Apple's unique requirements like private email relay and minimal profile information.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import axios from 'axios';
import { AuthenticationError } from '@austa/errors';
import { BaseOAuthProvider } from './base.provider';
import { AppleOAuthConfig, AppleProfile, OAuthToken } from './interfaces';

/**
 * Apple OAuth provider implementation that extends the base provider.
 * Handles Apple's Sign In with Apple flow, including JWT validation, token exchange, and profile normalization.
 */
@Injectable()
export class AppleOAuthProvider extends BaseOAuthProvider {
  private readonly config: AppleOAuthConfig;
  private readonly jwksClient: jwksClient.JwksClient;

  /**
   * Creates an instance of AppleOAuthProvider.
   * @param configService - NestJS ConfigService for accessing environment variables
   */
  constructor(private readonly configService: ConfigService) {
    super();

    // Initialize Apple-specific configuration from environment variables
    this.config = {
      clientID: this.configService.get<string>('APPLE_CLIENT_ID'),
      clientSecret: this.generateClientSecret(),
      callbackURL: this.configService.get<string>('APPLE_CALLBACK_URL'),
      teamID: this.configService.get<string>('APPLE_TEAM_ID'),
      keyID: this.configService.get<string>('APPLE_KEY_ID'),
      privateKeyLocation: this.configService.get<string>('APPLE_PRIVATE_KEY_LOCATION'),
      scope: ['name', 'email'],
    };

    // Initialize JWKS client for Apple's public keys
    this.jwksClient = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Validates an Apple ID token and extracts user profile information.
   * @param token - The ID token to validate
   * @returns The validated user profile
   * @throws AuthenticationError if token validation fails
   */
  async validateToken(token: string): Promise<AppleProfile> {
    try {
      // Decode the token without verification to get the header
      const decodedToken = jwt.decode(token, { complete: true });
      if (!decodedToken || typeof decodedToken !== 'object') {
        throw new AuthenticationError('Invalid token format');
      }

      // Get the key ID from the token header
      const kid = decodedToken.header.kid;
      if (!kid) {
        throw new AuthenticationError('Token header missing key ID');
      }

      // Get the public key from Apple's JWKS endpoint
      const key = await this.jwksClient.getSigningKey(kid);
      const publicKey = key.getPublicKey();

      // Verify the token signature and claims
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: this.config.clientID,
      }) as jwt.JwtPayload;

      // Extract user profile information from the token
      return this.normalizeProfile(payload);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError(`Token validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Exchanges an authorization code for tokens from Apple's servers.
   * @param code - The authorization code to exchange
   * @returns The OAuth tokens from Apple
   * @throws AuthenticationError if token exchange fails
   */
  async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    try {
      const tokenEndpoint = 'https://appleid.apple.com/auth/token';
      const response = await axios.post(
        tokenEndpoint,
        new URLSearchParams({
          client_id: this.config.clientID,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.callbackURL,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      throw new AuthenticationError(
        `Failed to exchange authorization code: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Refreshes an expired access token using a refresh token.
   * @param refreshToken - The refresh token to use
   * @returns The new OAuth tokens from Apple
   * @throws AuthenticationError if token refresh fails
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    try {
      const tokenEndpoint = 'https://appleid.apple.com/auth/token';
      const response = await axios.post(
        tokenEndpoint,
        new URLSearchParams({
          client_id: this.config.clientID,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Apple may not return a new refresh token
        idToken: response.data.id_token,
        tokenType: response.data.token_type,
        expiresIn: response.data.expires_in,
        scope: response.data.scope,
      };
    } catch (error) {
      throw new AuthenticationError(
        `Failed to refresh token: ${error.response?.data?.error || error.message}`
      );
    }
  }

  /**
   * Normalizes the Apple profile data to a standard format.
   * @param payload - The decoded JWT payload from Apple
   * @returns The normalized user profile
   */
  private normalizeProfile(payload: jwt.JwtPayload): AppleProfile {
    // Extract the user ID (sub) from the payload
    const id = payload.sub;
    if (!id) {
      throw new AuthenticationError('Invalid profile: missing user ID');
    }

    // Create a normalized profile with available information
    const profile: AppleProfile = {
      id,
      provider: 'apple',
      email: payload.email,
      emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      _raw: payload,
      _json: payload,
    };

    // Check if this is a private email relay
    if (payload.email && payload.email.endsWith('privaterelay.appleid.com')) {
      profile.isPrivateEmail = true;
    }

    // Apple only provides name information on the first authentication
    // This would typically be handled in the frontend and passed separately
    if (payload.name) {
      profile.firstName = payload.name.firstName;
      profile.lastName = payload.name.lastName;
      profile.displayName = `${payload.name.firstName} ${payload.name.lastName}`.trim();
      profile.name = {
        firstName: payload.name.firstName,
        lastName: payload.name.lastName,
      };
    }

    return profile;
  }

  /**
   * Generates a client secret for Apple authentication.
   * The client secret is a JWT token signed with the private key.
   * @returns The generated client secret
   */
  private generateClientSecret(): string {
    try {
      // Read the private key from the file system
      const privateKey = fs.readFileSync(this.config.privateKeyLocation, 'utf8');

      // Create the JWT payload
      const payload = {
        iss: this.config.teamID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months in seconds
        aud: 'https://appleid.apple.com',
        sub: this.config.clientID,
      };

      // Sign the JWT with the private key
      return jwt.sign(payload, privateKey, {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: this.config.keyID,
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate client secret: ${error.message}`);
    }
  }
}