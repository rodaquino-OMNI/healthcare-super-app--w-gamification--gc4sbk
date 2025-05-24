import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseError, ValidationError } from '@austa/errors';
import { LoggerService } from '@austa/logging';

/**
 * JWT Authentication Guard for protecting routes that require authentication.
 * 
 * This guard validates JWT tokens in incoming requests before allowing
 * access to protected resources. It extends the Passport AuthGuard
 * and is used across all journeys in the AUSTA SuperApp.
 * 
 * @example
 * // Use in a controller to protect a route in the Health journey
 * @UseGuards(JwtAuthGuard)
 * @Get('health/metrics')
 * getHealthMetrics(@Request() req) {
 *   return this.healthService.getMetricsForUser(req.user.id);
 * }
 * 
 * @example
 * // Use in a controller to protect a route in the Care journey
 * @UseGuards(JwtAuthGuard)
 * @Get('care/appointments')
 * getAppointments(@Request() req) {
 *   return this.appointmentService.getAppointmentsForUser(req.user.id);
 * }
 * 
 * @example
 * // Use in a controller to protect a route in the Plan journey
 * @UseGuards(JwtAuthGuard)
 * @Get('plan/benefits')
 * getBenefits(@Request() req) {
 *   return this.planService.getBenefitsForUser(req.user.id);
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext('JwtAuthGuard');
  }

  /**
   * Determines if the current request is allowed to proceed based on JWT authentication.
   * Intercepts authentication errors and transforms them into standardized responses.
   * 
   * @param context - The execution context of the current request
   * @returns A boolean indicating if the request is authenticated
   * @throws ValidationError if authentication fails with proper error context
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt to authenticate the request using the jwt strategy
      return await super.canActivate(context) as boolean;
    } catch (error) {
      // Log the authentication failure with appropriate context
      const req = context.switchToHttp().getRequest();
      this.logger.warn(
        `Authentication failed for request to ${req.path}`,
        { 
          path: req.path,
          method: req.method,
          ip: req.ip,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-request-id': req.headers['x-request-id']
          }
        }
      );

      // Transform BaseError errors to maintain proper error context
      if (error instanceof BaseError) {
        throw error;
      }
      
      // For other errors, transform to a standardized ValidationError
      throw new ValidationError({
        message: 'Authentication failed',
        code: 'AUTH_INVALID_TOKEN',
        details: { originalError: error.message }
      });
    }
  }

  /**
   * Handles the result of the authentication process.
   * This method is called after Passport has validated the JWT token.
   * 
   * @param err - Any error that occurred during authentication
   * @param user - The authenticated user if successful
   * @param info - Additional info about the authentication process
   * @returns The authenticated user if successful
   * @throws ValidationError with specific error context if authentication fails
   */
  handleRequest(err: Error, user: any, info: any): any {
    // If authentication failed or no user was found, throw a ValidationError
    if (err || !user) {
      const errorMessage = err?.message || 'Invalid token or user not found';
      const errorCode = 'AUTH_UNAUTHORIZED';
      const errorDetails = { info: info?.message };
      
      this.logger.error(`Authentication error: ${errorMessage}`, { 
        error: err?.message,
        info: info?.message,
        code: errorCode
      });
      
      throw new ValidationError({
        message: errorMessage,
        code: errorCode,
        details: errorDetails
      });
    }
    
    // Return the authenticated user
    return user;
  }
}

export { JwtAuthGuard };