import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../../src/errors/database-error.types';

/**
 * Type for pagination parameters used in query utilities
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Type for sorting parameters used in query utilities
 */
export interface SortingParams {
  orderBy?: Record<string, 'asc' | 'desc'>;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for filtering parameters used in query utilities
 */
export interface FilteringParams {
  where?: Record<string, any>;
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
}

/**
 * Type for query options combining pagination, sorting, and filtering
 */
export interface QueryOptions extends PaginationParams, SortingParams, FilteringParams {}

/**
 * Type for query result with pagination metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Utility class for common database query patterns used in tests
 */
export class QueryTestUtils {
  /**
   * Creates a new instance of QueryTestUtils
   * 
   * @param prisma The PrismaService or PrismaClient instance to use for queries
   */
  constructor(private readonly prisma: PrismaService | PrismaClient) {}

  /**
   * Executes a query with proper error handling and returns the result
   * 
   * @param queryName Name of the query for logging and error reporting
   * @param queryFn Function that executes the actual query
   * @returns The result of the query
   * @throws {DatabaseException} If the query fails
   */
  async executeQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    try {
      // If using PrismaService with executeQuery method, use it
      if ('executeQuery' in this.prisma) {
        return await (this.prisma as PrismaService).executeQuery(queryName, queryFn);
      }
      
      // Otherwise, execute the query directly
      return await queryFn();
    } catch (error) {
      // Rethrow DatabaseExceptions as is
      if (error instanceof DatabaseException) {
        throw error;
      }
      
      // Wrap other errors in a DatabaseException
      throw new DatabaseException(
        `Query '${queryName}' failed: ${error.message}`,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          originalError: error,
        },
      );
    }
  }

  /**
   * Builds a paginated query with the given options
   * 
   * @param model The Prisma model to query
   * @param options Query options including pagination, sorting, and filtering
   * @returns A paginated result with data and metadata
   */
  async findWithPagination<T>(
    model: any,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      skip,
      take,
      orderBy,
      sortField,
      sortOrder = 'asc',
      where,
      search,
      searchFields = [],
      filters,
    } = options;

    // Calculate pagination parameters
    const skipValue = skip !== undefined ? skip : (page - 1) * limit;
    const takeValue = take !== undefined ? take : limit;

    // Build sorting parameters
    let orderByValue = orderBy;
    if (!orderByValue && sortField) {
      orderByValue = { [sortField]: sortOrder };
    }

    // Build filtering parameters
    let whereValue: Record<string, any> = { ...where };

    // Add search condition if provided
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => ({
        [field]: { contains: search, mode: 'insensitive' as const },
      }));
      whereValue = {
        ...whereValue,
        OR: searchConditions,
      };
    }

    // Add additional filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          whereValue[key] = value;
        }
      });
    }

    // Execute count query for total records
    const total = await this.executeQuery(`count-${model}`, () =>
      this.prisma[model].count({ where: whereValue }),
    );

    // Execute data query with pagination, sorting, and filtering
    const data = await this.executeQuery(`find-${model}`, () =>
      this.prisma[model].findMany({
        skip: skipValue,
        take: takeValue,
        orderBy: orderByValue,
        where: whereValue,
      }),
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / takeValue);

    return {
      data: data as T[],
      meta: {
        total,
        page,
        limit: takeValue,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Finds a single entity by ID with optional relation loading
   * 
   * @param model The Prisma model to query
   * @param id The ID of the entity to find
   * @param include Optional relations to include
   * @returns The found entity or null if not found
   */
  async findById<T>(
    model: string,
    id: string | number,
    include?: Record<string, boolean>,
  ): Promise<T | null> {
    return this.executeQuery(`findById-${model}`, () =>
      this.prisma[model].findUnique({
        where: { id },
        include,
      }),
    );
  }

  /**
   * Finds entities matching the given criteria
   * 
   * @param model The Prisma model to query
   * @param where The filter criteria
   * @param options Additional query options
   * @returns Array of matching entities
   */
  async findMany<T>(
    model: string,
    where: Record<string, any>,
    options: Omit<QueryOptions, 'where'> = {},
  ): Promise<T[]> {
    const {
      skip,
      take,
      orderBy,
      sortField,
      sortOrder = 'asc',
    } = options;

    // Build sorting parameters
    let orderByValue = orderBy;
    if (!orderByValue && sortField) {
      orderByValue = { [sortField]: sortOrder };
    }

    return this.executeQuery(`findMany-${model}`, () =>
      this.prisma[model].findMany({
        where,
        skip,
        take,
        orderBy: orderByValue,
      }),
    );
  }

  /**
   * Finds the first entity matching the given criteria
   * 
   * @param model The Prisma model to query
   * @param where The filter criteria
   * @param options Additional query options
   * @returns The first matching entity or null if none found
   */
  async findFirst<T>(
    model: string,
    where: Record<string, any>,
    options: Omit<QueryOptions, 'where'> = {},
  ): Promise<T | null> {
    const {
      orderBy,
      sortField,
      sortOrder = 'asc',
    } = options;

    // Build sorting parameters
    let orderByValue = orderBy;
    if (!orderByValue && sortField) {
      orderByValue = { [sortField]: sortOrder };
    }

    return this.executeQuery(`findFirst-${model}`, () =>
      this.prisma[model].findFirst({
        where,
        orderBy: orderByValue,
      }),
    );
  }

  /**
   * Counts entities matching the given criteria
   * 
   * @param model The Prisma model to query
   * @param where The filter criteria
   * @returns The count of matching entities
   */
  async count(model: string, where: Record<string, any> = {}): Promise<number> {
    return this.executeQuery(`count-${model}`, () =>
      this.prisma[model].count({ where }),
    );
  }

  /**
   * Creates a new entity
   * 
   * @param model The Prisma model to use
   * @param data The data for the new entity
   * @returns The created entity
   */
  async create<T>(model: string, data: Record<string, any>): Promise<T> {
    return this.executeQuery(`create-${model}`, () =>
      this.prisma[model].create({ data }),
    );
  }

  /**
   * Creates multiple entities in a single operation
   * 
   * @param model The Prisma model to use
   * @param data Array of data for the new entities
   * @returns The created entities
   */
  async createMany<T>(
    model: string,
    data: Record<string, any>[],
    skipDuplicates = false,
  ): Promise<{ count: number }> {
    return this.executeQuery(`createMany-${model}`, () =>
      this.prisma[model].createMany({
        data,
        skipDuplicates,
      }),
    );
  }

  /**
   * Updates an entity by ID
   * 
   * @param model The Prisma model to use
   * @param id The ID of the entity to update
   * @param data The update data
   * @returns The updated entity
   */
  async update<T>(
    model: string,
    id: string | number,
    data: Record<string, any>,
  ): Promise<T> {
    return this.executeQuery(`update-${model}`, () =>
      this.prisma[model].update({
        where: { id },
        data,
      }),
    );
  }

  /**
   * Updates multiple entities matching the criteria
   * 
   * @param model The Prisma model to use
   * @param where The filter criteria
   * @param data The update data
   * @returns The number of updated records
   */
  async updateMany(
    model: string,
    where: Record<string, any>,
    data: Record<string, any>,
  ): Promise<{ count: number }> {
    return this.executeQuery(`updateMany-${model}`, () =>
      this.prisma[model].updateMany({
        where,
        data,
      }),
    );
  }

  /**
   * Deletes an entity by ID
   * 
   * @param model The Prisma model to use
   * @param id The ID of the entity to delete
   * @returns The deleted entity
   */
  async delete<T>(model: string, id: string | number): Promise<T> {
    return this.executeQuery(`delete-${model}`, () =>
      this.prisma[model].delete({
        where: { id },
      }),
    );
  }

  /**
   * Deletes multiple entities matching the criteria
   * 
   * @param model The Prisma model to use
   * @param where The filter criteria
   * @returns The number of deleted records
   */
  async deleteMany(
    model: string,
    where: Record<string, any>,
  ): Promise<{ count: number }> {
    return this.executeQuery(`deleteMany-${model}`, () =>
      this.prisma[model].deleteMany({ where }),
    );
  }

  /**
   * Simulates a database query failure for testing error handling
   * 
   * @param errorType The type of database error to simulate
   * @param severity The severity of the error
   * @param message Custom error message
   * @throws {DatabaseException} Always throws a database exception
   */
  simulateQueryFailure(
    errorType: DatabaseErrorType = DatabaseErrorType.QUERY,
    severity: DatabaseErrorSeverity = DatabaseErrorSeverity.MAJOR,
    message = 'Simulated database query failure',
  ): never {
    throw new DatabaseException(message, {
      errorType,
      severity,
      originalError: new Error('Simulated error for testing'),
    });
  }

  // Journey-specific query helpers

  /**
   * Health Journey: Finds health metrics with filtering and pagination
   * 
   * @param userId The user ID to filter by
   * @param options Query options including metric type, date range, etc.
   * @returns Paginated health metrics
   */
  async findHealthMetrics(
    userId: string,
    options: QueryOptions & {
      metricType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<PaginatedResult<any>> {
    const {
      metricType,
      startDate,
      endDate,
      ...queryOptions
    } = options;

    // Build where clause for health metrics
    const where: Record<string, any> = { userId };

    // Add metric type filter if provided
    if (metricType) {
      where.type = metricType;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) {
        where.recordedAt.gte = startDate;
      }
      if (endDate) {
        where.recordedAt.lte = endDate;
      }
    }

    // Use the generic paginated query with health-specific filters
    return this.findWithPagination('healthMetric', {
      ...queryOptions,
      where,
      sortField: queryOptions.sortField || 'recordedAt',
      sortOrder: queryOptions.sortOrder || 'desc',
    });
  }

  /**
   * Care Journey: Finds appointments with filtering and pagination
   * 
   * @param userId The user ID to filter by
   * @param options Query options including status, provider, date range, etc.
   * @returns Paginated appointments
   */
  async findAppointments(
    userId: string,
    options: QueryOptions & {
      status?: string;
      providerId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<PaginatedResult<any>> {
    const {
      status,
      providerId,
      startDate,
      endDate,
      ...queryOptions
    } = options;

    // Build where clause for appointments
    const where: Record<string, any> = { userId };

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Add provider filter if provided
    if (providerId) {
      where.providerId = providerId;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) {
        where.scheduledAt.gte = startDate;
      }
      if (endDate) {
        where.scheduledAt.lte = endDate;
      }
    }

    // Use the generic paginated query with care-specific filters
    return this.findWithPagination('appointment', {
      ...queryOptions,
      where,
      sortField: queryOptions.sortField || 'scheduledAt',
      sortOrder: queryOptions.sortOrder || 'asc',
    });
  }

  /**
   * Plan Journey: Finds insurance claims with filtering and pagination
   * 
   * @param userId The user ID to filter by
   * @param options Query options including status, claim type, date range, etc.
   * @returns Paginated claims
   */
  async findClaims(
    userId: string,
    options: QueryOptions & {
      status?: string;
      claimType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<PaginatedResult<any>> {
    const {
      status,
      claimType,
      startDate,
      endDate,
      ...queryOptions
    } = options;

    // Build where clause for claims
    const where: Record<string, any> = { userId };

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Add claim type filter if provided
    if (claimType) {
      where.claimTypeId = claimType;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) {
        where.submittedAt.gte = startDate;
      }
      if (endDate) {
        where.submittedAt.lte = endDate;
      }
    }

    // Use the generic paginated query with plan-specific filters
    return this.findWithPagination('claim', {
      ...queryOptions,
      where,
      sortField: queryOptions.sortField || 'submittedAt',
      sortOrder: queryOptions.sortOrder || 'desc',
    });
  }

  /**
   * Gamification Journey: Finds user achievements with filtering and pagination
   * 
   * @param userId The user ID to filter by
   * @param options Query options including achievement type, journey, etc.
   * @returns Paginated achievements
   */
  async findAchievements(
    userId: string,
    options: QueryOptions & {
      achievementType?: string;
      journey?: string;
      isCompleted?: boolean;
    } = {},
  ): Promise<PaginatedResult<any>> {
    const {
      achievementType,
      journey,
      isCompleted,
      ...queryOptions
    } = options;

    // Build where clause for achievements
    const where: Record<string, any> = { userId };

    // Add achievement type filter if provided
    if (achievementType) {
      where.achievementTypeId = achievementType;
    }

    // Add journey filter if provided
    if (journey) {
      where.achievementType = { journey };
    }

    // Add completion status filter if provided
    if (isCompleted !== undefined) {
      where.completedAt = isCompleted ? { not: null } : null;
    }

    // Use the generic paginated query with gamification-specific filters
    return this.findWithPagination('achievement', {
      ...queryOptions,
      where,
      sortField: queryOptions.sortField || 'createdAt',
      sortOrder: queryOptions.sortOrder || 'desc',
      include: { achievementType: true },
    });
  }

  /**
   * Executes a raw SQL query for advanced testing scenarios
   * 
   * @param sql The SQL query string
   * @param params Optional query parameters
   * @returns The query result
   */
  async executeRawQuery<T>(sql: string, params: any[] = []): Promise<T> {
    return this.executeQuery('raw-sql', () =>
      this.prisma.$queryRaw.apply(this.prisma, [sql, ...params]),
    );
  }

  /**
   * Executes a raw SQL command that doesn't return results
   * 
   * @param sql The SQL command string
   * @param params Optional command parameters
   * @returns The number of affected rows
   */
  async executeRawCommand(sql: string, params: any[] = []): Promise<number> {
    return this.executeQuery('raw-command', () =>
      this.prisma.$executeRaw.apply(this.prisma, [sql, ...params]),
    );
  }

  /**
   * Tests database connection by executing a simple query
   * 
   * @returns True if connection is successful, false otherwise
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.executeQuery('test-connection', () =>
        this.prisma.$queryRaw`SELECT 1 as connection_test`,
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Creates a new QueryTestUtils instance with the provided PrismaService or PrismaClient
 * 
 * @param prisma The PrismaService or PrismaClient instance
 * @returns A new QueryTestUtils instance
 */
export function createQueryTestUtils(
  prisma: PrismaService | PrismaClient,
): QueryTestUtils {
  return new QueryTestUtils(prisma);
}

/**
 * Utility function to build a where clause with complex filtering options
 * 
 * @param filters Object containing filter conditions
 * @returns A Prisma-compatible where clause
 */
export function buildWhereClause(filters: Record<string, any> = {}): Record<string, any> {
  const where: Record<string, any> = {};

  // Process each filter key-value pair
  Object.entries(filters).forEach(([key, value]) => {
    // Skip undefined or null values
    if (value === undefined || value === null) {
      return;
    }

    // Handle special filter operators
    if (typeof value === 'object' && !Array.isArray(value)) {
      const operators = Object.keys(value);
      
      // Process each operator for this field
      operators.forEach(op => {
        const opValue = value[op];
        if (opValue === undefined || opValue === null) {
          return;
        }

        // Initialize the field in the where clause if needed
        where[key] = where[key] || {};

        // Map operator to Prisma filter
        switch (op) {
          case 'eq':
            where[key] = opValue; // Direct equality
            break;
          case 'neq':
            where[key] = { not: opValue };
            break;
          case 'gt':
            where[key].gt = opValue;
            break;
          case 'gte':
            where[key].gte = opValue;
            break;
          case 'lt':
            where[key].lt = opValue;
            break;
          case 'lte':
            where[key].lte = opValue;
            break;
          case 'contains':
            where[key].contains = opValue;
            break;
          case 'startsWith':
            where[key].startsWith = opValue;
            break;
          case 'endsWith':
            where[key].endsWith = opValue;
            break;
          case 'in':
            where[key].in = Array.isArray(opValue) ? opValue : [opValue];
            break;
          case 'notIn':
            where[key].notIn = Array.isArray(opValue) ? opValue : [opValue];
            break;
          case 'between':
            if (Array.isArray(opValue) && opValue.length === 2) {
              where[key].gte = opValue[0];
              where[key].lte = opValue[1];
            }
            break;
          default:
            // For custom operators, pass through as is
            where[key][op] = opValue;
        }
      });
    } else if (Array.isArray(value)) {
      // Handle array values as 'in' operator
      where[key] = { in: value };
    } else {
      // Handle direct equality
      where[key] = value;
    }
  });

  return where;
}

/**
 * Utility function to build a search condition for text fields
 * 
 * @param searchTerm The search term to look for
 * @param searchFields Array of fields to search in
 * @returns A Prisma-compatible search condition
 */
export function buildSearchCondition(
  searchTerm: string,
  searchFields: string[],
): Record<string, any> {
  if (!searchTerm || !searchFields.length) {
    return {};
  }

  return {
    OR: searchFields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' as const },
    })),
  };
}

/**
 * Utility function to build pagination parameters
 * 
 * @param options Pagination options
 * @returns Object with skip and take values for Prisma
 */
export function buildPaginationParams(
  options: PaginationParams = {},
): { skip: number; take: number } {
  const {
    page = 1,
    limit = 10,
    skip: skipParam,
    take: takeParam,
  } = options;

  const skip = skipParam !== undefined ? skipParam : (page - 1) * limit;
  const take = takeParam !== undefined ? takeParam : limit;

  return { skip, take };
}

/**
 * Utility function to build sorting parameters
 * 
 * @param options Sorting options
 * @returns Prisma-compatible orderBy object
 */
export function buildSortingParams(
  options: SortingParams = {},
): Record<string, 'asc' | 'desc'> | undefined {
  const { orderBy, sortField, sortOrder = 'asc' } = options;

  if (orderBy) {
    return orderBy;
  }

  if (sortField) {
    return { [sortField]: sortOrder };
  }

  return undefined;
}