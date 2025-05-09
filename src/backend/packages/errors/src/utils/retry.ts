/**
 * @file retry.ts
 * @description Provides a robust, configurable retry mechanism with exponential backoff
 * for handling transient errors across the AUSTA SuperApp. Implements functions for
 * retrying asynchronous operations with customizable delay, jitter, max attempts,
 * and success conditions.
 */

import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';
import { BaseError, ErrorType, JourneyContext } from '../base';
import { DEFAULT_RETRY_CONFIG, DATABASE_RETRY_CONFIG, EXTERNAL_API_RETRY_CONFIG, 
         KAFKA_RETRY_CONFIG, HEALTH_INTEGRATION_RETRY_CONFIG, 
         DEVICE_SYNC_RETRY_CONFIG, NOTIFICATION_RETRY_CONFIG } from '../constants';

/**
 * Configuration options for retry operations.
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;
  
  /**
   * Initial delay in milliseconds before the first retry
   */
  initialDelayMs: number;
  
  /**
   * Factor by which the delay increases with each retry (exponential backoff)
   */
  backoffFactor: number;
  
  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelayMs: number;
  
  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems
   */
  useJitter: boolean;
  
  /**
   * Maximum jitter percentage (0-1) to apply to the delay
   */
  jitterFactor: number;
  
  /**
   * Optional function to determine if an error is retryable
   */
  isRetryable?: (error: unknown) => boolean;
  
  /**
   * Optional function to determine if the operation was successful
   */
  isSuccess?: (result: any) => boolean;
  
  /**
   * Optional function to execute before each retry attempt
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  
  /**
   * Optional function to execute when all retry attempts are exhausted
   */
  onExhausted?: (error: unknown, attempts: number) => void;
  
  /**
   * Optional function to execute when the operation succeeds after retries
   */
  onSuccess?: (result: any, attempts: number) => void;
  
  /**
   * Optional context for the retry operation (e.g., journey, operation name)
   */
  context?: {
    journey?: JourneyContext;
    operation?: string;
    [key: string]: any;
  };
}

/**
 * Predefined retry configurations for different types of operations.
 */
export const RetryConfigs = {
  /**
   * Default retry configuration for general operations
   */
  DEFAULT: {
    maxAttempts: DEFAULT_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: DEFAULT_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: DEFAULT_RETRY_CONFIG.USE_JITTER,
    jitterFactor: DEFAULT_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for database operations
   */
  DATABASE: {
    maxAttempts: DATABASE_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: DATABASE_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: DATABASE_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: DATABASE_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: DATABASE_RETRY_CONFIG.USE_JITTER,
    jitterFactor: DATABASE_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for external API calls
   */
  EXTERNAL_API: {
    maxAttempts: EXTERNAL_API_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: EXTERNAL_API_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: EXTERNAL_API_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: EXTERNAL_API_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: EXTERNAL_API_RETRY_CONFIG.USE_JITTER,
    jitterFactor: EXTERNAL_API_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for Kafka event processing
   */
  KAFKA: {
    maxAttempts: KAFKA_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: KAFKA_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: KAFKA_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: KAFKA_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: KAFKA_RETRY_CONFIG.USE_JITTER,
    jitterFactor: KAFKA_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for health-related external integrations
   */
  HEALTH_INTEGRATION: {
    maxAttempts: HEALTH_INTEGRATION_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: HEALTH_INTEGRATION_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: HEALTH_INTEGRATION_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: HEALTH_INTEGRATION_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: HEALTH_INTEGRATION_RETRY_CONFIG.USE_JITTER,
    jitterFactor: HEALTH_INTEGRATION_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for device synchronization
   */
  DEVICE_SYNC: {
    maxAttempts: DEVICE_SYNC_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: DEVICE_SYNC_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: DEVICE_SYNC_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: DEVICE_SYNC_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: DEVICE_SYNC_RETRY_CONFIG.USE_JITTER,
    jitterFactor: DEVICE_SYNC_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig,
  
  /**
   * Retry configuration optimized for notification delivery
   */
  NOTIFICATION: {
    maxAttempts: NOTIFICATION_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelayMs: NOTIFICATION_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: NOTIFICATION_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelayMs: NOTIFICATION_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: NOTIFICATION_RETRY_CONFIG.USE_JITTER,
    jitterFactor: NOTIFICATION_RETRY_CONFIG.JITTER_FACTOR
  } as RetryConfig
};

/**
 * Calculates the delay time for a retry attempt using exponential backoff with optional jitter.
 * 
 * @param attempt - Current retry attempt number (1-based)
 * @param config - Retry configuration
 * @returns Delay time in milliseconds
 */
export function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Calculate base delay with exponential backoff
  const baseDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelayMs
  );
  
  // Add jitter if enabled
  if (config.useJitter) {
    // Apply jitter as a random factor between (1 - jitterFactor) and 1
    const jitterMultiplier = 1 - config.jitterFactor * Math.random();
    return Math.floor(baseDelay * jitterMultiplier);
  }
  
  return Math.floor(baseDelay);
}

/**
 * Determines if an error is retryable based on its type and properties.
 * 
 * @param error - The error to check
 * @returns True if the error is retryable, false otherwise
 */
export function isRetryableError(error: unknown): boolean {
  // If it's a BaseError, use its isRetryable method
  if (error instanceof BaseError) {
    return error.isRetryable();
  }
  
  // For standard errors, check if it's a network or timeout error
  if (error instanceof Error) {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();
    
    // Check for common network-related errors
    const isNetworkError = 
      errorName.includes('network') || 
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('socket');
    
    // Check for timeout errors
    const isTimeoutError = 
      errorName.includes('timeout') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out');
    
    // Check for rate limiting errors
    const isRateLimitError = 
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('429');
    
    // Check for temporary server errors
    const isServerError = 
      errorMessage.includes('server error') ||
      errorMessage.includes('5') ||
      errorMessage.includes('503') ||
      errorMessage.includes('502');
    
    return isNetworkError || isTimeoutError || isRateLimitError || isServerError;
  }
  
  // For unknown error types, default to not retryable
  return false;
}

/**
 * Creates a promise that resolves after a specified delay.
 * 
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an asynchronous function with exponential backoff.
 * 
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  // Merge with default configuration
  const fullConfig: RetryConfig = {
    ...RetryConfigs.DEFAULT,
    ...config
  };
  
  // Use provided isRetryable function or fall back to the default
  const isRetryableFn = fullConfig.isRetryable || isRetryableError;
  
  // Create a span for the retry operation if OpenTelemetry is available
  const tracer = trace.getTracer('austa-errors');
  const operationName = fullConfig.context?.operation || 'retry.operation';
  
  return tracer.startActiveSpan(`${operationName} with retry`, { kind: SpanKind.INTERNAL }, async (span) => {
    let lastError: unknown;
    let attempts = 0;
    
    // Add retry configuration to span attributes
    span.setAttribute('retry.max_attempts', fullConfig.maxAttempts);
    span.setAttribute('retry.initial_delay_ms', fullConfig.initialDelayMs);
    span.setAttribute('retry.backoff_factor', fullConfig.backoffFactor);
    
    // Add journey context to span if available
    if (fullConfig.context?.journey) {
      span.setAttribute('journey', fullConfig.context.journey);
    }
    
    try {
      while (true) {
        attempts++;
        span.setAttribute('retry.current_attempt', attempts);
        
        try {
          // Execute the function
          const result = await fn();
          
          // Check if the result is considered successful
          if (!fullConfig.isSuccess || fullConfig.isSuccess(result)) {
            // Call onSuccess callback if provided
            if (fullConfig.onSuccess && attempts > 1) {
              fullConfig.onSuccess(result, attempts);
            }
            
            // Record success in the span
            span.setStatus({ code: SpanStatusCode.OK });
            if (attempts > 1) {
              span.setAttribute('retry.successful', true);
              span.setAttribute('retry.attempts', attempts);
            }
            
            return result;
          }
          
          // If the result is not considered successful, treat it as a retryable error
          lastError = new Error('Operation did not meet success criteria');
        } catch (error) {
          lastError = error;
          
          // Record error in the span
          span.recordException(error instanceof Error ? error : new Error(String(error)));
          
          // If the error is not retryable or we've reached max attempts, throw it
          if (!isRetryableFn(error) || attempts >= fullConfig.maxAttempts) {
            throw error;
          }
        }
        
        // If we've reached max attempts, call onExhausted and throw the last error
        if (attempts >= fullConfig.maxAttempts) {
          if (fullConfig.onExhausted) {
            fullConfig.onExhausted(lastError, attempts);
          }
          
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Retry attempts exhausted'
          });
          span.setAttribute('retry.exhausted', true);
          span.setAttribute('retry.attempts', attempts);
          
          throw lastError;
        }
        
        // Calculate delay for the next retry
        const delayMs = calculateBackoff(attempts, fullConfig);
        
        // Call onRetry callback if provided
        if (fullConfig.onRetry) {
          fullConfig.onRetry(lastError, attempts, delayMs);
        }
        
        // Record retry in the span
        span.addEvent('retry.attempt', {
          'retry.attempt': attempts,
          'retry.delay_ms': delayMs,
          'error.type': lastError instanceof Error ? lastError.name : typeof lastError,
          'error.message': lastError instanceof Error ? lastError.message : String(lastError)
        });
        
        // Wait before the next retry
        await delay(delayMs);
      }
    } finally {
      span.end();
    }
  });
}

/**
 * Creates a retryable version of an async function with predefined retry configuration.
 * 
 * @param fn - Async function to make retryable
 * @param config - Retry configuration
 * @returns A new function that will retry the original function according to the configuration
 */
export function createRetryableFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return retryWithBackoff(() => fn(...args), config) as ReturnType<T>;
  }) as T;
}

/**
 * Retries a synchronous function with exponential backoff.
 * 
 * @param fn - Synchronous function to retry
 * @param config - Retry configuration
 * @returns The function result or throws the last error
 */
export function retryWithBackoffSync<T>(
  fn: () => T,
  config: Partial<RetryConfig> = {}
): T {
  // Merge with default configuration
  const fullConfig: RetryConfig = {
    ...RetryConfigs.DEFAULT,
    ...config
  };
  
  // Use provided isRetryable function or fall back to the default
  const isRetryableFn = fullConfig.isRetryable || isRetryableError;
  
  let lastError: unknown;
  let attempts = 0;
  
  while (true) {
    attempts++;
    
    try {
      // Execute the function
      const result = fn();
      
      // Check if the result is considered successful
      if (!fullConfig.isSuccess || fullConfig.isSuccess(result)) {
        // Call onSuccess callback if provided
        if (fullConfig.onSuccess && attempts > 1) {
          fullConfig.onSuccess(result, attempts);
        }
        
        return result;
      }
      
      // If the result is not considered successful, treat it as a retryable error
      lastError = new Error('Operation did not meet success criteria');
    } catch (error) {
      lastError = error;
      
      // If the error is not retryable or we've reached max attempts, throw it
      if (!isRetryableFn(error) || attempts >= fullConfig.maxAttempts) {
        throw error;
      }
    }
    
    // If we've reached max attempts, call onExhausted and throw the last error
    if (attempts >= fullConfig.maxAttempts) {
      if (fullConfig.onExhausted) {
        fullConfig.onExhausted(lastError, attempts);
      }
      
      throw lastError;
    }
    
    // Calculate delay for the next retry
    const delayMs = calculateBackoff(attempts, fullConfig);
    
    // Call onRetry callback if provided
    if (fullConfig.onRetry) {
      fullConfig.onRetry(lastError, attempts, delayMs);
    }
    
    // Wait before the next retry (synchronous version uses a blocking wait)
    const startTime = Date.now();
    while (Date.now() - startTime < delayMs) {
      // Busy wait
    }
  }
}

/**
 * Creates a retryable version of a synchronous function with predefined retry configuration.
 * 
 * @param fn - Synchronous function to make retryable
 * @param config - Retry configuration
 * @returns A new function that will retry the original function according to the configuration
 */
export function createRetryableFunctionSync<T extends (...args: any[]) => any>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return retryWithBackoffSync(() => fn(...args), config) as ReturnType<T>;
  }) as T;
}

/**
 * Specialized retry function for database operations.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with DATABASE preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryDatabaseOperation<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.DATABASE,
    ...config
  });
}

/**
 * Specialized retry function for external API calls.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with EXTERNAL_API preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryExternalApiCall<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.EXTERNAL_API,
    ...config
  });
}

/**
 * Specialized retry function for Kafka event processing.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with KAFKA preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryKafkaOperation<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.KAFKA,
    ...config
  });
}

/**
 * Specialized retry function for health-related external integrations.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with HEALTH_INTEGRATION preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryHealthIntegration<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.HEALTH_INTEGRATION,
    ...config
  });
}

/**
 * Specialized retry function for device synchronization.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with DEVICE_SYNC preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryDeviceSync<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.DEVICE_SYNC,
    ...config
  });
}

/**
 * Specialized retry function for notification delivery.
 * 
 * @param fn - Async function to retry
 * @param config - Additional retry configuration to merge with NOTIFICATION preset
 * @returns Promise that resolves with the function result or rejects with the last error
 */
export function retryNotificationDelivery<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...RetryConfigs.NOTIFICATION,
    ...config
  });
}