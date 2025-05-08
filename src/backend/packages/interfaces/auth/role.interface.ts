/**
 * @file Role interfaces for the AUSTA SuperApp
 * @module @austa/interfaces/auth/role
 * 
 * This file defines the role interfaces that are shared across all services
 * in the AUSTA SuperApp. It provides standardized structures for role data
 * used in the role-based access control system.
 * 
 * These interfaces support the journey-centered architecture by providing
 * consistent role structures that can be used across all three user journeys
 * ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 * 
 * @see {@link ./permission.interface.ts} - For permission interfaces that are associated with roles
 * @see {@link ./user.interface.ts} - For user interfaces that are associated with roles
 */

import { IPermission, PermissionId } from './permission.interface';

/**
 * Type alias for role ID to ensure consistent typing across the application
 */
export type RoleId = number;

/**
 * Interface for role relationships with users
 */
export interface IRoleUser {
  /**
   * ID of the role
   */
  roleId: RoleId;
  
  /**
   * ID of the user
   */
  userId: string;
}

/**
 * Represents a role entity in the system.
 * Roles are collections of permissions that can be assigned to users.
 * 
 * This interface is used across all services that implement or check roles,
 * ensuring consistent role handling throughout the application.
 * 
 * Roles can be journey-specific (e.g., 'HealthAdmin', 'CareProvider', 'PlanManager')
 * or global (e.g., 'Administrator', 'User').
 */
export interface IRole {
  /**
   * Unique identifier for the role.
   * This property is immutable after creation.
   */
  readonly id: RoleId;

  /**
   * Unique name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
   */
  name: string;

  /**
   * Description of the role and its purpose
   */
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or null for global roles)
   */
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault?: boolean;

  /**
   * Permissions assigned to this role
   */
  permissions?: IPermission[];

  /**
   * Timestamp of when the role was created.
   * This property is immutable after creation.
   */
  readonly createdAt?: Date;

  /**
   * Timestamp of when the role was last updated.
   */
  updatedAt?: Date;
}

/**
 * Data transfer object for creating a new role.
 * Used in API requests to create roles across all services.
 */
export interface CreateRoleDto {
  /**
   * Name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
   * Must be unique across the system
   */
  name: string;

  /**
   * Description of the role and its purpose
   */
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or null for global roles)
   */
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault?: boolean;

  /**
   * IDs of permissions to assign to this role
   */
  permissionIds?: PermissionId[];
}

/**
 * Data transfer object for updating an existing role.
 * Used in API requests to update roles across all services.
 */
export interface UpdateRoleDto {
  /**
   * Updated name of the role
   */
  name?: string;

  /**
   * Updated description of the role
   */
  description?: string;

  /**
   * Updated journey association
   */
  journey?: string;

  /**
   * Updated default role status
   */
  isDefault?: boolean;
}

/**
 * Data transfer object for role responses in API calls.
 * Contains all role data that is safe to expose to clients.
 * Used consistently across all services that return role data.
 */
export interface RoleResponseDto {
  /**
   * Unique identifier for the role
   */
  id: RoleId;

  /**
   * Name of the role
   */
  name: string;

  /**
   * Description of the role
   */
  description: string;

  /**
   * The journey this role is associated with (health, care, plan, or null for global roles)
   */
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault: boolean;

  /**
   * Permissions assigned to this role
   * May be omitted in some responses for performance reasons
   */
  permissions?: IPermission[];
  
  /**
   * Timestamp of when the role was created
   */
  createdAt: Date;

  /**
   * Timestamp of when the role was last updated
   */
  updatedAt: Date;
}

/**
 * Interface for bulk role operations
 */
export interface BulkRoleOperationDto {
  /**
   * Array of role IDs to operate on
   */
  roleIds: RoleId[];
}

/**
 * Interface for assigning permissions to a role
 */
export interface AssignPermissionsToRoleDto {
  /**
   * ID of the role to assign permissions to
   */
  roleId: RoleId;
  
  /**
   * IDs of permissions to assign to the role
   */
  permissionIds: PermissionId[];
}

/**
 * Interface for removing permissions from a role
 */
export interface RemovePermissionsFromRoleDto {
  /**
   * ID of the role to remove permissions from
   */
  roleId: RoleId;
  
  /**
   * IDs of permissions to remove from the role
   */
  permissionIds: PermissionId[];
}

/**
 * Interface for assigning roles to a user
 */
export interface AssignRolesToUserDto {
  /**
   * ID of the user to assign roles to
   */
  userId: string;
  
  /**
   * IDs of roles to assign to the user
   */
  roleIds: RoleId[];
}

/**
 * Interface for removing roles from a user
 */
export interface RemoveRolesFromUserDto {
  /**
   * ID of the user to remove roles from
   */
  userId: string;
  
  /**
   * IDs of roles to remove from the user
   */
  roleIds: RoleId[];
}