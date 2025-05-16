import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import axios from 'axios';
import * as crypto from 'crypto';
import { AuthService } from '../../auth.service';
import { OAuthProfile, FacebookOAuthConfig } from './interfaces';

/**
 * Facebook OAuth provider implementation for the AUSTA SuperApp.
 * Handles Facebook-specific authentication flow, token validation, and profile normalization.
 * 
 * This provider extends the PassportStrategy class and configures it with Facebook-specific
 * settings. It extracts standardized user profile information from Facebook's graph API responses
 * and validates Facebook access tokens with improved security checks.
 * 
 * Implements OAuth 2.0 security best practices including:
 * - Token validation with Facebook's Graph API
 * - CSRF protection with state parameter
 * - App secret proof for enhanced security
 * - Minimal scope access
 * - Comprehensive error handling
 * 
 * @example
 * ```typescript
 * // In your auth module
 * @Module({
 *   providers: [FacebookProvider],
 * })
 * export class AuthModule {}
 * 
 * // In your controller
 * @Controller('auth')
 * export class AuthController {
 *   @Get('facebook')
 *   @UseGuards(AuthGuard('facebook'))
 *   async facebookAuth(@Req() req) {
 *     // Generate and store state parameter for CSRF protection
 *     req.session.oauthState = crypto.randomBytes(32).toString('hex');
 *     return { state: req.session.oauthState };
 *   }
 * 
 *   @Get('facebook/callback')
 *   @UseGuards(AuthGuard('facebook'))
 *   async facebookAuthCallback(@Req() req, @Query('state') state: string) {
 *     // Verify state parameter to prevent CSRF attacks
 *     if (state !== req.session.oauthState) {
 *       throw new UnauthorizedException('Invalid OAuth state');
 *     }
 *     // Clear the state after use
 *     delete req.session.oauthState;
 *     return this.authService.login(req.user);
 *   }
 * }
 * ```
 */
@Injectable()
export class FacebookProvider extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookProvider.name);

  /**
   * Creates a new FacebookProvider instance.
   * 
   * @param configService - The NestJS ConfigService for retrieving environment variables
   * @param authService - The AuthService for validating and creating users
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL'),
      profileFields: ['id', 'displayName', 'name', 'emails', 'photos', 'gender'],
      scope: ['email', 'public_profile'], // Minimal scope for authentication
      graphAPIVersion: 'v18.0', // Using the latest stable version
      enableProof: true, // Enhances security by requiring app secret proof
      // State parameter is handled in the controller for CSRF protection
      passReqToCallback: true, // Pass request to callback for state validation
      authType: 'reauthenticate', // Force re-authentication for better security
      display: 'popup', // Use popup display for better UX
    } as FacebookOAuthConfig);
  }

  /**
   * Validates the Facebook profile and creates or retrieves a user.
   * 
   * This method is called by Passport.js after a successful Facebook authentication.
   * It validates the access token, normalizes the profile data, and creates or retrieves
   * a user from the database.
   * 
   * @param req - The request object (if passReqToCallback is true)
   * @param accessToken - The Facebook access token
   * @param refreshToken - The Facebook refresh token (not typically provided by Facebook)
   * @param profile - The Facebook profile data
   * @param done - The Passport.js callback function
   */
  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    try {
      this.logger.debug(`Validating Facebook profile: ${profile.id}`);
      
      // Validate the Facebook access token with improved security checks
      const isValidToken = await this.validateFacebookToken(accessToken, profile.id);
      if (!isValidToken) {
        this.logger.warn(`Invalid Facebook token for profile: ${profile.id}`);
        return done(new Error('Invalid Facebook token'), null);
      }

      // Map the Facebook profile to our standardized OAuthProfile format
      const normalizedProfile = this.mapFacebookProfile(profile);
      
      // Validate or create the user in our system
      const user = await this.authService.validateOAuthUser(normalizedProfile);
      
      if (!user) {
        this.logger.warn(`Failed to validate or create user for Facebook profile: ${profile.id}`);
        return done(new Error('Failed to validate or create user'), null);
      }
      
      // Add additional security information to the user object
      const secureUser = {
        ...user,
        oauthProvider: 'facebook',
        oauthId: profile.id,
        // Don't include the access token in the user object for security reasons
        // It should be stored securely and separately if needed
      };
      
      done(null, secureUser);
    } catch (error) {
      this.logger.error(`Error validating Facebook profile: ${error.message}`, error.stack);
      done(error, null);
    }
  }

  /**
   * Validates a Facebook access token by calling the Facebook Graph API.
   * 
   * This method enhances security by verifying that the token is valid and belongs to the
   * expected user. It also checks that the token was issued for our application.
   * 
   * @param accessToken - The Facebook access token to validate
   * @param userId - The Facebook user ID to validate against
   * @returns A boolean indicating whether the token is valid
   */
  private async validateFacebookToken(accessToken: string, userId: string): Promise<boolean> {
    try {
      const appId = this.configService.get<string>('FACEBOOK_APP_ID');
      const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
      
      // Generate app secret proof for enhanced security
      const appSecretProof = crypto
        .createHmac('sha256', appSecret)
        .update(accessToken)
        .digest('hex');
      
      // Call the Facebook Graph API to debug the token with app secret proof
      const response = await axios.get(
        `https://graph.facebook.com/debug_token?` +
        `input_token=${accessToken}&` +
        `access_token=${appId}|${appSecret}&` +
        `appsecret_proof=${appSecretProof}`
      );
      
      const data = response.data.data;
      
      // Verify that the token is valid, not expired, and issued for our app and the correct user
      // Also check the scopes to ensure they match what we expect
      return (
        data.is_valid &&
        !data.expired &&
        data.app_id === appId &&
        data.user_id === userId &&
        // Verify the token has the required scopes
        data.scopes?.includes('email') &&
        data.scopes?.includes('public_profile')
      );
    } catch (error) {
      this.logger.error(`Error validating Facebook token: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Maps a Facebook profile to our standardized OAuthProfile format.
   * 
   * This method extracts the relevant information from the Facebook profile and
   * normalizes it to our standard format for consistent handling across providers.
   * 
   * @param profile - The Facebook profile data
   * @returns A normalized OAuthProfile object
   */
  private mapFacebookProfile(profile: any): OAuthProfile {
    return {
      id: profile.id,
      provider: 'facebook',
      displayName: profile.displayName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      middleName: profile.name?.middleName,
      email: profile.emails?.[0]?.value,
      emailVerified: Boolean(profile.emails?.[0]?.value),
      picture: profile.photos?.[0]?.value,
      gender: profile.gender,
      locale: profile._json?.locale,
      timezone: profile._json?.timezone,
      _raw: profile._raw,
      _json: profile._json,
    };
  }
}