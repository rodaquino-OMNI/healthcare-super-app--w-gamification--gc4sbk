import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '@austa/logging';
import { ValidationError, InvalidCredentialsError } from '@austa/errors/categories';

/**
 * JWT Authentication Guard for protecting routes that require authentication.
 * 
 * This guard validates JWT tokens in incoming requests before allowing
 * access to protected resources. It extends the Passport AuthGuard
 * and is used across all journeys in the AUSTA SuperApp.
 * 
 * @example
 * // Health Journey: Protect a route that accesses health metrics
 * @UseGuards(JwtAuthGuard)
 * @Get('metrics/daily')
 * getDailyHealthMetrics(@Request() req) {
 *   // The user object is automatically added to the request by the guard
 *   const userId = req.user.id;
 *   return this.healthService.getDailyMetrics(userId);
 * }
 * 
 * @example
 * // Care Journey: Protect an appointment booking endpoint
 * @UseGuards(JwtAuthGuard)
 * @Post('appointments')
 * bookAppointment(@Request() req, @Body() appointmentData: CreateAppointmentDto) {
 *   const userId = req.user.id;
 *   return this.appointmentService.create(userId, appointmentData);
 * }
 * 
 * @example
 * // Plan Journey: Protect a benefits endpoint
 * @UseGuards(JwtAuthGuard)
 * @Get('benefits')
 * getUserBenefits(@Request() req) {
 *   const userId = req.user.id;
 *   return this.planService.getUserBenefits(userId);
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger = logger.createLogger('JwtAuthGuard');
  }

  /**
   * Determines if the current request is allowed to proceed based on JWT authentication.
   * Intercepts authentication errors and transforms them into standardized responses.
   * 
   * @param context - The execution context of the current request
   * @returns A boolean indicating if the request is authenticated
   * @throws ValidationError or other appropriate error from @austa/errors if authentication fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt to authenticate the request using the jwt strategy
      const result = await super.canActivate(context) as boolean;
      
      if (result) {
        const request = context.switchToHttp().getRequest();
        this.logger.debug('Authentication successful', { userId: request.user?.id });
      }
      
      return result;
    } catch (error) {
      // Log the authentication failure
      this.logger.warn('Authentication failed', { error: error.message });
      
      // Transform errors to standardized error types from @austa/errors
      if (error instanceof UnauthorizedException) {
        throw new InvalidCredentialsError('Invalid token or user not found');
      }
      
      // For other errors, maintain the original exception but log it
      this.logger.error('Unexpected authentication error', { 
        error: error.message,
        stack: error.stack
      });
      
      throw error;
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
   * @throws InvalidCredentialsError if authentication fails
   */
  handleRequest(err: Error, user: any, info: any): any {
    // If authentication failed or no user was found, throw a standardized error
    if (err || !user) {
      this.logger.warn('JWT validation failed in handleRequest', { 
        errorMessage: err?.message,
        info: info?.message
      });
      
      throw new InvalidCredentialsError(
        'Invalid token or user not found',
        { context: { info: info?.message } }
      );
    }
    
    // Return the authenticated user
    return user;
  }
}

export { JwtAuthGuard };