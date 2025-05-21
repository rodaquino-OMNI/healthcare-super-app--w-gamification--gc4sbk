import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { JourneyType } from '@austa/interfaces/common';
import { TransactionException } from '@austa/database/errors';
import { 
  ITransactionHandler, 
  ITransactionOptions, 
  IDatabaseErrorContext 
} from './interfaces';
import { 
  TIMEOUTS, 
  RETRY, 
  ERROR_CODES, 
  LOGGING, 
  DatabaseEnvironment 
} from './constants';
import { DatabaseErrorHandlerService } from './error-handler.service';
import { PrismaService } from './prisma.service';

/**
 * Service that provides transactional database operations across multiple services
 * in the gamification engine. Ensures data consistency when operations span multiple
 * tables or services, managing transaction boundaries, rollbacks, and commits.
 */
@Injectable()
export class TransactionService implements ITransactionHandler, OnModuleInit {
  private readonly logger = new Logger(TransactionService.name);
  private readonly environment: DatabaseEnvironment;
  private readonly defaultTransactionTimeout: number;
  private readonly enableTransactionLogging: boolean;
  private readonly defaultMaxRetries: number;
  private readonly activeTransactions: Map<string, { 
    startTime: number;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly errorHandler: DatabaseErrorHandlerService,
    private readonly configService: ConfigService
  ) {
    this.environment = this.configService.get<DatabaseEnvironment>(
      'DATABASE_ENVIRONMENT', 
      DatabaseEnvironment.DEVELOPMENT
    );
    
    // Get environment-specific timeout settings or fall back to defaults
    const envTimeoutSettings = TIMEOUTS.ENVIRONMENT[this.environment] || {};
    this.defaultTransactionTimeout = envTimeoutSettings.TRANSACTION_TIMEOUT_MS ?? TIMEOUTS.TRANSACTION_TIMEOUT_MS;
    
    // Get environment-specific logging settings or fall back to defaults
    const envLoggingSettings = LOGGING.ENVIRONMENT[this.environment] || {};
    this.enableTransactionLogging = envLoggingSettings.ENABLE_TRANSACTION_LOGGING ?? LOGGING.ENABLE_TRANSACTION_LOGGING;
    
    // Get environment-specific retry settings or fall back to defaults
    const envRetrySettings = RETRY.ENVIRONMENT[this.environment] || {};
    this.defaultMaxRetries = envRetrySettings.MAX_RETRY_ATTEMPTS ?? RETRY.MAX_RETRY_ATTEMPTS;
  }

  /**
   * Initializes the service when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    // Set up periodic cleanup of stale transaction tracking
    setInterval(() => this.cleanupStaleTransactions(), 60000); // Run every minute
  }

  /**
   * Executes a function within a transaction.
   * 
   * @param fn Function to execute within the transaction
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  async executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T> {
    const transactionId = this.generateTransactionId();
    const timeout = options?.timeout ?? this.defaultTransactionTimeout;
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const isolationLevel = options?.isolationLevel;
    const useOptimisticLocking = options?.useOptimisticLocking ?? false;
    
    // Set up transaction timeout tracking
    const startTime = Date.now();
    let timeoutHandler: NodeJS.Timeout | null = null;
    
    if (this.enableTransactionLogging) {
      this.logger.log(
        `Starting transaction ${transactionId} with timeout ${timeout}ms, ` +
        `isolation level ${isolationLevel || 'default'}, ` +
        `optimistic locking ${useOptimisticLocking}`
      );
    }
    
    // Track active transaction
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandler = setTimeout(() => {
        this.activeTransactions.delete(transactionId);
        reject(new TransactionException(
          `Transaction ${transactionId} timed out after ${timeout}ms`,
          ERROR_CODES.TRANSACTION_TIMEOUT,
          { 
            transactionId,
            startTime,
            timeout,
            elapsedMs: Date.now() - startTime
          }
        ));
      }, timeout);
      
      this.activeTransactions.set(transactionId, {
        startTime,
        timeout: timeoutHandler
      });
    });
    
    let retryAttempt = 0;
    let lastError: Error | null = null;
    
    // Retry loop for transaction execution
    while (retryAttempt <= maxRetries) {
      try {
        // Race the transaction execution against the timeout
        const result = await Promise.race([
          this.executeTransactionWithRetry(fn, transactionId, isolationLevel, useOptimisticLocking, retryAttempt),
          timeoutPromise
        ]);
        
        // Clean up timeout and tracking
        if (timeoutHandler) {
          clearTimeout(timeoutHandler);
        }
        this.activeTransactions.delete(transactionId);
        
        if (this.enableTransactionLogging) {
          const duration = Date.now() - startTime;
          this.logger.log(
            `Transaction ${transactionId} completed successfully in ${duration}ms`
          );
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if the error is retryable
        const isRetryable = this.errorHandler.isRetryableError(error);
        
        if (!isRetryable || retryAttempt >= maxRetries) {
          // Clean up timeout and tracking
          if (timeoutHandler) {
            clearTimeout(timeoutHandler);
          }
          this.activeTransactions.delete(transactionId);
          
          // Log transaction failure
          if (this.enableTransactionLogging) {
            const duration = Date.now() - startTime;
            this.logger.error(
              `Transaction ${transactionId} failed after ${duration}ms with error: ${error.message}`,
              error.stack
            );
          }
          
          // Transform and throw the error
          const context: IDatabaseErrorContext = {
            operation: 'TRANSACTION',
            inTransaction: true,
            retryAttempt,
            metadata: {
              transactionId,
              startTime,
              elapsedMs: Date.now() - startTime,
              isolationLevel,
              useOptimisticLocking
            }
          };
          
          throw this.errorHandler.handleError(error, context);
        }
        
        // Calculate retry delay using the error handler's retry strategy
        const retryStrategy = this.errorHandler.createRetryStrategy(error, {
          operation: 'TRANSACTION',
          inTransaction: true,
          retryAttempt,
          metadata: { transactionId }
        });
        
        const delayMs = retryStrategy.calculateDelay(retryAttempt);
        
        if (this.enableTransactionLogging) {
          this.logger.warn(
            `Transaction ${transactionId} failed on attempt ${retryAttempt + 1}/${maxRetries + 1}. ` +
            `Retrying in ${delayMs}ms. Error: ${error.message}`
          );
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retryAttempt++;
      }
    }
    
    // This should never be reached due to the error handling above, but TypeScript needs it
    throw lastError || new TransactionException(
      `Transaction ${transactionId} failed after ${maxRetries} retries`,
      ERROR_CODES.TRANSACTION_FAILED
    );
  }

  /**
   * Executes a function within a nested transaction.
   * 
   * @param fn Function to execute within the nested transaction
   * @param parent Parent transaction client
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  async executeNestedTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    parent: Prisma.TransactionClient,
    options?: ITransactionOptions
  ): Promise<T> {
    const nestedTransactionId = this.generateTransactionId('nested');
    const startTime = Date.now();
    
    if (this.enableTransactionLogging) {
      this.logger.log(`Starting nested transaction ${nestedTransactionId}`);
    }
    
    try {
      // For Prisma, we can't create actual nested transactions, so we use savepoints
      // However, the Prisma client doesn't expose savepoint functionality directly
      // So we'll just execute the function with the parent transaction client
      
      // In a real implementation with a database that supports savepoints,
      // we would create a savepoint, execute the function, and release or
      // rollback to the savepoint based on success or failure
      
      const result = await fn(parent);
      
      if (this.enableTransactionLogging) {
        const duration = Date.now() - startTime;
        this.logger.log(
          `Nested transaction ${nestedTransactionId} completed successfully in ${duration}ms`
        );
      }
      
      return result;
    } catch (error) {
      if (this.enableTransactionLogging) {
        const duration = Date.now() - startTime;
        this.logger.error(
          `Nested transaction ${nestedTransactionId} failed after ${duration}ms with error: ${error.message}`,
          error.stack
        );
      }
      
      // Transform and throw the error
      const context: IDatabaseErrorContext = {
        operation: 'NESTED_TRANSACTION',
        inTransaction: true,
        metadata: {
          nestedTransactionId,
          startTime,
          elapsedMs: Date.now() - startTime
        }
      };
      
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Executes a transaction with the Prisma client.
   * 
   * @param fn Function to execute within the transaction
   * @param transactionId ID of the transaction for logging
   * @param isolationLevel Isolation level for the transaction
   * @param useOptimisticLocking Whether to use optimistic locking
   * @param retryAttempt Current retry attempt number
   * @returns Promise resolving to the result of the function
   */
  private async executeTransactionWithRetry<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    transactionId: string,
    isolationLevel?: Prisma.TransactionIsolationLevel,
    useOptimisticLocking: boolean = false,
    retryAttempt: number = 0
  ): Promise<T> {
    // If optimistic locking is enabled, wrap the function to implement it
    const transactionFn = useOptimisticLocking
      ? this.wrapWithOptimisticLocking(fn, transactionId, retryAttempt)
      : fn;
    
    // Execute the transaction with the Prisma client
    return this.prismaService.$transaction(
      transactionFn,
      {
        isolationLevel,
        maxWait: 5000, // 5 seconds max wait for transaction to start
        timeout: this.defaultTransactionTimeout // This is the Prisma-level timeout
      }
    );
  }

  /**
   * Wraps a transaction function with optimistic locking logic.
   * 
   * @param fn Original transaction function
   * @param transactionId ID of the transaction for logging
   * @param retryAttempt Current retry attempt number
   * @returns Wrapped function with optimistic locking
   */
  private wrapWithOptimisticLocking<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    transactionId: string,
    retryAttempt: number
  ): (prisma: Prisma.TransactionClient) => Promise<T> {
    return async (prisma: Prisma.TransactionClient) => {
      try {
        // Execute the original function
        return await fn(prisma);
      } catch (error) {
        // Check if this is a version conflict (optimistic locking failure)
        if (this.isVersionConflict(error)) {
          if (this.enableTransactionLogging) {
            this.logger.warn(
              `Transaction ${transactionId} encountered version conflict on attempt ${retryAttempt + 1}. ` +
              `This indicates a concurrent modification.`
            );
          }
          
          // Transform to a specific error type for optimistic locking failures
          throw new TransactionException(
            `Optimistic locking failure: The record was modified by another transaction`,
            ERROR_CODES.TRANSACTION_CONFLICT,
            { 
              transactionId,
              retryAttempt,
              errorType: 'OPTIMISTIC_LOCK_FAILURE',
              originalError: error
            }
          );
        }
        
        // For other errors, just rethrow
        throw error;
      }
    };
  }

  /**
   * Checks if an error is a version conflict (optimistic locking failure).
   * 
   * @param error The error to check
   * @returns Whether the error is a version conflict
   */
  private isVersionConflict(error: any): boolean {
    // Check for Prisma unique constraint violations on version fields
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' && // Unique constraint violation
      error.meta?.target && 
      Array.isArray(error.meta.target)
    ) {
      // Check if the constraint violation involves a version field
      const targetFields = error.meta.target as string[];
      return targetFields.some(field => 
        field === 'version' || 
        field.endsWith('_version') || 
        field === 'versionId'
      );
    }
    
    // Check error message for version conflict indicators
    if (error.message && typeof error.message === 'string') {
      const message = error.message.toLowerCase();
      return message.includes('version') && 
        (message.includes('conflict') || 
         message.includes('mismatch') || 
         message.includes('concurrent') ||
         message.includes('stale'));
    }
    
    return false;
  }

  /**
   * Generates a unique transaction ID.
   * 
   * @param prefix Optional prefix for the transaction ID
   * @returns Unique transaction ID
   */
  private generateTransactionId(prefix: string = 'txn'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Cleans up stale transaction tracking.
   */
  private cleanupStaleTransactions(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [id, { startTime, timeout }] of this.activeTransactions.entries()) {
      // Check if transaction has been running for more than twice the default timeout
      if (now - startTime > this.defaultTransactionTimeout * 2) {
        clearTimeout(timeout);
        this.activeTransactions.delete(id);
        cleanedCount++;
        
        this.logger.warn(
          `Cleaned up stale transaction tracking for ${id} after ` +
          `${Math.floor((now - startTime) / 1000)}s`
        );
      }
    }
    
    if (cleanedCount > 0 && this.enableTransactionLogging) {
      this.logger.log(`Cleaned up ${cleanedCount} stale transaction tracking entries`);
    }
  }

  /**
   * Gets the count of currently active transactions.
   * 
   * @returns Number of active transactions
   */
  getActiveTransactionCount(): number {
    return this.activeTransactions.size;
  }

  /**
   * Gets details about currently active transactions.
   * 
   * @returns Map of transaction IDs to their details
   */
  getActiveTransactionDetails(): Map<string, { startTime: number, duration: number }> {
    const now = Date.now();
    const details = new Map<string, { startTime: number, duration: number }>();
    
    for (const [id, { startTime }] of this.activeTransactions.entries()) {
      details.set(id, {
        startTime,
        duration: now - startTime
      });
    }
    
    return details;
  }
}