/**
 * @file retry.decorator.ts
 * @description Provides method decorators for implementing retry logic with various strategies.
 * These decorators can be applied to async methods to automatically retry operations
 * that fail with specific error types, with customizable delay, jitter, and max attempts.
 */

import { Logger } from '@nestjs/common';
import { BaseError, ErrorType } from '../base';
import { BackoffStrategy, RetryOptions, isRetryOptions } from './types';
import { 
  DEFAULT_RETRY_CONFIG, 
  ERROR_TYPE_TO_RETRY_CONFIG,
  HEALTH_INTEGRATION_RETRY_CONFIG,
  DEVICE_SYNC_RETRY_CONFIG,
  KAFKA_RETRY_CONFIG,
  DATABASE_RETRY_CONFIG,
  EXTERNAL_API_RETRY_CONFIG
} from '../constants';

// Create a logger instance for retry operations
const logger = new Logger('RetryDecorator');

/**
 * Calculates the delay for the next retry attempt based on the backoff strategy.
 * 
 * @param attempt - Current attempt number (1-based)
 * @param options - Retry configuration options
 * @returns Delay in milliseconds for the next retry
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const {
    baseDelay = DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy = BackoffStrategy.EXPONENTIAL,
    maxDelay = DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
    jitter = DEFAULT_RETRY_CONFIG.JITTER_FACTOR
  } = options;

  let delay: number;

  switch (backoffStrategy) {
    case BackoffStrategy.FIXED:
      delay = baseDelay;
      break;
    case BackoffStrategy.LINEAR:
      delay = baseDelay * attempt;
      break;
    case BackoffStrategy.EXPONENTIAL:
    default:
      delay = baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1);
      break;
  }

  // Apply maximum delay constraint
  delay = Math.min(delay, maxDelay);

  // Apply jitter to prevent thundering herd problem
  if (jitter > 0) {
    const jitterAmount = delay * jitter;
    delay = delay - (jitterAmount / 2) + (Math.random() * jitterAmount);
  }

  return delay;
}

/**
 * Determines if an error should be retried based on the retry options.
 * 
 * @param error - The error that was thrown
 * @param attempt - Current attempt number (1-based)
 * @param options - Retry configuration options
 * @returns True if the error should be retried, false otherwise
 */
function shouldRetryError(error: Error, attempt: number, options: RetryOptions): boolean {
  // If a custom shouldRetry function is provided, use it
  if (options.shouldRetry) {
    return options.shouldRetry(error, attempt);
  }

  // If specific retryable error types are provided, check against them
  if (options.retryableErrors && options.retryableErrors.length > 0) {
    if (error instanceof BaseError) {
      return options.retryableErrors.includes(error.type);
    }
    return false;
  }

  // Default behavior: retry BaseErrors that are marked as retryable
  if (error instanceof BaseError) {
    return error.isRetryable();
  }

  // For non-BaseErrors, only retry if it's likely a transient issue
  // This is a simple heuristic and can be expanded as needed
  return error.message.toLowerCase().includes('timeout') ||
         error.message.toLowerCase().includes('connection') ||
         error.message.toLowerCase().includes('network') ||
         error.message.toLowerCase().includes('temporarily unavailable');
}

/**
 * Implements a sleep function using Promises.
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formats a retry attempt log message with consistent structure.
 * 
 * @param propertyKey - Method name being retried
 * @param attempt - Current attempt number
 * @param maxAttempts - Maximum number of attempts
 * @param error - The error that triggered the retry
 * @param delay - Delay before the next retry attempt
 * @returns Formatted log message
 */
function formatRetryLogMessage(
  propertyKey: string | symbol,
  attempt: number,
  maxAttempts: number,
  error: Error,
  delay: number
): string {
  return (
    `[Retry] Method ${String(propertyKey)} failed on attempt ${attempt}/${maxAttempts}. ` +
    `Error: ${error.message}. ` +
    `Retrying in ${delay}ms...`
  );
}

/**
 * Formats a retry failure log message with consistent structure.
 * 
 * @param propertyKey - Method name that failed
 * @param attempts - Number of attempts made
 * @param error - The error that caused the failure
 * @returns Formatted log message
 */
function formatRetryFailureLogMessage(
  propertyKey: string | symbol,
  attempts: number,
  error: Error
): string {
  return (
    `[Retry] Method ${String(propertyKey)} failed after ${attempts} attempts. ` +
    `Last error: ${error.message}. Giving up.`
  );
}

/**
 * Decorator that adds retry capability to a method.
 * Automatically retries the method execution when it fails with retryable errors.
 * 
 * @param options - Configuration options for the retry behavior
 * @returns Method decorator that adds retry capability
 * 
 * @example
 * // Retry up to 3 times with 1 second delay
 * @Retry({ maxAttempts: 3, baseDelay: 1000 })
 * async fetchData() {
 *   // Method implementation
 * }
 */
export function Retry(options: RetryOptions = {}): MethodDecorator {
  // Validate options
  if (!isRetryOptions(options)) {
    throw new Error('Invalid retry options provided to @Retry decorator');
  }

  // Set default options
  const retryOptions: RetryOptions = {
    maxAttempts: options.maxAttempts ?? DEFAULT_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: options.baseDelay ?? DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: options.backoffStrategy ?? BackoffStrategy.FIXED,
    maxDelay: options.maxDelay ?? DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: options.jitter ?? DEFAULT_RETRY_CONFIG.JITTER_FACTOR,
    retryableErrors: options.retryableErrors,
    shouldRetry: options.shouldRetry,
    onRetry: options.onRetry
  };

  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Store the original method
    const originalMethod = descriptor.value;

    // Replace the original method with the retry-enabled version
    descriptor.value = async function (...args: any[]) {
      let attempt = 1;
      const maxAttempts = retryOptions.maxAttempts!;

      // Loop until max attempts reached
      while (true) {
        try {
          // Attempt to execute the original method
          return await originalMethod.apply(this, args);
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          
          // Check if we've reached max attempts
          if (attempt >= maxAttempts) {
            const failureMessage = formatRetryFailureLogMessage(propertyKey, attempt, errorObj);
            logger.error(failureMessage, errorObj.stack);
            throw error;
          }

          // Check if this error should be retried
          if (!shouldRetryError(errorObj, attempt, retryOptions)) {
            logger.debug(
              `[Retry] Method ${String(propertyKey)} failed with non-retryable error. Giving up.`,
              errorObj.stack
            );
            throw error;
          }

          // Calculate delay for next retry
          const delay = calculateDelay(attempt, retryOptions);

          // Call onRetry callback if provided
          if (retryOptions.onRetry) {
            retryOptions.onRetry(errorObj, attempt, delay);
          }

          // Log retry attempt
          const retryMessage = formatRetryLogMessage(propertyKey, attempt, maxAttempts, errorObj, delay);
          logger.warn(retryMessage);

          // Wait before next attempt
          await sleep(delay);
          attempt++;
        }
      }
    };

    return descriptor;
  };
}

/**
 * Decorator that adds retry capability with exponential backoff to a method.
 * Automatically retries the method execution when it fails with retryable errors,
 * using an exponential backoff strategy to increase the delay between retries.
 * 
 * @param options - Configuration options for the retry behavior
 * @returns Method decorator that adds retry capability with exponential backoff
 * 
 * @example
 * // Retry up to 5 times with exponential backoff starting at 1 second
 * @RetryWithBackoff({ maxAttempts: 5, baseDelay: 1000 })
 * async fetchExternalData() {
 *   // Method implementation
 * }
 */
export function RetryWithBackoff(options: RetryOptions = {}): MethodDecorator {
  // Set exponential backoff strategy and merge with provided options
  return Retry({
    ...options,
    backoffStrategy: BackoffStrategy.EXPONENTIAL
  });
}

/**
 * Decorator that adds retry capability specifically for database operations.
 * Uses optimized retry settings for database transient errors.
 * 
 * @param options - Additional configuration options to override defaults
 * @returns Method decorator that adds database-optimized retry capability
 * 
 * @example
 * @RetryDatabase()
 * async findUserById(id: string) {
 *   // Database operation
 * }
 */
export function RetryDatabase(options: Partial<RetryOptions> = {}): MethodDecorator {
  return Retry({
    maxAttempts: DATABASE_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: DATABASE_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: BackoffStrategy.EXPONENTIAL,
    maxDelay: DATABASE_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: DATABASE_RETRY_CONFIG.JITTER_FACTOR,
    // Override with any provided options
    ...options
  });
}

/**
 * Decorator that adds retry capability specifically for external API calls.
 * Uses optimized retry settings for network and external service transient errors.
 * 
 * @param options - Additional configuration options to override defaults
 * @returns Method decorator that adds API-optimized retry capability
 * 
 * @example
 * @RetryExternalApi()
 * async fetchFromExternalApi() {
 *   // External API call
 * }
 */
export function RetryExternalApi(options: Partial<RetryOptions> = {}): MethodDecorator {
  return Retry({
    maxAttempts: EXTERNAL_API_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: EXTERNAL_API_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: BackoffStrategy.EXPONENTIAL,
    maxDelay: EXTERNAL_API_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: EXTERNAL_API_RETRY_CONFIG.JITTER_FACTOR,
    // Override with any provided options
    ...options
  });
}

/**
 * Decorator that adds retry capability specifically for health journey integrations.
 * Uses optimized retry settings for FHIR and healthcare data exchange.
 * 
 * @param options - Additional configuration options to override defaults
 * @returns Method decorator that adds health-optimized retry capability
 * 
 * @example
 * @RetryHealthIntegration()
 * async fetchPatientData() {
 *   // FHIR API call
 * }
 */
export function RetryHealthIntegration(options: Partial<RetryOptions> = {}): MethodDecorator {
  return Retry({
    maxAttempts: HEALTH_INTEGRATION_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: HEALTH_INTEGRATION_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: BackoffStrategy.EXPONENTIAL,
    maxDelay: HEALTH_INTEGRATION_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: HEALTH_INTEGRATION_RETRY_CONFIG.JITTER_FACTOR,
    // Override with any provided options
    ...options
  });
}

/**
 * Decorator that adds retry capability specifically for device synchronization.
 * Uses optimized retry settings for wearable device data synchronization.
 * 
 * @param options - Additional configuration options to override defaults
 * @returns Method decorator that adds device-optimized retry capability
 * 
 * @example
 * @RetryDeviceSync()
 * async synchronizeDeviceData() {
 *   // Device synchronization
 * }
 */
export function RetryDeviceSync(options: Partial<RetryOptions> = {}): MethodDecorator {
  return Retry({
    maxAttempts: DEVICE_SYNC_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: DEVICE_SYNC_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: BackoffStrategy.EXPONENTIAL,
    maxDelay: DEVICE_SYNC_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: DEVICE_SYNC_RETRY_CONFIG.JITTER_FACTOR,
    // Override with any provided options
    ...options
  });
}

/**
 * Decorator that adds retry capability specifically for Kafka event processing.
 * Uses optimized retry settings for event processing and message broker transient errors.
 * 
 * @param options - Additional configuration options to override defaults
 * @returns Method decorator that adds Kafka-optimized retry capability
 * 
 * @example
 * @RetryKafkaEvent()
 * async processEvent(event: KafkaEvent) {
 *   // Kafka event processing
 * }
 */
export function RetryKafkaEvent(options: Partial<RetryOptions> = {}): MethodDecorator {
  return Retry({
    maxAttempts: KAFKA_RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelay: KAFKA_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffStrategy: BackoffStrategy.EXPONENTIAL,
    maxDelay: KAFKA_RETRY_CONFIG.MAX_DELAY_MS,
    jitter: KAFKA_RETRY_CONFIG.JITTER_FACTOR,
    // Override with any provided options
    ...options
  });
}

/**
 * Decorator that adds retry capability with enhanced logging and metrics.
 * This decorator combines retry functionality with detailed logging and metrics
 * for better observability of retry operations.
 * 
 * @param options - Configuration options for the retry behavior
 * @param loggerContext - Optional logger context name for more specific logging
 * @returns Method decorator that adds retry capability with enhanced logging
 * 
 * @example
 * @RetryWithLogging({ maxAttempts: 3 }, 'PaymentService')
 * async processPayment(paymentId: string) {
 *   // Method implementation
 * }
 */
export function RetryWithLogging(
  options: RetryOptions = {}, 
  loggerContext?: string
): MethodDecorator {
  // Create a logger with the specified context or default to 'RetryWithLogging'
  const retryLogger = new Logger(loggerContext || 'RetryWithLogging');
  
  // Create a custom onRetry handler that logs detailed information
  const onRetry = (error: Error, attempt: number, delay: number) => {
    // Call the original onRetry if provided
    if (options.onRetry) {
      options.onRetry(error, attempt, delay);
    }
    
    // Log detailed retry information
    retryLogger.warn(
      `Retry attempt ${attempt} scheduled after error: ${error.message}. ` +
      `Next attempt in ${delay}ms. ` +
      `Error type: ${error instanceof BaseError ? error.type : 'unknown'}`,
      error instanceof BaseError ? error.toLogEntry() : { stack: error.stack }
    );
    
    // Here you could also emit metrics for retry attempts
    // This would typically integrate with your metrics system
    // Example: metricsService.incrementCounter('retry_attempts', { errorType: error.name });
  };
  
  // Return the Retry decorator with enhanced options
  return Retry({
    ...options,
    onRetry
  });
}