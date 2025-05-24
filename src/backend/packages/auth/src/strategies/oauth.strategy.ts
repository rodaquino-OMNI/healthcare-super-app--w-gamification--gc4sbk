import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from @austa/interfaces for shared schemas
import { IOAuthProfile, IOAuthTokens } from '@austa/interfaces/auth';
import { AuthenticationError } from '@austa/errors';

/**
 * Base class for OAuth 2.0 authentication strategies.
 * This serves as a foundation for implementing specific OAuth provider strategies
 * such as Google, Facebook, and Apple for the AUSTA SuperApp.
 * 
 * Extending classes should implement provider-specific configurations and
 * validation logic while leveraging this common base.
 * 
 * @example
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
 *       'google',
 *       new GoogleStrategy(
 *         {
 *           clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
 *           clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
 *           callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
 *           scope: ['email', 'profile']
 *         },
 *         async (accessToken, refreshToken, profile, done) => {
 *           try {
 *             // Normalize the profile data
 *             const normalizedProfile = this.normalizeProfile({
 *               provider: 'google',
 *               providerId: profile.id,
 *               email: profile.emails[0].value,
 *               name: profile.displayName,
 *               firstName: profile.name?.givenName,
 *               lastName: profile.name?.familyName,
 *               picture: profile.photos?.[0]?.value
 *             });
 *             
 *             // Validate the user with the normalized profile
 *             const user = await authService.validateOAuthUser(normalizedProfile);
 *             done(null, user);
 *           } catch (error) {
 *             // Handle errors with standardized error structure
 *             const authError = new AuthenticationError(
 *               'OAuth authentication failed',
 *               { provider: 'google', originalError: error }
 *             );
 *             done(authError, false);
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
  private readonly logger = new Logger(OAuthStrategy.name);

  /**
   * Initializes the OAuth strategy.
   * 
   * @param name - The name of the OAuth strategy (e.g., 'google', 'facebook', 'apple')
   * @param strategy - The OAuth strategy instance to be used with Passport
   */
  constructor(name: string, strategy: any) {
    super(strategy, name);
    this.logger.log(`Initialized ${name} OAuth strategy`);
  }

  /**
   * Normalizes OAuth profile data to a consistent format across providers.
   * This ensures that regardless of the OAuth provider, the profile data
   * follows a standardized structure for the application.
   * 
   * @param profile - The raw profile data from the OAuth provider
   * @returns A normalized profile object with consistent property names
   */
  protected normalizeProfile(profile: Partial<IOAuthProfile>): IOAuthProfile {
    // Ensure all required fields are present
    if (!profile.provider) {
      throw new AuthenticationError('Missing provider in OAuth profile');
    }
    
    if (!profile.providerId) {
      throw new AuthenticationError('Missing providerId in OAuth profile');
    }
    
    if (!profile.email) {
      throw new AuthenticationError('Missing email in OAuth profile');
    }

    // Create a normalized profile with default values for optional fields
    const normalizedProfile: IOAuthProfile = {
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      picture: profile.picture || '',
      locale: profile.locale || 'en',
      isVerified: profile.isVerified || false
    };

    this.logger.debug(
      `Normalized OAuth profile for ${normalizedProfile.provider}:${normalizedProfile.providerId}`,
      { provider: normalizedProfile.provider }
    );

    return normalizedProfile;
  }

  /**
   * Normalizes OAuth tokens to a consistent format across providers.
   * 
   * @param tokens - The raw token data from the OAuth provider
   * @returns A normalized tokens object with consistent property names
   */
  protected normalizeTokens(tokens: Partial<IOAuthTokens>): IOAuthTokens {
    // Create a normalized tokens object with default values for optional fields
    const normalizedTokens: IOAuthTokens = {
      accessToken: tokens.accessToken || '',
      refreshToken: tokens.refreshToken || '',
      idToken: tokens.idToken || '',
      expiresIn: tokens.expiresIn || 3600,
      tokenType: tokens.tokenType || 'Bearer'
    };

    return normalizedTokens;
  }
}