import { BaseError, ErrorType, JourneyContext } from '../base';

/**
 * Base class for all external system integration errors.
 * Used for errors related to external dependencies and third-party services.
 */
export class ExternalError extends BaseError {
  /**
   * Creates a new ExternalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param details - Additional details about the external error
   * @param context - Additional context information about the error
   * @param suggestion - Suggested action to resolve the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    message: string,
    code: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    suggestion?: string,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.EXTERNAL,
      code,
      context,
      details,
      suggestion,
      cause
    );
    this.name = 'ExternalError';
    Object.setPrototypeOf(this, ExternalError.prototype);
  }
}

/**
 * Error thrown when an external API request fails.
 */
export class ExternalApiError extends ExternalError {
  /**
   * Creates a new ExternalApiError instance.
   * 
   * @param serviceName - Name of the external service
   * @param endpoint - API endpoint that failed
   * @param statusCode - HTTP status code returned by the external API
   * @param responseBody - Response body from the external API
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    serviceName: string,
    endpoint: string,
    statusCode?: number,
    responseBody?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    cause?: Error
  ) {
    const statusText = statusCode ? ` returned status ${statusCode}` : ' failed';
    
    super(
      `External API ${serviceName} at ${endpoint}${statusText}`,
      'EXTERNAL_API_ERROR',
      { serviceName, endpoint, statusCode, responseBody },
      context,
      'Please try again later or contact support if the problem persists',
      cause
    );
    this.name = 'ExternalApiError';
    Object.setPrototypeOf(this, ExternalApiError.prototype);
  }
}

/**
 * Error thrown when an integration with an external system fails.
 */
export class IntegrationError extends ExternalError {
  /**
   * Creates a new IntegrationError instance.
   * 
   * @param integrationName - Name of the integration
   * @param message - Human-readable error message
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   * @param cause - Original error that caused this exception, if any
   */
  constructor(
    integrationName: string,
    message: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {},
    cause?: Error
  ) {
    super(
      message,
      'INTEGRATION_ERROR',
      { integrationName, ...details },
      context,
      'Please check the integration configuration and try again',
      cause
    );
    this.name = 'IntegrationError';
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }
}

/**
 * Error thrown when an external dependency is unavailable.
 */
export class ExternalDependencyUnavailableError extends ExternalError {
  /**
   * Creates a new ExternalDependencyUnavailableError instance.
   * 
   * @param dependencyName - Name of the unavailable dependency
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   */
  constructor(
    dependencyName: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `External dependency '${dependencyName}' is currently unavailable`,
      'EXTERNAL_DEPENDENCY_UNAVAILABLE',
      { dependencyName, ...details },
      context,
      'Please try again later'
    );
    this.name = 'ExternalDependencyUnavailableError';
    Object.setPrototypeOf(this, ExternalDependencyUnavailableError.prototype);
  }
}

/**
 * Error thrown when authentication with an external system fails.
 */
export class ExternalAuthenticationError extends ExternalError {
  /**
   * Creates a new ExternalAuthenticationError instance.
   * 
   * @param serviceName - Name of the external service
   * @param details - Additional details about the error
   * @param context - Additional context information about the error
   */
  constructor(
    serviceName: string,
    details?: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `Authentication failed for external service '${serviceName}'`,
      'EXTERNAL_AUTHENTICATION_ERROR',
      { serviceName, ...details },
      context,
      'Please check the authentication credentials for the external service'
    );
    this.name = 'ExternalAuthenticationError';
    Object.setPrototypeOf(this, ExternalAuthenticationError.prototype);
  }
}

/**
 * Error thrown when an external system returns an unexpected response format.
 */
export class ExternalResponseFormatError extends ExternalError {
  /**
   * Creates a new ExternalResponseFormatError instance.
   * 
   * @param serviceName - Name of the external service
   * @param expectedFormat - Expected response format
   * @param actualResponse - Actual response received
   * @param context - Additional context information about the error
   */
  constructor(
    serviceName: string,
    expectedFormat: string,
    actualResponse: any,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    super(
      `External service '${serviceName}' returned unexpected response format`,
      'EXTERNAL_RESPONSE_FORMAT_ERROR',
      { serviceName, expectedFormat, actualResponse },
      context,
      'Please check the integration with the external service'
    );
    this.name = 'ExternalResponseFormatError';
    Object.setPrototypeOf(this, ExternalResponseFormatError.prototype);
  }
}

/**
 * Error thrown when an external system enforces rate limiting.
 */
export class ExternalRateLimitError extends ExternalError {
  /**
   * Creates a new ExternalRateLimitError instance.
   * 
   * @param serviceName - Name of the external service
   * @param retryAfterSeconds - Seconds to wait before retrying
   * @param context - Additional context information about the error
   */
  constructor(
    serviceName: string,
    retryAfterSeconds?: number,
    context: { journey?: JourneyContext; [key: string]: any } = {}
  ) {
    const retryMessage = retryAfterSeconds
      ? `Please retry after ${retryAfterSeconds} seconds`
      : 'Please retry later';
    
    super(
      `Rate limit exceeded for external service '${serviceName}'`,
      'EXTERNAL_RATE_LIMIT_ERROR',
      { serviceName, retryAfterSeconds },
      context,
      retryMessage
    );
    this.name = 'ExternalRateLimitError';
    Object.setPrototypeOf(this, ExternalRateLimitError.prototype);
  }
}