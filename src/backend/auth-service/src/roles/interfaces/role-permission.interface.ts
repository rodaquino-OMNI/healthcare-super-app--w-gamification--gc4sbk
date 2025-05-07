/**
 * @file Role-Permission relationship interface for the AUSTA SuperApp authentication system
 * @module auth-service/roles/interfaces/role-permission
 */

import { IPermission } from '@austa/interfaces/auth';

/**
 * Interface representing the relationship between a role and a permission
 * in the AUSTA SuperApp authentication system. This interface provides
 * type safety for operations that manage the many-to-many relationship
 * between roles and permissions.
 */
export interface IRolePermission {
  /**
   * Unique identifier for the role-permission relationship
   */
  id: number;

  /**
   * ID of the role to which the permission is assigned
   */
  roleId: number;

  /**
   * ID of the permission being assigned to the role
   */
  permissionId: number;

  /**
   * The journey this role-permission assignment is associated with
   * (health, care, plan, or null for global assignments)
   */
  journey?: string;

  /**
   * Optional reason for assigning this specific permission to the role
   */
  reason?: string;

  /**
   * ID of the user who assigned this permission to the role (for audit purposes)
   */
  assignedBy?: string;

  /**
   * Optional expiration date for temporary role-permission assignments
   */
  expiresAt?: Date;

  /**
   * Reference to the permission entity
   */
  permission?: IPermission;

  /**
   * Timestamp of when the permission was assigned to the role
   */
  createdAt: Date;

  /**
   * Timestamp of when the role-permission relationship was last updated
   */
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new role-permission assignment
 */
export interface CreateRolePermissionDto {
  /**
   * ID of the role to which the permission will be assigned
   */
  roleId: number;

  /**
   * ID of the permission to assign to the role
   */
  permissionId: number;

  /**
   * The journey this role-permission assignment is associated with
   * (health, care, plan, or null for global assignments)
   */
  journey?: string;

  /**
   * Optional reason for assigning this specific permission to the role
   */
  reason?: string;

  /**
   * ID of the user assigning this permission to the role (for audit purposes)
   */
  assignedBy?: string;

  /**
   * Optional expiration date for temporary role-permission assignments
   */
  expiresAt?: Date;
}

/**
 * Data transfer object for updating a role-permission assignment
 */
export interface UpdateRolePermissionDto {
  /**
   * Updated reason for assigning this specific permission to the role
   */
  reason?: string;

  /**
   * Updated journey association for this role-permission assignment
   */
  journey?: string | null;

  /**
   * Updated expiration date for temporary role-permission assignments
   */
  expiresAt?: Date | null;
}

/**
 * Response data transfer object for role-permission assignment information
 */
export interface RolePermissionResponseDto extends IRolePermission {
  /**
   * The permission details
   */
  permission: IPermission;
}

/**
 * Interface for bulk permission assignment to roles
 */
export interface BulkRolePermissionAssignmentDto {
  /**
   * ID of the role to which the permissions will be assigned
   */
  roleId: number;

  /**
   * IDs of the permissions to assign to the role
   */
  permissionIds: number[];

  /**
   * The journey these role-permission assignments are associated with
   * (health, care, plan, or null for global assignments)
   */
  journey?: string;

  /**
   * Optional reason for assigning these permissions to the role
   */
  reason?: string;

  /**
   * ID of the user assigning these permissions to the role (for audit purposes)
   */
  assignedBy?: string;

  /**
   * Optional expiration date for temporary role-permission assignments
   */
  expiresAt?: Date;
}