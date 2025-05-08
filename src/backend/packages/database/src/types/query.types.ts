/**
 * @file query.types.ts
 * @description Provides TypeScript interfaces and types for database query operations,
 * including filtering, sorting, pagination, and projection. These types ensure consistent
 * query patterns across all journey services and enable strongly-typed query parameters
 * that prevent errors at compile time rather than runtime.
 * 
 * @example
 * // Example of using these types to create a query
 * const query: QueryOptions = {
 *   filter: {
 *     filter: {
 *       operator: LogicalOperator.AND,
 *       conditions: [
 *         {
 *           field: 'status',
 *           operator: ComparisonOperator.EQUALS,
 *           value: 'active'
 *         },
 *         {
 *           field: 'createdAt',
 *           operator: ComparisonOperator.GREATER_THAN,
 *           value: new Date('2023-01-01')
 *         }
 *       ]
 *     },
 *     journeyContext: {
 *       journeyType: 'HEALTH'
 *     }
 *   },
 *   sort: {
 *     sorts: [
 *       { field: 'createdAt', direction: SortDirection.DESC }
 *     ]
 *   },
 *   pagination: {
 *     type: PaginationType.OFFSET,
 *     skip: 0,
 *     take: 10
 *   },
 *   select: {
 *     select: { id: true, name: true, status: true },
 *     include: { relatedItems: true }
 *   }
 * };
 * 
 * // Or using the utility functions
 * const query = QueryUtils.query({
 *   filter: {
 *     filter: QueryUtils.and([
 *       QueryUtils.equals('status', 'active'),
 *       QueryUtils.between('createdAt', new Date('2023-01-01'), new Date())
 *     ])
 *   },
 *   sort: {
 *     sorts: [QueryUtils.sort('createdAt', SortDirection.DESC)]
 *   },
 *   pagination: QueryUtils.offsetPagination(0, 10),
 *   journeyContext: QueryUtils.journeyContext('HEALTH')
 * });
 */

import { Prisma } from '@prisma/client';
import { JourneyType } from './journey.types';
import { z } from 'zod';

/**
 * Represents the context for journey-specific database operations.
 */
export interface JourneyContext {
  /** The type of journey (Health, Care, Plan) */
  journeyType: JourneyType;
  /** Optional journey-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Zod schema for validating journey context.
 */
export const journeyContextSchema = z.object({
  journeyType: z.enum(['HEALTH', 'CARE', 'PLAN'] as const),
  metadata: z.record(z.any()).optional(),
});

/**
 * Represents the direction for sorting operations.
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Represents how null values should be handled in sorting operations.
 */
export enum NullsPosition {
  FIRST = 'first',
  LAST = 'last',
}

/**
 * Zod schema for validating sort direction.
 */
export const sortDirectionSchema = z.enum([SortDirection.ASC, SortDirection.DESC]);

/**
 * Zod schema for validating nulls position.
 */
export const nullsPositionSchema = z.enum([NullsPosition.FIRST, NullsPosition.LAST]);

/**
 * Represents a single sort specification for a field.
 */
export interface SortSpec {
  /** The field to sort by */
  field: string;
  /** The direction to sort (ascending or descending) */
  direction: SortDirection;
  /** How to handle null values in sorting */
  nulls?: NullsPosition;
}

/**
 * Represents a complete sort configuration that can include multiple fields.
 */
export interface SortOptions {
  /** Array of sort specifications in priority order */
  sorts: SortSpec[];
  /** Optional journey context for journey-specific sorting */
  journeyContext?: JourneyContext;
}

/**
 * Zod schema for validating sort specifications.
 */
export const sortSpecSchema = z.object({
  field: z.string(),
  direction: sortDirectionSchema,
  nulls: nullsPositionSchema.optional(),
});

/**
 * Zod schema for validating sort options.
 */
export const sortOptionsSchema = z.object({
  sorts: z.array(sortSpecSchema),
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Comparison operators for filtering operations.
 */
export enum ComparisonOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  BETWEEN = 'between',
}

/**
 * Logical operators for combining filter conditions.
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

/**
 * Zod schema for validating comparison operators.
 */
export const comparisonOperatorSchema = z.enum([
  ComparisonOperator.EQUALS,
  ComparisonOperator.NOT_EQUALS,
  ComparisonOperator.GREATER_THAN,
  ComparisonOperator.GREATER_THAN_OR_EQUAL,
  ComparisonOperator.LESS_THAN,
  ComparisonOperator.LESS_THAN_OR_EQUAL,
  ComparisonOperator.IN,
  ComparisonOperator.NOT_IN,
  ComparisonOperator.CONTAINS,
  ComparisonOperator.STARTS_WITH,
  ComparisonOperator.ENDS_WITH,
  ComparisonOperator.IS_NULL,
  ComparisonOperator.IS_NOT_NULL,
  ComparisonOperator.BETWEEN,
]);

/**
 * Zod schema for validating logical operators.
 */
export const logicalOperatorSchema = z.enum([
  LogicalOperator.AND,
  LogicalOperator.OR,
  LogicalOperator.NOT,
]);

/**
 * Represents a single filter condition for a field.
 */
export interface FilterCondition<T = any> {
  /** The field to filter on */
  field: string;
  /** The comparison operator to use */
  operator: ComparisonOperator;
  /** The value to compare against (can be a single value or array depending on operator) */
  value?: T | T[];
}

/**
 * Represents a group of filter conditions combined with a logical operator.
 */
export interface FilterGroup {
  /** The logical operator to combine conditions */
  operator: LogicalOperator;
  /** The conditions or groups to combine */
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Represents a complete filter configuration.
 */
export interface FilterOptions {
  /** The root filter group or condition */
  filter: FilterCondition | FilterGroup;
  /** Optional journey context for journey-specific filtering */
  journeyContext?: JourneyContext;
}

/**
 * Zod schema for validating filter conditions.
 * Uses recursive type definition to handle nested conditions.
 */
export const filterConditionSchema: z.ZodType<FilterCondition> = z.object({
  field: z.string(),
  operator: comparisonOperatorSchema,
  value: z.any().optional(),
});

/**
 * Zod schema for validating filter groups.
 * Uses recursive type definition to handle nested groups.
 */
export const filterGroupSchema: z.ZodType<FilterGroup> = z.lazy(() =>
  z.object({
    operator: logicalOperatorSchema,
    conditions: z.array(
      z.union([filterConditionSchema, z.lazy(() => filterGroupSchema)])
    ),
  })
);

/**
 * Zod schema for validating filter options.
 */
export const filterOptionsSchema = z.object({
  filter: z.union([filterConditionSchema, filterGroupSchema]),
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Pagination types supported by the application.
 */
export enum PaginationType {
  OFFSET = 'offset',
  CURSOR = 'cursor',
}

/**
 * Base interface for all pagination options.
 */
export interface BasePaginationOptions {
  /** The type of pagination to use */
  type: PaginationType;
  /** Optional journey context for journey-specific pagination */
  journeyContext?: JourneyContext;
}

/**
 * Options for offset-based pagination.
 */
export interface OffsetPaginationOptions extends BasePaginationOptions {
  type: PaginationType.OFFSET;
  /** The number of items to skip */
  skip: number;
  /** The maximum number of items to return */
  take: number;
}

/**
 * Options for cursor-based pagination.
 */
export interface CursorPaginationOptions extends BasePaginationOptions {
  type: PaginationType.CURSOR;
  /** The cursor to start from */
  cursor: Record<string, any>;
  /** The maximum number of items to return */
  take: number;
  /** Optional skip count after the cursor */
  skip?: number;
}

/**
 * Union type for all pagination options.
 */
export type PaginationOptions = OffsetPaginationOptions | CursorPaginationOptions;

/**
 * Zod schema for validating pagination type.
 */
export const paginationTypeSchema = z.enum([PaginationType.OFFSET, PaginationType.CURSOR]);

/**
 * Zod schema for validating offset-based pagination options.
 */
export const offsetPaginationOptionsSchema = z.object({
  type: z.literal(PaginationType.OFFSET),
  skip: z.number().int().nonnegative(),
  take: z.number().int().positive().max(100), // Limit to 100 items per page
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Zod schema for validating cursor-based pagination options.
 */
export const cursorPaginationOptionsSchema = z.object({
  type: z.literal(PaginationType.CURSOR),
  cursor: z.record(z.any()),
  take: z.number().int().positive().max(100), // Limit to 100 items per page
  skip: z.number().int().nonnegative().optional(),
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Zod schema for validating pagination options.
 */
export const paginationOptionsSchema = z.union([
  offsetPaginationOptionsSchema,
  cursorPaginationOptionsSchema,
]);

/**
 * Metadata returned with paginated results.
 */
export interface PaginationMeta {
  /** The total number of items available */
  total: number;
  /** The number of items returned */
  count: number;
  /** Whether there are more items available */
  hasMore: boolean;
  /** The next cursor for cursor-based pagination */
  nextCursor?: Record<string, any>;
  /** The previous cursor for cursor-based pagination */
  prevCursor?: Record<string, any>;
  /** The current page number for offset-based pagination */
  page?: number;
  /** The total number of pages for offset-based pagination */
  pageCount?: number;
}

/**
 * Result of a paginated query.
 */
export interface PaginatedResult<T> {
  /** The items returned by the query */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Zod schema for validating pagination metadata.
 */
export const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
  nextCursor: z.record(z.any()).optional(),
  prevCursor: z.record(z.any()).optional(),
  page: z.number().int().positive().optional(),
  pageCount: z.number().int().nonnegative().optional(),
});

/**
 * Zod schema for validating paginated results.
 * Generic type parameter is used to specify the schema for the items.
 */
export const createPaginatedResultSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  });

/**
 * Options for selecting specific fields from a model.
 */
export interface SelectOptions {
  /** Fields to include in the result */
  include?: Record<string, boolean | Record<string, any>>;
  /** Fields to select from the model */
  select?: Record<string, boolean | Record<string, any>>;
  /** Optional journey context for journey-specific selection */
  journeyContext?: JourneyContext;
}

/**
 * Complete query options combining filtering, sorting, pagination, and selection.
 */
export interface QueryOptions {
  /** Filtering options */
  filter?: FilterOptions;
  /** Sorting options */
  sort?: SortOptions;
  /** Pagination options */
  pagination?: PaginationOptions;
  /** Selection options */
  select?: SelectOptions;
  /** Optional journey context for journey-specific query handling */
  journeyContext?: JourneyContext;
}

/**
 * Zod schema for validating select options.
 */
export const selectOptionsSchema = z.object({
  include: z.record(z.union([z.boolean(), z.record(z.any())])).optional(),
  select: z.record(z.union([z.boolean(), z.record(z.any())])).optional(),
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Zod schema for validating query options.
 */
export const queryOptionsSchema = z.object({
  filter: filterOptionsSchema.optional(),
  sort: sortOptionsSchema.optional(),
  pagination: paginationOptionsSchema.optional(),
  select: selectOptionsSchema.optional(),
  journeyContext: journeyContextSchema.optional(),
});

/**
 * Type for converting FilterOptions to Prisma where clause.
 */
export type PrismaWhereInput<T> = Prisma.Exact<{
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Prisma.ListFilter<U>
    : T[K] extends object
    ? PrismaWhereInput<T[K]>
    : Prisma.AtomicFilter<T[K]>;
}> &
  {
    AND?: PrismaWhereInput<T> | PrismaWhereInput<T>[];
    OR?: PrismaWhereInput<T>[];
    NOT?: PrismaWhereInput<T> | PrismaWhereInput<T>[];
  };

/**
 * Type for converting SortOptions to Prisma orderBy clause.
 */
export type PrismaOrderByInput<T> = {
  [K in keyof T]?: Prisma.SortOrder | PrismaOrderByInput<T[K]>;
};

/**
 * Type for converting SelectOptions to Prisma select clause.
 */
export type PrismaSelectInput<T> = {
  [K in keyof T]?: boolean | PrismaSelectInput<T[K]>;
};

/**
 * Type for converting SelectOptions to Prisma include clause.
 */
export type PrismaIncludeInput<T> = {
  [K in keyof T]?: boolean | PrismaIncludeInput<T[K]>;
};

/**
 * Utility type for extracting the model type from a Prisma delegate.
 */
export type ModelType<T extends Prisma.PrismaClientDelegate> = T extends Prisma.PrismaClientDelegate<
  any,
  any,
  infer U
>
  ? U
  : never;

/**
 * Utility type for extracting the where input type from a Prisma model.
 */
export type WhereInputType<T extends Prisma.PrismaClientDelegate> = Prisma.Args<T, 'findMany'>['where'];

/**
 * Utility type for extracting the order by input type from a Prisma model.
 */
export type OrderByInputType<T extends Prisma.PrismaClientDelegate> = Prisma.Args<T, 'findMany'>['orderBy'];

/**
 * Utility type for extracting the select input type from a Prisma model.
 */
export type SelectInputType<T extends Prisma.PrismaClientDelegate> = Prisma.Args<T, 'findMany'>['select'];

/**
 * Utility type for extracting the include input type from a Prisma model.
 */
export type IncludeInputType<T extends Prisma.PrismaClientDelegate> = Prisma.Args<T, 'findMany'>['include'];

/**
 * Type for a function that converts FilterOptions to a Prisma where clause.
 */
export type FilterToPrismaWhere<T extends Prisma.PrismaClientDelegate> = (
  filter: FilterOptions,
) => WhereInputType<T>;

/**
 * Type for a function that converts SortOptions to a Prisma orderBy clause.
 */
export type SortToPrismaOrderBy<T extends Prisma.PrismaClientDelegate> = (
  sort: SortOptions,
) => OrderByInputType<T>;

/**
 * Type for a function that converts SelectOptions to Prisma select and include clauses.
 */
export type SelectToPrismaSelect<T extends Prisma.PrismaClientDelegate> = (
  select: SelectOptions,
) => {
  select?: SelectInputType<T>;
  include?: IncludeInputType<T>;
};

/**
 * Type for a function that converts PaginationOptions to Prisma pagination parameters.
 */
export type PaginationToPrismaPagination = (
  pagination: PaginationOptions,
) => {
  skip?: number;
  take?: number;
  cursor?: Record<string, any>;
};

/**
 * Type for a function that converts QueryOptions to Prisma query parameters.
 */
export type QueryToPrismaParams<T extends Prisma.PrismaClientDelegate> = (
  query: QueryOptions,
) => {
  where?: WhereInputType<T>;
  orderBy?: OrderByInputType<T>;
  select?: SelectInputType<T>;
  include?: IncludeInputType<T>;
  skip?: number;
  take?: number;
  cursor?: Record<string, any>;
};

/**
 * Interface for a query builder that constructs Prisma queries from QueryOptions.
 */
export interface QueryBuilder<T extends Prisma.PrismaClientDelegate> {
  /**
   * Converts QueryOptions to Prisma query parameters.
   */
  build: QueryToPrismaParams<T>;
  
  /**
   * Converts FilterOptions to a Prisma where clause.
   */
  buildWhere: FilterToPrismaWhere<T>;
  
  /**
   * Converts SortOptions to a Prisma orderBy clause.
   */
  buildOrderBy: SortToPrismaOrderBy<T>;
  
  /**
   * Converts SelectOptions to Prisma select and include clauses.
   */
  buildSelect: SelectToPrismaSelect<T>;
  
  /**
   * Converts PaginationOptions to Prisma pagination parameters.
   */
  buildPagination: PaginationToPrismaPagination;
}

/**
 * Options for time-series specific queries (for TimescaleDB).
 */
export interface TimeSeriesQueryOptions extends QueryOptions {
  /** Time range for the query */
  timeRange?: {
    /** Start time for the range */
    start: Date;
    /** End time for the range */
    end: Date;
    /** Field containing the timestamp */
    field: string;
  };
  /** Time bucket size for aggregation */
  timeBucket?: {
    /** Size of the time bucket (e.g., '1 hour', '30 minutes') */
    interval: string;
    /** Field to bucket by */
    field: string;
  };
  /** Aggregation functions to apply */
  aggregations?: {
    /** Field to aggregate */
    field: string;
    /** Function to apply (e.g., 'avg', 'sum', 'min', 'max', 'count') */
    function: 'avg' | 'sum' | 'min' | 'max' | 'count';
    /** Alias for the result */
    alias: string;
  }[];
}

/**
 * Zod schema for validating time range options.
 */
export const timeRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
  field: z.string(),
}).refine(data => data.start <= data.end, {
  message: 'Start date must be before or equal to end date',
  path: ['start'],
});

/**
 * Zod schema for validating time bucket options.
 */
export const timeBucketSchema = z.object({
  interval: z.string(),
  field: z.string(),
});

/**
 * Zod schema for validating aggregation options.
 */
export const aggregationSchema = z.object({
  field: z.string(),
  function: z.enum(['avg', 'sum', 'min', 'max', 'count']),
  alias: z.string(),
});

/**
 * Zod schema for validating time-series query options.
 */
export const timeSeriesQueryOptionsSchema = queryOptionsSchema.extend({
  timeRange: timeRangeSchema.optional(),
  timeBucket: timeBucketSchema.optional(),
  aggregations: z.array(aggregationSchema).optional(),
});

/**
 * Interface for a time-series query builder that constructs TimescaleDB queries.
 */
export interface TimeSeriesQueryBuilder<T extends Prisma.PrismaClientDelegate> extends QueryBuilder<T> {
  /**
   * Builds a time-series specific query.
   */
  buildTimeSeries: (options: TimeSeriesQueryOptions) => {
    query: string;
    params: any[];
  };
}

/**
 * Utility functions for working with query types.
 */
export const QueryUtils = {
  /**
   * Creates a simple equals filter condition.
   * @param field The field to filter on
   * @param value The value to compare against
   * @returns A filter condition
   */
  equals: <T>(field: string, value: T): FilterCondition<T> => ({
    field,
    operator: ComparisonOperator.EQUALS,
    value,
  }),

  /**
   * Creates a simple not equals filter condition.
   * @param field The field to filter on
   * @param value The value to compare against
   * @returns A filter condition
   */
  notEquals: <T>(field: string, value: T): FilterCondition<T> => ({
    field,
    operator: ComparisonOperator.NOT_EQUALS,
    value,
  }),

  /**
   * Creates a contains filter condition for string fields.
   * @param field The field to filter on
   * @param value The substring to search for
   * @returns A filter condition
   */
  contains: (field: string, value: string): FilterCondition<string> => ({
    field,
    operator: ComparisonOperator.CONTAINS,
    value,
  }),

  /**
   * Creates an in filter condition.
   * @param field The field to filter on
   * @param values The values to include
   * @returns A filter condition
   */
  in: <T>(field: string, values: T[]): FilterCondition<T> => ({
    field,
    operator: ComparisonOperator.IN,
    value: values,
  }),

  /**
   * Creates a between filter condition.
   * @param field The field to filter on
   * @param min The minimum value
   * @param max The maximum value
   * @returns A filter condition
   */
  between: <T>(field: string, min: T, max: T): FilterCondition<T> => ({
    field,
    operator: ComparisonOperator.BETWEEN,
    value: [min, max] as any,
  }),

  /**
   * Creates an AND filter group.
   * @param conditions The conditions to combine
   * @returns A filter group
   */
  and: (conditions: (FilterCondition | FilterGroup)[]): FilterGroup => ({
    operator: LogicalOperator.AND,
    conditions,
  }),

  /**
   * Creates an OR filter group.
   * @param conditions The conditions to combine
   * @returns A filter group
   */
  or: (conditions: (FilterCondition | FilterGroup)[]): FilterGroup => ({
    operator: LogicalOperator.OR,
    conditions,
  }),

  /**
   * Creates a NOT filter group.
   * @param condition The condition to negate
   * @returns A filter group
   */
  not: (condition: FilterCondition | FilterGroup): FilterGroup => ({
    operator: LogicalOperator.NOT,
    conditions: [condition],
  }),

  /**
   * Creates a sort specification.
   * @param field The field to sort by
   * @param direction The direction to sort
   * @param nulls How to handle null values
   * @returns A sort specification
   */
  sort: (field: string, direction: SortDirection = SortDirection.ASC, nulls?: NullsPosition): SortSpec => ({
    field,
    direction,
    nulls,
  }),

  /**
   * Creates offset-based pagination options.
   * @param skip The number of items to skip
   * @param take The maximum number of items to return
   * @returns Pagination options
   */
  offsetPagination: (skip: number, take: number): OffsetPaginationOptions => ({
    type: PaginationType.OFFSET,
    skip,
    take,
  }),

  /**
   * Creates cursor-based pagination options.
   * @param cursor The cursor to start from
   * @param take The maximum number of items to return
   * @param skip Optional skip count after the cursor
   * @returns Pagination options
   */
  cursorPagination: (cursor: Record<string, any>, take: number, skip?: number): CursorPaginationOptions => ({
    type: PaginationType.CURSOR,
    cursor,
    take,
    skip,
  }),

  /**
   * Creates a complete query options object.
   * @param options The query options
   * @returns Query options
   */
  query: (options: Partial<QueryOptions>): QueryOptions => ({
    filter: options.filter,
    sort: options.sort,
    pagination: options.pagination,
    select: options.select,
    journeyContext: options.journeyContext,
  }),

  /**
   * Creates a journey context.
   * @param journeyType The journey type
   * @param metadata Optional journey-specific metadata
   * @returns A journey context
   */
  journeyContext: (journeyType: JourneyType, metadata?: Record<string, any>): JourneyContext => ({
    journeyType,
    metadata,
  }),
};

/**
 * Health journey specific query options.
 */
export interface HealthQueryOptions extends QueryOptions {
  /** Health-specific query options */
  health?: {
    /** Include device data with health metrics */
    includeDeviceData?: boolean;
    /** Filter by specific health metric types */
    metricTypes?: string[];
    /** Include goal progress with health metrics */
    includeGoalProgress?: boolean;
  };
}

/**
 * Care journey specific query options.
 */
export interface CareQueryOptions extends QueryOptions {
  /** Care-specific query options */
  care?: {
    /** Include provider details with appointments */
    includeProviderDetails?: boolean;
    /** Filter by appointment status */
    appointmentStatus?: string[];
    /** Include medication details with treatments */
    includeMedicationDetails?: boolean;
  };
}

/**
 * Plan journey specific query options.
 */
export interface PlanQueryOptions extends QueryOptions {
  /** Plan-specific query options */
  plan?: {
    /** Include benefit details with plans */
    includeBenefitDetails?: boolean;
    /** Filter by claim status */
    claimStatus?: string[];
    /** Include document details with claims */
    includeDocumentDetails?: boolean;
  };
}

/**
 * Zod schema for validating Health journey specific query options.
 */
export const healthQueryOptionsSchema = queryOptionsSchema.extend({
  health: z.object({
    includeDeviceData: z.boolean().optional(),
    metricTypes: z.array(z.string()).optional(),
    includeGoalProgress: z.boolean().optional(),
  }).optional(),
});

/**
 * Zod schema for validating Care journey specific query options.
 */
export const careQueryOptionsSchema = queryOptionsSchema.extend({
  care: z.object({
    includeProviderDetails: z.boolean().optional(),
    appointmentStatus: z.array(z.string()).optional(),
    includeMedicationDetails: z.boolean().optional(),
  }).optional(),
});

/**
 * Zod schema for validating Plan journey specific query options.
 */
export const planQueryOptionsSchema = queryOptionsSchema.extend({
  plan: z.object({
    includeBenefitDetails: z.boolean().optional(),
    claimStatus: z.array(z.string()).optional(),
    includeDocumentDetails: z.boolean().optional(),
  }).optional(),
});