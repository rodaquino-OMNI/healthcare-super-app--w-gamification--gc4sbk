import { HttpStatus, Logger, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap, retryWhen } from 'rxjs/operators';
import {
  BaseError,
  ErrorType,
  ErrorContext,
  ErrorMetadata,
  RetryConfig,
  CircuitBreakerConfig,
  HealthJourneyErrorType,
  CareJourneyErrorType,
  PlanJourneyErrorType,
  isTransientError,
  isExternalDependencyError,
  ERROR_CODES,
} from '@austa/errors';
import { Span, Tracer } from '@opentelemetry/api';

// Create a logger instance for error handling
const logger = new Logger('ErrorHandlingUtil');

/**
 * Interface for error response structure
 */
export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path?: string;
  journey?: string;
  context?: Record<string, any>;
  correlationId?: string;
}

/**
 * Retry configuration with default values
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  scalingDuration: 1000,
  excludedStatusCodes: [HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.NOT_FOUND],
};

/**
 * Circuit breaker configuration with default values
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  fallbackResponse: { message: 'Service temporarily unavailable' },
};

/**
 * Journey mapping for error context
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Categorizes an error based on its type and properties
 * 
 * @param error - The error to categorize
 * @returns The categorized error type
 */
export function categorizeError(error: any): ErrorType {
  // If it's already a BaseError, return its type
  if (error instanceof BaseError) {
    return error.type;
  }

  // Check for HTTP status code to determine error type
  const statusCode = error.status || error.statusCode || (error.response?.status);
  
  if (statusCode) {
    if (statusCode >= 400 && statusCode < 500) {
      return ErrorType.CLIENT;
    } else if (statusCode >= 500) {
      return ErrorType.SYSTEM;
    }
  }

  // Check for network or timeout errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network error')
  ) {
    return ErrorType.TRANSIENT;
  }

  // Check for external dependency errors
  if (
    error.message?.includes('external') ||
    error.message?.includes('third-party') ||
    error.message?.includes('dependency')
  ) {
    return ErrorType.EXTERNAL_DEPENDENCY;
  }

  // Default to system error
  return ErrorType.SYSTEM;
}

/**
 * Determines the journey type from the request path or error context
 * 
 * @param error - The error object
 * @param request - The HTTP request object
 * @returns The journey type or undefined if not determinable
 */
export function determineJourneyType(error: any, request?: Request): JourneyType | undefined {
  // Check if the error already has journey information
  if (error.journey) {
    return error.journey as JourneyType;
  }

  // Check if the error is a BaseError with context
  if (error instanceof BaseError && error.context?.journey) {
    return error.context.journey as JourneyType;
  }

  // If request is available, try to determine from path
  if (request?.path) {
    const path = request.path.toLowerCase();
    
    if (path.includes('/health/')) {
      return JourneyType.HEALTH;
    } else if (path.includes('/care/')) {
      return JourneyType.CARE;
    } else if (path.includes('/plan/')) {
      return JourneyType.PLAN;
    }
  }

  return undefined;
}

/**
 * Creates a journey-specific error based on the error type and journey
 * 
 * @param error - The original error
 * @param journeyType - The journey type
 * @param context - Additional context information
 * @returns A journey-specific error
 */
export function createJourneyError(error: any, journeyType?: JourneyType, context?: ErrorContext): BaseError {
  // If it's already a BaseError, just enrich it with additional context
  if (error instanceof BaseError) {
    if (context) {
      error.enrichContext(context);
    }
    return error;
  }

  const errorType = categorizeError(error);
  const message = error.message || 'An unexpected error occurred';
  const statusCode = error.status || error.statusCode || (error.response?.status) || HttpStatus.INTERNAL_SERVER_ERROR;
  
  // Create error metadata
  const metadata: ErrorMetadata = {
    originalError: error,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Enrich context with journey information if available
  const enrichedContext: ErrorContext = {
    ...context,
    ...(journeyType && { journey: journeyType }),
  };

  // Create journey-specific error based on journey type
  switch (journeyType) {
    case JourneyType.HEALTH:
      return new BaseError(
        message,
        errorType,
        HealthJourneyErrorType.GENERAL,
        enrichedContext,
        metadata
      );
    case JourneyType.CARE:
      return new BaseError(
        message,
        errorType,
        CareJourneyErrorType.GENERAL,
        enrichedContext,
        metadata
      );
    case JourneyType.PLAN:
      return new BaseError(
        message,
        errorType,
        PlanJourneyErrorType.GENERAL,
        enrichedContext,
        metadata
      );
    default:
      return new BaseError(
        message,
        errorType,
        undefined,
        enrichedContext,
        metadata
      );
  }
}

/**
 * Enriches an error with context information from the request
 * 
 * @param error - The error to enrich
 * @param request - The HTTP request
 * @param tracer - Optional OpenTelemetry tracer for distributed tracing
 * @returns The enriched error
 */
export function enrichErrorWithContext(error: any, request?: Request, tracer?: Tracer): BaseError {
  const journeyType = determineJourneyType(error, request);
  
  // Create context from request information
  const context: ErrorContext = {};
  
  if (request) {
    // Add request information to context
    context.requestId = request.headers['x-request-id'] as string;
    context.path = request.path;
    context.method = request.method;
    context.userAgent = request.headers['user-agent'] as string;
    
    // Add user information if available
    if (request.user) {
      context.userId = (request.user as any).id;
      context.userRole = (request.user as any).role;
    }
    
    // Add query parameters and body (excluding sensitive data)
    context.query = { ...request.query };
    if (context.query.password) {
      context.query.password = '[REDACTED]';
    }
    
    if (request.body && typeof request.body === 'object') {
      const body = { ...request.body };
      if (body.password) {
        body.password = '[REDACTED]';
      }
      context.body = body;
    }
  }
  
  // Add trace information if tracer is available
  if (tracer) {
    const currentSpan = tracer.getCurrentSpan();
    if (currentSpan) {
      context.traceId = currentSpan.spanContext().traceId;
      context.spanId = currentSpan.spanContext().spanId;
      
      // Add error information to the span
      currentSpan.setAttributes({
        'error': true,
        'error.type': categorizeError(error).toString(),
        'error.message': error.message || 'Unknown error',
      });
      
      if (error.stack) {
        currentSpan.setAttributes({
          'error.stack': error.stack,
        });
      }
    }
  }
  
  return createJourneyError(error, journeyType, context);
}

/**
 * Formats an error for client response
 * 
 * @param error - The error to format
 * @param includeContext - Whether to include context in the response (defaults to false for security)
 * @returns A formatted error response
 */
export function formatErrorForResponse(error: any, includeContext = false): ErrorResponse {
  // If it's a BaseError, use its serialization
  if (error instanceof BaseError) {
    const serialized = error.serialize();
    
    const response: ErrorResponse = {
      statusCode: serialized.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: serialized.code || ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR,
      message: serialized.message,
      timestamp: serialized.timestamp || new Date().toISOString(),
      ...(serialized.path && { path: serialized.path }),
      ...(serialized.context?.journey && { journey: serialized.context.journey }),
      ...(serialized.context?.correlationId && { correlationId: serialized.context.correlationId }),
    };
    
    // Include context if specified and available
    if (includeContext && serialized.context) {
      // Filter out sensitive information
      const safeContext = { ...serialized.context };
      delete safeContext.password;
      delete safeContext.token;
      delete safeContext.credentials;
      
      response.context = safeContext;
    }
    
    return response;
  }
  
  // Handle non-BaseError errors
  const errorType = categorizeError(error);
  const statusCode = error.status || error.statusCode || (error.response?.status) || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = error.message || 'An unexpected error occurred';
  
  // Determine error code based on error type and status code
  let errorCode = ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR;
  
  if (errorType === ErrorType.CLIENT) {
    if (statusCode === HttpStatus.UNAUTHORIZED) {
      errorCode = ERROR_CODES.AUTH.UNAUTHORIZED;
    } else if (statusCode === HttpStatus.FORBIDDEN) {
      errorCode = ERROR_CODES.AUTH.FORBIDDEN;
    } else if (statusCode === HttpStatus.BAD_REQUEST) {
      errorCode = ERROR_CODES.API.INVALID_INPUT;
    } else if (statusCode === HttpStatus.NOT_FOUND) {
      errorCode = ERROR_CODES.API.RESOURCE_NOT_FOUND;
    } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      errorCode = ERROR_CODES.API.RATE_LIMIT_EXCEEDED;
    }
  } else if (errorType === ErrorType.TRANSIENT) {
    errorCode = ERROR_CODES.SYSTEM.TRANSIENT_ERROR;
  } else if (errorType === ErrorType.EXTERNAL_DEPENDENCY) {
    errorCode = ERROR_CODES.SYSTEM.EXTERNAL_DEPENDENCY_ERROR;
  }
  
  return {
    statusCode,
    errorCode,
    message,
    timestamp: new Date().toISOString(),
    ...(error.path && { path: error.path }),
    ...(error.journey && { journey: error.journey }),
  };
}

/**
 * Implements retry with exponential backoff for transient errors
 * 
 * @param config - Retry configuration
 * @returns An RxJS operator for retrying operations
 */
export function retryWithBackoff(config: Partial<RetryConfig> = {}) {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return (source: Observable<any>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, i) => {
            const retryAttempt = i + 1;
            
            // Check if we've reached the maximum number of retries
            if (retryAttempt > retryConfig.maxRetries) {
              logger.error(
                `Maximum retry attempts (${retryConfig.maxRetries}) reached. Giving up.`,
                error.stack
              );
              return throwError(() => error);
            }
            
            // Check if the error is a non-retryable status code
            if (error.status && retryConfig.excludedStatusCodes.includes(error.status)) {
              logger.warn(
                `Status code ${error.status} is excluded from retry. Giving up.`,
                error.stack
              );
              return throwError(() => error);
            }
            
            // Check if the error is transient
            if (!isTransientError(error) && !isExternalDependencyError(error)) {
              logger.warn(
                `Error is not transient or external dependency error. Giving up.`,
                error.stack
              );
              return throwError(() => error);
            }
            
            // Calculate backoff time
            const backoffTime = retryConfig.scalingDuration * Math.pow(2, retryAttempt - 1);
            
            logger.debug(
              `Retrying after ${backoffTime}ms (attempt ${retryAttempt}/${retryConfig.maxRetries})`,
              { error: error.message }
            );
            
            return timer(backoffTime);
          })
        )
      )
    );
}

/**
 * Handles an error in the API Gateway context
 * 
 * @param error - The error to handle
 * @param request - The HTTP request
 * @param tracer - Optional OpenTelemetry tracer
 * @returns A formatted error response
 */
export function handleApiGatewayError(error: any, request?: Request, tracer?: Tracer): ErrorResponse {
  // Enrich error with context
  const enrichedError = enrichErrorWithContext(error, request, tracer);
  
  // Log the error with appropriate level based on error type
  const errorType = enrichedError.type;
  const serialized = enrichedError.serialize();
  
  if (errorType === ErrorType.CLIENT) {
    logger.warn(`Client error: ${enrichedError.message}`, serialized);
  } else if (errorType === ErrorType.SYSTEM) {
    logger.error(`System error: ${enrichedError.message}`, serialized);
  } else if (errorType === ErrorType.TRANSIENT) {
    logger.warn(`Transient error: ${enrichedError.message}`, serialized);
  } else if (errorType === ErrorType.EXTERNAL_DEPENDENCY) {
    logger.error(`External dependency error: ${enrichedError.message}`, serialized);
  } else {
    logger.error(`Unclassified error: ${enrichedError.message}`, serialized);
  }
  
  // Format the error for response
  // Only include context in development environment
  const includeContext = process.env.NODE_ENV === 'development';
  return formatErrorForResponse(enrichedError, includeContext);
}

/**
 * Creates a circuit breaker function for protecting against cascading failures
 * 
 * @param config - Circuit breaker configuration
 * @returns A function that implements the circuit breaker pattern
 */
export function createCircuitBreaker<T>(config: Partial<CircuitBreakerConfig> = {}) {
  const circuitBreakerConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  
  // Circuit state
  let failures = 0;
  let circuitOpen = false;
  let lastFailureTime = 0;
  
  return async (operation: () => Promise<T>): Promise<T> => {
    // Check if circuit is open
    if (circuitOpen) {
      // Check if it's time to try again (half-open state)
      const now = Date.now();
      if (now - lastFailureTime >= circuitBreakerConfig.resetTimeout) {
        logger.debug('Circuit breaker entering half-open state');
        circuitOpen = false;
        failures = 0;
      } else {
        logger.debug('Circuit breaker is open, returning fallback response');
        return circuitBreakerConfig.fallbackResponse as T;
      }
    }
    
    try {
      // Attempt the operation
      const result = await operation();
      
      // Reset failure count on success
      failures = 0;
      return result;
    } catch (error) {
      // Only count failures for external dependency errors
      if (isExternalDependencyError(error)) {
        failures++;
        lastFailureTime = Date.now();
        
        logger.warn(
          `External dependency error: ${error.message}. Failure count: ${failures}/${circuitBreakerConfig.failureThreshold}`,
          error
        );
        
        // Open the circuit if threshold is reached
        if (failures >= circuitBreakerConfig.failureThreshold) {
          circuitOpen = true;
          logger.error(
            `Circuit breaker opened after ${failures} consecutive failures. Will retry after ${circuitBreakerConfig.resetTimeout}ms`,
            error
          );
          return circuitBreakerConfig.fallbackResponse as T;
        }
      }
      
      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Extracts error information from an execution context
 * 
 * @param context - The execution context
 * @returns The request object from the context
 */
export function extractRequestFromContext(context: ExecutionContext): Request | undefined {
  try {
    // For HTTP requests
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }
    
    // For GraphQL requests
    if (context.getType() === 'graphql') {
      const gqlContext = context.getArgByIndex(2); // [root, args, context, info]
      return gqlContext.req;
    }
    
    // For WebSocket requests
    if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return client.handshake;
    }
    
    // For RPC requests
    if (context.getType() === 'rpc') {
      const data = context.switchToRpc().getData();
      return data.request;
    }
  } catch (error) {
    logger.error('Failed to extract request from context', error);
  }
  
  return undefined;
}

/**
 * Utility function to determine if an error is retryable
 * 
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Already classified errors
  if (isTransientError(error) || isExternalDependencyError(error)) {
    return true;
  }
  
  // Check status code
  const statusCode = error.status || error.statusCode || (error.response?.status);
  if (statusCode) {
    // 5xx errors are generally retryable, except for 501 Not Implemented
    if (statusCode >= 500 && statusCode !== 501) {
      return true;
    }
    
    // 429 Too Many Requests is retryable after a delay
    if (statusCode === 429) {
      return true;
    }
  }
  
  // Check for network-related errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network error')
  ) {
    return true;
  }
  
  return false;
}