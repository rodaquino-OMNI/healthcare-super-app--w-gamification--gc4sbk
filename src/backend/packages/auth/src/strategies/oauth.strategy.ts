import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthProfileInterface, OAuthTokensInterface } from '@austa/interfaces/auth';
import { ExternalAuthenticationError } from '@austa/errors/categories/external.errors';

/**
 * Base class for OAuth 2.0 authentication strategies in the AUSTA SuperApp.
 * This abstract class standardizes how external OAuth providers (Google, Facebook, Apple)
 * are integrated, handling profile normalization, token validation, and user creation/retrieval.
 * 
 * Extending classes should implement provider-specific configurations and
 * validation logic while leveraging this common base.
 * 
 * Example usage with specific providers:
 * ```typescript
 * // Google OAuth strategy implementation
 * @Injectable()
 * export class GoogleStrategy extends OAuthStrategy {
 *   constructor(
 *     private configService: ConfigService,
 *     private authService: AuthService
 *   ) {
 *     const GoogleStrategy = require('passport-google-oauth20').Strategy;
 *     super(
 *       new GoogleStrategy(
 *         {
 *           clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
 *           clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
 *           callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
 *           scope: ['email', 'profile']
 *         },
 *         async (accessToken, refreshToken, profile, done) => {
 *           try {
 *             // Normalize the profile using the base class method
 *             const normalizedProfile = this.normalizeProfile({
 *               provider: 'google',
 *               providerId: profile.id,
 *               email: profile.emails[0].value,
 *               name: profile.displayName,
 *               firstName: profile.name.givenName,
 *               lastName: profile.name.familyName,
 *               picture: profile.photos[0].value
 *             });
 *             
 *             // Create tokens object using the base class method
 *             const tokens = this.createTokens({
 *               accessToken,
 *               refreshToken,
 *               expiresIn: 3600 // Default expiration time
 *             });
 *             
 *             const user = await authService.validateOAuthUser(normalizedProfile, tokens);
 *             done(null, user);
 *           } catch (error) {
 *             done(this.handleError(error), false);
 *           }
 *         }
 *       )
 *     );
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class OAuthStrategy extends PassportStrategy {
  protected configService: ConfigService;

  /**
   * Initializes the OAuth strategy with the provided strategy and verification function.
   * 
   * @param strategy - The OAuth strategy instance to be used with Passport
   * @param verify - The verification callback function that processes the authenticated user
   */
  constructor(strategy: any, verify: Function) {
    super(strategy, verify);
  }

  /**
   * Normalizes OAuth profile data from different providers into a consistent format.
   * This ensures that regardless of the OAuth provider, the profile data structure
   * remains consistent throughout the application.
   * 
   * @param profile - Raw profile data from the OAuth provider
   * @returns Normalized profile object conforming to OAuthProfileInterface
   */
  protected normalizeProfile(profile: Partial<OAuthProfileInterface>): OAuthProfileInterface {
    // Ensure all required fields are present
    if (!profile.provider || !profile.providerId || !profile.email) {
      throw new ExternalAuthenticationError(
        'Invalid OAuth profile data',
        {
          provider: profile.provider,
          missingFields: [
            ...(!profile.provider ? ['provider'] : []),
            ...(!profile.providerId ? ['providerId'] : []),
            ...(!profile.email ? ['email'] : [])
          ]
        }
      );
    }

    // Return a normalized profile with default values for optional fields
    return {
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      picture: profile.picture || '',
      locale: profile.locale || 'pt-BR', // Default to Portuguese (Brazil)
      metadata: profile.metadata || {}
    };
  }

  /**
   * Creates a standardized tokens object from OAuth provider tokens.
   * 
   * @param tokens - Raw token data from the OAuth provider
   * @returns Normalized tokens object conforming to OAuthTokensInterface
   */
  protected createTokens(tokens: Partial<OAuthTokensInterface>): OAuthTokensInterface {
    if (!tokens.accessToken) {
      throw new ExternalAuthenticationError(
        'Missing access token from OAuth provider',
        { provider: 'oauth' }
      );
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      idToken: tokens.idToken || null,
      expiresIn: tokens.expiresIn || 3600, // Default to 1 hour if not specified
      tokenType: tokens.tokenType || 'Bearer'
    };
  }

  /**
   * Standardizes error handling for OAuth authentication failures.
   * Converts various error types into consistent ExternalAuthenticationError format.
   * 
   * @param error - The original error that occurred during OAuth authentication
   * @returns Standardized ExternalAuthenticationError
   */
  protected handleError(error: any): ExternalAuthenticationError {
    // If it's already our error type, return it directly
    if (error instanceof ExternalAuthenticationError) {
      return error;
    }

    // Convert other error types to our standardized format
    return new ExternalAuthenticationError(
      error.message || 'OAuth authentication failed',
      {
        originalError: error,
        provider: 'oauth',
        statusCode: error.statusCode || error.status || 401
      }
    );
  }
}