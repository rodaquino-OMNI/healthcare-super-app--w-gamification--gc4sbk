import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Configuration options for retry operations.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry.
   * @default 100
   */
  initialDelayMs?: number;

  /**
   * Factor by which the delay increases with each retry (exponential backoff).
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Maximum delay in milliseconds between retries.
   * @default 10000 (10 seconds)
   */
  maxDelayMs?: number;

  /**
   * Whether to add random jitter to the delay to prevent thundering herd problem.
   * @default true
   */
  jitter?: boolean;

  /**
   * Maximum total time in milliseconds for all retry attempts.
   * If exceeded, the operation will fail with the last error.
   * @default 30000 (30 seconds)
   */
  timeoutMs?: number;

  /**
   * Function to determine if a particular error should trigger a retry.
   * @default Retries on ErrorType.EXTERNAL and network-related errors
   */
  retryCondition?: (error: Error) => boolean;

  /**
   * Optional callback function that will be called before each retry attempt.
   * Useful for logging or monitoring retry attempts.
   */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry options.
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 100,
  backoffFactor: 2,
  maxDelayMs: 10000,
  jitter: true,
  timeoutMs: 30000,
  retryCondition: (error: Error) => {
    // Retry on external system errors by default
    if (error instanceof AppException && error.type === ErrorType.EXTERNAL) {
      return true;
    }

    // Retry on common network-related errors
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('etimedout') ||
      errorMessage.includes('socket hang up') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('429') ||
      errorMessage.includes('too many requests')
    );
  },
  onRetry: () => {}
};

/**
 * Journey-specific retry configurations.
 */
export const JOURNEY_RETRY_CONFIGS = {
  health: {
    // Health journey may need more retries for wearable device connections
    maxRetries: 5,
    initialDelayMs: 200,
    timeoutMs: 45000,
  },
  care: {
    // Care journey needs quick retries for telemedicine
    maxRetries: 3,
    initialDelayMs: 50,
    timeoutMs: 15000,
  },
  plan: {
    // Plan journey can wait longer for insurance system responses
    maxRetries: 4,
    initialDelayMs: 300,
    timeoutMs: 60000,
  }
};

/**
 * Calculates the delay for the next retry attempt using exponential backoff with optional jitter.
 * 
 * @param attempt Current retry attempt number (0-based)
 * @param options Retry configuration options
 * @returns Delay in milliseconds for the next retry
 */
export function calculateBackoffDelay(attempt: number, options: Required<RetryOptions>): number {
  const { initialDelayMs, backoffFactor, maxDelayMs, jitter } = options;
  
  // Calculate exponential backoff: initialDelay * (backoffFactor ^ attempt)
  let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
  
  // Apply maximum delay limit
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter if enabled (±25% randomization)
  if (jitter) {
    const jitterFactor = 0.5 + Math.random();
    delay = Math.floor(delay * jitterFactor);
  }
  
  return delay;
}

/**
 * Executes an operation with retry capability using exponential backoff.
 * 
 * @param operation Function to execute with retry capability
 * @param options Retry configuration options
 * @returns Promise that resolves with the operation result or rejects with the last error
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Merge provided options with defaults
  const config: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };
  
  const { maxRetries, timeoutMs, retryCondition, onRetry } = config;
  
  // Track start time for timeout enforcement
  const startTime = Date.now();
  let lastError: Error;
  
  // Try the operation up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      // Store the error for potential re-throw
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we've exceeded the timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= timeoutMs) {
        break;
      }
      
      // Check if we've reached max retries or if this error shouldn't trigger a retry
      if (attempt >= maxRetries || !retryCondition(lastError)) {
        break;
      }
      
      // Calculate delay for next retry
      const delay = calculateBackoffDelay(attempt, config);
      
      // Call onRetry callback if provided
      onRetry(lastError, attempt + 1, delay);
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed or were skipped
  throw lastError;
}

/**
 * Creates a retry configuration for a specific journey.
 * 
 * @param journeyType The journey type ('health', 'care', or 'plan')
 * @param customOptions Additional custom options to override journey defaults
 * @returns Combined retry options for the specified journey
 */
export function createJourneyRetryConfig(
  journeyType: 'health' | 'care' | 'plan',
  customOptions: Partial<RetryOptions> = {}
): RetryOptions {
  return {
    ...DEFAULT_RETRY_OPTIONS,
    ...JOURNEY_RETRY_CONFIGS[journeyType],
    ...customOptions
  };
}

/**
 * NestJS method decorator that adds retry capability to class methods.
 * 
 * @param options Retry configuration options
 * @returns Method decorator that wraps the original method with retry logic
 */
export function Retry(options: RetryOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store the original method
    const originalMethod = descriptor.value;
    
    // Replace the original method with a wrapped version that includes retry logic
    descriptor.value = async function(...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}

/**
 * Creates a function with retry capability.
 * 
 * @param fn Function to wrap with retry capability
 * @param options Retry configuration options
 * @returns Wrapped function that includes retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return retry(() => fn(...args), options);
  }) as T;
}

/**
 * Creates a retry configuration specifically for external API calls.
 * 
 * @param customOptions Additional custom options to override API call defaults
 * @returns Retry options configured for external API calls
 */
export function createApiRetryConfig(customOptions: Partial<RetryOptions> = {}): RetryOptions {
  return {
    maxRetries: 3,
    initialDelayMs: 200,
    backoffFactor: 2,
    maxDelayMs: 5000,
    jitter: true,
    timeoutMs: 15000,
    retryCondition: (error: Error) => {
      // Retry on specific HTTP status codes that indicate transient issues
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('429') || // Too Many Requests
        errorMessage.includes('503') || // Service Unavailable
        errorMessage.includes('504') || // Gateway Timeout
        errorMessage.includes('408') || // Request Timeout
        errorMessage.includes('network error') ||
        errorMessage.includes('etimedout')
      );
    },
    ...customOptions
  };
}