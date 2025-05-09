/**
 * @file external.errors.ts
 * @description Defines specialized error classes for external system integration errors.
 * These errors represent failures in third-party APIs, services, and dependencies.
 * All errors in this file extend the BaseError class with ErrorType.EXTERNAL.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext, ErrorContext } from '../base';
import { ERROR_CODE_PREFIXES } from '../constants';

/**
 * Base class for all external system errors.
 * Provides common functionality for external integration errors.
 */
export class ExternalError extends BaseError {
  /**
   * The name of the external service or system that caused the error
   */
  public readonly serviceName: string;

  /**
   * The HTTP status code returned by the external service, if applicable
   */
  public readonly externalStatusCode?: number;

  /**
   * The raw error response from the external service, if available
   */
  public readonly externalResponse?: any;

  /**
   * Creates a new ExternalError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for more specific categorization
   * @param serviceName - Name of the external service or system
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external service
   * @param externalResponse - Raw error response from the external service
   * @param details - Additional details about the error
   * @param suggestion - Suggested action to resolve the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    code: string,
    serviceName: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    externalResponse?: any,
    details?: any,
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

    this.serviceName = serviceName;
    this.externalStatusCode = externalStatusCode;
    this.externalResponse = externalResponse;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalError.prototype);
  }

  /**
   * Returns a JSON representation of the error with external service details.
   * Extends the base toJSON method with external-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        serviceName: this.serviceName,
        externalStatusCode: this.externalStatusCode,
        externalResponse: this.externalResponse
      }
    };
  }

  /**
   * Determines if the error is retryable based on the external status code.
   * Generally, 5xx errors and some specific 4xx errors are retryable.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // If there's no status code, use the base implementation
    if (!this.externalStatusCode) {
      return super.isRetryable();
    }

    // 5xx errors are generally retryable
    if (this.externalStatusCode >= 500 && this.externalStatusCode < 600) {
      return true;
    }

    // Some specific 4xx errors are retryable
    return this.externalStatusCode === HttpStatus.TOO_MANY_REQUESTS || // 429
           this.externalStatusCode === HttpStatus.REQUEST_TIMEOUT;    // 408
  }

  /**
   * Creates a new ExternalError with additional context information.
   * Overrides the base withContext method to preserve external-specific properties.
   * 
   * @param additionalContext - Additional context to add to the error
   * @returns A new ExternalError instance with combined context
   */
  withContext(additionalContext: Partial<ErrorContext>): ExternalError {
    return new ExternalError(
      this.message,
      this.code,
      this.serviceName,
      { ...this.context, ...additionalContext },
      this.externalStatusCode,
      this.externalResponse,
      this.details,
      this.suggestion,
      this.cause
    );
  }

  /**
   * Creates a new ExternalError with additional details.
   * Overrides the base withDetails method to preserve external-specific properties.
   * 
   * @param additionalDetails - Additional details to add to the error
   * @returns A new ExternalError instance with combined details
   */
  withDetails(additionalDetails: any): ExternalError {
    return new ExternalError(
      this.message,
      this.code,
      this.serviceName,
      this.context,
      this.externalStatusCode,
      this.externalResponse,
      { ...this.details, ...additionalDetails },
      this.suggestion,
      this.cause
    );
  }

  /**
   * Creates a new ExternalError with a suggestion for resolving the error.
   * Overrides the base withSuggestion method to preserve external-specific properties.
   * 
   * @param suggestion - Suggestion for resolving the error
   * @returns A new ExternalError instance with the suggestion
   */
  withSuggestion(suggestion: string): ExternalError {
    return new ExternalError(
      this.message,
      this.code,
      this.serviceName,
      this.context,
      this.externalStatusCode,
      this.externalResponse,
      this.details,
      suggestion,
      this.cause
    );
  }

  /**
   * Creates a new ExternalError with a cause.
   * Overrides the base withCause method to preserve external-specific properties.
   * 
   * @param cause - The error that caused this error
   * @returns A new ExternalError instance with the cause
   */
  withCause(cause: Error): ExternalError {
    return new ExternalError(
      this.message,
      this.code,
      this.serviceName,
      this.context,
      this.externalStatusCode,
      this.externalResponse,
      this.details,
      this.suggestion,
      cause
    );
  }
}

/**
 * Represents errors that occur when calling external APIs.
 * Used for HTTP/REST API integration failures.
 */
export class ExternalApiError extends ExternalError {
  /**
   * The HTTP method used in the API request
   */
  public readonly method?: string;

  /**
   * The URL or endpoint of the API request
   */
  public readonly url?: string;

  /**
   * Creates a new ExternalApiError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external API service
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external API
   * @param method - HTTP method used in the API request
   * @param url - URL or endpoint of the API request
   * @param externalResponse - Raw error response from the external API
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    method?: string,
    url?: string,
    externalResponse?: any,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_API_001`,
      serviceName,
      context,
      externalStatusCode,
      externalResponse,
      details,
      getApiErrorSuggestion(externalStatusCode),
      cause
    );

    this.method = method;
    this.url = url;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalApiError.prototype);
  }

  /**
   * Returns a JSON representation of the error with API-specific details.
   * Extends the base toJSON method with API-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        method: this.method,
        url: this.url
      }
    };
  }

  /**
   * Creates a factory method for journey-specific API errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific API errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, context: ErrorContext = {}, externalStatusCode?: number, method?: string, url?: string, externalResponse?: any, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new ExternalApiError(message, serviceName, journeyContext, externalStatusCode, method, url, externalResponse, details, cause);
    };
  }
}

/**
 * Represents errors that occur with general third-party integrations.
 * Used for non-HTTP integration failures (e.g., SDK, library).
 */
export class IntegrationError extends ExternalError {
  /**
   * The integration type or technology (e.g., 'sdk', 'library', 'database')
   */
  public readonly integrationType: string;

  /**
   * The operation that was being performed (e.g., 'connect', 'query', 'sync')
   */
  public readonly operation: string;

  /**
   * Creates a new IntegrationError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external integration service
   * @param integrationType - Type of integration (sdk, library, etc.)
   * @param operation - Operation that was being performed
   * @param context - Additional context information about the error
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    integrationType: string,
    operation: string,
    context: ErrorContext = {},
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_INT_001`,
      serviceName,
      context,
      undefined,
      undefined,
      details,
      `Verify the ${integrationType} integration with ${serviceName} and check if the service is available.`,
      cause
    );

    this.integrationType = integrationType;
    this.operation = operation;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, IntegrationError.prototype);
  }

  /**
   * Returns a JSON representation of the error with integration-specific details.
   * Extends the base toJSON method with integration-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        integrationType: this.integrationType,
        operation: this.operation
      }
    };
  }

  /**
   * Creates a factory method for journey-specific integration errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific integration errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, integrationType: string, operation: string, context: ErrorContext = {}, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new IntegrationError(message, serviceName, integrationType, operation, journeyContext, details, cause);
    };
  }
}

/**
 * Represents errors that occur when an external dependency is unavailable.
 * Used for service outages, connection failures, and unreachable dependencies.
 */
export class ExternalDependencyUnavailableError extends ExternalError {
  /**
   * The dependency type (e.g., 'database', 'api', 'service')
   */
  public readonly dependencyType: string;

  /**
   * Creates a new ExternalDependencyUnavailableError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external dependency
   * @param dependencyType - Type of dependency (database, api, service, etc.)
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external service
   * @param externalResponse - Raw error response from the external service
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    dependencyType: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    externalResponse?: any,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_DEP_001`,
      serviceName,
      context,
      externalStatusCode,
      externalResponse,
      details,
      `Check if the ${dependencyType} ${serviceName} is operational and accessible from your environment.`,
      cause
    );

    this.dependencyType = dependencyType;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalDependencyUnavailableError.prototype);
  }

  /**
   * Returns a JSON representation of the error with dependency-specific details.
   * Extends the base toJSON method with dependency-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        dependencyType: this.dependencyType
      }
    };
  }

  /**
   * Always returns true as dependency unavailable errors are retryable.
   * These errors typically represent transient issues that may resolve themselves.
   * 
   * @returns True, indicating the error is retryable
   */
  isRetryable(): boolean {
    return true;
  }

  /**
   * Creates a factory method for journey-specific dependency unavailable errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific dependency unavailable errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, dependencyType: string, context: ErrorContext = {}, externalStatusCode?: number, externalResponse?: any, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new ExternalDependencyUnavailableError(message, serviceName, dependencyType, journeyContext, externalStatusCode, externalResponse, details, cause);
    };
  }
}

/**
 * Represents errors that occur when authentication with an external system fails.
 * Used for API key issues, token expiration, invalid credentials, etc.
 */
export class ExternalAuthenticationError extends ExternalError {
  /**
   * The authentication method used (e.g., 'api_key', 'oauth', 'jwt')
   */
  public readonly authMethod: string;

  /**
   * Creates a new ExternalAuthenticationError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external service
   * @param authMethod - Authentication method used
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external service
   * @param externalResponse - Raw error response from the external service
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    authMethod: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    externalResponse?: any,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_AUTH_001`,
      serviceName,
      context,
      externalStatusCode,
      externalResponse,
      details,
      `Verify the ${authMethod} credentials for ${serviceName} and ensure they are valid and not expired.`,
      cause
    );

    this.authMethod = authMethod;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalAuthenticationError.prototype);
  }

  /**
   * Returns a JSON representation of the error with authentication-specific details.
   * Extends the base toJSON method with authentication-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        authMethod: this.authMethod
      }
    };
  }

  /**
   * Determines if the error is retryable based on the authentication method.
   * Some authentication failures (like token expiration) may be retryable,
   * while others (like invalid credentials) are not.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // Token expiration is potentially retryable (with token refresh)
    if (this.authMethod === 'oauth' || this.authMethod === 'jwt') {
      return true;
    }

    // Other authentication failures are generally not retryable
    return false;
  }

  /**
   * Creates a factory method for journey-specific authentication errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific authentication errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, authMethod: string, context: ErrorContext = {}, externalStatusCode?: number, externalResponse?: any, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new ExternalAuthenticationError(message, serviceName, authMethod, journeyContext, externalStatusCode, externalResponse, details, cause);
    };
  }
}

/**
 * Represents errors that occur when an external system returns data in an unexpected format.
 * Used for parsing failures, schema validation errors, and unexpected response structures.
 */
export class ExternalResponseFormatError extends ExternalError {
  /**
   * The expected format or schema
   */
  public readonly expectedFormat: string;

  /**
   * The received format or data snippet
   */
  public readonly receivedFormat?: string;

  /**
   * Creates a new ExternalResponseFormatError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external service
   * @param expectedFormat - Expected format or schema
   * @param receivedFormat - Received format or data snippet
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external service
   * @param externalResponse - Raw error response from the external service
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    expectedFormat: string,
    receivedFormat?: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    externalResponse?: any,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_FORMAT_001`,
      serviceName,
      context,
      externalStatusCode,
      externalResponse,
      details,
      `Check if the ${serviceName} API has changed its response format or if there's a version mismatch.`,
      cause
    );

    this.expectedFormat = expectedFormat;
    this.receivedFormat = receivedFormat;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalResponseFormatError.prototype);
  }

  /**
   * Returns a JSON representation of the error with format-specific details.
   * Extends the base toJSON method with format-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        expectedFormat: this.expectedFormat,
        receivedFormat: this.receivedFormat
      }
    };
  }

  /**
   * Format errors are generally not retryable as they indicate a structural issue.
   * 
   * @returns False, indicating the error is not retryable
   */
  isRetryable(): boolean {
    return false;
  }

  /**
   * Creates a factory method for journey-specific response format errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific response format errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, expectedFormat: string, receivedFormat?: string, context: ErrorContext = {}, externalStatusCode?: number, externalResponse?: any, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new ExternalResponseFormatError(message, serviceName, expectedFormat, receivedFormat, journeyContext, externalStatusCode, externalResponse, details, cause);
    };
  }
}

/**
 * Represents errors that occur when an external system enforces rate limits.
 * Used for tracking rate limit errors and providing retry-after information.
 */
export class ExternalRateLimitError extends ExternalError {
  /**
   * The retry-after time in seconds, if provided by the external service
   */
  public readonly retryAfterSeconds?: number;

  /**
   * The rate limit that was exceeded (e.g., '100 requests per minute')
   */
  public readonly rateLimit?: string;

  /**
   * Creates a new ExternalRateLimitError instance.
   * 
   * @param message - Human-readable error message
   * @param serviceName - Name of the external service
   * @param retryAfterSeconds - Retry-after time in seconds
   * @param rateLimit - Rate limit that was exceeded
   * @param context - Additional context information about the error
   * @param externalStatusCode - HTTP status code from the external service
   * @param externalResponse - Raw error response from the external service
   * @param details - Additional details about the error
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    serviceName: string,
    retryAfterSeconds?: number,
    rateLimit?: string,
    context: ErrorContext = {},
    externalStatusCode?: number,
    externalResponse?: any,
    details?: any,
    cause?: Error
  ) {
    super(
      message,
      `${ERROR_CODE_PREFIXES.GENERAL}_EXT_RATE_001`,
      serviceName,
      context,
      externalStatusCode || HttpStatus.TOO_MANY_REQUESTS,
      externalResponse,
      details,
      `Wait for ${retryAfterSeconds || 'the specified'} seconds before retrying or implement rate limiting in your application.`,
      cause
    );

    this.retryAfterSeconds = retryAfterSeconds;
    this.rateLimit = rateLimit;

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ExternalRateLimitError.prototype);
  }

  /**
   * Returns a JSON representation of the error with rate limit-specific details.
   * Extends the base toJSON method with rate limit-specific information.
   * 
   * @returns JSON object with standardized error structure
   */
  toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        retryAfterSeconds: this.retryAfterSeconds,
        rateLimit: this.rateLimit
      }
    };
  }

  /**
   * Rate limit errors are always retryable, but should respect the retry-after time.
   * 
   * @returns True, indicating the error is retryable
   */
  isRetryable(): boolean {
    return true;
  }

  /**
   * Gets the recommended delay before retrying the request.
   * Uses the retry-after value if provided, otherwise uses a default exponential backoff.
   * 
   * @param attempt - The current retry attempt number (starting from 1)
   * @returns The recommended delay in milliseconds before the next retry
   */
  getRetryDelayMs(attempt: number = 1): number {
    // If retry-after is provided, use it
    if (this.retryAfterSeconds) {
      return this.retryAfterSeconds * 1000;
    }

    // Otherwise, use exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 60000; // 1 minute
    const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
    
    // Add jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
    return exponentialDelay + jitter;
  }

  /**
   * Creates a factory method for journey-specific rate limit errors.
   * 
   * @param journey - The journey context (health, care, plan)
   * @returns A factory function for creating journey-specific rate limit errors
   */
  static forJourney(journey: JourneyContext) {
    return (message: string, serviceName: string, retryAfterSeconds?: number, rateLimit?: string, context: ErrorContext = {}, externalStatusCode?: number, externalResponse?: any, details?: any, cause?: Error) => {
      const journeyContext = { ...context, journey };
      return new ExternalRateLimitError(message, serviceName, retryAfterSeconds, rateLimit, journeyContext, externalStatusCode, externalResponse, details, cause);
    };
  }
}

/**
 * Helper function to generate appropriate suggestions based on API error status codes.
 * 
 * @param statusCode - The HTTP status code from the external API
 * @returns A suggestion string for resolving the error
 */
function getApiErrorSuggestion(statusCode?: number): string {
  if (!statusCode) {
    return 'Check the external API documentation and verify your request format.';
  }

  switch (statusCode) {
    case HttpStatus.BAD_REQUEST: // 400
      return 'Verify your request parameters and format according to the API documentation.';
    case HttpStatus.UNAUTHORIZED: // 401
      return 'Check your authentication credentials and ensure they are valid and not expired.';
    case HttpStatus.FORBIDDEN: // 403
      return 'Verify that your account has permission to access this resource or operation.';
    case HttpStatus.NOT_FOUND: // 404
      return 'Confirm that the requested resource exists and the endpoint URL is correct.';
    case HttpStatus.METHOD_NOT_ALLOWED: // 405
      return 'Verify that you are using the correct HTTP method for this endpoint.';
    case HttpStatus.NOT_ACCEPTABLE: // 406
      return 'Check the Accept headers in your request and ensure they are supported by the API.';
    case HttpStatus.REQUEST_TIMEOUT: // 408
      return 'Consider increasing the request timeout or retry the request later.';
    case HttpStatus.CONFLICT: // 409
      return 'The request conflicts with the current state of the resource. Verify the resource state before retrying.';
    case HttpStatus.GONE: // 410
      return 'The requested resource is no longer available. Update your integration to use an alternative resource.';
    case HttpStatus.PAYLOAD_TOO_LARGE: // 413
      return 'Reduce the size of your request payload or split it into smaller chunks.';
    case HttpStatus.UNSUPPORTED_MEDIA_TYPE: // 415
      return 'Check the Content-Type header in your request and ensure it is supported by the API.';
    case HttpStatus.TOO_MANY_REQUESTS: // 429
      return 'Implement rate limiting in your application and retry the request after the specified delay.';
    case HttpStatus.INTERNAL_SERVER_ERROR: // 500
      return 'This is a server-side error. Retry the request later or contact the API provider if the issue persists.';
    case HttpStatus.NOT_IMPLEMENTED: // 501
      return 'The requested functionality is not supported by the API. Check the API documentation for supported features.';
    case HttpStatus.BAD_GATEWAY: // 502
      return 'The API gateway received an invalid response from an upstream server. Retry the request later.';
    case HttpStatus.SERVICE_UNAVAILABLE: // 503
      return 'The API service is temporarily unavailable. Retry the request after a delay with exponential backoff.';
    case HttpStatus.GATEWAY_TIMEOUT: // 504
      return 'The API gateway timed out waiting for a response from an upstream server. Retry the request later.';
    default:
      if (statusCode >= 400 && statusCode < 500) {
        return 'This is a client error. Review your request and the API documentation to resolve the issue.';
      } else if (statusCode >= 500) {
        return 'This is a server error. Retry the request later or contact the API provider if the issue persists.';
      }
      return 'Check the API documentation and verify your request.';
  }
}