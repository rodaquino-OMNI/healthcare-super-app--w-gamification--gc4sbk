/**
 * Role interfaces for the AUSTA SuperApp authentication system.
 * These interfaces define the structure for role entities and DTOs
 * used in the role-based access control system across all services.
 * 
 * These interfaces are part of the standardized module resolution effort
 * and provide a clear public API for role-related data structures
 * across all services in the AUSTA SuperApp backend.
 */

// Import related interfaces
import { IPermission } from './permission.interface';

// Forward reference to User interface (will be defined in user.interface.ts)
interface IUser {
  id: number;
  username: string;
  email: string;
  roles: IRole[];
}

/**
 * Base Role interface representing a collection of permissions that can be assigned to users
 * within the AUSTA SuperApp. Roles enable journey-specific access control across the
 * application's three core journeys: Health, Care, and Plan.
 *
 * This interface is used across all services to ensure consistent role handling
 * and is a key part of the role-based access control system.
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
   * The journey this role is associated with (health, care, plan, or null for global roles)
   */
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault: boolean;

  /**
   * Permissions assigned to this role
   */
  permissions: IPermission[];
  
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
 * Data transfer object for creating a new role
 */
export interface ICreateRoleDto {
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
   * @default false
   */
  isDefault?: boolean;

  /**
   * IDs of permissions to assign to this role
   */
  permissionIds?: number[];
}

/**
 * Data transfer object for updating an existing role
 * All fields are optional to allow partial updates
 */
export interface IUpdateRoleDto {
  /**
   * Name of the role (e.g., 'User', 'Caregiver', 'Provider', 'Administrator')
   * Must be unique across the system
   */
  name?: string;

  /**
   * Description of the role and its purpose
   */
  description?: string;

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
   * If provided, this will replace all existing permissions
   */
  permissionIds?: number[];
}

/**
 * Data transfer object for role responses
 * Extends the base role interface with additional metadata
 */
export interface IRoleResponseDto extends IRole {
  /**
   * Array of user IDs that have this role
   * This is optional and may not be included in all responses
   */
  userIds?: number[];
  
  /**
   * Count of users with this role
   * This is optional and may not be included in all responses
   */
  userCount?: number;
  
  /**
   * Count of permissions assigned to this role
   * This is optional and may not be included in all responses
   */
  permissionCount?: number;
}

/**
 * Interface for pagination and filtering parameters when querying roles
 */
export interface IFilterRolesDto {
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
   * Optional search term to filter roles by name or description
   */
  search?: string;

  /**
   * Optional journey filter to get roles for a specific journey
   * Examples: 'health', 'care', 'plan'
   */
  journey?: string;

  /**
   * Optional flag to filter default roles
   */
  isDefault?: boolean;
  
  /**
   * Optional flag to include permissions in the response
   * @default false
   */
  includePermissions?: boolean;
  
  /**
   * Optional flag to include user counts in the response
   * @default false
   */
  includeUserCounts?: boolean;
}

/**
 * Interface for assigning roles to users
 */
export interface IAssignRoleDto {
  /**
   * ID of the user to assign roles to
   */
  userId: number;

  /**
   * IDs of the roles to assign to the user
   */
  roleIds: number[];
  
  /**
   * Optional reason for the role assignment
   * Useful for audit logging and tracking role changes
   */
  reason?: string;
}

/**
 * Interface for revoking roles from users
 */
export interface IRevokeRoleDto {
  /**
   * ID of the user to revoke roles from
   */
  userId: number;

  /**
   * IDs of the roles to revoke from the user
   */
  roleIds: number[];
  
  /**
   * Optional reason for the role revocation
   * Useful for audit logging and tracking role changes
   */
  reason?: string;
}

/**
 * Interface for checking if a user has a specific role
 */
export interface ICheckRoleDto {
  /**
   * ID of the user to check roles for
   */
  userId: number;
  
  /**
   * Name of the role to check
   */
  roleName: string;
  
  /**
   * Optional journey context for the role check
   * This can be used to restrict roles to a specific journey
   */
  journeyContext?: string;
}