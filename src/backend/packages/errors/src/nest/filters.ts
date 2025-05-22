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
import { BaseError, ErrorType } from '../categories/base.error';
import { TechnicalError } from '../categories/technical.errors';
import { ExternalError } from '../categories/external.errors';
import { TracingService } from '@austa/tracing';
import { LoggingService } from '@austa/logging';
import { FallbackStrategyExecutor } from '../recovery/fallback-strategy.executor';
import { isRecoverableError } from '../utils/error-classification.util';

/**
 * Global exception filter that catches all exceptions in the NestJS request pipeline,
 * properly categorizes them using the expanded error types, maps them to appropriate
 * HTTP status codes, constructs standardized JSON responses, and logs them with
 * comprehensive request context.
 *
 * This filter integrates with the AUSTA SuperApp's error handling framework and leverages
 * the new tracing system for better error visibility. It also applies fallback strategies
 * for recoverable errors.
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly loggingService: LoggingService,
    private readonly tracingService: TracingService,
    private readonly fallbackStrategyExecutor: FallbackStrategyExecutor
  ) {
    this.logger.log('GlobalExceptionFilter initialized');
  }

  /**
   * Catches all exceptions in the request pipeline and transforms them into a standardized
   * response format with appropriate HTTP status codes.
   *
   * @param exception The caught exception
   * @param host The arguments host
   * @returns The response object
   */
  catch(exception: unknown, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract request information for logging and tracing context
    const requestInfo = this.extractRequestInfo(request);
    
    // Add the exception to the current trace span
    this.tracingService.setErrorInCurrentSpan(exception);

    // Try to recover from the error if it's recoverable
    if (isRecoverableError(exception)) {
      try {
        const result = this.fallbackStrategyExecutor.execute(exception, requestInfo);
        if (result.recovered) {
          this.loggingService.info(
            `Recovered from error using fallback strategy: ${result.strategyName}`,
            { exception, requestInfo, recoveryResult: result }
          );
          return response.status(result.statusCode || HttpStatus.OK).json(result.data);
        }
      } catch (recoveryError) {
        this.loggingService.error(
          'Error occurred during fallback strategy execution',
          { originalException: exception, recoveryError, requestInfo }
        );
      }
    }

    // Process the exception and generate a standardized response
    const { statusCode, errorResponse } = this.processException(exception, requestInfo);

    // Log the exception with appropriate level based on status code
    this.logException(exception, statusCode, requestInfo, errorResponse);

    // Send the response
    return response.status(statusCode).json(errorResponse);
  }

  /**
   * Extracts relevant information from the request for logging and tracing context.
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
      headers: {
        'x-request-id': request.headers['x-request-id'],
        'x-correlation-id': request.headers['x-correlation-id'],
        'x-journey-id': request.headers['x-journey-id'],
        'x-journey-step': request.headers['x-journey-step'],
        'user-agent': request.headers['user-agent']
      },
      userId: request.user?.id,
      journeyId: request.headers['x-journey-id'],
      journeyStep: request.headers['x-journey-step'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Processes the exception and generates a standardized response with appropriate
   * HTTP status code.
   *
   * @param exception The caught exception
   * @param requestInfo The request information
   * @returns Object containing status code and error response
   */
  private processException(
    exception: unknown,
    requestInfo: Record<string, any>
  ): { statusCode: number; errorResponse: any } {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any;

    // Handle different types of exceptions
    if (exception instanceof BaseError) {
      // For our custom BaseError and its subclasses
      errorResponse = exception.toJSON();
      statusCode = this.getStatusCodeFromErrorType(exception.type);

      // Add journey-specific context if available
      if (exception.context && requestInfo.journeyId) {
        errorResponse.error.journeyContext = {
          journeyId: requestInfo.journeyId,
          journeyStep: requestInfo.journeyStep
        };
      }
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
    } 
    else {
      // For unknown exceptions
      const error = exception instanceof Error ? exception : new Error('Unknown error');
      
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

      // Add trace ID for debugging
      const traceId = this.tracingService.getCurrentTraceId();
      if (traceId) {
        errorResponse.error.traceId = traceId;
      }
    }

    return { statusCode, errorResponse };
  }

  /**
   * Maps error types to HTTP status codes.
   *
   * @param type The error type
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
        return HttpStatus.INTERNAL_SERVER_ERROR;
      // Journey-specific error types
      case ErrorType.HEALTH_JOURNEY:
      case ErrorType.CARE_JOURNEY:
      case ErrorType.PLAN_JOURNEY:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Maps HTTP status codes to error types.
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
   * Logs the exception with appropriate level based on status code and error type.
   *
   * @param exception The caught exception
   * @param statusCode The HTTP status code
   * @param requestInfo The request information
   * @param errorResponse The error response
   */
  private logException(
    exception: unknown,
    statusCode: number,
    requestInfo: Record<string, any>,
    errorResponse: any
  ): void {
    const errorType = errorResponse?.error?.type;
    const errorCode = errorResponse?.error?.code;
    const errorMessage = errorResponse?.error?.message;
    const traceId = this.tracingService.getCurrentTraceId();
    
    const logContext = {
      exception,
      requestInfo,
      errorResponse,
      traceId
    };

    // Log based on error type and status code
    if (exception instanceof TechnicalError || (statusCode >= 500 && statusCode !== HttpStatus.BAD_GATEWAY)) {
      this.loggingService.error(
        `Technical error: ${errorMessage} (${errorCode})`,
        logContext
      );
    } 
    else if (exception instanceof ExternalError || statusCode === HttpStatus.BAD_GATEWAY) {
      this.loggingService.error(
        `External system error: ${errorMessage} (${errorCode})`,
        logContext
      );
    } 
    else if (statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
      this.loggingService.warn(
        `Business error: ${errorMessage} (${errorCode})`,
        logContext
      );
    } 
    else if (statusCode === HttpStatus.BAD_REQUEST) {
      this.loggingService.debug(
        `Validation error: ${errorMessage} (${errorCode})`,
        logContext
      );
    } 
    else {
      this.loggingService.error(
        `Unhandled exception: ${errorMessage || 'Unknown error'}`,
        logContext
      );
    }
  }
}