/**
 * @file Permission interfaces for the AUSTA SuperApp authentication system
 * @module @austa/interfaces/auth/permission
 */

import { IUser } from './user.interface';

/**
 * Interface representing a permission in the system
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
 * Interface representing a direct permission assignment to a user
 */
export interface IUserPermission {
  /**
   * Unique identifier for the user-permission relationship
   */
  id: number;

  /**
   * ID of the user to whom the permission is assigned
   */
  userId: string;

  /**
   * ID of the permission being assigned to the user
   */
  permissionId: number;

  /**
   * Optional reason for granting this specific permission
   */
  reason?: string;

  /**
   * ID of the user who granted this permission (for audit purposes)
   */
  grantedBy?: string;

  /**
   * Optional expiration date for temporary permissions
   */
  expiresAt?: Date;

  /**
   * Reference to the user entity
   */
  user?: IUser;

  /**
   * Reference to the permission entity
   */
  permission?: IPermission;

  /**
   * Timestamp of when the permission was granted to the user
   */
  createdAt: Date;

  /**
   * Timestamp of when the user-permission relationship was last updated
   */
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new permission
 */
export interface CreatePermissionDto {
  /**
   * Name of the permission in the format journey:resource:action
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description?: string;
}

/**
 * Data transfer object for updating an existing permission
 */
export interface UpdatePermissionDto {
  /**
   * Updated name of the permission
   */
  name?: string;

  /**
   * Updated description of the permission
   */
  description?: string;
}

/**
 * Data transfer object for creating a direct user-permission assignment
 */
export interface CreateUserPermissionDto {
  /**
   * ID of the user to whom the permission will be assigned
   */
  userId: string;

  /**
   * ID of the permission to assign to the user
   */
  permissionId: number;

  /**
   * Optional reason for granting this specific permission
   */
  reason?: string;

  /**
   * ID of the user granting this permission (for audit purposes)
   */
  grantedBy?: string;

  /**
   * Optional expiration date for temporary permissions
   */
  expiresAt?: Date;
}

/**
 * Data transfer object for updating a user-permission assignment
 */
export interface UpdateUserPermissionDto {
  /**
   * Updated reason for granting this specific permission
   */
  reason?: string;

  /**
   * Updated expiration date for temporary permissions
   */
  expiresAt?: Date | null;
}

/**
 * Response data transfer object for permission information
 */
export interface PermissionResponseDto extends IPermission {
  /**
   * Timestamp of when the permission was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the permission was last updated
   */
  updatedAt?: Date;
}

/**
 * Response data transfer object for user-permission assignment information
 */
export interface UserPermissionResponseDto extends IUserPermission {
  /**
   * The permission details
   */
  permission: PermissionResponseDto;
}