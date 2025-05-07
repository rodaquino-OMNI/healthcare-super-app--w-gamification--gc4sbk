import { IBaseEntity } from '@austa/interfaces/common';
import { IPermission } from '@app/auth/permissions/interfaces/permission.interface';

/**
 * Interface representing a role in the AUSTA SuperApp.
 * Roles are used for role-based access control across all journeys.
 * 
 * This interface supports the journey-centered architecture by allowing
 * roles to be scoped to specific journeys ("Minha Saúde", "Cuidar-me Agora",
 * and "Meu Plano & Benefícios").
 */
export interface IRole extends IBaseEntity {
  /**
   * Unique identifier for the role
   */
  id: number;

  /**
   * Name of the role
   * Can be in the format journey:roleName (e.g., health:admin, care:provider)
   * or a global role (e.g., admin, user)
   */
  name: string;

  /**
   * Human-readable description of the role's purpose and permissions
   */
  description: string;

  /**
   * Optional journey identifier (health, care, plan)
   * Represents which user journey this role belongs to
   * If not specified, the role is considered global across all journeys
   */
  journey?: string;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault?: boolean;

  /**
   * Permissions assigned to this role
   * Optional as permissions might be loaded separately from the role entity
   */
  permissions?: IPermission[];
}

/**
 * Interface representing a permission in the role-based access control system.
 * Permissions define what actions can be performed on which resources.
 * 
 * This interface supports the journey-centered architecture by allowing
 * permissions to be scoped to specific journeys and resources within those journeys.
 */
export interface IRolePermission {
  /**
   * The role that has this permission
   */
  roleId: number;

  /**
   * The permission granted to the role
   */
  permissionId: number;

  /**
   * Optional journey identifier (health, care, plan)
   * Represents which user journey this permission applies to
   */
  journey?: string;

  /**
   * Optional resource identifier within the journey
   */
  resource?: string;

  /**
   * Optional conditions or constraints on when this permission applies
   * Can be used for attribute-based access control
   */
  conditions?: Record<string, unknown>;
}

/**
 * Interface representing the assignment of a role to a user.
 * Maps users to roles for role-based access control.
 */
export interface IRoleAssignment {
  /**
   * The user who has been assigned this role
   */
  userId: string;

  /**
   * The role assigned to the user
   */
  roleId: number;

  /**
   * When the role was assigned to the user
   */
  assignedAt: Date;

  /**
   * Optional expiration date for temporary role assignments
   */
  expiresAt?: Date;

  /**
   * Optional journey identifier (health, care, plan)
   * If specified, the role is only applicable within this journey
   */
  journey?: string;

  /**
   * Optional metadata about the role assignment
   * Can include information about who assigned the role, why, etc.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for hierarchical role structures.
 * Enables role inheritance where child roles inherit permissions from parent roles.
 */
export interface IRoleHierarchy {
  /**
   * The parent role in the hierarchy
   */
  parentRoleId: number;

  /**
   * The child role that inherits permissions from the parent
   */
  childRoleId: number;

  /**
   * Optional journey identifier (health, care, plan)
   * If specified, the inheritance only applies within this journey
   */
  journey?: string;
}

/**
 * Type representing the format of role names.
 * Roles can be global or journey-specific.
 * 
 * Examples:
 * - 'admin' - Global administrator role
 * - 'user' - Basic user role
 * - 'health:admin' - Health journey administrator
 * - 'care:provider' - Care journey provider role
 * - 'plan:manager' - Plan journey manager role
 */
export type RoleName = string;

/**
 * Type representing the possible journey identifiers.
 * These correspond to the three main user journeys in the AUSTA SuperApp.
 */
export type JourneyType = 'health' | 'care' | 'plan' | string;

/**
 * Interface for role-based access control checks.
 * Used by guards and decorators to verify if a user has the required roles.
 */
export interface IRoleCheck {
  /**
   * Checks if a user has any of the specified roles
   * @param userId The ID of the user to check
   * @param roles Array of role names to check against
   * @returns Promise resolving to true if the user has any of the roles, false otherwise
   */
  hasAnyRole(userId: string, roles: RoleName[]): Promise<boolean>;

  /**
   * Checks if a user has all of the specified roles
   * @param userId The ID of the user to check
   * @param roles Array of role names to check against
   * @returns Promise resolving to true if the user has all of the roles, false otherwise
   */
  hasAllRoles(userId: string, roles: RoleName[]): Promise<boolean>;

  /**
   * Checks if a user has a specific role within a journey
   * @param userId The ID of the user to check
   * @param role The role name to check
   * @param journey The journey to check the role within
   * @returns Promise resolving to true if the user has the role in the journey, false otherwise
   */
  hasJourneyRole(userId: string, role: RoleName, journey: JourneyType): Promise<boolean>;
}