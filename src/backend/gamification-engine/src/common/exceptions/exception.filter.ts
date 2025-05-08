import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { BaseError, ErrorType, ErrorResponse, ErrorContext } from '@austa/errors';
import { TransientException } from './transient.exception';
import { ExternalDependencyException } from './external-dependency.exception';
import { CircuitBreakerService } from './circuit-breaker';
import { RetryUtils } from './retry.utils';

/**
 * Global exception filter for the Gamification Engine.
 * 
 * Catches all exceptions thrown in the application and transforms them into standardized
 * HTTP responses. Integrates with logging and monitoring systems to track error trends
 * and trigger alerts for critical errors.
 * 
 * Features:
 * - Exception type detection and classification
 * - Standardized error response formatting
 * - Security-conscious error message handling
 * - Integration with logging and monitoring services
 * - Support for retry mechanisms and circuit breakers
 * - Error trend analysis and alerting
 */
@Injectable()
@Catch()
export class GamificationExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  /**
   * Catches all exceptions and transforms them into standardized HTTP responses.
   * 
   * @param exception The caught exception
   * @param host The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Create a span for error handling
    const span = this.tracingService.startSpan('exception.handler');
    
    try {
      // Extract request information for error context
      const requestInfo = this.extractRequestInfo(request);
      
      // Process the exception and generate a standardized error response
      const errorResponse = this.processException(exception, requestInfo);
      
      // Log the error with appropriate severity based on the error type
      this.logError(exception, errorResponse, requestInfo);
      
      // Handle special cases for transient errors and external dependencies
      this.handleSpecialCases(exception, errorResponse);
      
      // Send the error response to the client
      response
        .status(errorResponse.statusCode)
        .json(errorResponse);
    } catch (error) {
      // If error handling itself fails, log it and return a generic error
      this.logger.error('Error in exception filter', { error });
      
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          timestamp: new Date().toISOString(),
          path: request.url,
          errorCode: 'GAMIFICATION_INTERNAL_ERROR',
        });
    } finally {
      // End the tracing span
      span.end();
    }
  }

  /**
   * Extracts relevant information from the request for error context.
   * 
   * @param request The HTTP request
   * @returns Request information for error context
   */
  private extractRequestInfo(request: Request): ErrorContext {
    return {
      url: request.url,
      method: request.method,
      headers: this.sanitizeHeaders(request.headers),
      query: request.query,
      params: request.params,
      userId: request.user?.id,
      requestId: request.headers['x-request-id'] as string,
      journey: request.headers['x-journey'] as string,
      userAgent: request.headers['user-agent'] as string,
      ip: request.ip,
    };
  }

  /**
   * Sanitizes request headers to remove sensitive information.
   * 
   * @param headers The request headers
   * @returns Sanitized headers
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Processes the exception and generates a standardized error response.
   * 
   * @param exception The caught exception
   * @param requestInfo Request information for error context
   * @returns Standardized error response
   */
  private processException(exception: unknown, requestInfo: ErrorContext): ErrorResponse {
    // Add error information to the current span
    const span = this.tracingService.getCurrentSpan();
    span.setAttributes({
      'error': true,
      'error.type': exception instanceof BaseError ? exception.type : 'UNKNOWN',
      'error.message': exception instanceof Error ? exception.message : String(exception),
    });

    // Handle BaseError from @austa/errors package
    if (exception instanceof BaseError) {
      return {
        statusCode: this.getHttpStatus(exception),
        message: exception.message,
        errorCode: exception.code,
        timestamp: new Date().toISOString(),
        path: requestInfo.url,
        details: exception.details,
        type: exception.type,
      };
    }
    
    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message = typeof response === 'object' && 'message' in response
        ? response.message
        : exception.message;
      
      return {
        statusCode: exception.getStatus(),
        message: Array.isArray(message) ? message.join(', ') : String(message),
        errorCode: 'GAMIFICATION_API_ERROR',
        timestamp: new Date().toISOString(),
        path: requestInfo.url,
        type: ErrorType.CLIENT,
      };
    }
    
    // Handle generic Error
    if (exception instanceof Error) {
      // Don't expose internal error details in production
      const isProduction = process.env.NODE_ENV === 'production';
      const message = isProduction ? 'Internal server error' : exception.message;
      
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        errorCode: 'GAMIFICATION_INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: requestInfo.url,
        type: ErrorType.SYSTEM,
        ...(isProduction ? {} : { stack: exception.stack }),
      };
    }
    
    // Handle unknown exceptions
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error',
      errorCode: 'GAMIFICATION_UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      path: requestInfo.url,
      type: ErrorType.SYSTEM,
    };
  }

  /**
   * Maps BaseError types to HTTP status codes.
   * 
   * @param error The base error
   * @returns Appropriate HTTP status code
   */
  private getHttpStatus(error: BaseError): number {
    switch (error.type) {
      case ErrorType.CLIENT:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.UNAUTHORIZED:
        return HttpStatus.UNAUTHORIZED;
      case ErrorType.FORBIDDEN:
        return HttpStatus.FORBIDDEN;
      case ErrorType.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ErrorType.CONFLICT:
        return HttpStatus.CONFLICT;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TRANSIENT:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case ErrorType.SYSTEM:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Logs the error with appropriate severity based on the error type.
   * 
   * @param exception The caught exception
   * @param errorResponse The standardized error response
   * @param requestInfo Request information for error context
   */
  private logError(
    exception: unknown,
    errorResponse: ErrorResponse,
    requestInfo: ErrorContext,
  ): void {
    const errorContext = {
      errorResponse,
      requestInfo,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log with appropriate severity based on error type
    if (errorResponse.type === ErrorType.CLIENT || errorResponse.type === ErrorType.VALIDATION) {
      // Client errors are expected and don't indicate system problems
      this.logger.warn(`Client error: ${errorResponse.message}`, errorContext);
    } else if (errorResponse.type === ErrorType.TRANSIENT) {
      // Transient errors may resolve themselves
      this.logger.warn(`Transient error: ${errorResponse.message}`, errorContext);
    } else if (errorResponse.type === ErrorType.EXTERNAL) {
      // External dependency errors indicate problems with integrations
      this.logger.error(`External dependency error: ${errorResponse.message}`, errorContext);
    } else {
      // System errors indicate internal problems that need attention
      this.logger.error(`System error: ${errorResponse.message}`, errorContext);
    }

    // Track error metrics for monitoring and alerting
    this.trackErrorMetrics(errorResponse);
  }

  /**
   * Tracks error metrics for monitoring and alerting.
   * 
   * @param errorResponse The standardized error response
   */
  private trackErrorMetrics(errorResponse: ErrorResponse): void {
    // Implementation would depend on the monitoring system used
    // This is a placeholder for the actual implementation
    // Example: increment error counter by type, track error rates, etc.
    const metricTags = {
      errorCode: errorResponse.errorCode,
      statusCode: errorResponse.statusCode.toString(),
      errorType: errorResponse.type,
    };

    // In a real implementation, this would send metrics to a monitoring system
    // Example: datadog, prometheus, etc.
    console.log('Error metrics tracked', metricTags);
  }

  /**
   * Handles special cases for transient errors and external dependencies.
   * 
   * @param exception The caught exception
   * @param errorResponse The standardized error response
   */
  private handleSpecialCases(exception: unknown, errorResponse: ErrorResponse): void {
    // Handle transient errors with retry logic
    if (exception instanceof TransientException) {
      const shouldRetry = RetryUtils.shouldRetry(exception);
      
      if (shouldRetry) {
        const retryAfter = RetryUtils.calculateBackoff(exception);
        errorResponse.retryAfter = retryAfter;
      }
    }
    
    // Handle external dependency errors with circuit breaker
    if (exception instanceof ExternalDependencyException) {
      const dependencyName = exception.dependencyName;
      
      // Record the failure in the circuit breaker
      this.circuitBreakerService.recordFailure(dependencyName);
      
      // Check if circuit is open and add information to the response
      if (this.circuitBreakerService.isOpen(dependencyName)) {
        errorResponse.circuitBreaker = {
          status: 'OPEN',
          resetAfter: this.circuitBreakerService.getResetTime(dependencyName),
        };
      }
    }
  }
}