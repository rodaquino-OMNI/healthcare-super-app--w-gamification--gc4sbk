import { Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { DatabaseException, QueryException } from '../errors/database-error.exception';
import { DatabaseErrorType, DatabaseErrorSeverity } from '../errors/database-error.types';
import { ErrorTransformer } from '../errors/error-transformer';
import { RetryStrategyFactory } from '../errors/retry-strategies';
import { TransactionIsolationLevel } from '../transactions/transaction.interface';
import { executeInTransaction } from '../transactions/transaction.utils';
import { JourneyType } from '../types/journey.types';

/**
 * Configuration options for batch operations.
 */
export interface BatchOptions {
  /** 
   * Maximum number of items to process in a single batch
   * @default 1000
   */
  batchSize?: number;
  
  /** 
   * Whether to execute the operation within a transaction
   * @default true
   */
  useTransaction?: boolean;
  
  /** 
   * Transaction isolation level when useTransaction is true
   * @default TransactionIsolationLevel.READ_COMMITTED
   */
  isolationLevel?: TransactionIsolationLevel;
  
  /** 
   * Whether to continue processing remaining batches if one batch fails
   * @default false
   */
  continueOnError?: boolean;
  
  /** 
   * Maximum number of retry attempts for failed batches
   * @default 3
   */
  maxRetries?: number;
  
  /** 
   * Base delay in milliseconds between retry attempts (used for exponential backoff)
   * @default 100
   */
  retryBaseDelayMs?: number;
  
  /** 
   * Maximum delay in milliseconds between retry attempts
   * @default 5000
   */
  retryMaxDelayMs?: number;
  
  /** 
   * Progress callback function that receives updates during batch processing
   */
  onProgress?: (progress: BatchProgress) => void;
  
  /** 
   * Journey type for journey-specific batch operations
   */
  journeyType?: JourneyType;
  
  /** 
   * Whether to optimize for TimescaleDB operations (for time-series data)
   * @default false
   */
  timescaleOptimized?: boolean;
}

/**
 * Progress information for batch operations.
 */
export interface BatchProgress {
  /** Total number of items to process */
  total: number;
  
  /** Number of items processed so far */
  processed: number;
  
  /** Number of items successfully processed */
  succeeded: number;
  
  /** Number of items that failed processing */
  failed: number;
  
  /** Current batch number */
  currentBatch: number;
  
  /** Total number of batches */
  totalBatches: number;
  
  /** Processing speed in items per second */
  itemsPerSecond: number;
  
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemainingMs: number;
  
  /** Elapsed time in milliseconds */
  elapsedTimeMs: number;
  
  /** Current status of the batch operation */
  status: 'running' | 'completed' | 'failed' | 'partially_completed';
  
  /** Error information if status is 'failed' or 'partially_completed' */
  errors?: Array<{
    batch: number;
    error: Error;
    items: number;
  }>;
}

/**
 * Result of a batch operation.
 */
export interface BatchResult<T> {
  /** Number of items successfully processed */
  succeeded: number;
  
  /** Number of items that failed processing */
  failed: number;
  
  /** Total number of items processed */
  total: number;
  
  /** Number of batches processed */
  batches: number;
  
  /** Time taken to process all batches in milliseconds */
  timeMs: number;
  
  /** Detailed results for each batch */
  batchResults: Array<{
    batch: number;
    succeeded: number;
    failed: number;
    timeMs: number;
    error?: Error;
  }>;
  
  /** Successfully processed items (if returnItems is true) */
  items?: T[];
}

/**
 * Error thrown when a batch operation fails.
 */
export class BatchOperationError extends DatabaseException {
  constructor(
    message: string,
    metadata: Record<string, any>,
  ) {
    super(
      message,
      {
        errorType: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        ...metadata,
      },
    );
    this.name = 'BatchOperationError';
  }
}

// Default batch options
const DEFAULT_BATCH_OPTIONS: Required<Omit<BatchOptions, 'journeyType' | 'onProgress'>> = {
  batchSize: 1000,
  useTransaction: true,
  isolationLevel: TransactionIsolationLevel.READ_COMMITTED,
  continueOnError: false,
  maxRetries: 3,
  retryBaseDelayMs: 100,
  retryMaxDelayMs: 5000,
  timescaleOptimized: false,
};

// Private logger instance
const logger = new Logger('BatchUtils');

/**
 * Creates a new batch options object by merging provided options with defaults.
 * 
 * @param options Partial batch options to override defaults
 * @returns Complete batch options with defaults applied
 */
function createBatchOptions(options?: BatchOptions): Required<Omit<BatchOptions, 'journeyType' | 'onProgress'>> & Pick<BatchOptions, 'journeyType' | 'onProgress'> {
  return {
    ...DEFAULT_BATCH_OPTIONS,
    ...options,
  };
}

/**
 * Splits an array into chunks of the specified size.
 * 
 * @param items Array to split into chunks
 * @param chunkSize Maximum size of each chunk
 * @returns Array of chunks
 */
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Creates a new progress tracker for batch operations.
 * 
 * @param total Total number of items to process
 * @param batchCount Total number of batches
 * @returns Progress tracker object with update method
 */
function createProgressTracker(total: number, batchCount: number): {
  getProgress: () => BatchProgress;
  updateProgress: (batch: number, succeeded: number, failed: number, error?: Error) => void;
  startTimer: () => void;
  stopTimer: () => void;
} {
  const startTime = Date.now();
  let lastUpdateTime = startTime;
  let itemsProcessedAtLastUpdate = 0;
  
  const progress: BatchProgress = {
    total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: batchCount,
    itemsPerSecond: 0,
    estimatedTimeRemainingMs: 0,
    elapsedTimeMs: 0,
    status: 'running',
    errors: [],
  };
  
  return {
    getProgress: () => ({ ...progress }),
    updateProgress: (batch: number, succeeded: number, failed: number, error?: Error) => {
      const now = Date.now();
      const newProcessed = succeeded + failed;
      const timeSinceLastUpdate = now - lastUpdateTime;
      
      // Update progress
      progress.currentBatch = batch;
      progress.processed += newProcessed;
      progress.succeeded += succeeded;
      progress.failed += failed;
      progress.elapsedTimeMs = now - startTime;
      
      // Calculate processing speed
      if (timeSinceLastUpdate > 1000) { // Only update speed every second
        const itemsProcessedSinceLastUpdate = progress.processed - itemsProcessedAtLastUpdate;
        progress.itemsPerSecond = (itemsProcessedSinceLastUpdate / timeSinceLastUpdate) * 1000;
        lastUpdateTime = now;
        itemsProcessedAtLastUpdate = progress.processed;
      }
      
      // Calculate estimated time remaining
      if (progress.itemsPerSecond > 0) {
        const remainingItems = total - progress.processed;
        progress.estimatedTimeRemainingMs = (remainingItems / progress.itemsPerSecond) * 1000;
      }
      
      // Update status
      if (error) {
        progress.errors = progress.errors || [];
        progress.errors.push({ batch, error, items: failed });
        progress.status = progress.processed === total ? 'partially_completed' : 'failed';
      } else if (progress.processed === total) {
        progress.status = progress.failed > 0 ? 'partially_completed' : 'completed';
      }
    },
    startTimer: () => {
      // Reset timer
      lastUpdateTime = Date.now();
      itemsProcessedAtLastUpdate = progress.processed;
    },
    stopTimer: () => {
      // Final update to elapsed time
      progress.elapsedTimeMs = Date.now() - startTime;
    },
  };
}

/**
 * Performs a batch create operation, automatically chunking large datasets.
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model to operate on
 * @param data Array of items to create
 * @param options Batch operation options
 * @returns Result of the batch operation
 * @throws BatchOperationError if the operation fails and continueOnError is false
 */
export async function batchCreate<T, R>(
  prisma: PrismaClient,
  model: string,
  data: T[],
  options?: BatchOptions & { returnItems?: boolean },
): Promise<BatchResult<R>> {
  const opts = createBatchOptions(options);
  const returnItems = options?.returnItems ?? false;
  const errorTransformer = new ErrorTransformer();
  const retryStrategyFactory = new RetryStrategyFactory({
    baseDelayMs: opts.retryBaseDelayMs,
    maxDelayMs: opts.retryMaxDelayMs,
    maxAttempts: opts.maxRetries,
    jitterFactor: 0.1,
  });
  
  // Handle empty data array
  if (!data.length) {
    return {
      succeeded: 0,
      failed: 0,
      total: 0,
      batches: 0,
      timeMs: 0,
      batchResults: [],
      items: returnItems ? [] : undefined,
    };
  }
  
  // Split data into batches
  const batches = chunkArray(data, opts.batchSize);
  const result: BatchResult<R> = {
    succeeded: 0,
    failed: 0,
    total: data.length,
    batches: batches.length,
    timeMs: 0,
    batchResults: [],
    items: returnItems ? [] : undefined,
  };
  
  // Create progress tracker
  const tracker = createProgressTracker(data.length, batches.length);
  tracker.startTimer();
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchError: Error | undefined;
    const batchStartTime = Date.now();
    
    try {
      // Process the batch with retry logic
      let attempt = 0;
      let success = false;
      let lastError: Error | undefined;
      
      while (attempt < opts.maxRetries && !success) {
        attempt++;
        
        try {
          // Execute batch operation, optionally in a transaction
          let batchResult: R[];
          
          if (opts.useTransaction) {
            batchResult = await executeInTransaction(prisma, async (tx) => {
              return await (tx[model as keyof typeof tx] as any).createMany({
                data: batch,
                skipDuplicates: false,
              });
            }, { isolationLevel: opts.isolationLevel });
          } else {
            batchResult = await (prisma[model as keyof typeof prisma] as any).createMany({
              data: batch,
              skipDuplicates: false,
            });
          }
          
          // If we get here, the batch was successful
          batchSucceeded = batch.length;
          success = true;
          
          // Store items if requested
          if (returnItems && result.items) {
            result.items.push(...(batchResult as unknown as R[]));
          }
        } catch (error) {
          lastError = error;
          
          // Transform the error for consistent handling
          const transformedError = errorTransformer.transformQueryError(
            error,
            `Error in batch create operation (batch ${batchNumber}/${batches.length})`,
          );
          
          // Determine if we should retry based on the error type
          const retryStrategy = retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType || DatabaseErrorType.QUERY,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt,
          });
          
          // If the error is retryable and we haven't exceeded max attempts, retry
          if (retryStrategy.shouldRetry() && attempt < opts.maxRetries) {
            const delayMs = retryStrategy.getNextDelayMs();
            logger.warn(
              `Batch create operation failed (batch ${batchNumber}/${batches.length}, attempt ${attempt}/${opts.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              transformedError,
            );
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            // We've exhausted retries or the error is not retryable
            batchFailed = batch.length;
            batchError = transformedError;
            
            logger.error(
              `Batch create operation failed after ${attempt} attempts (batch ${batchNumber}/${batches.length}).`,
              transformedError,
            );
            
            if (!opts.continueOnError) {
              throw new BatchOperationError(
                `Batch create operation failed at batch ${batchNumber}/${batches.length}`,
                {
                  model,
                  batchSize: batch.length,
                  batchNumber,
                  totalBatches: batches.length,
                  originalError: transformedError,
                },
              );
            }
          }
        }
      }
    } catch (error) {
      // This catch block handles the BatchOperationError thrown when continueOnError is false
      tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, error);
      tracker.stopTimer();
      throw error;
    }
    
    // Update batch results
    const batchTimeMs = Date.now() - batchStartTime;
    result.batchResults.push({
      batch: batchNumber,
      succeeded: batchSucceeded,
      failed: batchFailed,
      timeMs: batchTimeMs,
      error: batchError,
    });
    
    // Update totals
    result.succeeded += batchSucceeded;
    result.failed += batchFailed;
    
    // Update progress
    tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, batchError);
    
    // Call progress callback if provided
    if (opts.onProgress) {
      opts.onProgress(tracker.getProgress());
    }
  }
  
  // Finalize timing
  tracker.stopTimer();
  result.timeMs = tracker.getProgress().elapsedTimeMs;
  
  return result;
}

/**
 * Performs a batch update operation, automatically chunking large datasets.
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model to operate on
 * @param data Array of items to update, each containing an id and update data
 * @param options Batch operation options
 * @returns Result of the batch operation
 * @throws BatchOperationError if the operation fails and continueOnError is false
 */
export async function batchUpdate<T extends { id: string | number }, R>(
  prisma: PrismaClient,
  model: string,
  data: T[],
  options?: BatchOptions & { returnItems?: boolean },
): Promise<BatchResult<R>> {
  const opts = createBatchOptions(options);
  const returnItems = options?.returnItems ?? false;
  const errorTransformer = new ErrorTransformer();
  const retryStrategyFactory = new RetryStrategyFactory({
    baseDelayMs: opts.retryBaseDelayMs,
    maxDelayMs: opts.retryMaxDelayMs,
    maxAttempts: opts.maxRetries,
    jitterFactor: 0.1,
  });
  
  // Handle empty data array
  if (!data.length) {
    return {
      succeeded: 0,
      failed: 0,
      total: 0,
      batches: 0,
      timeMs: 0,
      batchResults: [],
      items: returnItems ? [] : undefined,
    };
  }
  
  // Split data into batches
  const batches = chunkArray(data, opts.batchSize);
  const result: BatchResult<R> = {
    succeeded: 0,
    failed: 0,
    total: data.length,
    batches: batches.length,
    timeMs: 0,
    batchResults: [],
    items: returnItems ? [] : undefined,
  };
  
  // Create progress tracker
  const tracker = createProgressTracker(data.length, batches.length);
  tracker.startTimer();
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchError: Error | undefined;
    const batchStartTime = Date.now();
    const batchResults: R[] = [];
    
    try {
      // Process the batch with retry logic
      let attempt = 0;
      let lastError: Error | undefined;
      
      while (attempt < opts.maxRetries && batchSucceeded < batch.length) {
        attempt++;
        
        try {
          // For updates, we need to process each item individually or use updateMany with WHERE IN clause
          // Here we'll use a transaction to ensure atomicity of the batch
          if (opts.useTransaction) {
            await executeInTransaction(prisma, async (tx) => {
              const updatePromises = batch.map(async (item) => {
                try {
                  const result = await (tx[model as keyof typeof tx] as any).update({
                    where: { id: item.id },
                    data: { ...item, id: undefined }, // Remove id from update data
                  });
                  
                  batchSucceeded++;
                  if (returnItems) {
                    batchResults.push(result as R);
                  }
                  return result;
                } catch (error) {
                  batchFailed++;
                  throw error; // Rethrow to trigger transaction rollback
                }
              });
              
              // Wait for all updates to complete
              return await Promise.all(updatePromises);
            }, { isolationLevel: opts.isolationLevel });
            
            // If we get here, all updates in the transaction succeeded
            break;
          } else {
            // Without a transaction, process each item and continue on error if configured
            for (const item of batch) {
              try {
                const result = await (prisma[model as keyof typeof prisma] as any).update({
                  where: { id: item.id },
                  data: { ...item, id: undefined }, // Remove id from update data
                });
                
                batchSucceeded++;
                if (returnItems && result.items) {
                  batchResults.push(result as R);
                }
              } catch (error) {
                batchFailed++;
                
                if (!opts.continueOnError) {
                  throw error; // Rethrow to stop processing
                }
                
                // Log the error but continue processing
                const transformedError = errorTransformer.transformQueryError(
                  error,
                  `Error updating item with id ${item.id} in batch ${batchNumber}/${batches.length}`,
                );
                
                logger.warn(
                  `Failed to update item with id ${item.id} in batch ${batchNumber}/${batches.length}. Continuing with next item.`,
                  transformedError,
                );
              }
            }
            
            // All items processed (with or without errors)
            break;
          }
        } catch (error) {
          lastError = error;
          
          // Transform the error for consistent handling
          const transformedError = errorTransformer.transformQueryError(
            error,
            `Error in batch update operation (batch ${batchNumber}/${batches.length})`,
          );
          
          // Determine if we should retry based on the error type
          const retryStrategy = retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType || DatabaseErrorType.QUERY,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt,
          });
          
          // If the error is retryable and we haven't exceeded max attempts, retry
          if (retryStrategy.shouldRetry() && attempt < opts.maxRetries) {
            const delayMs = retryStrategy.getNextDelayMs();
            logger.warn(
              `Batch update operation failed (batch ${batchNumber}/${batches.length}, attempt ${attempt}/${opts.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              transformedError,
            );
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            // We've exhausted retries or the error is not retryable
            batchFailed = batch.length - batchSucceeded;
            batchError = transformedError;
            
            logger.error(
              `Batch update operation failed after ${attempt} attempts (batch ${batchNumber}/${batches.length}).`,
              transformedError,
            );
            
            if (!opts.continueOnError) {
              throw new BatchOperationError(
                `Batch update operation failed at batch ${batchNumber}/${batches.length}`,
                {
                  model,
                  batchSize: batch.length,
                  batchNumber,
                  totalBatches: batches.length,
                  originalError: transformedError,
                },
              );
            }
          }
        }
      }
      
      // Store batch results if requested
      if (returnItems && result.items) {
        result.items.push(...batchResults);
      }
    } catch (error) {
      // This catch block handles the BatchOperationError thrown when continueOnError is false
      tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, error);
      tracker.stopTimer();
      throw error;
    }
    
    // Update batch results
    const batchTimeMs = Date.now() - batchStartTime;
    result.batchResults.push({
      batch: batchNumber,
      succeeded: batchSucceeded,
      failed: batchFailed,
      timeMs: batchTimeMs,
      error: batchError,
    });
    
    // Update totals
    result.succeeded += batchSucceeded;
    result.failed += batchFailed;
    
    // Update progress
    tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, batchError);
    
    // Call progress callback if provided
    if (opts.onProgress) {
      opts.onProgress(tracker.getProgress());
    }
  }
  
  // Finalize timing
  tracker.stopTimer();
  result.timeMs = tracker.getProgress().elapsedTimeMs;
  
  return result;
}

/**
 * Performs a batch delete operation, automatically chunking large datasets.
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model to operate on
 * @param ids Array of IDs to delete
 * @param options Batch operation options
 * @returns Result of the batch operation
 * @throws BatchOperationError if the operation fails and continueOnError is false
 */
export async function batchDelete<T extends string | number>(
  prisma: PrismaClient,
  model: string,
  ids: T[],
  options?: BatchOptions,
): Promise<BatchResult<void>> {
  const opts = createBatchOptions(options);
  const errorTransformer = new ErrorTransformer();
  const retryStrategyFactory = new RetryStrategyFactory({
    baseDelayMs: opts.retryBaseDelayMs,
    maxDelayMs: opts.retryMaxDelayMs,
    maxAttempts: opts.maxRetries,
    jitterFactor: 0.1,
  });
  
  // Handle empty data array
  if (!ids.length) {
    return {
      succeeded: 0,
      failed: 0,
      total: 0,
      batches: 0,
      timeMs: 0,
      batchResults: [],
    };
  }
  
  // Split data into batches
  const batches = chunkArray(ids, opts.batchSize);
  const result: BatchResult<void> = {
    succeeded: 0,
    failed: 0,
    total: ids.length,
    batches: batches.length,
    timeMs: 0,
    batchResults: [],
  };
  
  // Create progress tracker
  const tracker = createProgressTracker(ids.length, batches.length);
  tracker.startTimer();
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchError: Error | undefined;
    const batchStartTime = Date.now();
    
    try {
      // Process the batch with retry logic
      let attempt = 0;
      let success = false;
      let lastError: Error | undefined;
      
      while (attempt < opts.maxRetries && !success) {
        attempt++;
        
        try {
          // Execute batch operation, optionally in a transaction
          if (opts.useTransaction) {
            await executeInTransaction(prisma, async (tx) => {
              return await (tx[model as keyof typeof tx] as any).deleteMany({
                where: { id: { in: batch } },
              });
            }, { isolationLevel: opts.isolationLevel });
          } else {
            await (prisma[model as keyof typeof prisma] as any).deleteMany({
              where: { id: { in: batch } },
            });
          }
          
          // If we get here, the batch was successful
          batchSucceeded = batch.length;
          success = true;
        } catch (error) {
          lastError = error;
          
          // Transform the error for consistent handling
          const transformedError = errorTransformer.transformQueryError(
            error,
            `Error in batch delete operation (batch ${batchNumber}/${batches.length})`,
          );
          
          // Determine if we should retry based on the error type
          const retryStrategy = retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType || DatabaseErrorType.QUERY,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt,
          });
          
          // If the error is retryable and we haven't exceeded max attempts, retry
          if (retryStrategy.shouldRetry() && attempt < opts.maxRetries) {
            const delayMs = retryStrategy.getNextDelayMs();
            logger.warn(
              `Batch delete operation failed (batch ${batchNumber}/${batches.length}, attempt ${attempt}/${opts.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              transformedError,
            );
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            // We've exhausted retries or the error is not retryable
            batchFailed = batch.length;
            batchError = transformedError;
            
            logger.error(
              `Batch delete operation failed after ${attempt} attempts (batch ${batchNumber}/${batches.length}).`,
              transformedError,
            );
            
            if (!opts.continueOnError) {
              throw new BatchOperationError(
                `Batch delete operation failed at batch ${batchNumber}/${batches.length}`,
                {
                  model,
                  batchSize: batch.length,
                  batchNumber,
                  totalBatches: batches.length,
                  originalError: transformedError,
                },
              );
            }
          }
        }
      }
    } catch (error) {
      // This catch block handles the BatchOperationError thrown when continueOnError is false
      tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, error);
      tracker.stopTimer();
      throw error;
    }
    
    // Update batch results
    const batchTimeMs = Date.now() - batchStartTime;
    result.batchResults.push({
      batch: batchNumber,
      succeeded: batchSucceeded,
      failed: batchFailed,
      timeMs: batchTimeMs,
      error: batchError,
    });
    
    // Update totals
    result.succeeded += batchSucceeded;
    result.failed += batchFailed;
    
    // Update progress
    tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, batchError);
    
    // Call progress callback if provided
    if (opts.onProgress) {
      opts.onProgress(tracker.getProgress());
    }
  }
  
  // Finalize timing
  tracker.stopTimer();
  result.timeMs = tracker.getProgress().elapsedTimeMs;
  
  return result;
}

/**
 * Performs a batch upsert operation, automatically chunking large datasets.
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model to operate on
 * @param data Array of items to upsert
 * @param uniqueFields Array of field names that uniquely identify each record
 * @param options Batch operation options
 * @returns Result of the batch operation
 * @throws BatchOperationError if the operation fails and continueOnError is false
 */
export async function batchUpsert<T, R>(
  prisma: PrismaClient,
  model: string,
  data: T[],
  uniqueFields: string[],
  options?: BatchOptions & { returnItems?: boolean },
): Promise<BatchResult<R>> {
  const opts = createBatchOptions(options);
  const returnItems = options?.returnItems ?? false;
  const errorTransformer = new ErrorTransformer();
  const retryStrategyFactory = new RetryStrategyFactory({
    baseDelayMs: opts.retryBaseDelayMs,
    maxDelayMs: opts.retryMaxDelayMs,
    maxAttempts: opts.maxRetries,
    jitterFactor: 0.1,
  });
  
  // Handle empty data array
  if (!data.length) {
    return {
      succeeded: 0,
      failed: 0,
      total: 0,
      batches: 0,
      timeMs: 0,
      batchResults: [],
      items: returnItems ? [] : undefined,
    };
  }
  
  // Split data into batches
  const batches = chunkArray(data, opts.batchSize);
  const result: BatchResult<R> = {
    succeeded: 0,
    failed: 0,
    total: data.length,
    batches: batches.length,
    timeMs: 0,
    batchResults: [],
    items: returnItems ? [] : undefined,
  };
  
  // Create progress tracker
  const tracker = createProgressTracker(data.length, batches.length);
  tracker.startTimer();
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchError: Error | undefined;
    const batchStartTime = Date.now();
    const batchResults: R[] = [];
    
    try {
      // Process the batch with retry logic
      let attempt = 0;
      let lastError: Error | undefined;
      
      while (attempt < opts.maxRetries && batchSucceeded < batch.length) {
        attempt++;
        
        try {
          // For upserts, we need to process each item individually
          // Here we'll use a transaction to ensure atomicity of the batch
          if (opts.useTransaction) {
            await executeInTransaction(prisma, async (tx) => {
              const upsertPromises = batch.map(async (item: any) => {
                try {
                  // Create where condition based on unique fields
                  const where: Record<string, any> = {};
                  for (const field of uniqueFields) {
                    where[field] = item[field];
                  }
                  
                  // Perform upsert operation
                  const result = await (tx[model as keyof typeof tx] as any).upsert({
                    where,
                    update: item,
                    create: item,
                  });
                  
                  batchSucceeded++;
                  if (returnItems) {
                    batchResults.push(result as R);
                  }
                  return result;
                } catch (error) {
                  batchFailed++;
                  throw error; // Rethrow to trigger transaction rollback
                }
              });
              
              // Wait for all upserts to complete
              return await Promise.all(upsertPromises);
            }, { isolationLevel: opts.isolationLevel });
            
            // If we get here, all upserts in the transaction succeeded
            break;
          } else {
            // Without a transaction, process each item and continue on error if configured
            for (const item of batch as any[]) {
              try {
                // Create where condition based on unique fields
                const where: Record<string, any> = {};
                for (const field of uniqueFields) {
                  where[field] = item[field];
                }
                
                // Perform upsert operation
                const result = await (prisma[model as keyof typeof prisma] as any).upsert({
                  where,
                  update: item,
                  create: item,
                });
                
                batchSucceeded++;
                if (returnItems) {
                  batchResults.push(result as R);
                }
              } catch (error) {
                batchFailed++;
                
                if (!opts.continueOnError) {
                  throw error; // Rethrow to stop processing
                }
                
                // Log the error but continue processing
                const transformedError = errorTransformer.transformQueryError(
                  error,
                  `Error upserting item in batch ${batchNumber}/${batches.length}`,
                );
                
                logger.warn(
                  `Failed to upsert item in batch ${batchNumber}/${batches.length}. Continuing with next item.`,
                  transformedError,
                );
              }
            }
            
            // All items processed (with or without errors)
            break;
          }
        } catch (error) {
          lastError = error;
          
          // Transform the error for consistent handling
          const transformedError = errorTransformer.transformQueryError(
            error,
            `Error in batch upsert operation (batch ${batchNumber}/${batches.length})`,
          );
          
          // Determine if we should retry based on the error type
          const retryStrategy = retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType || DatabaseErrorType.QUERY,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt,
          });
          
          // If the error is retryable and we haven't exceeded max attempts, retry
          if (retryStrategy.shouldRetry() && attempt < opts.maxRetries) {
            const delayMs = retryStrategy.getNextDelayMs();
            logger.warn(
              `Batch upsert operation failed (batch ${batchNumber}/${batches.length}, attempt ${attempt}/${opts.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              transformedError,
            );
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            // We've exhausted retries or the error is not retryable
            batchFailed = batch.length - batchSucceeded;
            batchError = transformedError;
            
            logger.error(
              `Batch upsert operation failed after ${attempt} attempts (batch ${batchNumber}/${batches.length}).`,
              transformedError,
            );
            
            if (!opts.continueOnError) {
              throw new BatchOperationError(
                `Batch upsert operation failed at batch ${batchNumber}/${batches.length}`,
                {
                  model,
                  batchSize: batch.length,
                  batchNumber,
                  totalBatches: batches.length,
                  originalError: transformedError,
                },
              );
            }
          }
        }
      }
      
      // Store batch results if requested
      if (returnItems && result.items) {
        result.items.push(...batchResults);
      }
    } catch (error) {
      // This catch block handles the BatchOperationError thrown when continueOnError is false
      tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, error);
      tracker.stopTimer();
      throw error;
    }
    
    // Update batch results
    const batchTimeMs = Date.now() - batchStartTime;
    result.batchResults.push({
      batch: batchNumber,
      succeeded: batchSucceeded,
      failed: batchFailed,
      timeMs: batchTimeMs,
      error: batchError,
    });
    
    // Update totals
    result.succeeded += batchSucceeded;
    result.failed += batchFailed;
    
    // Update progress
    tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, batchError);
    
    // Call progress callback if provided
    if (opts.onProgress) {
      opts.onProgress(tracker.getProgress());
    }
  }
  
  // Finalize timing
  tracker.stopTimer();
  result.timeMs = tracker.getProgress().elapsedTimeMs;
  
  return result;
}

/**
 * Executes a function in batches over a large dataset.
 * Useful for processing large datasets that don't fit in memory.
 * 
 * @param items Array of items to process
 * @param batchFn Function to execute on each batch
 * @param options Batch operation options
 * @returns Result of the batch operation
 * @throws BatchOperationError if the operation fails and continueOnError is false
 */
export async function executeInBatches<T, R>(
  items: T[],
  batchFn: (batch: T[], batchNumber: number, totalBatches: number) => Promise<R[]>,
  options?: BatchOptions & { returnItems?: boolean },
): Promise<BatchResult<R>> {
  const opts = createBatchOptions(options);
  const returnItems = options?.returnItems ?? false;
  const errorTransformer = new ErrorTransformer();
  const retryStrategyFactory = new RetryStrategyFactory({
    baseDelayMs: opts.retryBaseDelayMs,
    maxDelayMs: opts.retryMaxDelayMs,
    maxAttempts: opts.maxRetries,
    jitterFactor: 0.1,
  });
  
  // Handle empty data array
  if (!items.length) {
    return {
      succeeded: 0,
      failed: 0,
      total: 0,
      batches: 0,
      timeMs: 0,
      batchResults: [],
      items: returnItems ? [] : undefined,
    };
  }
  
  // Split data into batches
  const batches = chunkArray(items, opts.batchSize);
  const result: BatchResult<R> = {
    succeeded: 0,
    failed: 0,
    total: items.length,
    batches: batches.length,
    timeMs: 0,
    batchResults: [],
    items: returnItems ? [] : undefined,
  };
  
  // Create progress tracker
  const tracker = createProgressTracker(items.length, batches.length);
  tracker.startTimer();
  
  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNumber = batchIndex + 1;
    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchError: Error | undefined;
    const batchStartTime = Date.now();
    
    try {
      // Process the batch with retry logic
      let attempt = 0;
      let batchResults: R[] = [];
      let success = false;
      
      while (attempt < opts.maxRetries && !success) {
        attempt++;
        
        try {
          // Execute the batch function
          batchResults = await batchFn(batch, batchNumber, batches.length);
          
          // If we get here, the batch was successful
          batchSucceeded = batch.length;
          success = true;
          
          // Store items if requested
          if (returnItems && result.items) {
            result.items.push(...batchResults);
          }
        } catch (error) {
          // Transform the error for consistent handling
          const transformedError = errorTransformer.transformQueryError(
            error,
            `Error in batch execution (batch ${batchNumber}/${batches.length})`,
          );
          
          // Determine if we should retry based on the error type
          const retryStrategy = retryStrategyFactory.createStrategy({
            errorType: transformedError.errorType || DatabaseErrorType.QUERY,
            severity: transformedError.severity || DatabaseErrorSeverity.MAJOR,
            attempt,
          });
          
          // If the error is retryable and we haven't exceeded max attempts, retry
          if (retryStrategy.shouldRetry() && attempt < opts.maxRetries) {
            const delayMs = retryStrategy.getNextDelayMs();
            logger.warn(
              `Batch execution failed (batch ${batchNumber}/${batches.length}, attempt ${attempt}/${opts.maxRetries}). ` +
              `Retrying in ${delayMs}ms...`,
              transformedError,
            );
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            // We've exhausted retries or the error is not retryable
            batchFailed = batch.length;
            batchError = transformedError;
            
            logger.error(
              `Batch execution failed after ${attempt} attempts (batch ${batchNumber}/${batches.length}).`,
              transformedError,
            );
            
            if (!opts.continueOnError) {
              throw new BatchOperationError(
                `Batch execution failed at batch ${batchNumber}/${batches.length}`,
                {
                  batchSize: batch.length,
                  batchNumber,
                  totalBatches: batches.length,
                  originalError: transformedError,
                },
              );
            }
          }
        }
      }
    } catch (error) {
      // This catch block handles the BatchOperationError thrown when continueOnError is false
      tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, error);
      tracker.stopTimer();
      throw error;
    }
    
    // Update batch results
    const batchTimeMs = Date.now() - batchStartTime;
    result.batchResults.push({
      batch: batchNumber,
      succeeded: batchSucceeded,
      failed: batchFailed,
      timeMs: batchTimeMs,
      error: batchError,
    });
    
    // Update totals
    result.succeeded += batchSucceeded;
    result.failed += batchFailed;
    
    // Update progress
    tracker.updateProgress(batchNumber, batchSucceeded, batchFailed, batchError);
    
    // Call progress callback if provided
    if (opts.onProgress) {
      opts.onProgress(tracker.getProgress());
    }
  }
  
  // Finalize timing
  tracker.stopTimer();
  result.timeMs = tracker.getProgress().elapsedTimeMs;
  
  return result;
}

/**
 * Specialized batch operation utilities for TimescaleDB time-series data.
 * These utilities are optimized for high-throughput time-series data operations.
 */
export const timescaleDB = {
  /**
   * Performs a batch insert of time-series data into TimescaleDB with hypertable optimization.
   * 
   * @param prisma Prisma client instance
   * @param model Prisma model to operate on
   * @param data Array of time-series data points to insert
   * @param timeField Name of the timestamp field in the data
   * @param options Batch operation options
   * @returns Result of the batch operation
   */
  async batchInsertTimeSeries<T extends { [key: string]: any }, R>(
    prisma: PrismaClient,
    model: string,
    data: T[],
    timeField: string,
    options?: BatchOptions & { returnItems?: boolean },
  ): Promise<BatchResult<R>> {
    // Set TimescaleDB optimization flag
    const opts = createBatchOptions({
      ...options,
      timescaleOptimized: true,
      // For TimescaleDB, larger batch sizes are often more efficient
      batchSize: options?.batchSize || 5000,
    });
    
    // Sort data by timestamp for better compression and query performance
    const sortedData = [...data].sort((a, b) => {
      const aTime = a[timeField] instanceof Date ? a[timeField].getTime() : new Date(a[timeField]).getTime();
      const bTime = b[timeField] instanceof Date ? b[timeField].getTime() : new Date(b[timeField]).getTime();
      return aTime - bTime;
    });
    
    // Use the standard batch create function with TimescaleDB optimizations
    return batchCreate<T, R>(prisma, model, sortedData, opts);
  },
  
  /**
   * Performs a batch query of time-series data from TimescaleDB with time range optimization.
   * 
   * @param prisma Prisma client instance
   * @param model Prisma model to query
   * @param timeRanges Array of time ranges to query
   * @param timeField Name of the timestamp field in the data
   * @param queryFn Function to execute for each time range
   * @param options Batch operation options
   * @returns Result of the batch operation
   */
  async batchQueryTimeRanges<T, R>(
    prisma: PrismaClient,
    model: string,
    timeRanges: Array<{ start: Date | string, end: Date | string }>,
    timeField: string,
    queryFn: (tx: any, timeRange: { start: Date, end: Date }) => Promise<R[]>,
    options?: BatchOptions & { returnItems?: boolean },
  ): Promise<BatchResult<R>> {
    // Set TimescaleDB optimization flag
    const opts = createBatchOptions({
      ...options,
      timescaleOptimized: true,
    });
    
    // Normalize time ranges to Date objects
    const normalizedTimeRanges = timeRanges.map(range => ({
      start: range.start instanceof Date ? range.start : new Date(range.start),
      end: range.end instanceof Date ? range.end : new Date(range.end),
    }));
    
    // Sort time ranges by start time for better query performance
    const sortedTimeRanges = [...normalizedTimeRanges].sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Use executeInBatches to process each time range
    return executeInBatches<{ start: Date, end: Date }, R>(
      sortedTimeRanges,
      async (batch, batchNumber, totalBatches) => {
        // Execute queries for each time range in the batch
        if (opts.useTransaction) {
          return await executeInTransaction(prisma, async (tx) => {
            const results: R[] = [];
            for (const timeRange of batch) {
              const rangeResults = await queryFn(tx, timeRange);
              results.push(...rangeResults);
            }
            return results;
          }, { isolationLevel: opts.isolationLevel });
        } else {
          const results: R[] = [];
          for (const timeRange of batch) {
            const rangeResults = await queryFn(prisma, timeRange);
            results.push(...rangeResults);
          }
          return results;
        }
      },
      opts,
    );
  },
};

/**
 * Journey-specific batch operation utilities.
 * These utilities provide optimized batch operations for specific journey domains.
 */
export const journeyBatch = {
  /**
   * Health journey batch operations.
   */
  health: {
    /**
     * Batch creates health metrics with optimized time-series storage.
     * 
     * @param prisma Prisma client instance
     * @param metrics Array of health metrics to create
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchCreateHealthMetrics<T extends { timestamp: Date | string }, R>(
      prisma: PrismaClient,
      metrics: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return timescaleDB.batchInsertTimeSeries<T, R>(
        prisma,
        'healthMetric',
        metrics,
        'timestamp',
        {
          ...options,
          journeyType: JourneyType.HEALTH,
        },
      );
    },
    
    /**
     * Batch updates health goals with transaction support.
     * 
     * @param prisma Prisma client instance
     * @param goals Array of health goals to update
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchUpdateHealthGoals<T extends { id: string | number }, R>(
      prisma: PrismaClient,
      goals: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchUpdate<T, R>(
        prisma,
        'healthGoal',
        goals,
        {
          ...options,
          journeyType: JourneyType.HEALTH,
          // Health goals often have dependencies, so use a higher isolation level
          isolationLevel: TransactionIsolationLevel.REPEATABLE_READ,
        },
      );
    },
  },
  
  /**
   * Care journey batch operations.
   */
  care: {
    /**
     * Batch creates appointments with conflict detection.
     * 
     * @param prisma Prisma client instance
     * @param appointments Array of appointments to create
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchCreateAppointments<T, R>(
      prisma: PrismaClient,
      appointments: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchCreate<T, R>(
        prisma,
        'appointment',
        appointments,
        {
          ...options,
          journeyType: JourneyType.CARE,
          // Appointments require serializable isolation to prevent double-booking
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        },
      );
    },
    
    /**
     * Batch updates medication records with transaction support.
     * 
     * @param prisma Prisma client instance
     * @param medications Array of medication records to update
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchUpdateMedications<T extends { id: string | number }, R>(
      prisma: PrismaClient,
      medications: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchUpdate<T, R>(
        prisma,
        'medication',
        medications,
        {
          ...options,
          journeyType: JourneyType.CARE,
        },
      );
    },
  },
  
  /**
   * Plan journey batch operations.
   */
  plan: {
    /**
     * Batch creates insurance claims with transaction support.
     * 
     * @param prisma Prisma client instance
     * @param claims Array of insurance claims to create
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchCreateClaims<T, R>(
      prisma: PrismaClient,
      claims: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchCreate<T, R>(
        prisma,
        'claim',
        claims,
        {
          ...options,
          journeyType: JourneyType.PLAN,
          // Claims require serializable isolation to prevent duplicate submissions
          isolationLevel: TransactionIsolationLevel.SERIALIZABLE,
        },
      );
    },
    
    /**
     * Batch updates benefit records with transaction support.
     * 
     * @param prisma Prisma client instance
     * @param benefits Array of benefit records to update
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchUpdateBenefits<T extends { id: string | number }, R>(
      prisma: PrismaClient,
      benefits: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchUpdate<T, R>(
        prisma,
        'benefit',
        benefits,
        {
          ...options,
          journeyType: JourneyType.PLAN,
        },
      );
    },
  },
  
  /**
   * Gamification journey batch operations.
   */
  gamification: {
    /**
     * Batch creates gamification events with optimized processing.
     * 
     * @param prisma Prisma client instance
     * @param events Array of gamification events to create
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchCreateEvents<T, R>(
      prisma: PrismaClient,
      events: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchCreate<T, R>(
        prisma,
        'gamificationEvent',
        events,
        {
          ...options,
          // Gamification events can be processed in larger batches
          batchSize: options?.batchSize || 2000,
        },
      );
    },
    
    /**
     * Batch updates achievement records with transaction support.
     * 
     * @param prisma Prisma client instance
     * @param achievements Array of achievement records to update
     * @param options Batch operation options
     * @returns Result of the batch operation
     */
    async batchUpdateAchievements<T extends { id: string | number }, R>(
      prisma: PrismaClient,
      achievements: T[],
      options?: BatchOptions & { returnItems?: boolean },
    ): Promise<BatchResult<R>> {
      return batchUpdate<T, R>(
        prisma,
        'achievement',
        achievements,
        options,
      );
    },
  },
};