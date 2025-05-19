/**
 * @file Apple OAuth Provider
 * @description Implementation of the Apple OAuth provider for the AUSTA SuperApp.
 * Handles Apple's Sign In with Apple flow, including JWT validation, token exchange,
 * and profile normalization.
 *
 * This provider implements Apple's unique requirements including private email relay
 * and handling of minimal profile information. It uses cryptographic verification
 * for JWT tokens and properly configures from environment variables.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Strategy } from 'passport-oauth2';
import { AppleOAuthConfig, OAuthProfile, OAuthProviderType, OAuthToken } from './interfaces';

/**
 * Apple-specific JWT payload structure
 * Represents the decoded contents of an Apple ID token
 */
interface AppleJwtPayload {
  /** Issuer identifier (should be https://appleid.apple.com) */
  iss: string;
  
  /** Audience (client ID) */
  aud: string;
  
  /** Expiration time (Unix timestamp) */
  exp: number;
  
  /** Issued at time (Unix timestamp) */
  iat: number;
  
  /** Subject (user ID) */
  sub: string;
  
  /** User's email address (if authorized) */
  email?: string;
  
  /** Whether the email is verified */
  email_verified?: boolean;
  
  /** Whether the email is private relay */
  is_private_email?: boolean;
  
  /** User's full name (only provided on first authentication) */
  name?: {
    firstName: string;
    lastName: string;
  };
  
  /** Nonce used for CSRF protection */
  nonce?: string;
  
  /** Authentication time */
  auth_time?: number;
}

/**
 * Apple OAuth provider implementation for the AUSTA SuperApp.
 * Handles Apple's Sign In with Apple flow, including JWT validation,
 * token exchange, and profile normalization.
 * 
 * This provider extends the PassportStrategy class and uses the OAuth2 strategy
 * as a base, customizing it for Apple's specific requirements.
 * 
 * Example usage:
 * ```typescript
 * // In your auth module
 * providers: [
 *   AppleOAuthProvider,
 *   // other providers
 * ]
 * ```
 */
@Injectable()
export class AppleOAuthProvider extends PassportStrategy(Strategy, 'apple') {
  private readonly logger = new Logger(AppleOAuthProvider.name);
  private readonly APPLE_PUBLIC_KEYS_URL = 'https://appleid.apple.com/auth/keys';
  private readonly APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize';
  private readonly APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
  
  /**
   * Creates an instance of the Apple OAuth provider.
   * 
   * @param configService - The NestJS config service for accessing environment variables
   */
  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: 'https://appleid.apple.com/auth/authorize',
      tokenURL: 'https://appleid.apple.com/auth/token',
      clientID: configService.get<string>('APPLE_CLIENT_ID'),
      clientSecret: AppleOAuthProvider.generateClientSecret({
        clientId: configService.get<string>('APPLE_CLIENT_ID'),
        teamId: configService.get<string>('APPLE_TEAM_ID'),
        keyId: configService.get<string>('APPLE_KEY_ID'),
        privateKey: configService.get<string>('APPLE_PRIVATE_KEY'),
      }),
      callbackURL: configService.get<string>('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
      passReqToCallback: true,
    });
  }
  
  /**
   * Validates the authentication response from Apple and extracts user information.
   * 
   * This method is called by Passport after the user has authenticated with Apple.
   * It verifies the ID token, extracts the user profile, and returns a standardized
   * user object that can be used by the application.
   * 
   * @param req - The HTTP request object
   * @param accessToken - The OAuth access token from Apple
   * @param refreshToken - The OAuth refresh token from Apple
   * @param params - Additional parameters from the OAuth response
   * @param profile - The user profile (empty for Apple, we extract from ID token)
   * @param done - Callback to signal completion
   */
  async validate(req: any, accessToken: string, refreshToken: string, params: any, profile: any, done: Function) {
    try {
      this.logger.debug('Validating Apple authentication response');
      
      // Apple doesn't provide profile info directly, we need to extract it from the ID token
      if (!params.id_token) {
        throw new Error('No ID token provided by Apple');
      }
      
      // Verify and decode the ID token
      const decodedToken = await this.verifyAppleIdToken(params.id_token);
      
      // Extract user information from the token
      const userId = decodedToken.sub;
      const email = decodedToken.email;
      const emailVerified = decodedToken.email_verified;
      const isPrivateEmail = decodedToken.is_private_email;
      
      // Apple only provides name information on the first sign-in
      // It might be passed in the request body for first-time authentication
      let firstName = '';
      let lastName = '';
      
      // Check if name data was provided in the request (first-time sign-in)
      if (req.body && req.body.user) {
        try {
          const userData = typeof req.body.user === 'string' 
            ? JSON.parse(req.body.user) 
            : req.body.user;
          
          if (userData.name) {
            firstName = userData.name.firstName || '';
            lastName = userData.name.lastName || '';
          }
        } catch (error) {
          this.logger.warn('Failed to parse user data from request body', error);
        }
      } else if (decodedToken.name) {
        // If name is in the token (rare case)
        firstName = decodedToken.name.firstName || '';
        lastName = decodedToken.name.lastName || '';
      }
      
      // Create a standardized user profile
      const standardizedProfile: OAuthProfile = {
        id: userId,
        provider: 'apple' as OAuthProviderType,
        displayName: [firstName, lastName].filter(Boolean).join(' '),
        firstName,
        lastName,
        email,
        emailVerified: !!emailVerified,
        _json: {
          sub: userId,
          email,
          email_verified: emailVerified,
          is_private_email: isPrivateEmail,
        },
      };
      
      // Create a standardized token object
      const standardizedToken: OAuthToken = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: params.expires_in || 3600,
        refresh_token: refreshToken,
        id_token: params.id_token,
        issued_at: new Date().toISOString(),
        expires_at: params.expires_in 
          ? Math.floor(Date.now() / 1000) + params.expires_in 
          : undefined,
      };
      
      this.logger.debug('Successfully validated Apple authentication');
      
      // Return the user profile and token information
      return done(null, standardizedProfile, standardizedToken);
    } catch (error) {
      this.logger.error('Apple authentication validation failed', error);
      return done(error, false);
    }
  }
  
  /**
   * Verifies an Apple ID token by validating its signature and claims.
   * 
   * This method fetches Apple's public keys, verifies the token's signature,
   * and validates the token's claims according to Apple's requirements.
   * 
   * @param idToken - The ID token to verify
   * @returns The decoded token payload
   * @throws Error if the token is invalid
   */
  private async verifyAppleIdToken(idToken: string): Promise<AppleJwtPayload> {
    try {
      // Decode the token without verification to get the header
      const decodedToken = jwt.decode(idToken, { complete: true });
      if (!decodedToken || typeof decodedToken === 'string') {
        throw new Error('Invalid ID token format');
      }
      
      // Get the key ID from the token header
      const kid = decodedToken.header.kid;
      if (!kid) {
        throw new Error('No key ID found in token header');
      }
      
      // Fetch Apple's public keys
      const publicKey = await this.getApplePublicKey(kid);
      
      // Verify the token
      const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
      const verifiedToken = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        audience: clientId,
        issuer: 'https://appleid.apple.com',
      }) as AppleJwtPayload;
      
      // Additional validation
      const currentTime = Math.floor(Date.now() / 1000);
      if (verifiedToken.exp < currentTime) {
        throw new Error('ID token has expired');
      }
      
      return verifiedToken;
    } catch (error) {
      this.logger.error('Apple ID token verification failed', error);
      throw new Error(`Failed to verify Apple ID token: ${error.message}`);
    }
  }
  
  /**
   * Fetches and returns the Apple public key for a given key ID.
   * 
   * @param kid - The key ID to fetch
   * @returns The public key in PEM format
   * @throws Error if the key cannot be fetched or found
   */
  private async getApplePublicKey(kid: string): Promise<string> {
    try {
      // Fetch Apple's public keys
      const response = await fetch(this.APPLE_PUBLIC_KEYS_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch Apple public keys: ${response.statusText}`);
      }
      
      const keysData = await response.json();
      
      // Find the key with the matching key ID
      const key = keysData.keys.find((k: any) => k.kid === kid);
      if (!key) {
        throw new Error(`No matching key found for kid: ${kid}`);
      }
      
      // Convert the JWK to a PEM format public key
      return this.jwkToPem(key);
    } catch (error) {
      this.logger.error('Failed to get Apple public key', error);
      throw new Error(`Failed to get Apple public key: ${error.message}`);
    }
  }
  
  /**
   * Converts a JWK (JSON Web Key) to a PEM format public key.
   * 
   * @param jwk - The JWK object
   * @returns The public key in PEM format
   */
  private jwkToPem(jwk: any): string {
    // Decode the base64 URL encoded modulus and exponent
    const n = Buffer.from(jwk.n, 'base64url');
    const e = Buffer.from(jwk.e, 'base64url');
    
    // Create an RSA public key
    const publicKey = crypto.createPublicKey({
      key: {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
      },
      format: 'jwk',
    });
    
    // Export the key to PEM format
    return publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }
  
  /**
   * Generates a client secret for Apple OAuth authentication.
   * 
   * Apple requires a JWT token signed with the developer's private key
   * as the client secret for server-to-server authentication.
   * 
   * @param options - Options for generating the client secret
   * @returns The generated client secret
   */
  private static generateClientSecret(options: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    expiresIn?: number;
  }): string {
    const { clientId, teamId, keyId, privateKey, expiresIn = 15777000 } = options;
    
    // Ensure the private key is in the correct format
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // Create the JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: teamId,
      iat: now,
      exp: now + (expiresIn || 15777000), // Default to 6 months
      aud: 'https://appleid.apple.com',
      sub: clientId,
    };
    
    // Sign the JWT
    return jwt.sign(payload, formattedPrivateKey, {
      algorithm: 'ES256',
      keyid: keyId,
    });
  }
  
  /**
   * Gets the provider type.
   * 
   * @returns The provider type ('apple')
   */
  getProviderType(): OAuthProviderType {
    return 'apple';
  }
}