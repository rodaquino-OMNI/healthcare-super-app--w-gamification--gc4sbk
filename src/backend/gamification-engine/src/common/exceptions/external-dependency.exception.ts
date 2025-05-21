import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '@austa/errors';

/**
 * Enum representing the different states of a circuit breaker.
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',       // Normal operation, requests are allowed
  OPEN = 'OPEN',           // Failing state, requests are blocked
  HALF_OPEN = 'HALF_OPEN', // Testing state, limited requests are allowed
}

/**
 * Enum representing the different types of fallback strategies.
 */
export enum FallbackStrategy {
  CACHED = 'cached',       // Use cached data from a previous successful response
  DEFAULT = 'default',     // Use default/static values
  DEGRADED = 'degraded',   // Provide limited functionality
  NONE = 'none',           // No fallback available
}

/**
 * Interface for external dependency error metadata.
 */
export interface ExternalDependencyErrorMetadata {
  /** The name of the external service or dependency that failed */
  dependencyName: string;
  
  /** The specific operation that was being performed */
  operation: string;
  
  /** The HTTP status code returned by the external service (if applicable) */
  statusCode?: number;
  
  /** The error message returned by the external service */
  dependencyMessage?: string;
  
  /** Circuit breaker information */
  circuitBreaker?: {
    /** Current state of the circuit breaker */
    state: CircuitBreakerState;
    
    /** Timestamp when the circuit breaker state last changed */
    lastStateChangeAt?: Date;
    
    /** Number of consecutive failures that triggered the circuit breaker */
    failureCount?: number;
    
    /** Threshold of failures that will trigger opening the circuit */
    failureThreshold?: number;
    
    /** Time period in milliseconds after which to try half-open state */
    resetTimeoutMs?: number;
  };
  
  /** Fallback strategy information */
  fallback?: {
    /** Whether a fallback strategy is available */
    available: boolean;
    
    /** The type of fallback strategy being used */
    strategy?: FallbackStrategy;
    
    /** When the cached data was last updated (if using cached fallback) */
    cachedAt?: Date;
    
    /** Description of the degraded functionality (if using degraded fallback) */
    degradedDescription?: string;
  };
  
  /** Retry information */
  retry?: {
    /** Whether this operation can be retried */
    retryable: boolean;
    
    /** Suggested delay before retry (in milliseconds) */
    delayMs?: number;
    
    /** Number of retry attempts already made */
    attemptsMade?: number;
    
    /** Maximum number of retry attempts allowed */
    maxAttempts?: number;
    
    /** Whether to use exponential backoff for retries */
    useExponentialBackoff?: boolean;
  };
}

/**
 * Base exception class for all external dependency failures.
 * 
 * This exception is used when interactions with external services or dependencies fail.
 * It provides context for circuit breaker implementations, fallback strategies, and
 * degraded service operations.
 * 
 * @example
 * ```typescript
 * // Example of throwing the exception when an external API call fails
 * throw new ExternalDependencyException(
 *   'Failed to retrieve data from payment gateway',
 *   'PAYMENT_API_ERROR',
 *   {
 *     dependencyName: 'PaymentGatewayAPI',
 *     operation: 'processPayment',
 *     statusCode: 503,
 *     dependencyMessage: 'Service temporarily unavailable',
 *     circuitBreaker: {
 *       state: CircuitBreakerState.OPEN,
 *       lastStateChangeAt: new Date(),
 *       failureCount: 5,
 *       failureThreshold: 3,
 *       resetTimeoutMs: 60000
 *     },
 *     fallback: {
 *       available: true,
 *       strategy: FallbackStrategy.DEGRADED,
 *       degradedDescription: 'Payment processing in offline mode'
 *     },
 *     retry: {
 *       retryable: true,
 *       delayMs: 5000,
 *       attemptsMade: 2,
 *       maxAttempts: 3,
 *       useExponentialBackoff: true
 *     }
 *   },
 *   originalError
 * );
 * ```
 */
export class ExternalDependencyException extends BaseError {
  /**
   * Creates a new instance of ExternalDependencyException.
   * 
   * @param message - Human-readable description of the error
   * @param errorCode - Unique error code for this type of error
   * @param metadata - Additional context about the external dependency failure
   * @param cause - The original error that caused this exception
   */
  constructor(
    message: string,
    errorCode: string,
    metadata: ExternalDependencyErrorMetadata,
    cause?: Error | unknown
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      errorCode,
      metadata,
      cause
    );
    
    // Set the name explicitly for better error identification
    this.name = 'ExternalDependencyException';
  }

  /**
   * Gets the name of the external dependency that failed.
   * 
   * @returns The name of the external dependency
   */
  getDependencyName(): string {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.dependencyName;
  }

  /**
   * Gets the operation that was being performed when the failure occurred.
   * 
   * @returns The operation name
   */
  getOperation(): string {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.operation;
  }

  /**
   * Gets the HTTP status code returned by the external service, if applicable.
   * 
   * @returns The HTTP status code or undefined if not available
   */
  getStatusCode(): number | undefined {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.statusCode;
  }

  /**
   * Gets the current state of the circuit breaker.
   * 
   * @returns The circuit breaker state or CLOSED if not specified
   */
  getCircuitBreakerState(): CircuitBreakerState {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.circuitBreaker?.state || CircuitBreakerState.CLOSED;
  }

  /**
   * Determines if the circuit breaker is open (preventing further requests).
   * 
   * @returns True if the circuit breaker is open, false otherwise
   */
  isCircuitBreakerOpen(): boolean {
    return this.getCircuitBreakerState() === CircuitBreakerState.OPEN;
  }

  /**
   * Updates the circuit breaker state in the error metadata.
   * 
   * @param state - New circuit breaker state
   * @param failureCount - Current failure count
   * @param resetTimeoutMs - Reset timeout in milliseconds
   * @returns This exception instance with updated metadata
   */
  updateCircuitBreakerState(
    state: CircuitBreakerState,
    failureCount?: number,
    resetTimeoutMs?: number
  ): this {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    const circuitBreaker = metadata.circuitBreaker || {};
    
    this.updateMetadata({
      ...metadata,
      circuitBreaker: {
        ...circuitBreaker,
        state,
        lastStateChangeAt: new Date(),
        failureCount: failureCount !== undefined ? failureCount : circuitBreaker.failureCount,
        resetTimeoutMs: resetTimeoutMs !== undefined ? resetTimeoutMs : circuitBreaker.resetTimeoutMs,
      },
      // If circuit breaker is open, mark as non-retryable
      retry: metadata.retry ? {
        ...metadata.retry,
        retryable: state !== CircuitBreakerState.OPEN && (metadata.retry.retryable !== false),
      } : undefined,
    });
    
    return this;
  }

  /**
   * Determines if a fallback strategy is available for this error.
   * 
   * @returns True if a fallback strategy is available, false otherwise
   */
  hasFallback(): boolean {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.fallback?.available || false;
  }

  /**
   * Gets the type of fallback strategy available.
   * 
   * @returns The fallback strategy type or NONE if no fallback is available
   */
  getFallbackStrategy(): FallbackStrategy {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.fallback?.strategy || FallbackStrategy.NONE;
  }

  /**
   * Updates the fallback strategy information in the error metadata.
   * 
   * @param available - Whether a fallback is available
   * @param strategy - The fallback strategy type
   * @param additionalInfo - Additional fallback information (cachedAt or degradedDescription)
   * @returns This exception instance with updated metadata
   */
  updateFallbackInfo(
    available: boolean,
    strategy?: FallbackStrategy,
    additionalInfo?: { cachedAt?: Date; degradedDescription?: string }
  ): this {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    const fallback = metadata.fallback || { available: false };
    
    this.updateMetadata({
      ...metadata,
      fallback: {
        ...fallback,
        available,
        strategy: strategy || fallback.strategy,
        cachedAt: additionalInfo?.cachedAt || fallback.cachedAt,
        degradedDescription: additionalInfo?.degradedDescription || fallback.degradedDescription,
      },
    });
    
    return this;
  }

  /**
   * Determines if the failed operation can be retried.
   * 
   * @returns True if the operation can be retried, false otherwise
   */
  isRetryable(): boolean {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.retry?.retryable || false;
  }

  /**
   * Gets the suggested delay before retrying the operation.
   * 
   * @returns The suggested delay in milliseconds, or undefined if retry information is not available
   */
  getRetryDelayMs(): number | undefined {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    return metadata.retry?.delayMs;
  }

  /**
   * Checks if maximum retry attempts have been reached.
   * 
   * @returns True if maximum retry attempts have been reached, false otherwise
   */
  hasReachedMaxRetries(): boolean {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    if (!metadata.retry) return true;
    
    const { attemptsMade, maxAttempts } = metadata.retry;
    if (attemptsMade === undefined || maxAttempts === undefined) return false;
    
    return attemptsMade >= maxAttempts;
  }

  /**
   * Increments the retry attempt count and updates retry metadata.
   * 
   * @param delayMs - New delay before retry (if not provided, will calculate based on exponential backoff)
   * @returns This exception instance with updated metadata
   */
  incrementRetryAttempt(delayMs?: number): this {
    const metadata = this.getMetadata() as ExternalDependencyErrorMetadata;
    if (!metadata.retry) {
      return this;
    }
    
    const attemptsMade = (metadata.retry.attemptsMade || 0) + 1;
    const maxAttempts = metadata.retry.maxAttempts || 3;
    const useExponentialBackoff = metadata.retry.useExponentialBackoff !== false;
    
    // Calculate delay with exponential backoff if not provided and enabled
    let calculatedDelayMs = delayMs;
    if (calculatedDelayMs === undefined && useExponentialBackoff) {
      const baseDelayMs = metadata.retry.delayMs || 1000;
      calculatedDelayMs = this.calculateExponentialBackoff(baseDelayMs, attemptsMade);
    }
    
    this.updateMetadata({
      ...metadata,
      retry: {
        ...metadata.retry,
        attemptsMade,
        delayMs: calculatedDelayMs || metadata.retry.delayMs,
        // If we've exceeded max retries, mark as non-retryable
        retryable: attemptsMade < maxAttempts && metadata.retry.retryable,
      },
    });
    
    return this;
  }

  /**
   * Calculates exponential backoff delay with jitter.
   * 
   * @param baseDelayMs - Base delay in milliseconds
   * @param attempt - Current attempt number (1-based)
   * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
   * @returns Calculated delay in milliseconds
   */
  private calculateExponentialBackoff(
    baseDelayMs: number,
    attempt: number,
    maxDelayMs: number = 30000
  ): number {
    // Calculate exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
    
    // Add jitter: random value between 0 and 1 * exponentialDelay * 0.2
    const jitter = Math.random() * exponentialDelay * 0.2;
    
    // Apply jitter and cap at maximum delay
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }

  /**
   * Creates a new instance of this exception with updated retry information.
   * Useful when implementing retry logic.
   * 
   * @param delayMs - New delay before retry
   * @param attemptsMade - Updated number of retry attempts made
   * @returns A new exception instance with updated retry information
   */
  withUpdatedRetryInfo(delayMs: number, attemptsMade: number): ExternalDependencyException {
    const metadata = { ...(this.getMetadata() as ExternalDependencyErrorMetadata) };
    
    if (!metadata.retry) {
      metadata.retry = { retryable: true };
    }
    
    metadata.retry = {
      ...metadata.retry,
      delayMs,
      attemptsMade,
      retryable: attemptsMade < (metadata.retry.maxAttempts || 3)
    };
    
    return new ExternalDependencyException(
      this.message,
      this.getErrorCode(),
      metadata,
      this.cause
    );
  }

  /**
   * Factory method to create an exception for HTTP-based external service failures.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param statusCode - HTTP status code from the external service
   * @param dependencyMessage - Error message from the external service
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static httpServiceError(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    statusCode?: number,
    dependencyMessage?: string,
    cause?: Error
  ): ExternalDependencyException {
    // Determine if the error is retryable based on the status code
    // 5xx errors are generally retryable, 4xx errors are generally not
    const isRetryable = statusCode ? statusCode >= 500 && statusCode < 600 : true;
    
    return new ExternalDependencyException(
      message,
      errorCode,
      {
        dependencyName,
        operation,
        statusCode,
        dependencyMessage,
        retry: {
          retryable: isRetryable,
          useExponentialBackoff: true,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: false,
        },
      },
      cause
    );
  }

  /**
   * Factory method to create an exception for connection failures to external services.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static connectionError(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    cause?: Error
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      errorCode,
      {
        dependencyName,
        operation,
        retry: {
          retryable: true,
          useExponentialBackoff: true,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: false,
        },
      },
      cause
    );
  }

  /**
   * Factory method to create an exception for timeout errors with external services.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param timeoutMs - Timeout in milliseconds that was exceeded
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static timeoutError(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    timeoutMs?: number,
    cause?: Error
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message || `Operation timed out after ${timeoutMs}ms`,
      errorCode,
      {
        dependencyName,
        operation,
        dependencyMessage: timeoutMs ? `Timeout exceeded: ${timeoutMs}ms` : undefined,
        retry: {
          retryable: true,
          useExponentialBackoff: true,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: false,
        },
      },
      cause
    );
  }

  /**
   * Factory method to create an exception for authentication failures with external services.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param statusCode - HTTP status code from the external service
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static authenticationError(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    statusCode?: number,
    cause?: Error
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      errorCode,
      {
        dependencyName,
        operation,
        statusCode,
        // Authentication errors are generally not retryable without intervention
        retry: {
          retryable: false,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: false,
        },
      },
      cause
    );
  }

  /**
   * Factory method to create an exception with a cached data fallback strategy.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param cachedAt - When the cached data was last updated
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static withCachedFallback(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    cachedAt: Date,
    cause?: Error
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      errorCode,
      {
        dependencyName,
        operation,
        retry: {
          retryable: true,
          useExponentialBackoff: true,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: true,
          strategy: FallbackStrategy.CACHED,
          cachedAt,
        },
      },
      cause
    );
  }

  /**
   * Factory method to create an exception with a degraded service fallback strategy.
   * 
   * @param message - Error message
   * @param errorCode - Error code
   * @param dependencyName - Name of the external service
   * @param operation - Operation being performed
   * @param degradedDescription - Description of the degraded functionality
   * @param cause - Original error
   * @returns ExternalDependencyException
   */
  static withDegradedFallback(
    message: string,
    errorCode: string,
    dependencyName: string,
    operation: string,
    degradedDescription: string,
    cause?: Error
  ): ExternalDependencyException {
    return new ExternalDependencyException(
      message,
      errorCode,
      {
        dependencyName,
        operation,
        retry: {
          retryable: true,
          useExponentialBackoff: true,
        },
        circuitBreaker: {
          state: CircuitBreakerState.CLOSED,
        },
        fallback: {
          available: true,
          strategy: FallbackStrategy.DEGRADED,
          degradedDescription,
        },
      },
      cause
    );
  }
}