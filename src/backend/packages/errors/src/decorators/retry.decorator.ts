/**
 * @file Retry decorator implementation
 * 
 * This file provides method decorators for implementing retry logic with configurable options.
 * It exports both a simple `Retry` decorator for fixed-attempt retries and a more sophisticated
 * `RetryWithBackoff` decorator implementing exponential backoff strategy for transient errors.
 * 
 * These decorators can be applied to async methods to automatically retry operations that fail
 * with specific error types, with customizable delay, jitter, and max attempts.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Simple retry with fixed delay
 * @Retry({ maxAttempts: 3, delay: 1000 })
 * async fetchData(): Promise<Data> { ... }
 * 
 * // Retry with exponential backoff for transient errors
 * @RetryWithBackoff({
 *   maxAttempts: 5,
 *   delay: 500,
 *   backoffFactor: 2,
 *   maxDelay: 10000,
 *   retryCondition: (error) => error instanceof TransientError
 * })
 * async processPayment(paymentId: string): Promise<PaymentResult> { ... }
 * ```
 */

import { Logger } from '@nestjs/common';
import { RetryConfig } from './types';
import { ErrorType } from '../../categories/error-types';
import { AppException } from '../../base/app-exception';

/**
 * Default retry configuration values
 */
const DEFAULT_RETRY_CONFIG: Partial<RetryConfig> = {
  maxAttempts: 3,
  delay: 1000,
  backoffFactor: 1, // No backoff by default for simple Retry
  maxDelay: 30000,
  logError: true,
  errorType: ErrorType.TECHNICAL,
  errorCode: 'RETRY_EXHAUSTED',
};

/**
 * Default retry configuration values with exponential backoff
 */
const DEFAULT_BACKOFF_CONFIG: Partial<RetryConfig> = {
  ...DEFAULT_RETRY_CONFIG,
  backoffFactor: 2, // Exponential backoff by default
};

/**
 * Adds random jitter to the delay to prevent thundering herd problem
 * @param delay - Base delay in milliseconds
 * @param jitterFactor - Factor to determine maximum jitter (0.0 to 1.0)
 * @returns Delay with added random jitter
 */
function addJitter(delay: number, jitterFactor = 0.1): number {
  const maxJitter = delay * jitterFactor;
  const jitter = Math.random() * maxJitter;
  return delay + jitter;
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 * @param baseDelay - Initial delay in milliseconds
 * @param attempt - Current attempt number (starting from 1)
 * @param backoffFactor - Factor by which the delay increases with each retry
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Calculated delay with exponential backoff
 */
function calculateBackoffDelay(
  baseDelay: number,
  attempt: number,
  backoffFactor: number,
  maxDelay: number
): number {
  // Calculate exponential backoff: baseDelay * (backoffFactor ^ (attempt - 1))
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  // Apply jitter to prevent thundering herd problem
  const delayWithJitter = addJitter(exponentialDelay);
  // Ensure delay doesn't exceed maxDelay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Creates a sleep function that returns a promise resolving after the specified delay
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Default retry condition that always returns true
 * @param _error - The error to check
 * @returns Always true
 */
function defaultRetryCondition(_error: Error): boolean {
  return true;
}

/**
 * Internal type for retry attempt information
 * Used to provide context about retry attempts in logs
 * Not exposed in the public API to maintain compatibility with RetryConfig
 */
interface RetryAttemptInfo {
  /** Current attempt number (starting from 1) */
  attempt: number;
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Method name that is being retried */
  method: string;
  /** Delay before the next retry attempt in milliseconds */
  nextDelayMs?: number;
  /** Original error that caused the retry */
  error: Error;
  /** Timestamp when the retry was initiated */
  timestamp: number;
}

/**
 * Decorator factory for creating retry decorators with custom configurations
 * @param config - Retry configuration options
 * @param isBackoff - Whether to use exponential backoff strategy
 * @returns Method decorator that adds retry logic to the decorated method
 */
function createRetryDecorator<T = any>(
  config: RetryConfig<T>,
  isBackoff = false
): MethodDecorator {
  // Merge provided config with defaults
  const finalConfig: RetryConfig<T> = {
    ...(isBackoff ? DEFAULT_BACKOFF_CONFIG : DEFAULT_RETRY_CONFIG),
    ...config,
  };

  // Extract configuration options
  const {
    maxAttempts,
    delay,
    backoffFactor,
    maxDelay,
    retryCondition = defaultRetryCondition,
    onRetry,
    onMaxAttemptsReached,
    fallback,
    message = 'Maximum retry attempts reached',
    errorType,
    errorCode,
    logError,
  } = finalConfig;

  // Create logger instance
  const logger = new Logger('RetryDecorator');

  // Return the actual decorator function
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // Store the original method
    const originalMethod = descriptor.value;

    // Replace the original method with the wrapped version
    descriptor.value = async function (...args: any[]) {
      let lastError: Error;
      let attempt = 1;

      // Try the operation up to maxAttempts times
      while (attempt <= maxAttempts) {
        try {
          // Attempt to execute the original method
          return await originalMethod.apply(this, args);
        } catch (error) {
          // Store the error for potential later use
          lastError = error instanceof Error ? error : new Error(String(error));

          // Check if we should retry based on the error
          if (!retryCondition(lastError)) {
            if (logError) {
              logger.debug(
                `Retry condition not met for ${String(propertyKey)}, not retrying. Error: ${lastError.message}`
              );
            }
            throw lastError; // Don't retry if condition not met
          }

          // Check if we've reached the maximum attempts
          if (attempt >= maxAttempts) {
            if (logError) {
              logger.warn(
                `Maximum retry attempts (${maxAttempts}) reached for ${String(propertyKey)}. ` +
                `Last error: ${lastError.message}`
              );
            }

            // Call onMaxAttemptsReached callback if provided
            if (onMaxAttemptsReached) {
              // Create attempt info object for internal use
              const attemptInfo = {
                attempt,
                maxAttempts,
                method: String(propertyKey),
                error: lastError,
                timestamp: Date.now()
              };
              // Log detailed attempt information
              if (logError) {
                logger.warn(
                  `Max retry attempts reached: ${JSON.stringify({
                    attempt: attemptInfo.attempt,
                    maxAttempts: attemptInfo.maxAttempts,
                    method: attemptInfo.method,
                    errorMessage: attemptInfo.error.message,
                    timestamp: new Date(attemptInfo.timestamp).toISOString()
                  })}`
                );
              }
              // Call the callback with the original signature
              onMaxAttemptsReached(lastError, attempt);
            }

            // Use fallback if provided, otherwise throw the last error
            if (fallback) {
              return await fallback(lastError, ...args);
            }

            // Create a standardized AppException with the provided error details
            const retryExhaustedException = new AppException(
              message,
              errorType,
              errorCode,
              { 
                maxAttempts, 
                method: String(propertyKey),
                totalAttempts: attempt,
                lastErrorMessage: lastError.message,
                lastErrorStack: lastError.stack,
                timestamp: Date.now()
              },
              lastError
            );

            throw retryExhaustedException;
          }

          // Calculate the delay for the next retry
          let currentDelay: number;
          if (isBackoff) {
            currentDelay = calculateBackoffDelay(delay, attempt, backoffFactor, maxDelay);
          } else {
            currentDelay = addJitter(delay);
          }

          // Log retry attempt
          if (logError) {
            logger.debug(
              `Retry attempt ${attempt}/${maxAttempts} for ${String(propertyKey)} ` +
              `after ${currentDelay}ms. Error: ${lastError.message}`
            );
          }

          // Call onRetry callback if provided
          if (onRetry) {
            // Create attempt info object for internal use
            const attemptInfo = {
              attempt,
              maxAttempts,
              method: String(propertyKey),
              nextDelayMs: currentDelay,
              error: lastError,
              timestamp: Date.now()
            };
            // Log detailed attempt information
            if (logError) {
              logger.debug(
                `Retry details: ${JSON.stringify({
                  attempt: attemptInfo.attempt,
                  maxAttempts: attemptInfo.maxAttempts,
                  method: attemptInfo.method,
                  nextDelayMs: attemptInfo.nextDelayMs,
                  errorMessage: attemptInfo.error.message,
                  timestamp: new Date(attemptInfo.timestamp).toISOString()
                })}`
              );
            }
            // Call the callback with the original signature
            onRetry(lastError, attempt);
          }

          // Wait before the next retry
          await sleep(currentDelay);

          // Increment attempt counter
          attempt++;
        }
      }

      // This should never be reached due to the checks above,
      // but TypeScript requires a return statement
      throw lastError;
    };

    // Return the modified descriptor
    return descriptor;
  };
}

/**
 * Decorator for adding simple retry logic to a method
 * Retries the method execution with a fixed delay between attempts
 * 
 * @param config - Retry configuration options
 * @returns Method decorator that adds retry logic to the decorated method
 */
export function Retry<T = any>(config: Partial<RetryConfig<T>> = {}): MethodDecorator {
  return createRetryDecorator(config, false);
}

/**
 * Decorator for adding retry logic with exponential backoff to a method
 * Retries the method execution with increasing delays between attempts
 * 
 * @param config - Retry configuration options
 * @returns Method decorator that adds retry logic with exponential backoff to the decorated method
 */
export function RetryWithBackoff<T = any>(config: Partial<RetryConfig<T>> = {}): MethodDecorator {
  return createRetryDecorator(config, true);
}

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It provides decorators for implementing retry logic with configurable options.
 * 
 * The decorators implement the retry pattern described in the technical specification:
 * - Retry with exponential backoff for transient errors
 * - Configurable retry conditions based on error types
 * - Integration with logging for retry attempts and failures
 * - Fallback mechanisms for when retries are exhausted
 * 
 * These decorators ensure consistent retry behavior across all journeys (Health, Care, Plan)
 * and provide a robust foundation for building reliable services that can recover from
 * transient failures automatically.
 */