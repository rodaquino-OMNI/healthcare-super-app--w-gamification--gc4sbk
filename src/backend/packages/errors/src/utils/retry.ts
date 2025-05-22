/**
 * @file retry.ts
 * @description Provides a robust, configurable retry mechanism with exponential backoff
 * for handling transient errors across the application. Implements functions for retrying
 * asynchronous operations with customizable delay, jitter, max attempts, and success conditions.
 */

import { ErrorType } from '../../categories/error-types';
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';

/**
 * Options for configuring the retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in milliseconds (default: 100) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Jitter factor to add randomness to delay (0-1, default: 0.2) */
  jitter?: number;
  /** Timeout in milliseconds for each attempt (default: no timeout) */
  timeout?: number;
  /** Function to determine if an error should be retried */
  retryCondition?: (error: Error, attempt: number) => boolean | Promise<boolean>;
  /** Function to determine if the operation was successful */
  successCondition?: (result: any) => boolean | Promise<boolean>;
  /** Whether to include retry attempts in OpenTelemetry traces (default: true) */
  traceRetries?: boolean;
  /** Journey ID for contextual logging */
  journeyId?: string;
  /** User ID for contextual logging */
  userId?: string;
  /** Operation name for logging and tracing */
  operationName?: string;
  /** Logger instance (if not provided, console will be used) */
  logger?: any;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** The result of the successful operation */
  result: T;
  /** Number of attempts made (1 means success on first try) */
  attempts: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** The last error encountered (if operation failed) */
  error?: Error;
  /** Total time spent in milliseconds */
  totalTimeMs: number;
}

/**
 * Metadata collected during retry attempts for logging and tracing
 */
interface RetryMetadata {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  errorType?: string;
  errorMessage?: string;
  errorCode?: string;
  startTime: number;
  journeyId?: string;
  userId?: string;
  operationName?: string;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'retryCondition' | 'successCondition' | 'timeout' | 'journeyId' | 'userId' | 'operationName' | 'logger'>> = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 10000,
  jitter: 0.2,
  traceRetries: true
};

/**
 * Calculates the delay for the next retry attempt using exponential backoff with jitter
 * 
 * @param attempt Current attempt number (starting from 1)
 * @param options Retry options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, options: RetryOptions): number {
  const { baseDelay = DEFAULT_RETRY_OPTIONS.baseDelay, maxDelay = DEFAULT_RETRY_OPTIONS.maxDelay, jitter = DEFAULT_RETRY_OPTIONS.jitter } = options;
  
  // Calculate exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  
  // Apply jitter: random value between (1-jitter)*delay and (1+jitter)*delay
  const jitterMultiplier = 1 + jitter * (Math.random() * 2 - 1);
  const finalDelay = cappedDelay * jitterMultiplier;
  
  return Math.floor(finalDelay);
}

/**
 * Default retry condition that retries on EXTERNAL and TECHNICAL errors
 * 
 * @param error The error to check
 * @returns Whether the error should be retried
 */
export function defaultRetryCondition(error: Error): boolean {
  // Check if it's an AppException with a type property
  if ('type' in error) {
    const errorType = (error as any).type;
    // Retry on external system errors and technical errors
    return errorType === ErrorType.EXTERNAL || errorType === ErrorType.TECHNICAL;
  }
  
  // For network errors, check common error messages
  const errorMessage = error.message.toLowerCase();
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset') ||
    errorMessage.includes('socket hang up') ||
    errorMessage.includes('network error') ||
    error.name === 'AbortError' ||
    error.name === 'TimeoutError'
  );
}

/**
 * Default success condition that considers any non-error result as success
 * 
 * @param result The result to check
 * @returns Whether the operation was successful
 */
export function defaultSuccessCondition(result: any): boolean {
  return result !== undefined && result !== null;
}

/**
 * Creates a span for a retry attempt
 * 
 * @param parentSpan Parent span to create child span from
 * @param metadata Retry metadata
 * @returns Created span
 */
function createRetrySpan(parentSpan: Span | undefined, metadata: RetryMetadata): Span {
  const tracer = trace.getTracer('retry-util');
  const operationName = metadata.operationName || 'retry-operation';
  const spanName = `${operationName} (attempt ${metadata.attempt}/${metadata.maxAttempts})`;
  
  const span = parentSpan 
    ? tracer.startSpan(spanName, undefined, trace.setSpan(context.active(), parentSpan))
    : tracer.startSpan(spanName);
  
  // Add retry-specific attributes
  span.setAttribute('retry.attempt', metadata.attempt);
  span.setAttribute('retry.max_attempts', metadata.maxAttempts);
  span.setAttribute('retry.delay_ms', metadata.delayMs);
  
  if (metadata.journeyId) {
    span.setAttribute('journey.id', metadata.journeyId);
  }
  
  if (metadata.userId) {
    span.setAttribute('user.id', metadata.userId);
  }
  
  return span;
}

/**
 * Updates a span with error information
 * 
 * @param span The span to update
 * @param error The error to add to the span
 */
function addErrorToSpan(span: Span, error: Error): void {
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });
  
  span.setAttribute('error', true);
  span.setAttribute('error.type', error.name);
  span.setAttribute('error.message', error.message);
  
  // Add additional error attributes if available
  if ('type' in error) {
    span.setAttribute('error.category', (error as any).type);
  }
  
  if ('code' in error) {
    span.setAttribute('error.code', (error as any).code);
  }
  
  // Record exception
  span.recordException(error);
}

/**
 * Logs retry attempt information
 * 
 * @param metadata Retry metadata
 * @param options Retry options
 * @param error Optional error that caused the retry
 */
function logRetryAttempt(metadata: RetryMetadata, options: RetryOptions, error?: Error): void {
  const logger = options.logger || console;
  const logMethod = metadata.attempt === metadata.maxAttempts ? 'error' : 'warn';
  
  const logData = {
    operation: metadata.operationName || 'retry-operation',
    attempt: metadata.attempt,
    maxAttempts: metadata.maxAttempts,
    delayMs: metadata.delayMs,
    ...(metadata.journeyId && { journeyId: metadata.journeyId }),
    ...(metadata.userId && { userId: metadata.userId }),
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        ...(('type' in error) && { type: (error as any).type }),
        ...(('code' in error) && { code: (error as any).code })
      }
    })
  };
  
  if (metadata.attempt === metadata.maxAttempts) {
    logger[logMethod](`Retry failed after ${metadata.attempt} attempts`, logData);
  } else if (metadata.attempt === 1) {
    logger[logMethod](`Operation failed, retrying (1/${metadata.maxAttempts})`, logData);
  } else {
    logger[logMethod](`Retry attempt ${metadata.attempt}/${metadata.maxAttempts}`, logData);
  }
}

/**
 * Retries an asynchronous operation with exponential backoff
 * 
 * @param operation The async operation to retry
 * @param options Retry configuration options
 * @returns A promise that resolves with the retry result
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const {
    maxAttempts = DEFAULT_RETRY_OPTIONS.maxAttempts,
    retryCondition = defaultRetryCondition,
    successCondition = defaultSuccessCondition,
    traceRetries = DEFAULT_RETRY_OPTIONS.traceRetries,
    timeout,
    journeyId,
    userId,
    operationName
  } = options;
  
  let attempt = 0;
  let lastError: Error | undefined;
  let parentSpan: Span | undefined;
  
  // Get current active span as parent if tracing is enabled
  if (traceRetries) {
    const activeContext = context.active();
    parentSpan = trace.getSpan(activeContext);
  }
  
  while (attempt < maxAttempts) {
    attempt++;
    let span: Span | undefined;
    
    try {
      // For all attempts after the first, calculate and apply delay
      if (attempt > 1) {
        const delayMs = calculateBackoffDelay(attempt - 1, options);
        
        const metadata: RetryMetadata = {
          attempt,
          maxAttempts,
          delayMs,
          startTime,
          journeyId,
          userId,
          operationName,
          ...(lastError && {
            errorType: ('type' in lastError) ? String((lastError as any).type) : lastError.name,
            errorMessage: lastError.message,
            errorCode: ('code' in lastError) ? String((lastError as any).code) : undefined
          })
        };
        
        // Create span for this retry attempt if tracing is enabled
        if (traceRetries) {
          span = createRetrySpan(parentSpan, metadata);
        }
        
        // Log retry attempt
        logRetryAttempt(metadata, options, lastError);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      // Execute the operation, with timeout if specified
      let result: T;
      if (timeout) {
        result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
          })
        ]);
      } else {
        result = await operation();
      }
      
      // Check if the result is considered successful
      const isSuccess = await Promise.resolve(successCondition(result));
      
      if (isSuccess) {
        // Operation succeeded
        if (span) {
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
        }
        
        return {
          result,
          attempts: attempt,
          success: true,
          totalTimeMs: Date.now() - startTime
        };
      } else {
        // Operation completed but result doesn't meet success criteria
        lastError = new Error('Operation completed but did not meet success criteria');
        
        if (span) {
          addErrorToSpan(span, lastError);
          span.end();
        }
        
        // Check if we should retry based on the unsuccessful result
        const shouldRetry = attempt < maxAttempts && 
          await Promise.resolve(retryCondition(lastError, attempt));
        
        if (!shouldRetry) {
          break;
        }
      }
    } catch (error) {
      // Operation failed with an error
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (span) {
        addErrorToSpan(span, lastError);
        span.end();
      }
      
      // Check if we should retry based on the error
      const shouldRetry = attempt < maxAttempts && 
        await Promise.resolve(retryCondition(lastError, attempt));
      
      if (!shouldRetry) {
        break;
      }
    }
  }
  
  // All retries failed or retry condition returned false
  return {
    result: undefined as unknown as T,
    attempts: attempt,
    success: false,
    error: lastError,
    totalTimeMs: Date.now() - startTime
  };
}

/**
 * Retries an operation only for specific error types
 * 
 * @param operation The async operation to retry
 * @param errorTypes Array of error types that should trigger a retry
 * @param options Retry configuration options
 * @returns A promise that resolves with the retry result
 */
export async function retryForErrorTypes<T>(
  operation: () => Promise<T>,
  errorTypes: ErrorType[],
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  return retry(operation, {
    ...options,
    retryCondition: (error) => {
      if ('type' in error) {
        return errorTypes.includes((error as any).type);
      }
      return false;
    }
  });
}

/**
 * Creates a wrapped function that will automatically retry on failure
 * 
 * @param fn The function to wrap with retry logic
 * @param options Retry configuration options
 * @returns A wrapped function that implements retry behavior
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const result = await retry<ReturnType<T>>(
      () => fn(...args),
      options
    );
    
    if (!result.success) {
      throw result.error;
    }
    
    return result.result;
  };
}

/**
 * Implements a circuit breaker pattern with retry logic
 * 
 * @param operation The async operation to protect with a circuit breaker
 * @param options Circuit breaker and retry options
 * @returns Result of the operation if successful
 */
export async function circuitBreakerWithRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions & {
    /** Number of failures before opening the circuit (default: 5) */
    failureThreshold?: number;
    /** Time in milliseconds to keep the circuit open (default: 30000) */
    resetTimeout?: number;
  } = {}
): Promise<T> {
  // Static variables to track circuit state across calls
  const state = {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false
  };
  
  const {
    failureThreshold = 5,
    resetTimeout = 30000,
    ...retryOptions
  } = options;
  
  // Check if circuit is open
  if (state.isOpen) {
    const timeInOpen = Date.now() - state.lastFailureTime;
    
    if (timeInOpen < resetTimeout) {
      throw new Error(`Circuit breaker is open. Try again in ${Math.ceil((resetTimeout - timeInOpen) / 1000)} seconds`);
    }
    
    // Reset circuit to half-open state
    state.isOpen = false;
  }
  
  try {
    // Attempt operation with retry
    const result = await retry(operation, retryOptions);
    
    if (result.success) {
      // Success - reset failure count
      state.failures = 0;
      return result.result;
    } else {
      // All retries failed
      state.failures++;
      state.lastFailureTime = Date.now();
      
      // Open circuit if failure threshold reached
      if (state.failures >= failureThreshold) {
        state.isOpen = true;
      }
      
      throw result.error;
    }
  } catch (error) {
    // Operation failed without retry
    state.failures++;
    state.lastFailureTime = Date.now();
    
    // Open circuit if failure threshold reached
    if (state.failures >= failureThreshold) {
      state.isOpen = true;
    }
    
    throw error;
  }
}