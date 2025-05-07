/**
 * @file Role entity for the AUSTA SuperApp authentication system
 * @module auth-service/roles/entities
 */

import { IRole } from '@austa/interfaces/auth';
import { Permission } from '@app/permissions/entities/permission.entity';

/**
 * Entity representing a role in the system
 * 
 * Roles are used to group permissions and assign them to users
 * They can be journey-specific or global across the application
 */
export class Role implements IRole {
  /**
   * Unique identifier for the role
   */
  id: string;

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
  journey: string | null;

  /**
   * Indicates if this is a default role assigned to new users
   */
  isDefault: boolean;

  /**
   * Permissions assigned to this role
   * This is a many-to-many relationship with the Permission entity
   */
  permissions?: Permission[];

  /**
   * Timestamp of when the role was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the role was last updated
   */
  updatedAt?: Date;

  /**
   * Creates a new Role instance
   * 
   * @param partial Partial role data to initialize the instance with
   */
  constructor(partial?: Partial<Role>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Checks if this role is a global role (not journey-specific)
   * 
   * @returns True if this is a global role, false otherwise
   */
  isGlobal(): boolean {
    return this.journey === null;
  }

  /**
   * Checks if this role belongs to a specific journey
   * 
   * @param journeyName The journey name to check against
   * @returns True if this role belongs to the specified journey, false otherwise
   */
  belongsToJourney(journeyName: string): boolean {
    return this.journey === journeyName;
  }

  /**
   * Checks if this role has a specific permission
   * 
   * @param permissionName The permission name to check for
   * @returns True if this role has the specified permission, false otherwise
   */
  hasPermission(permissionName: string): boolean {
    if (!this.permissions) {
      return false;
    }
    
    return this.permissions.some(permission => permission.name === permissionName);
  }

  /**
   * Creates a default role for a specific journey
   * 
   * @param journeyName The journey name for which to create a default role
   * @returns A new Role instance configured as a default role for the specified journey
   */
  static createDefaultForJourney(journeyName: string): Role {
    return new Role({
      name: `${journeyName.charAt(0).toUpperCase() + journeyName.slice(1)}User`,
      description: `Default role for users of the ${journeyName} journey`,
      journey: journeyName,
      isDefault: true
    });
  }
}