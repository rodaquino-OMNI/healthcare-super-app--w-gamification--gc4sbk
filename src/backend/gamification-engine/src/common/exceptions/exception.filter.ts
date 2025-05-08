import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppExceptionBase } from './app-exception.base';
import { SystemException } from './system.exception';
import { ErrorType } from './error-types.enum';
import { BaseResponseDto, ErrorResponseDto, ErrorSeverity, ErrorSource } from '../dto';

/**
 * NestJS exception filter that catches and processes all exceptions in the application.
 * Transforms exceptions into standardized HTTP responses, handles logging, and integrates
 * with monitoring systems to track error trends and trigger alerts.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  
  /**
   * Catches and processes exceptions
   * 
   * @param exception The caught exception
   * @param host ArgumentsHost containing the request and response objects
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Extract request information for context
    const requestInfo = {
      url: request.url,
      method: request.method,
      ip: request.ip,
      userId: request.user?.id,
      requestId: request.headers['x-request-id'] || 'unknown',
    };
    
    // Process different types of exceptions
    if (exception instanceof AppExceptionBase) {
      this.handleAppException(exception, response, requestInfo);
    } else if (exception instanceof HttpException) {
      this.handleHttpException(exception, response, requestInfo);
    } else {
      this.handleUnknownException(exception, response, requestInfo);
    }
  }
  
  /**
   * Handles exceptions that extend AppExceptionBase
   */
  private handleAppException(
    exception: AppExceptionBase,
    response: Response,
    requestInfo: Record<string, any>,
  ): void {
    const statusCode = exception.getStatus();
    
    // Create standardized error response
    const errorResponse = ErrorResponseDto.fromError(exception, {
      includeStack: process.env.NODE_ENV !== 'production',
      journeyContext: {
        journey: 'gamification',
        feature: exception.getContext('feature') as string,
        action: exception.getContext('action') as string,
      },
    });
    
    // Create base response with error
    const responseBody = BaseResponseDto.error(errorResponse, {
      timestamp: new Date().toISOString(),
      requestId: requestInfo.requestId,
    });
    
    // Log the exception with appropriate level based on status code
    this.logException(exception, statusCode, requestInfo);
    
    // Check if this exception should trigger an alert
    if (exception instanceof SystemException && exception.shouldAlert()) {
      this.triggerAlert(exception, requestInfo);
    }
    
    // Send response to client
    response.status(statusCode).json(responseBody);
  }
  
  /**
   * Handles standard NestJS HttpExceptions
   */
  private handleHttpException(
    exception: HttpException,
    response: Response,
    requestInfo: Record<string, any>,
  ): void {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    // Create standardized error response
    const errorResponse = new ErrorResponseDto();
    errorResponse.code = `GAMIFICATION_HTTP_${statusCode}`;
    errorResponse.timestamp = new Date().toISOString();
    
    // Handle different response formats
    if (typeof exceptionResponse === 'string') {
      errorResponse.message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, any>;
      errorResponse.message = responseObj.message || `HTTP error ${statusCode}`;
      
      // Add validation errors if available
      if (responseObj.errors || responseObj.validationErrors) {
        errorResponse.details = {
          validationErrors: responseObj.errors || responseObj.validationErrors,
        };
      }
    } else {
      errorResponse.message = `HTTP error ${statusCode}`;
    }
    
    // Set severity and source based on status code
    if (statusCode >= 500) {
      errorResponse.severity = ErrorSeverity.ERROR;
      errorResponse.source = ErrorSource.SYSTEM;
    } else if (statusCode >= 400) {
      errorResponse.severity = ErrorSeverity.WARNING;
      errorResponse.source = ErrorSource.CLIENT;
    } else {
      errorResponse.severity = ErrorSeverity.INFO;
      errorResponse.source = ErrorSource.CLIENT;
    }
    
    // Set journey context
    errorResponse.journeyContext = {
      journey: 'gamification',
    };
    
    // Create base response with error
    const responseBody = BaseResponseDto.error(errorResponse, {
      timestamp: new Date().toISOString(),
      requestId: requestInfo.requestId,
    });
    
    // Log the exception
    this.logException(exception, statusCode, requestInfo);
    
    // Send response to client
    response.status(statusCode).json(responseBody);
  }
  
  /**
   * Handles unknown exceptions by converting them to SystemExceptions
   */
  private handleUnknownException(
    exception: unknown,
    response: Response,
    requestInfo: Record<string, any>,
  ): void {
    const error = exception instanceof Error ? exception : new Error('Unknown error');
    const systemException = new SystemException(
      'An unexpected error occurred',
      ErrorType.UNKNOWN_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
    
    // Add request context
    Object.entries(requestInfo).forEach(([key, value]) => {
      systemException.addContext(key, value);
    });
    
    // Create standardized error response
    const errorResponse = new ErrorResponseDto();
    errorResponse.code = 'GAMIFICATION_INTERNAL_ERROR';
    errorResponse.message = 'An unexpected error occurred';
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.severity = ErrorSeverity.CRITICAL;
    errorResponse.source = ErrorSource.SYSTEM;
    errorResponse.journeyContext = { journey: 'gamification' };
    
    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = error.stack;
    }
    
    // Create base response with error
    const responseBody = BaseResponseDto.error(errorResponse, {
      timestamp: new Date().toISOString(),
      requestId: requestInfo.requestId,
    });
    
    // Log the exception
    this.logger.error(
      `Unhandled exception: ${error.message}`,
      error.stack,
      { requestInfo, error: error.message },
    );
    
    // Trigger alert for unhandled exceptions
    this.triggerAlert(systemException, requestInfo);
    
    // Send response to client
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(responseBody);
  }
  
  /**
   * Logs an exception with appropriate log level based on status code
   */
  private logException(
    exception: Error,
    statusCode: number,
    requestInfo: Record<string, any>,
  ): void {
    const logContext = { exception: exception.constructor.name, requestInfo };
    
    if (statusCode >= 500) {
      // Server errors
      this.logger.error(
        `[${statusCode}] ${exception.message}`,
        exception.stack,
        logContext,
      );
    } else if (statusCode >= 400) {
      // Client errors
      this.logger.warn(
        `[${statusCode}] ${exception.message}`,
        logContext,
      );
    } else {
      // Other status codes
      this.logger.log(
        `[${statusCode}] ${exception.message}`,
        logContext,
      );
    }
  }
  
  /**
   * Triggers an alert for critical exceptions
   * In a real implementation, this would integrate with monitoring systems
   */
  private triggerAlert(
    exception: SystemException,
    requestInfo: Record<string, any>,
  ): void {
    this.logger.error(
      `ALERT: Critical exception detected: ${exception.message}`,
      {
        exception: exception.serialize(),
        requestInfo,
      },
    );
    
    // In a real implementation, this would send alerts to monitoring systems
    // For example: 
    // this.monitoringService.sendAlert({
    //   title: `Critical exception in ${process.env.SERVICE_NAME}`,
    //   message: exception.message,
    //   severity: 'critical',
    //   context: {
    //     exception: exception.serialize(),
    //     requestInfo,
    //   },
    // });
  }
}