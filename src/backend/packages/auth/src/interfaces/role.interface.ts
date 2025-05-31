/**
 * Role and permission interfaces for authorization across the AUSTA SuperApp.
 * These interfaces support role-based and permission-based authorization
 * for all journeys (Health, Care, Plan) and cross-journey functionality.
 */

/**
 * Enum representing the different journey types in the application.
 * Used for journey-specific role assignments and permissions.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global' // For roles that apply across all journeys
}

/**
 * Interface representing a permission entity.
 * Permissions define specific actions that can be performed within the application.
 */
export interface IPermission {
  /**
   * Unique identifier for the permission.
   */
  id: number;

  /**
   * Name of the permission, typically in the format 'resource:action'.
   * Examples: 'health:read', 'care:write', 'plan:delete'.
   */
  name: string;

  /**
   * Description of what the permission allows.
   */
  description: string;

  /**
   * The journey this permission is associated with.
   * Can be HEALTH, CARE, PLAN, or GLOBAL for cross-journey permissions.
   */
  journeyType: JourneyType;

  /**
   * Creation timestamp.
   */
  createdAt?: Date;

  /**
   * Last update timestamp.
   */
  updatedAt?: Date;
}

/**
 * Interface representing a role entity.
 * Roles are collections of permissions that can be assigned to users.
 */
export interface IRole {
  /**
   * Unique identifier for the role.
   */
  id: number;

  /**
   * Name of the role.
   * Examples: 'Admin', 'HealthUser', 'CareProvider', 'PlanManager'.
   */
  name: string;

  /**
   * Description of the role and its responsibilities.
   */
  description?: string;

  /**
   * The journey this role is associated with.
   * Can be HEALTH, CARE, PLAN, or GLOBAL for cross-journey roles.
   */
  journeyType: JourneyType;

  /**
   * List of permissions associated with this role.
   */
  permissions?: IPermission[];

  /**
   * Creation timestamp.
   */
  createdAt?: Date;

  /**
   * Last update timestamp.
   */
  updatedAt?: Date;
}

/**
 * Interface representing a user-role assignment.
 * This associates a user with a specific role in the system.
 */
export interface IUserRole {
  /**
   * Unique identifier for the user-role assignment.
   */
  id: number;

  /**
   * ID of the user.
   */
  userId: number;

  /**
   * ID of the role.
   */
  roleId: number;

  /**
   * The journey this user-role assignment is associated with.
   */
  journeyType: JourneyType;

  /**
   * Creation timestamp.
   */
  createdAt?: Date;

  /**
   * Last update timestamp.
   */
  updatedAt?: Date;
}

/**
 * Type for health journey specific roles.
 * These roles are only applicable within the Health journey.
 */
export type HealthRole = IRole & { journeyType: JourneyType.HEALTH };

/**
 * Type for care journey specific roles.
 * These roles are only applicable within the Care journey.
 */
export type CareRole = IRole & { journeyType: JourneyType.CARE };

/**
 * Type for plan journey specific roles.
 * These roles are only applicable within the Plan journey.
 */
export type PlanRole = IRole & { journeyType: JourneyType.PLAN };

/**
 * Type for global roles that apply across all journeys.
 * These roles provide permissions that span multiple journeys.
 */
export type GlobalRole = IRole & { journeyType: JourneyType.GLOBAL };