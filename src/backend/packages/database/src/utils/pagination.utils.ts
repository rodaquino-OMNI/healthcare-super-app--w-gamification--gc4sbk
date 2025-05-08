/**
 * @file pagination.utils.ts
 * @description Provides comprehensive pagination utilities for database queries across all journey services.
 * Implements standardized pagination with limit, offset, and cursor-based approaches along with proper type
 * definitions. Offers performance-optimized pagination for large datasets with automatic detection of the
 * best pagination strategy based on query patterns.
 *
 * This file includes helper functions for constructing pagination metadata (total count, page count,
 * next/prev cursors) and supports specialized TimescaleDB time-series pagination.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { DatabaseError } from '../errors';
import {
  PaginationOptions,
  PaginationType,
  OffsetPaginationOptions,
  CursorPaginationOptions,
  PaginationMeta,
  PaginatedResult,
  JourneyContext,
  TimeSeriesQueryOptions,
} from '../types/query.types';
import {
  PagePaginationDto,
  CursorPaginationDto,
  PaginationDto,
  PaginationMeta as DtoPaginationMeta,
  PaginatedResponse,
} from '@austa/interfaces/common/dto';

/**
 * Error messages for pagination operations
 */
export const PAGINATION_ERRORS = {
  INVALID_PAGINATION_TYPE: 'Invalid pagination type',
  INVALID_CURSOR: 'Invalid cursor format',
  INVALID_OFFSET: 'Invalid offset value',
  INVALID_LIMIT: 'Invalid limit value',
  MAX_LIMIT_EXCEEDED: 'Maximum limit exceeded',
  NEGATIVE_PAGE: 'Page number cannot be negative',
  EMPTY_RESULTS: 'No results found for the given pagination parameters',
  CURSOR_DECODE_ERROR: 'Failed to decode cursor',
};

/**
 * Maximum allowed limit for pagination to prevent performance issues
 */
export const MAX_PAGINATION_LIMIT = 100;

/**
 * Default limit for pagination when not specified
 */
export const DEFAULT_PAGINATION_LIMIT = 20;

/**
 * Configuration options for pagination utilities
 */
export interface PaginationConfig {
  /**
   * Maximum allowed limit for pagination
   * @default 100
   */
  maxLimit?: number;

  /**
   * Default limit when not specified
   * @default 20
   */
  defaultLimit?: number;

  /**
   * Whether to automatically use cursor-based pagination for large datasets
   * @default true
   */
  autoUseCursorForLargeDatasets?: boolean;

  /**
   * Threshold for automatically switching to cursor-based pagination
   * @default 1000
   */
  cursorPaginationThreshold?: number;

  /**
   * Journey-specific configuration
   */
  journeyConfig?: Record<string, {
    /**
     * Default cursor field for the journey
     */
    defaultCursorField: string;
    
    /**
     * Maximum allowed limit for the journey
     */
    maxLimit?: number;
  }>;
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  maxLimit: MAX_PAGINATION_LIMIT,
  defaultLimit: DEFAULT_PAGINATION_LIMIT,
  autoUseCursorForLargeDatasets: true,
  cursorPaginationThreshold: 1000,
  journeyConfig: {
    HEALTH: {
      defaultCursorField: 'timestamp',
      maxLimit: 50, // Lower limit for health metrics due to potential large datasets
    },
    CARE: {
      defaultCursorField: 'scheduledAt',
      maxLimit: 30, // Appropriate for appointment listings
    },
    PLAN: {
      defaultCursorField: 'createdAt',
      maxLimit: 50, // Standard for plan and claim listings
    },
  },
};

/**
 * Zod schema for validating pagination configuration
 */
export const paginationConfigSchema = z.object({
  maxLimit: z.number().int().positive().optional(),
  defaultLimit: z.number().int().positive().optional(),
  autoUseCursorForLargeDatasets: z.boolean().optional(),
  cursorPaginationThreshold: z.number().int().positive().optional(),
  journeyConfig: z.record(z.object({
    defaultCursorField: z.string(),
    maxLimit: z.number().int().positive().optional(),
  })).optional(),
});

/**
 * Converts a cursor string to a Prisma cursor object
 * @param cursor The cursor string to decode
 * @returns The decoded cursor object
 * @throws {DatabaseError} If the cursor cannot be decoded
 */
export function decodeCursor(cursor: string): Record<string, any> {
  try {
    const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decodedCursor);
  } catch (error) {
    throw new DatabaseError(
      PAGINATION_ERRORS.CURSOR_DECODE_ERROR,
      { cause: error, code: 'PAGINATION_ERROR' }
    );
  }
}

/**
 * Encodes a cursor object to a cursor string
 * @param cursor The cursor object to encode
 * @returns The encoded cursor string
 */
export function encodeCursor(cursor: Record<string, any>): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Creates a cursor object for a specific field and value
 * @param field The field to use as cursor
 * @param value The value of the field
 * @returns A cursor object
 */
export function createCursor(field: string, value: any): Record<string, any> {
  return { [field]: value };
}

/**
 * Converts DTO pagination parameters to internal pagination options
 * @param dto The pagination DTO from the API request
 * @param journeyContext Optional journey context for journey-specific handling
 * @param config Optional pagination configuration
 * @returns Internal pagination options
 */
export function dtoToPaginationOptions(
  dto: PaginationDto,
  journeyContext?: JourneyContext,
  config: PaginationConfig = DEFAULT_PAGINATION_CONFIG,
): PaginationOptions {
  // Get journey-specific configuration if available
  const journeyConfig = journeyContext && config.journeyConfig?.[journeyContext.journeyType];
  const maxLimit = journeyConfig?.maxLimit || config.maxLimit || MAX_PAGINATION_LIMIT;
  
  // Ensure limit is within allowed range
  const limit = Math.min(dto.limit || config.defaultLimit || DEFAULT_PAGINATION_LIMIT, maxLimit);
  
  // Handle cursor-based pagination
  if ('cursor' in dto && dto.cursor) {
    return {
      type: PaginationType.CURSOR,
      cursor: decodeCursor(dto.cursor),
      take: limit,
      journeyContext,
    };
  }
  
  // Handle page-based pagination
  const page = (dto as PagePaginationDto).page || 1;
  if (page < 1) {
    throw new DatabaseError(
      PAGINATION_ERRORS.NEGATIVE_PAGE,
      { code: 'PAGINATION_ERROR' }
    );
  }
  
  return {
    type: PaginationType.OFFSET,
    skip: (page - 1) * limit,
    take: limit,
    journeyContext,
  };
}

/**
 * Converts internal pagination options to Prisma pagination parameters
 * @param options The internal pagination options
 * @returns Prisma pagination parameters
 * @throws {DatabaseError} If the pagination type is invalid
 */
export function paginationOptionsToPrismaParams(
  options: PaginationOptions,
): { skip?: number; take?: number; cursor?: Record<string, any> } {
  switch (options.type) {
    case PaginationType.OFFSET:
      return {
        skip: (options as OffsetPaginationOptions).skip,
        take: (options as OffsetPaginationOptions).take,
      };
    case PaginationType.CURSOR:
      return {
        cursor: (options as CursorPaginationOptions).cursor,
        take: (options as CursorPaginationOptions).take,
        skip: (options as CursorPaginationOptions).skip,
      };
    default:
      throw new DatabaseError(
        PAGINATION_ERRORS.INVALID_PAGINATION_TYPE,
        { code: 'PAGINATION_ERROR' }
      );
  }
}

/**
 * Builds pagination metadata for offset-based pagination
 * @param items The items returned by the query
 * @param totalItems The total number of items available
 * @param options The pagination options used
 * @returns Pagination metadata
 */
export function buildOffsetPaginationMeta(
  items: any[],
  totalItems: number,
  options: OffsetPaginationOptions,
): PaginationMeta {
  const { skip, take } = options;
  const currentPage = Math.floor(skip / take) + 1;
  const totalPages = Math.ceil(totalItems / take);
  
  return {
    total: totalItems,
    count: items.length,
    hasMore: currentPage < totalPages,
    page: currentPage,
    pageCount: totalPages,
  };
}

/**
 * Builds pagination metadata for cursor-based pagination
 * @param items The items returned by the query
 * @param totalItems The total number of items available
 * @param options The pagination options used
 * @param cursorField The field to use for cursor generation
 * @returns Pagination metadata
 */
export function buildCursorPaginationMeta(
  items: any[],
  totalItems: number,
  options: CursorPaginationOptions,
  cursorField: string,
): PaginationMeta {
  const { take } = options;
  const hasMore = items.length === take && totalItems > take;
  
  // Create next cursor from the last item if there are more items
  const nextCursor = hasMore && items.length > 0
    ? createCursor(cursorField, items[items.length - 1][cursorField])
    : undefined;
  
  // Create previous cursor from the first item
  const prevCursor = items.length > 0
    ? createCursor(cursorField, items[0][cursorField])
    : undefined;
  
  return {
    total: totalItems,
    count: items.length,
    hasMore,
    nextCursor,
    prevCursor,
  };
}

/**
 * Builds pagination metadata based on the pagination type
 * @param items The items returned by the query
 * @param totalItems The total number of items available
 * @param options The pagination options used
 * @param cursorField The field to use for cursor generation (for cursor-based pagination)
 * @returns Pagination metadata
 * @throws {DatabaseError} If the pagination type is invalid
 */
export function buildPaginationMeta(
  items: any[],
  totalItems: number,
  options: PaginationOptions,
  cursorField?: string,
): PaginationMeta {
  switch (options.type) {
    case PaginationType.OFFSET:
      return buildOffsetPaginationMeta(
        items,
        totalItems,
        options as OffsetPaginationOptions,
      );
    case PaginationType.CURSOR:
      if (!cursorField) {
        throw new DatabaseError(
          'Cursor field is required for cursor-based pagination',
          { code: 'PAGINATION_ERROR' }
        );
      }
      return buildCursorPaginationMeta(
        items,
        totalItems,
        options as CursorPaginationOptions,
        cursorField,
      );
    default:
      throw new DatabaseError(
        PAGINATION_ERRORS.INVALID_PAGINATION_TYPE,
        { code: 'PAGINATION_ERROR' }
      );
  }
}

/**
 * Creates a paginated result with items and metadata
 * @param items The items to include in the result
 * @param meta The pagination metadata
 * @returns A paginated result
 */
export function createPaginatedResult<T>(
  items: T[],
  meta: PaginationMeta,
): PaginatedResult<T> {
  return { items, meta };
}

/**
 * Converts internal pagination metadata to DTO pagination metadata
 * @param meta The internal pagination metadata
 * @param dto The original pagination DTO
 * @returns DTO pagination metadata
 */
export function paginationMetaToDto(
  meta: PaginationMeta,
  dto: PaginationDto,
): DtoPaginationMeta {
  const result: DtoPaginationMeta = {
    totalItems: meta.total,
    itemCount: meta.count,
    hasNextPage: meta.hasMore,
    hasPrevPage: meta.page ? meta.page > 1 : false,
  };
  
  // Add page-specific metadata
  if (meta.page && meta.pageCount) {
    result.totalPages = meta.pageCount;
    result.currentPage = meta.page;
  }
  
  // Add cursor-specific metadata
  if (meta.nextCursor) {
    result.nextCursor = encodeCursor(meta.nextCursor);
  }
  
  if (meta.prevCursor) {
    result.prevCursor = encodeCursor(meta.prevCursor);
  }
  
  return result;
}

/**
 * Creates a paginated response for API endpoints
 * @param items The items to include in the response
 * @param meta The pagination metadata
 * @param dto The original pagination DTO
 * @returns A paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  meta: PaginationMeta,
  dto: PaginationDto,
): PaginatedResponse<T> {
  return {
    items,
    meta: paginationMetaToDto(meta, dto),
  };
}

/**
 * Executes a paginated query and returns the results with pagination metadata
 * @param prisma The Prisma client instance
 * @param model The Prisma model to query
 * @param params The query parameters
 * @param paginationOptions The pagination options
 * @param cursorField The field to use for cursor generation (for cursor-based pagination)
 * @returns A paginated result
 */
export async function executePaginatedQuery<T extends Prisma.PrismaClientDelegate>(
  prisma: PrismaClient,
  model: T,
  params: any,
  paginationOptions: PaginationOptions,
  cursorField?: string,
): Promise<PaginatedResult<any>> {
  // Convert pagination options to Prisma parameters
  const paginationParams = paginationOptionsToPrismaParams(paginationOptions);
  
  // Execute the query with pagination
  const items = await model.findMany({
    ...params,
    ...paginationParams,
  });
  
  // Get the total count
  const totalItems = await model.count({
    where: params.where,
  });
  
  // Build pagination metadata
  const meta = buildPaginationMeta(
    items,
    totalItems,
    paginationOptions,
    cursorField,
  );
  
  return createPaginatedResult(items, meta);
}

/**
 * Determines the best pagination strategy based on the dataset size and configuration
 * @param totalItems The total number of items in the dataset
 * @param config The pagination configuration
 * @returns The recommended pagination type
 */
export function determineBestPaginationStrategy(
  totalItems: number,
  config: PaginationConfig = DEFAULT_PAGINATION_CONFIG,
): PaginationType {
  if (
    config.autoUseCursorForLargeDatasets &&
    totalItems > (config.cursorPaginationThreshold || 1000)
  ) {
    return PaginationType.CURSOR;
  }
  
  return PaginationType.OFFSET;
}

/**
 * Gets the default cursor field for a journey
 * @param journeyContext The journey context
 * @param config The pagination configuration
 * @returns The default cursor field for the journey
 * @throws {DatabaseError} If the journey type is not supported
 */
export function getDefaultCursorField(
  journeyContext: JourneyContext,
  config: PaginationConfig = DEFAULT_PAGINATION_CONFIG,
): string {
  const journeyConfig = config.journeyConfig?.[journeyContext.journeyType];
  
  if (!journeyConfig || !journeyConfig.defaultCursorField) {
    throw new DatabaseError(
      `No default cursor field configured for journey type: ${journeyContext.journeyType}`,
      { code: 'PAGINATION_ERROR' }
    );
  }
  
  return journeyConfig.defaultCursorField;
}

/**
 * Validates pagination options against configuration
 * @param options The pagination options to validate
 * @param config The pagination configuration
 * @throws {DatabaseError} If the pagination options are invalid
 */
export function validatePaginationOptions(
  options: PaginationOptions,
  config: PaginationConfig = DEFAULT_PAGINATION_CONFIG,
): void {
  const journeyConfig = options.journeyContext && 
    config.journeyConfig?.[options.journeyContext.journeyType];
  
  const maxLimit = journeyConfig?.maxLimit || config.maxLimit || MAX_PAGINATION_LIMIT;
  
  switch (options.type) {
    case PaginationType.OFFSET: {
      const { skip, take } = options as OffsetPaginationOptions;
      
      if (skip < 0) {
        throw new DatabaseError(
          PAGINATION_ERRORS.INVALID_OFFSET,
          { code: 'PAGINATION_ERROR' }
        );
      }
      
      if (take <= 0) {
        throw new DatabaseError(
          PAGINATION_ERRORS.INVALID_LIMIT,
          { code: 'PAGINATION_ERROR' }
        );
      }
      
      if (take > maxLimit) {
        throw new DatabaseError(
          PAGINATION_ERRORS.MAX_LIMIT_EXCEEDED,
          { code: 'PAGINATION_ERROR', details: { maxLimit } }
        );
      }
      
      break;
    }
    case PaginationType.CURSOR: {
      const { cursor, take } = options as CursorPaginationOptions;
      
      if (!cursor || Object.keys(cursor).length === 0) {
        throw new DatabaseError(
          PAGINATION_ERRORS.INVALID_CURSOR,
          { code: 'PAGINATION_ERROR' }
        );
      }
      
      if (take <= 0) {
        throw new DatabaseError(
          PAGINATION_ERRORS.INVALID_LIMIT,
          { code: 'PAGINATION_ERROR' }
        );
      }
      
      if (take > maxLimit) {
        throw new DatabaseError(
          PAGINATION_ERRORS.MAX_LIMIT_EXCEEDED,
          { code: 'PAGINATION_ERROR', details: { maxLimit } }
        );
      }
      
      break;
    }
    default:
      throw new DatabaseError(
        PAGINATION_ERRORS.INVALID_PAGINATION_TYPE,
        { code: 'PAGINATION_ERROR' }
      );
  }
}

/**
 * Executes a paginated time-series query for TimescaleDB
 * @param prisma The Prisma client instance
 * @param queryOptions The time-series query options
 * @param paginationOptions The pagination options
 * @returns A paginated result
 */
export async function executeTimeSeriesPaginatedQuery(
  prisma: PrismaClient,
  queryOptions: TimeSeriesQueryOptions,
  paginationOptions: PaginationOptions,
): Promise<PaginatedResult<any>> {
  // Validate that time range is specified
  if (!queryOptions.timeRange) {
    throw new DatabaseError(
      'Time range is required for time-series queries',
      { code: 'PAGINATION_ERROR' }
    );
  }
  
  const { timeRange, timeBucket, aggregations } = queryOptions;
  const { field: timeField, start, end } = timeRange;
  
  // Build the time-series query
  let query = `
    SELECT ${timeField}${timeBucket ? `, time_bucket('${timeBucket.interval}', ${timeBucket.field}) as bucket` : ''}
  `;
  
  // Add aggregations if specified
  if (aggregations && aggregations.length > 0) {
    query += ', ' + aggregations.map(agg => 
      `${agg.function}(${agg.field}) as ${agg.alias}`
    ).join(', ');
  }
  
  // Add FROM clause and time range filter
  query += `
    FROM "${queryOptions.filter?.journeyContext?.journeyType || 'HEALTH'}_metrics"
    WHERE ${timeField} >= $1 AND ${timeField} <= $2
  `;
  
  // Add additional filters if specified
  if (queryOptions.filter?.filter) {
    // This would require converting the filter to SQL
    // For simplicity, we're omitting this complex conversion
    // In a real implementation, this would use a query builder
  }
  
  // Add GROUP BY clause if using time buckets
  if (timeBucket) {
    query += `
      GROUP BY bucket, ${timeField}
    `;
  }
  
  // Add ORDER BY clause
  query += `
    ORDER BY ${timeField} ASC
  `;
  
  // Add pagination
  const paginationParams = paginationOptionsToPrismaParams(paginationOptions);
  query += `
    LIMIT ${paginationParams.take || 20}
  `;
  
  if (paginationParams.skip) {
    query += `
      OFFSET ${paginationParams.skip}
    `;
  }
  
  // Execute the query
  const items = await prisma.$queryRawUnsafe(query, start, end);
  
  // Count total items (simplified version)
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "${queryOptions.filter?.journeyContext?.journeyType || 'HEALTH'}_metrics"
    WHERE ${timeField} >= $1 AND ${timeField} <= $2
  `;
  
  const countResult = await prisma.$queryRawUnsafe(countQuery, start, end);
  const totalItems = parseInt(countResult[0].total, 10);
  
  // Build pagination metadata
  const meta = buildPaginationMeta(
    items as any[],
    totalItems,
    paginationOptions,
    timeField,
  );
  
  return createPaginatedResult(items, meta);
}

/**
 * Journey-specific pagination utilities for Health journey
 */
export const HealthPagination = {
  /**
   * Default cursor field for Health journey
   */
  DEFAULT_CURSOR_FIELD: 'timestamp',
  
  /**
   * Creates pagination options optimized for health metrics
   * @param dto The pagination DTO
   * @returns Pagination options for health metrics
   */
  forHealthMetrics: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'HEALTH' });
  },
  
  /**
   * Creates pagination options optimized for health goals
   * @param dto The pagination DTO
   * @returns Pagination options for health goals
   */
  forHealthGoals: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'HEALTH', metadata: { entity: 'goals' } });
  },
  
  /**
   * Creates time-series query options for health metrics
   * @param startDate The start date for the time range
   * @param endDate The end date for the time range
   * @param metricType Optional metric type filter
   * @param interval Optional time bucket interval (e.g., '1 hour', '1 day')
   * @returns Time-series query options
   */
  createTimeSeriesOptions: (
    startDate: Date,
    endDate: Date,
    metricType?: string,
    interval?: string,
  ): TimeSeriesQueryOptions => {
    const options: TimeSeriesQueryOptions = {
      timeRange: {
        start: startDate,
        end: endDate,
        field: 'timestamp',
      },
      journeyContext: { journeyType: 'HEALTH' },
    };
    
    if (interval) {
      options.timeBucket = {
        interval,
        field: 'timestamp',
      };
    }
    
    if (metricType) {
      options.filter = {
        filter: {
          field: 'type',
          operator: 'equals',
          value: metricType,
        },
        journeyContext: { journeyType: 'HEALTH' },
      };
    }
    
    return options;
  },
};

/**
 * Journey-specific pagination utilities for Care journey
 */
export const CarePagination = {
  /**
   * Default cursor field for Care journey
   */
  DEFAULT_CURSOR_FIELD: 'scheduledAt',
  
  /**
   * Creates pagination options optimized for appointments
   * @param dto The pagination DTO
   * @returns Pagination options for appointments
   */
  forAppointments: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'CARE', metadata: { entity: 'appointments' } });
  },
  
  /**
   * Creates pagination options optimized for medications
   * @param dto The pagination DTO
   * @returns Pagination options for medications
   */
  forMedications: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'CARE', metadata: { entity: 'medications' } });
  },
  
  /**
   * Creates pagination options optimized for providers
   * @param dto The pagination DTO
   * @returns Pagination options for providers
   */
  forProviders: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'CARE', metadata: { entity: 'providers' } });
  },
};

/**
 * Journey-specific pagination utilities for Plan journey
 */
export const PlanPagination = {
  /**
   * Default cursor field for Plan journey
   */
  DEFAULT_CURSOR_FIELD: 'createdAt',
  
  /**
   * Creates pagination options optimized for plans
   * @param dto The pagination DTO
   * @returns Pagination options for plans
   */
  forPlans: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'PLAN', metadata: { entity: 'plans' } });
  },
  
  /**
   * Creates pagination options optimized for claims
   * @param dto The pagination DTO
   * @returns Pagination options for claims
   */
  forClaims: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'PLAN', metadata: { entity: 'claims' } });
  },
  
  /**
   * Creates pagination options optimized for benefits
   * @param dto The pagination DTO
   * @returns Pagination options for benefits
   */
  forBenefits: (dto: PaginationDto): PaginationOptions => {
    return dtoToPaginationOptions(dto, { journeyType: 'PLAN', metadata: { entity: 'benefits' } });
  },
};

/**
 * Handles pagination errors gracefully
 * @param error The error that occurred
 * @param fallbackItems Fallback items to return in case of error
 * @param fallbackMeta Fallback pagination metadata to return in case of error
 * @returns A paginated result with fallback values
 */
export function handlePaginationError<T>(
  error: any,
  fallbackItems: T[] = [],
  fallbackMeta: Partial<PaginationMeta> = {},
): PaginatedResult<T> {
  console.error('Pagination error:', error);
  
  // Create fallback metadata
  const meta: PaginationMeta = {
    total: fallbackItems.length,
    count: fallbackItems.length,
    hasMore: false,
    ...fallbackMeta,
  };
  
  return createPaginatedResult(fallbackItems, meta);
}

/**
 * Checks if a paginated result is empty
 * @param result The paginated result to check
 * @returns True if the result is empty, false otherwise
 */
export function isPaginatedResultEmpty<T>(result: PaginatedResult<T>): boolean {
  return result.items.length === 0;
}

/**
 * Merges multiple paginated results into a single result
 * @param results The paginated results to merge
 * @returns A merged paginated result
 */
export function mergePaginatedResults<T>(
  results: PaginatedResult<T>[],
): PaginatedResult<T> {
  if (results.length === 0) {
    return createPaginatedResult([], {
      total: 0,
      count: 0,
      hasMore: false,
    });
  }
  
  // Merge items
  const mergedItems = results.flatMap(result => result.items);
  
  // Merge metadata
  const mergedMeta: PaginationMeta = {
    total: results.reduce((sum, result) => sum + result.meta.total, 0),
    count: mergedItems.length,
    hasMore: results.some(result => result.meta.hasMore),
  };
  
  return createPaginatedResult(mergedItems, mergedMeta);
}