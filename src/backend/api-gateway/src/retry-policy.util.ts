/**
 * @fileoverview Centralized retry policy definitions and mechanisms for the API Gateway
 * to handle transient failures when communicating with downstream services.
 * 
 * This utility provides:
 * - Configurable retry policies with exponential backoff, linear backoff, and fixed interval strategies
 * - Timeout handling for operations
 * - Error classification to determine retryability
 * - Journey-specific retry configurations
 * - Decorator-style wrappers for easy integration
 */

import { HttpStatus, Logger } from '@nestjs/common';
import { JOURNEY_IDS } from '../../shared/src/constants/journey.constants';
import * as ErrorCodes from 'src/backend/shared/src/constants/error-codes.constants';

/**
 * Logger instance for retry policy operations
 */
const logger = new Logger('RetryPolicyUtil');

/**
 * Enum representing different retry policy types
 */
export enum RetryPolicyType {
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  FIXED_INTERVAL = 'fixed_interval',
  LINEAR_BACKOFF = 'linear_backoff',
}

/**
 * Enum representing the status of a retry operation
 */
export enum RetryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  EXHAUSTED = 'exhausted',
}

/**
 * Enum representing different types of errors for retry classification
 */
export enum ErrorType {
  TRANSIENT = 'transient',  // Temporary errors that may resolve on retry (network issues, timeouts)
  CLIENT = 'client',        // Client errors that won't resolve with retry (bad request, unauthorized)
  SYSTEM = 'system',        // System errors that may or may not resolve with retry (internal server errors)
  EXTERNAL = 'external',    // External dependency errors that may resolve on retry (third-party service issues)
}

/**
 * Interface for retry options that can be configured
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay between retries in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay between retries in milliseconds */
  maxDelayMs?: number;
  /** Timeout for each attempt in milliseconds */
  timeoutMs?: number;
  /** Type of retry policy to use */
  policyType?: RetryPolicyType;
  /** Whether to add jitter to delay times to prevent thundering herd */
  useJitter?: boolean;
  /** Factor by which to increase delay for exponential backoff */
  backoffFactor?: number;
  /** Journey ID for context-specific retry policies */
  journeyId?: string;
}

/**
 * Default retry options for different services
 */
export const DEFAULT_RETRY_OPTIONS: Record<string, RetryOptions> = {
  default: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    timeoutMs: 5000,
    policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
    useJitter: true,
    backoffFactor: 2,
  },
  [JOURNEY_IDS.HEALTH]: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 3000,
    timeoutMs: 5000,
    policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
    useJitter: true,
    backoffFactor: 2,
  },
  [JOURNEY_IDS.CARE]: {
    maxRetries: 4,
    initialDelayMs: 50,
    maxDelayMs: 2000,
    timeoutMs: 3000,
    policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
    useJitter: true,
    backoffFactor: 2,
  },
  [JOURNEY_IDS.PLAN]: {
    maxRetries: 2,
    initialDelayMs: 200,
    maxDelayMs: 4000,
    timeoutMs: 5000,
    policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
    useJitter: true,
    backoffFactor: 2,
  },
};

/**
 * HTTP status codes that are considered retryable
 */
export const RETRYABLE_STATUS_CODES = [
  HttpStatus.TOO_MANY_REQUESTS, // 429
  HttpStatus.REQUEST_TIMEOUT, // 408
  HttpStatus.INTERNAL_SERVER_ERROR, // 500
  HttpStatus.BAD_GATEWAY, // 502
  HttpStatus.SERVICE_UNAVAILABLE, // 503
  HttpStatus.GATEWAY_TIMEOUT, // 504
];

/**
 * Error messages that indicate a retryable error
 */
export const RETRYABLE_ERROR_MESSAGES = [
  'timeout',
  'econnrefused',
  'econnreset',
  'epipe',
  'network error',
  'network timeout',
  'service unavailable',
  'gateway timeout',
  'socket hang up',
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
];

/**
 * Interface for errors that can be retried
 */
export interface RetryableError extends Error {
  /** HTTP status code if available */
  status?: number;
  /** Response object if available */
  response?: {
    status?: number;
    data?: any;
  };
  /** Whether the error is retryable */
  isRetryable?: boolean;
  /** Type of error for retry classification */
  errorType?: ErrorType;
  /** Number of retry attempts made */
  retryAttempt?: number;
  /** Context information for the error */
  context?: Record<string, any>;
}

/**
 * Determines if an error is retryable based on status code and error message
 * 
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: RetryableError): boolean {
  // If the error has an explicit isRetryable flag, use that
  if (typeof error.isRetryable === 'boolean') {
    return error.isRetryable;
  }

  // Check status code from error or error.response
  const statusCode = error.status || error.response?.status;
  if (statusCode && RETRYABLE_STATUS_CODES.includes(statusCode)) {
    return true;
  }

  // Check error message for retryable patterns
  const errorMessage = error.message?.toLowerCase() || '';
  return RETRYABLE_ERROR_MESSAGES.some(msg => errorMessage.includes(msg.toLowerCase()));
}

/**
 * Classifies an error into a specific error type for retry decisions
 * 
 * @param error - The error to classify
 * @returns The error type classification
 */
export function classifyError(error: RetryableError): ErrorType {
  // If the error already has a type, use that
  if (error.errorType) {
    return error.errorType;
  }

  // Get status code from error or error.response
  const statusCode = error.status || error.response?.status;

  // Classify based on status code
  if (statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      // 4xx errors are client errors and generally not retryable
      // except for 408 (Request Timeout) and 429 (Too Many Requests)
      if (statusCode === HttpStatus.REQUEST_TIMEOUT || 
          statusCode === HttpStatus.TOO_MANY_REQUESTS) {
        return ErrorType.TRANSIENT;
      }
      return ErrorType.CLIENT;
    } else if (statusCode >= 500) {
      // 5xx errors are server errors and generally retryable
      return ErrorType.SYSTEM;
    }
  }

  // Check error message for patterns that indicate transient issues
  const errorMessage = error.message?.toLowerCase() || '';
  if (RETRYABLE_ERROR_MESSAGES.some(msg => errorMessage.includes(msg.toLowerCase()))) {
    return ErrorType.TRANSIENT;
  }

  // Default to system error if we can't classify more specifically
  return ErrorType.SYSTEM;
}

/**
 * Adds jitter to a delay time to prevent the "thundering herd" problem
 * 
 * @param delay - The base delay in milliseconds
 * @returns The delay with jitter added
 */
export function addJitter(delay: number): number {
  // Add random jitter between -10% and +10% of the delay
  const jitterFactor = 0.1; // 10%
  const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(delay + jitter));
}

/**
 * Calculates the next retry delay using exponential backoff
 * 
 * @param attempt - The current retry attempt (0-based)
 * @param options - Retry options
 * @returns The delay in milliseconds before the next retry
 */
export function calculateExponentialBackoff(
  attempt: number,
  options: RetryOptions,
): number {
  const {
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffFactor = 2,
    useJitter = true,
  } = options;

  // Calculate exponential backoff: initialDelay * (backoffFactor ^ attempt)
  let delay = initialDelayMs * Math.pow(backoffFactor, attempt);
  
  // Cap at maximum delay
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter if enabled
  if (useJitter) {
    delay = addJitter(delay);
  }
  
  return delay;
}

/**
 * Calculates the next retry delay using fixed interval
 * 
 * @param attempt - The current retry attempt (0-based)
 * @param options - Retry options
 * @returns The delay in milliseconds before the next retry
 */
export function calculateFixedInterval(
  attempt: number,
  options: RetryOptions,
): number {
  const {
    initialDelayMs = 100,
    useJitter = true,
  } = options;

  // For fixed interval, we always use the same delay
  let delay = initialDelayMs;
  
  // Add jitter if enabled
  if (useJitter) {
    delay = addJitter(delay);
  }
  
  return delay;
}

/**
 * Calculates the next retry delay using linear backoff
 * 
 * @param attempt - The current retry attempt (0-based)
 * @param options - Retry options
 * @returns The delay in milliseconds before the next retry
 */
export function calculateLinearBackoff(
  attempt: number,
  options: RetryOptions,
): number {
  const {
    initialDelayMs = 100,
    maxDelayMs = 5000,
    useJitter = true,
  } = options;

  // Calculate linear backoff: initialDelay * (attempt + 1)
  let delay = initialDelayMs * (attempt + 1);
  
  // Cap at maximum delay
  delay = Math.min(delay, maxDelayMs);
  
  // Add jitter if enabled
  if (useJitter) {
    delay = addJitter(delay);
  }
  
  return delay;
}

/**
 * Calculates the delay before the next retry attempt based on the policy type
 * 
 * @param attempt - The current retry attempt (0-based)
 * @param options - Retry options
 * @returns The delay in milliseconds before the next retry
 */
export function calculateRetryDelay(
  attempt: number,
  options: RetryOptions,
): number {
  const { policyType = RetryPolicyType.EXPONENTIAL_BACKOFF } = options;
  
  switch (policyType) {
    case RetryPolicyType.EXPONENTIAL_BACKOFF:
      return calculateExponentialBackoff(attempt, options);
    case RetryPolicyType.FIXED_INTERVAL:
      return calculateFixedInterval(attempt, options);
    case RetryPolicyType.LINEAR_BACKOFF:
      return calculateLinearBackoff(attempt, options);
    default:
      return calculateExponentialBackoff(attempt, options);
  }
}

/**
 * Creates a timeout promise that rejects after the specified time
 * 
 * @param timeoutMs - Timeout in milliseconds
 * @returns A promise that rejects after the timeout
 */
export function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const timeoutError = new Error(`Operation timed out after ${timeoutMs}ms`) as RetryableError;
      timeoutError.errorType = ErrorType.TRANSIENT;
      timeoutError.isRetryable = true;
      reject(timeoutError);
    }, timeoutMs);
  });
}

/**
 * Executes a function with retry logic
 * 
 * @param fn - The function to execute with retry logic
 * @param options - Retry options
 * @returns A promise that resolves with the function result or rejects after all retries are exhausted
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  // Merge with default options
  const journeyId = options.journeyId || 'default';
  const mergedOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS.default,
    ...(DEFAULT_RETRY_OPTIONS[journeyId] || {}),
    ...options,
  };
  
  const { maxRetries = 3, timeoutMs } = mergedOptions;
  let attempt = 0;
  
  // Start retry loop
  while (true) {
    try {
      // Execute function with timeout if specified
      if (timeoutMs) {
        return await Promise.race([
          fn(),
          createTimeout(timeoutMs),
        ]);
      } else {
        return await fn();
      }
    } catch (error) {
      const retryableError = error as RetryableError;
      retryableError.retryAttempt = attempt;
      
      // Check if we've reached max retries
      if (attempt >= maxRetries) {
        logger.error(
          `Retry exhausted after ${attempt} attempts: ${retryableError.message}`,
          retryableError.stack,
        );
        throw retryableError;
      }
      
      // Check if error is retryable
      if (!isRetryableError(retryableError)) {
        logger.error(
          `Non-retryable error: ${retryableError.message}`,
          retryableError.stack,
        );
        throw retryableError;
      }
      
      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt, mergedOptions);
      
      // Log retry attempt
      logger.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms: ${retryableError.message}`,
        {
          attempt,
          maxRetries,
          delay,
          errorType: classifyError(retryableError),
          errorMessage: retryableError.message,
          journeyId: mergedOptions.journeyId,
        },
      );
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increment attempt counter
      attempt++;
    }
  }
}

/**
 * Creates a retry policy function that can be used to execute operations with retry logic
 * 
 * @param options - Retry options for this policy
 * @returns A function that executes operations with the configured retry policy
 */
export function createRetryPolicy(options: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>): Promise<T> => {
    return executeWithRetry(fn, options);
  };
}

/**
 * Creates a retry policy for a specific journey
 * 
 * @param journeyId - The journey ID to create a policy for
 * @param overrideOptions - Additional options to override defaults
 * @returns A function that executes operations with the journey-specific retry policy
 */
export function createJourneyRetryPolicy(
  journeyId: string,
  overrideOptions: Partial<RetryOptions> = {},
) {
  return createRetryPolicy({
    journeyId,
    ...overrideOptions,
  });
}

/**
 * Wraps a function with retry logic using the default retry policy
 * 
 * @param fn - The function to wrap with retry logic
 * @returns A function that executes the original function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    return executeWithRetry(() => fn(...args)) as ReturnType<T>;
  };
}

/**
 * Wraps a function with retry logic using a journey-specific retry policy
 * 
 * @param fn - The function to wrap with retry logic
 * @param journeyId - The journey ID for journey-specific retry policy
 * @param overrideOptions - Additional options to override defaults
 * @returns A function that executes the original function with retry logic
 */
export function withJourneyRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  journeyId: string,
  overrideOptions: Partial<RetryOptions> = {},
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    return executeWithRetry(
      () => fn(...args),
      { journeyId, ...overrideOptions },
    ) as ReturnType<T>;
  };
}

/**
 * Usage Examples
 * 
 * Example 1: Basic usage with default retry policy
 * ```typescript
 * import { executeWithRetry } from './retry-policy.util';
 * 
 * async function fetchUserData(userId: string) {
 *   return executeWithRetry(async () => {
 *     const response = await axios.get(`/users/${userId}`);
 *     return response.data;
 *   });
 * }
 * ```
 * 
 * Example 2: Using journey-specific retry policy
 * ```typescript
 * import { createJourneyRetryPolicy, JOURNEY_IDS } from './retry-policy.util';
 * 
 * const healthRetryPolicy = createJourneyRetryPolicy(JOURNEY_IDS.HEALTH);
 * 
 * async function fetchHealthMetrics(userId: string) {
 *   return healthRetryPolicy(async () => {
 *     const response = await axios.get(`/health/${userId}/metrics`);
 *     return response.data;
 *   });
 * }
 * ```
 * 
 * Example 3: Using the withRetry decorator
 * ```typescript
 * import { withRetry } from './retry-policy.util';
 * 
 * class UserService {
 *   @Inject()
 *   private readonly httpService: HttpService;
 *   
 *   getUserProfile = withRetry(async (userId: string) => {
 *     const response = await this.httpService.get(`/users/${userId}/profile`);
 *     return response.data;
 *   });
 * }
 * ```
 * 
 * Example 4: Using custom retry options
 * ```typescript
 * import { executeWithRetry, RetryPolicyType } from './retry-policy.util';
 * 
 * async function processPayment(paymentId: string) {
 *   return executeWithRetry(
 *     async () => {
 *       const response = await axios.post(`/payments/${paymentId}/process`);
 *       return response.data;
 *     },
 *     {
 *       maxRetries: 5,
 *       initialDelayMs: 200,
 *       maxDelayMs: 10000,
 *       policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
 *       timeoutMs: 3000,
 *     }
 *   );
 * }
 * ```
 */