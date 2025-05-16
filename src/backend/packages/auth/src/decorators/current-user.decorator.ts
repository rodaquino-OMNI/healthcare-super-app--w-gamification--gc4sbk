import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@austa/interfaces/auth';
import { AppException, ErrorType } from '@austa/errors';

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
 * // Get a nested property from the user object
 * @Get('user-name')
 * @UseGuards(JwtAuthGuard)
 * getUserName(@CurrentUser('profile.firstName') firstName: string) {
 *   return { firstName };
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
    
    // Throw an AppException if no user is found in the request
    if (!user) {
      throw new AppException(
        ErrorType.VALIDATION,
        'User not found in request. Ensure JwtAuthGuard is applied to this route.',
        'AUTH_001'
      );
    }
    
    // If data is provided, return the specified property
    if (data) {
      // Handle nested properties with dot notation (e.g., 'profile.firstName')
      if (data.includes('.')) {
        const parts = data.split('.');
        let value = user;
        
        for (const part of parts) {
          if (value === undefined || value === null) {
            throw new AppException(
              ErrorType.VALIDATION,
              `Property not found in user object: ${data}`,
              'AUTH_002'
            );
          }
          value = value[part];
        }
        
        if (value === undefined) {
          throw new AppException(
            ErrorType.VALIDATION,
            `Property not found in user object: ${data}`,
            'AUTH_002'
          );
        }
        
        return value;
      } else {
        // Handle direct properties
        const value = user[data];
        
        // Throw an AppException if the requested property doesn't exist
        if (value === undefined) {
          throw new AppException(
            ErrorType.VALIDATION,
            `Property not found in user object: ${data}`,
            'AUTH_002'
          );
        }
        
        return value;
      }
    }
    
    // Otherwise return the entire user object
    return user;
  },
);