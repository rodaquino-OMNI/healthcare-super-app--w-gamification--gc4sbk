import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InsufficientPermissionsError } from '@austa/errors';
import { IUserWithRoles, JourneyType } from '@austa/interfaces/auth';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that implements role-based access control for protected endpoints.
 * Works in conjunction with the @Roles decorator to restrict access based on user roles.
 * 
 * This guard extracts role requirements from route metadata, verifies the user's
 * authentication status, and checks if the user has any of the required roles.
 * 
 * Supports both global roles and journey-specific roles in the format 'journey:role'
 * (e.g., 'health:admin', 'care:provider', 'plan:manager').
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Environment variable that can be set to bypass role checks in development
   * Should NEVER be enabled in production environments
   */
  private readonly bypassRoleChecks = process.env.AUTH_BYPASS_ROLE_CHECKS === 'true';

  /**
   * Creates a new instance of RolesGuard
   * @param reflector NestJS Reflector for accessing route metadata
   */
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user can access the requested route
   * @param context Execution context containing the request
   * @returns Boolean indicating if access is allowed
   * @throws InsufficientPermissionsError if user lacks required roles
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extract required roles from route metadata using the Reflector
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access (endpoint is not protected by @Roles)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the request object from the execution context
    const request = context.switchToHttp().getRequest();
    
    // Get the authenticated user from the request (set by JwtAuthGuard)
    const user = request.user as IUserWithRoles;

    // If no user is present, the request is not authenticated
    if (!user) {
      throw new InsufficientPermissionsError(
        'Authentication required to access this resource',
        {
          requiredRoles,
          endpoint: request.path,
          method: request.method,
        }
      );
    }

    // In development, optionally bypass role checks if environment variable is set
    // This should NEVER be enabled in production environments
    if (this.bypassRoleChecks && process.env.NODE_ENV !== 'production') {
      console.warn(
        `⚠️ WARNING: Role checks bypassed for ${request.method} ${request.path}. ` +
        'This should only be used in development environments.'
      );
      return true;
    }

    // Check if the user has any of the required roles
    const hasRequiredRole = this.matchRoles(requiredRoles, user);

    // If the user doesn't have any required roles, throw an error
    if (!hasRequiredRole) {
      throw new InsufficientPermissionsError(
        'You do not have permission to access this resource',
        {
          userId: user.id,
          requiredRoles,
          userRoles: user.roles?.map(role => role.name) || [],
          endpoint: request.path,
          method: request.method,
        }
      );
    }

    // User has at least one of the required roles, allow access
    return true;
  }

  /**
   * Checks if the user has any of the required roles
   * Supports both global roles and journey-specific roles
   * 
   * @param requiredRoles Array of role names required for access
   * @param user Authenticated user with roles
   * @returns Boolean indicating if the user has any of the required roles
   */
  private matchRoles(requiredRoles: string[], user: IUserWithRoles): boolean {
    // If user has no roles or roles array is empty, they have no permissions
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    // Extract user role names for easier comparison
    const userRoleNames = user.roles.map(role => role.name);
    
    // Check each required role
    for (const requiredRole of requiredRoles) {
      // Direct role match (exact role name)
      if (userRoleNames.includes(requiredRole)) {
        return true;
      }

      // Check for journey-specific role format (e.g., 'health:admin')
      if (requiredRole.includes(':')) {
        const [journeyPrefix, roleSuffix] = requiredRole.split(':');
        
        // Check if this is a valid journey type
        const isValidJourney = Object.values(JourneyType).includes(journeyPrefix as JourneyType);
        
        if (isValidJourney) {
          // Check for journey-specific roles
          // User might have the role with the specific journey prefix
          if (userRoleNames.includes(requiredRole)) {
            return true;
          }
          
          // Check if user has a global admin role that grants access to all journeys
          if (userRoleNames.includes('admin') || userRoleNames.includes('superadmin')) {
            return true;
          }
          
          // Check if user has a journey-specific admin role
          if (userRoleNames.includes(`${journeyPrefix}:admin`)) {
            return true;
          }
        }
      }
    }

    // User doesn't have any of the required roles
    return false;
  }
}