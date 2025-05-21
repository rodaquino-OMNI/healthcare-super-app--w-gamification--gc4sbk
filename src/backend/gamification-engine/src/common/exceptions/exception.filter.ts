import { 
  ArgumentsHost, 
  Catch, 
  ExceptionFilter, 
  HttpException, 
  HttpStatus, 
  Injectable,
  Logger as NestLogger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  BaseError, 
  ErrorType,
  ValidationError,
  BusinessError,
  TechnicalError,
  ExternalError
} from '@austa/errors';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ConfigService } from '@nestjs/config';

/**
 * Global exception filter for the Gamification Engine that catches all exceptions,
 * transforms them into standardized responses, logs them appropriately,
 * and integrates with monitoring systems to track error trends and trigger alerts.
 * 
 * This filter handles:
 * - BaseError from @austa/errors package (replacing the old AppException)
 * - NestJS HttpExceptions
 * - Unknown/unhandled exceptions
 * 
 * It provides:
 * - Standardized error responses with error codes and messages
 * - Appropriate HTTP status codes based on error types
 * - Structured logging with request context
 * - Integration with distributed tracing
 * - Security-conscious error message handling
 * - Error aggregation for monitoring and alerting
 */
@Injectable()
@Catch()
export class GamificationExceptionFilter implements ExceptionFilter {
  private readonly isProduction: boolean;
  private readonly logger = new NestLogger('GamificationExceptionFilter');

  constructor(
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService
  ) {
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.loggerService.log('GamificationExceptionFilter initialized', 'GamificationExceptionFilter');
  }

  /**
   * Catches and processes all exceptions in the application
   * 
   * @param exception The exception object
   * @param host The arguments host
   */
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract request information for logging context
    const requestInfo = this.extractRequestInfo(request);
    
    // Record the error in the current trace span
    this.recordErrorInTracing(exception, requestInfo);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Record<string, any>;

    // Handle different types of exceptions
    if (exception instanceof BaseError) {
      // For our custom BaseErrors from @austa/errors package
      errorResponse = exception.serialize();
      statusCode = this.getStatusCodeFromErrorType(exception.type);
      this.logBaseError(exception, requestInfo);
      this.trackErrorMetrics(exception, statusCode, requestInfo);
    } 
    else if (exception instanceof HttpException) {
      // For NestJS HttpExceptions
      statusCode = exception.getStatus();
      errorResponse = this.formatHttpExceptionResponse(exception, statusCode);
      this.logHttpException(exception, statusCode, requestInfo);
      this.trackErrorMetrics(exception, statusCode, requestInfo);
    } 
    else {
      // For unknown exceptions
      errorResponse = this.formatUnknownExceptionResponse(exception);
      this.logUnknownException(exception, requestInfo);
      this.trackErrorMetrics(exception, statusCode, requestInfo);
      
      // For critical unknown errors, trigger alerts
      this.triggerCriticalErrorAlert(exception, requestInfo);
    }

    // Send the response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Extracts relevant information from the request for logging context
   * 
   * @param request The HTTP request
   * @returns Object containing request information
   */
  private extractRequestInfo(request: Request): Record<string, any> {
    return {
      method: request.method,
      url: request.url,
      path: request.path,
      params: request.params,
      query: request.query,
      userId: request.user?.id,
      journeyId: request.headers['x-journey-id'],
      correlationId: request.headers['x-correlation-id'],
      userAgent: request.headers['user-agent'],
      clientIp: request.ip,
      // Don't include body or headers to avoid logging sensitive information
    };
  }

  /**
   * Records the error in the current trace span for distributed tracing
   * 
   * @param exception The exception object
   * @param requestInfo Request information for context
   */
  private recordErrorInTracing(exception: Error, requestInfo: Record<string, any>): void {
    try {
      const currentSpan = this.tracingService.getCurrentSpan();
      if (currentSpan) {
        currentSpan.recordException(exception);
        currentSpan.setAttributes({
          'error.type': exception instanceof BaseError ? exception.type : 'unknown',
          'error.code': exception instanceof BaseError ? exception.code : 'UNKNOWN_ERROR',
          'request.path': requestInfo.path,
          'request.method': requestInfo.method,
          'user.id': requestInfo.userId || 'anonymous',
        });
      }
    } catch (tracingError) {
      // Don't let tracing errors affect the main error handling flow
      this.logger.error(`Failed to record error in tracing: ${tracingError.message}`);
    }
  }

  /**
   * Maps error types to HTTP status codes
   * 
   * @param type The error type from ErrorType enum
   * @returns The corresponding HTTP status code
   */
  private getStatusCodeFromErrorType(type: ErrorType): HttpStatus {
    switch (type) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Formats the response for NestJS HttpExceptions
   * 
   * @param exception The HttpException
   * @param statusCode The HTTP status code
   * @returns Formatted error response
   */
  private formatHttpExceptionResponse(exception: HttpException, statusCode: HttpStatus): Record<string, any> {
    const exceptionResponse = exception.getResponse();
    const errorType = this.getErrorTypeFromStatus(statusCode);
    
    if (typeof exceptionResponse === 'object') {
      return {
        error: {
          ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
          type: errorType,
          code: this.getErrorCodeFromStatus(statusCode)
        }
      };
    } else {
      return {
        error: {
          type: errorType,
          code: this.getErrorCodeFromStatus(statusCode),
          message: exceptionResponse
        }
      };
    }
  }

  /**
   * Formats the response for unknown exceptions
   * 
   * @param exception The unknown exception
   * @returns Formatted error response
   */
  private formatUnknownExceptionResponse(exception: Error): Record<string, any> {
    return {
      error: {
        type: ErrorType.TECHNICAL,
        code: 'GAMIFICATION_INTERNAL_ERROR',
        message: 'An unexpected error occurred in the gamification service',
        // Include additional details in non-production environments
        ...(this.isProduction ? {} : {
          details: {
            name: exception.name,
            message: exception.message
          }
        })
      }
    };
  }

  /**
   * Maps HTTP status codes to error types
   * 
   * @param status The HTTP status code
   * @returns The corresponding error type
   */
  private getErrorTypeFromStatus(status: HttpStatus): ErrorType {
    if (status >= 400 && status < 500) {
      if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
        return ErrorType.BUSINESS;
      }
      return ErrorType.VALIDATION;
    } else if (status >= 500) {
      if (status === HttpStatus.BAD_GATEWAY || 
          status === HttpStatus.SERVICE_UNAVAILABLE || 
          status === HttpStatus.GATEWAY_TIMEOUT) {
        return ErrorType.EXTERNAL;
      }
      return ErrorType.TECHNICAL;
    }
    return ErrorType.TECHNICAL;
  }

  /**
   * Maps HTTP status codes to error codes
   * 
   * @param status The HTTP status code
   * @returns The corresponding error code
   */
  private getErrorCodeFromStatus(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'GAMIFICATION_BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'GAMIFICATION_UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'GAMIFICATION_FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'GAMIFICATION_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'GAMIFICATION_CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'GAMIFICATION_UNPROCESSABLE_ENTITY';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'GAMIFICATION_INTERNAL_SERVER_ERROR';
      case HttpStatus.BAD_GATEWAY:
        return 'GAMIFICATION_BAD_GATEWAY';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'GAMIFICATION_SERVICE_UNAVAILABLE';
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'GAMIFICATION_GATEWAY_TIMEOUT';
      default:
        return 'GAMIFICATION_UNKNOWN_ERROR';
    }
  }

  /**
   * Logs BaseError exceptions with appropriate log levels
   * 
   * @param exception The BaseError exception
   * @param requestInfo Request information for context
   */
  private logBaseError(exception: BaseError, requestInfo: Record<string, any>): void {
    const { message, type, code, context } = exception;
    const logContext = 'GamificationExceptionFilter';
    const logData = {
      errorCode: code,
      errorType: type,
      errorContext: context,
      requestInfo,
    };
    
    switch (type) {
      case ErrorType.TECHNICAL:
        this.loggerService.error(
          `Technical error: ${message} (${code})`,
          exception.stack,
          logContext,
          logData
        );
        break;
      case ErrorType.EXTERNAL:
        this.loggerService.error(
          `External system error: ${message} (${code})`,
          exception.stack,
          logContext,
          logData
        );
        break;
      case ErrorType.BUSINESS:
        this.loggerService.warn(
          `Business error: ${message} (${code})`,
          logContext,
          logData
        );
        break;
      case ErrorType.VALIDATION:
        this.loggerService.debug(
          `Validation error: ${message} (${code})`,
          logContext,
          logData
        );
        break;
    }
  }

  /**
   * Logs NestJS HTTP exceptions with appropriate log levels
   * 
   * @param exception The HttpException
   * @param status The HTTP status code
   * @param requestInfo Request information for context
   */
  private logHttpException(exception: HttpException, status: HttpStatus, requestInfo: Record<string, any>): void {
    const message = exception.message;
    const logContext = 'GamificationExceptionFilter';
    const logData = {
      statusCode: status,
      requestInfo,
    };
    
    if (status >= 500) {
      this.loggerService.error(
        `HTTP ${status} exception: ${message}`,
        exception.stack,
        logContext,
        logData
      );
    } else if (status >= 400) {
      this.loggerService.warn(
        `HTTP ${status} exception: ${message}`,
        logContext,
        logData
      );
    } else {
      this.loggerService.debug(
        `HTTP ${status} exception: ${message}`,
        logContext,
        logData
      );
    }
  }

  /**
   * Logs unknown exceptions
   * 
   * @param exception The unknown exception
   * @param requestInfo Request information for context
   */
  private logUnknownException(exception: Error, requestInfo: Record<string, any>): void {
    this.loggerService.error(
      `Unhandled exception: ${exception.message}`,
      exception.stack,
      'GamificationExceptionFilter',
      { requestInfo }
    );
  }

  /**
   * Tracks error metrics for monitoring and alerting
   * 
   * @param exception The exception
   * @param statusCode The HTTP status code
   * @param requestInfo Request information for context
   */
  private trackErrorMetrics(exception: Error, statusCode: HttpStatus, requestInfo: Record<string, any>): void {
    try {
      // This would integrate with a metrics system like Prometheus
      // For now, we'll just log that we would track metrics
      if (this.isProduction) {
        this.logger.debug(
          'Error metrics would be tracked here', 
          {
            errorType: exception instanceof BaseError ? exception.type : 'unknown',
            errorCode: exception instanceof BaseError ? exception.code : 'UNKNOWN_ERROR',
            statusCode,
            path: requestInfo.path,
            method: requestInfo.method,
          }
        );
      }
    } catch (metricsError) {
      // Don't let metrics errors affect the main error handling flow
      this.logger.error(`Failed to track error metrics: ${metricsError.message}`);
    }
  }

  /**
   * Triggers alerts for critical errors
   * 
   * @param exception The exception
   * @param requestInfo Request information for context
   */
  private triggerCriticalErrorAlert(exception: Error, requestInfo: Record<string, any>): void {
    try {
      // Only trigger alerts in production and for critical errors
      if (this.isProduction && this.isCriticalError(exception)) {
        // This would integrate with an alerting system
        // For now, we'll just log that we would trigger an alert
        this.logger.warn(
          'Critical error alert would be triggered here', 
          {
            errorType: exception instanceof BaseError ? exception.type : 'unknown',
            errorCode: exception instanceof BaseError ? exception.code : 'UNKNOWN_ERROR',
            path: requestInfo.path,
            method: requestInfo.method,
          }
        );
      }
    } catch (alertError) {
      // Don't let alerting errors affect the main error handling flow
      this.logger.error(`Failed to trigger critical error alert: ${alertError.message}`);
    }
  }

  /**
   * Determines if an error is critical and should trigger alerts
   * 
   * @param exception The exception
   * @returns True if the error is critical
   */
  private isCriticalError(exception: Error): boolean {
    // Consider errors critical if they are:
    // 1. Technical errors (system failures)
    // 2. External errors that affect core functionality
    // 3. Unknown errors (unhandled exceptions)
    
    if (exception instanceof TechnicalError) {
      return true;
    }
    
    if (exception instanceof ExternalError) {
      // Only some external errors are critical
      // For example, if a core dependency is down
      return exception.code.includes('CRITICAL') || 
             exception.code.includes('CORE') ||
             exception.code.includes('DATABASE');
    }
    
    // Unknown errors are always critical
    if (!(exception instanceof ValidationError) && 
        !(exception instanceof BusinessError) && 
        !(exception instanceof HttpException)) {
      return true;
    }
    
    return false;
  }
}