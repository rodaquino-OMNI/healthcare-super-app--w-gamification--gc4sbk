/**
 * @file Type definitions for error handling decorators
 * 
 * This file defines TypeScript interfaces and types for error handling decorator configurations.
 * These types ensure type safety and proper validation of decorator parameters,
 * preventing misconfiguration and runtime errors.
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Retry decorator with exponential backoff
 * @Retry({
 *   maxAttempts: 3,
 *   delay: 1000,
 *   backoffFactor: 2,
 *   errorType: ErrorType.EXTERNAL,
 *   errorCode: 'API_RETRY_001'
 * })
 * async fetchExternalData(): Promise<Data> { ... }
 * 
 * // Circuit breaker for external dependencies
 * @CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 30000,
 *   fallback: (error, ...args) => defaultData
 * })
 * async callExternalService(): Promise<Response> { ... }
 * 
 * // Fallback for graceful degradation
 * @Fallback({
 *   handler: (error, ...args) => cachedData
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> { ... }
 * ```
 */

/**
 * Import the ErrorType enum from the appropriate location
 * This import path may need to be adjusted based on the actual location of the ErrorType enum
 */
import { ErrorType } from '../../categories/error-types';

/**
 * Base interface for all decorator configurations
 * Provides common properties used across different error handling strategies
 */
export interface BaseErrorConfig {
  /**
   * Custom error message to use when an error occurs
   * If not provided, the original error message will be used
   */
  message?: string;
  
  /**
   * Error type classification for consistent error handling
   * @see ErrorType
   */
  errorType?: ErrorType;
  
  /**
   * Custom error code for more specific categorization
   * Should follow the format: "JOURNEY_SERVICE_CODE" (e.g., "HEALTH_001")
   */
  errorCode?: string;
  
  /**
   * Whether to log the error when it occurs
   * @default true
   */
  logError?: boolean;
  
  /**
   * Whether to include stack trace in error logs
   * @default true in development, false in production
   */
  includeStack?: boolean;
}

/**
 * Configuration options for retry behavior
 * Used with @Retry decorator to handle transient errors
 */
export interface RetryConfig<T = any> extends BaseErrorConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxAttempts?: number;
  
  /**
   * Delay between retry attempts in milliseconds
   * @default 1000 (1 second)
   */
  delay?: number;
  
  /**
   * Factor by which the delay increases with each retry attempt
   * For exponential backoff strategy
   * @default 2
   */
  backoffFactor?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   * Prevents excessive wait times with exponential backoff
   * @default 30000 (30 seconds)
   */
  maxDelay?: number;
  
  /**
   * Function to determine if an error should trigger a retry
   * @param error - The error that occurred
   * @returns true if the error should be retried, false otherwise
   */
  retryCondition?: (error: Error) => boolean;
  
  /**
   * Function to execute before each retry attempt
   * @param error - The error that occurred
   * @param attempt - Current attempt number (starting from 1)
   */
  onRetry?: (error: Error, attempt: number) => void;
  
  /**
   * Function to execute when all retry attempts fail
   * @param error - The last error that occurred
   * @param attempts - Total number of attempts made
   */
  onMaxAttemptsReached?: (error: Error, attempts: number) => void;
  
  /**
   * Fallback function to execute when all retry attempts fail
   * @param error - The last error that occurred
   * @param args - Original function arguments
   * @returns Fallback value of type T
   */
  fallback?: (error: Error, ...args: any[]) => T | Promise<T>;
}

/**
 * Configuration options for circuit breaker pattern
 * Used with @CircuitBreaker decorator to handle failing dependencies
 */
export interface CircuitBreakerConfig<T = any> extends BaseErrorConfig {
  /**
   * Number of failures required to open the circuit
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Time period in milliseconds over which failures are counted
   * @default 60000 (1 minute)
   */
  failureWindow?: number;
  
  /**
   * Time in milliseconds that the circuit remains open before moving to half-open state
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Number of successful calls required in half-open state to close the circuit
   * @default 2
   */
  successThreshold?: number;
  
  /**
   * Function to determine if an error should count as a failure
   * @param error - The error that occurred
   * @returns true if the error should count as a failure, false otherwise
   */
  isFailure?: (error: Error) => boolean;
  
  /**
   * Function to execute when the circuit state changes
   * @param oldState - Previous circuit state ('CLOSED', 'OPEN', or 'HALF_OPEN')
   * @param newState - New circuit state ('CLOSED', 'OPEN', or 'HALF_OPEN')
   */
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
  
  /**
   * Fallback function to execute when the circuit is open
   * @param error - The error that triggered the circuit to open
   * @param args - Original function arguments
   * @returns Fallback value of type T
   */
  fallback?: (error: Error, ...args: any[]) => T | Promise<T>;
}

/**
 * Possible states of a circuit breaker
 */
export enum CircuitState {
  /**
   * Circuit is closed and requests are allowed through
   */
  CLOSED = 'CLOSED',
  
  /**
   * Circuit is open and requests are blocked
   */
  OPEN = 'OPEN',
  
  /**
   * Circuit is testing if service has recovered
   */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for fallback behavior
 * Used with @Fallback decorator to provide alternative behavior when errors occur
 */
export interface FallbackConfig<T = any> extends BaseErrorConfig {
  /**
   * Fallback function to execute when an error occurs
   * @param error - The error that occurred
   * @param args - Original function arguments
   * @returns Fallback value of type T
   */
  handler: (error: Error, ...args: any[]) => T | Promise<T>;
  
  /**
   * Function to determine if the fallback should be used for a specific error
   * @param error - The error that occurred
   * @returns true if the fallback should be used, false otherwise
   */
  condition?: (error: Error) => boolean;
  
  /**
   * Whether to log the original error before executing the fallback
   * @default true
   */
  logOriginalError?: boolean;
}

/**
 * Configuration options for error transformation
 * Used with @TransformError decorator to convert errors to standardized formats
 */
export interface ErrorTransformConfig extends BaseErrorConfig {
  /**
   * Function to transform an error into another type of error
   * @param error - The original error
   * @param args - Original function arguments
   * @returns Transformed error
   */
  transformer: (error: Error, ...args: any[]) => Error;
  
  /**
   * Function to determine if an error should be transformed
   * @param error - The error to check
   * @returns true if the error should be transformed, false otherwise
   */
  condition?: (error: Error) => boolean;
  
  /**
   * Types of errors that should be transformed
   * If provided, only errors of these types will be transformed
   */
  errorTypes?: Array<Function>;
}

/**
 * Configuration options for timeout behavior
 * Used with @Timeout decorator to handle long-running operations
 */
export interface TimeoutConfig<T = any> extends BaseErrorConfig {
  /**
   * Timeout duration in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout: number;
  
  /**
   * Fallback function to execute when timeout occurs
   * @param timeoutError - The timeout error
   * @param args - Original function arguments
   * @returns Fallback value of type T
   */
  fallback?: (timeoutError: Error, ...args: any[]) => T | Promise<T>;
  
  /**
   * Whether to abort the operation when timeout occurs (if possible)
   * @default true
   */
  abortOnTimeout?: boolean;
}

/**
 * Configuration options for caching behavior
 * Used with @Cache decorator to cache results and provide fallback from cache
 */
export interface CacheConfig<T = any> extends BaseErrorConfig {
  /**
   * Time-to-live for cached items in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Function to generate a cache key from function arguments
   * @param args - Original function arguments
   * @returns Cache key string
   */
  keyGenerator?: (...args: any[]) => string;
  
  /**
   * Whether to use cached value as fallback when an error occurs
   * @default true
   */
  useCacheOnError?: boolean;
  
  /**
   * Whether to update the cache when a successful result is returned
   * @default true
   */
  updateCacheOnSuccess?: boolean;
  
  /**
   * Function to determine if an error should trigger using cached value
   * @param error - The error that occurred
   * @returns true if cached value should be used, false otherwise
   */
  cacheCondition?: (error: Error) => boolean;
}

/**
 * Type for validation functions used to validate decorator configurations
 */
export type ConfigValidator<T> = (config: T) => void;

/**
 * Type for decorator factory functions
 * @template T - Configuration type
 * @template R - Return type of the decorated method
 */
export type DecoratorFactory<T, R = any> = (config: T) => MethodDecorator;

/**
 * This module is part of the AUSTA SuperApp error handling framework.
 * It provides type definitions for all error handling decorators used throughout the application.
 * 
 * The decorators implement various error handling patterns described in the technical specification:
 * - Retry with exponential backoff for transient errors
 * - Circuit breaker pattern for failing dependencies
 * - Fallback to cached data or default behavior
 * - Error transformation for standardized error responses
 * - Timeout handling for long-running operations
 * - Caching for performance and resilience
 * 
 * These types ensure consistent error handling across all journeys (Health, Care, Plan)
 * and provide a robust foundation for building reliable services.
 */