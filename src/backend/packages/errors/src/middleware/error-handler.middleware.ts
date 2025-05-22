import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { BaseError } from '../base';
import { ErrorType } from '../types';
import { TracingService } from '@austa/tracing';

/**
 * Express middleware that handles errors outside of the NestJS context,
 * implementing a standardized error response format consistent with the
 * AUSTA SuperApp's error handling strategy.
 *
 * This middleware catches all unhandled errors in Express applications,
 * categorizes them (BaseError, HttpException, or generic Error),
 * transforms them to the application's standard error format,
 * determines appropriate HTTP status codes, and logs errors with
 * context-specific information.
 *
 * It preserves the error classification and response format patterns
 * established in the NestJS GlobalExceptionFilter but adapts them for
 * Express middleware contexts.
 *
 * @example
 * ```typescript
 * // In your Express application setup
 * import { ErrorHandlerMiddleware } from '@austa/errors';
 * import { LoggerService } from '@austa/logging';
 * import { TracingService } from '@austa/tracing';
 * 
 * const app = express();
 * const logger = new LoggerService();
 * const tracing = new TracingService();
 * 
 * // Add routes and other middleware...
 * 
 * // Add error handler as the last middleware
 * app.use(ErrorHandlerMiddleware.create(logger, tracing));
 * ```
 */
export class ErrorHandlerMiddleware {
  /**
   * Creates a new instance of the ErrorHandlerMiddleware.
   * 
   * @param logger - The logger service for error logging
   * @param tracing - Optional tracing service for distributed tracing integration
   */
  constructor(
    private readonly logger: LoggerService,
    private readonly tracing?: TracingService
  ) {
    this.logger.log('ErrorHandlerMiddleware initialized', 'ErrorHandlerMiddleware');
  }

  /**
   * Express middleware function that handles errors.
   * This function follows the Express error middleware pattern with four parameters.
   * 
   * @param error - The error that was thrown
   * @param request - The Express request object
   * @param response - The Express response object
   * @param next - The Express next function (not used but required for Express to recognize this as error middleware)
   */
  public handle = (error: Error, request: Request, response: Response, next: NextFunction): void => {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any;

    // Extract request information for logging context
    const requestInfo = {
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      journeyId: request.headers['x-journey-id'],
      traceId: request.headers['x-trace-id'] || this.tracing?.getCurrentTraceId(),
      requestId: request.headers['x-request-id'] || request.id // Express request ID if using middleware that adds it
    };

    // Record error in tracing system if available
    if (this.tracing) {
      this.tracing.recordError(error, {
        component: 'express',
        ...requestInfo
      });
    }

    // Handle different types of exceptions
    if (error instanceof BaseError) {
      // For our custom BaseErrors, use the built-in methods
      errorResponse = error.toJSON();
      statusCode = this.getStatusCodeFromErrorType(error.type);
      this.logBaseError(error, requestInfo);
    } 
    else if (error instanceof HttpException) {
      // For NestJS HttpExceptions
      statusCode = error.getStatus();
      const exceptionResponse = error.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          error: {
            ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
            type: this.getErrorTypeFromStatus(statusCode)
          }
        };
      } else {
        errorResponse = {
          error: {
            type: this.getErrorTypeFromStatus(statusCode),
            message: exceptionResponse
          }
        };
      }
      
      this.logHttpException(error, statusCode, requestInfo);
    } 
    else {
      // For unknown exceptions
      errorResponse = {
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          // Include additional details in non-production environments
          ...(process.env.NODE_ENV !== 'production' && {
            details: {
              name: error.name,
              message: error.message
            }
          })
        }
      };
      
      this.logUnknownException(error, requestInfo);
    }

    // Add trace ID to response headers if available
    if (requestInfo.traceId) {
      response.setHeader('x-trace-id', requestInfo.traceId);
    }

    // Send the response
    response.status(statusCode).json(errorResponse);
  };

  /**
   * Maps error types to HTTP status codes
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
   * Maps HTTP status codes to error types
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
   * Logs application-specific errors
   */
  private logBaseError(error: BaseError, requestInfo: any): void {
    const { message, type, code, details } = error;
    const logContext = 'ErrorHandlerMiddleware';
    const metadata = {
      ...requestInfo,
      errorCode: code,
      errorDetails: details,
      errorType: type,
      journey: requestInfo.journeyId
    };
    
    switch (type) {
      case ErrorType.TECHNICAL:
        this.logger.error(
          `Technical error: ${message} (${code})`,
          error.stack,
          metadata,
          logContext
        );
        break;
      case ErrorType.EXTERNAL:
        this.logger.error(
          `External system error: ${message} (${code})`,
          error.stack,
          metadata,
          logContext
        );
        break;
      case ErrorType.BUSINESS:
        this.logger.warn(
          `Business error: ${message} (${code})`,
          metadata,
          logContext
        );
        break;
      case ErrorType.VALIDATION:
        this.logger.debug(
          `Validation error: ${message} (${code})`,
          metadata,
          logContext
        );
        break;
    }
  }

  /**
   * Logs NestJS HTTP exceptions
   */
  private logHttpException(error: HttpException, status: HttpStatus, requestInfo: any): void {
    const message = error.message;
    const logContext = 'ErrorHandlerMiddleware';
    const metadata = {
      ...requestInfo,
      statusCode: status,
      errorType: this.getErrorTypeFromStatus(status),
      journey: requestInfo.journeyId
    };
    
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} exception: ${message}`,
        error.stack,
        metadata,
        logContext
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status} exception: ${message}`,
        metadata,
        logContext
      );
    } else {
      this.logger.debug(
        `HTTP ${status} exception: ${message}`,
        metadata,
        logContext
      );
    }
  }

  /**
   * Logs unknown exceptions
   */
  private logUnknownException(error: Error, requestInfo: any): void {
    const metadata = {
      ...requestInfo,
      errorName: error.name,
      errorType: ErrorType.TECHNICAL,
      journey: requestInfo.journeyId
    };

    this.logger.error(
      `Unhandled exception: ${error.message}`,
      error.stack,
      metadata,
      'ErrorHandlerMiddleware'
    );
  }

  /**
   * Factory method to create the middleware function.
   * This is the recommended way to use this middleware in Express applications.
   * 
   * @param logger - The logger service for error logging
   * @param tracing - Optional tracing service for distributed tracing integration
   * @returns Express error handling middleware function
   * 
   * @example
   * ```typescript
   * // In your Express application setup
   * import { ErrorHandlerMiddleware } from '@austa/errors';
   * import { LoggerService } from '@austa/logging';
   * import { TracingService } from '@austa/tracing';
   * 
   * const app = express();
   * const logger = new LoggerService();
   * const tracing = new TracingService();
   * 
   * // Add routes and other middleware...
   * 
   * // Add error handler as the last middleware
   * app.use(ErrorHandlerMiddleware.create(logger, tracing));
   * ```
   */
  public static create(logger: LoggerService, tracing?: TracingService) {
    const middleware = new ErrorHandlerMiddleware(logger, tracing);
    return middleware.handle;
  }
}