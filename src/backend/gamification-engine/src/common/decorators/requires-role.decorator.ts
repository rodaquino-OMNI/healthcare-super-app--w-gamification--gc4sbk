import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store required roles information for gamification resources.
 * This is used by the GamificationRolesGuard to determine if a user has permission
 * to access gamification resources.
 */
export const GAMIFICATION_ROLES_KEY = 'gamification_roles';

/**
 * Enum defining common gamification-specific roles that can be used with the RequiresRole decorator.
 * These roles are specific to the gamification engine and are in addition to the global roles
 * defined in the auth service.
 */
export enum GamificationRole {
  // Global gamification roles
  ADMIN = 'gamification:admin',
  VIEWER = 'gamification:viewer',
  MANAGER = 'gamification:manager',
  
  // Journey-specific gamification roles
  HEALTH_ADMIN = 'health:gamification:admin',
  HEALTH_MANAGER = 'health:gamification:manager',
  HEALTH_VIEWER = 'health:gamification:viewer',
  
  CARE_ADMIN = 'care:gamification:admin',
  CARE_MANAGER = 'care:gamification:manager',
  CARE_VIEWER = 'care:gamification:viewer',
  
  PLAN_ADMIN = 'plan:gamification:admin',
  PLAN_MANAGER = 'plan:gamification:manager',
  PLAN_VIEWER = 'plan:gamification:viewer',
}

/**
 * Type representing valid role names for the gamification engine.
 * Includes both predefined GamificationRole enum values and custom string roles.
 */
export type GamificationRoleName = GamificationRole | string;

/**
 * Decorator that assigns required roles for accessing gamification resources.
 * This decorator is used in conjunction with the GamificationRolesGuard to implement
 * role-based access control for gamification endpoints.
 * 
 * It supports both global roles (like 'admin', 'gamification:admin') and journey-specific roles
 * (like 'health:gamification:admin', 'care:gamification:manager').
 * 
 * @param roles - Array of role names required for access (if user has ANY of these roles, access is granted)
 * @returns A method or class decorator that attaches role metadata
 * 
 * @example
 * // Require 'admin' role to access this endpoint
 * @RequiresRole('admin')
 * @Get('achievements')
 * getAchievements() { ... }
 * 
 * @example
 * // Require 'admin' OR 'gamification:admin' roles to access this endpoint
 * @RequiresRole('admin', GamificationRole.ADMIN)
 * @Get('achievements/admin')
 * getAchievementsAdmin() { ... }
 * 
 * @example
 * // Require journey-specific role for health gamification
 * @RequiresRole(GamificationRole.HEALTH_ADMIN)
 * @Get('achievements/health')
 * getHealthAchievements() { ... }
 * 
 * @example
 * // Apply to all routes in a controller
 * @RequiresRole(GamificationRole.ADMIN)
 * @Controller('achievements')
 * export class AchievementsController { ... }
 */
export const RequiresRole = (...roles: GamificationRoleName[]) => 
  SetMetadata(GAMIFICATION_ROLES_KEY, roles);

/**
 * Decorator that restricts access to gamification resources to users who own those resources.
 * This decorator is used in conjunction with the ResourceOwnershipGuard to implement
 * ownership-based access control for gamification resources.
 * 
 * @returns A method decorator that marks a route as requiring resource ownership
 * 
 * @example
 * // Require the user to own the profile to access this endpoint
 * @RequiresResourceOwnership()
 * @Get('profiles/:id')
 * getProfile(@Param('id') id: string) { ... }
 */
export const RESOURCE_OWNERSHIP_KEY = 'requires_resource_ownership';
export const RequiresResourceOwnership = () => SetMetadata(RESOURCE_OWNERSHIP_KEY, true);

/**
 * Decorator that combines RequiresRole and RequiresResourceOwnership decorators.
 * This is a convenience decorator for routes that require both role-based access
 * and resource ownership verification.
 * 
 * @param roles - Array of role names required for access
 * @returns A method decorator that combines role and ownership requirements
 * 
 * @example
 * // Require 'admin' role OR ownership of the resource
 * @RequiresRoleOrOwnership('admin')
 * @Get('profiles/:id')
 * getProfile(@Param('id') id: string) { ... }
 */
export const ROLE_OR_OWNERSHIP_KEY = 'role_or_ownership';
export const RequiresRoleOrOwnership = (...roles: GamificationRoleName[]) => 
  SetMetadata(ROLE_OR_OWNERSHIP_KEY, roles);