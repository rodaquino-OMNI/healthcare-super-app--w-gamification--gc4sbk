/**
 * @file model.ts
 * @description Common model interfaces shared across all domains in the AUSTA SuperApp.
 * These interfaces provide consistent data structures for common concepts throughout the application.
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
   * ISO timestamp when the entity was created
   */
  createdAt: string;

  /**
   * ISO timestamp when the entity was last updated
   */
  updatedAt: string;
}

/**
 * Interface for entities that are owned by a specific user.
 * Extends BaseEntity to include user ownership information.
 */
export interface UserOwned extends BaseEntity {
  /**
   * ID of the user who owns this entity
   */
  userId: string;
}

/**
 * Interface for entities that track who created and updated them.
 * Provides audit trail capabilities for sensitive data.
 */
export interface Auditable extends BaseEntity {
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
 * Interface for paginated API responses.
 * Ensures consistent pagination structure across all API endpoints.
 */
export interface PaginatedResponse<T> {
  /**
   * Array of items for the current page
   */
  data: T[];

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Current page number (1-based)
   */
  page: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Whether there is a next page available
   */
  hasNextPage: boolean;

  /**
   * Whether there is a previous page available
   */
  hasPreviousPage: boolean;
}

/**
 * Interface for pagination parameters in API requests.
 * Used for standardizing pagination inputs across all API endpoints.
 */
export interface PaginationParams {
  /**
   * Page number to retrieve (1-based)
   */
  page?: number;

  /**
   * Number of items per page
   */
  limit?: number;
}

/**
 * Sort direction options for API requests.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Interface for sorting options in API requests.
 * Provides a consistent way to specify sorting across all API endpoints.
 */
export interface SortOptions {
  /**
   * Field to sort by
   */
  field: string;

  /**
   * Direction to sort (ascending or descending)
   */
  direction: SortDirection;
}

/**
 * Filter operators for API requests.
 */
export type FilterOperator = 
  | 'eq'      // equals
  | 'neq'     // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains' // string contains
  | 'starts'   // string starts with
  | 'ends'     // string ends with
  | 'between'  // between two values
  | 'exists'   // field exists
  | 'notExists'; // field does not exist

/**
 * Interface for a single filter condition in API requests.
 * Provides a consistent way to specify filtering across all API endpoints.
 */
export interface FilterCondition {
  /**
   * Field to filter on
   */
  field: string;

  /**
   * Operator to apply
   */
  operator: FilterOperator;

  /**
   * Value to compare against (type depends on the field and operator)
   */
  value: any;
}

/**
 * Interface for filter options in API requests.
 * Supports both simple filtering and complex logical operations.
 */
export interface FilterOptions {
  /**
   * Array of filter conditions to apply (combined with AND logic)
   */
  conditions: FilterCondition[];

  /**
   * Optional nested OR filters
   */
  or?: FilterOptions[];

  /**
   * Optional nested AND filters
   */
  and?: FilterOptions[];
}

/**
 * Interface for API query parameters that include pagination, sorting, and filtering.
 * Provides a standardized way to handle data retrieval across all API endpoints.
 */
export interface QueryParams extends PaginationParams {
  /**
   * Optional sorting configuration
   */
  sort?: SortOptions | SortOptions[];

  /**
   * Optional filtering configuration
   */
  filter?: FilterOptions;
}

/**
 * Interface for soft-deleted entities.
 * Extends BaseEntity to include deletion information.
 */
export interface SoftDeleteable extends BaseEntity {
  /**
   * Whether the entity has been soft-deleted
   */
  isDeleted: boolean;

  /**
   * ISO timestamp when the entity was deleted (if applicable)
   */
  deletedAt?: string;

  /**
   * ID of the user who deleted this entity (if applicable)
   */
  deletedBy?: string;
}

/**
 * Interface for entities that can be activated or deactivated.
 * Useful for resources that need to be temporarily disabled without deletion.
 */
export interface Activatable extends BaseEntity {
  /**
   * Whether the entity is currently active
   */
  isActive: boolean;

  /**
   * ISO timestamp when the entity was last activated or deactivated
   */
  statusChangedAt?: string;

  /**
   * ID of the user who last changed the active status
   */
  statusChangedBy?: string;
}

/**
 * Interface for entities that have a version history.
 * Useful for tracking changes to important resources over time.
 */
export interface Versionable extends BaseEntity {
  /**
   * Current version number of the entity
   */
  version: number;

  /**
   * Optional reference to previous version ID
   */
  previousVersionId?: string;
}

/**
 * Interface for entities that can be tagged with metadata.
 * Provides a flexible way to add arbitrary metadata to entities.
 */
export interface Taggable extends BaseEntity {
  /**
   * Map of key-value pairs for entity metadata
   */
  metadata: Record<string, any>;

  /**
   * Optional array of string tags associated with the entity
   */
  tags?: string[];
}