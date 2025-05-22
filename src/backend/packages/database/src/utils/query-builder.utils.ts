/**
 * Advanced query building utilities for constructing optimized Prisma database queries.
 * 
 * This module provides composable query builders with support for complex conditions,
 * relations, and aggregations while maintaining type safety. It includes specialized
 * builders for different journey services with domain-specific query patterns and
 * performance optimizations.
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { DatabaseException, QueryException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { RetryStrategyFactory } from '../errors/retry-strategies';

/**
 * Type representing any valid Prisma model
 */
type PrismaModel = keyof Omit<PrismaClient, 
  | '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  | '$queryRaw' | '$executeRaw' | '$queryRawUnsafe' | '$executeRawUnsafe'
>;

/**
 * Type representing a Prisma delegate for a specific model
 */
type PrismaDelegate<T extends PrismaModel> = PrismaClient[T];

/**
 * Type representing the "where" clause for a specific Prisma model
 */
type WhereClause<T extends PrismaModel> = 
  Parameters<PrismaDelegate<T>['findMany']>[0]['where'];

/**
 * Type representing the "include" clause for a specific Prisma model
 */
type IncludeClause<T extends PrismaModel> = 
  Parameters<PrismaDelegate<T>['findMany']>[0]['include'];

/**
 * Type representing the "select" clause for a specific Prisma model
 */
type SelectClause<T extends PrismaModel> = 
  Parameters<PrismaDelegate<T>['findMany']>[0]['select'];

/**
 * Type representing the "orderBy" clause for a specific Prisma model
 */
type OrderByClause<T extends PrismaModel> = 
  Parameters<PrismaDelegate<T>['findMany']>[0]['orderBy'];

/**
 * Interface for query execution options
 */
export interface QueryExecutionOptions {
  /** Maximum number of retry attempts for failed queries */
  maxRetries?: number;
  /** Whether to analyze the query plan for optimization */
  analyzeQueryPlan?: boolean;
  /** Whether to check index utilization */
  checkIndexUtilization?: boolean;
  /** Timeout in milliseconds for the query */
  timeout?: number;
  /** Whether to use transaction for this query */
  useTransaction?: boolean;
}

/**
 * Interface for query analysis results
 */
export interface QueryAnalysisResult {
  /** Estimated execution time in milliseconds */
  estimatedExecutionTime: number;
  /** Whether the query uses indexes effectively */
  usesIndexes: boolean;
  /** List of indexes used by the query */
  indexesUsed: string[];
  /** List of optimization suggestions */
  optimizationSuggestions: string[];
  /** Raw query plan from the database */
  rawQueryPlan: any;
}

/**
 * Base query builder class that provides common functionality for building
 * and executing Prisma queries with advanced features like retry mechanisms,
 * query analysis, and error handling.
 */
export class QueryBuilder<T extends PrismaModel> {
  private whereClause: WhereClause<T> | undefined;
  private includeClause: IncludeClause<T> | undefined;
  private selectClause: SelectClause<T> | undefined;
  private orderByClause: OrderByClause<T> | undefined;
  private skipValue: number | undefined;
  private takeValue: number | undefined;
  private distinctValue: string[] | undefined;
  private retryStrategyFactory: RetryStrategyFactory;

  /**
   * Creates a new QueryBuilder instance
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The Prisma model to query
   */
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly model: T
  ) {
    this.retryStrategyFactory = new RetryStrategyFactory();
  }

  /**
   * Sets the where clause for the query
   * 
   * @param where - The where conditions
   * @returns The query builder instance for chaining
   */
  where(where: WhereClause<T>): this {
    this.whereClause = where;
    return this;
  }

  /**
   * Sets the include clause for the query to load related records
   * 
   * @param include - The relations to include
   * @returns The query builder instance for chaining
   */
  include(include: IncludeClause<T>): this {
    this.includeClause = include;
    return this;
  }

  /**
   * Sets the select clause for the query to specify which fields to return
   * 
   * @param select - The fields to select
   * @returns The query builder instance for chaining
   */
  select(select: SelectClause<T>): this {
    this.selectClause = select;
    return this;
  }

  /**
   * Sets the orderBy clause for the query
   * 
   * @param orderBy - The ordering criteria
   * @returns The query builder instance for chaining
   */
  orderBy(orderBy: OrderByClause<T>): this {
    this.orderByClause = orderBy;
    return this;
  }

  /**
   * Sets the number of records to skip
   * 
   * @param skip - The number of records to skip
   * @returns The query builder instance for chaining
   */
  skip(skip: number): this {
    this.skipValue = skip;
    return this;
  }

  /**
   * Sets the maximum number of records to return
   * 
   * @param take - The maximum number of records to return
   * @returns The query builder instance for chaining
   */
  take(take: number): this {
    this.takeValue = take;
    return this;
  }

  /**
   * Sets the distinct fields for the query
   * 
   * @param distinct - The fields to distinct by
   * @returns The query builder instance for chaining
   */
  distinct(distinct: string[]): this {
    this.distinctValue = distinct;
    return this;
  }

  /**
   * Builds the query parameters object based on the configured clauses
   * 
   * @returns The query parameters object
   */
  protected buildQueryParams(): Prisma.Exact<{
    where?: WhereClause<T>;
    include?: IncludeClause<T>;
    select?: SelectClause<T>;
    orderBy?: OrderByClause<T>;
    skip?: number;
    take?: number;
    distinct?: string[];
  }> {
    const params: any = {};

    if (this.whereClause) params.where = this.whereClause;
    if (this.includeClause) params.include = this.includeClause;
    if (this.selectClause) params.select = this.selectClause;
    if (this.orderByClause) params.orderBy = this.orderByClause;
    if (this.skipValue !== undefined) params.skip = this.skipValue;
    if (this.takeValue !== undefined) params.take = this.takeValue;
    if (this.distinctValue) params.distinct = this.distinctValue;

    return params;
  }

  /**
   * Executes a findMany query with the configured parameters
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to an array of records
   */
  async findMany(options: QueryExecutionOptions = {}): Promise<any[]> {
    const params = this.buildQueryParams();
    const delegate = this.prisma[this.model] as any;

    try {
      // Analyze query plan if requested
      if (options.analyzeQueryPlan) {
        await this.analyzeQueryPlan(params);
      }

      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.findMany(params));
      }

      // Execute the query without retry
      return await delegate.findMany(params);
    } catch (error) {
      throw this.handleQueryError(error, 'findMany', params);
    }
  }

  /**
   * Executes a findFirst query with the configured parameters
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to a single record or null
   */
  async findFirst(options: QueryExecutionOptions = {}): Promise<any | null> {
    const params = this.buildQueryParams();
    const delegate = this.prisma[this.model] as any;

    try {
      // Analyze query plan if requested
      if (options.analyzeQueryPlan) {
        await this.analyzeQueryPlan(params);
      }

      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.findFirst(params));
      }

      // Execute the query without retry
      return await delegate.findFirst(params);
    } catch (error) {
      throw this.handleQueryError(error, 'findFirst', params);
    }
  }

  /**
   * Executes a findUnique query with the configured parameters
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to a single record or null
   */
  async findUnique(options: QueryExecutionOptions = {}): Promise<any | null> {
    if (!this.whereClause) {
      throw new QueryException(
        'findUnique requires a where clause with unique identifiers',
        DatabaseErrorType.QUERY_ERROR,
        { model: this.model }
      );
    }

    const params = this.buildQueryParams();
    const delegate = this.prisma[this.model] as any;

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.findUnique(params));
      }

      // Execute the query without retry
      return await delegate.findUnique(params);
    } catch (error) {
      throw this.handleQueryError(error, 'findUnique', params);
    }
  }

  /**
   * Executes a count query with the configured parameters
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to the count of matching records
   */
  async count(options: QueryExecutionOptions = {}): Promise<number> {
    const params = { where: this.whereClause };
    const delegate = this.prisma[this.model] as any;

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.count(params));
      }

      // Execute the query without retry
      return await delegate.count(params);
    } catch (error) {
      throw this.handleQueryError(error, 'count', params);
    }
  }

  /**
   * Executes a create query with the provided data
   * 
   * @param data - The data to create
   * @param options - Query execution options
   * @returns A promise that resolves to the created record
   */
  async create(data: any, options: QueryExecutionOptions = {}): Promise<any> {
    const delegate = this.prisma[this.model] as any;
    const params = { data };

    if (this.selectClause) params['select'] = this.selectClause;
    if (this.includeClause) params['include'] = this.includeClause;

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.create(params));
      }

      // Execute the query without retry
      return await delegate.create(params);
    } catch (error) {
      throw this.handleQueryError(error, 'create', params);
    }
  }

  /**
   * Executes an update query with the provided data
   * 
   * @param data - The data to update
   * @param options - Query execution options
   * @returns A promise that resolves to the updated record
   */
  async update(data: any, options: QueryExecutionOptions = {}): Promise<any> {
    if (!this.whereClause) {
      throw new QueryException(
        'update requires a where clause',
        DatabaseErrorType.QUERY_ERROR,
        { model: this.model }
      );
    }

    const delegate = this.prisma[this.model] as any;
    const params = {
      where: this.whereClause,
      data
    };

    if (this.selectClause) params['select'] = this.selectClause;
    if (this.includeClause) params['include'] = this.includeClause;

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.update(params));
      }

      // Execute the query without retry
      return await delegate.update(params);
    } catch (error) {
      throw this.handleQueryError(error, 'update', params);
    }
  }

  /**
   * Executes an updateMany query with the provided data
   * 
   * @param data - The data to update
   * @param options - Query execution options
   * @returns A promise that resolves to the count of updated records
   */
  async updateMany(data: any, options: QueryExecutionOptions = {}): Promise<{ count: number }> {
    const delegate = this.prisma[this.model] as any;
    const params = {
      where: this.whereClause,
      data
    };

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.updateMany(params));
      }

      // Execute the query without retry
      return await delegate.updateMany(params);
    } catch (error) {
      throw this.handleQueryError(error, 'updateMany', params);
    }
  }

  /**
   * Executes a delete query
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to the deleted record
   */
  async delete(options: QueryExecutionOptions = {}): Promise<any> {
    if (!this.whereClause) {
      throw new QueryException(
        'delete requires a where clause',
        DatabaseErrorType.QUERY_ERROR,
        { model: this.model }
      );
    }

    const delegate = this.prisma[this.model] as any;
    const params = { where: this.whereClause };

    if (this.selectClause) params['select'] = this.selectClause;
    if (this.includeClause) params['include'] = this.includeClause;

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.delete(params));
      }

      // Execute the query without retry
      return await delegate.delete(params);
    } catch (error) {
      throw this.handleQueryError(error, 'delete', params);
    }
  }

  /**
   * Executes a deleteMany query
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to the count of deleted records
   */
  async deleteMany(options: QueryExecutionOptions = {}): Promise<{ count: number }> {
    const delegate = this.prisma[this.model] as any;
    const params = { where: this.whereClause };

    try {
      // Execute the query with retry mechanism if maxRetries is specified
      if (options.maxRetries && options.maxRetries > 0) {
        const retryStrategy = this.retryStrategyFactory.createExponentialBackoff({
          maxAttempts: options.maxRetries,
          baseDelay: 100,
          maxDelay: 5000
        });

        return await retryStrategy.execute(() => delegate.deleteMany(params));
      }

      // Execute the query without retry
      return await delegate.deleteMany(params);
    } catch (error) {
      throw this.handleQueryError(error, 'deleteMany', params);
    }
  }

  /**
   * Executes a query to find records and paginate the results
   * 
   * @param page - The page number (1-based)
   * @param pageSize - The number of records per page
   * @param options - Query execution options
   * @returns A promise that resolves to the paginated results
   */
  async paginate(page: number, pageSize: number, options: QueryExecutionOptions = {}): Promise<{
    data: any[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const skip = (page - 1) * pageSize;
    this.skip(skip).take(pageSize);

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count(options)
    ]);

    const pageCount = Math.ceil(total / pageSize);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        pageCount,
        hasNextPage: page < pageCount,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Analyzes the query plan for the current query
   * 
   * @param params - The query parameters
   * @returns A promise that resolves to the query analysis result
   */
  async analyzeQueryPlan(params: any): Promise<QueryAnalysisResult> {
    try {
      // Generate SQL for the query
      const sql = this.generateSqlForQueryPlan(params);

      // Execute EXPLAIN query to get the query plan
      const queryPlan = await this.prisma.$queryRaw`EXPLAIN (ANALYZE, VERBOSE, FORMAT JSON) ${sql}`;

      // Parse the query plan
      const result = this.parseQueryPlan(queryPlan);

      return result;
    } catch (error) {
      console.error('Failed to analyze query plan:', error);
      return {
        estimatedExecutionTime: 0,
        usesIndexes: false,
        indexesUsed: [],
        optimizationSuggestions: ['Failed to analyze query plan'],
        rawQueryPlan: null
      };
    }
  }

  /**
   * Generates SQL for the query plan analysis
   * 
   * @param params - The query parameters
   * @returns The SQL string
   */
  private generateSqlForQueryPlan(params: any): Prisma.Sql {
    // This is a simplified implementation
    // In a real implementation, you would use Prisma's internal utilities to generate SQL
    // or use a library like prisma-query-log to capture the SQL
    const tableName = this.model.toString();
    let sql = Prisma.sql`SELECT * FROM "${tableName}"`;

    if (params.where) {
      sql = Prisma.sql`${sql} WHERE /* where conditions */`;
    }

    if (params.orderBy) {
      sql = Prisma.sql`${sql} ORDER BY /* order by */`;
    }

    if (params.skip) {
      sql = Prisma.sql`${sql} OFFSET ${params.skip}`;
    }

    if (params.take) {
      sql = Prisma.sql`${sql} LIMIT ${params.take}`;
    }

    return sql;
  }

  /**
   * Parses the query plan and extracts useful information
   * 
   * @param queryPlan - The raw query plan from the database
   * @returns The parsed query analysis result
   */
  private parseQueryPlan(queryPlan: any): QueryAnalysisResult {
    // This is a simplified implementation
    // In a real implementation, you would parse the actual query plan
    const plan = queryPlan[0]?.['Plan'] || {};
    const indexesUsed: string[] = [];
    const optimizationSuggestions: string[] = [];

    // Extract indexes used
    if (plan['Index Name']) {
      indexesUsed.push(plan['Index Name']);
    }

    // Check if sequential scan is used instead of index scan
    if (plan['Node Type'] === 'Seq Scan' && !plan['Index Name']) {
      optimizationSuggestions.push('Consider adding an index to avoid sequential scan');
    }

    // Check for high execution time
    const executionTime = plan['Actual Total Time'] || 0;
    if (executionTime > 1000) {
      optimizationSuggestions.push('Query execution time is high, consider optimizing');
    }

    return {
      estimatedExecutionTime: executionTime,
      usesIndexes: indexesUsed.length > 0,
      indexesUsed,
      optimizationSuggestions,
      rawQueryPlan: queryPlan
    };
  }

  /**
   * Handles query errors by transforming them into appropriate exceptions
   * 
   * @param error - The original error
   * @param operation - The operation that caused the error
   * @param params - The query parameters
   * @returns The transformed error
   */
  private handleQueryError(error: any, operation: string, params: any): Error {
    // If the error is already a DatabaseException, just return it
    if (error instanceof DatabaseException) {
      return error;
    }

    // Create a QueryException with the error details
    return new QueryException(
      `Error executing ${operation} on ${this.model}: ${error.message}`,
      DatabaseErrorType.QUERY_ERROR,
      {
        model: this.model,
        operation,
        params,
        originalError: error
      }
    );
  }
}

/**
 * Factory function to create a QueryBuilder instance for a specific model
 * 
 * @param prisma - The PrismaClient instance
 * @param model - The Prisma model to query
 * @returns A new QueryBuilder instance
 */
export function createQueryBuilder<T extends PrismaModel>(
  prisma: PrismaClient,
  model: T
): QueryBuilder<T> {
  return new QueryBuilder<T>(prisma, model);
}

/**
 * Specialized query builder for Health journey with optimizations for health metrics
 * and time-series data in TimescaleDB
 */
export class HealthQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new HealthQueryBuilder instance
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The Prisma model to query
   */
  constructor(prisma: PrismaClient, model: T) {
    super(prisma, model);
  }

  /**
   * Finds health metrics within a specific time range with optimized query for TimescaleDB
   * 
   * @param userId - The user ID
   * @param startTime - The start time of the range
   * @param endTime - The end time of the range
   * @param options - Query execution options
   * @returns A promise that resolves to the health metrics
   */
  async findMetricsInTimeRange(
    userId: string | number,
    startTime: Date,
    endTime: Date,
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    // Use TimescaleDB time_bucket function for efficient time-series queries
    // This is a simplified example - in a real implementation, you would use
    // the appropriate TimescaleDB functions based on your schema
    try {
      const result = await this.prisma.$queryRaw`
        SELECT time_bucket('1 hour', "timestamp") AS bucket,
               avg(value) AS avg_value,
               max(value) AS max_value,
               min(value) AS min_value
        FROM "${Prisma.raw(this.model.toString())}"
        WHERE "userId" = ${userId}
          AND "timestamp" >= ${startTime}
          AND "timestamp" <= ${endTime}
        GROUP BY bucket
        ORDER BY bucket ASC
      `;

      return result;
    } catch (error) {
      throw this.handleMetricsQueryError(error, userId, startTime, endTime);
    }
  }

  /**
   * Finds the latest health metrics for a user with optimized query
   * 
   * @param userId - The user ID
   * @param metricTypes - Optional array of metric types to filter by
   * @param options - Query execution options
   * @returns A promise that resolves to the latest health metrics
   */
  async findLatestMetrics(
    userId: string | number,
    metricTypes?: string[],
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    try {
      // If metric types are provided, filter by them
      if (metricTypes && metricTypes.length > 0) {
        return await this.prisma.$queryRaw`
          WITH latest_metrics AS (
            SELECT DISTINCT ON ("metricType") *
            FROM "${Prisma.raw(this.model.toString())}"
            WHERE "userId" = ${userId}
              AND "metricType" IN (${Prisma.join(metricTypes)})
            ORDER BY "metricType", "timestamp" DESC
          )
          SELECT * FROM latest_metrics
        `;
      }

      // Otherwise, get the latest of all metric types
      return await this.prisma.$queryRaw`
        WITH latest_metrics AS (
          SELECT DISTINCT ON ("metricType") *
          FROM "${Prisma.raw(this.model.toString())}"
          WHERE "userId" = ${userId}
          ORDER BY "metricType", "timestamp" DESC
        )
        SELECT * FROM latest_metrics
      `;
    } catch (error) {
      throw this.handleMetricsQueryError(error, userId);
    }
  }

  /**
   * Handles errors specific to health metrics queries
   * 
   * @param error - The original error
   * @param userId - The user ID
   * @param startTime - Optional start time
   * @param endTime - Optional end time
   * @returns The transformed error
   */
  private handleMetricsQueryError(error: any, userId: string | number, startTime?: Date, endTime?: Date): Error {
    return new QueryException(
      `Error querying health metrics for user ${userId}: ${error.message}`,
      DatabaseErrorType.QUERY_ERROR,
      {
        model: this.model,
        userId,
        startTime,
        endTime,
        originalError: error,
        journey: 'health'
      }
    );
  }
}

/**
 * Factory function to create a HealthQueryBuilder instance for a specific model
 * 
 * @param prisma - The PrismaClient instance
 * @param model - The Prisma model to query
 * @returns A new HealthQueryBuilder instance
 */
export function createHealthQueryBuilder<T extends PrismaModel>(
  prisma: PrismaClient,
  model: T
): HealthQueryBuilder<T> {
  return new HealthQueryBuilder<T>(prisma, model);
}

/**
 * Specialized query builder for Care journey with optimizations for appointments
 * and provider-related queries
 */
export class CareQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new CareQueryBuilder instance
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The Prisma model to query
   */
  constructor(prisma: PrismaClient, model: T) {
    super(prisma, model);
  }

  /**
   * Finds available appointment slots for a provider within a date range
   * 
   * @param providerId - The provider ID
   * @param startDate - The start date
   * @param endDate - The end date
   * @param options - Query execution options
   * @returns A promise that resolves to the available appointment slots
   */
  async findAvailableAppointmentSlots(
    providerId: string | number,
    startDate: Date,
    endDate: Date,
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    try {
      // This is a simplified example - in a real implementation, you would
      // use a more complex query that considers provider schedules, existing
      // appointments, and other constraints
      return await this.prisma.$queryRaw`
        WITH provider_schedule AS (
          SELECT * FROM "ProviderSchedule"
          WHERE "providerId" = ${providerId}
            AND "date" >= ${startDate}
            AND "date" <= ${endDate}
        ),
        existing_appointments AS (
          SELECT * FROM "Appointment"
          WHERE "providerId" = ${providerId}
            AND "date" >= ${startDate}
            AND "date" <= ${endDate}
            AND "status" != 'CANCELLED'
        ),
        all_slots AS (
          -- Generate all possible slots based on provider schedule
          SELECT ps."date", gs."time"
          FROM provider_schedule ps
          CROSS JOIN generate_series(
            ps."startTime"::time,
            ps."endTime"::time - interval '30 minutes',
            interval '30 minutes'
          ) AS gs("time")
        )
        SELECT
          as."date",
          as."time",
          as."date" + as."time" AS "startDateTime",
          as."date" + as."time" + interval '30 minutes' AS "endDateTime"
        FROM all_slots as
        WHERE NOT EXISTS (
          SELECT 1 FROM existing_appointments ea
          WHERE ea."date" = as."date"
            AND ea."time" = as."time"
        )
        ORDER BY as."date", as."time"
      `;
    } catch (error) {
      throw this.handleCareQueryError(error, 'findAvailableAppointmentSlots', { providerId, startDate, endDate });
    }
  }

  /**
   * Finds upcoming appointments for a user with related provider information
   * 
   * @param userId - The user ID
   * @param options - Query execution options
   * @returns A promise that resolves to the upcoming appointments
   */
  async findUpcomingAppointments(
    userId: string | number,
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    try {
      // This query uses a join to get provider information along with appointments
      return await this.prisma.$queryRaw`
        SELECT
          a.*,
          p."name" AS "providerName",
          p."specialty" AS "providerSpecialty",
          p."imageUrl" AS "providerImageUrl"
        FROM "${Prisma.raw(this.model.toString())}" a
        JOIN "Provider" p ON a."providerId" = p."id"
        WHERE a."userId" = ${userId}
          AND a."date" >= CURRENT_DATE
          AND a."status" != 'CANCELLED'
        ORDER BY a."date", a."time"
      `;
    } catch (error) {
      throw this.handleCareQueryError(error, 'findUpcomingAppointments', { userId });
    }
  }

  /**
   * Handles errors specific to care journey queries
   * 
   * @param error - The original error
   * @param operation - The operation that caused the error
   * @param params - The operation parameters
   * @returns The transformed error
   */
  private handleCareQueryError(error: any, operation: string, params: any): Error {
    return new QueryException(
      `Error executing ${operation} in Care journey: ${error.message}`,
      DatabaseErrorType.QUERY_ERROR,
      {
        model: this.model,
        operation,
        params,
        originalError: error,
        journey: 'care'
      }
    );
  }
}

/**
 * Factory function to create a CareQueryBuilder instance for a specific model
 * 
 * @param prisma - The PrismaClient instance
 * @param model - The Prisma model to query
 * @returns A new CareQueryBuilder instance
 */
export function createCareQueryBuilder<T extends PrismaModel>(
  prisma: PrismaClient,
  model: T
): CareQueryBuilder<T> {
  return new CareQueryBuilder<T>(prisma, model);
}

/**
 * Specialized query builder for Plan journey with optimizations for insurance plans,
 * benefits, and claims
 */
export class PlanQueryBuilder<T extends PrismaModel> extends QueryBuilder<T> {
  /**
   * Creates a new PlanQueryBuilder instance
   * 
   * @param prisma - The PrismaClient instance
   * @param model - The Prisma model to query
   */
  constructor(prisma: PrismaClient, model: T) {
    super(prisma, model);
  }

  /**
   * Finds plans with their benefits and coverage details
   * 
   * @param options - Query execution options
   * @returns A promise that resolves to the plans with benefits and coverage
   */
  async findPlansWithBenefits(options: QueryExecutionOptions = {}): Promise<any[]> {
    try {
      // This query uses a lateral join to efficiently get plans with their benefits
      return await this.prisma.$queryRaw`
        SELECT
          p.*,
          jsonb_agg(DISTINCT b.*) AS benefits,
          jsonb_agg(DISTINCT c.*) AS coverage
        FROM "${Prisma.raw(this.model.toString())}" p
        LEFT JOIN LATERAL (
          SELECT * FROM "Benefit" WHERE "planId" = p."id"
        ) b ON true
        LEFT JOIN LATERAL (
          SELECT * FROM "Coverage" WHERE "planId" = p."id"
        ) c ON true
        GROUP BY p."id"
      `;
    } catch (error) {
      throw this.handlePlanQueryError(error, 'findPlansWithBenefits', {});
    }
  }

  /**
   * Finds claims for a user with their status and related documents
   * 
   * @param userId - The user ID
   * @param options - Query execution options
   * @returns A promise that resolves to the claims with their status and documents
   */
  async findUserClaimsWithDocuments(
    userId: string | number,
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        SELECT
          c.*,
          jsonb_agg(d.*) FILTER (WHERE d."id" IS NOT NULL) AS documents
        FROM "Claim" c
        LEFT JOIN "Document" d ON d."claimId" = c."id"
        WHERE c."userId" = ${userId}
        GROUP BY c."id"
        ORDER BY c."submissionDate" DESC
      `;
    } catch (error) {
      throw this.handlePlanQueryError(error, 'findUserClaimsWithDocuments', { userId });
    }
  }

  /**
   * Calculates benefit utilization for a user
   * 
   * @param userId - The user ID
   * @param year - The year to calculate utilization for
   * @param options - Query execution options
   * @returns A promise that resolves to the benefit utilization
   */
  async calculateBenefitUtilization(
    userId: string | number,
    year: number,
    options: QueryExecutionOptions = {}
  ): Promise<any[]> {
    try {
      return await this.prisma.$queryRaw`
        WITH user_plan AS (
          SELECT p.* FROM "Plan" p
          JOIN "UserPlan" up ON up."planId" = p."id"
          WHERE up."userId" = ${userId}
            AND up."isActive" = true
        ),
        plan_benefits AS (
          SELECT b.* FROM "Benefit" b
          JOIN user_plan up ON b."planId" = up."id"
        ),
        approved_claims AS (
          SELECT
            c.*,
            b."id" AS "benefitId",
            b."name" AS "benefitName",
            b."limit" AS "benefitLimit",
            b."limitPeriod" AS "benefitLimitPeriod"
          FROM "Claim" c
          JOIN plan_benefits b ON c."benefitId" = b."id"
          WHERE c."userId" = ${userId}
            AND c."status" = 'APPROVED'
            AND EXTRACT(YEAR FROM c."submissionDate") = ${year}
        )
        SELECT
          pb."id" AS "benefitId",
          pb."name" AS "benefitName",
          pb."limit" AS "benefitLimit",
          pb."limitPeriod" AS "benefitLimitPeriod",
          COALESCE(SUM(ac."amount"), 0) AS "used",
          pb."limit" - COALESCE(SUM(ac."amount"), 0) AS "remaining",
          CASE
            WHEN pb."limit" > 0 THEN
              ROUND((COALESCE(SUM(ac."amount"), 0) / pb."limit") * 100, 2)
            ELSE 0
          END AS "utilizationPercentage"
        FROM plan_benefits pb
        LEFT JOIN approved_claims ac ON pb."id" = ac."benefitId"
        GROUP BY pb."id", pb."name", pb."limit", pb."limitPeriod"
      `;
    } catch (error) {
      throw this.handlePlanQueryError(error, 'calculateBenefitUtilization', { userId, year });
    }
  }

  /**
   * Handles errors specific to plan journey queries
   * 
   * @param error - The original error
   * @param operation - The operation that caused the error
   * @param params - The operation parameters
   * @returns The transformed error
   */
  private handlePlanQueryError(error: any, operation: string, params: any): Error {
    return new QueryException(
      `Error executing ${operation} in Plan journey: ${error.message}`,
      DatabaseErrorType.QUERY_ERROR,
      {
        model: this.model,
        operation,
        params,
        originalError: error,
        journey: 'plan'
      }
    );
  }
}

/**
 * Factory function to create a PlanQueryBuilder instance for a specific model
 * 
 * @param prisma - The PrismaClient instance
 * @param model - The Prisma model to query
 * @returns A new PlanQueryBuilder instance
 */
export function createPlanQueryBuilder<T extends PrismaModel>(
  prisma: PrismaClient,
  model: T
): PlanQueryBuilder<T> {
  return new PlanQueryBuilder<T>(prisma, model);
}

/**
 * Service that provides query building functionality for all journey services
 */
@Injectable()
export class QueryBuilderService {
  /**
   * Creates a new QueryBuilderService instance
   * 
   * @param prisma - The PrismaClient instance
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a generic query builder for any model
   * 
   * @param model - The Prisma model to query
   * @returns A new QueryBuilder instance
   */
  forModel<T extends PrismaModel>(model: T): QueryBuilder<T> {
    return createQueryBuilder(this.prisma, model);
  }

  /**
   * Creates a health-specific query builder for a model
   * 
   * @param model - The Prisma model to query
   * @returns A new HealthQueryBuilder instance
   */
  forHealthModel<T extends PrismaModel>(model: T): HealthQueryBuilder<T> {
    return createHealthQueryBuilder(this.prisma, model);
  }

  /**
   * Creates a care-specific query builder for a model
   * 
   * @param model - The Prisma model to query
   * @returns A new CareQueryBuilder instance
   */
  forCareModel<T extends PrismaModel>(model: T): CareQueryBuilder<T> {
    return createCareQueryBuilder(this.prisma, model);
  }

  /**
   * Creates a plan-specific query builder for a model
   * 
   * @param model - The Prisma model to query
   * @returns A new PlanQueryBuilder instance
   */
  forPlanModel<T extends PrismaModel>(model: T): PlanQueryBuilder<T> {
    return createPlanQueryBuilder(this.prisma, model);
  }
}