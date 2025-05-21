import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { DatabaseError } from '@app/errors';

/**
 * Enhanced PrismaService with connection pooling, error handling, and transaction management
 * for the Gamification Engine.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      datasources: {
        db: {
          url: configService.get<string>('gamificationEngine.database.url'),
          // Connection pooling configuration
          pooling: {
            // Maximum number of connections in the pool
            max: configService.get<number>('gamificationEngine.database.maxConnections', 10),
            // Minimum number of idle connections to maintain
            min: configService.get<number>('gamificationEngine.database.minConnections', 2),
            // Maximum idle time for a connection before being released
            idleTimeoutMillis: configService.get<number>(
              'gamificationEngine.database.idleTimeoutMillis',
              60000,
            ),
          },
        },
      },
    });

    // Set up error event listeners
    this.$on('error', (event) => {
      this.logger.error(`Database error: ${event.message}`, event.target);
    });

    this.$on('warn', (event) => {
      this.logger.warn(`Database warning: ${event.message}`, event.target);
    });
  }

  /**
   * Connect to the database when the module initializes
   */
  async onModuleInit() {
    this.logger.log('Connecting to database...');
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw new DatabaseError('Failed to connect to database', {
        cause: error,
        context: { service: 'gamification-engine' },
      });
    }
  }

  /**
   * Disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    try {
      await this.$disconnect();
      this.logger.log('Successfully disconnected from database');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }

  /**
   * Execute a database transaction with automatic error handling and retries
   * @param fn Function to execute within the transaction
   * @param options Transaction options including isolation level and max retries
   * @returns Result of the transaction function
   */
  async executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      maxRetries?: number;
      timeout?: number;
    },
  ): Promise<T> {
    const {
      isolationLevel = 'ReadCommitted',
      maxRetries = 3,
      timeout = 5000,
    } = options || {};

    let retries = 0;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        return await this.$transaction(
          async (tx) => {
            return await fn(tx);
          },
          {
            isolationLevel,
            timeout,
          },
        );
      } catch (error) {
        lastError = error as Error;
        retries++;

        // Only retry on transient errors
        if (!this.isTransientError(error)) {
          break;
        }

        // Exponential backoff
        const delay = Math.pow(2, retries) * 100;
        this.logger.warn(
          `Transaction failed (attempt ${retries}/${maxRetries}), retrying in ${delay}ms`,
          { error: error.message },
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we've exhausted retries, throw the last error
    this.logger.error(
      `Transaction failed after ${maxRetries} attempts`,
      lastError,
    );
    throw new DatabaseError('Transaction failed', {
      cause: lastError,
      context: {
        service: 'gamification-engine',
        retries,
        maxRetries,
      },
    });
  }

  /**
   * Check if an error is transient and can be retried
   * @param error The error to check
   * @returns True if the error is transient and can be retried
   */
  private isTransientError(error: any): boolean {
    // Prisma error codes that are considered transient
    const transientErrorCodes = [
      'P1002', // The database server was closed
      'P1008', // Operations timed out
      'P1017', // Server has closed the connection
      'P2024', // Connection pool timeout
      'P2028', // Transaction API error
    ];

    // Check if it's a Prisma error with a code
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return transientErrorCodes.includes(error.code);
    }

    // Check for specific error messages that indicate transient issues
    if (error.message) {
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('deadlock') ||
        message.includes('too many connections')
      );
    }

    return false;
  }

  /**
   * Execute a database query with performance tracking and error handling
   * @param operation Name of the operation for logging
   * @param queryFn Function that executes the database query
   * @returns Result of the query function
   */
  async executeQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries for performance monitoring
      const slowQueryThreshold = this.configService.get<number>(
        'gamificationEngine.database.slowQueryThreshold',
        500,
      );
      if (duration > slowQueryThreshold) {
        this.logger.warn(`Slow query detected: ${operation} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Query error in ${operation} after ${duration}ms: ${error.message}`,
        error.stack,
      );

      // Enhance error with context information
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(`Database error in ${operation}`, {
          cause: error,
          context: {
            code: error.code,
            operation,
            duration,
            meta: error.meta,
          },
        });
      }

      // Handle validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new DatabaseError(`Validation error in ${operation}`, {
          cause: error,
          context: {
            operation,
            duration,
          },
        });
      }

      // Handle unknown errors
      throw new DatabaseError(`Unexpected error in ${operation}`, {
        cause: error,
        context: {
          operation,
          duration,
        },
      });
    }
  }
}