import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JourneyType } from '@austa/interfaces/common';

import { PrismaService } from './prisma.service';
import { DatabaseErrorHandlerService } from './error-handler.service';
import { ITransactionHandler, ITransactionOptions } from './interfaces';
import { 
  OPERATION_TIMEOUTS, 
  TRANSACTION_ISOLATION, 
  RETRY_STRATEGY 
} from './constants';
import { TransactionException } from '../exceptions/database.exception';

/**
 * Service that provides transactional database operations across multiple services in the gamification engine.
 * Ensures data consistency when operations span multiple tables or services, managing transaction boundaries,
 * rollbacks, and commits.
 */
@Injectable()
export class TransactionService implements ITransactionHandler {
  private readonly logger = new Logger(TransactionService.name);
  private readonly transactionMap = new Map<string, Prisma.TransactionClient>();
  private readonly savepointMap = new Map<string, Set<string>>();
  private transactionCounter = 0;

  /**
   * Creates a new instance of the TransactionService
   * 
   * @param prismaService - Service for database access
   * @param errorHandler - Service for handling database errors
   */
  constructor(
    private readonly prismaService: PrismaService,
    private readonly errorHandler: DatabaseErrorHandlerService,
  ) {}

  /**
   * Start a new transaction with the specified options.
   * 
   * @param options - Configuration options for the transaction
   * @returns Promise that resolves to a transaction client
   */
  async startTransaction(options: ITransactionOptions = {}): Promise<Prisma.TransactionClient> {
    const transactionId = this.generateTransactionId();
    const isolationLevel = options.isolationLevel || TRANSACTION_ISOLATION.DEFAULT_WRITE_ISOLATION_LEVEL;
    const timeout = options.timeout || OPERATION_TIMEOUTS.TRANSACTION_TIMEOUT_MS;
    const context = options.context || {};

    this.logger.debug(`Starting transaction ${transactionId}`, {
      transactionId,
      isolationLevel,
      timeout,
      ...context,
    });

    try {
      // Create a transaction with timeout
      const transaction = await Promise.race([
        this.prismaService.$transaction({
          isolationLevel,
          maxWait: timeout,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new TransactionException(
              `Transaction ${transactionId} timed out after ${timeout}ms`,
              { transactionId, timeout, ...context },
              new Error('Transaction timeout'),
              true, // Transient
              true  // Recoverable
            ));
          }, timeout);
        }),
      ]) as Prisma.TransactionClient;

      // Store the transaction
      this.transactionMap.set(transactionId, transaction);
      this.savepointMap.set(transactionId, new Set<string>());

      this.logger.debug(`Transaction ${transactionId} started successfully`, {
        transactionId,
        isolationLevel,
        ...context,
      });

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to start transaction ${transactionId}`, {
        transactionId,
        isolationLevel,
        error: error.message,
        stack: error.stack,
        ...context,
      });

      throw this.errorHandler.handleError(error, {
        operation: 'startTransaction',
        transactionId,
        isolationLevel,
        ...context,
      });
    }
  }

  /**
   * Commit the current transaction.
   * 
   * @param client - The transaction client to commit
   * @returns Promise that resolves when the commit is complete
   */
  async commitTransaction(client: Prisma.TransactionClient): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    
    if (!transactionId) {
      throw new TransactionException(
        'Cannot commit transaction: transaction not found',
        { operation: 'commitTransaction' },
        new Error('Transaction not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    this.logger.debug(`Committing transaction ${transactionId}`);

    try {
      // Commit is handled automatically when the transaction completes
      // We just need to clean up our tracking
      this.transactionMap.delete(transactionId);
      this.savepointMap.delete(transactionId);

      this.logger.debug(`Transaction ${transactionId} committed successfully`);
    } catch (error) {
      this.logger.error(`Failed to commit transaction ${transactionId}`, {
        transactionId,
        error: error.message,
        stack: error.stack,
      });

      throw this.errorHandler.handleError(error, {
        operation: 'commitTransaction',
        transactionId,
      });
    }
  }

  /**
   * Roll back the current transaction.
   * 
   * @param client - The transaction client to roll back
   * @returns Promise that resolves when the rollback is complete
   */
  async rollbackTransaction(client: Prisma.TransactionClient): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    
    if (!transactionId) {
      throw new TransactionException(
        'Cannot rollback transaction: transaction not found',
        { operation: 'rollbackTransaction' },
        new Error('Transaction not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    this.logger.debug(`Rolling back transaction ${transactionId}`);

    try {
      // Rollback is handled by throwing an error in the transaction
      // We just need to clean up our tracking
      this.transactionMap.delete(transactionId);
      this.savepointMap.delete(transactionId);

      this.logger.debug(`Transaction ${transactionId} rolled back successfully`);
    } catch (error) {
      this.logger.error(`Failed to rollback transaction ${transactionId}`, {
        transactionId,
        error: error.message,
        stack: error.stack,
      });

      throw this.errorHandler.handleError(error, {
        operation: 'rollbackTransaction',
        transactionId,
      });
    }
  }

  /**
   * Execute a function within a transaction.
   * Automatically handles commit and rollback based on function success or failure.
   * 
   * @param fn - The function to execute within the transaction
   * @param options - Configuration options for the transaction
   * @returns Promise that resolves to the result of the function
   */
  async executeInTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options: ITransactionOptions = {}
  ): Promise<T> {
    const context = options.context || {};
    const maxRetries = options.maxRetries || RETRY_STRATEGY.DEFAULT_MAX_RETRIES;
    let retryCount = 0;
    let lastError: Error | null = null;

    // Retry loop for transient errors
    while (retryCount <= maxRetries) {
      let transaction: Prisma.TransactionClient | null = null;
      let transactionId: string | null = null;

      try {
        // Start a new transaction
        transaction = await this.startTransaction(options);
        transactionId = this.getTransactionIdFromClient(transaction);

        // Execute the function within the transaction
        const result = await fn(transaction);

        // Commit the transaction if the function succeeds
        await this.commitTransaction(transaction);

        this.logger.debug(`Transaction ${transactionId} executed successfully`, {
          transactionId,
          retryCount,
          ...context,
        });

        return result;
      } catch (error) {
        lastError = error;

        // Log the error
        this.logger.error(`Error in transaction ${transactionId}`, {
          transactionId,
          error: error.message,
          stack: error.stack,
          retryCount,
          ...context,
        });

        // Rollback the transaction if it exists
        if (transaction && transactionId) {
          try {
            await this.rollbackTransaction(transaction);
          } catch (rollbackError) {
            this.logger.error(`Failed to rollback transaction ${transactionId}`, {
              transactionId,
              error: rollbackError.message,
              stack: rollbackError.stack,
              originalError: error.message,
              ...context,
            });
          }
        }

        // Check if we should retry
        const isTransient = this.errorHandler.isTransientError(error);
        if (isTransient && retryCount < maxRetries) {
          retryCount++;
          const retryStrategy = this.errorHandler.getRetryStrategy(error);
          const delay = retryStrategy.calculateDelay(retryCount);

          this.logger.warn(`Retrying transaction after error (attempt ${retryCount}/${maxRetries})`, {
            transactionId,
            error: error.message,
            retryCount,
            delay,
            ...context,
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // If not retrying, transform and throw the error
        throw this.errorHandler.handleError(error, {
          operation: 'executeInTransaction',
          transactionId,
          retryCount,
          ...context,
        });
      }
    }

    // If we've exhausted retries, throw the last error
    throw this.errorHandler.handleError(lastError!, {
      operation: 'executeInTransaction',
      retryCount,
      maxRetries,
      ...context,
    });
  }

  /**
   * Create a savepoint within the current transaction.
   * Allows for partial rollback within a transaction.
   * 
   * @param client - The transaction client
   * @param name - The name of the savepoint
   * @returns Promise that resolves when the savepoint is created
   */
  async createSavepoint(client: Prisma.TransactionClient, name: string): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    
    if (!transactionId) {
      throw new TransactionException(
        'Cannot create savepoint: transaction not found',
        { operation: 'createSavepoint', savepointName: name },
        new Error('Transaction not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    // Validate savepoint name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new TransactionException(
        'Invalid savepoint name',
        { operation: 'createSavepoint', savepointName: name, transactionId },
        new Error('Invalid savepoint name'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    try {
      this.logger.debug(`Creating savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
      });

      // Create the savepoint using raw SQL
      await client.$executeRawUnsafe(`SAVEPOINT ${this.escapeSavepointName(name)}`);

      // Track the savepoint
      const savepoints = this.savepointMap.get(transactionId);
      if (savepoints) {
        savepoints.add(name);
      }

      this.logger.debug(`Savepoint ${name} created successfully in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
      });
    } catch (error) {
      this.logger.error(`Failed to create savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
        error: error.message,
        stack: error.stack,
      });

      throw this.errorHandler.handleError(error, {
        operation: 'createSavepoint',
        transactionId,
        savepointName: name,
      });
    }
  }

  /**
   * Roll back to a savepoint within the current transaction.
   * 
   * @param client - The transaction client
   * @param name - The name of the savepoint to roll back to
   * @returns Promise that resolves when the rollback to savepoint is complete
   */
  async rollbackToSavepoint(client: Prisma.TransactionClient, name: string): Promise<void> {
    const transactionId = this.getTransactionIdFromClient(client);
    
    if (!transactionId) {
      throw new TransactionException(
        'Cannot rollback to savepoint: transaction not found',
        { operation: 'rollbackToSavepoint', savepointName: name },
        new Error('Transaction not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    // Validate savepoint name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new TransactionException(
        'Invalid savepoint name',
        { operation: 'rollbackToSavepoint', savepointName: name, transactionId },
        new Error('Invalid savepoint name'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    // Check if savepoint exists
    const savepoints = this.savepointMap.get(transactionId);
    if (!savepoints || !savepoints.has(name)) {
      throw new TransactionException(
        `Savepoint ${name} not found in transaction ${transactionId}`,
        { operation: 'rollbackToSavepoint', savepointName: name, transactionId },
        new Error('Savepoint not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    try {
      this.logger.debug(`Rolling back to savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
      });

      // Rollback to the savepoint using raw SQL
      await client.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${this.escapeSavepointName(name)}`);

      this.logger.debug(`Rolled back to savepoint ${name} successfully in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
      });
    } catch (error) {
      this.logger.error(`Failed to rollback to savepoint ${name} in transaction ${transactionId}`, {
        transactionId,
        savepointName: name,
        error: error.message,
        stack: error.stack,
      });

      throw this.errorHandler.handleError(error, {
        operation: 'rollbackToSavepoint',
        transactionId,
        savepointName: name,
      });
    }
  }

  /**
   * Execute a function within a transaction with savepoint support.
   * Creates a savepoint before executing the function and rolls back to it if the function fails.
   * 
   * @param client - The transaction client
   * @param name - The name of the savepoint
   * @param fn - The function to execute
   * @returns Promise that resolves to the result of the function
   */
  async executeWithSavepoint<T>(
    client: Prisma.TransactionClient,
    name: string,
    fn: (client: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const transactionId = this.getTransactionIdFromClient(client);
    
    if (!transactionId) {
      throw new TransactionException(
        'Cannot execute with savepoint: transaction not found',
        { operation: 'executeWithSavepoint', savepointName: name },
        new Error('Transaction not found'),
        false, // Not transient
        false  // Not recoverable
      );
    }

    // Create a savepoint
    await this.createSavepoint(client, name);

    try {
      // Execute the function
      const result = await fn(client);
      return result;
    } catch (error) {
      this.logger.warn(`Error in savepoint ${name}, rolling back`, {
        transactionId,
        savepointName: name,
        error: error.message,
      });

      // Rollback to the savepoint
      await this.rollbackToSavepoint(client, name);

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Execute a function within a transaction with journey-specific configuration.
   * 
   * @param journeyType - The type of journey
   * @param fn - The function to execute within the transaction
   * @param options - Additional transaction options
   * @returns Promise that resolves to the result of the function
   */
  async executeForJourney<T>(
    journeyType: JourneyType,
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options: Omit<ITransactionOptions, 'isolationLevel'> = {}
  ): Promise<T> {
    // Get journey-specific isolation level
    const isolationLevel = TRANSACTION_ISOLATION.JOURNEY_ISOLATION_LEVELS[journeyType] || 
                          TRANSACTION_ISOLATION.DEFAULT_WRITE_ISOLATION_LEVEL;
    
    // Get journey-specific timeout
    const timeout = OPERATION_TIMEOUTS.JOURNEY_TIMEOUTS[journeyType] || 
                   OPERATION_TIMEOUTS.TRANSACTION_TIMEOUT_MS;
    
    // Get journey-specific max retries
    const maxRetries = RETRY_STRATEGY.JOURNEY_RETRIES[journeyType] || 
                      RETRY_STRATEGY.DEFAULT_MAX_RETRIES;

    // Merge with provided options
    const journeyOptions: ITransactionOptions = {
      ...options,
      isolationLevel,
      timeout,
      maxRetries,
      context: {
        journeyType,
        ...(options.context || {}),
      },
    };

    return this.executeInTransaction(fn, journeyOptions);
  }

  /**
   * Execute a function within a transaction optimized for read operations.
   * Uses a lower isolation level for better performance.
   * 
   * @param fn - The function to execute within the transaction
   * @param options - Additional transaction options
   * @returns Promise that resolves to the result of the function
   */
  async executeReadTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options: Omit<ITransactionOptions, 'isolationLevel'> = {}
  ): Promise<T> {
    const readOptions: ITransactionOptions = {
      ...options,
      isolationLevel: TRANSACTION_ISOLATION.DEFAULT_READ_ISOLATION_LEVEL,
      context: {
        operationType: 'read',
        ...(options.context || {}),
      },
    };

    return this.executeInTransaction(fn, readOptions);
  }

  /**
   * Execute a function within a transaction optimized for write operations.
   * Uses a higher isolation level for better data consistency.
   * 
   * @param fn - The function to execute within the transaction
   * @param options - Additional transaction options
   * @returns Promise that resolves to the result of the function
   */
  async executeWriteTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options: Omit<ITransactionOptions, 'isolationLevel'> = {}
  ): Promise<T> {
    const writeOptions: ITransactionOptions = {
      ...options,
      isolationLevel: TRANSACTION_ISOLATION.DEFAULT_WRITE_ISOLATION_LEVEL,
      context: {
        operationType: 'write',
        ...(options.context || {}),
      },
    };

    return this.executeInTransaction(fn, writeOptions);
  }

  /**
   * Execute a function within a transaction with the highest isolation level.
   * Use for operations requiring the strongest consistency guarantees.
   * 
   * @param fn - The function to execute within the transaction
   * @param options - Additional transaction options
   * @returns Promise that resolves to the result of the function
   */
  async executeSerializableTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options: Omit<ITransactionOptions, 'isolationLevel'> = {}
  ): Promise<T> {
    const serializableOptions: ITransactionOptions = {
      ...options,
      isolationLevel: TRANSACTION_ISOLATION.HIGH_CONSISTENCY_ISOLATION_LEVEL,
      context: {
        operationType: 'serializable',
        ...(options.context || {}),
      },
    };

    return this.executeInTransaction(fn, serializableOptions);
  }

  /**
   * Generate a unique transaction ID.
   * 
   * @returns A unique transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const counter = this.transactionCounter++;
    return `tx-${timestamp}-${counter}`;
  }

  /**
   * Get the transaction ID associated with a transaction client.
   * 
   * @param client - The transaction client
   * @returns The transaction ID or null if not found
   */
  private getTransactionIdFromClient(client: Prisma.TransactionClient): string | null {
    for (const [id, tx] of this.transactionMap.entries()) {
      if (tx === client) {
        return id;
      }
    }
    return null;
  }

  /**
   * Escape a savepoint name to prevent SQL injection.
   * 
   * @param name - The savepoint name to escape
   * @returns The escaped savepoint name
   */
  private escapeSavepointName(name: string): string {
    // Replace any non-alphanumeric characters with underscores
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}