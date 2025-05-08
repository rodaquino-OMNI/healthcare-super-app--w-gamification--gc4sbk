/**
 * Query Builder Utilities
 * 
 * This file provides advanced query building utilities for constructing optimized Prisma
 * database queries. It implements composable query builders with support for complex
 * conditions, relations, and aggregations while maintaining type safety.
 * 
 * Features:
 * - Type-safe query builder pattern for complex Prisma queries
 * - Journey-specific query optimizations for each service domain
 * - Query plan analysis utilities for performance troubleshooting
 * - Utilities for partial query reuse across related entities
 * - Enhanced error handling for complex query failures
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { JourneyType } from '../types/journey.types';
import { DatabaseException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';

// Logger for query builder operations
const logger = new Logger('QueryBuilder');

/**
 * Type representing any Prisma model
 */
type PrismaModel = Prisma.ModelName;

/**
 * Type representing a Prisma delegate for any model
 */
type PrismaDelegateMethod<T extends PrismaModel> = PrismaClient[Uncapitalize<T>];

/**
 * Type representing a Prisma query operation
 */
type PrismaQueryOperation = 'findUnique' | 'findFirst' | 'findMany' | 'count' | 'aggregate';

/**
 * Type representing a Prisma mutation operation
 */
type PrismaMutationOperation = 'create' | 'createMany' | 'update' | 'updateMany' | 'upsert' | 'delete' | 'deleteMany';

/**
 * Type representing any Prisma operation
 */
type PrismaOperation = PrismaQueryOperation | PrismaMutationOperation;

/**
 * Type representing Prisma query arguments for any model and operation
 */
type PrismaQueryArgs<
  T extends PrismaModel,
  O extends PrismaOperation
> = Parameters<PrismaDelegateMethod<T>[O]>[0];

/**
 * Type representing Prisma query result for any model and operation
 */
type PrismaQueryResult<
  T extends PrismaModel,
  O extends PrismaOperation
> = ReturnType<PrismaDelegateMethod<T>[O]>;

/**
 * Interface for query builder options
 */
export interface QueryBuilderOptions {
  /**
   * The journey type this query is associated with
   * Used for journey-specific optimizations
   */
  journeyType?: JourneyType;

  /**
   * Whether to enable query logging
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Whether to enable query plan analysis
   * @default false
   */
  enableQueryPlanAnalysis?: boolean;

  /**
   * Whether to enable performance tracking
   * @default true
   */
  enablePerformanceTracking?: boolean;

  /**
   * Whether to enable automatic retry for failed queries
   * @default true
   */
  enableAutoRetry?: boolean;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay between retries in milliseconds
   * @default 100
   */
  baseRetryDelay?: number;

  /**
   * Maximum delay between retries in milliseconds
   * @default 5000
   */
  maxRetryDelay?: number;

  /**
   * Whether to use jitter to prevent retry storms
   * @default true
   */
  useRetryJitter?: boolean;

  /**
   * Timeout for the query in milliseconds
   * @default 30000 (30 seconds)
   */
  queryTimeout?: number;
}

/**
 * Default options for query builder
 */
const defaultQueryBuilderOptions: QueryBuilderOptions = {
  enableLogging: false,
  enableQueryPlanAnalysis: false,
  enablePerformanceTracking: true,
  enableAutoRetry: true,
  maxRetries: 3,
  baseRetryDelay: 100,
  maxRetryDelay: 5000,
  useRetryJitter: true,
  queryTimeout: 30000,
};

/**
 * Interface for query plan analysis result
 */
export interface QueryPlanAnalysisResult {
  /**
   * The query plan as returned by the database
   */
  plan: any;

  /**
   * Whether the query uses indexes effectively
   */
  usesIndexes: boolean;

  /**
   * Indexes used by the query
   */
  indexesUsed: string[];

  /**
   * Estimated cost of the query
   */
  estimatedCost: number;

  /**
   * Estimated number of rows returned
   */
  estimatedRows: number;

  /**
   * Optimization suggestions for the query
   */
  optimizationSuggestions: string[];

  /**
   * Whether the query contains any potential performance issues
   */
  hasPerformanceIssues: boolean;

  /**
   * Performance issues identified in the query
   */
  performanceIssues: string[];
}

/**
 * Interface for query execution statistics
 */
export interface QueryExecutionStats {
  /**
   * The query that was executed
   */
  query: string;

  /**
   * Parameters used in the query
   */
  params: Record<string, any>;

  /**
   * When the query started executing
   */
  startTime: Date;

  /**
   * When the query finished executing
   */
  endTime: Date;

  /**
   * How long the query took to execute in milliseconds
   */
  executionTimeMs: number;

  /**
   * Number of rows returned by the query
   */
  rowCount: number;

  /**
   * Whether the query was successful
   */
  successful: boolean;

  /**
   * Error message if the query failed
   */
  errorMessage?: string;

  /**
   * Number of retry attempts made
   */
  retryAttempts: number;

  /**
   * Query plan analysis result if enabled
   */
  queryPlanAnalysis?: QueryPlanAnalysisResult;
}

/**
 * Base class for query builders
 * Provides common functionality for all query builders
 */
export abstract class BaseQueryBuilder<T extends PrismaModel> {
  protected readonly options: QueryBuilderOptions;
  protected readonly modelName: T;
  protected stats: Partial<QueryExecutionStats>;

  /**
   * Creates a new instance of BaseQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: QueryBuilderOptions = {}) {
    this.modelName = modelName;
    this.options = { ...defaultQueryBuilderOptions, ...options };
    this.stats = {
      retryAttempts: 0,
    };
  }

  /**
   * Gets the journey type for this query builder
   * @returns The journey type or undefined if not set
   */
  protected getJourneyType(): JourneyType | undefined {
    return this.options.journeyType;
  }

  /**
   * Logs a query if logging is enabled
   * @param operation The operation being performed
   * @param args The query arguments
   */
  protected logQuery(operation: PrismaOperation, args: any): void {
    if (!this.options.enableLogging) {
      return;
    }

    logger.debug(
      `Executing ${operation} on ${this.modelName} with args: ${JSON.stringify(
        args,
        null,
        2
      )}`
    );
  }

  /**
   * Starts tracking query execution statistics
   * @param operation The operation being performed
   * @param args The query arguments
   */
  protected startQueryStats(operation: PrismaOperation, args: any): void {
    if (!this.options.enablePerformanceTracking) {
      return;
    }

    this.stats = {
      query: `${this.modelName}.${operation}`,
      params: args,
      startTime: new Date(),
      retryAttempts: 0,
    };
  }

  /**
   * Finishes tracking query execution statistics
   * @param result The query result
   * @param error The error if the query failed
   */
  protected finishQueryStats(result: any, error?: Error): void {
    if (!this.options.enablePerformanceTracking) {
      return;
    }

    const endTime = new Date();
    const executionTimeMs = endTime.getTime() - (this.stats.startTime?.getTime() || 0);

    this.stats = {
      ...this.stats,
      endTime,
      executionTimeMs,
      rowCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      successful: !error,
      errorMessage: error?.message,
    };

    if (this.options.enableLogging) {
      if (error) {
        logger.error(
          `Query ${this.stats.query} failed after ${executionTimeMs}ms: ${error.message}`,
          error.stack
        );
      } else {
        logger.debug(
          `Query ${this.stats.query} completed in ${executionTimeMs}ms with ${this.stats.rowCount} results`
        );
      }
    }
  }

  /**
   * Gets the current query execution statistics
   * @returns The query execution statistics
   */
  public getQueryStats(): Partial<QueryExecutionStats> {
    return { ...this.stats };
  }

  /**
   * Determines if an error is retryable
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  protected isRetryableError(error: any): boolean {
    // Check if the error is a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Connection errors (P1000, P1001, P1002)
      if (['P1000', 'P1001', 'P1002'].includes(error.code)) {
        return true;
      }
      
      // Timeout errors (P1008)
      if (error.code === 'P1008') {
        return true;
      }
      
      // Database server errors (P2000-P2999)
      if (error.code.startsWith('P2') && [
        // Connection errors
        'P2024', // Connection pool timeout
        'P2025', // Record not found (might be due to replication lag)
        'P2028', // Transaction API error
        'P2034', // Transaction timeout
      ].includes(error.code)) {
        return true;
      }
    }
    
    // Check if the error is a Prisma client initialization error
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return true;
    }
    
    // Check if the error is a Prisma client runtime error
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return true;
    }
    
    // Check if the error is a database connection error
    if (error instanceof DatabaseException && 
        error.type === DatabaseErrorType.CONNECTION) {
      return true;
    }
    
    // Check for specific error messages that indicate transient issues
    if (error.message && (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('deadlock') ||
      error.message.includes('serialization') ||
      error.message.includes('too many connections') ||
      error.message.includes('connection reset') ||
      error.message.includes('connection refused')
    )) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculates the delay for a retry attempt using exponential backoff with optional jitter
   * @param attempt The current retry attempt (0-based)
   * @returns The delay in milliseconds
   */
  protected getRetryDelay(attempt: number): number {
    const { baseRetryDelay = 100, maxRetryDelay = 5000, useRetryJitter = true } = this.options;
    
    // Calculate exponential backoff
    const exponentialDelay = Math.min(
      maxRetryDelay,
      baseRetryDelay * Math.pow(2, attempt)
    );
    
    // Add jitter if enabled (±25% of the calculated delay)
    if (useRetryJitter) {
      const jitterFactor = 0.25; // 25% jitter
      const jitterRange = exponentialDelay * jitterFactor;
      return exponentialDelay - jitterRange + Math.random() * jitterRange * 2;
    }
    
    return exponentialDelay;
  }

  /**
   * Executes a query with retry logic
   * @param operation The operation to execute
   * @param args The query arguments
   * @param prismaDelegate The Prisma delegate to use
   * @returns The query result
   */
  protected async executeWithRetry<O extends PrismaOperation>(
    operation: O,
    args: any,
    prismaDelegate: any
  ): Promise<any> {
    const { enableAutoRetry = true, maxRetries = 3 } = this.options;
    
    // Start tracking query statistics
    this.startQueryStats(operation, args);
    
    // Log the query if logging is enabled
    this.logQuery(operation, args);
    
    let attempt = 0;
    let lastError: any;
    
    while (attempt <= maxRetries) {
      try {
        // Execute the query
        const result = await prismaDelegate[operation](args);
        
        // Finish tracking query statistics
        this.finishQueryStats(result);
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Update retry attempts in stats
        this.stats.retryAttempts = attempt + 1;
        
        // Check if auto-retry is enabled and the error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!enableAutoRetry || !isRetryable || attempt >= maxRetries) {
          // Finish tracking query statistics with error
          this.finishQueryStats(null, error);
          
          // Transform the error if needed
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DatabaseException(
              `Query execution failed: ${error.message}`,
              this.mapPrismaErrorToType(error),
              { cause: error }
            );
          } else if (error instanceof DatabaseException) {
            throw error;
          } else {
            throw new DatabaseException(
              `Query execution failed: ${error.message}`,
              DatabaseErrorType.QUERY_EXECUTION,
              { cause: error }
            );
          }
        }
        
        // Calculate delay for the next retry
        const delay = this.getRetryDelay(attempt);
        
        logger.warn(
          `Query execution failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay)}ms...`,
          error
        );
        
        // Wait before the next retry
        await new Promise(resolve => setTimeout(resolve, delay));
        
        attempt++;
      }
    }
    
    // This should never happen, but TypeScript requires a return statement
    throw lastError;
  }

  /**
   * Maps a Prisma error to a DatabaseErrorType
   * @param error The Prisma error
   * @returns The corresponding DatabaseErrorType
   */
  protected mapPrismaErrorToType(error: Prisma.PrismaClientKnownRequestError): DatabaseErrorType {
    // Connection errors
    if (['P1000', 'P1001', 'P1002'].includes(error.code)) {
      return DatabaseErrorType.CONNECTION;
    }
    
    // Timeout errors
    if (error.code === 'P1008') {
      return DatabaseErrorType.TIMEOUT;
    }
    
    // Constraint violations
    if (['P2002', 'P2003', 'P2004'].includes(error.code)) {
      return DatabaseErrorType.CONSTRAINT_VIOLATION;
    }
    
    // Foreign key violations
    if (error.code === 'P2003') {
      return DatabaseErrorType.FOREIGN_KEY_VIOLATION;
    }
    
    // Not found errors
    if (error.code === 'P2025') {
      return DatabaseErrorType.NOT_FOUND;
    }
    
    // Value errors
    if (['P2006', 'P2007', 'P2008', 'P2009', 'P2010', 'P2011', 'P2012'].includes(error.code)) {
      return DatabaseErrorType.VALUE_ERROR;
    }
    
    // Transaction errors
    if (['P2028', 'P2034'].includes(error.code)) {
      return DatabaseErrorType.TRANSACTION;
    }
    
    // Default to query execution error
    return DatabaseErrorType.QUERY_EXECUTION;
  }

  /**
   * Analyzes the query plan for a query
   * This is a placeholder implementation that should be overridden by database-specific implementations
   * @param query The query to analyze
   * @param params The query parameters
   * @returns The query plan analysis result
   */
  protected async analyzeQueryPlan(query: string, params: Record<string, any>): Promise<QueryPlanAnalysisResult> {
    // This is a placeholder implementation
    // In a real implementation, this would execute an EXPLAIN query against the database
    return {
      plan: {},
      usesIndexes: true,
      indexesUsed: [],
      estimatedCost: 0,
      estimatedRows: 0,
      optimizationSuggestions: [],
      hasPerformanceIssues: false,
      performanceIssues: [],
    };
  }
}

/**
 * Query builder for read operations
 * Provides methods for building and executing read queries
 */
export class ReadQueryBuilder<T extends PrismaModel> extends BaseQueryBuilder<T> {
  /**
   * Creates a new instance of ReadQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: QueryBuilderOptions = {}) {
    super(modelName, options);
  }

  /**
   * Executes a findUnique query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findUnique<A extends PrismaQueryArgs<T, 'findUnique'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findUnique'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('findUnique', args, delegate);
  }

  /**
   * Executes a findFirst query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findFirst<A extends PrismaQueryArgs<T, 'findFirst'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findFirst'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('findFirst', args, delegate);
  }

  /**
   * Executes a findMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findMany<A extends PrismaQueryArgs<T, 'findMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findMany'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('findMany', args, delegate);
  }

  /**
   * Executes a count query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async count<A extends PrismaQueryArgs<T, 'count'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'count'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('count', args, delegate);
  }

  /**
   * Executes an aggregate query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async aggregate<A extends PrismaQueryArgs<T, 'aggregate'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'aggregate'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('aggregate', args, delegate);
  }
}

/**
 * Query builder for write operations
 * Provides methods for building and executing write queries
 */
export class WriteQueryBuilder<T extends PrismaModel> extends BaseQueryBuilder<T> {
  /**
   * Creates a new instance of WriteQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: QueryBuilderOptions = {}) {
    super(modelName, options);
  }

  /**
   * Executes a create query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async create<A extends PrismaQueryArgs<T, 'create'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'create'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('create', args, delegate);
  }

  /**
   * Executes a createMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async createMany<A extends PrismaQueryArgs<T, 'createMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'createMany'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('createMany', args, delegate);
  }

  /**
   * Executes an update query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async update<A extends PrismaQueryArgs<T, 'update'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'update'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('update', args, delegate);
  }

  /**
   * Executes an updateMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async updateMany<A extends PrismaQueryArgs<T, 'updateMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'updateMany'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('updateMany', args, delegate);
  }

  /**
   * Executes an upsert query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async upsert<A extends PrismaQueryArgs<T, 'upsert'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'upsert'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('upsert', args, delegate);
  }

  /**
   * Executes a delete query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async delete<A extends PrismaQueryArgs<T, 'delete'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'delete'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('delete', args, delegate);
  }

  /**
   * Executes a deleteMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async deleteMany<A extends PrismaQueryArgs<T, 'deleteMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'deleteMany'>> {
    const delegate = prismaClient[this.modelName.toLowerCase() as keyof PrismaClient] as any;
    return this.executeWithRetry('deleteMany', args, delegate);
  }
}

/**
 * Query builder for all operations
 * Combines read and write query builders
 */
export class QueryBuilder<T extends PrismaModel> extends BaseQueryBuilder<T> {
  private readonly readQueryBuilder: ReadQueryBuilder<T>;
  private readonly writeQueryBuilder: WriteQueryBuilder<T>;

  /**
   * Creates a new instance of QueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: QueryBuilderOptions = {}) {
    super(modelName, options);
    this.readQueryBuilder = new ReadQueryBuilder<T>(modelName, options);
    this.writeQueryBuilder = new WriteQueryBuilder<T>(modelName, options);
  }

  /**
   * Executes a findUnique query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findUnique<A extends PrismaQueryArgs<T, 'findUnique'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findUnique'>> {
    return this.readQueryBuilder.findUnique(args, prismaClient);
  }

  /**
   * Executes a findFirst query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findFirst<A extends PrismaQueryArgs<T, 'findFirst'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findFirst'>> {
    return this.readQueryBuilder.findFirst(args, prismaClient);
  }

  /**
   * Executes a findMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async findMany<A extends PrismaQueryArgs<T, 'findMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'findMany'>> {
    return this.readQueryBuilder.findMany(args, prismaClient);
  }

  /**
   * Executes a count query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async count<A extends PrismaQueryArgs<T, 'count'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'count'>> {
    return this.readQueryBuilder.count(args, prismaClient);
  }

  /**
   * Executes an aggregate query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async aggregate<A extends PrismaQueryArgs<T, 'aggregate'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'aggregate'>> {
    return this.readQueryBuilder.aggregate(args, prismaClient);
  }

  /**
   * Executes a create query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async create<A extends PrismaQueryArgs<T, 'create'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'create'>> {
    return this.writeQueryBuilder.create(args, prismaClient);
  }

  /**
   * Executes a createMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async createMany<A extends PrismaQueryArgs<T, 'createMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'createMany'>> {
    return this.writeQueryBuilder.createMany(args, prismaClient);
  }

  /**
   * Executes an update query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async update<A extends PrismaQueryArgs<T, 'update'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'update'>> {
    return this.writeQueryBuilder.update(args, prismaClient);
  }

  /**
   * Executes an updateMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async updateMany<A extends PrismaQueryArgs<T, 'updateMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'updateMany'>> {
    return this.writeQueryBuilder.updateMany(args, prismaClient);
  }

  /**
   * Executes an upsert query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async upsert<A extends PrismaQueryArgs<T, 'upsert'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'upsert'>> {
    return this.writeQueryBuilder.upsert(args, prismaClient);
  }

  /**
   * Executes a delete query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async delete<A extends PrismaQueryArgs<T, 'delete'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'delete'>> {
    return this.writeQueryBuilder.delete(args, prismaClient);
  }

  /**
   * Executes a deleteMany query
   * @param args The query arguments
   * @param prismaClient The Prisma client instance
   * @returns The query result
   */
  public async deleteMany<A extends PrismaQueryArgs<T, 'deleteMany'>>(
    args: A,
    prismaClient: PrismaClient
  ): Promise<PrismaQueryResult<T, 'deleteMany'>> {
    return this.writeQueryBuilder.deleteMany(args, prismaClient);
  }
}

/**
 * Factory for creating journey-specific query builders
 */
export class QueryBuilderFactory {
  /**
   * Creates a query builder for the specified model and journey type
   * @param modelName The Prisma model name
   * @param journeyType The journey type
   * @param options Additional query builder options
   * @returns A query builder instance
   */
  public static createQueryBuilder<T extends PrismaModel>(
    modelName: T,
    journeyType?: JourneyType,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): QueryBuilder<T> {
    return new QueryBuilder<T>(modelName, {
      ...options,
      journeyType,
    });
  }

  /**
   * Creates a read query builder for the specified model and journey type
   * @param modelName The Prisma model name
   * @param journeyType The journey type
   * @param options Additional query builder options
   * @returns A read query builder instance
   */
  public static createReadQueryBuilder<T extends PrismaModel>(
    modelName: T,
    journeyType?: JourneyType,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): ReadQueryBuilder<T> {
    return new ReadQueryBuilder<T>(modelName, {
      ...options,
      journeyType,
    });
  }

  /**
   * Creates a write query builder for the specified model and journey type
   * @param modelName The Prisma model name
   * @param journeyType The journey type
   * @param options Additional query builder options
   * @returns A write query builder instance
   */
  public static createWriteQueryBuilder<T extends PrismaModel>(
    modelName: T,
    journeyType?: JourneyType,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): WriteQueryBuilder<T> {
    return new WriteQueryBuilder<T>(modelName, {
      ...options,
      journeyType,
    });
  }

  /**
   * Creates a health journey query builder for the specified model
   * @param modelName The Prisma model name
   * @param options Additional query builder options
   * @returns A query builder instance optimized for the health journey
   */
  public static createHealthQueryBuilder<T extends PrismaModel>(
    modelName: T,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): QueryBuilder<T> {
    return this.createQueryBuilder(modelName, JourneyType.HEALTH, options);
  }

  /**
   * Creates a care journey query builder for the specified model
   * @param modelName The Prisma model name
   * @param options Additional query builder options
   * @returns A query builder instance optimized for the care journey
   */
  public static createCareQueryBuilder<T extends PrismaModel>(
    modelName: T,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): QueryBuilder<T> {
    return this.createQueryBuilder(modelName, JourneyType.CARE, options);
  }

  /**
   * Creates a plan journey query builder for the specified model
   * @param modelName The Prisma model name
   * @param options Additional query builder options
   * @returns A query builder instance optimized for the plan journey
   */
  public static createPlanQueryBuilder<T extends PrismaModel>(
    modelName: T,
    options: Omit<QueryBuilderOptions, 'journeyType'> = {}
  ): QueryBuilder<T> {
    return this.createQueryBuilder(modelName, JourneyType.PLAN, options);
  }
}

/**
 * Utility for analyzing query performance
 */
export class QueryAnalyzer {
  private readonly prismaClient: PrismaClient;

  /**
   * Creates a new instance of QueryAnalyzer
   * @param prismaClient The Prisma client instance
   */
  constructor(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
  }

  /**
   * Analyzes a query and returns performance insights
   * @param query The SQL query to analyze
   * @param params The query parameters
   * @returns The query plan analysis result
   */
  public async analyzeQuery(query: string, params: Record<string, any> = {}): Promise<QueryPlanAnalysisResult> {
    try {
      // Execute EXPLAIN query
      const explainQuery = `EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON) ${query}`;
      const result = await this.prismaClient.$queryRawUnsafe(explainQuery, ...Object.values(params));
      
      // Parse the result
      const plan = result[0][0];
      
      // Extract information from the plan
      const indexesUsed: string[] = [];
      const performanceIssues: string[] = [];
      const optimizationSuggestions: string[] = [];
      
      // Check if the query uses indexes
      const usesIndexes = this.checkIfQueryUsesIndexes(plan, indexesUsed);
      
      // Check for performance issues
      this.identifyPerformanceIssues(plan, performanceIssues, optimizationSuggestions);
      
      // Extract cost and row estimates
      const estimatedCost = plan['Plan']['Total Cost'] || 0;
      const estimatedRows = plan['Plan']['Plan Rows'] || 0;
      
      return {
        plan,
        usesIndexes,
        indexesUsed,
        estimatedCost,
        estimatedRows,
        optimizationSuggestions,
        hasPerformanceIssues: performanceIssues.length > 0,
        performanceIssues,
      };
    } catch (error) {
      logger.error('Failed to analyze query', error);
      
      // Return a default result if analysis fails
      return {
        plan: {},
        usesIndexes: false,
        indexesUsed: [],
        estimatedCost: -1,
        estimatedRows: -1,
        optimizationSuggestions: ['Query analysis failed. Check query syntax and permissions.'],
        hasPerformanceIssues: true,
        performanceIssues: [`Analysis failed: ${error.message}`],
      };
    }
  }

  /**
   * Checks if a query plan uses indexes
   * @param plan The query plan
   * @param indexesUsed Array to populate with used indexes
   * @returns True if the query uses indexes, false otherwise
   */
  private checkIfQueryUsesIndexes(plan: any, indexesUsed: string[]): boolean {
    // Check if the plan or any of its children use an index
    const checkPlan = (p: any): boolean => {
      // Check if this node uses an index
      if (p['Node Type'] && p['Node Type'].includes('Index')) {
        if (p['Index Name']) {
          indexesUsed.push(p['Index Name']);
        }
        return true;
      }
      
      // Check child plans
      if (p['Plans'] && Array.isArray(p['Plans'])) {
        return p['Plans'].some((childPlan: any) => checkPlan(childPlan));
      }
      
      return false;
    };
    
    return checkPlan(plan['Plan']);
  }

  /**
   * Identifies performance issues in a query plan
   * @param plan The query plan
   * @param issues Array to populate with identified issues
   * @param suggestions Array to populate with optimization suggestions
   */
  private identifyPerformanceIssues(plan: any, issues: string[], suggestions: string[]): void {
    const rootPlan = plan['Plan'];
    
    // Check for sequential scans on large tables
    if (rootPlan['Node Type'] === 'Seq Scan' && rootPlan['Plan Rows'] > 1000) {
      issues.push(`Sequential scan on large table (${rootPlan['Relation Name']}) with ${rootPlan['Plan Rows']} rows`);
      suggestions.push(`Consider adding an index on ${rootPlan['Relation Name']} for the filter conditions`);
    }
    
    // Check for high-cost operations
    if (rootPlan['Total Cost'] > 1000) {
      issues.push(`High-cost operation (${rootPlan['Total Cost']})`);
      suggestions.push('Review query complexity and consider optimization');
    }
    
    // Check for nested loops with many iterations
    const checkForNestedLoops = (p: any): void => {
      if (p['Node Type'] === 'Nested Loop' && p['Plan Rows'] > 1000) {
        issues.push(`Expensive nested loop with ${p['Plan Rows']} iterations`);
        suggestions.push('Consider using a different join type or adding indexes to join conditions');
      }
      
      // Check child plans
      if (p['Plans'] && Array.isArray(p['Plans'])) {
        p['Plans'].forEach((childPlan: any) => checkForNestedLoops(childPlan));
      }
    };
    
    checkForNestedLoops(rootPlan);
    
    // Check for hash joins with high memory usage
    const checkForHashJoins = (p: any): void => {
      if (p['Node Type'] === 'Hash Join' && p['Plan Rows'] > 10000) {
        issues.push(`Hash join with high memory usage (${p['Plan Rows']} rows)`);
        suggestions.push('Consider optimizing join conditions or using a different join strategy');
      }
      
      // Check child plans
      if (p['Plans'] && Array.isArray(p['Plans'])) {
        p['Plans'].forEach((childPlan: any) => checkForHashJoins(childPlan));
      }
    };
    
    checkForHashJoins(rootPlan);
  }

  /**
   * Suggests indexes for a table based on query patterns
   * @param tableName The table name
   * @param columnNames The column names to consider for indexing
   * @returns Suggested indexes
   */
  public async suggestIndexes(tableName: string, columnNames: string[]): Promise<string[]> {
    try {
      // Get existing indexes
      const existingIndexesQuery = `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
      `;
      
      const existingIndexes = await this.prismaClient.$queryRawUnsafe(
        existingIndexesQuery,
        tableName
      ) as Array<{ indexname: string; indexdef: string }>;
      
      // Generate suggestions based on column names and existing indexes
      const suggestions: string[] = [];
      
      for (const column of columnNames) {
        // Check if an index already exists for this column
        const hasIndex = existingIndexes.some(idx => 
          idx.indexdef.includes(`(${column})`) || 
          idx.indexdef.includes(`(${column},`) || 
          idx.indexdef.includes(`, ${column},`) || 
          idx.indexdef.includes(`, ${column})`)
        );
        
        if (!hasIndex) {
          suggestions.push(`CREATE INDEX idx_${tableName}_${column} ON ${tableName} (${column});`);
        }
      }
      
      // Suggest composite indexes for multiple columns if they don't exist
      if (columnNames.length > 1) {
        const compositeColumns = columnNames.join(', ');
        const hasCompositeIndex = existingIndexes.some(idx => 
          idx.indexdef.includes(`(${compositeColumns})`) || 
          columnNames.every(col => idx.indexdef.includes(col))
        );
        
        if (!hasCompositeIndex) {
          suggestions.push(`CREATE INDEX idx_${tableName}_${columnNames.join('_')} ON ${tableName} (${compositeColumns});`);
        }
      }
      
      return suggestions;
    } catch (error) {
      logger.error(`Failed to suggest indexes for table ${tableName}`, error);
      return [];
    }
  }

  /**
   * Checks if a query is using the expected indexes
   * @param query The SQL query to check
   * @param expectedIndexes The expected indexes
   * @param params The query parameters
   * @returns Whether the query is using the expected indexes
   */
  public async isQueryUsingExpectedIndexes(
    query: string,
    expectedIndexes: string[],
    params: Record<string, any> = {}
  ): Promise<{ usingExpectedIndexes: boolean; actualIndexes: string[] }> {
    try {
      // Analyze the query
      const analysis = await this.analyzeQuery(query, params);
      
      // Check if all expected indexes are being used
      const usingExpectedIndexes = expectedIndexes.every(idx => 
        analysis.indexesUsed.includes(idx)
      );
      
      return {
        usingExpectedIndexes,
        actualIndexes: analysis.indexesUsed,
      };
    } catch (error) {
      logger.error('Failed to check if query is using expected indexes', error);
      
      return {
        usingExpectedIndexes: false,
        actualIndexes: [],
      };
    }
  }
}

/**
 * Specialized query builder for health journey
 * Provides optimized query patterns for health-related models
 */
export class HealthQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new instance of HealthQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: Omit<QueryBuilderOptions, 'journeyType'> = {}) {
    super(modelName, {
      ...options,
      journeyType: JourneyType.HEALTH,
    });
  }

  /**
   * Finds health metrics within a time range
   * @param userId The user ID
   * @param metricType The metric type
   * @param startDate The start date
   * @param endDate The end date
   * @param prismaClient The Prisma client instance
   * @returns The health metrics
   */
  public async findMetricsInTimeRange(
    userId: string,
    metricType: string,
    startDate: Date,
    endDate: Date,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the HealthMetric model
    if (this.modelName !== 'HealthMetric') {
      throw new Error('findMetricsInTimeRange can only be used with the HealthMetric model');
    }
    
    return this.findMany({
      where: {
        userId,
        type: metricType,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    }, prismaClient);
  }

  /**
   * Finds the latest health metrics for a user
   * @param userId The user ID
   * @param metricTypes The metric types to include
   * @param prismaClient The Prisma client instance
   * @returns The latest health metrics
   */
  public async findLatestMetrics(
    userId: string,
    metricTypes: string[],
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the HealthMetric model
    if (this.modelName !== 'HealthMetric') {
      throw new Error('findLatestMetrics can only be used with the HealthMetric model');
    }
    
    // This requires a more complex query to get the latest metric of each type
    // We'll use a raw query for optimal performance
    const query = `
      SELECT DISTINCT ON (type) *
      FROM "HealthMetric"
      WHERE "userId" = $1 AND type = ANY($2::text[])
      ORDER BY type, timestamp DESC
    `;
    
    return prismaClient.$queryRawUnsafe(query, userId, metricTypes);
  }

  /**
   * Finds health goals with progress
   * @param userId The user ID
   * @param prismaClient The Prisma client instance
   * @returns The health goals with progress
   */
  public async findGoalsWithProgress(
    userId: string,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the HealthGoal model
    if (this.modelName !== 'HealthGoal') {
      throw new Error('findGoalsWithProgress can only be used with the HealthGoal model');
    }
    
    return this.findMany({
      where: {
        userId,
        active: true,
      },
      include: {
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10,
        },
      },
    }, prismaClient);
  }

  /**
   * Finds device connections for a user
   * @param userId The user ID
   * @param active Whether to include only active connections
   * @param prismaClient The Prisma client instance
   * @returns The device connections
   */
  public async findDeviceConnections(
    userId: string,
    active: boolean = true,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the DeviceConnection model
    if (this.modelName !== 'DeviceConnection') {
      throw new Error('findDeviceConnections can only be used with the DeviceConnection model');
    }
    
    return this.findMany({
      where: {
        userId,
        active,
      },
      include: {
        lastSync: true,
      },
      orderBy: {
        lastSyncDate: 'desc',
      },
    }, prismaClient);
  }
}

/**
 * Specialized query builder for care journey
 * Provides optimized query patterns for care-related models
 */
export class CareQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new instance of CareQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: Omit<QueryBuilderOptions, 'journeyType'> = {}) {
    super(modelName, {
      ...options,
      journeyType: JourneyType.CARE,
    });
  }

  /**
   * Finds upcoming appointments for a user
   * @param userId The user ID
   * @param includeProviderDetails Whether to include provider details
   * @param prismaClient The Prisma client instance
   * @returns The upcoming appointments
   */
  public async findUpcomingAppointments(
    userId: string,
    includeProviderDetails: boolean = true,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Appointment model
    if (this.modelName !== 'Appointment') {
      throw new Error('findUpcomingAppointments can only be used with the Appointment model');
    }
    
    const now = new Date();
    
    return this.findMany({
      where: {
        userId,
        date: {
          gte: now,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
      },
      include: {
        provider: includeProviderDetails,
      },
      orderBy: {
        date: 'asc',
      },
    }, prismaClient);
  }

  /**
   * Finds active medications for a user
   * @param userId The user ID
   * @param prismaClient The Prisma client instance
   * @returns The active medications
   */
  public async findActiveMedications(
    userId: string,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Medication model
    if (this.modelName !== 'Medication') {
      throw new Error('findActiveMedications can only be used with the Medication model');
    }
    
    const now = new Date();
    
    return this.findMany({
      where: {
        userId,
        active: true,
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    }, prismaClient);
  }

  /**
   * Finds providers by specialty
   * @param specialty The provider specialty
   * @param limit The maximum number of providers to return
   * @param prismaClient The Prisma client instance
   * @returns The providers
   */
  public async findProvidersBySpecialty(
    specialty: string,
    limit: number = 10,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Provider model
    if (this.modelName !== 'Provider') {
      throw new Error('findProvidersBySpecialty can only be used with the Provider model');
    }
    
    return this.findMany({
      where: {
        specialties: {
          has: specialty,
        },
        active: true,
      },
      take: limit,
      orderBy: {
        rating: 'desc',
      },
    }, prismaClient);
  }

  /**
   * Finds available telemedicine slots
   * @param providerId The provider ID
   * @param startDate The start date
   * @param endDate The end date
   * @param prismaClient The Prisma client instance
   * @returns The available telemedicine slots
   */
  public async findAvailableTelemedicineSlots(
    providerId: string,
    startDate: Date,
    endDate: Date,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the TelemedicineSession model
    if (this.modelName !== 'TelemedicineSession') {
      throw new Error('findAvailableTelemedicineSlots can only be used with the TelemedicineSession model');
    }
    
    // This requires a more complex query to find available slots
    // We'll use a raw query for optimal performance
    const query = `
      SELECT 
        ts.id, 
        ts."startTime", 
        ts."endTime", 
        ts."providerId", 
        p.name as "providerName"
      FROM "TelemedicineSession" ts
      JOIN "Provider" p ON ts."providerId" = p.id
      WHERE 
        ts."providerId" = $1 AND
        ts."startTime" >= $2 AND
        ts."endTime" <= $3 AND
        ts."userId" IS NULL AND
        ts."status" = 'AVAILABLE'
      ORDER BY ts."startTime" ASC
    `;
    
    return prismaClient.$queryRawUnsafe(query, providerId, startDate, endDate);
  }
}

/**
 * Specialized query builder for plan journey
 * Provides optimized query patterns for plan-related models
 */
export class PlanQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new instance of PlanQueryBuilder
   * @param modelName The Prisma model name
   * @param options Query builder options
   */
  constructor(modelName: T, options: Omit<QueryBuilderOptions, 'journeyType'> = {}) {
    super(modelName, {
      ...options,
      journeyType: JourneyType.PLAN,
    });
  }

  /**
   * Finds active plans for a user
   * @param userId The user ID
   * @param includeBenefits Whether to include benefits
   * @param prismaClient The Prisma client instance
   * @returns The active plans
   */
  public async findActivePlans(
    userId: string,
    includeBenefits: boolean = true,
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Plan model
    if (this.modelName !== 'Plan') {
      throw new Error('findActivePlans can only be used with the Plan model');
    }
    
    const now = new Date();
    
    return this.findMany({
      where: {
        userId,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
        status: 'ACTIVE',
      },
      include: {
        benefits: includeBenefits,
        coverage: true,
      },
    }, prismaClient);
  }

  /**
   * Finds claims by status
   * @param userId The user ID
   * @param statuses The claim statuses to include
   * @param prismaClient The Prisma client instance
   * @returns The claims
   */
  public async findClaimsByStatus(
    userId: string,
    statuses: string[],
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Claim model
    if (this.modelName !== 'Claim') {
      throw new Error('findClaimsByStatus can only be used with the Claim model');
    }
    
    return this.findMany({
      where: {
        userId,
        status: {
          in: statuses,
        },
      },
      include: {
        documents: true,
      },
      orderBy: {
        submissionDate: 'desc',
      },
    }, prismaClient);
  }

  /**
   * Finds benefits by category
   * @param planId The plan ID
   * @param categories The benefit categories to include
   * @param prismaClient The Prisma client instance
   * @returns The benefits
   */
  public async findBenefitsByCategory(
    planId: string,
    categories: string[],
    prismaClient: PrismaClient
  ): Promise<any[]> {
    // Ensure this is only used with the Benefit model
    if (this.modelName !== 'Benefit') {
      throw new Error('findBenefitsByCategory can only be used with the Benefit model');
    }
    
    return this.findMany({
      where: {
        planId,
        category: {
          in: categories,
        },
      },
      orderBy: {
        name: 'asc',
      },
    }, prismaClient);
  }

  /**
   * Finds coverage details for a plan
   * @param planId The plan ID
   * @param prismaClient The Prisma client instance
   * @returns The coverage details
   */
  public async findCoverageDetails(
    planId: string,
    prismaClient: PrismaClient
  ): Promise<any> {
    // Ensure this is only used with the Coverage model
    if (this.modelName !== 'Coverage') {
      throw new Error('findCoverageDetails can only be used with the Coverage model');
    }
    
    return this.findFirst({
      where: {
        planId,
      },
      include: {
        plan: {
          select: {
            name: true,
            type: true,
            provider: true,
          },
        },
      },
    }, prismaClient);
  }
}

/**
 * Creates a partial query builder that can be reused across multiple queries
 * @param baseArgs The base query arguments
 * @returns A function that merges the base arguments with additional arguments
 */
export function createPartialQuery<T extends PrismaModel, O extends PrismaOperation>(
  baseArgs: Partial<PrismaQueryArgs<T, O>>
): (additionalArgs: Partial<PrismaQueryArgs<T, O>>) => PrismaQueryArgs<T, O> {
  return (additionalArgs: Partial<PrismaQueryArgs<T, O>>): PrismaQueryArgs<T, O> => {
    // Deep merge the base arguments with the additional arguments
    const mergedArgs = { ...baseArgs } as any;
    
    // Merge each property
    for (const key in additionalArgs) {
      if (Object.prototype.hasOwnProperty.call(additionalArgs, key)) {
        const value = additionalArgs[key as keyof typeof additionalArgs];
        
        if (key === 'where' && mergedArgs.where && value) {
          // Special handling for 'where' to combine conditions with AND
          mergedArgs.where = {
            AND: [mergedArgs.where, value],
          };
        } else if (key === 'include' && mergedArgs.include && value) {
          // Special handling for 'include' to merge nested includes
          mergedArgs.include = { ...mergedArgs.include, ...value };
        } else if (key === 'select' && mergedArgs.select && value) {
          // Special handling for 'select' to merge selections
          mergedArgs.select = { ...mergedArgs.select, ...value };
        } else if (key === 'orderBy' && mergedArgs.orderBy && value) {
          // Special handling for 'orderBy' to use the additional orderBy
          // (orderBy is typically not merged but replaced)
          mergedArgs.orderBy = value;
        } else {
          // For other properties, just replace the value
          mergedArgs[key] = value;
        }
      }
    }
    
    return mergedArgs as PrismaQueryArgs<T, O>;
  };
}

/**
 * Creates a query builder for a specific model
 * @param modelName The Prisma model name
 * @param journeyType The journey type
 * @param options Additional query builder options
 * @returns A query builder instance
 */
export function createQueryBuilder<T extends PrismaModel>(
  modelName: T,
  journeyType?: JourneyType,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): QueryBuilder<T> {
  return QueryBuilderFactory.createQueryBuilder(modelName, journeyType, options);
}

/**
 * Creates a read query builder for a specific model
 * @param modelName The Prisma model name
 * @param journeyType The journey type
 * @param options Additional query builder options
 * @returns A read query builder instance
 */
export function createReadQueryBuilder<T extends PrismaModel>(
  modelName: T,
  journeyType?: JourneyType,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): ReadQueryBuilder<T> {
  return QueryBuilderFactory.createReadQueryBuilder(modelName, journeyType, options);
}

/**
 * Creates a write query builder for a specific model
 * @param modelName The Prisma model name
 * @param journeyType The journey type
 * @param options Additional query builder options
 * @returns A write query builder instance
 */
export function createWriteQueryBuilder<T extends PrismaModel>(
  modelName: T,
  journeyType?: JourneyType,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): WriteQueryBuilder<T> {
  return QueryBuilderFactory.createWriteQueryBuilder(modelName, journeyType, options);
}

/**
 * Creates a health journey query builder for a specific model
 * @param modelName The Prisma model name
 * @param options Additional query builder options
 * @returns A query builder instance optimized for the health journey
 */
export function createHealthQueryBuilder<T extends PrismaModel>(
  modelName: T,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): HealthQueryBuilder<T> {
  return new HealthQueryBuilder<T>(modelName, options);
}

/**
 * Creates a care journey query builder for a specific model
 * @param modelName The Prisma model name
 * @param options Additional query builder options
 * @returns A query builder instance optimized for the care journey
 */
export function createCareQueryBuilder<T extends PrismaModel>(
  modelName: T,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): CareQueryBuilder<T> {
  return new CareQueryBuilder<T>(modelName, options);
}

/**
 * Creates a plan journey query builder for a specific model
 * @param modelName The Prisma model name
 * @param options Additional query builder options
 * @returns A query builder instance optimized for the plan journey
 */
export function createPlanQueryBuilder<T extends PrismaModel>(
  modelName: T,
  options: Omit<QueryBuilderOptions, 'journeyType'> = {}
): PlanQueryBuilder<T> {
  return new PlanQueryBuilder<T>(modelName, options);
}

/**
 * Creates a query analyzer
 * @param prismaClient The Prisma client instance
 * @returns A query analyzer instance
 */
export function createQueryAnalyzer(prismaClient: PrismaClient): QueryAnalyzer {
  return new QueryAnalyzer(prismaClient);
}