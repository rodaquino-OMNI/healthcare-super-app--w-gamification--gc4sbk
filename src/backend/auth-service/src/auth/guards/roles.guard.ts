import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

// Use standardized TypeScript path aliases for imports
import { ROLES_KEY } from '@app/auth/decorators/roles.decorator';
import { AuthenticatedUser } from '@app/auth/interfaces/user-auth.interfaces';
import { RoleName, JourneyType } from '@app/auth/interfaces/role.interfaces';
import { RolesService } from '@app/auth/roles/roles.service';

// Integration with @austa/interfaces for shared role schemas
import { AccessDeniedError } from '@austa/interfaces/common/errors';
import { LoggerService } from '@austa/logging';

/**
 * Guard that enforces role-based access control for protected routes.
 * 
 * This guard checks if the authenticated user has any of the roles required
 * by the route handler. It supports both global roles and journey-specific roles.
 * 
 * @example
 * // Apply to a single route
 * @Roles('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('users')
 * getUsers() { ... }
 * 
 * @example
 * // Apply to all routes in a controller
 * @Roles('health:admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Controller('health')
 * export class HealthController { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
    private logger: LoggerService,
  ) {}

  /**
   * Determines if the current request is allowed to proceed based on the user's roles.
   * 
   * @param context - The execution context of the current request
   * @returns A boolean or Promise<boolean> indicating if the request is authorized
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Extract required roles from handler and controller metadata
    const requiredRoles = this.getRequiredRoles(context);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug('No roles required for this route, access granted');
      return true;
    }

    // Get the authenticated user from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // If no user is found, deny access
    if (!user) {
      this.logger.warn('Access denied: No authenticated user found');
      throw new ForbiddenException(
        new AccessDeniedError(
          'Access denied: Authentication required',
          'AUTHENTICATION_REQUIRED',
          { requiredRoles }
        )
      );
    }

    // Check if the user has any of the required roles
    return this.checkUserRoles(user, requiredRoles, context);
  }

  /**
   * Extracts required roles from both the handler and controller metadata.
   * Combines both sets of roles to determine the final requirements.
   * 
   * @param context - The execution context of the current request
   * @returns An array of required role names
   */
  private getRequiredRoles(context: ExecutionContext): RoleName[] {
    // Get roles from the handler metadata (method level)
    const handlerRoles = this.reflector.get<RoleName[]>(
      ROLES_KEY,
      context.getHandler(),
    ) || [];

    // Get roles from the controller metadata (class level)
    const controllerRoles = this.reflector.get<RoleName[]>(
      ROLES_KEY,
      context.getClass(),
    ) || [];

    // Combine both sets of roles
    const requiredRoles = [...new Set([...handlerRoles, ...controllerRoles])];
    
    this.logger.debug('Required roles for route', { requiredRoles });
    return requiredRoles;
  }

  /**
   * Checks if the user has any of the required roles.
   * Supports both global roles and journey-specific roles.
   * 
   * @param user - The authenticated user
   * @param requiredRoles - Array of required role names
   * @param context - The execution context of the current request
   * @returns A boolean or Promise<boolean> indicating if the user has the required roles
   */
  private async checkUserRoles(
    user: AuthenticatedUser,
    requiredRoles: RoleName[],
    context: ExecutionContext,
  ): Promise<boolean> {
    try {
      // Extract journey from request path or headers for journey-specific role checking
      const journey = this.extractJourneyFromRequest(context);
      
      // Check if user has any of the required roles
      const hasRole = await this.rolesService.hasAnyRole(user.id, requiredRoles, journey);
      
      if (hasRole) {
        this.logger.debug('Access granted: User has required role', { 
          userId: user.id, 
          requiredRoles,
          journey,
        });
        return true;
      }
      
      // If user doesn't have any required roles, deny access
      this.logger.warn('Access denied: User lacks required roles', { 
        userId: user.id, 
        userRoles: user.roles?.map(r => r.name) || [], 
        requiredRoles,
        journey,
      });
      
      throw new ForbiddenException(
        new AccessDeniedError(
          'Access denied: Insufficient permissions',
          'INSUFFICIENT_PERMISSIONS',
          { 
            requiredRoles,
            journey,
          }
        )
      );
    } catch (error) {
      // If error is already a ForbiddenException, rethrow it
      if (error instanceof ForbiddenException) {
        throw error;
      }
      
      // Otherwise, log the error and throw a generic ForbiddenException
      this.logger.error('Error checking user roles', { 
        error: error.message, 
        stack: error.stack,
        userId: user.id,
        requiredRoles,
      });
      
      throw new ForbiddenException(
        new AccessDeniedError(
          'Access denied: Error checking permissions',
          'PERMISSION_CHECK_ERROR',
          { error: error.message }
        )
      );
    }
  }

  /**
   * Extracts the journey identifier from the request.
   * This is used for journey-specific role checking.
   * 
   * @param context - The execution context of the current request
   * @returns The journey identifier or undefined if not applicable
   */
  private extractJourneyFromRequest(context: ExecutionContext): JourneyType | undefined {
    const request = context.switchToHttp().getRequest();
    
    // Try to extract journey from request path
    const path = request.route?.path || '';
    
    // Check for journey identifiers in the path
    if (path.includes('/health/')) return 'health';
    if (path.includes('/care/')) return 'care';
    if (path.includes('/plan/')) return 'plan';
    
    // Check for journey header
    const journeyHeader = request.headers['x-journey'];
    if (journeyHeader && ['health', 'care', 'plan'].includes(journeyHeader)) {
      return journeyHeader as JourneyType;
    }
    
    // No journey identified, will check global roles only
    return undefined;
  }
}