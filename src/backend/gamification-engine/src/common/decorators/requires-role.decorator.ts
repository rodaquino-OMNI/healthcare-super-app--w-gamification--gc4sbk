import { SetMetadata } from '@nestjs/common';
import { JourneyType } from '../interfaces/journey.interface';

/**
 * Error codes specific to role-based access control in the gamification engine.
 * These codes are used to provide detailed error messages when access is denied.
 * 
 * These error codes are designed to be consistent with the error handling framework
 * and can be used to generate appropriate HTTP status codes and error messages.
 */
export enum GamificationAuthErrorCode {
  /**
   * User is not authenticated (no valid JWT token)
   * Maps to HTTP 401 Unauthorized
   */
  NOT_AUTHENTICATED = 'GAMIFICATION_AUTH_001',
  
  /**
   * User is authenticated but lacks the required role
   * Maps to HTTP 403 Forbidden
   */
  INSUFFICIENT_PERMISSIONS = 'GAMIFICATION_AUTH_002',
  
  /**
   * User has the required role but for a different journey
   * Maps to HTTP 403 Forbidden
   */
  JOURNEY_MISMATCH = 'GAMIFICATION_AUTH_003',
  
  /**
   * User is attempting to access a resource they don't own
   * Maps to HTTP 403 Forbidden
   */
  RESOURCE_OWNERSHIP_VIOLATION = 'GAMIFICATION_AUTH_004'
}

/**
 * Metadata key used to store roles information for route handlers in the gamification engine.
 * This is used by the RolesGuard to determine if a user has permission to access a route.
 */
export const GAMIFICATION_ROLES_KEY = 'gamification_roles';

/**
 * Role format for gamification engine resources.
 * Can be a general role (e.g., 'admin') or a journey-specific role (e.g., 'health:viewer').
 * 
 * Common role patterns in the AUSTA SuperApp:
 * - Global roles: 'admin', 'user', 'guest'
 * - Journey-specific roles: 'health:viewer', 'health:editor', 'care:provider', 'plan:manager'
 * - Resource-specific roles: 'achievements:creator', 'quests:manager', 'rewards:admin'
 */
export type GamificationRole = string;

/**
 * Interface for role requirements with optional journey context.
 * This provides a flexible way to define access requirements for gamification resources.
 */
export interface RoleRequirement {
  /**
   * The role required for access
   */
  role: GamificationRole;
  
  /**
   * Optional journey type to restrict the role to a specific journey
   * When specified, the user must have the role specifically for this journey
   */
  journey?: JourneyType;
  
  /**
   * Optional flag to check resource ownership
   * When true, the guard will verify that the user owns the requested resource
   * This requires the route to have a parameter named 'userId' or 'profileId'
   */
  checkOwnership?: boolean;
  
  /**
   * Optional custom error message to display when access is denied
   * This message will be included in the error response
   */
  errorMessage?: string;
  
  /**
   * Optional custom error code to use when access is denied
   * Defaults to GamificationAuthErrorCode.INSUFFICIENT_PERMISSIONS
   */
  errorCode?: GamificationAuthErrorCode;
}

/**
 * Decorator that assigns required roles for accessing gamification engine resources.
 * This decorator is used in conjunction with a RolesGuard to implement
 * role-based access control for gamification endpoints.
 * 
 * It supports both core roles (like 'admin', 'user') and journey-specific roles
 * (like 'health:viewer', 'care:provider', 'plan:manager').
 * 
 * The decorator works by attaching metadata to route handlers or controllers,
 * which is then read by the RolesGuard to determine if the authenticated user
 * has the required permissions to access the resource.
 * 
 * @param roles - Array of role names or role requirements required for access 
 *               (if user has ANY of these roles, access is granted)
 * @returns A method or class decorator that attaches role metadata
 * 
 * @example
 * // Require 'admin' role to access this endpoint
 * @RequiresRole('admin')
 * @Get('achievements')
 * getAchievements() { ... }
 * 
 * @example
 * // Require 'admin' OR 'health:manager' roles to access this endpoint
 * @RequiresRole('admin', 'health:manager')
 * @Get('health-achievements')
 * getHealthAchievements() { ... }
 * 
 * @example
 * // Require 'health:viewer' role specifically for the Health journey
 * @RequiresRole({ role: 'health:viewer', journey: JourneyType.HEALTH })
 * @Get('health-metrics')
 * getHealthMetrics() { ... }
 * 
 * @example
 * // Require user to own the resource (for user-specific achievements)
 * @RequiresRole({ role: 'user', checkOwnership: true })
 * @Get('users/:userId/achievements')
 * getUserAchievements(@Param('userId') userId: string) { ... }
 * 
 * @example
 * // Custom error message and code
 * @RequiresRole({
 *   role: 'rewards:admin',
 *   errorMessage: 'Only rewards administrators can create new rewards',
 *   errorCode: GamificationAuthErrorCode.INSUFFICIENT_PERMISSIONS
 * })
 * @Post('rewards')
 * createReward(@Body() createRewardDto: CreateRewardDto) { ... }
 * 
 * @example
 * // Apply to all routes in a controller
 * @RequiresRole('admin')
 * @Controller('achievements')
 * export class AchievementsController { ... }
 */
export const RequiresRole = (...roles: (GamificationRole | RoleRequirement)[]) => {
  // Normalize roles to RoleRequirement objects
  const normalizedRoles = roles.map(role => {
    if (typeof role === 'string') {
      return { 
        role,
        errorCode: GamificationAuthErrorCode.INSUFFICIENT_PERMISSIONS,
        errorMessage: `Access denied: Required role '${role}' not found`
      };
    }
    
    // Ensure error code is set
    return {
      ...role,
      errorCode: role.errorCode || GamificationAuthErrorCode.INSUFFICIENT_PERMISSIONS,
      errorMessage: role.errorMessage || 
        `Access denied: Required role '${role.role}'${role.journey ? ` for journey '${role.journey}'` : ''} not found`
    };
  });
  
  return SetMetadata(GAMIFICATION_ROLES_KEY, normalizedRoles);
};

/**
 * Usage Notes:
 * 
 * 1. This decorator must be used in conjunction with a RolesGuard that implements
 *    the CanActivate interface from @nestjs/common.
 * 
 * 2. The RolesGuard should use the Reflector from @nestjs/core to retrieve the
 *    metadata set by this decorator.
 * 
 * 3. The RolesGuard should extract the user from the request object, which is
 *    populated by the authentication middleware (typically JWT authentication).
 * 
 * 4. For ownership validation, the RolesGuard should compare the user ID from the
 *    authenticated user with the userId or profileId parameter in the request.
 * 
 * 5. Error responses should include the appropriate HTTP status code, error code,
 *    and error message as defined in the RoleRequirement.
 * 
 * Example RolesGuard implementation:
 * 
 * ```typescript
 * @Injectable()
 * export class GamificationRolesGuard implements CanActivate {
 *   constructor(
 *     private reflector: Reflector,
 *     private logger: LoggerService,
 *   ) {}
 * 
 *   canActivate(context: ExecutionContext): boolean {
 *     const requiredRoles = this.reflector.get<RoleRequirement[]>(
 *       GAMIFICATION_ROLES_KEY,
 *       context.getHandler(),
 *     ) || this.reflector.get<RoleRequirement[]>(
 *       GAMIFICATION_ROLES_KEY,
 *       context.getClass(),
 *     );
 * 
 *     if (!requiredRoles || requiredRoles.length === 0) {
 *       return true; // No roles required, allow access
 *     }
 * 
 *     const request = context.switchToHttp().getRequest();
 *     const user = request.user;
 * 
 *     if (!user) {
 *       throw new UnauthorizedException({
 *         errorCode: GamificationAuthErrorCode.NOT_AUTHENTICATED,
 *         message: 'User is not authenticated',
 *       });
 *     }
 * 
 *     // Check if user has any of the required roles
 *     const hasRequiredRole = requiredRoles.some(roleReq => {
 *       // Check if user has the role
 *       const hasRole = user.roles.some(userRole => userRole === roleReq.role);
 *       if (!hasRole) return false;
 * 
 *       // Check journey if specified
 *       if (roleReq.journey && user.journey !== roleReq.journey) {
 *         return false;
 *       }
 * 
 *       // Check ownership if required
 *       if (roleReq.checkOwnership) {
 *         const resourceUserId = request.params.userId || request.params.profileId;
 *         if (!resourceUserId || resourceUserId !== user.id) {
 *           throw new ForbiddenException({
 *             errorCode: GamificationAuthErrorCode.RESOURCE_OWNERSHIP_VIOLATION,
 *             message: 'You do not have permission to access this resource',
 *           });
 *         }
 *       }
 * 
 *       return true;
 *     });
 * 
 *     if (!hasRequiredRole) {
 *       const firstRole = requiredRoles[0];
 *       throw new ForbiddenException({
 *         errorCode: firstRole.errorCode,
 *         message: firstRole.errorMessage,
 *       });
 *     }
 * 
 *     return true;
 *   }
 * }
 * ```
 */