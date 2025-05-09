import { ErrorType, ErrorRecoveryStrategy } from '../types';

/**
 * Defines the backoff strategy for retry operations.
 * Determines how the delay between retry attempts increases.
 */
export enum BackoffStrategy {
  /**
   * Fixed delay between retry attempts.
   * Each retry will wait the same amount of time.
   */
  FIXED = 'fixed',
  
  /**
   * Exponential backoff strategy.
   * Delay increases exponentially with each retry attempt: baseDelay * (2 ^ attempt).
   */
  EXPONENTIAL = 'exponential',
  
  /**
   * Linear backoff strategy.
   * Delay increases linearly with each retry attempt: baseDelay * attempt.
   */
  LINEAR = 'linear'
}

/**
 * Configuration options for the Retry decorator.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxAttempts?: number;
  
  /**
   * Base delay between retry attempts in milliseconds.
   * @default 1000
   */
  baseDelay?: number;
  
  /**
   * Backoff strategy to use for calculating delay between retries.
   * @default BackoffStrategy.EXPONENTIAL
   */
  backoffStrategy?: BackoffStrategy;
  
  /**
   * Maximum delay between retry attempts in milliseconds.
   * Prevents exponential backoff from growing too large.
   * @default 30000 (30 seconds)
   */
  maxDelay?: number;
  
  /**
   * Random factor to add jitter to retry delays.
   * Helps prevent thundering herd problem when multiple services retry simultaneously.
   * Value between 0 and 1, where 0 means no jitter and 1 means up to 100% jitter.
   * @default 0.1 (10% jitter)
   */
  jitter?: number;
  
  /**
   * Types of errors that should trigger a retry.
   * If not specified, all errors will trigger a retry.
   */
  retryableErrors?: ErrorType[];
  
  /**
   * Custom function to determine if an error should be retried.
   * Takes precedence over retryableErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @param attempt - The current attempt number (1-based)
   * @returns True if the error should be retried, false otherwise
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  
  /**
   * Function to execute before each retry attempt.
   * Useful for logging or metrics collection.
   * 
   * @param error - The error that triggered the retry
   * @param attempt - The current attempt number (1-based)
   * @param delay - The delay before the next retry in milliseconds
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Circuit breaker states.
 */
export enum CircuitState {
  /**
   * Circuit is closed and allowing requests to pass through.
   * This is the normal operating state.
   */
  CLOSED = 'closed',
  
  /**
   * Circuit is open and blocking requests from passing through.
   * This happens when the failure threshold has been exceeded.
   */
  OPEN = 'open',
  
  /**
   * Circuit is allowing a limited number of test requests to pass through
   * to determine if the underlying issue has been resolved.
   */
  HALF_OPEN = 'half-open'
}

/**
 * Configuration options for the CircuitBreaker decorator.
 */
export interface CircuitBreakerOptions {
  /**
   * Unique identifier for this circuit breaker.
   * Required when using a shared circuit breaker across multiple methods.
   * If not provided, a unique ID will be generated based on the class and method name.
   */
  id?: string;
  
  /**
   * Number of consecutive failures required to open the circuit.
   * @default 5
   */
  failureThreshold?: number;
  
  /**
   * Size of the sliding window for tracking failures.
   * @default 10
   */
  windowSize?: number;
  
  /**
   * Success threshold in half-open state required to close the circuit.
   * Number of consecutive successful test requests required to close the circuit.
   * @default 2
   */
  successThreshold?: number;
  
  /**
   * Time in milliseconds that the circuit stays open before transitioning to half-open.
   * @default 30000 (30 seconds)
   */
  resetTimeout?: number;
  
  /**
   * Types of errors that should count as failures for the circuit breaker.
   * If not specified, all errors will count as failures.
   */
  failureErrors?: ErrorType[];
  
  /**
   * Custom function to determine if an error should count as a failure.
   * Takes precedence over failureErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @returns True if the error should count as a failure, false otherwise
   */
  isFailure?: (error: Error) => boolean;
  
  /**
   * Function to execute when the circuit state changes.
   * Useful for logging or metrics collection.
   * 
   * @param oldState - The previous circuit state
   * @param newState - The new circuit state
   * @param reason - The reason for the state change
   */
  onStateChange?: (oldState: CircuitState, newState: CircuitState, reason: string) => void;
}

/**
 * Configuration options for the Fallback decorator.
 */
export interface FallbackOptions<T, A extends any[]> {
  /**
   * Fallback function to execute when the original method fails.
   * Receives the original error, method arguments, and target instance.
   * 
   * @param error - The error that was thrown by the original method
   * @param args - The arguments passed to the original method
   * @returns The fallback result
   */
  fallbackFn: (error: Error, ...args: A) => T | Promise<T>;
  
  /**
   * Types of errors that should trigger the fallback.
   * If not specified, all errors will trigger the fallback.
   */
  fallbackErrors?: ErrorType[];
  
  /**
   * Custom function to determine if the fallback should be used for an error.
   * Takes precedence over fallbackErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @returns True if the fallback should be used, false otherwise
   */
  shouldFallback?: (error: Error) => boolean;
}

/**
 * Configuration options for the CachedFallback decorator.
 */
export interface CachedFallbackOptions<T> {
  /**
   * Time-to-live for cached results in milliseconds.
   * @default 60000 (1 minute)
   */
  ttl?: number;
  
  /**
   * Default value to return if no cached result is available.
   * If not provided and no cached result is available, the original error will be thrown.
   */
  defaultValue?: T;
  
  /**
   * Types of errors that should trigger the cached fallback.
   * If not specified, all errors will trigger the cached fallback.
   */
  fallbackErrors?: ErrorType[];
  
  /**
   * Custom function to determine if the cached fallback should be used for an error.
   * Takes precedence over fallbackErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @returns True if the cached fallback should be used, false otherwise
   */
  shouldFallback?: (error: Error) => boolean;
  
  /**
   * Function to generate a cache key from the method arguments.
   * If not provided, a default key will be generated based on the stringified arguments.
   * 
   * @param args - The arguments passed to the method
   * @returns A string cache key
   */
  cacheKeyFn?: (...args: any[]) => string;
}

/**
 * Configuration options for the DefaultFallback decorator.
 */
export interface DefaultFallbackOptions<T> {
  /**
   * Default value to return when the original method fails.
   */
  defaultValue: T;
  
  /**
   * Types of errors that should trigger the default fallback.
   * If not specified, all errors will trigger the default fallback.
   */
  fallbackErrors?: ErrorType[];
  
  /**
   * Custom function to determine if the default fallback should be used for an error.
   * Takes precedence over fallbackErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @returns True if the default fallback should be used, false otherwise
   */
  shouldFallback?: (error: Error) => boolean;
}

/**
 * Configuration options for the ErrorContext decorator.
 */
export interface ErrorContextOptions {
  /**
   * Journey context to add to errors.
   */
  journey?: 'health' | 'care' | 'plan';
  
  /**
   * Operation name to add to errors.
   * If not provided, the method name will be used.
   */
  operation?: string;
  
  /**
   * Resource being accessed to add to errors.
   */
  resource?: string;
  
  /**
   * Additional data to add to error context.
   */
  data?: Record<string, any>;
  
  /**
   * Function to extract user ID from method arguments.
   * 
   * @param args - The arguments passed to the method
   * @returns The user ID or undefined if not available
   */
  getUserId?: (...args: any[]) => string | undefined;
}

/**
 * Configuration options for the ClassifyError decorator.
 */
export interface ClassifyErrorOptions {
  /**
   * Default error type to use if no specific classification matches.
   * @default ErrorType.TECHNICAL
   */
  defaultType?: ErrorType;
  
  /**
   * Error type mappings based on error constructor name or instance checks.
   * Keys are error constructor names or custom check functions.
   * Values are the ErrorType to assign.
   */
  errorTypeMappings?: Record<string, ErrorType> | Map<Function | ((error: Error) => boolean), ErrorType>;
  
  /**
   * Whether to rethrow the error after classification.
   * @default true
   */
  rethrow?: boolean;
  
  /**
   * Recovery strategy to recommend for this error.
   */
  recoveryStrategy?: ErrorRecoveryStrategy;
}

/**
 * Configuration options for the TransformError decorator.
 */
export interface TransformErrorOptions {
  /**
   * Function to transform the error.
   * 
   * @param error - The original error
   * @param args - The arguments passed to the method
   * @returns A new error or the original error
   */
  transformFn: (error: Error, ...args: any[]) => Error;
  
  /**
   * Types of errors that should be transformed.
   * If not specified, all errors will be transformed.
   */
  transformErrors?: ErrorType[] | string[];
  
  /**
   * Custom function to determine if an error should be transformed.
   * Takes precedence over transformErrors if both are specified.
   * 
   * @param error - The error that was thrown
   * @returns True if the error should be transformed, false otherwise
   */
  shouldTransform?: (error: Error) => boolean;
}

/**
 * Configuration options for the Resilient decorator.
 * Combines retry, circuit breaker, and fallback options.
 */
export interface ResilientOptions<T, A extends any[]> {
  /**
   * Retry configuration options.
   */
  retry?: RetryOptions;
  
  /**
   * Circuit breaker configuration options.
   */
  circuitBreaker?: CircuitBreakerOptions;
  
  /**
   * Fallback configuration options.
   */
  fallback?: FallbackOptions<T, A>;
  
  /**
   * Error context configuration options.
   */
  errorContext?: ErrorContextOptions;
  
  /**
   * Error classification configuration options.
   */
  classifyError?: ClassifyErrorOptions;
  
  /**
   * Error transformation configuration options.
   */
  transformError?: TransformErrorOptions;
}

/**
 * Type guard to check if an object is a valid RetryOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid RetryOptions, false otherwise
 */
export function isRetryOptions(options: any): options is RetryOptions {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = [
    'maxAttempts', 'baseDelay', 'backoffStrategy', 'maxDelay',
    'jitter', 'retryableErrors', 'shouldRetry', 'onRetry'
  ];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.maxAttempts !== undefined && (typeof options.maxAttempts !== 'number' || options.maxAttempts <= 0)) {
    return false;
  }
  
  if (options.baseDelay !== undefined && (typeof options.baseDelay !== 'number' || options.baseDelay < 0)) {
    return false;
  }
  
  if (options.backoffStrategy !== undefined && !Object.values(BackoffStrategy).includes(options.backoffStrategy)) {
    return false;
  }
  
  if (options.maxDelay !== undefined && (typeof options.maxDelay !== 'number' || options.maxDelay < 0)) {
    return false;
  }
  
  if (options.jitter !== undefined && (typeof options.jitter !== 'number' || options.jitter < 0 || options.jitter > 1)) {
    return false;
  }
  
  if (options.retryableErrors !== undefined && !Array.isArray(options.retryableErrors)) {
    return false;
  }
  
  if (options.shouldRetry !== undefined && typeof options.shouldRetry !== 'function') {
    return false;
  }
  
  if (options.onRetry !== undefined && typeof options.onRetry !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid CircuitBreakerOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid CircuitBreakerOptions, false otherwise
 */
export function isCircuitBreakerOptions(options: any): options is CircuitBreakerOptions {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = [
    'id', 'failureThreshold', 'windowSize', 'successThreshold',
    'resetTimeout', 'failureErrors', 'isFailure', 'onStateChange'
  ];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.id !== undefined && typeof options.id !== 'string') {
    return false;
  }
  
  if (options.failureThreshold !== undefined && (typeof options.failureThreshold !== 'number' || options.failureThreshold <= 0)) {
    return false;
  }
  
  if (options.windowSize !== undefined && (typeof options.windowSize !== 'number' || options.windowSize <= 0)) {
    return false;
  }
  
  if (options.successThreshold !== undefined && (typeof options.successThreshold !== 'number' || options.successThreshold <= 0)) {
    return false;
  }
  
  if (options.resetTimeout !== undefined && (typeof options.resetTimeout !== 'number' || options.resetTimeout < 0)) {
    return false;
  }
  
  if (options.failureErrors !== undefined && !Array.isArray(options.failureErrors)) {
    return false;
  }
  
  if (options.isFailure !== undefined && typeof options.isFailure !== 'function') {
    return false;
  }
  
  if (options.onStateChange !== undefined && typeof options.onStateChange !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid FallbackOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid FallbackOptions, false otherwise
 */
export function isFallbackOptions<T, A extends any[]>(options: any): options is FallbackOptions<T, A> {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['fallbackFn', 'fallbackErrors', 'shouldFallback'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (typeof options.fallbackFn !== 'function') {
    return false;
  }
  
  if (options.fallbackErrors !== undefined && !Array.isArray(options.fallbackErrors)) {
    return false;
  }
  
  if (options.shouldFallback !== undefined && typeof options.shouldFallback !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid CachedFallbackOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid CachedFallbackOptions, false otherwise
 */
export function isCachedFallbackOptions<T>(options: any): options is CachedFallbackOptions<T> {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['ttl', 'defaultValue', 'fallbackErrors', 'shouldFallback', 'cacheKeyFn'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.ttl !== undefined && (typeof options.ttl !== 'number' || options.ttl < 0)) {
    return false;
  }
  
  if (options.fallbackErrors !== undefined && !Array.isArray(options.fallbackErrors)) {
    return false;
  }
  
  if (options.shouldFallback !== undefined && typeof options.shouldFallback !== 'function') {
    return false;
  }
  
  if (options.cacheKeyFn !== undefined && typeof options.cacheKeyFn !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid DefaultFallbackOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid DefaultFallbackOptions, false otherwise
 */
export function isDefaultFallbackOptions<T>(options: any): options is DefaultFallbackOptions<T> {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['defaultValue', 'fallbackErrors', 'shouldFallback'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.defaultValue === undefined) {
    return false;
  }
  
  if (options.fallbackErrors !== undefined && !Array.isArray(options.fallbackErrors)) {
    return false;
  }
  
  if (options.shouldFallback !== undefined && typeof options.shouldFallback !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid ErrorContextOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid ErrorContextOptions, false otherwise
 */
export function isErrorContextOptions(options: any): options is ErrorContextOptions {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['journey', 'operation', 'resource', 'data', 'getUserId'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.journey !== undefined && !['health', 'care', 'plan'].includes(options.journey)) {
    return false;
  }
  
  if (options.operation !== undefined && typeof options.operation !== 'string') {
    return false;
  }
  
  if (options.resource !== undefined && typeof options.resource !== 'string') {
    return false;
  }
  
  if (options.data !== undefined && (typeof options.data !== 'object' || options.data === null)) {
    return false;
  }
  
  if (options.getUserId !== undefined && typeof options.getUserId !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid ClassifyErrorOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid ClassifyErrorOptions, false otherwise
 */
export function isClassifyErrorOptions(options: any): options is ClassifyErrorOptions {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['defaultType', 'errorTypeMappings', 'rethrow', 'recoveryStrategy'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.defaultType !== undefined && typeof options.defaultType !== 'string') {
    return false;
  }
  
  if (options.errorTypeMappings !== undefined && 
      !(typeof options.errorTypeMappings === 'object' || options.errorTypeMappings instanceof Map)) {
    return false;
  }
  
  if (options.rethrow !== undefined && typeof options.rethrow !== 'boolean') {
    return false;
  }
  
  if (options.recoveryStrategy !== undefined && 
      !Object.values(ErrorRecoveryStrategy).includes(options.recoveryStrategy)) {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid TransformErrorOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid TransformErrorOptions, false otherwise
 */
export function isTransformErrorOptions(options: any): options is TransformErrorOptions {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = ['transformFn', 'transformErrors', 'shouldTransform'];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (typeof options.transformFn !== 'function') {
    return false;
  }
  
  if (options.transformErrors !== undefined && !Array.isArray(options.transformErrors)) {
    return false;
  }
  
  if (options.shouldTransform !== undefined && typeof options.shouldTransform !== 'function') {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if an object is a valid ResilientOptions.
 * 
 * @param options - The object to check
 * @returns True if the object is a valid ResilientOptions, false otherwise
 */
export function isResilientOptions<T, A extends any[]>(options: any): options is ResilientOptions<T, A> {
  if (!options || typeof options !== 'object') return false;
  
  // Check if any invalid properties exist
  const validKeys = [
    'retry', 'circuitBreaker', 'fallback', 'errorContext', 'classifyError', 'transformError'
  ];
  
  const hasInvalidKeys = Object.keys(options).some(key => !validKeys.includes(key));
  if (hasInvalidKeys) return false;
  
  // Validate property types
  if (options.retry !== undefined && !isRetryOptions(options.retry)) {
    return false;
  }
  
  if (options.circuitBreaker !== undefined && !isCircuitBreakerOptions(options.circuitBreaker)) {
    return false;
  }
  
  if (options.fallback !== undefined && !isFallbackOptions(options.fallback)) {
    return false;
  }
  
  if (options.errorContext !== undefined && !isErrorContextOptions(options.errorContext)) {
    return false;
  }
  
  if (options.classifyError !== undefined && !isClassifyErrorOptions(options.classifyError)) {
    return false;
  }
  
  if (options.transformError !== undefined && !isTransformErrorOptions(options.transformError)) {
    return false;
  }
  
  return true;
}