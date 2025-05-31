import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { IUser } from '@austa/interfaces/auth';

/**
 * Custom decorator to extract the current authenticated user from the request object.
 * This decorator simplifies access to user data in controller methods across all journeys.
 * 
 * The user object must be attached to the request by an authentication middleware
 * or guard (typically JwtAuthGuard) before this decorator can access it.
 *
 * @example
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: IUser) {
 *   return user;
 * }
 *
 * @example
 * // Get a specific property from the user object
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 * 
 * @example
 * // Journey-specific usage - Health Journey
 * @Get('health/metrics')
 * @UseGuards(JwtAuthGuard)
 * getHealthMetrics(@CurrentUser() user: IUser) {
 *   return this.healthService.getMetricsForUser(user.id);
 * }
 * 
 * @example
 * // Journey-specific usage - Care Journey
 * @Post('care/appointments')
 * @UseGuards(JwtAuthGuard)
 * bookAppointment(
 *   @Body() appointmentData: CreateAppointmentDto,
 *   @CurrentUser() user: IUser
 * ) {
 *   return this.careService.bookAppointment(appointmentData, user);
 * }
 * 
 * @example
 * // Journey-specific usage - Plan Journey
 * @Get('plan/benefits')
 * @UseGuards(JwtAuthGuard)
 * getPlanBenefits(@CurrentUser('planId') planId: string) {
 *   return this.planService.getBenefitsForPlan(planId);
 * }
 */
export const CurrentUser = createParamDecorator<string | undefined, ExecutionContext, IUser | any>(
  (data: string | undefined, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      const user = request.user;
      
      // Verify user exists in the request
      if (!user) {
        throw new InternalServerErrorException(
          'User object not found in request. Ensure JwtAuthGuard or equivalent authentication guard is applied.'
        );
      }
      
      // If data is provided, return the specified property
      // Otherwise return the entire user object
      return data ? user?.[data] : user;
    } catch (error) {
      // Re-throw NestJS exceptions as-is
      if (error.name && error.name.includes('Exception')) {
        throw error;
      }
      
      // Wrap other errors in InternalServerErrorException
      throw new InternalServerErrorException(
        `Failed to extract user data: ${error.message}`,
        { cause: error }
      );
    }
  },
);