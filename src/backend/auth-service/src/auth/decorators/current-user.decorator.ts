import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '@austa/interfaces/auth';

/**
 * Custom decorator to extract the current authenticated user from the request object.
 * This decorator simplifies access to user data in controller methods.
 * 
 * The user object must be attached to the request by an authentication middleware
 * or guard (typically JwtAuthGuard) before this decorator can access it.
 *
 * @example
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
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
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Enhanced error handling for missing user objects
    if (!user) {
      throw new UnauthorizedException('User not authenticated. Make sure to apply JwtAuthGuard before using @CurrentUser().');
    }
    
    // If data is provided, return the specified property
    // Otherwise return the entire user object
    if (data) {
      if (user[data] === undefined) {
        throw new UnauthorizedException(`User property '${data}' not found. Check if the property exists on the AuthenticatedUser object.`);
      }
      return user[data];
    }
    
    return user;
  },
);