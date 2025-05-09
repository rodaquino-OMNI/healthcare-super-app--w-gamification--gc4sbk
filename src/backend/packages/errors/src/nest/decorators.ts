/**
 * @file decorators.ts
 * @description Provides NestJS-compatible decorators for declarative error handling.
 * These decorators enable developers to define retry policies, circuit breaker configurations,
 * fallback strategies, and error boundaries directly on controller methods or classes.
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ErrorType } from '../types';
import {
  DEFAULT_RETRY_CONFIG,
  DATABASE_RETRY_CONFIG,
  EXTERNAL_API_RETRY_CONFIG,
  KAFKA_RETRY_CONFIG,
  HEALTH_INTEGRATION_RETRY_CONFIG,
  DEVICE_SYNC_RETRY_CONFIG,
  NOTIFICATION_RETRY_CONFIG
} from '../constants';

/**
 * Metadata keys used by the decorators and interceptors
 */
export const RETRY_METADATA_KEY = 'retry_config';
export const CIRCUIT_BREAKER_METADATA_KEY = 'circuit_breaker_config';
export const FALLBACK_METADATA_KEY = 'fallback_config';
export const ERROR_BOUNDARY_METADATA_KEY = 'error_boundary_config';
export const TIMEOUT_METADATA_KEY = 'timeout_config';

/**
 * Interface for retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  attempts?: number;

  /**
   * Initial delay in milliseconds before the first retry
   * @default 1000
   */
  initialDelay?: number;

  /**
   * Factor by which the delay increases with each retry (exponential backoff)
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems
   * @default true
   */
  useJitter?: boolean;

  /**
   * Maximum jitter percentage (0-1) to apply to the delay
   * @default 0.25
   */
  jitterFactor?: number;

  /**
   * Types of errors that should be retried
   * @default [ErrorType.TECHNICAL, ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
   */
  retryableErrors?: ErrorType[];

  /**
   * Predicate function to determine if an error should be retried
   * @param error - The error that occurred
   * @returns True if the error should be retried, false otherwise
   */
  retryPredicate?: (error: Error) => boolean;

  /**
   * Callback function to execute before each retry attempt
   * @param error - The error that occurred
   * @param attempt - The current retry attempt number (1-based)
   */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Interface for circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /**
   * Number of consecutive failures required to open the circuit
   * @default 5
   */
  failureThreshold?: number;

  /**
   * Time in milliseconds to wait before attempting to close the circuit
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;

  /**
   * Number of successful executions required to close the circuit
   * @default 2
   */
  successThreshold?: number;

  /**
   * Types of errors that should trip the circuit breaker
   * @default [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
   */
  tripErrors?: ErrorType[];

  /**
   * Predicate function to determine if an error should trip the circuit breaker
   * @param error - The error that occurred
   * @returns True if the error should trip the circuit breaker, false otherwise
   */
  tripPredicate?: (error: Error) => boolean;

  /**
   * Callback function to execute when the circuit breaker state changes
   * @param state - The new state of the circuit breaker ('open', 'half-open', or 'closed')
   * @param error - The error that caused the state change (if applicable)
   */
  onStateChange?: (state: 'open' | 'half-open' | 'closed', error?: Error) => void;

  /**
   * Unique identifier for this circuit breaker instance
   * If not provided, a name will be generated based on the class and method names
   */
  name?: string;
}

/**
 * Interface for fallback configuration options
 */
export interface FallbackOptions {
  /**
   * Name of the fallback method to call when the primary method fails
   * The method must exist on the same class as the decorated method
   */
  methodName?: string;

  /**
   * Function to execute when the primary method fails
   * This takes precedence over methodName if both are provided
   * @param error - The error that occurred
   * @param args - The original arguments passed to the primary method
   * @returns The fallback result
   */
  fallbackFn?: (error: Error, ...args: any[]) => any;

  /**
   * Types of errors that should trigger the fallback
   * @default [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE, ErrorType.TECHNICAL]
   */
  fallbackErrors?: ErrorType[];

  /**
   * Predicate function to determine if an error should trigger the fallback
   * @param error - The error that occurred
   * @returns True if the fallback should be triggered, false otherwise
   */
  fallbackPredicate?: (error: Error) => boolean;

  /**
   * Whether to use cached data as a fallback if available
   * @default false
   */
  useCachedData?: boolean;

  /**
   * Maximum age in milliseconds for cached data to be considered valid
   * @default 300000 (5 minutes)
   */
  maxCacheAge?: number;
}

/**
 * Interface for error boundary configuration options
 */
export interface ErrorBoundaryOptions {
  /**
   * Whether to catch all errors within the boundary
   * @default true
   */
  catchAll?: boolean;

  /**
   * Types of errors to catch within the boundary
   * @default [ErrorType.TECHNICAL, ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
   */
  catchErrors?: ErrorType[];

  /**
   * Predicate function to determine if an error should be caught by the boundary
   * @param error - The error that occurred
   * @returns True if the error should be caught, false otherwise
   */
  catchPredicate?: (error: Error) => boolean;

  /**
   * Function to execute when an error is caught by the boundary
   * @param error - The error that occurred
   * @param context - The execution context
   * @returns The response to send to the client
   */
  handleError?: (error: Error, context: any) => any;

  /**
   * Whether to rethrow the error after handling it
   * @default false
   */
  rethrow?: boolean;
}

/**
 * Interface for timeout configuration options
 */
export interface TimeoutOptions {
  /**
   * Timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Custom error message to use when a timeout occurs
   * @default 'Request timed out'
   */
  message?: string;

  /**
   * Whether to cancel the operation when a timeout occurs
   * @default true
   */
  cancelOnTimeout?: boolean;

  /**
   * Callback function to execute when a timeout occurs
   * @param context - The execution context
   */
  onTimeout?: (context: any) => void;
}

/**
 * Predefined retry configurations for common scenarios
 */
export const RetryConfigs = {
  DEFAULT: DEFAULT_RETRY_CONFIG,
  DATABASE: DATABASE_RETRY_CONFIG,
  EXTERNAL_API: EXTERNAL_API_RETRY_CONFIG,
  KAFKA: KAFKA_RETRY_CONFIG,
  HEALTH_INTEGRATION: HEALTH_INTEGRATION_RETRY_CONFIG,
  DEVICE_SYNC: DEVICE_SYNC_RETRY_CONFIG,
  NOTIFICATION: NOTIFICATION_RETRY_CONFIG,
};

/**
 * Decorator for configuring retry policies on controller methods.
 * This decorator enables automatic retry of failed operations with configurable
 * retry attempts, backoff strategy, and error filtering.
 *
 * @param options - Configuration options for the retry policy
 * @returns Method decorator
 *
 * @example
 * // Basic usage with default settings
 * @Retry()
 * async fetchExternalData() {
 *   // This method will be retried up to 3 times with exponential backoff
 *   return this.externalService.getData();
 * }
 *
 * @example
 * // Custom retry configuration
 * @Retry({
 *   attempts: 5,
 *   initialDelay: 2000,
 *   backoffFactor: 1.5,
 *   retryableErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT]
 * })
 * async processPayment(paymentData: PaymentData) {
 *   return this.paymentGateway.process(paymentData);
 * }
 *
 * @example
 * // Using predefined configurations
 * @Retry(RetryConfigs.EXTERNAL_API)
 * async fetchUserProfile(userId: string) {
 *   return this.userService.getProfile(userId);
 * }
 */
export function Retry(options: RetryOptions = {}) {
  return SetMetadata(RETRY_METADATA_KEY, {
    attempts: options.attempts ?? DEFAULT_RETRY_CONFIG.MAX_ATTEMPTS,
    initialDelay: options.initialDelay ?? DEFAULT_RETRY_CONFIG.INITIAL_DELAY_MS,
    backoffFactor: options.backoffFactor ?? DEFAULT_RETRY_CONFIG.BACKOFF_FACTOR,
    maxDelay: options.maxDelay ?? DEFAULT_RETRY_CONFIG.MAX_DELAY_MS,
    useJitter: options.useJitter ?? DEFAULT_RETRY_CONFIG.USE_JITTER,
    jitterFactor: options.jitterFactor ?? DEFAULT_RETRY_CONFIG.JITTER_FACTOR,
    retryableErrors: options.retryableErrors ?? [
      ErrorType.TECHNICAL,
      ErrorType.EXTERNAL,
      ErrorType.TIMEOUT,
      ErrorType.SERVICE_UNAVAILABLE
    ],
    retryPredicate: options.retryPredicate,
    onRetry: options.onRetry
  });
}

/**
 * Decorator for configuring circuit breaker patterns on controller methods.
 * This decorator implements the circuit breaker pattern to prevent cascading failures
 * when external dependencies are experiencing issues.
 *
 * @param options - Configuration options for the circuit breaker
 * @returns Method decorator
 *
 * @example
 * // Basic usage with default settings
 * @CircuitBreaker()
 * async getExternalServiceData() {
 *   // This method will be protected by a circuit breaker
 *   return this.externalService.getData();
 * }
 *
 * @example
 * // Custom circuit breaker configuration
 * @CircuitBreaker({
 *   failureThreshold: 3,
 *   resetTimeout: 60000,
 *   successThreshold: 2,
 *   name: 'payment-gateway'
 * })
 * async processPayment(paymentData: PaymentData) {
 *   return this.paymentGateway.process(paymentData);
 * }
 */
export function CircuitBreaker(options: CircuitBreakerOptions = {}) {
  return SetMetadata(CIRCUIT_BREAKER_METADATA_KEY, {
    failureThreshold: options.failureThreshold ?? 5,
    resetTimeout: options.resetTimeout ?? 30000,
    successThreshold: options.successThreshold ?? 2,
    tripErrors: options.tripErrors ?? [
      ErrorType.EXTERNAL,
      ErrorType.TIMEOUT,
      ErrorType.SERVICE_UNAVAILABLE
    ],
    tripPredicate: options.tripPredicate,
    onStateChange: options.onStateChange,
    name: options.name
  });
}

/**
 * Decorator for configuring fallback strategies on controller methods.
 * This decorator enables graceful degradation by providing alternative
 * implementations or cached data when the primary method fails.
 *
 * @param options - Configuration options for the fallback strategy
 * @returns Method decorator
 *
 * @example
 * // Using a fallback method
 * @Fallback({ methodName: 'getOfflineUserData' })
 * async getUserData(userId: string) {
 *   return this.userService.getUserData(userId);
 * }
 *
 * // Fallback method implementation
 * async getOfflineUserData(error: Error, userId: string) {
 *   return this.cacheService.getUserData(userId);
 * }
 *
 * @example
 * // Using a fallback function
 * @Fallback({
 *   fallbackFn: (error, userId) => ({
 *     id: userId,
 *     name: 'Unknown User',
 *     isOfflineData: true
 *   })
 * })
 * async getUserProfile(userId: string) {
 *   return this.profileService.getProfile(userId);
 * }
 *
 * @example
 * // Using cached data as fallback
 * @Fallback({
 *   useCachedData: true,
 *   maxCacheAge: 600000 // 10 minutes
 * })
 * async getProductCatalog() {
 *   return this.catalogService.getLatestCatalog();
 * }
 */
export function Fallback(options: FallbackOptions) {
  return SetMetadata(FALLBACK_METADATA_KEY, {
    methodName: options.methodName,
    fallbackFn: options.fallbackFn,
    fallbackErrors: options.fallbackErrors ?? [
      ErrorType.EXTERNAL,
      ErrorType.TIMEOUT,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.TECHNICAL
    ],
    fallbackPredicate: options.fallbackPredicate,
    useCachedData: options.useCachedData ?? false,
    maxCacheAge: options.maxCacheAge ?? 300000 // 5 minutes
  });
}

/**
 * Decorator for configuring error boundaries on controller classes or methods.
 * This decorator creates a boundary that catches and handles errors, preventing
 * them from propagating up the call stack.
 *
 * @param options - Configuration options for the error boundary
 * @returns Class or method decorator
 *
 * @example
 * // Controller-level error boundary
 * @ErrorBoundary({
 *   handleError: (error, context) => ({
 *     status: 'error',
 *     message: 'An error occurred in the health service',
 *     error: process.env.NODE_ENV !== 'production' ? error.message : undefined
 *   })
 * })
 * @Controller('health')
 * export class HealthController {
 *   // All methods in this controller will be protected by the error boundary
 * }
 *
 * @example
 * // Method-level error boundary
 * @ErrorBoundary({
 *   catchErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT],
 *   rethrow: true
 * })
 * @Get('metrics')
 * async getHealthMetrics() {
 *   return this.healthService.getMetrics();
 * }
 */
export function ErrorBoundary(options: ErrorBoundaryOptions = {}) {
  return SetMetadata(ERROR_BOUNDARY_METADATA_KEY, {
    catchAll: options.catchAll ?? true,
    catchErrors: options.catchErrors ?? [
      ErrorType.TECHNICAL,
      ErrorType.EXTERNAL,
      ErrorType.TIMEOUT,
      ErrorType.SERVICE_UNAVAILABLE
    ],
    catchPredicate: options.catchPredicate,
    handleError: options.handleError,
    rethrow: options.rethrow ?? false
  });
}

/**
 * Decorator for configuring request timeouts on controller methods.
 * This decorator sets a maximum execution time for the decorated method,
 * automatically terminating the request if it exceeds the timeout.
 *
 * @param options - Configuration options for the timeout
 * @returns Method decorator
 *
 * @example
 * // Basic usage with default timeout (30 seconds)
 * @TimeoutConfig()
 * async longRunningOperation() {
 *   // This operation will timeout after 30 seconds
 *   return this.service.performLongOperation();
 * }
 *
 * @example
 * // Custom timeout configuration
 * @TimeoutConfig({
 *   timeout: 5000, // 5 seconds
 *   message: 'The payment processing timed out',
 *   cancelOnTimeout: true
 * })
 * async processPayment(paymentData: PaymentData) {
 *   return this.paymentService.process(paymentData);
 * }
 */
export function TimeoutConfig(options: TimeoutOptions = {}) {
  return SetMetadata(TIMEOUT_METADATA_KEY, {
    timeout: options.timeout ?? 30000, // 30 seconds default
    message: options.message ?? 'Request timed out',
    cancelOnTimeout: options.cancelOnTimeout ?? true,
    onTimeout: options.onTimeout
  });
}

/**
 * Combines multiple error handling decorators into a single decorator.
 * This utility function allows applying multiple error handling strategies
 * with a single decorator.
 *
 * @param retryOptions - Configuration options for retry policy
 * @param circuitBreakerOptions - Configuration options for circuit breaker
 * @param fallbackOptions - Configuration options for fallback strategy
 * @param timeoutOptions - Configuration options for request timeout
 * @returns Combined decorator
 *
 * @example
 * // Combine multiple error handling strategies
 * @ResilientOperation(
 *   { attempts: 3, initialDelay: 1000 }, // retry options
 *   { failureThreshold: 5, resetTimeout: 30000 }, // circuit breaker options
 *   { methodName: 'getFallbackData' }, // fallback options
 *   { timeout: 5000 } // timeout options
 * )
 * async fetchExternalData() {
 *   return this.externalService.getData();
 * }
 */
export function ResilientOperation(
  retryOptions?: RetryOptions,
  circuitBreakerOptions?: CircuitBreakerOptions,
  fallbackOptions?: FallbackOptions,
  timeoutOptions?: TimeoutOptions
) {
  const decorators = [];

  if (timeoutOptions) {
    decorators.push(TimeoutConfig(timeoutOptions));
  }

  if (retryOptions) {
    decorators.push(Retry(retryOptions));
  }

  if (circuitBreakerOptions) {
    decorators.push(CircuitBreaker(circuitBreakerOptions));
  }

  if (fallbackOptions) {
    decorators.push(Fallback(fallbackOptions));
  }

  return applyDecorators(...decorators);
}

/**
 * Predefined resilient operation configurations for common scenarios
 */
export const ResilientConfigs = {
  /**
   * Configuration for external API calls
   * Includes retry, circuit breaker, and timeout settings optimized for external services
   */
  EXTERNAL_API: {
    retry: {
      attempts: 3,
      initialDelay: 2000,
      backoffFactor: 2,
      maxDelay: 20000,
      useJitter: true,
      jitterFactor: 0.3,
      retryableErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000,
      successThreshold: 2,
      tripErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    timeout: {
      timeout: 10000, // 10 seconds
      message: 'External API request timed out',
      cancelOnTimeout: true
    }
  },

  /**
   * Configuration for database operations
   * Includes retry and timeout settings optimized for database operations
   */
  DATABASE: {
    retry: {
      attempts: 5,
      initialDelay: 500,
      backoffFactor: 1.5,
      maxDelay: 10000,
      useJitter: true,
      jitterFactor: 0.2,
      retryableErrors: [ErrorType.TECHNICAL, ErrorType.TIMEOUT]
    },
    timeout: {
      timeout: 5000, // 5 seconds
      message: 'Database operation timed out',
      cancelOnTimeout: true
    }
  },

  /**
   * Configuration for health-related external integrations
   * Includes retry, circuit breaker, fallback, and timeout settings optimized for health integrations
   */
  HEALTH_INTEGRATION: {
    retry: {
      attempts: 4,
      initialDelay: 2000,
      backoffFactor: 2,
      maxDelay: 30000,
      useJitter: true,
      jitterFactor: 0.2,
      retryableErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 60000,
      successThreshold: 2,
      tripErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    timeout: {
      timeout: 15000, // 15 seconds
      message: 'Health integration request timed out',
      cancelOnTimeout: true
    }
  },

  /**
   * Configuration for payment processing operations
   * Includes retry, circuit breaker, and timeout settings optimized for payment processing
   */
  PAYMENT_PROCESSING: {
    retry: {
      attempts: 2,
      initialDelay: 1000,
      backoffFactor: 2,
      maxDelay: 5000,
      useJitter: true,
      jitterFactor: 0.1,
      retryableErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    circuitBreaker: {
      failureThreshold: 2,
      resetTimeout: 120000, // 2 minutes
      successThreshold: 3,
      tripErrors: [ErrorType.EXTERNAL, ErrorType.TIMEOUT, ErrorType.SERVICE_UNAVAILABLE]
    },
    timeout: {
      timeout: 20000, // 20 seconds
      message: 'Payment processing timed out',
      cancelOnTimeout: false // Don't cancel payment operations on timeout to prevent double charges
    }
  }
};