/**
 * @file Permission interfaces for the AUSTA SuperApp
 * @module @austa/interfaces/auth/permission
 * 
 * This file defines the permission interfaces that are shared across all services
 * in the AUSTA SuperApp. It provides standardized structures for permission data
 * used in the role-based access control system.
 * 
 * These interfaces support the journey-centered architecture by providing
 * consistent permission structures that can be used across all three user journeys
 * ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 * 
 * @see {@link ../role.interface.ts} - For role interfaces that use these permission interfaces
 * @see {@link ../user.interface.ts} - For user interfaces that are associated with roles and permissions
 */

/**
 * Represents a permission entity in the system.
 * Permissions define granular access control capabilities that can be assigned to roles.
 * 
 * This interface is used across all services that implement or check permissions,
 * ensuring consistent permission handling throughout the application.
 * 
 * Permissions follow a hierarchical format: journey:resource:action
 * Examples:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 */
/**
 * Type alias for permission ID to ensure consistent typing across the application
 */
export type PermissionId = number;

/**
 * Interface for permission relationships with roles
 */
export interface IPermissionRole {
  /**
   * ID of the permission
   */
  permissionId: PermissionId;
  
  /**
   * ID of the role
   */
  roleId: number;
}

export interface IPermission {
  /**
   * Unique identifier for the permission.
   * This property is immutable after creation.
   */
  readonly id: PermissionId;

  /**
   * Name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description: string;
  
  /**
   * Timestamp of when the permission was created.
   * This property is immutable after creation.
   */
  readonly createdAt?: Date;

  /**
   * Timestamp of when the permission was last updated.
   */
  updatedAt?: Date;
}

/**
 * Data transfer object for creating a new permission.
 * Used in API requests to create permissions across all services.
 */
export interface CreatePermissionDto {
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
 * Data transfer object for updating an existing permission.
 * Used in API requests to update permissions across all services.
 */
export interface UpdatePermissionDto {
  /**
   * Updated name of the permission in the format journey:resource:action
   * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
   */
  name?: string;

  /**
   * Updated human-readable description of what the permission allows
   */
  description?: string;
}

/**
 * Data transfer object for permission responses in API calls.
 * Contains all permission data that is safe to expose to clients.
 * Used consistently across all services that return permission data.
 */
/**
 * Interface for bulk permission operations
 */
export interface BulkPermissionOperationDto {
  /**
   * Array of permission IDs to operate on
   */
  permissionIds: PermissionId[];
}

export interface PermissionResponseDto {
  /**
   * Unique identifier for the permission
   */
  id: PermissionId;

  /**
   * Name of the permission in the format journey:resource:action
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description: string;

  /**
   * The journey this permission is associated with, extracted from the name
   * (e.g., 'health', 'care', 'plan')
   */
  journey?: string;

  /**
   * The resource this permission is associated with, extracted from the name
   * (e.g., 'metrics', 'appointment', 'claim')
   */
  resource?: string;

  /**
   * The action this permission allows, extracted from the name
   * (e.g., 'read', 'create', 'submit')
   */
  action?: string;
  
  /**
   * Timestamp of when the permission was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the permission was last updated
   */
  updatedAt?: Date;
}