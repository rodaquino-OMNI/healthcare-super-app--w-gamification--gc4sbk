import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
// Use standardized imports with path aliases
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { PermissionsService } from '@app/auth/permissions/permissions.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CacheService } from '@app/shared/cache/cache.service';
// Import interfaces from @austa/interfaces package
import { Permission } from '@austa/interfaces/auth';

/**
 * Key used to store permissions metadata for route handlers.
 * This is used by the PermissionsGuard to determine if a user has permission to access a route.
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator that assigns required permissions for accessing a route handler or controller.
 * This decorator is used in conjunction with the PermissionsGuard to implement
 * permission-based access control across the AUSTA SuperApp's journey-specific endpoints.
 * 
 * @param permissions - Array of permission strings required for access (if user has ANY of these permissions, access is granted)
 * @returns A method or class decorator that attaches permission metadata
 * 
 * @example
 * // Require 'health:metrics:read' permission to access this endpoint
 * @Permissions('health:metrics:read')
 * @UseGuards(PermissionsGuard)
 * @Get('health-metrics')
 * getHealthMetrics() { ... }
 * 
 * @example
 * // Require 'care:appointment:create' OR 'care:appointment:manage' permissions
 * @Permissions('care:appointment:create', 'care:appointment:manage')
 * @UseGuards(PermissionsGuard)
 * @Post('appointments')
 * createAppointment() { ... }
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Guard that validates if the current user has the required permissions to access protected resources.
 * This guard is applied to route handlers and controllers to enforce permission-based access control.
 * 
 * Permissions follow a hierarchical format: journey:resource:action
 * Examples:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 * 
 * @example
 * // Apply to a specific route handler
 * @UseGuards(PermissionsGuard)
 * @Permissions('health:metrics:read')
 * @Get('health-metrics')
 * getHealthMetrics() { ... }
 * 
 * @example
 * // Apply to all routes in a controller with different permissions
 * @UseGuards(PermissionsGuard)
 * @Controller('health')
 * export class HealthController {
 *   @Permissions('health:metrics:read')
 *   @Get('metrics')
 *   getMetrics() { ... }
 * 
 *   @Permissions('health:goals:create')
 *   @Post('goals')
 *   createGoal() { ... }
 * }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  /**
   * Cache key prefix for storing permission check results
   * @private
   */
  private readonly CACHE_PREFIX = 'permission_check';

  /**
   * Cache TTL in seconds (5 minutes)
   * @private
   */
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    private readonly logger: LoggerService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Determines if the current request can activate the route handler
   * based on the user's permissions.
   * 
   * @param context - The execution context of the current request
   * @returns A boolean or Promise<boolean> or Observable<boolean> indicating if the route can be activated
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Get required permissions from route handler metadata
    const requiredPermissions = this.getRequiredPermissions(context);
    
    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is found, deny access
    if (!user) {
      this.logger.warn(
        `Permission check failed: No authenticated user found`,
        { requiredPermissions, path: request.path, method: request.method },
      );
      throw new AppException(ErrorType.VALIDATION, 'AUTH_003', 'User is not authenticated');
    }

    // Check if user has required permissions
    return this.hasPermissions(user, requiredPermissions, request.path, request.method);
  }

  /**
   * Retrieves the required permissions from the route handler metadata
   * 
   * @param context - The execution context of the current request
   * @returns An array of required permission strings
   * @private
   */
  private getRequiredPermissions(context: ExecutionContext): string[] {
    // Check for permissions on the handler first, then on the class
    return (
      this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getHandler(),
      ) ||
      this.reflector.get<string[]>(
        PERMISSIONS_KEY,
        context.getClass(),
      ) ||
      []
    );
  }

  /**
   * Checks if the user has any of the required permissions
   * 
   * @param user - The authenticated user object
   * @param requiredPermissions - Array of required permission strings
   * @param path - The request path (for logging)
   * @param method - The request method (for logging)
   * @returns A Promise resolving to a boolean indicating if the user has the required permissions
   * @private
   */
  private async hasPermissions(
    user: { id: string; roles: Array<{ id: number }> },
    requiredPermissions: string[],
    path: string,
    method: string,
  ): Promise<boolean> {
    try {
      // Generate a cache key based on user ID and required permissions
      const cacheKey = this.generateCacheKey(user.id, requiredPermissions);
      
      // Try to get the result from cache first
      const cachedResult = await this.cacheService.get<boolean>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // If user has no roles, deny access
      if (!user.roles || user.roles.length === 0) {
        this.logger.warn(
          `Permission check failed: User has no roles`,
          { userId: user.id, requiredPermissions, path, method },
        );
        throw new AppException(ErrorType.VALIDATION, 'AUTH_004', 'User has no assigned roles');
      }

      // Get all permissions for the user's roles
      const userPermissions = await this.getUserPermissions(user);
      
      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some(requiredPermission => {
        // Direct permission match
        if (userPermissions.includes(requiredPermission)) {
          return true;
        }
        
        // Check for wildcard permissions
        const parts = requiredPermission.split(':');
        if (parts.length === 3) {
          const [journey, resource, action] = parts;
          
          // Check journey-wide permission (journey:*:action)
          const journeyWide = `${journey}:*:${action}`;
          if (userPermissions.includes(journeyWide)) {
            return true;
          }
          
          // Check global permission (journey:resource:*)
          const actionWide = `${journey}:${resource}:*`;
          if (userPermissions.includes(actionWide)) {
            return true;
          }
          
          // Check super permission (journey:*:*)
          const superPermission = `${journey}:*:*`;
          if (userPermissions.includes(superPermission)) {
            return true;
          }
          
          // Check admin permission (*:*:*)
          if (userPermissions.includes('*:*:*')) {
            return true;
          }
        }
        
        return false;
      });

      // Cache the result
      await this.cacheService.set(cacheKey, hasPermission, this.CACHE_TTL);

      if (!hasPermission) {
        this.logger.warn(
          `Permission check failed: User lacks required permissions`,
          { userId: user.id, userPermissions, requiredPermissions, path, method },
        );
        throw new AppException(
          ErrorType.VALIDATION,
          'AUTH_005',
          'User does not have the required permissions',
        );
      }

      return hasPermission;
    } catch (error) {
      // If error is already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      // Otherwise, log and throw a generic error
      this.logger.error(
        `Error checking permissions: ${error.message}`,
        { userId: user.id, requiredPermissions, path, method, error },
      );
      throw new AppException(
        ErrorType.INTERNAL,
        'AUTH_006',
        'Error checking user permissions',
      );
    }
  }

  /**
   * Retrieves all permissions for a user based on their roles
   * 
   * @param user - The authenticated user object
   * @returns A Promise resolving to an array of permission strings
   * @private
   */
  /**
   * Retrieves all permissions for a user based on their roles
   * 
   * @param user - The authenticated user object with roles property
   * @returns A Promise resolving to an array of permission strings
   * @private
   */
  private async getUserPermissions(user: { id: string; roles: Array<{ id: number }> }): Promise<string[]> {
    try {
      // Generate a cache key for user permissions
      const cacheKey = `${this.CACHE_PREFIX}_user_${user.id}`;
      
      // Try to get permissions from cache first
      const cachedPermissions = await this.cacheService.get<string[]>(cacheKey);
      if (cachedPermissions !== null) {
        return cachedPermissions;
      }

      // Extract role IDs from user roles
      const roleIds = user.roles.map(role => role.id);
      
      // Get permissions for these roles from the permissions service
      const permissions = await this.permissionsService.getPermissionsByRoleIds(roleIds);
      
      // Extract permission names
      const permissionNames = permissions.map(permission => permission.name);
      
      // Add journey-wide permissions if specific resource permissions exist
      // For example, if user has 'health:metrics:read', also grant 'health:*:read'
      const journeyWidePermissions = this.extractJourneyWidePermissions(permissionNames);
      const allPermissions = [...new Set([...permissionNames, ...journeyWidePermissions])];
      
      // Cache the permissions
      await this.cacheService.set(cacheKey, allPermissions, this.CACHE_TTL);
      
      return allPermissions;
    } catch (error) {
      this.logger.error(
        `Error retrieving user permissions: ${error.message}`,
        { userId: user.id, error },
      );
      throw error;
    }
  }

  /**
   * Generates a cache key for permission check results
   * 
   * @param userId - The user ID
   * @param permissions - Array of permission strings
   * @returns A unique cache key string
   * @private
   */
  private generateCacheKey(userId: string, permissions: string[]): string {
    // Sort permissions to ensure consistent cache keys regardless of order
    const sortedPermissions = [...permissions].sort();
    return `${this.CACHE_PREFIX}_${userId}_${sortedPermissions.join('_')}`;
  }

  /**
   * Extracts journey-wide permissions from specific permissions
   * For example, if a user has 'health:metrics:read', they should also have 'health:*:read'
   * 
   * @param permissions - Array of specific permission strings
   * @returns Array of journey-wide permission strings
   * @private
   */
  private extractJourneyWidePermissions(permissions: string[]): string[] {
    const journeyWidePermissions: string[] = [];
    
    permissions.forEach(permission => {
      const parts = permission.split(':');
      
      // Only process valid permission format (journey:resource:action)
      if (parts.length === 3) {
        const [journey, resource, action] = parts;
        
        // Add journey-wide permission (journey:*:action)
        const journeyWide = `${journey}:*:${action}`;
        if (!permissions.includes(journeyWide)) {
          journeyWidePermissions.push(journeyWide);
        }
      }
    });
    
    return journeyWidePermissions;
  }
}