import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@nestjs/common';
import { AuthErrorCode } from '../constants';

/**
 * LocalAuthGuard extends Passport's AuthGuard('local') to implement username/password 
 * authentication for login flows across the AUSTA SuperApp.
 * 
 * This guard is used to protect login endpoints and validates user credentials through 
 * the Passport local strategy pipeline, which ultimately uses the AuthService to verify 
 * the credentials against the database.
 * 
 * @example
 * // In a controller file
 * 
 * // For a standard login endpoint
 * @Post('login')
 * @UseGuards(LocalAuthGuard)
 * async login(@Request() req) {
 *   // The user is already validated by the guard at this point
 *   return this.authService.generateTokens(req.user);
 * }
 * 
 * // For a journey-specific login endpoint
 * @Post('health/login')
 * @UseGuards(LocalAuthGuard)
 * async healthJourneyLogin(@Request() req) {
 *   // Add journey-specific context to the authentication
 *   return this.authService.generateTokensWithJourneyContext(req.user, 'health');
 * }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  /**
   * Handles the authentication process and provides enhanced error handling.
   * 
   * @param context - The execution context of the request
   * @returns A boolean indicating if the authentication was successful
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt authentication through the Passport local strategy
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      
      // Provide more descriptive error messages based on the error type
      if (error.message === 'Unauthorized') {
        throw new UnauthorizedException({
          message: 'Invalid email or password',
          errorCode: AuthErrorCode.INVALID_CREDENTIALS
        });
      }
      
      // Re-throw the original error if it's not a standard unauthorized error
      throw error;
    }
  }

  /**
   * Handles the authentication result and attaches the user to the request.
   * 
   * @param err - Any error that occurred during authentication
   * @param user - The authenticated user or false if authentication failed
   * @param info - Additional info from the strategy
   * @param context - The execution context of the request
   * @returns The authenticated user
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext): any {
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${err?.message || 'No user found'}`);
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        errorCode: AuthErrorCode.INVALID_CREDENTIALS
      });
    }
    
    return user;
  }
}