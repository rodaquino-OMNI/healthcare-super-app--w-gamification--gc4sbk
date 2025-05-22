/**
 * @file external.errors.ts
 * @description Specialized error classes for external system integration errors.
 * 
 * This file defines error classes for handling failures in external systems,
 * third-party APIs, and service dependencies. These errors extend the BaseError
 * with ErrorType.EXTERNAL and provide standardized handling for integration failures.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyType } from '../base';
import { ErrorContext } from '../types';
import { COMMON_ERROR_CODES, ERROR_MESSAGES, RETRY_CONFIG } from '../constants';

/**
 * Base class for all external system errors.
 * Provides common functionality for errors related to external dependencies.
 */
export abstract class ExternalError extends BaseError {
  /**
   * Creates a new ExternalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ) {
    super(message, ErrorType.EXTERNAL, code, context, details, cause);
  }

  /**
   * Creates a new ExternalError with retry information.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param isTransient - Whether the error is transient and can be retried
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   * @returns A new ExternalError instance with retry information
   */
  static withRetry(
    message: string,
    code: string,
    isTransient: boolean = true,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ): ExternalError {
    return new ExternalApiError(
      message,
      code,
      {
        ...context,
        isTransient,
        retryStrategy: isTransient ? {
          maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
          baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
          useExponentialBackoff: true
        } : undefined
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when an external API call fails.
 * Includes HTTP status code and response details when available.
 */
export class ExternalApiError extends ExternalError {
  /**
   * HTTP status code from the external API response, if available.
   */
  public readonly statusCode?: number;

  /**
   * Creates a new ExternalApiError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   * @param statusCode - HTTP status code from the external API response
   */
  constructor(
    message: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error,
    statusCode?: number
  ) {
    super(message, code, context, details, cause);
    this.statusCode = statusCode;

    // Add status code to details if provided
    if (statusCode && this.details) {
      if (typeof this.details === 'object') {
        this.details.statusCode = statusCode;
      }
    }
  }

  /**
   * Creates an ExternalApiError from an HTTP response.
   * 
   * @param response - HTTP response object or status code
   * @param message - Optional custom error message
   * @param code - Optional custom error code
   * @param context - Additional context information
   * @param cause - Original error that caused this exception
   * @returns A new ExternalApiError instance
   */
  static fromResponse(
    response: { status: number; statusText?: string; data?: any } | number,
    message?: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): ExternalApiError {
    const statusCode = typeof response === 'number' ? response : response.status;
    const statusText = typeof response === 'number' ? '' : response.statusText;
    const responseData = typeof response === 'number' ? undefined : response.data;
    
    const errorMessage = message || 
      `External API request failed with status ${statusCode}${statusText ? `: ${statusText}` : ''}`;
    
    return new ExternalApiError(
      errorMessage,
      code,
      context,
      { response: responseData },
      cause,
      statusCode
    );
  }

  /**
   * Determines if this error represents a server-side failure (5xx status).
   * @returns True if the error represents a server-side failure
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Determines if this error represents a client-side failure (4xx status).
   * @returns True if the error represents a client-side failure
   */
  isClientError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Determines if this error should be retried based on the status code.
   * Generally, 5xx errors are retryable while 4xx errors are not.
   * 
   * @returns True if the error should be retried
   */
  isRetryable(): boolean {
    // No status code means we can't determine, so default to true
    if (this.statusCode === undefined) {
      return true;
    }
    
    // 429 (Too Many Requests) is retryable
    if (this.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      return true;
    }
    
    // 408 (Request Timeout) is retryable
    if (this.statusCode === HttpStatus.REQUEST_TIMEOUT) {
      return true;
    }
    
    // 5xx errors are generally retryable
    return this.isServerError();
  }
}

/**
 * Error thrown when an integration with an external system fails.
 * Used for more complex integrations beyond simple API calls.
 */
export class IntegrationError extends ExternalError {
  /**
   * Creates a new IntegrationError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param integrationName - Name of the integration that failed
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    integrationName?: string,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      code,
      context,
      {
        ...details,
        integrationName
      },
      cause
    );
  }

  /**
   * Creates an IntegrationError for a specific journey.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param integrationName - Name of the integration that failed
   * @param journeyType - Type of journey where the integration failed
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   * @returns A new IntegrationError instance with journey context
   */
  static forJourney(
    message: string,
    code: string,
    integrationName: string,
    journeyType: JourneyType,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ): IntegrationError {
    return new IntegrationError(
      message,
      code,
      integrationName,
      {
        ...context,
        journey: journeyType
      },
      details,
      cause
    );
  }
}

/**
 * Error thrown when an external dependency is unavailable.
 * Used when a required external service cannot be reached.
 */
export class ExternalDependencyUnavailableError extends ExternalError {
  /**
   * Creates a new ExternalDependencyUnavailableError instance.
   * 
   * @param dependencyName - Name of the unavailable dependency
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    dependencyName: string,
    message?: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ) {
    super(
      message || `External dependency '${dependencyName}' is unavailable`,
      code,
      {
        ...context,
        isTransient: true,
        retryStrategy: {
          maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
          baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
          useExponentialBackoff: true
        }
      },
      {
        ...details,
        dependencyName
      },
      cause
    );
  }
}

/**
 * Error thrown when authentication with an external system fails.
 * Used for API key, OAuth, or other authentication failures.
 */
export class ExternalAuthenticationError extends ExternalError {
  /**
   * Creates a new ExternalAuthenticationError instance.
   * 
   * @param serviceName - Name of the external service
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    serviceName: string,
    message?: string,
    code: string = COMMON_ERROR_CODES.UNAUTHORIZED,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ) {
    super(
      message || `Authentication failed for external service '${serviceName}'`,
      code,
      context,
      {
        ...details,
        serviceName
      },
      cause
    );
  }

  /**
   * Determines if this error is likely due to expired credentials.
   * Useful for implementing credential refresh logic.
   * 
   * @param errorMessage - Optional error message to check for expiration indicators
   * @returns True if the error appears to be due to expired credentials
   */
  isCredentialExpired(errorMessage?: string): boolean {
    const messageToCheck = errorMessage || this.message;
    const expirationKeywords = [
      'expired',
      'expir',
      'token expired',
      'credential expired',
      'invalid token',
      'refresh token',
      'refresh required'
    ];
    
    return expirationKeywords.some(keyword => 
      messageToCheck.toLowerCase().includes(keyword.toLowerCase())
    );
  }
}

/**
 * Error thrown when an external system returns a response in an unexpected format.
 * Used when parsing or validating external API responses fails.
 */
export class ExternalResponseFormatError extends ExternalError {
  /**
   * Creates a new ExternalResponseFormatError instance.
   * 
   * @param message - Human-readable error message
   * @param response - The invalid response that caused the error
   * @param expectedFormat - Description of the expected format
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    response: any,
    expectedFormat?: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      code,
      context,
      {
        response: typeof response === 'string' ? response : JSON.stringify(response),
        expectedFormat
      },
      cause
    );
  }

  /**
   * Creates an ExternalResponseFormatError for a missing required field.
   * 
   * @param fieldName - Name of the missing field
   * @param response - The response that's missing the field
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @returns A new ExternalResponseFormatError instance
   */
  static missingRequiredField(
    fieldName: string,
    response: any,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>
  ): ExternalResponseFormatError {
    return new ExternalResponseFormatError(
      `External API response is missing required field: ${fieldName}`,
      response,
      `Response must include '${fieldName}' field`,
      code,
      context
    );
  }

  /**
   * Creates an ExternalResponseFormatError for an invalid field value.
   * 
   * @param fieldName - Name of the field with an invalid value
   * @param value - The invalid value
   * @param expectedType - Expected type or format of the field
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @returns A new ExternalResponseFormatError instance
   */
  static invalidFieldValue(
    fieldName: string,
    value: any,
    expectedType: string,
    code: string = COMMON_ERROR_CODES.EXTERNAL_SERVICE_ERROR,
    context?: Partial<ErrorContext>
  ): ExternalResponseFormatError {
    return new ExternalResponseFormatError(
      `External API response contains invalid value for field '${fieldName}': ${value}`,
      { [fieldName]: value },
      `Field '${fieldName}' should be of type ${expectedType}`,
      code,
      context
    );
  }
}

/**
 * Error thrown when an external system enforces rate limiting.
 * Includes retry-after information when available.
 */
export class ExternalRateLimitError extends ExternalError {
  /**
   * Time in milliseconds to wait before retrying.
   */
  public readonly retryAfterMs: number;

  /**
   * Creates a new ExternalRateLimitError instance.
   * 
   * @param message - Human-readable error message
   * @param retryAfterMs - Time in milliseconds to wait before retrying
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    retryAfterMs: number,
    code: string = COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    context?: Partial<ErrorContext>,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        ...context,
        isTransient: true,
        retryStrategy: {
          maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
          baseDelayMs: retryAfterMs || RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
          useExponentialBackoff: retryAfterMs ? false : true
        }
      },
      {
        ...details,
        retryAfterMs
      },
      cause
    );
    
    this.retryAfterMs = retryAfterMs;
  }

  /**
   * Creates an ExternalRateLimitError from an HTTP response with Retry-After header.
   * 
   * @param response - HTTP response object with headers
   * @param defaultRetryMs - Default retry time if header is not present
   * @param message - Optional custom error message
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @returns A new ExternalRateLimitError instance
   */
  static fromResponse(
    response: { headers?: Record<string, string> | { get?(name: string): string | null } },
    defaultRetryMs: number = 60000,
    message?: string,
    code: string = COMMON_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    context?: Partial<ErrorContext>
  ): ExternalRateLimitError {
    let retryAfter: string | null | undefined;
    
    // Handle different header access patterns
    if (response.headers) {
      if (typeof response.headers.get === 'function') {
        retryAfter = response.headers.get('Retry-After');
      } else {
        retryAfter = response.headers['Retry-After'] || response.headers['retry-after'];
      }
    }
    
    let retryAfterMs = defaultRetryMs;
    
    if (retryAfter) {
      // If Retry-After is a number, it's in seconds
      if (/^\d+$/.test(retryAfter)) {
        retryAfterMs = parseInt(retryAfter, 10) * 1000;
      } else {
        // If it's a date, calculate the difference
        try {
          const retryDate = new Date(retryAfter);
          const now = new Date();
          retryAfterMs = Math.max(0, retryDate.getTime() - now.getTime());
        } catch (e) {
          // If parsing fails, use the default
          retryAfterMs = defaultRetryMs;
        }
      }
    }
    
    return new ExternalRateLimitError(
      message || 'Rate limit exceeded for external API',
      retryAfterMs,
      code,
      context
    );
  }

  /**
   * Gets the retry delay in seconds.
   * @returns Retry delay in seconds
   */
  getRetryAfterSeconds(): number {
    return Math.ceil(this.retryAfterMs / 1000);
  }
}

/**
 * Error thrown when an external system times out.
 * Used for request timeouts, connection timeouts, etc.
 */
export class ExternalTimeoutError extends ExternalError {
  /**
   * Creates a new ExternalTimeoutError instance.
   * 
   * @param message - Human-readable error message
   * @param timeoutMs - Timeout duration in milliseconds
   * @param operationName - Name of the operation that timed out
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    timeoutMs?: number,
    operationName?: string,
    code: string = COMMON_ERROR_CODES.TIMEOUT,
    context?: Partial<ErrorContext>,
    cause?: Error
  ) {
    super(
      message,
      code,
      {
        ...context,
        isTransient: true,
        retryStrategy: {
          maxAttempts: RETRY_CONFIG.EXTERNAL_API.MAX_ATTEMPTS,
          baseDelayMs: RETRY_CONFIG.EXTERNAL_API.INITIAL_DELAY_MS,
          useExponentialBackoff: true
        }
      },
      {
        timeoutMs,
        operationName
      },
      cause
    );
  }

  /**
   * Creates an ExternalTimeoutError with a standard message format.
   * 
   * @param operationName - Name of the operation that timed out
   * @param timeoutMs - Timeout duration in milliseconds
   * @param code - Error code for more specific categorization
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception
   * @returns A new ExternalTimeoutError instance
   */
  static fromOperation(
    operationName: string,
    timeoutMs: number,
    code: string = COMMON_ERROR_CODES.TIMEOUT,
    context?: Partial<ErrorContext>,
    cause?: Error
  ): ExternalTimeoutError {
    return new ExternalTimeoutError(
      `Operation '${operationName}' timed out after ${timeoutMs}ms`,
      timeoutMs,
      operationName,
      code,
      context,
      cause
    );
  }
}