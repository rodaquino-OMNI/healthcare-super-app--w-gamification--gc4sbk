import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { SystemException } from './system.exception';

/**
 * Fallback strategy types for external dependency failures
 */
export enum FallbackStrategy {
  NONE = 'NONE',                 // No fallback available
  CACHED_DATA = 'CACHED_DATA',   // Use cached data from previous successful calls
  DEFAULT_VALUE = 'DEFAULT_VALUE', // Use a predefined default value
  DEGRADED = 'DEGRADED',         // Provide degraded functionality
  ALTERNATIVE = 'ALTERNATIVE',   // Use an alternative service or implementation
  RETRY = 'RETRY',               // Retry the operation with backoff
}

/**
 * Service degradation level when external dependencies fail
 */
export enum DegradationLevel {
  NONE = 'NONE',           // No degradation, full functionality
  MINOR = 'MINOR',         // Minor features unavailable
  MODERATE = 'MODERATE',   // Some important features unavailable
  SEVERE = 'SEVERE',       // Major functionality impacted
  CRITICAL = 'CRITICAL',   // Service barely functional
  COMPLETE = 'COMPLETE',   // Service completely unavailable
}

/**
 * External dependency metadata interface
 */
export interface ExternalDependencyMetadata extends ErrorMetadata {
  serviceName?: string;           // Name of the external service
  endpoint?: string;              // Specific endpoint or operation
  fallbackStrategy?: FallbackStrategy; // Strategy used for fallback
  degradationLevel?: DegradationLevel; // Level of service degradation
  circuitBreakerStatus?: string;  // Current circuit breaker status
  retryAttempts?: number;         // Number of retry attempts made
  timeout?: number;               // Timeout configuration in ms
  lastSuccessfulCall?: Date;      // Timestamp of last successful call
  isTransient?: boolean;          // Whether error is likely transient
  recommendedWaitTime?: number;   // Recommended wait time before retry in ms
}

/**
 * Base class for exceptions related to external dependency failures.
 * Provides context for circuit breaker implementations, fallback strategies,
 * and degraded service operations when integrations with external systems fail.
 */
export class ExternalDependencyException extends SystemException {
  /**
   * Creates a new ExternalDependencyException instance
   * 
   * @param message Human-readable error message
   * @param errorType Error type classification (defaults to EXTERNAL_SERVICE_ERROR)
   * @param statusCode HTTP status code (defaults to 502 Bad Gateway)
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    errorType: ErrorType = ErrorType.EXTERNAL_SERVICE_ERROR,
    statusCode: HttpStatus = HttpStatus.BAD_GATEWAY,
    cause?: Error,
    metadata: ExternalDependencyMetadata = {},
    context: ErrorContext = {},
  ) {
    super(message, errorType, statusCode, cause, metadata, context);
    
    // Add external dependency error flag for filtering in logs and monitoring
    this.addMetadata('isExternalDependencyError', true);
    
    // Set default fallback strategy if not provided
    if (!metadata.fallbackStrategy) {
      this.addMetadata('fallbackStrategy', FallbackStrategy.NONE);
    }
    
    // Set default degradation level if not provided
    if (!metadata.degradationLevel) {
      this.addMetadata('degradationLevel', DegradationLevel.MODERATE);
    }
    
    // Determine if error is likely transient
    const isTransient = this.determineIfTransient(cause);
    this.addMetadata('isTransient', isTransient);
    
    // Add timestamp for error occurrence
    this.addMetadata('errorTimestamp', new Date().toISOString());
  }
  
  /**
   * Creates an ExternalDependencyException for timeout errors
   * 
   * @param serviceName Name of the external service
   * @param endpoint Specific endpoint or operation
   * @param timeout Timeout configuration in ms
   * @param cause Original error
   * @returns ExternalDependencyException instance
   */
  static timeout(
    serviceName: string,
    endpoint: string,
    timeout: number,
    cause?: Error,
  ): ExternalDependencyException {
    const message = `Request to ${serviceName} (${endpoint}) timed out after ${timeout}ms`;
    
    return new ExternalDependencyException(
      message,
      ErrorType.TIMEOUT_ERROR,
      HttpStatus.GATEWAY_TIMEOUT,
      cause,
      {
        serviceName,
        endpoint,
        timeout,
        isTransient: true,
        fallbackStrategy: FallbackStrategy.RETRY,
        degradationLevel: DegradationLevel.MODERATE,
        recommendedWaitTime: timeout * 2, // Double the timeout for retry
      },
    );
  }
  
  /**
   * Creates an ExternalDependencyException for connection errors
   * 
   * @param serviceName Name of the external service
   * @param endpoint Specific endpoint or operation
   * @param cause Original error
   * @returns ExternalDependencyException instance
   */
  static connectionError(
    serviceName: string,
    endpoint: string,
    cause?: Error,
  ): ExternalDependencyException {
    const message = `Failed to connect to ${serviceName} (${endpoint})`;
    
    return new ExternalDependencyException(
      message,
      ErrorType.CONNECTION_ERROR,
      HttpStatus.BAD_GATEWAY,
      cause,
      {
        serviceName,
        endpoint,
        isTransient: true,
        fallbackStrategy: FallbackStrategy.RETRY,
        degradationLevel: DegradationLevel.MODERATE,
        recommendedWaitTime: 5000, // 5 seconds
      },
    );
  }
  
  /**
   * Creates an ExternalDependencyException for API errors
   * 
   * @param serviceName Name of the external service
   * @param endpoint Specific endpoint or operation
   * @param statusCode HTTP status code from the external service
   * @param responseBody Response body from the external service
   * @param cause Original error
   * @returns ExternalDependencyException instance
   */
  static apiError(
    serviceName: string,
    endpoint: string,
    statusCode: number,
    responseBody?: any,
    cause?: Error,
  ): ExternalDependencyException {
    const message = `API error from ${serviceName} (${endpoint}): ${statusCode}`;
    
    // Determine if the error is likely transient based on status code
    const isTransient = statusCode >= 500 || statusCode === 429;
    
    // Determine appropriate fallback strategy
    let fallbackStrategy = FallbackStrategy.NONE;
    if (isTransient) {
      fallbackStrategy = FallbackStrategy.RETRY;
    } else if (statusCode === 404) {
      fallbackStrategy = FallbackStrategy.DEFAULT_VALUE;
    } else {
      fallbackStrategy = FallbackStrategy.DEGRADED;
    }
    
    // Determine degradation level based on status code
    let degradationLevel = DegradationLevel.MODERATE;
    if (statusCode >= 500) {
      degradationLevel = DegradationLevel.SEVERE;
    } else if (statusCode === 429) {
      degradationLevel = DegradationLevel.MODERATE;
    } else if (statusCode >= 400) {
      degradationLevel = DegradationLevel.MINOR;
    }
    
    return new ExternalDependencyException(
      message,
      ErrorType.API_ERROR,
      HttpStatus.BAD_GATEWAY,
      cause,
      {
        serviceName,
        endpoint,
        externalStatusCode: statusCode,
        responseBody: responseBody ? JSON.stringify(responseBody).substring(0, 1000) : undefined,
        isTransient,
        fallbackStrategy,
        degradationLevel,
        recommendedWaitTime: statusCode === 429 ? 30000 : 5000, // 30 seconds for rate limiting, 5 seconds for other errors
      },
    );
  }
  
  /**
   * Creates an ExternalDependencyException with circuit breaker context
   * 
   * @param serviceName Name of the external service
   * @param circuitBreakerStatus Current circuit breaker status
   * @param resetTimeoutRemaining Time remaining until circuit breaker resets
   * @returns ExternalDependencyException instance
   */
  static circuitOpen(
    serviceName: string,
    circuitBreakerStatus: string,
    resetTimeoutRemaining: number,
  ): ExternalDependencyException {
    const message = `Circuit breaker for ${serviceName} is ${circuitBreakerStatus.toLowerCase()}`;
    
    return new ExternalDependencyException(
      message,
      ErrorType.EXTERNAL_SERVICE_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
      undefined,
      {
        serviceName,
        circuitBreakerStatus,
        resetTimeoutRemaining,
        retryAfter: Math.ceil(resetTimeoutRemaining / 1000),
        isTransient: true,
        fallbackStrategy: FallbackStrategy.DEGRADED,
        degradationLevel: DegradationLevel.SEVERE,
      },
    );
  }
  
  /**
   * Determines if an error is likely transient based on its type and message
   * 
   * @param error The error to analyze
   * @returns True if the error is likely transient
   */
  private determineIfTransient(error?: Error): boolean {
    if (!error) return false;
    
    // Check error type
    if (
      this.errorType === ErrorType.TIMEOUT_ERROR ||
      this.errorType === ErrorType.CONNECTION_ERROR ||
      this.errorType === ErrorType.NETWORK_ERROR
    ) {
      return true;
    }
    
    // Check error message for common transient error patterns
    const transientPatterns = [
      /timeout/i,
      /connection refused/i,
      /network/i,
      /econnrefused/i,
      /econnreset/i,
      /socket hang up/i,
      /ETIMEDOUT/i,
      /ESOCKETTIMEDOUT/i,
      /ENOTFOUND/i,
      /too many requests/i,
      /rate limit/i,
      /temporarily unavailable/i,
      /internal server error/i,
      /service unavailable/i,
      /bad gateway/i,
      /gateway timeout/i,
      /503/i,
      /502/i,
      /504/i,
      /429/i,
    ];
    
    return transientPatterns.some(pattern => pattern.test(error.message));
  }
  
  /**
   * Determines if this exception represents a transient error that can be retried
   * 
   * @returns True if this error is transient and can be retried
   */
  isTransientError(): boolean {
    return this.metadata.isTransient === true;
  }
  
  /**
   * Gets the recommended wait time before retrying
   * 
   * @param attemptNumber Current attempt number (1-based)
   * @returns Recommended wait time in milliseconds
   */
  getRecommendedWaitTime(attemptNumber: number = 1): number {
    const baseWaitTime = this.metadata.recommendedWaitTime || 5000;
    
    // Implement exponential backoff with jitter
    const exponentialPart = Math.pow(2, Math.min(attemptNumber - 1, 8)) * baseWaitTime;
    const jitter = Math.random() * 0.3 * exponentialPart; // 0-30% jitter
    
    return Math.min(exponentialPart + jitter, 300000); // Cap at 5 minutes
  }
  
  /**
   * Gets the fallback strategy for this exception
   * 
   * @returns Fallback strategy
   */
  getFallbackStrategy(): FallbackStrategy {
    return this.metadata.fallbackStrategy || FallbackStrategy.NONE;
  }
  
  /**
   * Gets the degradation level for this exception
   * 
   * @returns Degradation level
   */
  getDegradationLevel(): DegradationLevel {
    return this.metadata.degradationLevel || DegradationLevel.MODERATE;
  }
  
  /**
   * Gets client-safe metadata for responses
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    // Only include safe metadata for client responses
    const safeMetadata: Record<string, any> = {};
    
    // Include retry-after header value if available
    if (this.metadata.retryAfter) {
      safeMetadata.retryAfter = this.metadata.retryAfter;
    }
    
    // Include service name for context
    if (this.metadata.serviceName) {
      safeMetadata.service = this.metadata.serviceName;
    }
    
    // Include degradation level for UI adaptation
    if (this.metadata.degradationLevel) {
      safeMetadata.degradationLevel = this.metadata.degradationLevel;
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Gets a client-safe error message
   * 
   * @returns Client-safe error message
   */
  getClientMessage(): string {
    // For external dependency errors, provide a user-friendly message
    // that doesn't expose internal details but gives context
    const serviceName = this.metadata.serviceName || 'external service';
    
    switch (this.errorType) {
      case ErrorType.TIMEOUT_ERROR:
        return `Request to ${serviceName} timed out. Please try again later.`;
      case ErrorType.CONNECTION_ERROR:
      case ErrorType.NETWORK_ERROR:
        return `Unable to connect to ${serviceName}. Please try again later.`;
      case ErrorType.API_ERROR:
        return `Error communicating with ${serviceName}. Please try again later.`;
      default:
        return `Service temporarily unavailable due to an issue with ${serviceName}. Please try again later.`;
    }
  }
}