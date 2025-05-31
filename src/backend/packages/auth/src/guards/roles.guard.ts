import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InsufficientPermissionsError } from '@austa/errors';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ERROR_CODES } from '../constants';

/**
 * Guard that implements role-based access control for protected endpoints.
 * 
 * This guard works with the @Roles decorator to restrict access to routes based on user roles.
 * It supports both core roles (like 'admin', 'user') and journey-specific roles
 * (like 'health:viewer', 'care:provider', 'plan:manager').
 * 
 * @example
 * // Apply to a specific route
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin-only')
 * getAdminData() { ... }
 * 
 * @example
 * // Apply to an entire controller
 * @Roles('health:admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Controller('health/admin')
 * export class HealthAdminController { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Creates a new instance of RolesGuard.
   * 
   * @param reflector - NestJS Reflector for accessing route metadata
   * @param configService - NestJS ConfigService for accessing environment configuration
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Determines if the current user has permission to access the route.
   * 
   * @param context - ExecutionContext containing the request and user information
   * @returns A boolean indicating if the user has access to the route
   * @throws InsufficientPermissionsError if the user lacks the required roles
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the roles required for this route from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Check if we're in development mode with role checking disabled
    const bypassRolesInDev = this.configService.get<boolean>('AUTH_BYPASS_ROLES_IN_DEV', false);
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
    if (isDevelopment && bypassRolesInDev) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is present, deny access
    if (!user) {
      throw new InsufficientPermissionsError(
        'Authentication required to access this resource',
        ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        {
          requiredRoles,
          resource: this.getResourceFromContext(context),
        }
      );
    }

    // Check if user has any of the required roles
    const hasRequiredRole = this.matchRoles(requiredRoles, user.roles || []);
    
    if (!hasRequiredRole) {
      throw new InsufficientPermissionsError(
        'You do not have permission to access this resource',
        ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        {
          requiredRoles,
          userRoles: user.roles,
          resource: this.getResourceFromContext(context),
        }
      );
    }

    return true;
  }

  /**
   * Checks if the user has any of the required roles.
   * Supports both exact role matching and journey-specific role matching.
   * 
   * @param requiredRoles - Array of roles required for access
   * @param userRoles - Array of roles the user possesses
   * @returns A boolean indicating if the user has any of the required roles
   */
  private matchRoles(requiredRoles: string[], userRoles: string[]): boolean {
    // If user has no roles, they can't match any required roles
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Special case: if user has 'super_admin' role, they have access to everything
    if (userRoles.includes('super_admin')) {
      return true;
    }

    // Check each required role
    return requiredRoles.some(requiredRole => {
      // Direct role match
      if (userRoles.includes(requiredRole)) {
        return true;
      }

      // Journey-specific role matching
      // Format: 'journey:role' (e.g., 'health:admin')
      if (requiredRole.includes(':')) {
        const [requiredJourney, requiredJourneyRole] = requiredRole.split(':');
        
        // Check if user has a matching journey role
        // or if they have the journey admin role
        return userRoles.some(userRole => {
          if (userRole.includes(':')) {
            const [userJourney, userJourneyRole] = userRole.split(':');
            
            // Exact journey role match
            if (userJourney === requiredJourney && userJourneyRole === requiredJourneyRole) {
              return true;
            }
            
            // Journey admin match (e.g., 'health:admin' has access to all health resources)
            if (userJourney === requiredJourney && userJourneyRole === 'admin') {
              return true;
            }
          }
          
          return false;
        });
      }
      
      return false;
    });
  }

  /**
   * Extracts the resource name from the execution context for better error messages.
   * 
   * @param context - The execution context of the current request
   * @returns A string representing the resource being accessed
   */
  private getResourceFromContext(context: ExecutionContext): string {
    const handler = context.getHandler();
    const controller = context.getClass();
    
    // Try to get a meaningful resource name from the controller and handler
    const controllerName = controller.name.replace('Controller', '');
    const handlerName = handler.name;
    
    return `${controllerName}.${handlerName}`;
  }
}