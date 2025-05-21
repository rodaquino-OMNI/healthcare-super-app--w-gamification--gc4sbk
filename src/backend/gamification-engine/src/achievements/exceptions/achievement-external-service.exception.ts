import { ErrorType } from '@austa/errors'; // Assuming this is the new path for error types
import { BaseAchievementException } from './base-achievement.exception';

/**
 * Interface for external service error metadata
 */
export interface ExternalServiceErrorMetadata {
  /** The name of the external service that failed */
  serviceName: string;
  
  /** The operation that was being performed when the failure occurred */
  operation: string;
  
  /** The HTTP status code returned by the external service (if applicable) */
  statusCode?: number;
  
  /** The error message returned by the external service */
  serviceMessage?: string;
  
  /** Whether this error should trigger a circuit breaker */
  triggerCircuitBreaker?: boolean;
  
  /** Information about fallback strategy */
  fallback?: {
    /** Whether a fallback strategy is available */
    available: boolean;
    
    /** The type of fallback strategy (e.g., 'cached', 'default', 'degraded') */
    type?: 'cached' | 'default' | 'degraded';
    
    /** When the cached data was last updated (if using cached fallback) */
    cachedAt?: Date;
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
  };
}

/**
 * Exception thrown when an external service interaction fails during achievement operations.
 * 
 * This exception is used when interactions with services like profiles, notifications,
 * or other external dependencies fail during achievement processing. It supports
 * circuit breaker patterns and includes information about fallback strategies.
 * 
 * @example
 * ```typescript
 * // Example of throwing the exception when a profile service call fails
 * throw new AchievementExternalServiceException(
 *   'Failed to retrieve user profile during achievement processing',
 *   'GAME_EXT_001',
 *   {
 *     serviceName: 'ProfileService',
 *     operation: 'getUserProfile',
 *     statusCode: 503,
 *     serviceMessage: 'Service temporarily unavailable',
 *     triggerCircuitBreaker: true,
 *     fallback: {
 *       available: true,
 *       type: 'cached',
 *       cachedAt: new Date(Date.now() - 3600000) // 1 hour ago
 *     },
 *     retry: {
 *       retryable: true,
 *       delayMs: 5000,
 *       attemptsMade: 2,
 *       maxAttempts: 3
 *     }
 *   },
 *   originalError
 * );
 * ```
 */
export class AchievementExternalServiceException extends BaseAchievementException {
  /**
   * Creates a new instance of AchievementExternalServiceException.
   * 
   * @param message - Human-readable description of the error
   * @param errorCode - Unique error code for this type of error
   * @param metadata - Additional context about the external service failure
   * @param cause - The original error that caused this exception
   */
  constructor(
    message: string,
    errorCode: string,
    metadata: ExternalServiceErrorMetadata,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL, // Use the EXTERNAL error type for external dependency failures
      errorCode,
      metadata,
      cause
    );
    
    // Set the name explicitly for better error identification
    this.name = 'AchievementExternalServiceException';
  }

  /**
   * Determines if a fallback strategy is available for this error.
   * 
   * @returns True if a fallback strategy is available, false otherwise
   */
  hasFallback(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.fallback?.available || false;
  }

  /**
   * Gets the type of fallback strategy available.
   * 
   * @returns The fallback strategy type or undefined if no fallback is available
   */
  getFallbackType(): 'cached' | 'default' | 'degraded' | undefined {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.fallback?.type;
  }

  /**
   * Determines if this error should trigger a circuit breaker.
   * 
   * @returns True if this error should trigger a circuit breaker, false otherwise
   */
  shouldTriggerCircuitBreaker(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.triggerCircuitBreaker || false;
  }

  /**
   * Determines if the failed operation can be retried.
   * 
   * @returns True if the operation can be retried, false otherwise
   */
  isRetryable(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.retry?.retryable || false;
  }

  /**
   * Gets the suggested delay before retrying the operation.
   * 
   * @returns The suggested delay in milliseconds, or undefined if retry information is not available
   */
  getRetryDelayMs(): number | undefined {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.retry?.delayMs;
  }

  /**
   * Checks if maximum retry attempts have been reached.
   * 
   * @returns True if maximum retry attempts have been reached, false otherwise
   */
  hasReachedMaxRetries(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    if (!metadata.retry) return true;
    
    const { attemptsMade, maxAttempts } = metadata.retry;
    if (attemptsMade === undefined || maxAttempts === undefined) return false;
    
    return attemptsMade >= maxAttempts;
  }

  /**
   * Creates a new instance of this exception with updated retry information.
   * Useful when implementing retry logic.
   * 
   * @param delayMs - New delay before retry
   * @param attemptsMade - Updated number of retry attempts made
   * @returns A new exception instance with updated retry information
   */
  withUpdatedRetryInfo(delayMs: number, attemptsMade: number): AchievementExternalServiceException {
    const metadata = { ...(this.metadata as ExternalServiceErrorMetadata) };
    
    if (!metadata.retry) {
      metadata.retry = { retryable: true };
    }
    
    metadata.retry = {
      ...metadata.retry,
      delayMs,
      attemptsMade
    };
    
    return new AchievementExternalServiceException(
      this.message,
      this.errorCode,
      metadata,
      this.cause
    );
  }
}