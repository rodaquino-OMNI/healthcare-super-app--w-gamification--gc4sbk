import { 
  ArgumentsHost, 
  Catch, 
  ExceptionFilter, 
  HttpException, 
  HttpStatus, 
  Injectable 
} from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType } from '../types';
import { BusinessError, TechnicalError, ValidationError, ExternalError } from '../categories';

/**
 * Global exception filter that catches all exceptions, transforms them into a standardized format,
 * and logs them appropriately based on their type and severity.
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: Error, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any;

    // Extract request information for logging context
    const requestInfo = {
      'http.method': request.method,
      'http.url': request.url,
      userId: request.headers['x-user-id'],
      journey: request.headers['x-journey-id'],
      requestId: request.headers['x-request-id'],
      traceId: request.headers['x-trace-id'],
      spanId: request.headers['x-span-id']
    };

    // Handle different types of exceptions
    if (exception instanceof BaseError) {
      // For our custom BaseErrors, use the built-in methods
      errorResponse = exception.toJSON();
      statusCode = this.getStatusCodeFromErrorType(exception.type);
      this.logAppException(exception, requestInfo);
    } 
    else if (exception instanceof HttpException) {
      // For NestJS HttpExceptions
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
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
      
      this.logHttpException(exception, statusCode, requestInfo);
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
              name: exception.name,
              message: exception.message
            }
          })
        }
      };
      
      this.logUnknownException(exception, requestInfo);
    }

    // Add HTTP status code to the request info for logging
    requestInfo['http.status_code'] = statusCode;

    // Send the response
    return response.status(statusCode).json(errorResponse);
  }

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
   * Logs application-specific exceptions
   */
  private logAppException(exception: BaseError, requestInfo: any): void {
    const { message, type, code } = exception;
    
    // Create a structured log entry with all context information
    this.logger.logError(exception, {
      ...requestInfo,
      errorType: type,
      errorCode: code
    });
  }

  /**
   * Logs NestJS HTTP exceptions
   */
  private logHttpException(exception: HttpException, status: HttpStatus, requestInfo: any): void {
    const message = exception.message;
    
    // Create a structured log entry with HTTP-specific information
    this.logger.logError(exception, {
      ...requestInfo,
      errorType: this.getErrorTypeFromStatus(status),
      errorCode: `HTTP_${status}`
    });
  }

  /**
   * Logs unknown exceptions
   */
  private logUnknownException(exception: Error, requestInfo: any): void {
    // Create a structured log entry for unknown errors
    this.logger.logError(exception, {
      ...requestInfo,
      errorType: ErrorType.TECHNICAL,
      errorCode: 'UNKNOWN_ERROR'
    });
  }
}