/**
 * @file Permission entity for the AUSTA SuperApp authentication system
 * @module auth-service/permissions/entities
 */

import { IPermission } from '@austa/interfaces/auth';

/**
 * Entity representing a permission in the system
 * 
 * Permissions follow the format journey:resource:action
 * Examples: health:metrics:read, care:appointment:create, plan:claim:submit
 */
export class Permission implements IPermission {
  /**
   * Unique identifier for the permission
   */
  id: number;

  /**
   * Name of the permission in the format journey:resource:action
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description: string;

  /**
   * The journey this permission belongs to (health, care, plan)
   */
  journey: string;

  /**
   * The resource this permission applies to (metrics, appointments, claims, etc.)
   */
  resource: string;

  /**
   * The action this permission allows (read, create, update, delete, etc.)
   */
  action: string;

  /**
   * Timestamp of when the permission was created
   */
  createdAt?: Date;

  /**
   * Timestamp of when the permission was last updated
   */
  updatedAt?: Date;

  /**
   * Creates a new Permission instance
   * 
   * @param partial Partial permission data to initialize the instance with
   */
  constructor(partial?: Partial<Permission>) {
    if (partial) {
      Object.assign(this, partial);
      
      // Parse journey, resource, and action from name if provided
      if (partial.name && !partial.journey) {
        const [journey, resource, action] = partial.name.split(':');
        this.journey = journey;
        this.resource = resource;
        this.action = action;
      }
      // Construct name from journey, resource, and action if not provided
      else if (!partial.name && partial.journey && partial.resource && partial.action) {
        this.name = `${partial.journey}:${partial.resource}:${partial.action}`;
      }
    }
  }

  /**
   * Validates if the permission name follows the correct format
   * 
   * @returns True if the permission name is valid, false otherwise
   */
  isValid(): boolean {
    const parts = this.name.split(':');
    return parts.length === 3 && parts.every(part => part.trim().length > 0);
  }

  /**
   * Creates a permission from journey, resource, and action
   * 
   * @param journey The journey this permission belongs to
   * @param resource The resource this permission applies to
   * @param action The action this permission allows
   * @param description Optional description of the permission
   * @returns A new Permission instance
   */
  static fromParts(journey: string, resource: string, action: string, description?: string): Permission {
    const name = `${journey}:${resource}:${action}`;
    return new Permission({
      name,
      journey,
      resource,
      action,
      description: description || `Permission to ${action} ${resource} in ${journey} journey`
    });
  }
}