/**
 * Common utility interfaces used across all auth-service modules.
 * These interfaces provide standardized patterns for pagination, sorting,
 * filtering, and data transformation throughout the service.
 *
 * This file is part of the AUSTA SuperApp refactoring to address critical
 * build failures and architectural issues while preserving the platform's
 * key technical capabilities.
 *
 * @module interfaces/common
 */

import { SortDirection, PaginationOptions as SharedPaginationOptions, FilterOperator as SharedFilterOperator } from '@austa/interfaces/common';
import { BaseEntity as SharedBaseEntity } from '@austa/interfaces/common/model';

/**
 * Standard pagination parameters for all paginated API endpoints.
 * Extends the shared pagination options from @austa/interfaces.
 */
export interface PaginationParams extends SharedPaginationOptions {
  /** Current page number (1-based indexing) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Optional cursor for cursor-based pagination */
  cursor?: string;
  /** Whether to include soft-deleted items */
  includeDeleted?: boolean;
}

/**
 * Pagination metadata returned with paginated responses.
 */
export interface PaginationMeta {
  /** Current page number */
  currentPage: number;
  /** Number of items per page */
  itemsPerPage: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a previous page available */
  hasPreviousPage: boolean;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Cursor for the next page (if using cursor-based pagination) */
  nextCursor?: string;
  /** Cursor for the previous page (if using cursor-based pagination) */
  prevCursor?: string;
}

/**
 * Generic paginated result containing items and pagination metadata.
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Sorting parameter for a single field.
 */
export interface SortParam {
  /** Field name to sort by */
  field: string;
  /** Sort direction (asc or desc) */
  direction: SortDirection;
}

/**
 * Sorting options for API requests.
 */
export interface SortOptions {
  /** Array of sort parameters in priority order */
  sort: SortParam[];
}

/**
 * Filter operator types for constructing query filters.
 * Re-exports the shared FilterOperator from @austa/interfaces for consistency.
 */
export { SharedFilterOperator as FilterOperator };

/**
 * Single filter condition for a field.
 */
export interface FilterCondition {
  /** Field name to filter on */
  field: string;
  /** Filter operator to apply */
  operator: FilterOperator;
  /** Value to compare against (not required for IS_NULL/IS_NOT_NULL) */
  value?: any;
}

/**
 * Logical filter group with AND/OR conditions.
 */
export interface FilterGroup {
  /** Logical operator for the group */
  type: 'AND' | 'OR';
  /** Array of filter conditions or nested filter groups */
  filters: (FilterCondition | FilterGroup)[];
}

/**
 * Filter options for API requests.
 */
export interface FilterOptions {
  /** Root filter group or single filter condition */
  filter: FilterCondition | FilterGroup;
}

/**
 * Combined query options for API requests.
 */
export interface QueryOptions extends Partial<PaginationParams>, Partial<SortOptions>, Partial<FilterOptions> {
  /** Optional search term for full-text search */
  search?: string;
  /** Fields to search in when using search parameter */
  searchFields?: string[];
  /** Whether to use exact matching for search (default: false) */
  exactMatch?: boolean;
  /** Whether to include related entities */
  include?: string[];
  /** Whether to select specific fields only */
  select?: string[];
}

/**
 * Data transformation options for API responses.
 */
export interface TransformOptions {
  /** Whether to exclude null or undefined values */
  excludeNulls?: boolean;
  /** Array of fields to exclude from the response */
  exclude?: string[];
  /** Array of fields to include in the response (if specified, other fields are excluded) */
  include?: string[];
  /** Whether to convert snake_case to camelCase */
  camelCase?: boolean;
  /** Whether to convert dates to ISO strings */
  dateToISOString?: boolean;
  /** Whether to apply journey-specific transformations */
  applyJourneyTransforms?: boolean;
  /** Whether to expose sensitive fields (requires appropriate permissions) */
  exposeSensitiveFields?: boolean;
  /** Custom transformation function */
  transform?: (data: any) => any;
}

/**
 * Interface for cache options.
 */
export interface CacheOptions {
  /** TTL (Time To Live) in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
  /** Whether to use cache */
  useCache?: boolean;
  /** Whether to invalidate cache on update */
  invalidateOnUpdate?: boolean;
  /** Tags for cache invalidation */
  tags?: string[];
}

/**
 * Interface for entities that can be soft-deleted.
 */
export interface SoftDeleteEntity {
  /** Whether the entity is deleted */
  isDeleted: boolean;
  /** When the entity was deleted */
  deletedAt: Date | null;
}

/**
 * Interface for entities with version control.
 */
export interface VersionedEntity {
  /** Current version number */
  version: number;
}

/**
 * Interface for entities with audit information.
 */
export interface AuditableEntity {
  /** ID of the user who created the entity */
  createdBy: string;
  /** When the entity was created */
  createdAt: Date;
  /** ID of the user who last updated the entity */
  updatedBy: string | null;
  /** When the entity was last updated */
  updatedAt: Date | null;
}

/**
 * Interface for entities with tenant isolation.
 */
export interface TenantEntity {
  /** ID of the tenant that owns this entity */
  tenantId: string;
}

/**
 * Journey types supported by the AUSTA SuperApp.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  COMMON = 'common'
}

/**
 * Interface for entities with journey context.
 */
export interface JourneyEntity {
  /** Journey type this entity belongs to */
  journeyType: JourneyType;
}

/**
 * Base entity interface combining common entity patterns.
 * Extends the shared BaseEntity from @austa/interfaces and adds auth-service specific properties.
 */
export interface BaseEntity extends SharedBaseEntity, Partial<SoftDeleteEntity>, Partial<VersionedEntity>, Partial<AuditableEntity>, Partial<TenantEntity>, Partial<JourneyEntity> {}

/**
 * Type for ID parameters in route handlers.
 */
export interface IdParam {
  /** Entity ID parameter */
  id: string;
}

/**
 * Interface for request context with user information.
 */
export interface RequestContext {
  /** ID of the user making the request */
  userId: string;
  /** Roles assigned to the user */
  roles: string[];
  /** Permissions granted to the user */
  permissions: string[];
  /** ID of the tenant the user belongs to */
  tenantId?: string;
  /** Additional context metadata */
  metadata?: Record<string, any>;
}

/**
 * Interface for bulk operation results.
 */
export interface BulkOperationResult<T> {
  /** Successfully processed items */
  succeeded: T[];
  /** Failed items with error information */
  failed: Array<{
    /** The item that failed */
    item: Partial<T>;
    /** Error message */
    error: string;
    /** Error code */
    code?: string;
  }>;
  /** Total count of succeeded items */
  totalSucceeded: number;
  /** Total count of failed items */
  totalFailed: number;
}