import { IBaseEntity } from '@austa/interfaces/common';

/**
 * Interface representing a permission in the AUSTA SuperApp.
 * 
 * Permissions follow a hierarchical format: journey:resource:action
 * Examples:
 * - health:metrics:read - View health metrics
 * - care:appointment:create - Schedule appointments
 * - plan:claim:submit - Submit insurance claims
 */
export interface IPermission extends IBaseEntity {
  /**
   * Unique identifier for the permission
   */
  id: number;

  /**
   * Name of the permission
   * Can be in the format journey:resource:action or a simple string
   */
  name: string;

  /**
   * Human-readable description of what the permission allows
   */
  description: string;

  /**
   * Optional journey identifier (health, care, plan)
   * Represents which user journey this permission belongs to
   */
  journey?: string;

  /**
   * Optional resource identifier
   * Represents the specific resource within a journey that this permission affects
   * Examples: metrics, appointment, claim
   */
  resource?: string;

  /**
   * Optional action identifier
   * Represents the allowed action on the resource
   * Examples: read, create, update, delete, submit
   */
  action?: string;
}