/**
 * @file pagination.utils.ts
 * @description Provides comprehensive pagination utilities for database queries across all journey services.
 * Implements standardized pagination with limit, offset, and cursor-based approaches along with proper type
 * definitions. Offers performance-optimized pagination for large datasets with automatic detection of the
 * best pagination strategy based on query patterns. Includes helper functions for constructing pagination
 * metadata and supports specialized TimescaleDB time-series pagination.
 */

import { 
  PaginationParams, 
  OffsetPaginationParams, 
  CursorPaginationParams, 
  PaginationMeta,
  QueryResult
} from '../types/query.types';
import { JourneyId, HealthJourneyQueryParams, CareJourneyQueryParams, PlanJourneyQueryParams } from '../types/journey.types';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/**
 * Default page size for pagination
 * @default 10
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Maximum page size allowed for pagination to prevent performance issues
 * @default 100
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Default page number for offset-based pagination
 * @default 1
 */
export const DEFAULT_PAGE_NUMBER = 1;

/**
 * Default direction for cursor-based pagination
 * @default 'forward'
 */
export const DEFAULT_CURSOR_DIRECTION = 'forward';

/**
 * Default cursor field for cursor-based pagination
 * @default 'id'
 */
export const DEFAULT_CURSOR_FIELD = 'id';

/**
 * Default time field for TimescaleDB time-series pagination
 * @default 'timestamp'
 */
export const DEFAULT_TIME_FIELD = 'timestamp';

// -----------------------------------------------------------------------------
// Error Messages
// -----------------------------------------------------------------------------

/**
 * Error messages for pagination validation
 */
export const PAGINATION_ERROR_MESSAGES = {
  INVALID_PAGE_SIZE: 'Page size must be a positive integer',
  PAGE_SIZE_TOO_LARGE: `Page size cannot exceed ${MAX_PAGE_SIZE}`,
  INVALID_PAGE_NUMBER: 'Page number must be a positive integer',
  INVALID_OFFSET: 'Offset must be a non-negative integer',
  INVALID_CURSOR: 'Cursor must be a non-empty string',
  INVALID_DIRECTION: 'Direction must be either "forward" or "backward"',
  INVALID_CURSOR_FIELD: 'Cursor field must be a non-empty string',
  INVALID_STRATEGY: 'Pagination strategy must be either "offset" or "cursor"',
  MISSING_TIME_RANGE: 'Time range start and end are required for time-series pagination',
  INVALID_TIME_RANGE: 'Time range start must be before time range end',
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/**
 * Options for creating offset-based pagination parameters
 */
export interface CreateOffsetPaginationOptions {
  /**
   * The page number (1-based)
   * @default 1
   */
  page?: number;

  /**
   * The number of items per page
   * @default 10
   */
  pageSize?: number;

  /**
   * The offset (overrides page if provided)
   */
  offset?: number;
}

/**
 * Options for creating cursor-based pagination parameters
 */
export interface CreateCursorPaginationOptions {
  /**
   * The cursor to start from
   */
  cursor?: string;

  /**
   * The number of items per page
   * @default 10
   */
  pageSize?: number;

  /**
   * The direction to paginate in
   * @default 'forward'
   */
  direction?: 'forward' | 'backward';

  /**
   * The field to use as the cursor
   * @default 'id'
   */
  cursorField?: string;
}

/**
 * Options for creating time-series pagination parameters
 */
export interface CreateTimeSeriesPaginationOptions {
  /**
   * The start of the time range
   */
  timeRangeStart: Date;

  /**
   * The end of the time range
   */
  timeRangeEnd: Date;

  /**
   * The number of items per page
   * @default 10
   */
  pageSize?: number;

  /**
   * The cursor to start from
   */
  cursor?: string;

  /**
   * The field containing the timestamp
   * @default 'timestamp'
   */
  timeField?: string;

  /**
   * The direction to paginate in
   * @default 'forward'
   */
  direction?: 'forward' | 'backward';

  /**
   * Whether to use cursor-based pagination (recommended for large datasets)
   * @default true
   */
  useCursor?: boolean;
}

/**
 * Options for creating journey-specific pagination parameters
 */
export interface CreateJourneyPaginationOptions {
  /**
   * The journey ID
   */
  journeyId: JourneyId;

  /**
   * The pagination strategy to use
   * @default 'offset'
   */
  strategy?: 'offset' | 'cursor';

  /**
   * Options for offset-based pagination
   * Only used if strategy is 'offset'
   */
  offsetOptions?: CreateOffsetPaginationOptions;

  /**
   * Options for cursor-based pagination
   * Only used if strategy is 'cursor'
   */
  cursorOptions?: CreateCursorPaginationOptions;

  /**
   * Options for time-series pagination
   * Only used for time-series data
   */
  timeSeriesOptions?: CreateTimeSeriesPaginationOptions;
}

/**
 * Options for creating pagination metadata
 */
export interface CreatePaginationMetaOptions {
  /**
   * The pagination parameters used for the query
   */
  params: PaginationParams;

  /**
   * The items returned by the query
   */
  items: any[];

  /**
   * The total count of items (if available)
   */
  totalCount?: number;

  /**
   * The next cursor (for cursor-based pagination)
   */
  nextCursor?: string;

  /**
   * The previous cursor (for cursor-based pagination)
   */
  previousCursor?: string;
}

// -----------------------------------------------------------------------------
// Validation Functions
// -----------------------------------------------------------------------------

/**
 * Validates pagination parameters
 * @param params The pagination parameters to validate
 * @throws Error if the parameters are invalid
 */
export function validatePaginationParams(params: PaginationParams): void {
  // Validate strategy
  if (params.strategy !== 'offset' && params.strategy !== 'cursor') {
    throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_STRATEGY);
  }

  // Validate limit
  if (params.limit !== undefined) {
    if (!Number.isInteger(params.limit) || params.limit <= 0) {
      throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_PAGE_SIZE);
    }

    if (params.limit > MAX_PAGE_SIZE) {
      throw new Error(PAGINATION_ERROR_MESSAGES.PAGE_SIZE_TOO_LARGE);
    }
  }

  // Validate offset-based pagination parameters
  if (params.strategy === 'offset') {
    const offsetParams = params as OffsetPaginationParams;

    // Validate page
    if (offsetParams.page !== undefined) {
      if (!Number.isInteger(offsetParams.page) || offsetParams.page <= 0) {
        throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_PAGE_NUMBER);
      }
    }

    // Validate offset
    if (offsetParams.offset !== undefined) {
      if (!Number.isInteger(offsetParams.offset) || offsetParams.offset < 0) {
        throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_OFFSET);
      }
    }
  }

  // Validate cursor-based pagination parameters
  if (params.strategy === 'cursor') {
    const cursorParams = params as CursorPaginationParams;

    // Validate cursor
    if (cursorParams.cursor !== undefined && cursorParams.cursor.trim() === '') {
      throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_CURSOR);
    }

    // Validate direction
    if (cursorParams.direction !== undefined && 
        cursorParams.direction !== 'forward' && 
        cursorParams.direction !== 'backward') {
      throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_DIRECTION);
    }

    // Validate cursor field
    if (cursorParams.cursorField !== undefined && cursorParams.cursorField.trim() === '') {
      throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_CURSOR_FIELD);
    }
  }
}

/**
 * Validates time-series pagination options
 * @param options The time-series pagination options to validate
 * @throws Error if the options are invalid
 */
export function validateTimeSeriesPaginationOptions(options: CreateTimeSeriesPaginationOptions): void {
  // Validate time range
  if (!options.timeRangeStart || !options.timeRangeEnd) {
    throw new Error(PAGINATION_ERROR_MESSAGES.MISSING_TIME_RANGE);
  }

  if (options.timeRangeStart >= options.timeRangeEnd) {
    throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_TIME_RANGE);
  }

  // Validate page size
  if (options.pageSize !== undefined) {
    if (!Number.isInteger(options.pageSize) || options.pageSize <= 0) {
      throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_PAGE_SIZE);
    }

    if (options.pageSize > MAX_PAGE_SIZE) {
      throw new Error(PAGINATION_ERROR_MESSAGES.PAGE_SIZE_TOO_LARGE);
    }
  }

  // Validate cursor
  if (options.cursor !== undefined && options.cursor.trim() === '') {
    throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_CURSOR);
  }

  // Validate direction
  if (options.direction !== undefined && 
      options.direction !== 'forward' && 
      options.direction !== 'backward') {
    throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_DIRECTION);
  }

  // Validate time field
  if (options.timeField !== undefined && options.timeField.trim() === '') {
    throw new Error(PAGINATION_ERROR_MESSAGES.INVALID_CURSOR_FIELD);
  }
}

// -----------------------------------------------------------------------------
// Pagination Parameter Creation Functions
// -----------------------------------------------------------------------------

/**
 * Creates offset-based pagination parameters
 * @param options Options for creating offset-based pagination parameters
 * @returns Offset-based pagination parameters
 */
export function createOffsetPagination(options?: CreateOffsetPaginationOptions): OffsetPaginationParams {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = options?.page ?? DEFAULT_PAGE_NUMBER;
  const offset = options?.offset ?? (page - 1) * pageSize;

  const params: OffsetPaginationParams = {
    strategy: 'offset',
    limit: pageSize,
    offset,
    page
  };

  validatePaginationParams(params);
  return params;
}

/**
 * Creates cursor-based pagination parameters
 * @param options Options for creating cursor-based pagination parameters
 * @returns Cursor-based pagination parameters
 */
export function createCursorPagination(options?: CreateCursorPaginationOptions): CursorPaginationParams {
  const params: CursorPaginationParams = {
    strategy: 'cursor',
    limit: options?.pageSize ?? DEFAULT_PAGE_SIZE,
    direction: options?.direction ?? DEFAULT_CURSOR_DIRECTION,
    cursorField: options?.cursorField ?? DEFAULT_CURSOR_FIELD
  };

  if (options?.cursor) {
    params.cursor = options.cursor;
  }

  validatePaginationParams(params);
  return params;
}

/**
 * Creates time-series pagination parameters optimized for TimescaleDB
 * @param options Options for creating time-series pagination parameters
 * @returns Pagination parameters optimized for time-series data
 */
export function createTimeSeriesPagination(options: CreateTimeSeriesPaginationOptions): PaginationParams {
  validateTimeSeriesPaginationOptions(options);

  const useCursor = options.useCursor ?? true;
  const timeField = options.timeField ?? DEFAULT_TIME_FIELD;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  if (useCursor) {
    // Cursor-based pagination for time-series data
    const params: CursorPaginationParams = {
      strategy: 'cursor',
      limit: pageSize,
      direction: options.direction ?? DEFAULT_CURSOR_DIRECTION,
      cursorField: timeField
    };

    if (options.cursor) {
      params.cursor = options.cursor;
    }

    return params;
  } else {
    // Offset-based pagination for time-series data
    return {
      strategy: 'offset',
      limit: pageSize,
      offset: 0
    };
  }
}

/**
 * Creates journey-specific pagination parameters based on the journey ID and options
 * @param options Options for creating journey-specific pagination parameters
 * @returns Journey-specific pagination parameters
 */
export function createJourneyPagination(options: CreateJourneyPaginationOptions): PaginationParams {
  const { journeyId, strategy = 'offset' } = options;

  // If time-series options are provided, use time-series pagination
  if (options.timeSeriesOptions) {
    return createTimeSeriesPagination(options.timeSeriesOptions);
  }

  // Otherwise, use the specified strategy
  if (strategy === 'offset') {
    return createOffsetPagination(options.offsetOptions);
  } else {
    return createCursorPagination(options.cursorOptions);
  }
}

/**
 * Creates health journey-specific pagination parameters
 * @param params Health journey query parameters
 * @returns Pagination parameters optimized for health journey data
 */
export function createHealthJourneyPagination(params: HealthJourneyQueryParams): PaginationParams {
  // For health metrics with date range, use time-series pagination
  if (params.dateRangeStart && params.dateRangeEnd) {
    return createTimeSeriesPagination({
      timeRangeStart: params.dateRangeStart,
      timeRangeEnd: params.dateRangeEnd,
      pageSize: 20, // Higher default for health metrics
      timeField: 'recordedAt',
      useCursor: true
    });
  }

  // For device data, use cursor-based pagination
  if (params.deviceIds && params.deviceIds.length > 0) {
    return createCursorPagination({
      pageSize: 15,
      cursorField: 'lastSyncedAt'
    });
  }

  // For goals, use offset-based pagination
  if (params.goalTypes && params.goalTypes.length > 0) {
    return createOffsetPagination({
      pageSize: 10
    });
  }

  // Default to offset-based pagination
  return createOffsetPagination();
}

/**
 * Creates care journey-specific pagination parameters
 * @param params Care journey query parameters
 * @returns Pagination parameters optimized for care journey data
 */
export function createCareJourneyPagination(params: CareJourneyQueryParams): PaginationParams {
  // For appointments with date range, use time-series pagination
  if (params.appointmentDateStart && params.appointmentDateEnd) {
    return createTimeSeriesPagination({
      timeRangeStart: params.appointmentDateStart,
      timeRangeEnd: params.appointmentDateEnd,
      pageSize: 5, // Lower default for appointments
      timeField: 'scheduledAt',
      useCursor: true
    });
  }

  // For providers, use offset-based pagination
  if (params.providerIds && params.providerIds.length > 0) {
    return createOffsetPagination({
      pageSize: 20 // Higher default for providers list
    });
  }

  // For medications, use cursor-based pagination
  if (params.medicationIds && params.medicationIds.length > 0) {
    return createCursorPagination({
      pageSize: 15,
      cursorField: 'prescribedAt'
    });
  }

  // Default to offset-based pagination
  return createOffsetPagination();
}

/**
 * Creates plan journey-specific pagination parameters
 * @param params Plan journey query parameters
 * @returns Pagination parameters optimized for plan journey data
 */
export function createPlanJourneyPagination(params: PlanJourneyQueryParams): PaginationParams {
  // For claims with date range, use time-series pagination
  if (params.claimDateStart && params.claimDateEnd) {
    return createTimeSeriesPagination({
      timeRangeStart: params.claimDateStart,
      timeRangeEnd: params.claimDateEnd,
      pageSize: 10,
      timeField: 'submittedAt',
      useCursor: true
    });
  }

  // For benefits, use offset-based pagination
  if (params.benefitIds && params.benefitIds.length > 0) {
    return createOffsetPagination({
      pageSize: 15
    });
  }

  // For documents, use cursor-based pagination
  if (params.documentTypes && params.documentTypes.length > 0) {
    return createCursorPagination({
      pageSize: 20,
      cursorField: 'uploadedAt'
    });
  }

  // Default to offset-based pagination
  return createOffsetPagination();
}

// -----------------------------------------------------------------------------
// Pagination Metadata Functions
// -----------------------------------------------------------------------------

/**
 * Creates pagination metadata based on the pagination parameters and results
 * @param options Options for creating pagination metadata
 * @returns Pagination metadata
 */
export function createPaginationMeta(options: CreatePaginationMetaOptions): PaginationMeta {
  const { params, items, totalCount } = options;
  const count = items.length;
  const pageSize = params.limit ?? DEFAULT_PAGE_SIZE;

  // Base metadata
  const meta: PaginationMeta = {
    count,
    pageSize,
    hasMore: false
  };

  // Add total count if available
  if (totalCount !== undefined) {
    meta.totalCount = totalCount;
  }

  // Strategy-specific metadata
  if (params.strategy === 'offset') {
    const offsetParams = params as OffsetPaginationParams;
    const offset = offsetParams.offset ?? 0;
    const page = offsetParams.page ?? Math.floor(offset / pageSize) + 1;

    meta.currentPage = page;
    meta.hasMore = totalCount !== undefined ? offset + count < totalCount : count >= pageSize;

    if (totalCount !== undefined) {
      meta.totalPages = Math.ceil(totalCount / pageSize);
    }
  } else if (params.strategy === 'cursor') {
    const cursorParams = params as CursorPaginationParams;
    const direction = cursorParams.direction ?? DEFAULT_CURSOR_DIRECTION;

    // Determine if there are more items
    meta.hasMore = count >= pageSize;

    // Set next and previous cursors if provided
    if (options.nextCursor) {
      meta.nextCursor = options.nextCursor;
    } else if (count > 0 && meta.hasMore) {
      // Generate next cursor from the last item if not provided
      const lastItem = items[count - 1];
      const cursorField = cursorParams.cursorField ?? DEFAULT_CURSOR_FIELD;
      
      if (lastItem && lastItem[cursorField]) {
        meta.nextCursor = encodeCursor(lastItem[cursorField]);
      }
    }

    if (options.previousCursor) {
      meta.previousCursor = options.previousCursor;
    } else if (count > 0 && cursorParams.cursor) {
      // Use the current cursor as the previous cursor if not provided
      meta.previousCursor = cursorParams.cursor;
    }
  }

  return meta;
}

/**
 * Creates a query result with pagination metadata
 * @param items The items returned by the query
 * @param params The pagination parameters used for the query
 * @param totalCount The total count of items (if available)
 * @param nextCursor The next cursor (for cursor-based pagination)
 * @param previousCursor The previous cursor (for cursor-based pagination)
 * @returns Query result with pagination metadata
 */
export function createPaginatedResult<T>(
  items: T[],
  params: PaginationParams,
  totalCount?: number,
  nextCursor?: string,
  previousCursor?: string
): QueryResult<T> {
  const pagination = createPaginationMeta({
    params,
    items,
    totalCount,
    nextCursor,
    previousCursor
  });

  return {
    items,
    pagination,
    metadata: {
      executionTimeMs: 0 // This will be set by the query executor
    }
  };
}

// -----------------------------------------------------------------------------
// Cursor Encoding/Decoding Functions
// -----------------------------------------------------------------------------

/**
 * Encodes a cursor value to a string
 * @param value The value to encode
 * @returns The encoded cursor string
 */
export function encodeCursor(value: any): string {
  if (value === null || value === undefined) {
    throw new Error('Cannot encode null or undefined as cursor');
  }

  // Convert Date objects to ISO strings
  if (value instanceof Date) {
    value = value.toISOString();
  }

  // Convert objects to JSON strings
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  // Convert to string and encode as base64
  return Buffer.from(String(value)).toString('base64');
}

/**
 * Decodes a cursor string to its original value
 * @param cursor The cursor string to decode
 * @returns The decoded cursor value
 */
export function decodeCursor(cursor: string): any {
  if (!cursor) {
    throw new Error('Cannot decode empty cursor');
  }

  try {
    // Decode from base64
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');

    // Try to parse as JSON
    try {
      return JSON.parse(decoded);
    } catch {
      // If not valid JSON, return as is
      return decoded;
    }
  } catch (error) {
    throw new Error(`Failed to decode cursor: ${error.message}`);
  }
}

/**
 * Creates a cursor value for a specific field and value
 * @param field The field name
 * @param value The field value
 * @returns The encoded cursor string
 */
export function createFieldCursor(field: string, value: any): string {
  return encodeCursor({ field, value });
}

/**
 * Extracts the field and value from a cursor
 * @param cursor The cursor string to decode
 * @returns The field and value from the cursor
 */
export function extractFieldCursor(cursor: string): { field: string; value: any } {
  const decoded = decodeCursor(cursor);
  
  if (typeof decoded !== 'object' || !decoded.field || decoded.value === undefined) {
    throw new Error('Invalid field cursor format');
  }
  
  return {
    field: decoded.field,
    value: decoded.value
  };
}

// -----------------------------------------------------------------------------
// TimescaleDB Specific Functions
// -----------------------------------------------------------------------------

/**
 * Creates a time bucket for TimescaleDB time-series data
 * @param interval The time bucket interval (e.g., '1 hour', '30 minutes', '1 day')
 * @param timeField The field containing the timestamp
 * @returns The time bucket expression for use in Prisma raw queries
 */
export function createTimeBucket(interval: string, timeField: string = DEFAULT_TIME_FIELD): string {
  return `time_bucket('${interval}', ${timeField})`;
}

/**
 * Creates a continuous aggregate query for TimescaleDB time-series data
 * @param tableName The name of the table
 * @param timeField The field containing the timestamp
 * @param aggregates The aggregates to compute (e.g., { avg: 'value', max: 'value' })
 * @param interval The time bucket interval (e.g., '1 hour', '30 minutes', '1 day')
 * @returns The continuous aggregate query for use in Prisma raw queries
 */
export function createContinuousAggregateQuery(
  tableName: string,
  timeField: string,
  aggregates: Record<string, string>,
  interval: string
): string {
  const aggregateExpressions = Object.entries(aggregates)
    .map(([agg, field]) => `${agg}(${field}) as ${agg}_${field}`)
    .join(', ');

  return `
    SELECT 
      ${createTimeBucket(interval, timeField)} as bucket,
      ${aggregateExpressions}
    FROM ${tableName}
    GROUP BY bucket
    ORDER BY bucket
  `;
}

/**
 * Creates a downsampled time-series query for TimescaleDB
 * @param tableName The name of the table
 * @param timeField The field containing the timestamp
 * @param valueField The field containing the value to aggregate
 * @param startTime The start of the time range
 * @param endTime The end of the time range
 * @param interval The time bucket interval (e.g., '1 hour', '30 minutes', '1 day')
 * @returns The downsampled query for use in Prisma raw queries
 */
export function createDownsampledTimeSeriesQuery(
  tableName: string,
  timeField: string,
  valueField: string,
  startTime: Date,
  endTime: Date,
  interval: string
): string {
  return `
    SELECT 
      ${createTimeBucket(interval, timeField)} as time,
      avg(${valueField}) as avg_value,
      min(${valueField}) as min_value,
      max(${valueField}) as max_value,
      count(*) as sample_count
    FROM ${tableName}
    WHERE ${timeField} >= '${startTime.toISOString()}' AND ${timeField} <= '${endTime.toISOString()}'
    GROUP BY time
    ORDER BY time
  `;
}

// -----------------------------------------------------------------------------
// Pagination Optimization Functions
// -----------------------------------------------------------------------------

/**
 * Determines the optimal pagination strategy based on the query parameters and data characteristics
 * @param totalCount The total count of items (if available)
 * @param isTimeSeries Whether the data is time-series data
 * @param hasComplexFilters Whether the query has complex filters
 * @param hasSorting Whether the query has sorting criteria
 * @returns The optimal pagination strategy ('offset' or 'cursor')
 */
export function determineOptimalPaginationStrategy(
  totalCount?: number,
  isTimeSeries: boolean = false,
  hasComplexFilters: boolean = false,
  hasSorting: boolean = false
): 'offset' | 'cursor' {
  // For small datasets, offset-based pagination is simpler and works well
  if (totalCount !== undefined && totalCount < 1000) {
    return 'offset';
  }

  // For time-series data, cursor-based pagination is more efficient
  if (isTimeSeries) {
    return 'cursor';
  }

  // For queries with complex filters or sorting, cursor-based pagination may be more efficient
  if (hasComplexFilters || hasSorting) {
    return 'cursor';
  }

  // Default to offset-based pagination for simplicity
  return 'offset';
}

/**
 * Estimates the optimal page size based on the data characteristics
 * @param averageRowSizeBytes The average size of a row in bytes
 * @param isTimeSeries Whether the data is time-series data
 * @param hasLargeTextFields Whether the data has large text fields
 * @param hasJsonFields Whether the data has JSON fields
 * @returns The optimal page size
 */
export function estimateOptimalPageSize(
  averageRowSizeBytes: number,
  isTimeSeries: boolean = false,
  hasLargeTextFields: boolean = false,
  hasJsonFields: boolean = false
): number {
  // Base page size calculation
  let pageSize = Math.floor(1_000_000 / averageRowSizeBytes); // Aim for ~1MB response size

  // Adjust for data characteristics
  if (isTimeSeries) {
    pageSize = Math.min(pageSize, 100); // Time-series data often needs more processing
  }

  if (hasLargeTextFields) {
    pageSize = Math.min(pageSize, 50); // Large text fields increase response size
  }

  if (hasJsonFields) {
    pageSize = Math.min(pageSize, 30); // JSON fields can be unpredictably large
  }

  // Ensure within bounds
  pageSize = Math.max(pageSize, 5); // Minimum page size
  pageSize = Math.min(pageSize, MAX_PAGE_SIZE); // Maximum page size

  return pageSize;
}

// -----------------------------------------------------------------------------
// Error Handling Functions
// -----------------------------------------------------------------------------

/**
 * Handles pagination boundary errors and provides fallback pagination parameters
 * @param error The error that occurred
 * @param defaultParams The default pagination parameters to use as fallback
 * @returns Fallback pagination parameters
 */
export function handlePaginationError(
  error: Error,
  defaultParams: PaginationParams = createOffsetPagination()
): PaginationParams {
  // Log the error
  console.error('Pagination error:', error.message);

  // Return default pagination parameters
  return defaultParams;
}

/**
 * Safely creates pagination parameters with error handling
 * @param createFn The function to create pagination parameters
 * @param options The options to pass to the creation function
 * @param defaultParams The default pagination parameters to use as fallback
 * @returns The created pagination parameters or fallback parameters if an error occurs
 */
export function safelyCreatePagination<T>(
  createFn: (options: T) => PaginationParams,
  options: T,
  defaultParams: PaginationParams = createOffsetPagination()
): PaginationParams {
  try {
    return createFn(options);
  } catch (error) {
    return handlePaginationError(error, defaultParams);
  }
}

/**
 * Safely creates pagination metadata with error handling
 * @param options Options for creating pagination metadata
 * @returns Pagination metadata or default metadata if an error occurs
 */
export function safelyCreatePaginationMeta(
  options: CreatePaginationMetaOptions
): PaginationMeta {
  try {
    return createPaginationMeta(options);
  } catch (error) {
    // Log the error
    console.error('Pagination metadata error:', error.message);

    // Return default pagination metadata
    return {
      count: options.items.length,
      pageSize: options.params.limit ?? DEFAULT_PAGE_SIZE,
      hasMore: false
    };
  }
}