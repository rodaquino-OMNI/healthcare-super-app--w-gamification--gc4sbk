import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@austa/logging';
import { AuthErrorCode } from '../constants';

/**
 * LocalAuthGuard extends Passport's AuthGuard('local') to implement username/password authentication
 * for login flows across the AUSTA SuperApp.
 * 
 * This guard is used to protect routes that require local authentication strategy (username/password).
 * It enables the local authentication strategy to validate user credentials through the Passport pipeline.
 * 
 * @example
 * // Controller usage example
 * @Post('login')
 * @UseGuards(LocalAuthGuard)
 * async login(@Request() req) {
 *   // The user is automatically added to the request by Passport
 *   return this.authService.login(req.user);
 * }
 * 
 * @example
 * // Module configuration example
 * @Module({
 *   imports: [
 *     PassportModule.register({ defaultStrategy: 'local' }),
 *     // Other imports
 *   ],
 *   providers: [LocalStrategy, LocalAuthGuard],
 *   // Other module configuration
 * })
 * export class AuthModule {}
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  /**
   * Handles the authentication process for local strategy.
   * Overrides the canActivate method to provide better error handling and logging.
   * 
   * @param context - The execution context
   * @returns A boolean indicating if the request can proceed
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt authentication using the parent AuthGuard
      const result = await super.canActivate(context);
      
      // If authentication was successful, return true
      return result as boolean;
    } catch (error) {
      this.logger.error(
        `Authentication failed: ${error.message}`,
        { error, context: context.switchToHttp().getRequest() }
      );
      
      // Throw a more descriptive error message
      throw new UnauthorizedException({
        message: 'Invalid username or password',
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }
  }

  /**
   * Handles the authentication result.
   * This method is called by Passport after the authentication process.
   * 
   * @param err - Any error that occurred during authentication
   * @param user - The authenticated user if successful
   * @param info - Additional info from the strategy
   * @param context - The execution context
   * @returns The authenticated user
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext): any {
    if (err || !user) {
      this.logger.warn(
        'Authentication failed in handleRequest',
        { error: err, info, requestId: context.switchToHttp().getRequest().id }
      );
      
      throw new UnauthorizedException({
        message: info?.message || 'Authentication failed',
        errorCode: AuthErrorCode.AUTHENTICATION_FAILED,
      });
    }
    
    return user;
  }
}