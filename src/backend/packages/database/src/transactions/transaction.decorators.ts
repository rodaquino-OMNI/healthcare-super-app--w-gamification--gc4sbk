/**
 * @file transaction.decorators.ts
 * @description Provides method decorators for declarative transaction management in service classes.
 * The primary decorator is @Transactional(), which automatically wraps method execution in a
 * transaction with configurable isolation level and retry options. These decorators simplify
 * transaction management by reducing boilerplate code and ensuring consistent transaction
 * handling across the application.
 */

import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';

// Optional import for metrics if available
let metricsService: any;
try {
  // Try to import the metrics service if it exists
  // This allows the decorators to work even if the metrics package is not installed
  const metricsModule = require('@austa/metrics');
  metricsService = metricsModule?.MetricsService;
} catch (error) {
  // Metrics package not available, will fallback to console logging
}

import {
  TransactionOptions,
  TransactionIsolationLevel,
  TransactionType,
  DEFAULT_TRANSACTION_OPTIONS,
  TransactionMetadata,
  TransactionState
} from '../types/transaction.types';

import {
  executeInTransaction,
  executeWithPerformanceTracking,
  logTransactionPerformance,
  transformTransactionError,
  getIsolationLevelForOperation,
  OperationType
} from './transaction.utils';

import { TransactionError } from './transaction.errors';
import { JourneyContext, DatabaseOperationContext } from '../errors/database-error.types';

// Private logger instance for transaction decorators
const logger = new Logger('TransactionDecorators');

/**
 * Options for the @Transactional decorator
 */
export interface TransactionalOptions extends Partial<TransactionOptions> {
  /**
   * Whether to use an existing transaction if one is already in progress
   * @default true
   */
  useExisting?: boolean;

  /**
   * Whether to create a new transaction even if one is already in progress
   * @default false
   */
  requiresNew?: boolean;

  /**
   * Operation type for automatic isolation level selection
   * If provided, this will override the isolationLevel option
   */
  operationType?: OperationType;

  /**
   * Whether to enable tracing for this transaction
   * @default true
   */
  enableTracing?: boolean;

  /**
   * Whether to enable performance metrics for this transaction
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Custom name for the transaction span in tracing
   * If not provided, the method name will be used
   */
  spanName?: string;

  /**
   * Custom attributes to add to the transaction span
   */
  spanAttributes?: Record<string, any>;
}

/**
 * Default options for the @Transactional decorator
 */
const DEFAULT_TRANSACTIONAL_OPTIONS: Required<TransactionalOptions> = {
  ...DEFAULT_TRANSACTION_OPTIONS,
  useExisting: true,
  requiresNew: false,
  enableTracing: true,
  enableMetrics: true,
  operationType: undefined,
  spanName: undefined,
  spanAttributes: {}
};

/**
 * Symbol used to store transaction metadata on the target object
 */
const TRANSACTION_METADATA_KEY = Symbol('TRANSACTION_METADATA');

/**
 * Symbol used to store the active transaction on the target object
 */
const ACTIVE_TRANSACTION_KEY = Symbol('ACTIVE_TRANSACTION');

/**
 * Interface for the transaction context stored on the target object
 */
interface TransactionContext {
  /**
   * The active transaction client
   */
  client: PrismaClient;

  /**
   * Metadata about the transaction
   */
  metadata: TransactionMetadata;

  /**
   * Whether the transaction was created by the current method
   */
  isOwner: boolean;
}

/**
 * Decorator that wraps a method execution in a database transaction.
 * The transaction is automatically committed if the method completes successfully,
 * or rolled back if an exception is thrown.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * // Basic usage with default options
 * @Transactional()
 * async createUser(data: CreateUserDto): Promise<User> {
 *   // This code will execute within a transaction
 *   const user = await this.prisma.user.create({ data });
 *   await this.prisma.profile.create({ data: { userId: user.id } });
 *   return user;
 * }
 *
 * @example
 * // With custom isolation level and retry options
 * @Transactional({
 *   isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
 *   retry: { maxRetries: 5, baseDelayMs: 200 }
 * })
 * async transferFunds(fromId: number, toId: number, amount: number): Promise<void> {
 *   // This code will execute within a serializable transaction with retry
 *   await this.prisma.account.update({
 *     where: { id: fromId },
 *     data: { balance: { decrement: amount } }
 *   });
 *   await this.prisma.account.update({
 *     where: { id: toId },
 *     data: { balance: { increment: amount } }
 *   });
 * }
 *
 * @example
 * // With operation type for automatic isolation level selection
 * @Transactional({ operationType: OperationType.CRITICAL_WRITE })
 * async updateUserStatus(userId: number, status: string): Promise<User> {
 *   // This will automatically use SERIALIZABLE isolation level
 *   return this.prisma.user.update({
 *     where: { id: userId },
 *     data: { status }
 *   });
 * }
 * 
 * @example
 * // With journey context for cross-service tracing
 * @Transactional({
 *   journeyContext: 'health',
 *   spanAttributes: { 'health.metric.type': 'blood_pressure' }
 * })
 * async recordHealthMetric(userId: number, data: HealthMetricDto): Promise<HealthMetric> {
 *   // This transaction will be tagged with the health journey context
 *   return this.prisma.healthMetric.create({
 *     data: { userId, ...data, recordedAt: new Date() }
 *   });
 * }
 *
 * @example
 * // Nested transactions with savepoints
 * @Transactional()
 * async processHealthData(userId: number, data: HealthDataDto): Promise<void> {
 *   // This is the outer transaction
 *   await this.recordBasicMetrics(userId, data.basicMetrics);
 *   
 *   try {
 *     // This will use the existing transaction by default
 *     await this.processAdvancedMetrics(userId, data.advancedMetrics);
 *   } catch (error) {
 *     // Only the advanced metrics processing fails, basic metrics are still saved
 *     this.logger.warn('Failed to process advanced metrics', error);
 *   }
 * }
 *
 * @Transactional()
 * async recordBasicMetrics(userId: number, metrics: BasicMetricsDto): Promise<void> {
 *   // Uses the parent transaction if called from a transactional method
 * }
 *
 * @Transactional({ requiresNew: true })
 * async processAdvancedMetrics(userId: number, metrics: AdvancedMetricsDto): Promise<void> {
 *   // Always creates a new transaction, even when called from another transactional method
 * }
 */
export function Transactional(options: TransactionalOptions = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey.toString();

    // Merge options with defaults
    const mergedOptions = { ...DEFAULT_TRANSACTIONAL_OPTIONS, ...options };

    // If operationType is provided, override isolationLevel
    if (mergedOptions.operationType && !options.isolationLevel) {
      mergedOptions.isolationLevel = getIsolationLevelForOperation(mergedOptions.operationType);
    }

    descriptor.value = async function (...args: any[]) {
      // Get the PrismaClient instance from the service
      const prismaClient = getPrismaClientFromService(this);
      if (!prismaClient) {
        logger.warn(`No PrismaClient found in service for @Transactional method ${methodName}. Executing without transaction.`);
        return originalMethod.apply(this, args);
      }

      // Check if there's already an active transaction
      const activeTransaction = getActiveTransaction(this);
      if (activeTransaction && mergedOptions.useExisting && !mergedOptions.requiresNew) {
        // Use the existing transaction
        return executeWithTracing(
          this,
          methodName,
          mergedOptions,
          () => originalMethod.apply(this, args),
          activeTransaction.client,
          activeTransaction.metadata,
          false
        );
      }

      // Generate a unique transaction ID
      const transactionId = generateTransactionId(methodName);

      // Create transaction metadata
      const metadata: TransactionMetadata = {
        id: transactionId,
        createdAt: new Date(),
        state: TransactionState.CREATED,
        type: mergedOptions.type,
        isolationLevel: mergedOptions.isolationLevel,
        journeyContext: mergedOptions.journeyContext || getJourneyContextFromService(this) || 'default',
        retryCount: 0
      };

      // Create operation context for error handling
      const operationContext: DatabaseOperationContext = {
        operation: methodName,
        entity: getEntityFromService(this) || 'unknown',
        transactionId,
        isolationLevel: mergedOptions.isolationLevel
      };

      // Create journey context for error handling
      const journeyContext: JourneyContext = {
        journey: metadata.journeyContext,
        feature: getFeatureFromService(this) || 'database'
      };

      try {
        // Start performance monitoring if enabled
        const startTime = mergedOptions.enableMetrics ? performance.now() : 0;

        // Execute the transaction
        const result = await executeInTransaction(
          prismaClient,
          async (tx) => {
            // Store the transaction context
            const transactionContext: TransactionContext = {
              client: tx as unknown as PrismaClient,
              metadata,
              isOwner: true
            };
            setActiveTransaction(this, transactionContext);

            try {
              // Execute the method with tracing
              return await executeWithTracing(
                this,
                methodName,
                mergedOptions,
                () => originalMethod.apply(this, args),
                tx as unknown as PrismaClient,
                metadata,
                true
              );
            } finally {
              // Clear the transaction context if we're the owner
              if (getActiveTransaction(this)?.isOwner) {
                clearActiveTransaction(this);
              }
            }
          },
          {
            isolationLevel: mergedOptions.isolationLevel,
            timeout: mergedOptions.timeout,
            retry: mergedOptions.retry,
            logging: mergedOptions.logging,
            savepoint: mergedOptions.savepoint,
            distributed: mergedOptions.distributed,
            type: mergedOptions.type,
            journeyContext: metadata.journeyContext
          }
        );

        // Log performance metrics if enabled
        if (mergedOptions.enableMetrics && startTime > 0) {
          const endTime = performance.now();
          logTransactionPerformance({
            transactionId,
            durationMs: endTime - startTime,
            dbTimeMs: endTime - startTime, // Approximate, as we don't have the exact DB time
            queryCount: 0, // Unknown at this level
            rowCount: 0, // Unknown at this level
            isolationLevel: mergedOptions.isolationLevel,
            journeyContext: metadata.journeyContext,
            successful: true,
            retryCount: metadata.retryCount
          });
        }

        return result;
      } catch (error) {
        // Transform and rethrow the error
        throw transformTransactionError(error, journeyContext, operationContext);
      }
    };

    return descriptor;
  };
}

/**
 * Decorator that wraps a method execution in a read-only transaction.
 * This is a convenience decorator that sets the appropriate isolation level
 * for read-only operations.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * @ReadOnly()
 * async getUserById(id: number): Promise<User> {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 */
export function ReadOnly(options: Omit<TransactionalOptions, 'operationType' | 'isolationLevel'> = {}): MethodDecorator {
  return Transactional({
    ...options,
    operationType: OperationType.READ_ONLY
  });
}

/**
 * Decorator that wraps a method execution in a read-write transaction.
 * This is a convenience decorator that sets the appropriate isolation level
 * for read-write operations.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * @ReadWrite()
 * async updateUserProfile(id: number, data: UpdateProfileDto): Promise<User> {
 *   const user = await this.prisma.user.findUnique({ where: { id } });
 *   return this.prisma.user.update({
 *     where: { id },
 *     data: { ...data, updatedAt: new Date() }
 *   });
 * }
 */
export function ReadWrite(options: Omit<TransactionalOptions, 'operationType' | 'isolationLevel'> = {}): MethodDecorator {
  return Transactional({
    ...options,
    operationType: OperationType.READ_WRITE
  });
}

/**
 * Decorator that wraps a method execution in a write-only transaction.
 * This is a convenience decorator that sets the appropriate isolation level
 * for write-only operations.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * @WriteOnly()
 * async deleteUser(id: number): Promise<void> {
 *   await this.prisma.profile.delete({ where: { userId: id } });
 *   await this.prisma.user.delete({ where: { id } });
 * }
 */
export function WriteOnly(options: Omit<TransactionalOptions, 'operationType' | 'isolationLevel'> = {}): MethodDecorator {
  return Transactional({
    ...options,
    operationType: OperationType.WRITE_ONLY
  });
}

/**
 * Decorator that wraps a method execution in a critical write transaction.
 * This is a convenience decorator that sets the highest isolation level
 * for critical write operations that require strong consistency.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * @CriticalWrite()
 * async transferFunds(fromId: number, toId: number, amount: number): Promise<void> {
 *   await this.prisma.account.update({
 *     where: { id: fromId },
 *     data: { balance: { decrement: amount } }
 *   });
 *   await this.prisma.account.update({
 *     where: { id: toId },
 *     data: { balance: { increment: amount } }
 *   });
 * }
 */
export function CriticalWrite(options: Omit<TransactionalOptions, 'operationType' | 'isolationLevel'> = {}): MethodDecorator {
  return Transactional({
    ...options,
    operationType: OperationType.CRITICAL_WRITE
  });
}

/**
 * Decorator that marks a method as requiring a new transaction.
 * This is a convenience decorator that sets requiresNew to true.
 *
 * @param options - Configuration options for the transaction
 * @returns Method decorator
 *
 * @example
 * @RequiresNewTransaction()
 * async resetPassword(userId: number, newPassword: string): Promise<void> {
 *   // This will always execute in a new transaction, even if called from
 *   // another transactional method
 *   await this.prisma.user.update({
 *     where: { id: userId },
 *     data: { password: newPassword, passwordResetAt: new Date() }
 *   });
 * }
 */
export function RequiresNewTransaction(options: Omit<TransactionalOptions, 'requiresNew'> = {}): MethodDecorator {
  return Transactional({
    ...options,
    requiresNew: true
  });
}

/**
 * Executes a method with tracing if enabled
 *
 * @param target - The service instance
 * @param methodName - The name of the method being executed
 * @param options - Transaction options
 * @param callback - The function to execute
 * @param client - The PrismaClient instance
 * @param metadata - Transaction metadata
 * @param isOwner - Whether the current method owns the transaction
 * @returns The result of the callback function
 */
async function executeWithTracing<T>(
  target: any,
  methodName: string,
  options: Required<TransactionalOptions>,
  callback: () => Promise<T>,
  client: PrismaClient,
  metadata: TransactionMetadata,
  isOwner: boolean
): Promise<T> {
  // Start performance monitoring
  const startTime = performance.now();
  
  // Try to get the logger service from the target
  const loggerService = getLoggerServiceFromService(target) || new Logger(target.constructor?.name || 'Transaction');
  
  // Try to get the metrics service from the target
  const metrics = getMetricsServiceFromService(target);
  
  // Skip tracing if disabled
  if (!options.enableTracing) {
    try {
      const result = await callback();
      recordTransactionMetrics(metrics, methodName, metadata, startTime, true);
      return result;
    } catch (error) {
      recordTransactionMetrics(metrics, methodName, metadata, startTime, false, error);
      throw error;
    }
  }

  // Try to get the tracing service from the target
  const tracingService = getTracingServiceFromService(target);
  if (!tracingService) {
    try {
      const result = await callback();
      recordTransactionMetrics(metrics, methodName, metadata, startTime, true);
      return result;
    } catch (error) {
      recordTransactionMetrics(metrics, methodName, metadata, startTime, false, error);
      throw error;
    }
  }

  // Create span name
  const spanName = options.spanName || `transaction.${methodName}`;

  // Create span attributes
  const spanAttributes = {
    'db.transaction.id': metadata.id,
    'db.transaction.isolation_level': metadata.isolationLevel,
    'db.transaction.type': metadata.type,
    'db.transaction.owner': isOwner,
    'db.transaction.journey': metadata.journeyContext,
    ...options.spanAttributes
  };

  // Execute with tracing
  return tracingService.traceSpan(
    spanName,
    async (span) => {
      try {
        // Log transaction start if appropriate
        if (isOwner && options.logging?.logEvents) {
          loggerService.log(`Starting transaction ${metadata.id} with isolation level ${metadata.isolationLevel}`);
        }
        
        // Execute the callback
        const result = await callback();

        // Add success attribute
        span.setAttribute('db.transaction.success', true);
        
        // Log transaction completion if appropriate
        if (isOwner && options.logging?.logEvents) {
          loggerService.log(`Successfully committed transaction ${metadata.id}`);
        }
        
        // Record metrics
        recordTransactionMetrics(metrics, methodName, metadata, startTime, true);

        return result;
      } catch (error) {
        // Add error attributes
        span.setAttribute('db.transaction.success', false);
        span.setAttribute('db.transaction.error', error instanceof Error ? error.message : String(error));
        span.setAttribute('db.transaction.error_type', error instanceof TransactionError ? error.constructor.name : 'UnknownError');

        // Record error
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        
        // Log transaction failure if appropriate
        if (isOwner && options.logging?.logEvents) {
          loggerService.error(
            `Transaction ${metadata.id} failed: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined
          );
        }
        
        // Record metrics
        recordTransactionMetrics(metrics, methodName, metadata, startTime, false, error);

        throw error;
      }
    },
    spanAttributes
  );
}

/**
 * Records transaction metrics if a metrics service is available
 * 
 * @param metricsService - The metrics service instance
 * @param methodName - The name of the method being executed
 * @param metadata - Transaction metadata
 * @param startTime - The start time of the transaction
 * @param success - Whether the transaction was successful
 * @param error - The error that occurred, if any
 */
function recordTransactionMetrics(
  metricsService: any,
  methodName: string,
  metadata: TransactionMetadata,
  startTime: number,
  success: boolean,
  error?: unknown
): void {
  // Skip if no metrics service is available
  if (!metricsService) {
    return;
  }
  
  try {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record transaction duration
    metricsService.recordHistogram('db.transaction.duration', duration, {
      method: methodName,
      isolation_level: metadata.isolationLevel,
      journey: metadata.journeyContext,
      success: String(success)
    });
    
    // Record transaction count
    metricsService.incrementCounter('db.transaction.count', 1, {
      method: methodName,
      isolation_level: metadata.isolationLevel,
      journey: metadata.journeyContext,
      success: String(success)
    });
    
    // Record error count if an error occurred
    if (!success && error) {
      metricsService.incrementCounter('db.transaction.error_count', 1, {
        method: methodName,
        isolation_level: metadata.isolationLevel,
        journey: metadata.journeyContext,
        error_type: error instanceof TransactionError ? error.constructor.name : 'UnknownError'
      });
    }
    
    // Record retry count if retries occurred
    if (metadata.retryCount > 0) {
      metricsService.recordHistogram('db.transaction.retry_count', metadata.retryCount, {
        method: methodName,
        isolation_level: metadata.isolationLevel,
        journey: metadata.journeyContext,
        success: String(success)
      });
    }
  } catch (metricsError) {
    // Silently ignore metrics errors to avoid affecting the transaction
    logger.debug(`Failed to record transaction metrics: ${metricsError instanceof Error ? metricsError.message : String(metricsError)}`);
  }
}

/**
 * Gets the PrismaClient instance from a service
 *
 * @param service - The service instance
 * @returns The PrismaClient instance or undefined if not found
 */
function getPrismaClientFromService(service: any): PrismaClient | undefined {
  // Check common property names for PrismaClient
  const commonPropertyNames = ['prisma', 'prismaService', 'prismaClient', 'db', 'dbClient', 'database'];

  for (const propertyName of commonPropertyNames) {
    if (service[propertyName] instanceof PrismaClient) {
      return service[propertyName];
    }
  }

  // Check all properties for PrismaClient instance
  for (const propertyName of Object.getOwnPropertyNames(service)) {
    if (service[propertyName] instanceof PrismaClient) {
      return service[propertyName];
    }
  }
  
  // Check for NestJS-specific patterns
  // In NestJS, services often have private properties with underscores or # prefix
  // that are injected via constructor
  const privateProps = Object.getOwnPropertySymbols(service);
  for (const prop of privateProps) {
    const propValue = service[prop];
    if (propValue instanceof PrismaClient) {
      return propValue;
    }
  }
  
  // Try to access private fields using reflection (works in some cases)
  try {
    // This is a bit of a hack, but it can work for accessing private fields in some cases
    const servicePrototype = Object.getPrototypeOf(service);
    const privateFields = Object.getOwnPropertyNames(servicePrototype)
      .filter(name => name.startsWith('_') || name.includes('prisma') || name.includes('db'));
    
    for (const field of privateFields) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(servicePrototype, field);
        if (descriptor && typeof descriptor.get === 'function') {
          const value = descriptor.get.call(service);
          if (value instanceof PrismaClient) {
            return value;
          }
        }
      } catch (e) {
        // Ignore errors when trying to access private fields
      }
    }
  } catch (e) {
    // Ignore errors when trying to access private fields
  }

  return undefined;
}

/**
 * Gets the TracingService instance from a service
 *
 * @param service - The service instance
 * @returns The TracingService instance or undefined if not found
 */
function getTracingServiceFromService(service: any): TracingService | undefined {
  // Check common property names for TracingService
  const commonPropertyNames = ['tracingService', 'tracing'];

  for (const propertyName of commonPropertyNames) {
    if (service[propertyName] instanceof TracingService) {
      return service[propertyName];
    }
  }

  // Check if the service itself is a TracingService
  if (service instanceof TracingService) {
    return service;
  }

  return undefined;
}

/**
 * Gets the LoggerService instance from a service
 *
 * @param service - The service instance
 * @returns The LoggerService instance or undefined if not found
 */
function getLoggerServiceFromService(service: any): LoggerService | undefined {
  // Check common property names for LoggerService
  const commonPropertyNames = ['loggerService', 'logger'];

  for (const propertyName of commonPropertyNames) {
    if (service[propertyName] instanceof LoggerService) {
      return service[propertyName];
    }
  }

  // Check if the service itself is a LoggerService
  if (service instanceof LoggerService) {
    return service;
  }

  return undefined;
}

/**
 * Gets the MetricsService instance from a service
 *
 * @param service - The service instance
 * @returns The MetricsService instance or undefined if not found
 */
function getMetricsServiceFromService(service: any): any {
  // Skip if metrics service is not available
  if (!metricsService) {
    return undefined;
  }
  
  // Check common property names for MetricsService
  const commonPropertyNames = ['metricsService', 'metrics'];

  for (const propertyName of commonPropertyNames) {
    if (service[propertyName] instanceof metricsService) {
      return service[propertyName];
    }
  }

  // Check if the service itself is a MetricsService
  if (service instanceof metricsService) {
    return service;
  }

  return undefined;
}

/**
 * Gets the journey context from a service
 *
 * @param service - The service instance
 * @returns The journey context or undefined if not found
 */
function getJourneyContextFromService(service: any): string | undefined {
  // Check common property names for journey context
  const commonPropertyNames = ['journeyContext', 'journey', 'journeyType'];

  for (const propertyName of commonPropertyNames) {
    if (typeof service[propertyName] === 'string') {
      return service[propertyName];
    }
  }

  // Check service name for journey context
  const serviceName = service.constructor?.name;
  if (serviceName) {
    if (serviceName.includes('Health')) {
      return 'health';
    } else if (serviceName.includes('Care')) {
      return 'care';
    } else if (serviceName.includes('Plan')) {
      return 'plan';
    }
  }

  return undefined;
}

/**
 * Gets the entity name from a service
 *
 * @param service - The service instance
 * @returns The entity name or undefined if not found
 */
function getEntityFromService(service: any): string | undefined {
  // Check common property names for entity
  const commonPropertyNames = ['entityName', 'entity', 'model', 'modelName'];

  for (const propertyName of commonPropertyNames) {
    if (typeof service[propertyName] === 'string') {
      return service[propertyName];
    }
  }

  // Try to infer from service name
  const serviceName = service.constructor?.name;
  if (serviceName) {
    // Remove 'Service' suffix if present
    if (serviceName.endsWith('Service')) {
      return serviceName.slice(0, -7);
    }
    return serviceName;
  }

  return undefined;
}

/**
 * Gets the feature name from a service
 *
 * @param service - The service instance
 * @returns The feature name or undefined if not found
 */
function getFeatureFromService(service: any): string | undefined {
  // Check common property names for feature
  const commonPropertyNames = ['featureName', 'feature', 'module', 'moduleName'];

  for (const propertyName of commonPropertyNames) {
    if (typeof service[propertyName] === 'string') {
      return service[propertyName];
    }
  }

  // Try to infer from service name
  const serviceName = service.constructor?.name;
  if (serviceName) {
    // Extract feature from service name (e.g., UserAuthService -> auth)
    const matches = serviceName.match(/([A-Z][a-z]+)/g);
    if (matches && matches.length > 1) {
      return matches[1].toLowerCase();
    }
  }

  return undefined;
}

/**
 * Generates a unique transaction ID
 *
 * @param prefix - Optional prefix for the transaction ID
 * @returns Unique transaction ID
 */
function generateTransactionId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return prefix ? `tx-${prefix}-${timestamp}-${random}` : `tx-${timestamp}-${random}`;
}

/**
 * Gets the active transaction from a service instance
 *
 * @param target - The service instance
 * @returns The active transaction context or undefined if not found
 */
function getActiveTransaction(target: any): TransactionContext | undefined {
  return target[ACTIVE_TRANSACTION_KEY];
}

/**
 * Sets the active transaction on a service instance
 *
 * @param target - The service instance
 * @param context - The transaction context
 */
function setActiveTransaction(target: any, context: TransactionContext): void {
  target[ACTIVE_TRANSACTION_KEY] = context;
}

/**
 * Clears the active transaction from a service instance
 *
 * @param target - The service instance
 */
function clearActiveTransaction(target: any): void {
  delete target[ACTIVE_TRANSACTION_KEY];
}

/**
 * Utility function to check if a method is currently executing within a transaction
 * This can be used in service methods to determine if a transaction is already active
 * 
 * @param target - The service instance
 * @returns True if a transaction is active, false otherwise
 * 
 * @example
 * async createUser(data: CreateUserDto): Promise<User> {
 *   if (!isInTransaction(this)) {
 *     // Wrap in transaction if not already in one
 *     return this.createUserWithTransaction(data);
 *   }
 *   
 *   // Execute directly if already in a transaction
 *   const user = await this.prisma.user.create({ data });
 *   await this.prisma.profile.create({ data: { userId: user.id } });
 *   return user;
 * }
 * 
 * @Transactional()
 * async createUserWithTransaction(data: CreateUserDto): Promise<User> {
 *   const user = await this.prisma.user.create({ data });
 *   await this.prisma.profile.create({ data: { userId: user.id } });
 *   return user;
 * }
 */
export function isInTransaction(target: any): boolean {
  return !!getActiveTransaction(target);
}

/**
 * Utility function to get the current transaction client if one is active
 * This can be used to access the transaction client directly in service methods
 * 
 * @param target - The service instance
 * @returns The active transaction client or undefined if no transaction is active
 * 
 * @example
 * async updateUserWithOptimisticLocking(id: number, data: UpdateUserDto, version: number): Promise<User> {
 *   const tx = getCurrentTransactionClient(this) || this.prisma;
 *   
 *   const user = await tx.user.findUnique({ where: { id } });
 *   if (!user || user.version !== version) {
 *     throw new OptimisticLockingError('User was updated by another transaction');
 *   }
 *   
 *   return tx.user.update({
 *     where: { id },
 *     data: { ...data, version: version + 1 }
 *   });
 * }
 */
export function getCurrentTransactionClient(target: any): PrismaClient | undefined {
  const activeTransaction = getActiveTransaction(target);
  return activeTransaction?.client;
}

/**
 * Utility function to get the current transaction metadata if one is active
 * This can be used to access transaction information in service methods
 * 
 * @param target - The service instance
 * @returns The active transaction metadata or undefined if no transaction is active
 * 
 * @example
 * async logTransactionInfo(): Promise<void> {
 *   const metadata = getCurrentTransactionMetadata(this);
 *   if (metadata) {
 *     this.logger.log(`Current transaction: ${metadata.id}, isolation: ${metadata.isolationLevel}`);
 *   } else {
 *     this.logger.log('Not in a transaction');
 *   }
 * }
 */
export function getCurrentTransactionMetadata(target: any): TransactionMetadata | undefined {
  const activeTransaction = getActiveTransaction(target);
  return activeTransaction?.metadata;
}

/**
 * Utility function to execute a callback within a transaction programmatically
 * This can be used when you need to dynamically decide whether to use a transaction
 * 
 * @param target - The service instance that contains the PrismaClient
 * @param callback - The function to execute within the transaction
 * @param options - Transaction options
 * @returns The result of the callback function
 * 
 * @example
 * async importData(data: ImportDataDto, useTransaction: boolean): Promise<void> {
 *   if (useTransaction) {
 *     // Execute with transaction for all-or-nothing behavior
 *     await executeWithTransaction(this, async () => {
 *       for (const item of data.items) {
 *         await this.processItem(item);
 *       }
 *     }, { isolationLevel: TransactionIsolationLevel.SERIALIZABLE });
 *   } else {
 *     // Execute without transaction for partial imports
 *     for (const item of data.items) {
 *       try {
 *         await this.processItem(item);
 *       } catch (error) {
 *         this.logger.error(`Failed to process item ${item.id}`, error);
 *       }
 *     }
 *   }
 * }
 */
export async function executeWithTransaction<T>(
  target: any,
  callback: (client: PrismaClient) => Promise<T>,
  options: TransactionalOptions = {}
): Promise<T> {
  // Get the PrismaClient instance from the service
  const prismaClient = getPrismaClientFromService(target);
  if (!prismaClient) {
    throw new Error('No PrismaClient found in service for executeWithTransaction');
  }
  
  // Merge options with defaults
  const mergedOptions = { ...DEFAULT_TRANSACTIONAL_OPTIONS, ...options };
  
  // If operationType is provided, override isolationLevel
  if (mergedOptions.operationType && !options.isolationLevel) {
    mergedOptions.isolationLevel = getIsolationLevelForOperation(mergedOptions.operationType);
  }
  
  // Check if there's already an active transaction
  const activeTransaction = getActiveTransaction(target);
  if (activeTransaction && mergedOptions.useExisting && !mergedOptions.requiresNew) {
    // Use the existing transaction
    return callback(activeTransaction.client);
  }
  
  // Generate a unique transaction ID
  const transactionId = generateTransactionId('manual');
  
  // Create transaction metadata
  const metadata: TransactionMetadata = {
    id: transactionId,
    createdAt: new Date(),
    state: TransactionState.CREATED,
    type: mergedOptions.type,
    isolationLevel: mergedOptions.isolationLevel,
    journeyContext: mergedOptions.journeyContext || getJourneyContextFromService(target) || 'default',
    retryCount: 0
  };
  
  // Create operation context for error handling
  const operationContext: DatabaseOperationContext = {
    operation: 'manual_transaction',
    entity: getEntityFromService(target) || 'unknown',
    transactionId,
    isolationLevel: mergedOptions.isolationLevel
  };
  
  // Create journey context for error handling
  const journeyContext: JourneyContext = {
    journey: metadata.journeyContext,
    feature: getFeatureFromService(target) || 'database'
  };
  
  try {
    // Execute the transaction
    return await executeInTransaction(
      prismaClient,
      async (tx) => {
        // Store the transaction context
        const transactionContext: TransactionContext = {
          client: tx as unknown as PrismaClient,
          metadata,
          isOwner: true
        };
        setActiveTransaction(target, transactionContext);
        
        try {
          // Execute the callback
          return await callback(tx as unknown as PrismaClient);
        } finally {
          // Clear the transaction context if we're the owner
          if (getActiveTransaction(target)?.isOwner) {
            clearActiveTransaction(target);
          }
        }
      },
      {
        isolationLevel: mergedOptions.isolationLevel,
        timeout: mergedOptions.timeout,
        retry: mergedOptions.retry,
        logging: mergedOptions.logging,
        savepoint: mergedOptions.savepoint,
        distributed: mergedOptions.distributed,
        type: mergedOptions.type,
        journeyContext: metadata.journeyContext
      }
    );
  } catch (error) {
    // Transform and rethrow the error
    throw transformTransactionError(error, journeyContext, operationContext);
  }
}