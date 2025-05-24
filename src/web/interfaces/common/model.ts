/**
 * @file model.ts
 * @description Common model interfaces shared across all domains in the AUSTA SuperApp.
 * These interfaces ensure consistent data structures for common concepts throughout the application.
 */

/**
 * Base entity interface with common fields for all entities in the system.
 * Provides standardized properties for identification and timestamps.
 */
export interface BaseEntity {
  /**
   * Unique identifier for the entity, typically a UUID
   */
  id: string;

  /**
   * Timestamp when the entity was created
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  createdAt: string;

  /**
   * Timestamp when the entity was last updated
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  updatedAt: string;
}

/**
 * Interface for entities that are owned by a user.
 * Extends BaseEntity with user ownership information.
 */
export interface UserOwnedEntity extends BaseEntity {
  /**
   * ID of the user who owns this entity
   */
  userId: string;
}

/**
 * Interface for entities with audit information.
 * Tracks who created and last updated the entity.
 */
export interface AuditedEntity extends BaseEntity {
  /**
   * ID of the user who created this entity
   */
  createdBy: string;

  /**
   * ID of the user who last updated this entity
   */
  updatedBy: string;
}

/**
 * Interface for entities that are both user-owned and audited.
 * Combines UserOwnedEntity and AuditedEntity.
 */
export interface UserOwnedAuditedEntity extends UserOwnedEntity, AuditedEntity {}

/**
 * Interface for pagination parameters in API requests.
 * Used for consistent pagination across all API endpoints.
 */
export interface PaginationParams {
  /**
   * Page number (1-based indexing)
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   * @default 20
   */
  limit?: number;
}

/**
 * Interface for paginated response data.
 * Used for consistent response structure across all API endpoints.
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  items: T[];

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Current page number (1-based indexing)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of pages
   */
  pages: number;

  /**
   * Whether there is a next page available
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page available
   */
  hasPrevious: boolean;
}

/**
 * Sort direction options for API requests.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Interface for sorting parameters in API requests.
 * Used for consistent sorting across all API endpoints.
 */
export interface SortParams {
  /**
   * Field to sort by
   */
  sortBy: string;

  /**
   * Sort direction (ascending or descending)
   */
  sortDirection: SortDirection;
}

/**
 * Interface for filtering parameters in API requests.
 * Used for consistent filtering across all API endpoints.
 */
export interface FilterParams {
  /**
   * Filter criteria as key-value pairs
   * Keys are field names, values are the filter values
   */
  [key: string]: string | number | boolean | string[] | number[] | null;
}

/**
 * Interface for API query parameters combining pagination, sorting, and filtering.
 * Used for consistent query parameter structure across all API endpoints.
 */
export interface QueryParams extends PaginationParams, Partial<SortParams> {
  /**
   * Filter criteria
   */
  filters?: FilterParams;
}

/**
 * Interface for API response metadata.
 * Provides additional context about the response.
 */
export interface ResponseMetadata {
  /**
   * Timestamp when the response was generated
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  timestamp: string;

  /**
   * Request ID for tracing and debugging
   */
  requestId?: string;

  /**
   * Additional metadata specific to the response
   */
  [key: string]: any;
}

/**
 * Interface for standard API response structure.
 * Ensures consistent response format across all API endpoints.
 */
export interface ApiResponse<T> {
  /**
   * Response data
   */
  data: T;

  /**
   * Response metadata
   */
  meta: ResponseMetadata;
}

/**
 * Interface for error response structure.
 * Ensures consistent error format across all API endpoints.
 */
export interface ErrorResponse {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Detailed error information (optional)
   */
  details?: any;

  /**
   * Response metadata
   */
  meta: ResponseMetadata;
}

/**
 * Interface for soft-deleted entities.
 * Extends BaseEntity with deletion information.
 */
export interface SoftDeletedEntity extends BaseEntity {
  /**
   * Whether the entity has been deleted
   */
  isDeleted: boolean;

  /**
   * Timestamp when the entity was deleted (if applicable)
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  deletedAt?: string;

  /**
   * ID of the user who deleted this entity (if applicable)
   */
  deletedBy?: string;
}

/**
 * Interface for entities with version tracking.
 * Useful for optimistic concurrency control.
 */
export interface VersionedEntity extends BaseEntity {
  /**
   * Version number, incremented on each update
   */
  version: number;
}

/**
 * Interface for entities with status tracking.
 * Provides a standardized way to track entity status.
 */
export interface StatusEntity<T extends string = string> extends BaseEntity {
  /**
   * Current status of the entity
   */
  status: T;

  /**
   * Timestamp when the status was last updated
   * ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
   */
  statusUpdatedAt: string;
}