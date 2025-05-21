/**
 * Utility functions for implementing retry logic with exponential backoff.
 * Provides configurable retry strategies, backoff calculations, and integration
 * with the transient exception system to handle temporary failures gracefully.
 */

import { Logger } from '@nestjs/common';
import { setTimeout } from 'timers/promises';

/**
 * Retry policy configuration for different operation types.
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Jitter strategy to use */
  jitterStrategy: JitterStrategy;
  /** Whether to apply delay before the first attempt */
  delayFirstAttempt: boolean;
}

/**
 * Available jitter strategies for retry operations.
 */
export enum JitterStrategy {
  /** No jitter, pure exponential backoff */
  NONE = 'none',
  /** Full jitter: random value between 0 and calculated delay */
  FULL = 'full',
  /** Equal jitter: half the calculated delay plus random value up to half the delay */
  EQUAL = 'equal',
  /** Decorrelated jitter: increases max jitter based on previous random value */
  DECORRELATED = 'decorrelated'
}

/**
 * Result of a retry operation.
 */
export interface RetryResult<T> {
  /** The result of the operation if successful */
  result?: T;
  /** The error that caused the operation to fail after all retries */
  error?: Error;
  /** Whether the operation was successful */
  success: boolean;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent in milliseconds */
  totalTimeMs: number;
}

/**
 * Context for retry operations, including attempt count and timing information.
 */
export interface RetryContext {
  /** Current attempt number (1-based) */
  attempt: number;
  /** Time when the first attempt was made */
  startTime: number;
  /** Time elapsed since the first attempt in milliseconds */
  elapsedTimeMs: number;
  /** Previous delay in milliseconds (0 for first attempt) */
  previousDelayMs: number;
}

/**
 * Options for retry operations.
 */
export interface RetryOptions<T> {
  /** Retry policy to use */
  policy?: Partial<RetryPolicy>;
  /** Function to determine if an error is retryable */
  isRetryable?: (error: Error, context: RetryContext) => boolean;
  /** Function to execute before each retry attempt */
  onRetry?: (error: Error, context: RetryContext) => void | Promise<void>;
  /** Function to execute when all retries are exhausted */
  onExhausted?: (error: Error, context: RetryContext) => void | Promise<void>;
  /** Logger instance to use */
  logger?: Logger;
}

/**
 * Default retry policies for different operation types.
 */
export const DEFAULT_RETRY_POLICIES: Record<string, RetryPolicy> = {
  default: {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterStrategy: JitterStrategy.FULL,
    delayFirstAttempt: false,
  },
  kafka: {
    maxAttempts: 5,
    initialDelayMs: 200,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterStrategy: JitterStrategy.FULL,
    delayFirstAttempt: false,
  },
  database: {
    maxAttempts: 3,
    initialDelayMs: 50,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterStrategy: JitterStrategy.EQUAL,
    delayFirstAttempt: false,
  },
  http: {
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterStrategy: JitterStrategy.FULL,
    delayFirstAttempt: false,
  },
  event: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    jitterStrategy: JitterStrategy.DECORRELATED,
    delayFirstAttempt: false,
  },
};

/**
 * Calculates the delay for a retry attempt using exponential backoff with jitter.
 * 
 * @param attempt Current attempt number (1-based)
 * @param policy Retry policy configuration
 * @param previousDelayMs Previous delay in milliseconds (for decorrelated jitter)
 * @returns Delay in milliseconds for the next retry attempt
 */
export function calculateBackoffDelay(
  attempt: number,
  policy: RetryPolicy,
  previousDelayMs = 0,
): number {
  // For the first attempt, check if we should delay
  if (attempt === 1 && !policy.delayFirstAttempt) {
    return 0;
  }

  // Calculate base exponential delay
  const exponentialDelay = Math.min(
    policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1),
    policy.maxDelayMs
  );

  // Apply jitter based on the selected strategy
  switch (policy.jitterStrategy) {
    case JitterStrategy.NONE:
      return exponentialDelay;

    case JitterStrategy.FULL:
      // Random value between 0 and exponentialDelay
      return Math.floor(Math.random() * exponentialDelay);

    case JitterStrategy.EQUAL:
      // Half the delay plus random value up to half the delay
      const halfDelay = exponentialDelay / 2;
      return Math.floor(halfDelay + (Math.random() * halfDelay));

    case JitterStrategy.DECORRELATED:
      // Base + random value between 0 and (base * 3 - previous)
      const temp = Math.min(
        policy.maxDelayMs,
        Math.random() * 3 * exponentialDelay
      );
      return Math.floor(Math.max(previousDelayMs, temp));

    default:
      return exponentialDelay;
  }
}

/**
 * Default function to determine if an error is retryable.
 * Checks if the error is an instance of TransientException or has a retryable property.
 * 
 * @param error The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: Error): boolean {
  // Check for TransientException (will be implemented in transient.exception.ts)
  if (error.constructor.name === 'TransientException') {
    return true;
  }

  // Check for retryable property
  return (
    error instanceof Error &&
    (error as any).retryable === true
  );
}

/**
 * Executes an asynchronous operation with retry logic using exponential backoff.
 * 
 * @param operation The operation to execute and potentially retry
 * @param options Retry options
 * @returns A promise that resolves to the result of the operation or rejects with the last error
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions<T> = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const logger = options.logger || new Logger('RetryUtils');
  
  // Merge provided policy with default policy
  const policy: RetryPolicy = {
    ...DEFAULT_RETRY_POLICIES.default,
    ...(options.policy || {}),
  };

  // Use provided isRetryable function or default
  const isRetryable = options.isRetryable || isRetryableError;
  
  let attempt = 0;
  let previousDelayMs = 0;
  let lastError: Error | undefined;

  while (attempt < policy.maxAttempts) {
    attempt++;
    
    try {
      // Calculate delay for this attempt
      const delayMs = calculateBackoffDelay(attempt, policy, previousDelayMs);
      previousDelayMs = delayMs;
      
      // Wait before attempt if needed
      if (delayMs > 0) {
        await setTimeout(delayMs);
      }
      
      // Execute the operation
      const result = await operation();
      
      // Return successful result
      return {
        result,
        success: true,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      
      // Create retry context
      const context: RetryContext = {
        attempt,
        startTime,
        elapsedTimeMs: Date.now() - startTime,
        previousDelayMs,
      };
      
      // Check if we should retry
      const shouldRetry = 
        attempt < policy.maxAttempts && 
        isRetryable(lastError, context);
      
      if (shouldRetry) {
        // Call onRetry callback if provided
        if (options.onRetry) {
          await options.onRetry(lastError, context);
        }
        
        logger.debug(
          `Retry attempt ${attempt}/${policy.maxAttempts} after ${previousDelayMs}ms delay`,
          {
            error: lastError.message,
            attempt,
            maxAttempts: policy.maxAttempts,
            delayMs: previousDelayMs,
            elapsedTimeMs: context.elapsedTimeMs,
          }
        );
      } else {
        // Call onExhausted callback if provided
        if (options.onExhausted) {
          await options.onExhausted(lastError, context);
        }
        
        logger.warn(
          `Retry exhausted after ${attempt} attempts and ${context.elapsedTimeMs}ms`,
          {
            error: lastError.message,
            attempts: attempt,
            maxAttempts: policy.maxAttempts,
            totalTimeMs: context.elapsedTimeMs,
          }
        );
        
        break;
      }
    }
  }
  
  // Return failed result
  return {
    error: lastError,
    success: false,
    attempts: attempt,
    totalTimeMs: Date.now() - startTime,
  };
}

/**
 * Decorator for retrying class methods with exponential backoff.
 * 
 * @param policyOrOptions Retry policy or options
 * @returns Method decorator
 */
export function Retry(policyOrOptions: Partial<RetryPolicy> | RetryOptions<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);
    
    // Determine if we received a policy or options
    const options: RetryOptions<any> = {
      logger,
      ...(('policy' in policyOrOptions) ? policyOrOptions : { policy: policyOrOptions }),
    };
    
    descriptor.value = async function (...args: any[]) {
      const operation = () => originalMethod.apply(this, args);
      const result = await retryAsync(operation, options);
      
      if (!result.success) {
        throw result.error;
      }
      
      return result.result;
    };
    
    return descriptor;
  };
}

/**
 * Executes an operation with retry logic and routes to a dead letter queue on failure.
 * 
 * @param operation The operation to execute
 * @param dlqHandler Function to handle dead letter queue routing
 * @param options Retry options
 * @returns A promise that resolves to the result of the operation
 */
export async function retryWithDLQ<T>(
  operation: () => Promise<T>,
  dlqHandler: (error: Error, context: RetryContext, data?: any) => Promise<void>,
  options: RetryOptions<T> & { data?: any } = {}
): Promise<T> {
  const retryOptions: RetryOptions<T> = {
    ...options,
    onExhausted: async (error, context) => {
      // Call original onExhausted if provided
      if (options.onExhausted) {
        await options.onExhausted(error, context);
      }
      
      // Route to dead letter queue
      await dlqHandler(error, context, options.data);
    },
  };
  
  const result = await retryAsync(operation, retryOptions);
  
  if (!result.success) {
    throw result.error;
  }
  
  return result.result as T;
}

/**
 * Creates a retry policy for a specific operation type.
 * 
 * @param type Operation type (kafka, database, http, event)
 * @param overrides Policy overrides
 * @returns Complete retry policy
 */
export function createRetryPolicy(
  type: keyof typeof DEFAULT_RETRY_POLICIES | string,
  overrides: Partial<RetryPolicy> = {}
): RetryPolicy {
  const basePolicy = DEFAULT_RETRY_POLICIES[type] || DEFAULT_RETRY_POLICIES.default;
  
  return {
    ...basePolicy,
    ...overrides,
  };
}