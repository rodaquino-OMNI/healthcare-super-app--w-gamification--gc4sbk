import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@austa/interfaces/auth';
import { ValidationError } from '@austa/errors/categories';

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
 * getProfile(@CurrentUser() user: User) {
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
 * // Health Journey: Get user's health profile
 * @Get('health/profile')
 * @UseGuards(JwtAuthGuard)
 * getHealthProfile(@CurrentUser('healthProfile') healthProfile: HealthProfile) {
 *   return healthProfile;
 * }
 * 
 * @example
 * // Care Journey: Get user's care preferences
 * @Get('care/preferences')
 * @UseGuards(JwtAuthGuard)
 * getCarePreferences(@CurrentUser('carePreferences') preferences: CarePreferences) {
 *   return preferences;
 * }
 * 
 * @example
 * // Plan Journey: Get user's insurance plan
 * @Get('plan/details')
 * @UseGuards(JwtAuthGuard)
 * getPlanDetails(@CurrentUser('insurancePlan') plan: InsurancePlan) {
 *   return plan;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;
    
    // Throw a validation error if no user is found in the request
    if (!user) {
      throw new ValidationError(
        'User not found in request. Ensure JwtAuthGuard is applied to this route.',
        'MISSING_USER_CONTEXT'
      );
    }
    
    // If data is provided, return the specified property
    if (data) {
      const value = user[data];
      // Throw a validation error if the requested property doesn't exist
      if (value === undefined) {
        throw new ValidationError(
          `Property '${data}' not found on user object.`,
          'INVALID_USER_PROPERTY'
        );
      }
      return value;
    }
    
    // Otherwise return the entire user object
    return user;
  },
);