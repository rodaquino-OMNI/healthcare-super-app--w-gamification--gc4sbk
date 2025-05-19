/**
 * @file role.interface.ts
 * @description Defines interfaces for authorization including roles, permissions, and user-role assignments.
 * These interfaces support role-based and permission-based authorization across all journeys.
 */

/**
 * Enum representing the different journey types in the AUSTA SuperApp.
 * Used for journey-specific role typing and authorization.
 */
export enum JourneyType {
  HEALTH = 'health',     // Minha Saúde (My Health) journey
  CARE = 'care',         // Cuidar-me Agora (Care Now) journey
  PLAN = 'plan',         // Meu Plano & Benefícios (My Plan & Benefits) journey
  GLOBAL = 'global'      // Global access across all journeys
}

/**
 * Interface representing a permission entity.
 * Permissions define specific actions that can be performed within the system.
 */
export interface IPermission {
  /**
   * Unique identifier for the permission
   */
  id: number;

  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description: string;
}

/**
 * Interface representing a role entity.
 * Roles are collections of permissions that can be assigned to users.
 */
export interface IRole {
  /**
   * Unique identifier for the role
   */
  id: number;

  /**
   * Unique name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
   */
  name: string;

  /**
   * Description of the role and its purpose
   */
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or global)
   * If null or undefined, the role is considered global (applies to all journeys)
   */
  journey?: JourneyType | null;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault?: boolean;

  /**
   * Permissions assigned to this role
   */
  permissions?: IPermission[];

  /**
   * Timestamp of when the role was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the role was last updated
   */
  updatedAt?: Date;
}

/**
 * Interface representing a user-role assignment.
 * Maps users to roles with optional journey-specific context.
 */
export interface IUserRole {
  /**
   * Unique identifier for the user-role assignment
   */
  id: number;

  /**
   * ID of the user
   */
  userId: string | number;

  /**
   * ID of the role
   */
  roleId: number;

  /**
   * The specific journey context for this role assignment
   * If null or undefined, the role applies to all journeys or follows the role's journey setting
   */
  journeyContext?: JourneyType | null;

  /**
   * Timestamp of when the user-role assignment was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the user-role assignment was last updated
   */
  updatedAt?: Date;
}

/**
 * Type for permission checks that can be used in authorization guards and decorators.
 * Allows for checking permissions across different journeys.
 */
export type PermissionCheck = {
  /**
   * The permission name to check
   */
  permission: string;

  /**
   * The journey context for the permission check
   * If not provided, the check applies to the current journey context
   */
  journeyContext?: JourneyType;
};

/**
 * Interface for role-based authorization checks.
 * Can be used to verify if a user has specific roles or permissions.
 */
export interface IRoleAuthorization {
  /**
   * Checks if the user has the specified role
   * @param roleId The ID of the role to check
   * @param journeyContext Optional journey context for the check
   */
  hasRole(roleId: number, journeyContext?: JourneyType): boolean;

  /**
   * Checks if the user has the specified permission
   * @param permissionName The name of the permission to check
   * @param journeyContext Optional journey context for the check
   */
  hasPermission(permissionName: string, journeyContext?: JourneyType): boolean;

  /**
   * Checks if the user has any of the specified roles
   * @param roleIds Array of role IDs to check
   * @param journeyContext Optional journey context for the check
   */
  hasAnyRole(roleIds: number[], journeyContext?: JourneyType): boolean;

  /**
   * Checks if the user has all of the specified permissions
   * @param permissionNames Array of permission names to check
   * @param journeyContext Optional journey context for the check
   */
  hasAllPermissions(permissionNames: string[], journeyContext?: JourneyType): boolean;
}