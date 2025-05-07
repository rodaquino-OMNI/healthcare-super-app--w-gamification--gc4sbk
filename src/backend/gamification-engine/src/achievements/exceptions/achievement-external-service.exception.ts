import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

/**
 * Interface for external service error metadata
 */
export interface ExternalServiceErrorMetadata {
  /**
   * Name of the external service that failed
   */
  serviceName: string;
  
  /**
   * Operation that was being performed when the error occurred
   */
  operation: string;
  
  /**
   * HTTP status code returned by the external service (if applicable)
   */
  statusCode?: number;
  
  /**
   * Circuit breaker status for the service
   */
  circuitBreakerStatus?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  
  /**
   * Whether a fallback strategy is available
   */
  hasFallback: boolean;
  
  /**
   * Type of fallback strategy being used (if applicable)
   */
  fallbackStrategy?: 'CACHED_DATA' | 'DEFAULT_BEHAVIOR' | 'DEGRADED_FEATURE' | 'NONE';
  
  /**
   * Number of retry attempts made (if applicable)
   */
  retryAttempts?: number;
  
  /**
   * Maximum number of retry attempts allowed (if applicable)
   */
  maxRetryAttempts?: number;
  
  /**
   * Additional context specific to the achievement operation
   */
  context?: Record<string, unknown>;
}

/**
 * Exception thrown when an external service interaction fails during achievement operations.
 * 
 * This exception is used when interactions with services like profiles, notifications,
 * or other external dependencies fail during achievement processing. It supports
 * circuit breaker patterns and fallback strategies.
 * 
 * @example
 * ```typescript
 * // When a profile service call fails during achievement unlocking
 * throw new AchievementExternalServiceException(
 *   'Failed to retrieve user profile during achievement unlocking',
 *   {
 *     serviceName: 'ProfileService',
 *     operation: 'getUserProfile',
 *     statusCode: 503,
 *     circuitBreakerStatus: 'HALF_OPEN',
 *     hasFallback: true,
 *     fallbackStrategy: 'CACHED_DATA',
 *     retryAttempts: 2,
 *     maxRetryAttempts: 3,
 *     context: { userId: '123', achievementId: '456' }
 *   },
 *   originalError
 * );
 * ```
 */
export class AchievementExternalServiceException extends AppException {
  /**
   * Creates a new AchievementExternalServiceException.
   * 
   * @param message - Human-readable error message
   * @param metadata - Detailed information about the external service error
   * @param cause - Original error that caused this exception (if available)
   */
  constructor(
    message: string,
    metadata: ExternalServiceErrorMetadata,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      'ACH-EXT-001', // Achievement External Service Error code
      metadata,
      cause
    );
    
    // Set the name explicitly for better error identification
    this.name = 'AchievementExternalServiceException';
    
    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, AchievementExternalServiceException.prototype);
  }

  /**
   * Factory method to create an exception for profile service failures
   * 
   * @param operation - The operation that was being performed
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   * @returns A new AchievementExternalServiceException
   */
  static profileServiceError(
    operation: string,
    metadata: Partial<ExternalServiceErrorMetadata>,
    cause?: Error
  ): AchievementExternalServiceException {
    return new AchievementExternalServiceException(
      `Profile service error during ${operation}`,
      {
        serviceName: 'ProfileService',
        operation,
        hasFallback: metadata.hasFallback ?? false,
        ...metadata
      },
      cause
    );
  }

  /**
   * Factory method to create an exception for notification service failures
   * 
   * @param operation - The operation that was being performed
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   * @returns A new AchievementExternalServiceException
   */
  static notificationServiceError(
    operation: string,
    metadata: Partial<ExternalServiceErrorMetadata>,
    cause?: Error
  ): AchievementExternalServiceException {
    return new AchievementExternalServiceException(
      `Notification service error during ${operation}`,
      {
        serviceName: 'NotificationService',
        operation,
        hasFallback: metadata.hasFallback ?? true, // Notifications typically can be retried
        fallbackStrategy: metadata.fallbackStrategy ?? 'DEGRADED_FEATURE',
        ...metadata
      },
      cause
    );
  }

  /**
   * Factory method to create an exception for event service failures
   * 
   * @param operation - The operation that was being performed
   * @param metadata - Additional error metadata
   * @param cause - Original error that caused this exception
   * @returns A new AchievementExternalServiceException
   */
  static eventServiceError(
    operation: string,
    metadata: Partial<ExternalServiceErrorMetadata>,
    cause?: Error
  ): AchievementExternalServiceException {
    return new AchievementExternalServiceException(
      `Event service error during ${operation}`,
      {
        serviceName: 'EventService',
        operation,
        hasFallback: metadata.hasFallback ?? false,
        ...metadata
      },
      cause
    );
  }

  /**
   * Determines if the error is retriable based on metadata
   * 
   * @returns True if the error can be retried, false otherwise
   */
  isRetriable(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    
    // Don't retry if circuit breaker is open
    if (metadata.circuitBreakerStatus === 'OPEN') {
      return false;
    }
    
    // Don't retry if we've already reached max attempts
    if (metadata.retryAttempts !== undefined && 
        metadata.maxRetryAttempts !== undefined &&
        metadata.retryAttempts >= metadata.maxRetryAttempts) {
      return false;
    }
    
    // Don't retry for certain status codes (4xx client errors except 429 Too Many Requests)
    if (metadata.statusCode && 
        metadata.statusCode >= 400 && 
        metadata.statusCode < 500 && 
        metadata.statusCode !== 429) {
      return false;
    }
    
    // Otherwise, the error is potentially retriable
    return true;
  }

  /**
   * Checks if a fallback strategy is available
   * 
   * @returns True if a fallback strategy is available, false otherwise
   */
  hasFallbackStrategy(): boolean {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.hasFallback === true && 
           metadata.fallbackStrategy !== undefined && 
           metadata.fallbackStrategy !== 'NONE';
  }

  /**
   * Gets the fallback strategy type
   * 
   * @returns The fallback strategy type or undefined if none is available
   */
  getFallbackStrategy(): string | undefined {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    return metadata.fallbackStrategy;
  }

  /**
   * Creates a new instance of this exception with updated retry information
   * 
   * @param retryAttempts - The updated number of retry attempts
   * @returns A new AchievementExternalServiceException with updated retry information
   */
  withRetryAttempt(retryAttempts: number): AchievementExternalServiceException {
    const metadata = this.metadata as ExternalServiceErrorMetadata;
    
    return new AchievementExternalServiceException(
      this.message,
      {
        ...metadata,
        retryAttempts
      },
      this.cause
    );
  }
}