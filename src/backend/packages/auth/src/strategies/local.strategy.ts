import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ConfigService } from '@nestjs/config';

// Import from @austa/interfaces for shared types
import { IUserCredentials } from '@austa/interfaces/auth';
import { IUser } from '@austa/interfaces/user';

// Import service interfaces
import { IAuthService } from '../interfaces/services.interface';

// Import from @austa/errors for standardized error handling
import { 
  InvalidCredentialsError, 
  MissingParameterError,
  ServiceUnavailableError
} from '@austa/errors';

/**
 * LocalStrategy for Passport.js that authenticates users via username (email) and password
 * 
 * This strategy is used for the standard username/password authentication flow
 * and integrates with the AuthService for credential validation.
 * 
 * Features:
 * - Uses email as the username field for authentication
 * - Provides detailed error messages for authentication failures
 * - Integrates with structured logging for better observability
 * - Implements standardized error handling with @austa/errors
 * - Supports environment-specific error detail levels
 * 
 * @example
 * // In your auth module:
 * 
 * @Module({
 *   imports: [PassportModule],
 *   providers: [LocalStrategy],
 * })
 * export class AuthModule {}
 * 
 * // In your auth controller:
 * 
 * @Post('login')
 * @UseGuards(AuthGuard('local'))
 * async login(@Request() req) {
 *   return this.authService.login(req.user);
 * }
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  /**
   * Creates an instance of the LocalStrategy
   * 
   * @param authService - The authentication service for validating credentials
   * @param configService - The configuration service for accessing environment variables
   */
  constructor(
    private readonly authService: IAuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: false,
    });

    this.logger.log('LocalStrategy initialized');
  }

  /**
   * Validates user credentials and returns the authenticated user
   * 
   * @param email - The user's email address
   * @param password - The user's password
   * @returns The authenticated user object
   * @throws InvalidCredentialsError if credentials are invalid
   * @throws ServiceUnavailableError if authentication service is unavailable
   */
  async validate(email: string, password: string): Promise<IUser> {
    this.logger.debug(`Attempting to authenticate user: ${email}`, {
      authMethod: 'local',
      email: email
    });

    // Validate required parameters
    if (!email) {
      this.logger.warn('Authentication attempt with missing email');
      throw new MissingParameterError('Email is required for authentication', {
        paramName: 'email',
        location: 'body'
      });
    }

    if (!password) {
      this.logger.warn(`Authentication attempt for ${email} with missing password`);
      throw new MissingParameterError('Password is required for authentication', {
        paramName: 'password',
        location: 'body'
      });
    }

    try {
      // Create credentials object conforming to the interface
      const credentials: IUserCredentials = { email, password };

      // Validate credentials using the auth service
      const user = await this.authService.validateCredentials(credentials.email, credentials.password);

      if (!user) {
        this.logger.warn(`Failed authentication attempt for user: ${email}`, {
          authMethod: 'local',
          email: email,
          reason: 'invalid_credentials'
        });
        throw new InvalidCredentialsError('Invalid email or password', {
          attemptedEmail: email,
          // Don't include password in logs for security reasons
        });
      }

      this.logger.log(`User authenticated successfully: ${email}`, {
        authMethod: 'local',
        userId: user.id,
        email: user.email
      });
      return user;
    } catch (error) {
      // If the error is already one of our application errors, rethrow it
      if (error instanceof InvalidCredentialsError || error instanceof MissingParameterError) {
        throw error;
      }

      // Otherwise, log the error and throw a standardized error
      this.logger.error(
        `Authentication error for ${email}: ${error.message}`,
        {
          authMethod: 'local',
          email: email,
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack
        }
      );

      // Determine if this is a service issue or invalid credentials
      if (error.name === 'ServiceUnavailableError' || error.message.includes('service')) {
        throw new ServiceUnavailableError('Authentication service is currently unavailable', {
          originalError: error.message,
          retryable: true,
          authMethod: 'local'
        });
      }

      // Default to invalid credentials for security (don't expose internal errors)
      throw new InvalidCredentialsError('Invalid email or password', {
        attemptedEmail: email,
        authMethod: 'local',
        originalError: this.configService.get<string>('NODE_ENV') === 'development' 
          ? error.message 
          : undefined,
      });
    }
  }
}