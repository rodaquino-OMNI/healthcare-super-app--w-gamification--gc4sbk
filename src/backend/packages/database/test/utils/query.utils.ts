/**
 * Database Query Testing Utilities
 * 
 * This module provides utilities for common database query patterns used in tests.
 * It includes helper functions for retrieving, comparing, and manipulating database
 * records in a testing context, with support for complex filtering, sorting, and
 * pagination operations across all journeys.
 * 
 * Key features:
 * - Generic query utilities for any Prisma model
 * - Journey-specific query helpers for health metrics, appointments, claims, and achievements
 * - Utilities for simulating database failures and edge cases
 * - Support for transaction testing
 * - Comprehensive filtering, sorting, and pagination options
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../src/connection/prisma.service';
import { 
  FilterOptions, 
  SortOptions, 
  PaginationOptions,
  DatabaseError,
  ConnectionPoolOptions
} from '../../../src/utils';
import { Logger } from '../../../src/utils/logger';

/**
 * Type representing a Prisma model delegate
 */
type PrismaDelegate = any;

/**
 * Type representing a record from any Prisma model
 */
type PrismaRecord = Record<string, any>;

/**
 * Type representing a journey in the AUSTA SuperApp
 */
export type Journey = 'health' | 'care' | 'plan' | 'gamification';

/**
 * Type representing a database error category
 */
export type DatabaseErrorCategory = 
  | 'connection' 
  | 'timeout' 
  | 'constraint' 
  | 'foreign_key' 
  | 'not_found' 
  | 'transaction' 
  | 'query' 
  | 'unknown';

/**
 * Options for executing a query with potential failure simulation
 */
export interface QueryExecutionOptions {
  /** Whether to simulate a database timeout */
  simulateTimeout?: boolean;
  /** Whether to simulate a connection error */
  simulateConnectionError?: boolean;
  /** Whether to simulate a constraint violation */
  simulateConstraintViolation?: boolean;
  /** Whether to simulate a foreign key violation */
  simulateForeignKeyViolation?: boolean;
  /** Whether to simulate a record not found error */
  simulateRecordNotFound?: boolean;
  /** Whether to simulate a transaction failure */
  simulateTransactionFailure?: boolean;
  /** Custom error to throw */
  customError?: Error;
  /** Delay in milliseconds before executing the query */
  delay?: number;
  /** Error category for structured error handling */
  errorCategory?: DatabaseErrorCategory;
  /** Additional error metadata */
  errorMetadata?: Record<string, any>;
  /** Whether to log the error */
  logError?: boolean;
}

/**
 * Options for retrieving records with filtering, sorting, and pagination
 */
export interface RecordRetrievalOptions {
  /** Filtering options */
  filter?: FilterOptions;
  /** Sorting options */
  sort?: SortOptions;
  /** Pagination options */
  pagination?: PaginationOptions;
  /** Relations to include */
  include?: Record<string, boolean | object>;
  /** Fields to select */
  select?: Record<string, boolean>;
  /** Transaction options */
  transaction?: boolean | { isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable' };
  /** Connection pool options */
  connectionPool?: ConnectionPoolOptions;
  /** Query execution options for simulating failures */
  executionOptions?: QueryExecutionOptions;
  /** Whether to return total count with results */
  withTotalCount?: boolean;
}

/**
 * Executes a database query with support for simulating various failure scenarios.
 * Useful for testing error handling in database operations.
 *
 * @param queryFn - The query function to execute
 * @param options - Options for query execution including failure simulation
 * @returns The result of the query function
 * @throws Various errors based on the simulation options
 */
export async function executeQueryWithPotentialFailure<T>(
  queryFn: () => Promise<T>,
  options: QueryExecutionOptions = {}
): Promise<T> {
  const {
    simulateTimeout,
    simulateConnectionError,
    simulateConstraintViolation,
    simulateForeignKeyViolation,
    simulateRecordNotFound,
    simulateTransactionFailure,
    customError,
    delay = 0,
    errorCategory,
    errorMetadata,
    logError = true
  } = options;

  // Simulate delay if specified
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  let error: any;

  // Simulate various error conditions
  if (simulateTimeout) {
    error = new Error('Database query timeout');
    error.code = 'ETIMEDOUT';
    error.category = errorCategory || 'timeout';
  }

  if (simulateConnectionError) {
    error = new Error('Database connection error: could not connect to database server');
    error.code = 'ECONNREFUSED';
    error.category = errorCategory || 'connection';
  }

  if (simulateConstraintViolation) {
    error = new Error('Database constraint violation');
    error.code = 'P2002'; // Prisma unique constraint violation code
    error.category = errorCategory || 'constraint';
    error.meta = { target: ['unique_constraint', ...(errorMetadata?.target || [])] };
  }

  if (simulateForeignKeyViolation) {
    error = new Error('Database foreign key violation');
    error.code = 'P2003'; // Prisma foreign key constraint violation code
    error.category = errorCategory || 'foreign_key';
    error.meta = { field_name: errorMetadata?.field_name || 'foreign_key_field' };
  }

  if (simulateRecordNotFound) {
    error = new Error('Record not found');
    error.code = 'P2025'; // Prisma record not found error code
    error.category = errorCategory || 'not_found';
    error.meta = { 
      model: errorMetadata?.model || 'unknown_model', 
      id: errorMetadata?.id || 'unknown_id' 
    };
  }

  if (simulateTransactionFailure) {
    error = new Error('Transaction failed');
    error.code = 'P2034'; // Prisma transaction failure code
    error.category = errorCategory || 'transaction';
  }

  if (customError) {
    error = customError;
    error.category = errorCategory || 'unknown';
  }

  // If we have an error to throw
  if (error) {
    // Add any additional metadata
    if (errorMetadata && !error.meta) {
      error.meta = errorMetadata;
    }

    // Log the error if requested
    if (logError) {
      Logger.error('Database error during test', {
        error: {
          message: error.message,
          code: error.code,
          category: error.category,
          meta: error.meta
        }
      });
    }

    throw error;
  }

  // Execute the actual query
  try {
    return await queryFn();
  } catch (queryError: any) {
    // Enhance the real error with category if not already present
    if (!queryError.category) {
      queryError.category = errorCategory || 'query';
    }
    
    // Log the real error if requested
    if (logError) {
      Logger.error('Unexpected database error during test', {
        error: {
          message: queryError.message,
          code: queryError.code,
          category: queryError.category,
          meta: queryError.meta || errorMetadata
        }
      });
    }
    
    throw queryError;
  }
}

/**
 * Retrieves records from a Prisma model with support for filtering, sorting, and pagination.
 * Provides a consistent interface for querying any Prisma model in tests.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model to query
 * @param options - Options for record retrieval
 * @returns The retrieved records or an object with records and total count
 */
export async function getRecords<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  options: RecordRetrievalOptions = {}
): Promise<T[] | { records: T[], totalCount: number }> {
  const { 
    filter, 
    sort, 
    pagination, 
    include, 
    select, 
    transaction, 
    connectionPool,
    executionOptions,
    withTotalCount 
  } = options;
  
  // Get the appropriate model delegate
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }

  // Build the query arguments
  const args: Record<string, any> = {};
  
  // Add filtering if provided
  if (filter) {
    args.where = filter;
  }
  
  // Add sorting if provided
  if (sort) {
    args.orderBy = sort;
  }
  
  // Add pagination if provided
  if (pagination) {
    if ('skip' in pagination) {
      args.skip = pagination.skip;
    }
    if ('take' in pagination) {
      args.take = pagination.take;
    }
    if ('cursor' in pagination) {
      args.cursor = pagination.cursor;
    }
  }
  
  // Add relations to include if provided
  if (include) {
    args.include = include;
  }
  
  // Add fields to select if provided
  if (select) {
    args.select = select;
  }
  
  // Configure connection pool if provided
  if (connectionPool && prisma instanceof PrismaService) {
    prisma.configureConnectionPool(connectionPool);
  }
  
  // Define the query function
  const executeQuery = async () => {
    // If we need to run in a transaction
    if (transaction) {
      const isolationLevel = typeof transaction === 'object' ? transaction.isolationLevel : undefined;
      
      // Execute in a transaction with the specified isolation level
      return prisma.$transaction(async (tx) => {
        const result = await tx[modelName].findMany(args);
        
        if (withTotalCount) {
          const totalCount = await tx[modelName].count({ where: args.where });
          return { records: result, totalCount };
        }
        
        return result;
      }, { isolationLevel });
    }
    
    // Execute without a transaction
    const result = await delegate.findMany(args);
    
    if (withTotalCount) {
      const totalCount = await delegate.count({ where: args.where });
      return { records: result, totalCount };
    }
    
    return result;
  };
  
  // Execute the query with potential failure simulation if options provided
  if (executionOptions) {
    return executeQueryWithPotentialFailure(executeQuery, executionOptions);
  }
  
  // Execute the query normally
  return executeQuery();
}

/**
 * Retrieves a single record by ID from a Prisma model.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model to query
 * @param id - The ID of the record to retrieve
 * @param include - Relations to include
 * @returns The retrieved record or null if not found
 */
export async function getRecordById<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  id: string | number,
  include?: Record<string, boolean | object>
): Promise<T | null> {
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  const args: Record<string, any> = {
    where: { id }
  };
  
  if (include) {
    args.include = include;
  }
  
  return delegate.findUnique(args);
}

/**
 * Counts records in a Prisma model with optional filtering.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model to query
 * @param filter - Optional filter criteria
 * @returns The count of matching records
 */
export async function countRecords(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  filter?: FilterOptions
): Promise<number> {
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  const args: Record<string, any> = {};
  
  if (filter) {
    args.where = filter;
  }
  
  return delegate.count(args);
}

/**
 * Creates a test record in a Prisma model.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model
 * @param data - The data for the new record
 * @returns The created record
 */
export async function createTestRecord<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  data: Record<string, any>
): Promise<T> {
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  return delegate.create({ data });
}

/**
 * Updates a test record in a Prisma model.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model
 * @param id - The ID of the record to update
 * @param data - The data to update
 * @returns The updated record
 */
export async function updateTestRecord<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  id: string | number,
  data: Record<string, any>
): Promise<T> {
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  return delegate.update({
    where: { id },
    data
  });
}

/**
 * Deletes a test record from a Prisma model.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model
 * @param id - The ID of the record to delete
 * @returns The deleted record
 */
export async function deleteTestRecord<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  id: string | number
): Promise<T> {
  const delegate = prisma[modelName] as PrismaDelegate;
  if (!delegate) {
    throw new Error(`Model ${modelName} not found in Prisma client`);
  }
  
  return delegate.delete({
    where: { id }
  });
}

/**
 * Executes a raw SQL query for testing purposes.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param sql - The SQL query to execute
 * @param parameters - Query parameters
 * @returns The query result
 */
export async function executeRawQuery(
  prisma: PrismaService | PrismaClient,
  sql: string,
  parameters: any[] = []
): Promise<any> {
  return prisma.$queryRaw`${sql}${parameters}`;
}

/**
 * Executes a transaction with multiple operations for testing purposes.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param operations - Array of operations to execute in the transaction
 * @param options - Transaction options including isolation level and timeout
 * @param executionOptions - Options for simulating failures
 * @returns The results of all operations
 */
export async function executeTransaction<T>(
  prisma: PrismaService | PrismaClient,
  operations: Array<() => Promise<any>>,
  options?: {
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    timeout?: number;
    maxWait?: number;
  },
  executionOptions?: QueryExecutionOptions
): Promise<T[]> {
  const executeQuery = async () => {
    return prisma.$transaction(operations, options);
  };
  
  // Execute with potential failure simulation if options provided
  if (executionOptions) {
    return executeQueryWithPotentialFailure(executeQuery, executionOptions);
  }
  
  // Execute normally
  return executeQuery();
}

/**
 * Executes a transaction with an interactive callback function for testing purposes.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param callback - Interactive transaction callback
 * @param options - Transaction options including isolation level and timeout
 * @param executionOptions - Options for simulating failures
 * @returns The result of the transaction callback
 */
export async function executeInteractiveTransaction<T>(
  prisma: PrismaService | PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>,
  options?: {
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
    timeout?: number;
    maxWait?: number;
  },
  executionOptions?: QueryExecutionOptions
): Promise<T> {
  const executeQuery = async () => {
    return prisma.$transaction(callback, options);
  };
  
  // Execute with potential failure simulation if options provided
  if (executionOptions) {
    return executeQueryWithPotentialFailure(executeQuery, executionOptions);
  }
  
  // Execute normally
  return executeQuery();
}

// Journey-specific query utilities

/**
 * Interface for paginated results with metadata
 */
export interface PaginatedResults<T> {
  /** The records returned */
  records: T[];
  /** The total count of records matching the filter */
  totalCount: number;
  /** The current page number */
  page: number;
  /** The number of records per page */
  pageSize: number;
  /** The total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Creates a paginated result object with metadata
 * 
 * @param records - The records returned from the query
 * @param totalCount - The total count of records matching the filter
 * @param page - The current page number
 * @param pageSize - The number of records per page
 * @returns A paginated result object with metadata
 */
export function createPaginatedResults<T>(
  records: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginatedResults<T> {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    records,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/**
 * Retrieves records with pagination and returns a paginated result object
 * 
 * @param prisma - The PrismaService or PrismaClient instance
 * @param modelName - The name of the Prisma model to query
 * @param page - The page number to retrieve
 * @param pageSize - The number of records per page
 * @param options - Additional query options
 * @returns A paginated result object
 */
export async function getPaginatedRecords<T extends PrismaRecord>(
  prisma: PrismaService | PrismaClient,
  modelName: string,
  page: number,
  pageSize: number,
  options: Omit<RecordRetrievalOptions, 'pagination'> = {}
): Promise<PaginatedResults<T>> {
  // Calculate skip value
  const skip = (page - 1) * pageSize;
  
  // Get records with pagination
  const result = await getRecords<T>(prisma, modelName, {
    ...options,
    pagination: { skip, take: pageSize },
    withTotalCount: true
  }) as { records: T[], totalCount: number };
  
  // Create paginated result object
  return createPaginatedResults(
    result.records,
    result.totalCount,
    page,
    pageSize
  );
}

/**
 * Health Journey: Retrieves health metrics with filtering options.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param options - Additional query options
 * @returns The retrieved health metrics
 */
export async function getHealthMetrics(
  prisma: PrismaService | PrismaClient,
  userId: string,
  options: RecordRetrievalOptions = {}
): Promise<any[] | PaginatedResults<any> | { records: any[], totalCount: number }> {
  const filter = {
    userId,
    ...options.filter
  };
  
  // If pagination is requested with page and pageSize
  if (options.pagination && 'page' in options.pagination && 'pageSize' in options.pagination) {
    const { page, pageSize } = options.pagination;
    return getPaginatedRecords(prisma, 'healthMetric', page, pageSize, {
      ...options,
      filter,
      include: { type: true, ...options.include }
    });
  }
  
  // Otherwise use standard getRecords
  return getRecords(prisma, 'healthMetric', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Health Journey: Retrieves health metrics by type with filtering options.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param metricType - The metric type to filter by
 * @param options - Additional query options
 * @returns The retrieved health metrics
 */
export async function getHealthMetricsByType(
  prisma: PrismaService | PrismaClient,
  userId: string,
  metricType: string,
  options: RecordRetrievalOptions = {}
): Promise<any[]> {
  const filter = {
    userId,
    type: {
      name: metricType
    },
    ...options.filter
  };
  
  return getRecords(prisma, 'healthMetric', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Health Journey: Retrieves health metrics within a date range.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param startDate - The start date of the range
 * @param endDate - The end date of the range
 * @param options - Additional query options
 * @returns The retrieved health metrics
 */
export async function getHealthMetricsInDateRange(
  prisma: PrismaService | PrismaClient,
  userId: string,
  startDate: Date,
  endDate: Date,
  options: RecordRetrievalOptions = {}
): Promise<any[]> {
  const filter = {
    userId,
    timestamp: {
      gte: startDate,
      lte: endDate
    },
    ...options.filter
  };
  
  return getRecords(prisma, 'healthMetric', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Care Journey: Retrieves appointments with filtering options.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param options - Additional query options
 * @returns The retrieved appointments
 */
export async function getAppointments(
  prisma: PrismaService | PrismaClient,
  userId: string,
  options: RecordRetrievalOptions = {}
): Promise<any[] | PaginatedResults<any> | { records: any[], totalCount: number }> {
  const filter = {
    userId,
    ...options.filter
  };
  
  // If pagination is requested with page and pageSize
  if (options.pagination && 'page' in options.pagination && 'pageSize' in options.pagination) {
    const { page, pageSize } = options.pagination;
    return getPaginatedRecords(prisma, 'appointment', page, pageSize, {
      ...options,
      filter,
      include: { provider: true, ...options.include }
    });
  }
  
  // Otherwise use standard getRecords
  return getRecords(prisma, 'appointment', {
    ...options,
    filter,
    include: { provider: true, ...options.include }
  });
}

/**
 * Care Journey: Retrieves upcoming appointments.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param options - Additional query options
 * @returns The retrieved upcoming appointments
 */
export async function getUpcomingAppointments(
  prisma: PrismaService | PrismaClient,
  userId: string,
  options: RecordRetrievalOptions = {}
): Promise<any[]> {
  const now = new Date();
  
  const filter = {
    userId,
    date: {
      gte: now
    },
    ...options.filter
  };
  
  return getRecords(prisma, 'appointment', {
    ...options,
    filter,
    sort: { date: 'asc', ...options.sort },
    include: { provider: true, ...options.include }
  });
}

/**
 * Plan Journey: Retrieves claims with filtering options.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param options - Additional query options
 * @returns The retrieved claims
 */
export async function getClaims(
  prisma: PrismaService | PrismaClient,
  userId: string,
  options: RecordRetrievalOptions = {}
): Promise<any[] | PaginatedResults<any> | { records: any[], totalCount: number }> {
  const filter = {
    userId,
    ...options.filter
  };
  
  // If pagination is requested with page and pageSize
  if (options.pagination && 'page' in options.pagination && 'pageSize' in options.pagination) {
    const { page, pageSize } = options.pagination;
    return getPaginatedRecords(prisma, 'claim', page, pageSize, {
      ...options,
      filter,
      include: { type: true, ...options.include }
    });
  }
  
  // Otherwise use standard getRecords
  return getRecords(prisma, 'claim', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Plan Journey: Retrieves claims by status.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param status - The claim status to filter by
 * @param options - Additional query options
 * @returns The retrieved claims
 */
export async function getClaimsByStatus(
  prisma: PrismaService | PrismaClient,
  userId: string,
  status: string,
  options: RecordRetrievalOptions = {}
): Promise<any[]> {
  const filter = {
    userId,
    status,
    ...options.filter
  };
  
  return getRecords(prisma, 'claim', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Gamification Journey: Retrieves achievements with filtering options.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param options - Additional query options
 * @returns The retrieved achievements
 */
export async function getAchievements(
  prisma: PrismaService | PrismaClient,
  userId: string,
  options: RecordRetrievalOptions = {}
): Promise<any[] | PaginatedResults<any> | { records: any[], totalCount: number }> {
  const filter = {
    userId,
    ...options.filter
  };
  
  // If pagination is requested with page and pageSize
  if (options.pagination && 'page' in options.pagination && 'pageSize' in options.pagination) {
    const { page, pageSize } = options.pagination;
    return getPaginatedRecords(prisma, 'achievement', page, pageSize, {
      ...options,
      filter,
      include: { type: true, ...options.include }
    });
  }
  
  // Otherwise use standard getRecords
  return getRecords(prisma, 'achievement', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Gamification Journey: Retrieves achievements by journey.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param userId - The user ID to filter by
 * @param journey - The journey to filter by (health, care, plan)
 * @param options - Additional query options
 * @returns The retrieved achievements
 */
export async function getAchievementsByJourney(
  prisma: PrismaService | PrismaClient,
  userId: string,
  journey: 'health' | 'care' | 'plan',
  options: RecordRetrievalOptions = {}
): Promise<any[]> {
  const filter = {
    userId,
    type: {
      journey
    },
    ...options.filter
  };
  
  return getRecords(prisma, 'achievement', {
    ...options,
    filter,
    include: { type: true, ...options.include }
  });
}

/**
 * Simulates a database connection failure for testing error handling.
 *
 * @param prisma - The PrismaService or PrismaClient instance
 * @param options - Additional options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database connection failure
 */
export async function simulateDatabaseConnectionFailure(
  prisma: PrismaService | PrismaClient,
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
  } = {}
): Promise<never> {
  const {
    errorMessage = 'Database connection failure: could not connect to database server',
    errorCode = 'ECONNREFUSED',
    errorMetadata,
    logError = true
  } = options;
  
  // Attempt to disconnect to simulate a clean test environment
  try {
    await (prisma as any).$disconnect();
  } catch (e) {
    // Ignore disconnect errors
  }
  
  const error = new Error(errorMessage) as any;
  error.code = errorCode;
  error.category = 'connection';
  
  if (errorMetadata) {
    error.meta = errorMetadata;
  }
  
  if (logError) {
    Logger.error('Simulated database connection failure', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database query timeout for testing error handling.
 *
 * @param delay - The delay in milliseconds before throwing the timeout error
 * @param options - Additional options for the simulated error
 * @returns Never resolves, always throws an error after the specified delay
 * @throws Error simulating a database query timeout
 */
export async function simulateDatabaseQueryTimeout(
  delay = 1000,
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
  } = {}
): Promise<never> {
  const {
    errorMessage = 'Database query timeout: query execution time exceeded the timeout threshold',
    errorCode = 'ETIMEDOUT',
    errorMetadata,
    logError = true
  } = options;
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const error = new Error(errorMessage) as any;
  error.code = errorCode;
  error.category = 'timeout';
  
  if (errorMetadata) {
    error.meta = errorMetadata;
  }
  
  if (logError) {
    Logger.error('Simulated database query timeout', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta,
        delay
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database constraint violation for testing error handling.
 *
 * @param constraintName - The name of the violated constraint
 * @param options - Additional options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database constraint violation
 */
export async function simulateDatabaseConstraintViolation(
  constraintName = 'unique_constraint',
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
    modelName?: string;
  } = {}
): Promise<never> {
  const {
    errorMessage,
    errorCode = 'P2002', // Prisma unique constraint violation code
    errorMetadata,
    logError = true,
    modelName
  } = options;
  
  const message = errorMessage || `Database constraint violation: ${constraintName}${modelName ? ` on model ${modelName}` : ''}`;
  
  const error = new Error(message) as any;
  error.code = errorCode;
  error.category = 'constraint';
  error.meta = { 
    target: [constraintName],
    modelName,
    ...errorMetadata
  };
  
  if (logError) {
    Logger.error('Simulated database constraint violation', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database foreign key violation for testing error handling.
 *
 * @param foreignKeyName - The name of the violated foreign key
 * @param options - Additional options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database foreign key violation
 */
export async function simulateDatabaseForeignKeyViolation(
  foreignKeyName = 'foreign_key_constraint',
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
    modelName?: string;
    referencedModel?: string;
  } = {}
): Promise<never> {
  const {
    errorMessage,
    errorCode = 'P2003', // Prisma foreign key constraint violation code
    errorMetadata,
    logError = true,
    modelName,
    referencedModel
  } = options;
  
  const message = errorMessage || `Database foreign key violation: ${foreignKeyName}${modelName ? ` on model ${modelName}` : ''}${referencedModel ? ` referencing ${referencedModel}` : ''}`;
  
  const error = new Error(message) as any;
  error.code = errorCode;
  error.category = 'foreign_key';
  error.meta = { 
    field_name: foreignKeyName,
    modelName,
    referencedModel,
    ...errorMetadata
  };
  
  if (logError) {
    Logger.error('Simulated database foreign key violation', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database record not found error for testing error handling.
 *
 * @param modelName - The name of the model
 * @param id - The ID that was not found
 * @param options - Additional options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database record not found error
 */
export async function simulateDatabaseRecordNotFound(
  modelName: string,
  id: string | number,
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
    journey?: Journey;
  } = {}
): Promise<never> {
  const {
    errorMessage,
    errorCode = 'P2025', // Prisma record not found error code
    errorMetadata,
    logError = true,
    journey
  } = options;
  
  const message = errorMessage || `Record not found: ${modelName} with ID ${id}${journey ? ` in ${journey} journey` : ''}`;
  
  const error = new Error(message) as any;
  error.code = errorCode;
  error.category = 'not_found';
  error.meta = { 
    model: modelName, 
    id,
    journey,
    ...errorMetadata
  };
  
  if (logError) {
    Logger.error('Simulated database record not found', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database transaction failure for testing error handling.
 *
 * @param options - Options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database transaction failure
 */
export async function simulateDatabaseTransactionFailure(
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  } = {}
): Promise<never> {
  const {
    errorMessage = 'Database transaction failure: transaction could not be committed',
    errorCode = 'P2034', // Prisma transaction failure code
    errorMetadata,
    logError = true,
    isolationLevel
  } = options;
  
  const error = new Error(errorMessage) as any;
  error.code = errorCode;
  error.category = 'transaction';
  error.meta = { 
    isolationLevel,
    ...errorMetadata
  };
  
  if (logError) {
    Logger.error('Simulated database transaction failure', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}

/**
 * Simulates a database connection pool exhaustion for testing error handling.
 *
 * @param options - Options for the simulated error
 * @returns Never resolves, always throws an error
 * @throws Error simulating a database connection pool exhaustion
 */
export async function simulateDatabaseConnectionPoolExhaustion(
  options: {
    errorMessage?: string;
    errorCode?: string;
    errorMetadata?: Record<string, any>;
    logError?: boolean;
    poolSize?: number;
    waitTime?: number;
  } = {}
): Promise<never> {
  const {
    errorMessage = 'Database connection pool exhausted: no connections available',
    errorCode = 'P1001', // Prisma can't reach database server
    errorMetadata,
    logError = true,
    poolSize = 10,
    waitTime = 30000
  } = options;
  
  const error = new Error(errorMessage) as any;
  error.code = errorCode;
  error.category = 'connection';
  error.meta = { 
    poolSize,
    waitTime,
    ...errorMetadata
  };
  
  if (logError) {
    Logger.error('Simulated database connection pool exhaustion', {
      error: {
        message: error.message,
        code: error.code,
        category: error.category,
        meta: error.meta
      }
    });
  }
  
  throw error;
}