/**
 * @file decorators.ts
 * @description Provides NestJS-compatible decorators for declarative error handling
 * 
 * This file contains decorators that enable developers to define retry policies,
 * circuit breaker configurations, fallback strategies, and error boundaries
 * directly on controller methods or classes. These decorators integrate with
 * the corresponding interceptors to provide consistent error handling across
 * the AUSTA SuperApp without cluttering business logic.
 */

import { SetMetadata, applyDecorators } from '@nestjs/common';
import { 
  RETRY_CONFIG, 
  CIRCUIT_BREAKER_CONFIG, 
  FALLBACK_STRATEGY 
} from '../constants';
import { ErrorType, ErrorCategory } from '../types';

// Metadata keys for the decorators
export const RETRY_METADATA_KEY = 'retry_config';
export const CIRCUIT_BREAKER_METADATA_KEY = 'circuit_breaker_config';
export const FALLBACK_METADATA_KEY = 'fallback_config';
export const ERROR_BOUNDARY_METADATA_KEY = 'error_boundary_config';
export const TIMEOUT_METADATA_KEY = 'timeout_config';

/**
 * Interface for retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff factor for exponential backoff */
  backoffFactor: number;
  /** Jitter factor to add randomness to retry delays */
  jitterFactor: number;
  /** Error types that should trigger retries */
  retryableErrors?: (ErrorType | ErrorCategory | string)[];
  /** Error types that should not trigger retries */
  nonRetryableErrors?: (ErrorType | ErrorCategory | string)[];
}

/**
 * Interface for circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Failure threshold percentage to trip the circuit */
  failureThresholdPercentage: number;
  /** Number of requests to sample for threshold calculation */
  requestVolumeThreshold: number;
  /** Time window for request volume threshold in milliseconds */
  rollingWindowMs: number;
  /** Time to wait before attempting to close the circuit in milliseconds */
  resetTimeoutMs: number;
  /** Error types that should trip the circuit */
  trippingErrors?: (ErrorType | ErrorCategory | string)[];
  /** Error types that should not trip the circuit */
  nonTrippingErrors?: (ErrorType | ErrorCategory | string)[];
}

/**
 * Interface for fallback configuration
 */
export interface FallbackConfig {
  /** Fallback strategy to use */
  strategy: string;
  /** Fallback function to execute */
  fallbackFn?: Function;
  /** Error types that should trigger the fallback */
  fallbackErrors?: (ErrorType | ErrorCategory | string)[];
  /** Error types that should not trigger the fallback */
  nonFallbackErrors?: (ErrorType | ErrorCategory | string)[];
  /** Cache TTL for fallback data in milliseconds */
  cacheTtlMs?: number;
}

/**
 * Interface for error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /** Error types to catch */
  catchErrors: (ErrorType | ErrorCategory | string)[];
  /** Error types to rethrow */
  rethrowErrors?: (ErrorType | ErrorCategory | string)[];
  /** Custom error handler function */
  errorHandler?: Function;
  /** Whether to log errors */
  logErrors?: boolean;
  /** Whether to include stack traces in error responses */
  includeStackTrace?: boolean;
}

/**
 * Interface for timeout configuration
 */
export interface TimeoutConfig {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  /** Whether to cancel the operation when timeout occurs */
  cancelOnTimeout?: boolean;
  /** Custom error message for timeout errors */
  errorMessage?: string;
}

/**
 * Decorator for configuring method-specific retry policies.
 * 
 * @param config - Retry configuration or predefined configuration key
 * @returns Decorator function
 * 
 * @example
 * // Using predefined configuration
 * @Retry('DATABASE')
 * async findUser(id: string) {
 *   // Method implementation
 * }
 * 
 * @example
 * // Using custom configuration
 * @Retry({
 *   maxAttempts: 3,
 *   initialDelayMs: 100,
 *   maxDelayMs: 1000,
 *   backoffFactor: 2,
 *   jitterFactor: 0.1,
 *   retryableErrors: [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE]
 * })
 * async callExternalService() {
 *   // Method implementation
 * }
 */
export function Retry(config: RetryConfig | keyof typeof RETRY_CONFIG) {
  let retryConfig: RetryConfig;
  
  if (typeof config === 'string') {
    const predefinedConfig = RETRY_CONFIG[config];
    if (!predefinedConfig) {
      throw new Error(`Predefined retry configuration '${config}' not found`);
    }
    
    retryConfig = {
      maxAttempts: predefinedConfig.MAX_ATTEMPTS,
      initialDelayMs: predefinedConfig.INITIAL_DELAY_MS,
      maxDelayMs: predefinedConfig.MAX_DELAY_MS,
      backoffFactor: predefinedConfig.BACKOFF_FACTOR,
      jitterFactor: predefinedConfig.JITTER_FACTOR
    };
  } else {
    retryConfig = config;
  }
  
  return SetMetadata(RETRY_METADATA_KEY, retryConfig);
}

/**
 * Decorator for configuring circuit breaker for external dependency failure handling.
 * 
 * @param config - Circuit breaker configuration or predefined configuration key
 * @returns Decorator function
 * 
 * @example
 * // Using predefined configuration
 * @CircuitBreaker('CRITICAL')
 * async callPaymentGateway() {
 *   // Method implementation
 * }
 * 
 * @example
 * // Using custom configuration
 * @CircuitBreaker({
 *   failureThresholdPercentage: 50,
 *   requestVolumeThreshold: 20,
 *   rollingWindowMs: 10000,
 *   resetTimeoutMs: 30000,
 *   trippingErrors: [ErrorType.EXTERNAL_SERVICE_ERROR]
 * })
 * async callExternalService() {
 *   // Method implementation
 * }
 */
export function CircuitBreaker(config: CircuitBreakerConfig | keyof typeof CIRCUIT_BREAKER_CONFIG) {
  let circuitBreakerConfig: CircuitBreakerConfig;
  
  if (typeof config === 'string') {
    const predefinedConfig = CIRCUIT_BREAKER_CONFIG[config];
    if (!predefinedConfig) {
      throw new Error(`Predefined circuit breaker configuration '${config}' not found`);
    }
    
    circuitBreakerConfig = {
      failureThresholdPercentage: predefinedConfig.FAILURE_THRESHOLD_PERCENTAGE,
      requestVolumeThreshold: predefinedConfig.REQUEST_VOLUME_THRESHOLD,
      rollingWindowMs: predefinedConfig.ROLLING_WINDOW_MS,
      resetTimeoutMs: predefinedConfig.RESET_TIMEOUT_MS
    };
  } else {
    circuitBreakerConfig = config;
  }
  
  return SetMetadata(CIRCUIT_BREAKER_METADATA_KEY, circuitBreakerConfig);
}

/**
 * Decorator for defining graceful degradation strategies.
 * 
 * @param config - Fallback configuration or predefined strategy key
 * @returns Decorator function
 * 
 * @example
 * // Using predefined strategy
 * @Fallback('USE_CACHED_DATA')
 * async getUserProfile(id: string) {
 *   // Method implementation
 * }
 * 
 * @example
 * // Using custom configuration with fallback function
 * @Fallback({
 *   strategy: 'CUSTOM',
 *   fallbackFn: (error, context) => ({ name: 'Default User', id: context.params.id }),
 *   fallbackErrors: [ErrorType.EXTERNAL_SERVICE_UNAVAILABLE, ErrorType.DATABASE_ERROR],
 *   cacheTtlMs: 300000 // 5 minutes
 * })
 * async getUserProfile(id: string) {
 *   // Method implementation
 * }
 */
export function Fallback(config: FallbackConfig | keyof typeof FALLBACK_STRATEGY) {
  let fallbackConfig: FallbackConfig;
  
  if (typeof config === 'string') {
    if (!Object.values(FALLBACK_STRATEGY).includes(config as any)) {
      throw new Error(`Predefined fallback strategy '${config}' not found`);
    }
    
    fallbackConfig = {
      strategy: config
    };
  } else {
    fallbackConfig = config;
  }
  
  return SetMetadata(FALLBACK_METADATA_KEY, fallbackConfig);
}

/**
 * Decorator for controller-level error containment.
 * 
 * @param config - Error boundary configuration
 * @returns Decorator function
 * 
 * @example
 * @ErrorBoundary({
 *   catchErrors: [ErrorCategory.BUSINESS, ErrorCategory.VALIDATION],
 *   rethrowErrors: [ErrorType.UNAUTHORIZED],
 *   logErrors: true,
 *   includeStackTrace: process.env.NODE_ENV !== 'production'
 * })
 * @Controller('users')
 * export class UsersController {
 *   // Controller implementation
 * }
 */
export function ErrorBoundary(config: ErrorBoundaryConfig) {
  return SetMetadata(ERROR_BOUNDARY_METADATA_KEY, config);
}

/**
 * Decorator for configuring timeouts for operations.
 * 
 * @param config - Timeout configuration or timeout in milliseconds
 * @returns Decorator function
 * 
 * @example
 * // Using timeout in milliseconds
 * @TimeoutConfig(5000)
 * async longRunningOperation() {
 *   // Method implementation
 * }
 * 
 * @example
 * // Using custom configuration
 * @TimeoutConfig({
 *   timeoutMs: 10000,
 *   cancelOnTimeout: true,
 *   errorMessage: 'The operation timed out. Please try again later.'
 * })
 * async callExternalService() {
 *   // Method implementation
 * }
 */
export function TimeoutConfig(config: TimeoutConfig | number) {
  let timeoutConfig: TimeoutConfig;
  
  if (typeof config === 'number') {
    timeoutConfig = {
      timeoutMs: config
    };
  } else {
    timeoutConfig = config;
  }
  
  return SetMetadata(TIMEOUT_METADATA_KEY, timeoutConfig);
}

/**
 * Combines multiple error handling decorators into a single decorator.
 * 
 * @param decorators - Array of decorators to combine
 * @returns Combined decorator function
 * 
 * @example
 * // Combining multiple error handling decorators
 * @ErrorHandling([
 *   Retry('DATABASE'),
 *   CircuitBreaker('DEFAULT'),
 *   Fallback('USE_CACHED_DATA'),
 *   TimeoutConfig(5000)
 * ])
 * async getUserData(id: string) {
 *   // Method implementation
 * }
 */
export function ErrorHandling(decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator>) {
  return applyDecorators(...decorators);
}