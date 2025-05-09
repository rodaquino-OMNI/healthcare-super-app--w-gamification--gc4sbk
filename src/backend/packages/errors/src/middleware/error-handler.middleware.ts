import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType } from '../base';
import { Logger } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ErrorContext, ErrorMetadata } from '../types';
import { isRetryableError } from '../utils/retry';
import { getJourneyContext } from '../utils/context';

/**
 * Options for configuring the error handler middleware
 */
export interface ErrorHandlerOptions {
  /**
   * Whether to include error details in the response (defaults to false in production)
   */
  includeDetails?: boolean;
  
  /**
   * Custom logger instance (if not provided, a default logger will be created)
   */
  logger?: Logger;
  
  /**
   * Tracing service for distributed tracing integration
   */
  tracingService?: TracingService;
  
  /**
   * Whether to log stack traces for all errors (defaults to true for non-validation errors)
   */
  logStackTraces?: boolean;
  
  /**
   * Whether to attempt retries for retryable errors (defaults to true)
   */
  enableRetries?: boolean;
  
  /**
   * Journey-specific error handling customizations
   */
  journeyHandlers?: {
    health?: (error: Error, req: Request, res: Response) => boolean;
    care?: (error: Error, req: Request, res: Response) => boolean;
    plan?: (error: Error, req: Request, res: Response) => boolean;
  };
}

/**
 * Factory function that creates an Express middleware for handling errors
 * in a standardized way across the AUSTA SuperApp.
 * 
 * This middleware catches all unhandled errors in Express applications,
 * categorizes them, transforms them to the application's standard error format,
 * determines appropriate HTTP status codes, and logs errors with context.
 * 
 * @param options Configuration options for the error handler
 * @returns Express error handling middleware
 * 
 * @example
 * // Basic usage with default options
 * app.use(createErrorHandlerMiddleware());
 * 
 * @example
 * // With custom logger and error details in development
 * app.use(createErrorHandlerMiddleware({
 *   includeDetails: process.env.NODE_ENV !== 'production',
 *   logger: myCustomLogger
 * }));
 */
export function createErrorHandlerMiddleware(options: ErrorHandlerOptions = {}) {
  // Create or use provided logger
  const logger = options.logger || new Logger('ErrorHandlerMiddleware');
  const tracingService = options.tracingService;
  const includeDetails = options.includeDetails ?? process.env.NODE_ENV !== 'production';
  const logStackTraces = options.logStackTraces ?? true;
  const enableRetries = options.enableRetries ?? true;
  const journeyHandlers = options.journeyHandlers || {};

  // Return the actual middleware function
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // If headers already sent, let the default Express error handler deal with it
    if (res.headersSent) {
      return next(error);
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Record<string, any>;

    // Extract request information for logging context
    const journeyContext = getJourneyContext(req);
    const requestInfo: ErrorContext = {
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.user?.id,
      journeyId: req.headers['x-journey-id'] as string,
      requestId: (req.headers['x-request-id'] as string) || (req as any).id,
      userAgent: req.headers['user-agent'] as string,
      journey: journeyContext.journey,
      journeySection: journeyContext.section,
      timestamp: new Date().toISOString()
    };
    
    // Add trace information if tracing service is available
    if (tracingService) {
      const traceContext = tracingService.getTraceContext();
      if (traceContext) {
        Object.assign(requestInfo, {
          traceId: traceContext.traceId,
          spanId: traceContext.spanId
        });
      }
    }
    
    // Try journey-specific error handlers first
    if (journeyContext.journey && journeyHandlers[journeyContext.journey]) {
      const handled = journeyHandlers[journeyContext.journey](error, req, res);
      if (handled) {
        // If the journey-specific handler processed the error, we're done
        return;
      }
    }

    // Check if error is retryable and retries are enabled
    if (enableRetries && isRetryableError(error)) {
      // For retryable errors, add retry information to the response headers
      // and let the client decide whether to retry
      const retryAfter = error.retryAfter || 1;
      res.setHeader('Retry-After', retryAfter.toString());
      
      // If this is a rate limit error, add specific headers
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        res.setHeader('X-RateLimit-Limit', (error.details?.limit || 100).toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000 + retryAfter).toString());
      }
    }
    
    // Record error in tracing system if available
    if (tracingService) {
      tracingService.recordError(error, {
        ...requestInfo,
        errorType: error instanceof BaseError ? error.type : ErrorType.TECHNICAL,
        errorCode: error instanceof BaseError ? error.code : 'INTERNAL_ERROR'
      });
    }

    // Handle different types of exceptions
    if (error instanceof BaseError) {
      // For our custom BaseErrors, use the built-in methods
      errorResponse = error.toJSON();
      statusCode = getStatusCodeFromErrorType(error.type);
      
      // Add journey-specific context to the error response if available
      if (journeyContext.journey) {
        const errorData = errorResponse.error;
        errorResponse.error = {
          ...errorData,
          context: {
            journey: journeyContext.journey,
            ...(journeyContext.section && { section: journeyContext.section }),
            ...(requestInfo.requestId && { requestId: requestInfo.requestId })
          }
        };
      }
      
      logAppException(error, requestInfo, logger, logStackTraces);
    } 
    else if (error instanceof HttpException) {
      // For NestJS HttpExceptions
      statusCode = error.getStatus();
      const exceptionResponse = error.getResponse();
      const errorType = getErrorTypeFromStatus(statusCode);
      
      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          error: {
            ...(typeof exceptionResponse === 'object' ? exceptionResponse : { message: exceptionResponse }),
            type: errorType,
            ...(journeyContext.journey && {
              context: {
                journey: journeyContext.journey,
                ...(journeyContext.section && { section: journeyContext.section }),
                ...(requestInfo.requestId && { requestId: requestInfo.requestId })
              }
            })
          }
        };
      } else {
        errorResponse = {
          error: {
            type: errorType,
            message: exceptionResponse,
            ...(journeyContext.journey && {
              context: {
                journey: journeyContext.journey,
                ...(journeyContext.section && { section: journeyContext.section }),
                ...(requestInfo.requestId && { requestId: requestInfo.requestId })
              }
            })
          }
        };
      }
      
      logHttpException(error, statusCode, requestInfo, logger, logStackTraces);
    } 
    else {
      // For unknown exceptions
      const errorMetadata: ErrorMetadata = {
        type: ErrorType.TECHNICAL,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        // Include additional details in non-production environments
        ...(includeDetails && {
          details: {
            name: error.name,
            message: error.message,
            ...(error.stack && { stackPreview: error.stack.split('\n').slice(0, 3).join('\n') })
          }
        }),
        ...(journeyContext.journey && {
          context: {
            journey: journeyContext.journey,
            ...(journeyContext.section && { section: journeyContext.section }),
            ...(requestInfo.requestId && { requestId: requestInfo.requestId })
          }
        })
      };
      
      errorResponse = { error: errorMetadata };
      logUnknownException(error, requestInfo, logger, logStackTraces);
    }

    // Send the response
    return res.status(statusCode).json(errorResponse);
  };
}

/**
 * Maps error types to HTTP status codes
 */
function getStatusCodeFromErrorType(type: ErrorType): HttpStatus {
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
function getErrorTypeFromStatus(status: HttpStatus): ErrorType {
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
function logAppException(exception: BaseError, requestInfo: ErrorContext, logger: Logger, logStackTraces: boolean): void {
  const { message, type, code, details } = exception;
  const logContext = 'ErrorHandlerMiddleware';
  const journeyPrefix = requestInfo.journey ? `[${requestInfo.journey.toUpperCase()}] ` : '';
  
  // Extract structured error data for logging
  const errorData = {
    type,
    code,
    message,
    details,
    journey: requestInfo.journey,
    journeySection: requestInfo.journeySection,
    timestamp: requestInfo.timestamp,
    requestId: requestInfo.requestId,
    userId: requestInfo.userId
  };
  
  switch (type) {
    case ErrorType.TECHNICAL:
      logger.error(
        `${journeyPrefix}Technical error: ${message} (${code})`,
        { error: errorData, request: requestInfo },
        logStackTraces ? exception.stack : undefined,
        logContext
      );
      break;
    case ErrorType.EXTERNAL:
      logger.error(
        `${journeyPrefix}External system error: ${message} (${code})`,
        { error: errorData, request: requestInfo },
        logStackTraces ? exception.stack : undefined,
        logContext
      );
      break;
    case ErrorType.BUSINESS:
      logger.warn(
        `${journeyPrefix}Business error: ${message} (${code})`,
        { error: errorData, request: requestInfo },
        logContext
      );
      break;
    case ErrorType.VALIDATION:
      logger.debug(
        `${journeyPrefix}Validation error: ${message} (${code})`,
        { error: errorData, request: requestInfo },
        logContext
      );
      break;
    default:
      // Handle any custom error types that might be added in the future
      logger.error(
        `${journeyPrefix}${type} error: ${message} (${code})`,
        { error: errorData, request: requestInfo },
        logStackTraces ? exception.stack : undefined,
        logContext
      );
      break;
  }
}

/**
 * Logs NestJS HTTP exceptions
 */
function logHttpException(exception: HttpException, status: HttpStatus, requestInfo: ErrorContext, logger: Logger, logStackTraces: boolean): void {
  const message = exception.message;
  const logContext = 'ErrorHandlerMiddleware';
  const journeyPrefix = requestInfo.journey ? `[${requestInfo.journey.toUpperCase()}] ` : '';
  
  // Extract structured error data for logging
  const errorData = {
    status,
    message,
    type: getErrorTypeFromStatus(status),
    journey: requestInfo.journey,
    journeySection: requestInfo.journeySection,
    timestamp: requestInfo.timestamp,
    requestId: requestInfo.requestId,
    userId: requestInfo.userId,
    response: exception.getResponse()
  };
  
  if (status >= 500) {
    logger.error(
      `${journeyPrefix}HTTP ${status} exception: ${message}`,
      { error: errorData, request: requestInfo },
      logStackTraces ? exception.stack : undefined,
      logContext
    );
  } else if (status >= 400) {
    logger.warn(
      `${journeyPrefix}HTTP ${status} exception: ${message}`,
      { error: errorData, request: requestInfo },
      logContext
    );
  } else {
    logger.debug(
      `${journeyPrefix}HTTP ${status} exception: ${message}`,
      { error: errorData, request: requestInfo },
      logContext
    );
  }
}

/**
 * Logs unknown exceptions
 */
function logUnknownException(exception: Error, requestInfo: ErrorContext, logger: Logger, logStackTraces: boolean): void {
  const journeyPrefix = requestInfo.journey ? `[${requestInfo.journey.toUpperCase()}] ` : '';
  
  // Extract structured error data for logging
  const errorData = {
    name: exception.name,
    message: exception.message,
    type: ErrorType.TECHNICAL,
    journey: requestInfo.journey,
    journeySection: requestInfo.journeySection,
    timestamp: requestInfo.timestamp,
    requestId: requestInfo.requestId,
    userId: requestInfo.userId
  };
  
  logger.error(
    `${journeyPrefix}Unhandled exception: ${exception.message}`,
    { error: errorData, request: requestInfo },
    logStackTraces ? exception.stack : undefined,
    'ErrorHandlerMiddleware'
  );
  
  // If this is a critical error that might indicate a larger issue,
  // we could trigger additional alerting here
  if (isCriticalError(exception)) {
    logger.fatal(
      `${journeyPrefix}CRITICAL ERROR: ${exception.message}`,
      { error: errorData, request: requestInfo },
      exception.stack,
      'ErrorHandlerMiddleware'
    );
  }
}

/**
 * Determines if an error is critical and requires immediate attention
 */
function isCriticalError(error: Error): boolean {
  // Check for memory issues
  if (error.message.includes('heap') || error.message.includes('memory')) {
    return true;
  }
  
  // Check for connection pool exhaustion
  if (error.message.includes('connection pool') || error.message.includes('too many connections')) {
    return true;
  }
  
  // Check for filesystem errors
  if (error.message.includes('ENOSPC') || error.message.includes('disk space')) {
    return true;
  }
  
  return false;
}

/**
 * Convenience function to create and register the error handler middleware with an Express app
 * 
 * @param app Express application instance
 * @param options Configuration options for the error handler
 * 
 * @example
 * // Register with default options
 * registerErrorHandler(app);
 * 
 * @example
 * // Register with custom options
 * registerErrorHandler(app, {
 *   includeDetails: process.env.NODE_ENV !== 'production',
 *   logger: myCustomLogger,
 *   tracingService: myTracingService,
 *   journeyHandlers: {
 *     health: (error, req, res) => {
 *       // Custom health journey error handling
 *       return false; // Return true if handled, false to continue with default handling
 *     }
 *   }
 * });
 */
export function registerErrorHandler(app: any, options: ErrorHandlerOptions = {}): void {
  if (!app || typeof app.use !== 'function') {
    throw new Error('Invalid Express application instance provided to registerErrorHandler');
  }
  
  // Register the error handler middleware as the last middleware in the chain
  app.use(createErrorHandlerMiddleware(options));
  
  // Log that the error handler has been registered
  const logger = options.logger || new Logger('ErrorHandlerMiddleware');
  logger.log('Error handler middleware registered', 'ErrorHandlerMiddleware');
}

/**
 * Creates a journey-specific error handler for use with the journeyHandlers option
 * 
 * @param journey The journey identifier ('health', 'care', or 'plan')
 * @param handler The error handling function
 * @returns A configured journey error handler
 * 
 * @example
 * // Create a custom health journey error handler
 * const healthErrorHandler = createJourneyErrorHandler('health', (error, req, res) => {
 *   if (error.message.includes('health metric')) {
 *     res.status(400).json({
 *       error: {
 *         type: 'validation',
 *         code: 'HEALTH_METRIC_INVALID',
 *         message: 'The health metric value is outside the acceptable range',
 *         context: { journey: 'health' }
 *       }
 *     });
 *     return true; // Indicate that we've handled this error
 *   }
 *   return false; // Let the default handler process this error
 * });
 * 
 * // Use it when registering the error handler
 * registerErrorHandler(app, {
 *   journeyHandlers: {
 *     health: healthErrorHandler
 *   }
 * });
 */
export function createJourneyErrorHandler(
  journey: 'health' | 'care' | 'plan',
  handler: (error: Error, req: Request, res: Response) => boolean
): (error: Error, req: Request, res: Response) => boolean {
  return (error: Error, req: Request, res: Response) => {
    // Only process errors for this journey
    const journeyHeader = req.headers['x-journey-id'] as string;
    if (journeyHeader && journeyHeader !== journey) {
      return false;
    }
    
    return handler(error, req, res);
  };
}