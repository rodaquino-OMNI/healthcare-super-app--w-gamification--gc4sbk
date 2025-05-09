import { 
  ArgumentsHost, 
  Catch, 
  ExceptionFilter, 
  HttpException, 
  HttpStatus, 
  Injectable,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { BaseError, ErrorType, JourneyContext } from '../base';
import { 
  ErrorRecoveryStrategy, 
  SerializedError, 
  ERROR_TYPE_TO_HTTP_STATUS,
  RETRYABLE_HTTP_STATUS_CODES
} from '../types';
import { 
  DEFAULT_RETRY_CONFIG,
  ERROR_MESSAGES
} from '../constants';

/**
 * Configuration options for the GlobalExceptionFilter.
 */
export interface GlobalExceptionFilterOptions {
  /**
   * Whether to include stack traces in error responses in non-production environments.
   * Default: true
   */
  includeStackTraces?: boolean;

  /**
   * Whether to attempt to execute fallback strategies for recoverable errors.
   * Default: true
   */
  executeFallbackStrategies?: boolean;

  /**
   * Whether to include the original error cause in the response details.
   * Only applies to non-production environments.
   * Default: true
   */
  includeErrorCause?: boolean;

  /**
   * Whether to include journey-specific context in error responses.
   * Default: true
   */
  includeJourneyContext?: boolean;

  /**
   * Whether to include request information in error logs.
   * Default: true
   */
  includeRequestInfo?: boolean;
}

/**
 * Default options for the GlobalExceptionFilter.
 */
const DEFAULT_FILTER_OPTIONS: GlobalExceptionFilterOptions = {
  includeStackTraces: true,
  executeFallbackStrategies: true,
  includeErrorCause: true,
  includeJourneyContext: true,
  includeRequestInfo: true
};

/**
 * Global exception filter that catches all exceptions, transforms them into a standardized format,
 * logs them appropriately based on their type and severity, and integrates with the tracing system.
 * 
 * Enhanced features over the original filter:
 * - Integration with distributed tracing for better error visibility
 * - Support for journey-specific error types and context
 * - Fallback strategy execution for transient and recoverable errors
 * - Improved logging with comprehensive request context
 * - Standardized error responses with client-friendly messaging
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly options: GlobalExceptionFilterOptions;
  private readonly isProd: boolean;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    options?: Partial<GlobalExceptionFilterOptions>
  ) {
    this.options = { ...DEFAULT_FILTER_OPTIONS, ...options };
    this.isProd = process.env.NODE_ENV === 'production';
    
    // Force some options in production for security
    if (this.isProd) {
      this.options.includeStackTraces = false;
      this.options.includeErrorCause = false;
    }
    
    this.loggerService.log('GlobalExceptionFilter initialized', GlobalExceptionFilter.name);
  }

  /**
   * Catches all exceptions thrown in the application and processes them.
   * 
   * @param exception - The exception that was thrown
   * @param host - The arguments host
   * @returns The response object
   */
  catch(exception: unknown, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Create a span for error handling
    const span = this.tracingService.startSpan('error.handling');
    span.setAttributes({
      'error.type': exception instanceof BaseError ? exception.type : 'unknown',
      'error.handled': true,
      'http.method': request.method,
      'http.url': request.url,
      'http.route': request.route?.path
    });

    try {
      // Extract request information for logging context
      const requestInfo = this.options.includeRequestInfo ? this.extractRequestInfo(request) : {};

      // Process the exception and generate a standardized error response
      const { errorResponse, statusCode } = this.processException(exception, request);

      // Add error details to the tracing span
      this.enhanceSpanWithErrorDetails(span, exception, statusCode, errorResponse);

      // Log the exception with appropriate level and context
      this.logException(exception, statusCode, requestInfo, errorResponse);

      // Execute fallback strategy if applicable
      if (this.options.executeFallbackStrategies && this.isRecoverableError(exception, statusCode)) {
        const fallbackResult = this.executeFallbackStrategy(exception, request);
        if (fallbackResult) {
          span.setAttributes({ 'error.recovered': true });
          span.end();
          return fallbackResult;
        }
      }

      // Send the standardized error response
      span.end();
      return response.status(statusCode).json(errorResponse);
    } catch (error) {
      // Handle errors in the exception filter itself
      this.logger.error(
        `Error in exception filter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
      
      span.setAttributes({ 'error.handled': false });
      span.recordException(error as Error);
      span.end();
      
      // Return a generic error response
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'EXCEPTION_FILTER_ERROR',
          message: 'An unexpected error occurred while processing the request',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Processes an exception and generates a standardized error response.
   * 
   * @param exception - The exception to process
   * @param request - The HTTP request
   * @returns The error response and HTTP status code
   */
  /**
   * Processes an exception and generates a standardized error response.
   * Handles different types of exceptions and enriches the response with request context.
   * 
   * @param exception - The exception to process
   * @param request - The HTTP request
   * @returns The error response and HTTP status code
   */
  private processException(exception: unknown, request: Request): { errorResponse: SerializedError, statusCode: HttpStatus } {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: SerializedError;

    // Handle different types of exceptions
    if (exception instanceof BaseError) {
      // For our custom BaseErrors, use the built-in methods
      errorResponse = exception.toJSON();
      statusCode = exception.getHttpStatusCode();
    } 
    else if (exception instanceof HttpException) {
      // For NestJS HttpExceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      errorResponse = this.createErrorResponseFromHttpException(exception, statusCode, exceptionResponse);
    } 
    else {
      // For unknown exceptions
      errorResponse = this.createErrorResponseFromUnknownException(exception);
    }

    // Add request ID to the error response if available
    const requestId = 'id' in request ? request.id : request.headers['x-request-id'];
    if (requestId) {
      errorResponse.error.requestId = requestId;
    }

    // Add request path to the error response if available
    if ('path' in request && request.path) {
      errorResponse.error.path = request.path;
    } else if (request.url) {
      // Fall back to URL if path is not available
      try {
        const urlObj = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        errorResponse.error.path = urlObj.pathname;
      } catch {
        // If URL parsing fails, just use the raw URL
        errorResponse.error.path = request.url;
      }
    }

    // Add journey context from headers if not already present
    if (!errorResponse.error.journey && request.headers['x-journey-id']) {
      errorResponse.error.journey = request.headers['x-journey-id'] as string;
    }

    return { errorResponse, statusCode };
  }

  /**
   * Creates a standardized error response from an HttpException.
   * 
   * @param exception - The HttpException
   * @param statusCode - The HTTP status code
   * @param exceptionResponse - The exception response
   * @returns A standardized error response
   */
  private createErrorResponseFromHttpException(
    exception: HttpException, 
    statusCode: HttpStatus, 
    exceptionResponse: string | object
  ): SerializedError {
    const errorType = this.getErrorTypeFromStatus(statusCode);
    
    if (typeof exceptionResponse === 'object') {
      return {
        error: {
          type: errorType,
          code: `HTTP_${statusCode}`,
          message: exception.message,
          timestamp: new Date().toISOString(),
          details: exceptionResponse,
          ...(this.options.includeStackTraces && !this.isProd && { stack: exception.stack })
        }
      };
    } else {
      return {
        error: {
          type: errorType,
          code: `HTTP_${statusCode}`,
          message: exceptionResponse as string,
          timestamp: new Date().toISOString(),
          ...(this.options.includeStackTraces && !this.isProd && { stack: exception.stack })
        }
      };
    }
  }

  /**
   * Creates a standardized error response from an unknown exception.
   * 
   * @param exception - The unknown exception
   * @returns A standardized error response
   */
  private createErrorResponseFromUnknownException(exception: unknown): SerializedError {
    const isError = exception instanceof Error;
    
    return {
      error: {
        type: ErrorType.TECHNICAL,
        code: 'INTERNAL_ERROR',
        message: ERROR_MESSAGES.TECHNICAL.INTERNAL_ERROR,
        timestamp: new Date().toISOString(),
        // Include additional details in non-production environments
        ...(this.options.includeErrorCause && !this.isProd && isError && {
          details: {
            name: exception.name,
            message: exception.message
          }
        }),
        ...(this.options.includeStackTraces && !this.isProd && isError && {
          stack: exception.stack
        })
      }
    };
  }

  /**
   * Maps HTTP status codes to error types.
   * 
   * @param status - The HTTP status code
   * @returns The corresponding error type
   */
  private getErrorTypeFromStatus(status: HttpStatus): ErrorType {
    if (status === HttpStatus.UNAUTHORIZED) {
      return ErrorType.AUTHENTICATION;
    } else if (status === HttpStatus.FORBIDDEN) {
      return ErrorType.AUTHORIZATION;
    } else if (status === HttpStatus.NOT_FOUND) {
      return ErrorType.NOT_FOUND;
    } else if (status === HttpStatus.CONFLICT) {
      return ErrorType.CONFLICT;
    } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      return ErrorType.BUSINESS;
    } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return ErrorType.RATE_LIMIT;
    } else if (status === HttpStatus.BAD_GATEWAY) {
      return ErrorType.EXTERNAL;
    } else if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      return ErrorType.UNAVAILABLE;
    } else if (status === HttpStatus.GATEWAY_TIMEOUT) {
      return ErrorType.TIMEOUT;
    } else if (status >= 400 && status < 500) {
      return ErrorType.VALIDATION;
    } else {
      return ErrorType.TECHNICAL;
    }
  }

  /**
   * Extracts relevant information from the request for logging context.
   * 
   * @param request - The HTTP request
   * @returns Request information for logging
   */
  /**
   * Extracts relevant information from the request for logging context.
   * Safely handles potentially missing properties on the request object.
   * 
   * @param request - The HTTP request
   * @returns Request information for logging
   */
  private extractRequestInfo(request: Request): Record<string, any> {
    // Safely extract properties that might not be available on all request objects
    const requestInfo: Record<string, any> = {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      journeyId: request.headers['x-journey-id'],
      clientIp: request.ip || request.headers['x-forwarded-for'] || 'unknown'
    };
    
    // Add optional properties if they exist
    if ('path' in request) {
      requestInfo.path = request.path;
    }
    
    if ('params' in request) {
      requestInfo.params = request.params;
    }
    
    if ('query' in request) {
      requestInfo.query = request.query;
    }
    
    // Add user ID if available
    if (request.user && 'id' in request.user) {
      requestInfo.userId = request.user.id;
    }
    
    // Add request ID if available
    if ('id' in request) {
      requestInfo.requestId = request.id;
    } else if (request.headers['x-request-id']) {
      requestInfo.requestId = request.headers['x-request-id'];
    }
    
    return requestInfo;
  }

  /**
   * Logs an exception with appropriate level and context.
   * 
   * @param exception - The exception to log
   * @param statusCode - The HTTP status code
   * @param requestInfo - Request information for context
   * @param errorResponse - The error response
   */
  private logException(
    exception: unknown, 
    statusCode: HttpStatus, 
    requestInfo: Record<string, any>,
    errorResponse: SerializedError
  ): void {
    const logContext = GlobalExceptionFilter.name;
    const errorType = errorResponse.error.type;
    const errorCode = errorResponse.error.code;
    const errorMessage = errorResponse.error.message;
    const journeyContext = errorResponse.error.journey;
    
    // Prepare log data with request context
    const logData = {
      ...requestInfo,
      statusCode,
      errorType,
      errorCode,
      journeyContext
    };

    // Log with appropriate level based on status code and error type
    if (exception instanceof BaseError) {
      this.logBaseError(exception, logData, logContext);
    } else if (statusCode >= 500) {
      this.loggerService.error(
        `Server error (${statusCode}): ${errorMessage} [${errorCode}]`,
        exception instanceof Error ? exception.stack : undefined,
        logContext,
        logData
      );
    } else if (statusCode >= 400) {
      this.loggerService.warn(
        `Client error (${statusCode}): ${errorMessage} [${errorCode}]`,
        logContext,
        logData
      );
    } else {
      this.loggerService.debug(
        `Exception with status ${statusCode}: ${errorMessage} [${errorCode}]`,
        logContext,
        logData
      );
    }
  }

  /**
   * Logs a BaseError with appropriate level and context.
   * 
   * @param error - The BaseError to log
   * @param logData - Additional log data
   * @param logContext - The log context
   */
  private logBaseError(error: BaseError, logData: Record<string, any>, logContext: string): void {
    const { message, type, code, stack } = error;
    const journeyContext = error.context.journey;
    
    // Add journey context to log data if available
    if (journeyContext && this.options.includeJourneyContext) {
      logData.journeyContext = journeyContext;
    }
    
    // Log with appropriate level based on error type
    switch (type) {
      case ErrorType.TECHNICAL:
        this.loggerService.error(
          `Technical error: ${message} [${code}]`,
          stack,
          logContext,
          logData
        );
        break;
      case ErrorType.EXTERNAL:
      case ErrorType.UNAVAILABLE:
      case ErrorType.TIMEOUT:
        this.loggerService.error(
          `External system error: ${message} [${code}]`,
          stack,
          logContext,
          logData
        );
        break;
      case ErrorType.BUSINESS:
        this.loggerService.warn(
          `Business error: ${message} [${code}]`,
          logContext,
          logData
        );
        break;
      case ErrorType.VALIDATION:
      case ErrorType.NOT_FOUND:
        this.loggerService.debug(
          `Validation error: ${message} [${code}]`,
          logContext,
          logData
        );
        break;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        this.loggerService.warn(
          `Security error: ${message} [${code}]`,
          logContext,
          logData
        );
        break;
      case ErrorType.RATE_LIMIT:
        this.loggerService.warn(
          `Rate limit error: ${message} [${code}]`,
          logContext,
          logData
        );
        break;
      case ErrorType.CONFLICT:
        this.loggerService.warn(
          `Conflict error: ${message} [${code}]`,
          logContext,
          logData
        );
        break;
      default:
        this.loggerService.error(
          `Unhandled error type (${type}): ${message} [${code}]`,
          stack,
          logContext,
          logData
        );
    }
  }

  /**
   * Enhances a tracing span with error details.
   * 
   * @param span - The tracing span
   * @param exception - The exception
   * @param statusCode - The HTTP status code
   * @param errorResponse - The error response
   */
  /**
   * Enhances a tracing span with error details.
   * Safely handles potential differences in the tracing API.
   * 
   * @param span - The tracing span
   * @param exception - The exception
   * @param statusCode - The HTTP status code
   * @param errorResponse - The error response
   */
  private enhanceSpanWithErrorDetails(
    span: any, 
    exception: unknown, 
    statusCode: HttpStatus,
    errorResponse: SerializedError
  ): void {
    try {
      // Create attributes object
      const attributes = {
        'error.type': errorResponse.error.type,
        'error.code': errorResponse.error.code,
        'error.message': errorResponse.error.message,
        'error.status_code': statusCode
      };
      
      // Add journey context if available
      if (errorResponse.error.journey) {
        attributes['journey.context'] = errorResponse.error.journey;
      }
      
      // Set attributes on the span (handle different possible APIs)
      if (typeof span.setAttributes === 'function') {
        span.setAttributes(attributes);
      } else if (typeof span.setAttribute === 'function') {
        // Handle case where span API uses setAttribute instead
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }
      
      // Record the exception in the span
      if (exception instanceof Error) {
        if (typeof span.recordException === 'function') {
          span.recordException(exception);
        } else if (typeof span.setStatus === 'function') {
          // Alternative API might use setStatus
          span.setStatus({
            code: 'ERROR',
            message: exception.message
          });
        }
      }
    } catch (error) {
      // Log but don't throw - tracing should never break the application
      this.logger.warn(
        `Failed to enhance span with error details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GlobalExceptionFilter.name
      );
    }
  }

  /**
   * Determines if an error is recoverable and should attempt fallback strategies.
   * 
   * @param exception - The exception
   * @param statusCode - The HTTP status code
   * @returns Whether the error is recoverable
   */
  private isRecoverableError(exception: unknown, statusCode: HttpStatus): boolean {
    // BaseErrors have their own isRetryable method
    if (exception instanceof BaseError) {
      return exception.isRetryable();
    }
    
    // Check if the status code is in the list of retryable status codes
    return RETRYABLE_HTTP_STATUS_CODES.includes(statusCode);
  }

  /**
   * Executes a fallback strategy for a recoverable error.
   * 
   * @param exception - The exception
   * @param request - The HTTP request
   * @returns The fallback result or undefined if no fallback was executed
   */
  /**
   * Executes a fallback strategy for a recoverable error.
   * Determines the appropriate strategy based on the error and request context.
   * 
   * @param exception - The exception
   * @param request - The HTTP request
   * @returns The fallback result or undefined if no fallback was executed
   */
  private executeFallbackStrategy(exception: unknown, request: Request): any {
    try {
      // Extract the path for routing fallback strategies
      const path = 'path' in request ? request.path : request.url;
      const method = request.method;
      
      // Create a span for fallback strategy execution
      const span = this.tracingService.startSpan('error.fallback');
      span.setAttributes({
        'http.path': path,
        'http.method': method
      });
      
      let strategy: ErrorRecoveryStrategy | undefined;
      
      // If the exception is a BaseError with a defined recovery strategy, use it
      if (exception instanceof BaseError && exception.context.recoveryStrategy) {
        strategy = exception.context.recoveryStrategy as ErrorRecoveryStrategy;
        span.setAttributes({
          'error.recovery_strategy': strategy,
          'error.type': exception.type,
          'error.code': exception.code
        });
      } else {
        // For other exceptions, determine strategy based on the error type and request
        strategy = this.determineFallbackStrategy(exception, request);
        if (strategy) {
          span.setAttributes({
            'error.recovery_strategy': strategy,
            'error.recovery_strategy_source': 'auto_determined'
          });
        }
      }
      
      // Execute the appropriate fallback strategy
      let result: any;
      switch (strategy) {
        case ErrorRecoveryStrategy.CACHED_DATA:
          result = this.executeCachedDataFallback(request);
          break;
        case ErrorRecoveryStrategy.DEFAULT_BEHAVIOR:
          result = this.executeDefaultBehaviorFallback(request);
          break;
        case ErrorRecoveryStrategy.GRACEFUL_DEGRADATION:
          result = this.executeGracefulDegradationFallback(request);
          break;
        default:
          result = undefined;
      }
      
      span.setAttributes({
        'error.recovery_successful': result !== undefined
      });
      span.end();
      
      return result;
    } catch (error) {
      // Log but don't throw - fallback execution should never break the application
      this.loggerService.warn(
        `Failed to execute fallback strategy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GlobalExceptionFilter.name
      );
      return undefined;
    }
  }

  /**
   * Determines the appropriate fallback strategy based on the error and request context.
   * 
   * @param exception - The exception
   * @param request - The HTTP request
   * @returns The determined fallback strategy or undefined if no strategy is applicable
   */
  private determineFallbackStrategy(exception: unknown, request: Request): ErrorRecoveryStrategy | undefined {
    // Determine if this is a read operation (GET, HEAD) or write operation (POST, PUT, DELETE, etc.)
    const isReadOperation = ['GET', 'HEAD'].includes(request.method);
    
    // For read operations, we can often use cached data
    if (isReadOperation) {
      return ErrorRecoveryStrategy.CACHED_DATA;
    }
    
    // For write operations, we might need to queue the operation for later
    // or use a default behavior depending on the specific endpoint
    // This is a simplified example - real implementation would be more sophisticated
    return ErrorRecoveryStrategy.DEFAULT_BEHAVIOR;
  }

  /**
   * Executes a cached data fallback strategy.
   * Attempts to retrieve cached data for the request.
   * 
   * @param request - The HTTP request
   * @returns The cached data or undefined if no cache is available
   */
  private executeCachedDataFallback(request: Request): any {
    // Implementation would depend on the caching strategy used in the application
    // This is a placeholder for the actual implementation
    this.loggerService.debug(
      'Executing cached data fallback strategy',
      GlobalExceptionFilter.name,
      { path: 'path' in request ? request.path : request.url }
    );
    
    // In a real implementation, this would retrieve cached data from a cache store
    // For example:
    // 1. Check if the request path is cacheable
    // 2. Look up the cache key based on the request path and query parameters
    // 3. Retrieve the cached data from Redis, Memcached, or another cache store
    // 4. Return the cached data if available and not expired
    
    // For now, we'll just return undefined to indicate no cached data is available
    return undefined;
  }

  /**
   * Executes a default behavior fallback strategy.
   * Returns a sensible default response for the request.
   * 
   * @param request - The HTTP request
   * @returns The default behavior result or undefined if no default is available
   */
  private executeDefaultBehaviorFallback(request: Request): any {
    // Implementation would depend on the default behaviors defined for different endpoints
    // This is a placeholder for the actual implementation
    this.loggerService.debug(
      'Executing default behavior fallback strategy',
      GlobalExceptionFilter.name,
      { path: 'path' in request ? request.path : request.url }
    );
    
    // In a real implementation, this would return a default response for the endpoint
    // For example:
    // 1. Identify the endpoint from the request path
    // 2. Look up the default behavior for that endpoint
    // 3. Generate a default response based on the endpoint and request method
    // 4. Return the default response
    
    // For now, we'll just return undefined to indicate no default behavior is available
    return undefined;
  }

  /**
   * Executes a graceful degradation fallback strategy.
   * Provides a degraded but functional response for the request.
   * 
   * @param request - The HTTP request
   * @returns The gracefully degraded result or undefined if degradation is not possible
   */
  private executeGracefulDegradationFallback(request: Request): any {
    // Implementation would depend on the degradation strategies defined for different features
    // This is a placeholder for the actual implementation
    this.loggerService.debug(
      'Executing graceful degradation fallback strategy',
      GlobalExceptionFilter.name,
      { path: 'path' in request ? request.path : request.url }
    );
    
    // In a real implementation, this would return a degraded but functional response
    // For example:
    // 1. Identify the feature from the request path
    // 2. Determine what degraded functionality is available for that feature
    // 3. Generate a response that provides the degraded functionality
    // 4. Return the degraded response
    
    // For now, we'll just return undefined to indicate no degradation is possible
    return undefined;
  }
}

/**
 * Factory function to create a GlobalExceptionFilter with the specified options.
 * 
 * @param options - Configuration options for the filter
 * @returns A factory function that creates a GlobalExceptionFilter
 */
export const createGlobalExceptionFilter = (options?: Partial<GlobalExceptionFilterOptions>) => {
  return {
    provide: GlobalExceptionFilter,
    useFactory: (loggerService: LoggerService, tracingService: TracingService) => {
      return new GlobalExceptionFilter(loggerService, tracingService, options);
    },
    inject: [LoggerService, TracingService]
  };
};