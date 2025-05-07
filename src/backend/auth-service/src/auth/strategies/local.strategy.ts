import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { InvalidCredentialsError, MissingParameterError } from '@austa/errors/categories';
import { AuthService } from '@app/auth/auth.service';

/**
 * Passport strategy for username/password authentication.
 * This strategy validates user credentials during login requests.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: false,
    });
  }

  /**
   * Validates user credentials and returns the authenticated user.
   * @param email User's email address
   * @param password User's password
   * @returns The authenticated user object
   * @throws InvalidCredentialsError if authentication fails
   */
  async validate(email: string, password: string): Promise<any> {
    this.logger.debug(
      `Validating credentials for user: ${email}`,
      {
        context: 'LocalStrategy',
        email,
      }
    );

    // Validate required parameters
    if (!email) {
      this.logger.warn(
        'Authentication attempt with missing email',
        { context: 'LocalStrategy' }
      );
      throw new MissingParameterError('Email is required');
    }

    if (!password) {
      this.logger.warn(
        'Authentication attempt with missing password',
        { 
          context: 'LocalStrategy',
          email,
        }
      );
      throw new MissingParameterError('Password is required');
    }

    // Attempt to validate user credentials
    try {
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        this.logger.warn(
          `Invalid credentials for user: ${email}`,
          { 
            context: 'LocalStrategy',
            email,
          }
        );
        throw new InvalidCredentialsError('Invalid email or password');
      }

      this.logger.debug(
        `User validated successfully: ${email}`,
        { 
          context: 'LocalStrategy',
          email,
          userId: user.id,
        }
      );

      return user;
    } catch (error) {
      // If it's already our custom error, just rethrow it
      if (error instanceof InvalidCredentialsError) {
        throw error;
      }

      // Otherwise, log the error and throw a standardized error
      this.logger.error(
        `Error validating user: ${error.message}`,
        {
          context: 'LocalStrategy',
          email,
          error,
        }
      );

      throw new InvalidCredentialsError('Authentication failed');
    }
  }
}