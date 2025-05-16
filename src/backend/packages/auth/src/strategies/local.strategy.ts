import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType, ValidationError } from '@austa/errors';
import { AuthService } from '../auth.service';
import { AUTH_ERROR_CODES } from '../constants';
import { AuthenticatedUser } from '@austa/interfaces/auth';

/**
 * LocalStrategy for Passport.js that authenticates users via username (email) and password credentials.
 * 
 * This strategy is used for traditional username/password authentication flows and integrates
 * with the AuthService to validate credentials against the database.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  /**
   * Creates a new instance of the LocalStrategy.
   * 
   * @param authService - The authentication service for validating credentials
   * @param loggerService - The logger service for structured logging
   */
  constructor(
    private readonly authService: AuthService,
    private readonly loggerService: LoggerService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Validates user credentials and returns the authenticated user if valid.
   * 
   * This method is called by Passport.js when a user attempts to authenticate
   * with username (email) and password credentials.
   * 
   * @param email - The user's email address
   * @param password - The user's password
   * @returns The authenticated user object
   * @throws ValidationError if credentials are invalid
   * @throws BaseError for other authentication failures
   */
  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    try {
      this.loggerService.debug(
        'Validating user credentials',
        { email },
        'LocalStrategy',
      );

      // Validate input
      if (!email || !password) {
        this.loggerService.warn(
          'Authentication failed: Missing credentials',
          { email: email || 'missing' },
          'LocalStrategy',
        );
        throw new ValidationError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Email and password are required',
        });
      }

      // Authenticate user with AuthService
      const authResult = await this.authService.login(email, password);
      
      if (!authResult || !authResult.user) {
        this.loggerService.warn(
          'Authentication failed: Invalid credentials',
          { email },
          'LocalStrategy',
        );
        throw new ValidationError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        });
      }

      this.loggerService.info(
        'User authenticated successfully',
        { userId: authResult.user.id },
        'LocalStrategy',
      );

      // Transform to AuthenticatedUser format
      const authenticatedUser: AuthenticatedUser = {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        roles: authResult.user.roles.map(role => role.name),
        lastAuthenticated: new Date(),
      };

      return authenticatedUser;
    } catch (error) {
      // If it's already a BaseError, rethrow it
      if (error instanceof BaseError) {
        throw error;
      }

      // Otherwise, wrap in a BaseError
      this.loggerService.error(
        'Authentication failed with unexpected error',
        { email, error: error.message, stack: error.stack },
        'LocalStrategy',
      );
      throw new BaseError({
        type: ErrorType.TECHNICAL,
        code: AUTH_ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'Failed to authenticate user',
        cause: error,
      });
    }
  }
}