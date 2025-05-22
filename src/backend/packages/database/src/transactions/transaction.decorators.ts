/**
 * @file transaction.decorators.ts
 * @description Provides method decorators for declarative transaction management in service classes.
 * The primary decorator is @Transactional(), which automatically wraps method execution in a transaction
 * with configurable isolation level and retry options.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TransactionIsolationLevel } from './transaction.interface';
import { TransactionError } from './transaction.errors';
import { executeInTransaction, selectIsolationLevel } from './transaction.utils';

// Import from @austa/tracing if available
let TracingService: any;
try {
  const tracing = require('@austa/tracing');
  TracingService = tracing.TracingService;
} catch (e) {
  // Tracing is optional, so we can continue without it
  TracingService = null;
}

/**
 * Options for the @Transactional decorator
 */
export interface TransactionalOptions {
  /**
   * The isolation level for the transaction
   * @default TransactionIsolationLevel.READ_COMMITTED
   */
  isolationLevel?: TransactionIsolationLevel;

  /**
   * The maximum number of retry attempts for the transaction
   * @default 3
   */
  maxRetries?: number;

  /**
   * The timeout for the transaction in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * Whether to collect metrics for the transaction
   * @default true
   */
  collectMetrics?: boolean;

  /**
   * Whether to create a trace span for the transaction
   * @default true
   */
  createTraceSpan?: boolean;

  /**
   * Custom name for the transaction span
   * If not provided, the method name will be used
   */
  spanName?: string;
}

/**
 * Default options for the @Transactional decorator
 */
const DEFAULT_TRANSACTIONAL_OPTIONS: TransactionalOptions = {
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  maxRetries: 3,
  timeout: 5000,
  collectMetrics: true,
  createTraceSpan: true,
};

/**
 * Metrics collector for transaction performance monitoring
 */
class TransactionMetricsCollector {
  private static instance: TransactionMetricsCollector;
  private logger = new Logger('TransactionMetrics');

  // In a real implementation, this would use a metrics library like Prometheus
  private transactionDurations: Record<string, number[]> = {};
  private transactionCounts: Record<string, number> = {};
  private transactionErrors: Record<string, number> = {};

  private constructor() {}

  public static getInstance(): TransactionMetricsCollector {
    if (!TransactionMetricsCollector.instance) {
      TransactionMetricsCollector.instance = new TransactionMetricsCollector();
    }
    return TransactionMetricsCollector.instance;
  }

  /**
   * Record the duration of a transaction
   * @param methodName The name of the method that was executed in the transaction
   * @param durationMs The duration of the transaction in milliseconds
   */
  public recordTransactionDuration(methodName: string, durationMs: number): void {
    if (!this.transactionDurations[methodName]) {
      this.transactionDurations[methodName] = [];
    }
    this.transactionDurations[methodName].push(durationMs);

    // Increment transaction count
    this.transactionCounts[methodName] = (this.transactionCounts[methodName] || 0) + 1;

    // Log for demonstration purposes
    this.logger.debug(`Transaction ${methodName} completed in ${durationMs}ms`);
  }

  /**
   * Record a transaction error
   * @param methodName The name of the method that was executed in the transaction
   * @param error The error that occurred
   */
  public recordTransactionError(methodName: string, error: Error): void {
    this.transactionErrors[methodName] = (this.transactionErrors[methodName] || 0) + 1;
    
    // Log for demonstration purposes
    this.logger.warn(`Transaction ${methodName} failed with error: ${error.message}`);
  }

  /**
   * Get the average duration of transactions for a method
   * @param methodName The name of the method
   * @returns The average duration in milliseconds, or 0 if no transactions have been recorded
   */
  public getAverageTransactionDuration(methodName: string): number {
    const durations = this.transactionDurations[methodName];
    if (!durations || durations.length === 0) {
      return 0;
    }
    const sum = durations.reduce((acc, duration) => acc + duration, 0);
    return sum / durations.length;
  }

  /**
   * Get the success rate of transactions for a method
   * @param methodName The name of the method
   * @returns The success rate as a percentage, or 100 if no transactions have been recorded
   */
  public getTransactionSuccessRate(methodName: string): number {
    const totalCount = this.transactionCounts[methodName] || 0;
    if (totalCount === 0) {
      return 100;
    }
    const errorCount = this.transactionErrors[methodName] || 0;
    return ((totalCount - errorCount) / totalCount) * 100;
  }
}

/**
 * Decorator that wraps a method execution in a database transaction.
 * 
 * The transaction will be automatically committed if the method execution completes successfully,
 * or rolled back if an error is thrown.
 * 
 * @param options Configuration options for the transaction
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(private readonly prismaService: PrismaService) {}
 * 
 *   @Transactional()
 *   async createUser(data: CreateUserDto): Promise<User> {
 *     // This code will be executed within a transaction
 *     const user = await this.prismaService.user.create({ data });
 *     await this.prismaService.profile.create({ data: { userId: user.id } });
 *     return user;
 *   }
 * 
 *   @Transactional({ isolationLevel: TransactionIsolationLevel.SERIALIZABLE })
 *   async transferFunds(fromId: number, toId: number, amount: number): Promise<void> {
 *     // This code will be executed within a serializable transaction
 *     // ...
 *   }
 * }
 * ```
 */
export function Transactional(options: TransactionalOptions = {}) {
  const mergedOptions = { ...DEFAULT_TRANSACTIONAL_OPTIONS, ...options };
  
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;
    const className = target.constructor.name;
    const logger = new Logger(`${className}.${methodName}`);
    const metricsCollector = TransactionMetricsCollector.getInstance();

    descriptor.value = async function (...args: any[]) {
      // Get the PrismaService instance from the service instance (this)
      const prismaService = this.prismaService as PrismaService;
      if (!prismaService) {
        throw new Error(
          `@Transactional decorator requires the class to have a 'prismaService' property of type PrismaService. ` +
          `Please inject PrismaService in the constructor and assign it to 'this.prismaService'.`
        );
      }

      // Start tracing span if enabled
      let span: any = null;
      const spanName = mergedOptions.spanName || `${className}.${methodName}`;
      
      if (mergedOptions.createTraceSpan && TracingService) {
        const tracingService = TracingService.getInstance();
        if (tracingService) {
          span = tracingService.startSpan(`transaction.${spanName}`, {
            attributes: {
              'transaction.isolation_level': mergedOptions.isolationLevel,
              'transaction.max_retries': mergedOptions.maxRetries,
              'transaction.timeout': mergedOptions.timeout,
            },
          });
        }
      }

      // Record start time for metrics
      const startTime = Date.now();
      let error: Error | null = null;

      try {
        // Execute the method within a transaction
        const result = await executeInTransaction(
          prismaService,
          async (tx) => {
            // Replace the prismaService with the transaction client for the duration of the method
            const originalPrismaService = this.prismaService;
            this.prismaService = tx;
            
            try {
              // Execute the original method with the transaction client
              return await originalMethod.apply(this, args);
            } finally {
              // Restore the original prismaService
              this.prismaService = originalPrismaService;
            }
          },
          {
            isolationLevel: mergedOptions.isolationLevel,
            maxRetries: mergedOptions.maxRetries,
            timeout: mergedOptions.timeout,
          }
        );

        return result;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        
        // Wrap in TransactionError if it's not already one
        if (!(error instanceof TransactionError)) {
          error = new TransactionError(
            `Transaction failed in ${className}.${methodName}: ${error.message}`,
            { cause: error }
          );
        }

        // Record error in metrics
        if (mergedOptions.collectMetrics) {
          metricsCollector.recordTransactionError(`${className}.${methodName}`, error);
        }

        // Record error in tracing span
        if (span) {
          span.recordException(error);
          span.setStatus({ code: 'ERROR' });
        }

        // Log the error
        logger.error(
          `Transaction failed: ${error.message}`,
          error.stack
        );

        // Re-throw the error
        throw error;
      } finally {
        // End tracing span
        if (span) {
          span.end();
        }

        // Record metrics
        if (mergedOptions.collectMetrics) {
          const duration = Date.now() - startTime;
          metricsCollector.recordTransactionDuration(`${className}.${methodName}`, duration);
        }
      }
    };

    return descriptor;
  };
}

/**
 * Decorator that marks a method as read-only, using a transaction with READ COMMITTED isolation level.
 * This is a convenience decorator that is equivalent to @Transactional({ isolationLevel: TransactionIsolationLevel.READ_COMMITTED }).
 * 
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(private readonly prismaService: PrismaService) {}
 * 
 *   @ReadOnly()
 *   async getUserById(id: number): Promise<User> {
 *     // This code will be executed within a read-only transaction
 *     return this.prismaService.user.findUnique({ where: { id } });
 *   }
 * }
 * ```
 */
export function ReadOnly(options: Omit<TransactionalOptions, 'isolationLevel'> = {}) {
  return Transactional({
    ...options,
    isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  });
}

/**
 * Decorator that marks a method as requiring serializable isolation level.
 * This is a convenience decorator that is equivalent to @Transactional({ isolationLevel: TransactionIsolationLevel.SERIALIZABLE }).
 * 
 * Use this decorator for methods that require the highest isolation level, such as financial transactions.
 * 
 * @returns A method decorator
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class PaymentService {
 *   constructor(private readonly prismaService: PrismaService) {}
 * 
 *   @Serializable()
 *   async processPayment(paymentId: number): Promise<Payment> {
 *     // This code will be executed within a serializable transaction
 *     // ...
 *   }
 * }
 * ```
 */
export function Serializable(options: Omit<TransactionalOptions, 'isolationLevel'> = {}) {
  return Transactional({
    ...options,
    isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
  });
}