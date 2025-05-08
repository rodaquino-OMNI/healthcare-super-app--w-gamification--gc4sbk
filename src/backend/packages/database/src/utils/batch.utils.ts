/**
 * Batch Database Operations Utilities
 * 
 * This module provides utilities for performing efficient batch database operations
 * with Prisma across journey services. It implements optimized bulk create, update,
 * and delete operations with automatic chunking for large datasets to prevent memory issues.
 * 
 * Features:
 * - Automatic chunking for large datasets
 * - Transactional batch operations for atomicity
 * - Journey-specific batch operations
 * - TimescaleDB optimized batch operations
 * - Progress tracking and error handling
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

import { DatabaseException, QueryException } from '../errors/database-error.exception';
import { DatabaseErrorType } from '../errors/database-error.types';
import { TransactionClient } from '../transactions/transaction.interface';
import { TransactionService } from '../transactions/transaction.service';
import { JourneyType } from '../types/journey.types';

const logger = new Logger('BatchUtils');

/**
 * Options for batch operations
 */
export interface BatchOptions {
  /** Size of each chunk for processing (default: 1000) */
  chunkSize?: number;
  /** Whether to continue on error (default: false) */
  continueOnError?: boolean;
  /** Optional transaction for atomic operations */
  transaction?: TransactionClient;
  /** Optional progress callback */
  onProgress?: (processed: number, total: number) => void;
  /** Optional journey type for journey-specific optimizations */
  journeyType?: JourneyType;
  /** Whether to use TimescaleDB optimizations for time-series data */
  useTimescaleDB?: boolean;
  /** Timeout in milliseconds for the entire batch operation */
  timeout?: number;
}

/**
 * Result of a batch operation
 */
export interface BatchResult<T> {
  /** Successfully processed items */
  successful: T[];
  /** Failed items with their errors */
  failed: Array<{ item: any; error: Error }>;
  /** Total number of items processed */
  totalProcessed: number;
  /** Total number of items that failed */
  totalFailed: number;
  /** Total time taken in milliseconds */
  timeTaken: number;
}

/**
 * Error thrown when a batch operation fails
 */
export class BatchOperationError extends DatabaseException {
  constructor(
    message: string,
    public readonly failedItems: Array<{ item: any; error: Error }>,
    public readonly operation: string,
    public readonly model: string,
  ) {
    super(
      message,
      DatabaseErrorType.QUERY,
      {
        operation,
        model,
        failedCount: failedItems.length,
      },
    );
    this.name = 'BatchOperationError';
  }
}

/**
 * Default batch options
 */
const defaultBatchOptions: BatchOptions = {
  chunkSize: 1000,
  continueOnError: false,
  onProgress: undefined,
  journeyType: undefined,
  useTimescaleDB: false,
  timeout: 30000, // 30 seconds default timeout
};

/**
 * Creates records in batches with automatic chunking
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model name
 * @param data Array of data to create
 * @param options Batch operation options
 * @returns BatchResult with operation results
 */
export async function batchCreate<T extends any>(
  prisma: PrismaClient | TransactionClient,
  model: string,
  data: any[],
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const startTime = Date.now();
  const opts = { ...defaultBatchOptions, ...options };
  const successful: T[] = [];
  const failed: Array<{ item: any; error: Error }> = [];
  
  // If data array is empty, return early
  if (!data.length) {
    return {
      successful,
      failed,
      totalProcessed: 0,
      totalFailed: 0,
      timeTaken: 0,
    };
  }

  try {
    // Set up timeout if specified
    const timeoutPromise = opts.timeout
      ? new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Batch create operation timed out after ${opts.timeout}ms`));
          }, opts.timeout);
        })
      : null;

    // Process in chunks
    const chunks = chunkArray(data, opts.chunkSize);
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Use TimescaleDB optimized insertion if specified
        if (opts.useTimescaleDB && isTimescaleModel(model)) {
          const result = await Promise.race([
            processTimescaleChunk(prisma, model, chunk, 'create'),
            timeoutPromise,
          ].filter(Boolean)) as T[];
          successful.push(...result);
        } else {
          // Standard Prisma createMany
          const result = await Promise.race([
            (prisma[model] as any).createMany({
              data: chunk,
              skipDuplicates: true,
            }),
            timeoutPromise,
          ].filter(Boolean));
          
          // For createMany, we don't get the created objects back, so we need to
          // add the input data to successful array
          successful.push(...chunk as T[]);
        }
      } catch (error) {
        if (opts.continueOnError) {
          // If continueOnError is true, process items individually
          for (const item of chunk) {
            try {
              const result = await Promise.race([
                (prisma[model] as any).create({ data: item }),
                timeoutPromise,
              ].filter(Boolean));
              successful.push(result);
            } catch (itemError) {
              failed.push({ item, error: itemError as Error });
            }
          }
        } else {
          // If continueOnError is false, mark all items in the chunk as failed
          chunk.forEach(item => {
            failed.push({ item, error: error as Error });
          });
          
          // If not continuing on error, throw the batch operation error
          if (!opts.continueOnError) {
            throw new BatchOperationError(
              `Batch create operation failed for model ${model}`,
              failed,
              'create',
              model
            );
          }
        }
      }
      
      // Update progress
      processedCount += chunk.length;
      if (opts.onProgress) {
        opts.onProgress(processedCount, data.length);
      }
    }

    return {
      successful,
      failed,
      totalProcessed: processedCount,
      totalFailed: failed.length,
      timeTaken: Date.now() - startTime,
    };
  } catch (error) {
    // If it's already a BatchOperationError, rethrow it
    if (error instanceof BatchOperationError) {
      throw error;
    }
    
    // Otherwise, wrap in a BatchOperationError
    throw new BatchOperationError(
      `Batch create operation failed for model ${model}: ${error.message}`,
      failed,
      'create',
      model
    );
  }
}

/**
 * Updates records in batches with automatic chunking
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model name
 * @param data Array of data to update (must include id or other unique identifier)
 * @param idField Field to use as identifier (default: 'id')
 * @param options Batch operation options
 * @returns BatchResult with operation results
 */
export async function batchUpdate<T extends any>(
  prisma: PrismaClient | TransactionClient,
  model: string,
  data: any[],
  idField: string = 'id',
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const startTime = Date.now();
  const opts = { ...defaultBatchOptions, ...options };
  const successful: T[] = [];
  const failed: Array<{ item: any; error: Error }> = [];
  
  // If data array is empty, return early
  if (!data.length) {
    return {
      successful,
      failed,
      totalProcessed: 0,
      totalFailed: 0,
      timeTaken: 0,
    };
  }

  try {
    // Set up timeout if specified
    const timeoutPromise = opts.timeout
      ? new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Batch update operation timed out after ${opts.timeout}ms`));
          }, opts.timeout);
        })
      : null;

    // Process in chunks
    const chunks = chunkArray(data, opts.chunkSize);
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Use TimescaleDB optimized update if specified
        if (opts.useTimescaleDB && isTimescaleModel(model)) {
          const result = await Promise.race([
            processTimescaleChunk(prisma, model, chunk, 'update', idField),
            timeoutPromise,
          ].filter(Boolean)) as T[];
          successful.push(...result);
        } else {
          // For standard Prisma, we need to update records individually
          // as updateMany doesn't return the updated records
          const updatePromises = chunk.map(async (item) => {
            try {
              const where = { [idField]: item[idField] };
              const { [idField]: _, ...dataToUpdate } = item; // Remove ID from update data
              
              const result = await Promise.race([
                (prisma[model] as any).update({
                  where,
                  data: dataToUpdate,
                }),
                timeoutPromise,
              ].filter(Boolean));
              
              return { success: true, result };
            } catch (error) {
              return { success: false, item, error };
            }
          });
          
          const results = await Promise.all(updatePromises);
          
          results.forEach(result => {
            if (result.success) {
              successful.push(result.result);
            } else {
              failed.push({ item: result.item, error: result.error as Error });
              
              // If not continuing on error and we have a failure, throw
              if (!opts.continueOnError) {
                throw new BatchOperationError(
                  `Batch update operation failed for model ${model}`,
                  [{ item: result.item, error: result.error as Error }],
                  'update',
                  model
                );
              }
            }
          });
        }
      } catch (error) {
        // If we're already handling individual errors and continuing, we won't reach here
        // This catch is for TimescaleDB chunk processing or when continueOnError is false
        if (error instanceof BatchOperationError) {
          throw error;
        }
        
        // Mark all items in the chunk as failed if we're not already tracking individual failures
        if (opts.useTimescaleDB || !opts.continueOnError) {
          chunk.forEach(item => {
            failed.push({ item, error: error as Error });
          });
          
          // If not continuing on error, throw the batch operation error
          if (!opts.continueOnError) {
            throw new BatchOperationError(
              `Batch update operation failed for model ${model}`,
              failed,
              'update',
              model
            );
          }
        }
      }
      
      // Update progress
      processedCount += chunk.length;
      if (opts.onProgress) {
        opts.onProgress(processedCount, data.length);
      }
    }

    return {
      successful,
      failed,
      totalProcessed: processedCount,
      totalFailed: failed.length,
      timeTaken: Date.now() - startTime,
    };
  } catch (error) {
    // If it's already a BatchOperationError, rethrow it
    if (error instanceof BatchOperationError) {
      throw error;
    }
    
    // Otherwise, wrap in a BatchOperationError
    throw new BatchOperationError(
      `Batch update operation failed for model ${model}: ${error.message}`,
      failed,
      'update',
      model
    );
  }
}

/**
 * Deletes records in batches with automatic chunking
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model name
 * @param ids Array of IDs to delete
 * @param idField Field to use as identifier (default: 'id')
 * @param options Batch operation options
 * @returns BatchResult with operation results
 */
export async function batchDelete<T extends any>(
  prisma: PrismaClient | TransactionClient,
  model: string,
  ids: any[],
  idField: string = 'id',
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const startTime = Date.now();
  const opts = { ...defaultBatchOptions, ...options };
  const successful: T[] = [];
  const failed: Array<{ item: any; error: Error }> = [];
  
  // If IDs array is empty, return early
  if (!ids.length) {
    return {
      successful,
      failed,
      totalProcessed: 0,
      totalFailed: 0,
      timeTaken: 0,
    };
  }

  try {
    // Set up timeout if specified
    const timeoutPromise = opts.timeout
      ? new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Batch delete operation timed out after ${opts.timeout}ms`));
          }, opts.timeout);
        })
      : null;

    // Process in chunks
    const chunks = chunkArray(ids, opts.chunkSize);
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Use TimescaleDB optimized deletion if specified
        if (opts.useTimescaleDB && isTimescaleModel(model)) {
          const result = await Promise.race([
            processTimescaleChunk(prisma, model, chunk.map(id => ({ [idField]: id })), 'delete', idField),
            timeoutPromise,
          ].filter(Boolean)) as T[];
          successful.push(...result);
        } else {
          // For standard Prisma, we can use deleteMany for better performance
          await Promise.race([
            (prisma[model] as any).deleteMany({
              where: {
                [idField]: { in: chunk },
              },
            }),
            timeoutPromise,
          ].filter(Boolean));
          
          // For deleteMany, we don't get the deleted objects back, so we need to
          // add the input IDs to successful array as objects
          successful.push(...chunk.map(id => ({ [idField]: id })) as T[]);
        }
      } catch (error) {
        if (opts.continueOnError) {
          // If continueOnError is true, process items individually
          for (const id of chunk) {
            try {
              const result = await Promise.race([
                (prisma[model] as any).delete({
                  where: { [idField]: id },
                }),
                timeoutPromise,
              ].filter(Boolean));
              successful.push(result);
            } catch (itemError) {
              failed.push({ item: { [idField]: id }, error: itemError as Error });
            }
          }
        } else {
          // If continueOnError is false, mark all items in the chunk as failed
          chunk.forEach(id => {
            failed.push({ item: { [idField]: id }, error: error as Error });
          });
          
          // If not continuing on error, throw the batch operation error
          if (!opts.continueOnError) {
            throw new BatchOperationError(
              `Batch delete operation failed for model ${model}`,
              failed,
              'delete',
              model
            );
          }
        }
      }
      
      // Update progress
      processedCount += chunk.length;
      if (opts.onProgress) {
        opts.onProgress(processedCount, ids.length);
      }
    }

    return {
      successful,
      failed,
      totalProcessed: processedCount,
      totalFailed: failed.length,
      timeTaken: Date.now() - startTime,
    };
  } catch (error) {
    // If it's already a BatchOperationError, rethrow it
    if (error instanceof BatchOperationError) {
      throw error;
    }
    
    // Otherwise, wrap in a BatchOperationError
    throw new BatchOperationError(
      `Batch delete operation failed for model ${model}: ${error.message}`,
      failed,
      'delete',
      model
    );
  }
}

/**
 * Executes a batch operation within a transaction for atomicity
 * 
 * @param prisma Prisma client instance
 * @param operation Function that performs the batch operation
 * @param options Transaction options
 * @returns Result of the batch operation
 */
export async function batchWithTransaction<T>(
  prisma: PrismaClient,
  operation: (tx: TransactionClient) => Promise<BatchResult<T>>,
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const transactionService = new TransactionService(prisma);
  
  try {
    return await transactionService.withTransaction(async (tx) => {
      return await operation(tx);
    });
  } catch (error) {
    if (error instanceof BatchOperationError) {
      throw error;
    }
    
    throw new QueryException(
      `Transaction failed during batch operation: ${error.message}`,
      { cause: error }
    );
  }
}

/**
 * Executes multiple batch operations within a single transaction
 * 
 * @param prisma Prisma client instance
 * @param operations Array of functions that perform batch operations
 * @param options Transaction options
 * @returns Array of results from each batch operation
 */
export async function batchOperationsWithTransaction<T>(
  prisma: PrismaClient,
  operations: ((tx: TransactionClient) => Promise<BatchResult<T>>)[],
  options: BatchOptions = {}
): Promise<BatchResult<T>[]> {
  const transactionService = new TransactionService(prisma);
  
  try {
    return await transactionService.withTransaction(async (tx) => {
      const results: BatchResult<T>[] = [];
      
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
        
        // If any operation has failures and we're not continuing on error, throw
        if (result.totalFailed > 0 && !options.continueOnError) {
          throw new BatchOperationError(
            `Batch operation failed with ${result.totalFailed} failures`,
            result.failed,
            'multiple',
            'multiple'
          );
        }
      }
      
      return results;
    });
  } catch (error) {
    if (error instanceof BatchOperationError) {
      throw error;
    }
    
    throw new QueryException(
      `Transaction failed during multiple batch operations: ${error.message}`,
      { cause: error }
    );
  }
}

/**
 * Health Journey specific batch operations for health metrics
 */
export const HealthJourneyBatch = {
  /**
   * Batch creates health metrics with TimescaleDB optimizations
   * 
   * @param prisma Prisma client instance
   * @param metrics Array of health metrics to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createHealthMetrics: async <T>(prisma: PrismaClient | TransactionClient, metrics: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'healthMetric', metrics, {
      ...options,
      useTimescaleDB: true,
      journeyType: JourneyType.HEALTH,
    });
  },
  
  /**
   * Batch creates health goals
   * 
   * @param prisma Prisma client instance
   * @param goals Array of health goals to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createHealthGoals: async <T>(prisma: PrismaClient | TransactionClient, goals: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'healthGoal', goals, {
      ...options,
      journeyType: JourneyType.HEALTH,
    });
  },
};

/**
 * Care Journey specific batch operations for appointments and medications
 */
export const CareJourneyBatch = {
  /**
   * Batch creates appointments
   * 
   * @param prisma Prisma client instance
   * @param appointments Array of appointments to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createAppointments: async <T>(prisma: PrismaClient | TransactionClient, appointments: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'appointment', appointments, {
      ...options,
      journeyType: JourneyType.CARE,
    });
  },
  
  /**
   * Batch creates medications
   * 
   * @param prisma Prisma client instance
   * @param medications Array of medications to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createMedications: async <T>(prisma: PrismaClient | TransactionClient, medications: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'medication', medications, {
      ...options,
      journeyType: JourneyType.CARE,
    });
  },
};

/**
 * Plan Journey specific batch operations for claims and benefits
 */
export const PlanJourneyBatch = {
  /**
   * Batch creates claims
   * 
   * @param prisma Prisma client instance
   * @param claims Array of claims to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createClaims: async <T>(prisma: PrismaClient | TransactionClient, claims: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'claim', claims, {
      ...options,
      journeyType: JourneyType.PLAN,
    });
  },
  
  /**
   * Batch creates benefits
   * 
   * @param prisma Prisma client instance
   * @param benefits Array of benefits to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createBenefits: async <T>(prisma: PrismaClient | TransactionClient, benefits: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'benefit', benefits, {
      ...options,
      journeyType: JourneyType.PLAN,
    });
  },
};

/**
 * Gamification specific batch operations for achievements and rewards
 */
export const GamificationBatch = {
  /**
   * Batch creates achievements
   * 
   * @param prisma Prisma client instance
   * @param achievements Array of achievements to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createAchievements: async <T>(prisma: PrismaClient | TransactionClient, achievements: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'achievement', achievements, options);
  },
  
  /**
   * Batch creates rewards
   * 
   * @param prisma Prisma client instance
   * @param rewards Array of rewards to create
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  createRewards: async <T>(prisma: PrismaClient | TransactionClient, rewards: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    return batchCreate<T>(prisma, 'reward', rewards, options);
  },
};

/**
 * TimescaleDB specific batch operations for time-series data
 */
export const TimescaleDBBatch = {
  /**
   * Optimized batch insert for TimescaleDB hypertables
   * 
   * @param prisma Prisma client instance
   * @param model Prisma model name (must be a TimescaleDB hypertable)
   * @param data Array of data to insert
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  batchInsert: async <T>(prisma: PrismaClient | TransactionClient, model: string, data: any[], options: BatchOptions = {}): Promise<BatchResult<T>> => {
    if (!isTimescaleModel(model)) {
      throw new Error(`Model ${model} is not a TimescaleDB hypertable`);
    }
    
    return batchCreate<T>(prisma, model, data, {
      ...options,
      useTimescaleDB: true,
    });
  },
  
  /**
   * Optimized batch update for TimescaleDB hypertables
   * 
   * @param prisma Prisma client instance
   * @param model Prisma model name (must be a TimescaleDB hypertable)
   * @param data Array of data to update
   * @param idField Field to use as identifier (default: 'id')
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  batchUpdate: async <T>(prisma: PrismaClient | TransactionClient, model: string, data: any[], idField: string = 'id', options: BatchOptions = {}): Promise<BatchResult<T>> => {
    if (!isTimescaleModel(model)) {
      throw new Error(`Model ${model} is not a TimescaleDB hypertable`);
    }
    
    return batchUpdate<T>(prisma, model, data, idField, {
      ...options,
      useTimescaleDB: true,
    });
  },
  
  /**
   * Optimized batch delete for TimescaleDB hypertables
   * 
   * @param prisma Prisma client instance
   * @param model Prisma model name (must be a TimescaleDB hypertable)
   * @param timeRange Time range to delete (start and end timestamps)
   * @param additionalFilters Additional filters to apply
   * @param options Batch options
   * @returns BatchResult with operation results
   */
  batchDeleteByTimeRange: async <T>(
    prisma: PrismaClient | TransactionClient,
    model: string,
    timeRange: { start: Date; end: Date },
    additionalFilters: Record<string, any> = {},
    options: BatchOptions = {}
  ): Promise<BatchResult<T>> {
    if (!isTimescaleModel(model)) {
      throw new Error(`Model ${model} is not a TimescaleDB hypertable`);
    }
    
    const startTime = Date.now();
    const opts = { ...defaultBatchOptions, ...options };
    
    try {
      // For TimescaleDB, we can use a more efficient range-based delete
      const result = await (prisma[model] as any).deleteMany({
        where: {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
          ...additionalFilters,
        },
      });
      
      return {
        successful: [{ deletedCount: result.count }] as any,
        failed: [],
        totalProcessed: result.count,
        totalFailed: 0,
        timeTaken: Date.now() - startTime,
      };
    } catch (error) {
      throw new BatchOperationError(
        `TimescaleDB batch delete operation failed for model ${model}: ${error.message}`,
        [{ item: { timeRange, ...additionalFilters }, error: error as Error }],
        'delete',
        model
      );
    }
  },
};

// Helper functions

/**
 * Splits an array into chunks of specified size
 * 
 * @param array Array to split
 * @param chunkSize Size of each chunk
 * @returns Array of chunks
 */
function chunkArray<T>(array: T[], chunkSize: number = 1000): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Checks if a model is a TimescaleDB hypertable
 * 
 * @param model Model name to check
 * @returns True if the model is a TimescaleDB hypertable
 */
function isTimescaleModel(model: string): boolean {
  // List of models that are TimescaleDB hypertables
  const timescaleModels = [
    'healthMetric',
    'deviceReading',
    'activityLog',
    'sleepData',
    'heartRateData',
    'bloodPressureData',
    'glucoseData',
    'oxygenSaturationData',
  ];
  
  return timescaleModels.includes(model);
}

/**
 * Processes a chunk of data for TimescaleDB operations
 * 
 * @param prisma Prisma client instance
 * @param model Prisma model name
 * @param chunk Chunk of data to process
 * @param operation Operation type ('create', 'update', or 'delete')
 * @param idField Field to use as identifier for update/delete operations
 * @returns Array of processed items
 */
async function processTimescaleChunk(
  prisma: PrismaClient | TransactionClient,
  model: string,
  chunk: any[],
  operation: 'create' | 'update' | 'delete',
  idField: string = 'id'
): Promise<any[]> {
  // For TimescaleDB, we can use more efficient batch operations
  // This is a simplified implementation - in a real system, you might use
  // raw SQL or specialized TimescaleDB client libraries for better performance
  
  switch (operation) {
    case 'create':
      // For create, we can use a more efficient bulk insert
      // This is a simplified version - in a real system, you might use COPY command
      // or other TimescaleDB-specific optimizations
      const createResult = await (prisma[model] as any).createMany({
        data: chunk,
        skipDuplicates: true,
      });
      
      // Since createMany doesn't return the created objects, we need to
      // return the input data as the result
      return chunk;
      
    case 'update':
      // For update, we need to update records individually
      // In a real system, you might use a more efficient batch update approach
      const updatePromises = chunk.map(async (item) => {
        const where = { [idField]: item[idField] };
        const { [idField]: _, ...dataToUpdate } = item; // Remove ID from update data
        
        return (prisma[model] as any).update({
          where,
          data: dataToUpdate,
        });
      });
      
      return await Promise.all(updatePromises);
      
    case 'delete':
      // For delete, we can use a more efficient batch delete
      // In a real system, you might use a more efficient approach for TimescaleDB
      const ids = chunk.map(item => item[idField]);
      
      await (prisma[model] as any).deleteMany({
        where: {
          [idField]: { in: ids },
        },
      });
      
      // Since deleteMany doesn't return the deleted objects, we need to
      // return the input data as the result
      return chunk;
      
    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}