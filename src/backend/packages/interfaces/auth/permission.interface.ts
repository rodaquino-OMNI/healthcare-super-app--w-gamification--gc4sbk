/**
 * Permission interfaces for the AUSTA SuperApp authentication system.
 * These interfaces define the structure for permission entities and DTOs
 * used in the fine-grained permission system across all services.
 * 
 * These interfaces are part of the standardized module resolution effort
 * and provide a clear public API for permission-related data structures
 * across all services in the AUSTA SuperApp backend.
 */

// Import related interfaces if needed in the future
// import { IRole } from './role.interface';

/**
 * Base Permission interface representing an individual action that users or roles
 * can be authorized to perform within the AUSTA SuperApp.
 *
 * Permissions follow a hierarchical format: journey:resource:action
 * Examples:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 *
 * This interface is used across all services to ensure consistent permission handling
 * and is a key part of the role-based access control system.
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
 * Data transfer object for creating a new permission
 */
export interface ICreatePermissionDto {
  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   * If not provided, a default description will be generated based on the name
   */
  description?: string;
}

/**
 * Data transfer object for updating an existing permission
 * All fields are optional to allow partial updates
 */
export interface IUpdatePermissionDto {
  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  name?: string;

  /**
   * Human-readable description of what the permission allows
   */
  description?: string;
}

/**
 * Data transfer object for permission responses
 * Extends the base permission interface with additional metadata
 */
export interface IPermissionResponseDto extends IPermission {
  /**
   * Array of role IDs that have this permission
   * This is optional and may not be included in all responses
   */
  roleIds?: number[];
  
  /**
   * Timestamp when the permission was created
   * This is optional and may not be included in all responses
   */
  createdAt?: Date;
  
  /**
   * Timestamp when the permission was last updated
   * This is optional and may not be included in all responses
   */
  updatedAt?: Date;
}

/**
 * Interface for pagination and filtering parameters when querying permissions
 */
export interface IFilterPermissionsDto {
  /**
   * Page number for pagination (1-based indexing)
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   * @default 10
   */
  limit?: number;

  /**
   * Optional search term to filter permissions by name or description
   */
  search?: string;

  /**
   * Optional journey filter to get permissions for a specific journey
   * Examples: 'health', 'care', 'plan'
   */
  journey?: string;

  /**
   * Optional resource filter to get permissions for a specific resource
   * Examples: 'metrics', 'appointment', 'claim'
   */
  resource?: string;

  /**
   * Optional action filter to get permissions for a specific action
   * Examples: 'read', 'create', 'update', 'delete'
   */
  action?: string;
}

/**
 * Interface for assigning permissions to roles
 */
export interface IAssignPermissionDto {
  /**
   * ID of the role to assign permissions to
   */
  roleId: number;

  /**
   * IDs of the permissions to assign to the role
   */
  permissionIds: number[];
  
  /**
   * Optional reason for the permission assignment
   * Useful for audit logging and tracking permission changes
   */
  reason?: string;
}

/**
 * Interface for revoking permissions from roles
 */
export interface IRevokePermissionDto {
  /**
   * ID of the role to revoke permissions from
   */
  roleId: number;

  /**
   * IDs of the permissions to revoke from the role
   */
  permissionIds: number[];
  
  /**
   * Optional reason for the permission revocation
   * Useful for audit logging and tracking permission changes
   */
  reason?: string;
}

/**
 * Interface for checking if a user has a specific permission
 */
export interface ICheckPermissionDto {
  /**
   * ID of the user to check permissions for
   */
  userId: number;
  
  /**
   * Name of the permission to check
   * Format: journey:resource:action
   */
  permissionName: string;
  
  /**
   * Optional journey context for the permission check
   * This can be used to restrict permissions to a specific journey
   */
  journeyContext?: string;
}