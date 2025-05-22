/**
 * @file query.types.ts
 * @description Provides TypeScript interfaces and types for database query operations,
 * including filtering, sorting, pagination, and projection. These types ensure consistent
 * query patterns across all journey services and enable strongly-typed query parameters
 * that prevent errors at compile time rather than runtime.
 */

import { JourneyId } from './journey.types';

// -----------------------------------------------------------------------------
// Base Query Types
// -----------------------------------------------------------------------------

/**
 * Base interface for all query parameters
 * Provides common functionality that all query parameter types must implement
 */
export interface BaseQueryParams {
  /**
   * Optional filter criteria for the query
   */
  filter?: FilterParams;

  /**
   * Optional sorting criteria for the query
   */
  sort?: SortParams;

  /**
   * Optional pagination parameters for the query
   */
  pagination?: PaginationParams;

  /**
   * Optional projection parameters for the query
   * Specifies which fields to include or exclude from the results
   */
  projection?: ProjectionParams;

  /**
   * Optional journey ID to scope the query to a specific journey
   */
  journeyId?: JourneyId;

  /**
   * Optional user ID to scope the query to a specific user
   */
  userId?: string;

  /**
   * Optional flag to include soft-deleted records in the results
   * @default false
   */
  includeSoftDeleted?: boolean;

  /**
   * Optional flag to include related entities in the results
   * @default false
   */
  includeRelations?: boolean;

  /**
   * Optional list of relation paths to include
   * Only used if includeRelations is true
   * Example: ['user', 'user.profile', 'comments']
   */
  relations?: string[];

  /**
   * Optional query timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Optional flag to use a read replica for the query if available
   * @default false
   */
  useReadReplica?: boolean;

  /**
   * Optional query name for logging and monitoring
   */
  queryName?: string;

  /**
   * Optional metadata for the query
   */
  metadata?: Record<string, any>;
}

// -----------------------------------------------------------------------------
// Filtering Types
// -----------------------------------------------------------------------------

/**
 * Comparison operators for filter conditions
 */
export enum ComparisonOperator {
  /**
   * Equal to (=)
   */
  EQ = 'eq',

  /**
   * Not equal to (!=)
   */
  NE = 'ne',

  /**
   * Greater than (>)
   */
  GT = 'gt',

  /**
   * Greater than or equal to (>=)
   */
  GTE = 'gte',

  /**
   * Less than (<)
   */
  LT = 'lt',

  /**
   * Less than or equal to (<=)
   */
  LTE = 'lte',

  /**
   * In array of values
   */
  IN = 'in',

  /**
   * Not in array of values
   */
  NOT_IN = 'notIn',

  /**
   * Contains substring (case-sensitive)
   */
  CONTAINS = 'contains',

  /**
   * Contains substring (case-insensitive)
   */
  CONTAINS_I = 'containsI',

  /**
   * Starts with substring (case-sensitive)
   */
  STARTS_WITH = 'startsWith',

  /**
   * Starts with substring (case-insensitive)
   */
  STARTS_WITH_I = 'startsWithI',

  /**
   * Ends with substring (case-sensitive)
   */
  ENDS_WITH = 'endsWith',

  /**
   * Ends with substring (case-insensitive)
   */
  ENDS_WITH_I = 'endsWithI',

  /**
   * Is null
   */
  IS_NULL = 'isNull',

  /**
   * Is not null
   */
  IS_NOT_NULL = 'isNotNull',

  /**
   * Between two values (inclusive)
   */
  BETWEEN = 'between',

  /**
   * Matches regular expression
   */
  REGEX = 'regex',

  /**
   * Matches JSON path expression
   */
  JSON_PATH = 'jsonPath'
}

/**
 * Logical operators for combining filter conditions
 */
export enum LogicalOperator {
  /**
   * Logical AND - all conditions must be true
   */
  AND = 'and',

  /**
   * Logical OR - at least one condition must be true
   */
  OR = 'or',

  /**
   * Logical NOT - negates the condition
   */
  NOT = 'not'
}

/**
 * Base interface for all filter conditions
 */
export interface FilterCondition {
  /**
   * The field to filter on
   */
  field: string;

  /**
   * The operator to use for the filter condition
   */
  operator: ComparisonOperator;

  /**
   * The value to compare against
   * Type depends on the operator and field type
   */
  value: any;
}

/**
 * Interface for a filter condition that uses the BETWEEN operator
 */
export interface BetweenFilterCondition extends Omit<FilterCondition, 'value'> {
  /**
   * The operator must be BETWEEN
   */
  operator: ComparisonOperator.BETWEEN;

  /**
   * The minimum value (inclusive)
   */
  value: [any, any];
}

/**
 * Interface for a filter condition that uses the IN or NOT_IN operator
 */
export interface InFilterCondition extends Omit<FilterCondition, 'value'> {
  /**
   * The operator must be IN or NOT_IN
   */
  operator: ComparisonOperator.IN | ComparisonOperator.NOT_IN;

  /**
   * Array of values to check against
   */
  value: any[];
}

/**
 * Interface for a filter condition that uses the IS_NULL or IS_NOT_NULL operator
 */
export interface NullFilterCondition extends Omit<FilterCondition, 'value'> {
  /**
   * The operator must be IS_NULL or IS_NOT_NULL
   */
  operator: ComparisonOperator.IS_NULL | ComparisonOperator.IS_NOT_NULL;

  /**
   * Value is not used for IS_NULL and IS_NOT_NULL operators
   */
  value?: undefined;
}

/**
 * Interface for a filter condition that uses the REGEX operator
 */
export interface RegexFilterCondition extends Omit<FilterCondition, 'value'> {
  /**
   * The operator must be REGEX
   */
  operator: ComparisonOperator.REGEX;

  /**
   * Regular expression pattern as a string
   */
  value: string;

  /**
   * Regular expression flags
   * @example 'i' for case-insensitive matching
   */
  flags?: string;
}

/**
 * Interface for a filter condition that uses the JSON_PATH operator
 */
export interface JsonPathFilterCondition extends Omit<FilterCondition, 'value'> {
  /**
   * The operator must be JSON_PATH
   */
  operator: ComparisonOperator.JSON_PATH;

  /**
   * JSON path expression
   * @example '$.address.city'
   */
  path: string;

  /**
   * The value to compare against
   */
  value: any;

  /**
   * The comparison operator to use for the JSON path condition
   * @default ComparisonOperator.EQ
   */
  pathOperator?: ComparisonOperator;
}

/**
 * Type that represents any valid filter condition
 */
export type AnyFilterCondition =
  | FilterCondition
  | BetweenFilterCondition
  | InFilterCondition
  | NullFilterCondition
  | RegexFilterCondition
  | JsonPathFilterCondition;

/**
 * Interface for a logical group of filter conditions
 */
export interface FilterGroup {
  /**
   * The logical operator to apply to the conditions
   */
  operator: LogicalOperator;

  /**
   * The conditions to combine with the logical operator
   */
  conditions: Array<AnyFilterCondition | FilterGroup>;
}

/**
 * Interface for filter parameters
 * Can be a single condition, a logical group, or an array of conditions/groups
 */
export type FilterParams = AnyFilterCondition | FilterGroup | Array<AnyFilterCondition | FilterGroup>;

/**
 * Helper type for creating type-safe filter builders
 * @template T The entity type being filtered
 */
export type TypedFilterCondition<T> = {
  [K in keyof T]?: {
    [O in ComparisonOperator]?: O extends ComparisonOperator.BETWEEN
      ? [T[K], T[K]]
      : O extends ComparisonOperator.IN | ComparisonOperator.NOT_IN
      ? T[K][]
      : O extends ComparisonOperator.IS_NULL | ComparisonOperator.IS_NOT_NULL
      ? undefined
      : T[K];
  };
};

/**
 * Helper type for creating type-safe filter groups
 * @template T The entity type being filtered
 */
export type TypedFilterGroup<T> = {
  [K in LogicalOperator]?: Array<TypedFilterCondition<T> | TypedFilterGroup<T>>;
};

/**
 * Helper type for creating type-safe filter parameters
 * @template T The entity type being filtered
 */
export type TypedFilterParams<T> = TypedFilterCondition<T> | TypedFilterGroup<T>;

// -----------------------------------------------------------------------------
// Sorting Types
// -----------------------------------------------------------------------------

/**
 * Sort direction options
 */
export enum SortDirection {
  /**
   * Ascending order (A-Z, 0-9)
   */
  ASC = 'asc',

  /**
   * Descending order (Z-A, 9-0)
   */
  DESC = 'desc'
}

/**
 * Interface for a single sort criterion
 */
export interface SortCriterion {
  /**
   * The field to sort by
   */
  field: string;

  /**
   * The direction to sort in
   * @default SortDirection.ASC
   */
  direction?: SortDirection;

  /**
   * Whether to put null values first or last
   * @default true for ASC, false for DESC
   */
  nullsFirst?: boolean;

  /**
   * Optional flag to indicate case-insensitive sorting for string fields
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Interface for sort parameters
 * Can be a single criterion or an array of criteria
 */
export type SortParams = SortCriterion | SortCriterion[];

/**
 * Helper type for creating type-safe sort parameters
 * @template T The entity type being sorted
 */
export type TypedSortParams<T> = {
  [K in keyof T]?: SortDirection | {
    direction?: SortDirection;
    nullsFirst?: boolean;
    caseInsensitive?: boolean;
  };
} | Array<{
  [K in keyof T]?: SortDirection | {
    direction?: SortDirection;
    nullsFirst?: boolean;
    caseInsensitive?: boolean;
  };
}>;

// -----------------------------------------------------------------------------
// Pagination Types
// -----------------------------------------------------------------------------

/**
 * Base interface for all pagination parameters
 */
export interface BasePaginationParams {
  /**
   * The pagination strategy to use
   */
  strategy: 'offset' | 'cursor';
}

/**
 * Interface for offset-based pagination parameters
 */
export interface OffsetPaginationParams extends BasePaginationParams {
  /**
   * The pagination strategy must be 'offset'
   */
  strategy: 'offset';

  /**
   * The number of items to skip
   * @default 0
   */
  offset?: number;

  /**
   * The maximum number of items to return
   * @default 10
   */
  limit?: number;

  /**
   * The page number (1-based)
   * If provided, offset will be calculated as (page - 1) * limit
   */
  page?: number;
}

/**
 * Interface for cursor-based pagination parameters
 */
export interface CursorPaginationParams extends BasePaginationParams {
  /**
   * The pagination strategy must be 'cursor'
   */
  strategy: 'cursor';

  /**
   * The cursor to start from
   * This is typically an encoded value that represents a position in the result set
   */
  cursor?: string;

  /**
   * The maximum number of items to return
   * @default 10
   */
  limit?: number;

  /**
   * The direction to paginate in
   * @default 'forward'
   */
  direction?: 'forward' | 'backward';

  /**
   * The field to use as the cursor
   * If not provided, the primary key will be used
   */
  cursorField?: string;
}

/**
 * Type that represents any valid pagination parameters
 */
export type PaginationParams = OffsetPaginationParams | CursorPaginationParams;

/**
 * Interface for pagination metadata in query results
 */
export interface PaginationMeta {
  /**
   * The total number of items available
   */
  totalCount?: number;

  /**
   * The number of items returned in the current page
   */
  count: number;

  /**
   * Whether there are more items available
   */
  hasMore: boolean;

  /**
   * The cursor for the next page (cursor-based pagination only)
   */
  nextCursor?: string;

  /**
   * The cursor for the previous page (cursor-based pagination only)
   */
  previousCursor?: string;

  /**
   * The current page number (offset-based pagination only)
   */
  currentPage?: number;

  /**
   * The total number of pages available (offset-based pagination only)
   */
  totalPages?: number;

  /**
   * The number of items per page (both pagination types)
   */
  pageSize: number;
}

// -----------------------------------------------------------------------------
// Projection Types
// -----------------------------------------------------------------------------

/**
 * Projection mode for selecting fields
 */
export enum ProjectionMode {
  /**
   * Include only the specified fields
   */
  INCLUDE = 'include',

  /**
   * Exclude the specified fields
   */
  EXCLUDE = 'exclude'
}

/**
 * Interface for projection parameters
 */
export interface ProjectionParams {
  /**
   * The projection mode to use
   * @default ProjectionMode.INCLUDE
   */
  mode?: ProjectionMode;

  /**
   * The fields to include or exclude based on the mode
   */
  fields: string[];

  /**
   * Optional nested projections for related entities
   * Key is the relation path, value is the projection for that relation
   * @example { 'user': { mode: ProjectionMode.INCLUDE, fields: ['id', 'name'] } }
   */
  relations?: Record<string, ProjectionParams>;
}

/**
 * Helper type for creating type-safe projection parameters
 * @template T The entity type being projected
 */
export type TypedProjectionParams<T> = {
  mode?: ProjectionMode;
  fields: Array<keyof T>;
  relations?: {
    [K in keyof T]?: T[K] extends object ? TypedProjectionParams<T[K]> : never;
  };
};

// -----------------------------------------------------------------------------
// Composite Query Types
// -----------------------------------------------------------------------------

/**
 * Interface for a complete query with all parameter types
 * @template T The entity type being queried
 */
export interface TypedQueryParams<T> {
  /**
   * Filter parameters
   */
  filter?: TypedFilterParams<T>;

  /**
   * Sort parameters
   */
  sort?: TypedSortParams<T>;

  /**
   * Pagination parameters
   */
  pagination?: PaginationParams;

  /**
   * Projection parameters
   */
  projection?: TypedProjectionParams<T>;

  /**
   * Optional journey ID to scope the query to a specific journey
   */
  journeyId?: JourneyId;

  /**
   * Optional user ID to scope the query to a specific user
   */
  userId?: string;

  /**
   * Optional flag to include soft-deleted records in the results
   * @default false
   */
  includeSoftDeleted?: boolean;

  /**
   * Optional flag to include related entities in the results
   * @default false
   */
  includeRelations?: boolean;

  /**
   * Optional list of relation paths to include
   * Only used if includeRelations is true
   * Example: ['user', 'user.profile', 'comments']
   */
  relations?: string[];

  /**
   * Optional query timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Optional flag to use a read replica for the query if available
   * @default false
   */
  useReadReplica?: boolean;

  /**
   * Optional query name for logging and monitoring
   */
  queryName?: string;

  /**
   * Optional metadata for the query
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for query results with pagination metadata
 * @template T The entity type in the results
 */
export interface QueryResult<T> {
  /**
   * The items returned by the query
   */
  items: T[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;

  /**
   * Query execution metadata
   */
  metadata?: {
    /**
     * The time it took to execute the query in milliseconds
     */
    executionTimeMs: number;

    /**
     * Whether the query used a cache
     */
    fromCache?: boolean;

    /**
     * Whether the query used a read replica
     */
    fromReadReplica?: boolean;

    /**
     * The database used for the query
     */
    database?: string;

    /**
     * The journey ID associated with the query
     */
    journeyId?: JourneyId;

    /**
     * Additional query-specific metadata
     */
    [key: string]: any;
  };
}

/**
 * Interface for a query builder that constructs database queries
 * @template T The entity type being queried
 * @template R The result type of the query
 */
export interface QueryBuilder<T, R = T> {
  /**
   * Sets the filter parameters for the query
   * @param filter The filter parameters to use
   * @returns The query builder instance for chaining
   */
  filter(filter: TypedFilterParams<T>): QueryBuilder<T, R>;

  /**
   * Sets the sort parameters for the query
   * @param sort The sort parameters to use
   * @returns The query builder instance for chaining
   */
  sort(sort: TypedSortParams<T>): QueryBuilder<T, R>;

  /**
   * Sets the pagination parameters for the query
   * @param pagination The pagination parameters to use
   * @returns The query builder instance for chaining
   */
  paginate(pagination: PaginationParams): QueryBuilder<T, R>;

  /**
   * Sets the projection parameters for the query
   * @param projection The projection parameters to use
   * @returns The query builder instance for chaining
   */
  project(projection: TypedProjectionParams<T>): QueryBuilder<T, R>;

  /**
   * Sets the relations to include in the query results
   * @param relations The relation paths to include
   * @returns The query builder instance for chaining
   */
  include(relations: string[]): QueryBuilder<T, R>;

  /**
   * Sets the journey ID for the query
   * @param journeyId The journey ID to use
   * @returns The query builder instance for chaining
   */
  forJourney(journeyId: JourneyId): QueryBuilder<T, R>;

  /**
   * Sets the user ID for the query
   * @param userId The user ID to use
   * @returns The query builder instance for chaining
   */
  forUser(userId: string): QueryBuilder<T, R>;

  /**
   * Includes soft-deleted records in the query results
   * @returns The query builder instance for chaining
   */
  withSoftDeleted(): QueryBuilder<T, R>;

  /**
   * Sets the query to use a read replica if available
   * @returns The query builder instance for chaining
   */
  useReadReplica(): QueryBuilder<T, R>;

  /**
   * Sets the query timeout
   * @param timeoutMs The timeout in milliseconds
   * @returns The query builder instance for chaining
   */
  timeout(timeoutMs: number): QueryBuilder<T, R>;

  /**
   * Sets the query name for logging and monitoring
   * @param name The query name
   * @returns The query builder instance for chaining
   */
  withName(name: string): QueryBuilder<T, R>;

  /**
   * Sets additional metadata for the query
   * @param metadata The metadata to set
   * @returns The query builder instance for chaining
   */
  withMetadata(metadata: Record<string, any>): QueryBuilder<T, R>;

  /**
   * Executes the query and returns the results
   * @returns A promise that resolves to the query results
   */
  execute(): Promise<QueryResult<R>>;

  /**
   * Executes the query and returns the first result
   * @returns A promise that resolves to the first result or null if no results
   */
  executeGetFirst(): Promise<R | null>;

  /**
   * Executes the query and returns a single result
   * Throws an error if no results or multiple results are found
   * @returns A promise that resolves to the single result
   */
  executeGetOne(): Promise<R>;

  /**
   * Executes the query and returns the count of matching records
   * @returns A promise that resolves to the count
   */
  executeCount(): Promise<number>;

  /**
   * Executes the query and returns a boolean indicating if any matching records exist
   * @returns A promise that resolves to true if matching records exist, false otherwise
   */
  executeExists(): Promise<boolean>;

  /**
   * Gets the raw query parameters that would be used to execute the query
   * @returns The query parameters
   */
  getQueryParams(): TypedQueryParams<T>;

  /**
   * Converts the query to a raw database query string (for debugging)
   * @returns The raw query string
   */
  toQueryString(): string;
}

/**
 * Interface for a query executor that executes database queries
 * @template T The entity type being queried
 */
export interface QueryExecutor<T> {
  /**
   * Creates a new query builder for the entity type
   * @returns A new query builder instance
   */
  createQueryBuilder<R = T>(): QueryBuilder<T, R>;

  /**
   * Executes a query with the given parameters
   * @param params The query parameters
   * @returns A promise that resolves to the query results
   */
  executeQuery<R = T>(params: TypedQueryParams<T>): Promise<QueryResult<R>>;

  /**
   * Finds all entities matching the given parameters
   * @param params The query parameters
   * @returns A promise that resolves to an array of matching entities
   */
  findAll<R = T>(params?: TypedQueryParams<T>): Promise<R[]>;

  /**
   * Finds a single entity by its ID
   * @param id The entity ID
   * @param params Additional query parameters
   * @returns A promise that resolves to the entity or null if not found
   */
  findById<R = T>(id: string | number, params?: Omit<TypedQueryParams<T>, 'filter'>): Promise<R | null>;

  /**
   * Finds a single entity matching the given parameters
   * @param params The query parameters
   * @returns A promise that resolves to the entity or null if not found
   */
  findOne<R = T>(params: TypedQueryParams<T>): Promise<R | null>;

  /**
   * Counts entities matching the given parameters
   * @param params The query parameters
   * @returns A promise that resolves to the count
   */
  count(params?: TypedQueryParams<T>): Promise<number>;

  /**
   * Checks if any entities match the given parameters
   * @param params The query parameters
   * @returns A promise that resolves to true if matching entities exist, false otherwise
   */
  exists(params?: TypedQueryParams<T>): Promise<boolean>;
}