import { Logger } from '@nestjs/common';
import { BaseError, ErrorType } from '@austa/errors';
import { TransientException } from './transient.exception';

/**
 * @fileoverview
 * Utility functions for implementing retry logic with exponential backoff.
 * 
 * This module provides a comprehensive set of utilities for handling transient errors
 * through configurable retry strategies. It includes exponential backoff with jitter,
 * specialized retry functions for different operation types (Kafka, database, external APIs),
 * and integration with the dead letter queue system for failed operations.
 * 
 * The retry utilities are designed to work with the TransientException system to provide
 * consistent error handling and recovery strategies across the gamification engine.
 * 
 * @example Basic usage
 * ```typescript
 * import { retryAsync } from '@app/common/exceptions/retry.utils';
 * 
 * async function fetchData() {
 *   return retryAsync(
 *     async () => {
 *       // Operation that might fail transiently
 *       return await apiClient.getData();
 *     },
 *     { operationType: 'externalApi' }
 *   );
 * }
 * ```
 */

/**
 * Retry policy configuration for different operation types.
 * Each operation type can have its own retry configuration.
 * 
 * @interface RetryPolicy
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  
  /** Factor by which the delay increases with each retry */
  backoffFactor: number;
  
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  
  /** Whether to add jitter to the delay to prevent thundering herd problems */
  useJitter: boolean;
}

/**
 * Default retry policies for different operation types.
 * These can be overridden by providing custom policies.
 */
export const DEFAULT_RETRY_POLICIES: Record<string, RetryPolicy> = {
  // Default policy for most operations
  default: {
    maxRetries: 3,
    initialDelayMs: 1000, // 1 second
    backoffFactor: 2,
    maxDelayMs: 30000, // 30 seconds
    useJitter: true,
  },
  
  // Policy for database operations
  database: {
    maxRetries: 5,
    initialDelayMs: 500, // 0.5 seconds
    backoffFactor: 1.5,
    maxDelayMs: 10000, // 10 seconds
    useJitter: true,
  },
  
  // Policy for Kafka operations
  kafka: {
    maxRetries: 10,
    initialDelayMs: 1000, // 1 second
    backoffFactor: 2,
    maxDelayMs: 60000, // 1 minute
    useJitter: true,
  },
  
  // Policy for external API calls
  externalApi: {
    maxRetries: 3,
    initialDelayMs: 2000, // 2 seconds
    backoffFactor: 3,
    maxDelayMs: 45000, // 45 seconds
    useJitter: true,
  },
};

/**
 * Options for retry operations.
 */
export interface RetryOptions {
  /** Operation type used to determine the retry policy */
  operationType?: string;
  
  /** Custom retry policy to override the default for the operation type */
  retryPolicy?: RetryPolicy;
  
  /** Logger instance for logging retry attempts */
  logger?: Logger;
  
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: Error) => boolean;
  
  /** Function to execute before each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  
  /** Function to execute when all retries are exhausted */
  onExhausted?: (error: Error, attempts: number) => void;
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff.
 * 
 * @param attempt - Current retry attempt (0-based)
 * @param policy - Retry policy configuration
 * @returns Delay in milliseconds for the next retry
 */
export function calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
  // Calculate exponential backoff: initialDelay * (backoffFactor ^ attempt)
  const exponentialDelay = policy.initialDelayMs * Math.pow(policy.backoffFactor, attempt);
  
  // Cap the delay at the maximum delay
  let delay = Math.min(exponentialDelay, policy.maxDelayMs);
  
  // Add jitter if enabled (±25% randomization)
  if (policy.useJitter) {
    const jitterFactor = 0.75 + (Math.random() * 0.5); // Random value between 0.75 and 1.25
    delay = Math.floor(delay * jitterFactor);
  }
  
  return delay;
}

/**
 * Determines if an error is retryable based on its type and properties.
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: Error): boolean {
  // If it's already a TransientException, it's retryable
  if (error instanceof TransientException) {
    return !error.isMaxRetriesReached();
  }
  
  // If it's a BaseError from @austa/errors, check its type
  if (error instanceof BaseError) {
    return error.type === ErrorType.TRANSIENT;
  }
  
  // Check for common network/connection error patterns
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection reset') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('network') ||
    errorMessage.includes('temporarily unavailable') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('socket hang up')
  );
}

/**
 * Wraps an error in a TransientException if it's not already one.
 * 
 * @param error - The original error
 * @param operationType - Type of operation for retry configuration
 * @param retryCount - Current retry count
 * @param maxRetries - Maximum number of retries
 * @returns A TransientException
 */
export function wrapInTransientException(
  error: Error,
  operationType: string = 'default',
  retryCount: number = 0,
  maxRetries: number = DEFAULT_RETRY_POLICIES[operationType]?.maxRetries || 3
): TransientException {
  if (error instanceof TransientException) {
    return error;
  }
  
  return new TransientException(
    `Transient error during ${operationType} operation: ${error.message}`,
    {
      cause: error,
      details: {
        originalError: error.name,
        originalStack: error.stack,
      },
      retryCount,
      operationType,
      maxRetries,
    }
  );
}

/**
 * Executes an asynchronous function with retry capability.
 * 
 * @param fn - The function to execute with retry capability
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the function
 * @throws The last error encountered if all retries fail
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const operationType = options.operationType || 'default';
  const policy = options.retryPolicy || DEFAULT_RETRY_POLICIES[operationType] || DEFAULT_RETRY_POLICIES.default;
  const logger = options.logger;
  const shouldRetry = options.shouldRetry || isRetryableError;
  
  let lastError: Error;
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if the error is retryable
      if (!shouldRetry(error)) {
        logger?.error(`Non-retryable error encountered: ${error.message}`, error.stack);
        throw error;
      }
      
      // Wrap in TransientException if it's not already one
      const transientError = wrapInTransientException(error, operationType, attempt, policy.maxRetries);
      
      // Check if we've reached the maximum number of retries
      if (attempt >= policy.maxRetries) {
        logger?.error(
          `All retry attempts (${attempt}) exhausted for ${operationType} operation: ${error.message}`,
          error.stack
        );
        
        if (options.onExhausted) {
          options.onExhausted(transientError, attempt);
        }
        
        throw transientError;
      }
      
      // Calculate delay for the next retry
      const delay = calculateBackoffDelay(attempt, policy);
      
      logger?.warn(
        `Retry attempt ${attempt + 1}/${policy.maxRetries} for ${operationType} operation after ${delay}ms: ${error.message}`
      );
      
      if (options.onRetry) {
        options.onRetry(transientError, attempt, delay);
      }
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment the attempt counter
      attempt++;
    }
  }
}

/**
 * Executes an asynchronous function with retry capability and fallback.
 * 
 * @param fn - The function to execute with retry capability
 * @param fallbackFn - Function to execute if all retries fail
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the function or fallback
 */
export async function retryWithFallback<T, F>(
  fn: () => Promise<T>,
  fallbackFn: (error: Error) => Promise<F>,
  options: RetryOptions = {}
): Promise<T | F> {
  try {
    return await retryAsync(fn, options);
  } catch (error) {
    const logger = options.logger;
    logger?.warn(`Executing fallback after retry failure: ${error.message}`);
    return await fallbackFn(error);
  }
}

/**
 * Creates a function that will retry the original function when called.
 * 
 * @param fn - The function to wrap with retry capability
 * @param options - Configuration options for the retry mechanism
 * @returns A function that will retry the original function when called
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return retryAsync(() => fn(...args), options) as Promise<ReturnType<T>>;
  }) as T;
}

/**
 * Executes a function with retry capability for Kafka message processing.
 * Integrates with dead letter queue for failed messages.
 * 
 * @param fn - The function to execute with retry capability
 * @param message - The Kafka message being processed
 * @param sendToDlq - Function to send failed messages to dead letter queue
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the function
 */
export async function retryKafkaMessage<T>(
  fn: () => Promise<T>,
  message: any,
  sendToDlq: (message: any, error: Error) => Promise<void>,
  options: RetryOptions = { operationType: 'kafka' }
): Promise<T> {
  try {
    return await retryAsync(fn, {
      ...options,
      onExhausted: async (error, attempts) => {
        const logger = options.logger;
        logger?.error(
          `Message processing failed after ${attempts} attempts, sending to DLQ: ${error.message}`,
          { messageKey: message.key, topic: message.topic, partition: message.partition }
        );
        
        // Send to dead letter queue
        await sendToDlq(message, error);
        
        // Call the original onExhausted if provided
        if (options.onExhausted) {
          options.onExhausted(error, attempts);
        }
      },
    });
  } catch (error) {
    // This will only be reached if sendToDlq fails
    const logger = options.logger;
    logger?.error(
      `Critical error: Failed to send message to DLQ: ${error.message}`,
      { messageKey: message.key, topic: message.topic, partition: message.partition, error }
    );
    throw error;
  }
}

/**
 * Executes a database operation with retry capability.
 * Optimized for database-specific transient errors.
 * 
 * @param fn - The database operation to execute
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the operation
 */
export async function retryDatabaseOperation<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { operationType: 'database' }
): Promise<T> {
  return retryAsync(fn, {
    ...options,
    shouldRetry: (error) => {
      // Check for database-specific transient errors
      if (error.message.includes('deadlock') ||
          error.message.includes('lock timeout') ||
          error.message.includes('too many connections') ||
          error.message.includes('connection pool') ||
          error.message.includes('PrismaClientInitializationError') ||
          error.message.includes('PrismaClientRustPanicError')) {
        return true;
      }
      
      // Fall back to the default check
      return options.shouldRetry ? options.shouldRetry(error) : isRetryableError(error);
    },
  });
}

/**
 * Executes an external API call with retry capability.
 * Optimized for HTTP-specific transient errors.
 * 
 * @param fn - The API call to execute
 * @param options - Configuration options for the retry mechanism
 * @returns A promise that resolves with the result of the API call
 */
export async function retryExternalApiCall<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { operationType: 'externalApi' }
): Promise<T> {
  return retryAsync(fn, {
    ...options,
    shouldRetry: (error) => {
      // Check for HTTP-specific transient errors
      const status = (error as any).status || (error as any).statusCode;
      if (status) {
        // Retry on 429 (Too Many Requests), 503 (Service Unavailable), 504 (Gateway Timeout)
        return [429, 503, 504].includes(status);
      }
      
      // Fall back to the default check
      return options.shouldRetry ? options.shouldRetry(error) : isRetryableError(error);
    },
  });
}

/**
 * Creates a decorator that can be applied to class methods to add retry capability.
 * 
 * @param options - Configuration options for the retry mechanism
 * @returns A method decorator that adds retry capability to the decorated method
 * 
 * @example
 * ```typescript
 * class UserService {
 *   @Retryable({ operationType: 'database' })
 *   async findUserById(id: string): Promise<User> {
 *     return this.userRepository.findOne(id);
 *   }
 * }
 * ```
 */
export function Retryable(options: RetryOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      return retryAsync(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}

/**
 * Utility class for tracking and managing retry state across multiple operations.
 * Useful for complex workflows that may need to retry at different stages.
 */
export class RetryTracker {
  private attempts: Map<string, number> = new Map();
  private readonly policy: RetryPolicy;
  private readonly logger?: Logger;
  
  /**
   * Creates a new RetryTracker instance.
   * 
   * @param operationType - Type of operation for retry configuration
   * @param options - Additional options for the retry tracker
   */
  constructor(
    private readonly operationType: string = 'default',
    options: { policy?: RetryPolicy; logger?: Logger } = {}
  ) {
    this.policy = options.policy || DEFAULT_RETRY_POLICIES[operationType] || DEFAULT_RETRY_POLICIES.default;
    this.logger = options.logger;
  }
  
  /**
   * Gets the current attempt count for an operation.
   * 
   * @param operationId - Unique identifier for the operation
   * @returns Current attempt count (0-based)
   */
  getAttempt(operationId: string): number {
    return this.attempts.get(operationId) || 0;
  }
  
  /**
   * Increments the attempt count for an operation.
   * 
   * @param operationId - Unique identifier for the operation
   * @returns New attempt count
   */
  incrementAttempt(operationId: string): number {
    const currentAttempt = this.getAttempt(operationId);
    const newAttempt = currentAttempt + 1;
    this.attempts.set(operationId, newAttempt);
    return newAttempt;
  }
  
  /**
   * Checks if the maximum number of retries has been reached for an operation.
   * 
   * @param operationId - Unique identifier for the operation
   * @returns True if max retries reached, false otherwise
   */
  isMaxRetriesReached(operationId: string): boolean {
    return this.getAttempt(operationId) >= this.policy.maxRetries;
  }
  
  /**
   * Calculates the delay for the next retry attempt.
   * 
   * @param operationId - Unique identifier for the operation
   * @returns Delay in milliseconds for the next retry
   */
  getNextDelay(operationId: string): number {
    const attempt = this.getAttempt(operationId);
    return calculateBackoffDelay(attempt, this.policy);
  }
  
  /**
   * Executes an operation with retry capability, tracking attempts by operation ID.
   * 
   * @param operationId - Unique identifier for the operation
   * @param fn - The function to execute with retry capability
   * @returns A promise that resolves with the result of the function
   */
  async execute<T>(operationId: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      // Check if the error is retryable
      if (!isRetryableError(error)) {
        this.logger?.error(`Non-retryable error for operation ${operationId}: ${error.message}`);
        throw error;
      }
      
      // Increment attempt count
      const attempt = this.incrementAttempt(operationId);
      
      // Check if we've reached the maximum number of retries
      if (this.isMaxRetriesReached(operationId)) {
        this.logger?.error(
          `All retry attempts (${attempt}) exhausted for operation ${operationId}: ${error.message}`
        );
        throw wrapInTransientException(error, this.operationType, attempt, this.policy.maxRetries);
      }
      
      // Calculate delay for the next retry
      const delay = this.getNextDelay(operationId);
      
      this.logger?.warn(
        `Retry attempt ${attempt}/${this.policy.maxRetries} for operation ${operationId} after ${delay}ms: ${error.message}`
      );
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive retry
      return this.execute(operationId, fn);
    }
  }
  
  /**
   * Resets the attempt count for an operation.
   * 
   * @param operationId - Unique identifier for the operation
   */
  reset(operationId: string): void {
    this.attempts.delete(operationId);
  }
  
  /**
   * Resets all attempt counts.
   */
  resetAll(): void {
    this.attempts.clear();
  }
}