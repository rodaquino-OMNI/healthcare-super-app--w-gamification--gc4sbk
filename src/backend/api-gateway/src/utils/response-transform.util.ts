import { HttpStatus, Logger } from '@nestjs/common';
import { JOURNEY_IDS } from '@austa/interfaces/common';
import * as ErrorCodes from '@austa/errors/constants/error-codes';
import { LoggingService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { ErrorType } from '@austa/errors/categories';
import { BaseError } from '@austa/errors/base-error';

const logger = new Logger('ResponseTransformUtil');
const loggingService = new LoggingService();
const tracingService = new TracingService();

/**
 * Transforms a successful response from a backend service into a standardized format for the client.
 * 
 * @param data - The data to transform
 * @returns The transformed response data
 */
export function transformResponse(data: any): any {
  // If data is null or undefined, return an empty object
  if (data === null || data === undefined) {
    return {};
  }
  
  // Return the data as is
  return data;
}

/**
 * Transforms an error response from a backend service into a standardized format for the client.
 * Extracts relevant information from various error types and converts them to a consistent format.
 * 
 * @param error - The error to transform
 * @returns A standardized error response object
 */
export function transformErrorResponse(error: any): { 
  statusCode: number; 
  errorCode: string; 
  message: string;
  timestamp: string;
  path?: string;
  journey?: string;
  correlationId?: string;
  details?: Record<string, any>;
} {
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';
  let errorCode = ErrorCodes.SYS_INTERNAL_SERVER_ERROR;
  let path: string | undefined;
  let journey: string | undefined;
  let correlationId: string | undefined;
  let details: Record<string, any> | undefined;

  // Get current trace context for correlation ID
  const traceContext = tracingService.getCurrentContext();
  if (traceContext) {
    correlationId = traceContext.traceId;
  }

  // Create structured log context
  const logContext = loggingService.createContext({
    correlationId,
    error: {
      name: error?.name || 'Error',
      message: error?.message || errorMessage,
      stack: error?.stack
    }
  });

  // Log the error with structured context
  logger.error(
    `Transforming error response: ${error?.message || 'Unknown error'}`, 
    error?.stack,
    logContext
  );

  // Handle BaseError from @austa/errors package
  if (error instanceof BaseError) {
    statusCode = error.statusCode;
    errorMessage = error.message;
    errorCode = error.errorCode;
    journey = error.journey;
    correlationId = error.correlationId || correlationId;
    path = error.path;
    details = error.details;

    // Add journey-specific context if available
    if (error.journeyContext) {
      if (!journey && error.journeyContext.journeyType) {
        journey = error.journeyContext.journeyType;
      }
      
      // Add journey-specific details to the error response
      if (!details) {
        details = {};
      }
      details.journeyContext = error.journeyContext;
    }

    // Map error types to appropriate status codes if not explicitly set
    if (!error.statusCode) {
      switch (error.type) {
        case ErrorType.VALIDATION:
          statusCode = HttpStatus.BAD_REQUEST;
          break;
        case ErrorType.BUSINESS:
          statusCode = HttpStatus.CONFLICT;
          break;
        case ErrorType.TECHNICAL:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          break;
        case ErrorType.EXTERNAL:
          statusCode = HttpStatus.BAD_GATEWAY;
          break;
        default:
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
  } else if (error.response) {
    // Handle Axios-like error objects
    statusCode = error.response.status || statusCode;
    errorMessage = error.response.data?.message || error.message || errorMessage;
    errorCode = error.response.data?.errorCode || errorCode;
    path = error.response.data?.path || error.config?.url;
    correlationId = error.response.data?.correlationId || correlationId;
    details = error.response.data?.details;
    
    // Extract journey from path if available
    if (path) {
      Object.values(JOURNEY_IDS).forEach(journeyId => {
        if (path?.includes(`/${journeyId}/`)) {
          journey = journeyId;
        }
      });
    }

    // Extract journey from error response if available
    if (!journey && error.response.data?.journey) {
      journey = error.response.data.journey;
    }
  } else if (error.status) {
    // Handle NestJS HttpException or similar error objects
    statusCode = error.status;
    errorMessage = error.message || errorMessage;
    errorCode = error.errorCode || errorCode;
    path = error.path;
    journey = error.journey;
    correlationId = error.correlationId || correlationId;
    details = error.details;
  } else if (error instanceof Error) {
    // Handle standard Error objects
    errorMessage = error.message || errorMessage;
  }

  // Map specific error messages to appropriate error codes if not already set
  if (errorCode === ErrorCodes.SYS_INTERNAL_SERVER_ERROR) {
    if (errorMessage.toLowerCase().includes('unauthorized') || 
        errorMessage.toLowerCase().includes('unauthenticated')) {
      errorCode = ErrorCodes.AUTH_INVALID_CREDENTIALS;
      statusCode = HttpStatus.UNAUTHORIZED;
    } else if (errorMessage.toLowerCase().includes('forbidden')) {
      errorCode = ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS;
      statusCode = HttpStatus.FORBIDDEN;
    } else if (errorMessage.toLowerCase().includes('token expired')) {
      errorCode = ErrorCodes.AUTH_TOKEN_EXPIRED;
      statusCode = HttpStatus.UNAUTHORIZED;
    } else if (errorMessage.toLowerCase().includes('rate limit')) {
      errorCode = ErrorCodes.API_RATE_LIMIT_EXCEEDED;
      statusCode = HttpStatus.TOO_MANY_REQUESTS;
    } else if (errorMessage.toLowerCase().includes('invalid input') || 
               errorMessage.toLowerCase().includes('validation failed')) {
      errorCode = ErrorCodes.API_INVALID_INPUT;
      statusCode = HttpStatus.BAD_REQUEST;
    }
  }

  // Add journey-specific error codes if journey is identified but error code is generic
  if (journey && errorCode === ErrorCodes.SYS_INTERNAL_SERVER_ERROR) {
    switch (journey) {
      case JOURNEY_IDS.HEALTH:
        if (errorMessage.toLowerCase().includes('metric')) {
          errorCode = ErrorCodes.HEALTH_INVALID_METRIC;
        } else if (errorMessage.toLowerCase().includes('device') || 
                  errorMessage.toLowerCase().includes('connection')) {
          errorCode = ErrorCodes.HEALTH_DEVICE_CONNECTION_FAILED;
        }
        break;
      case JOURNEY_IDS.CARE:
        if (errorMessage.toLowerCase().includes('provider')) {
          errorCode = ErrorCodes.CARE_PROVIDER_UNAVAILABLE;
        } else if (errorMessage.toLowerCase().includes('appointment') || 
                  errorMessage.toLowerCase().includes('slot')) {
          errorCode = ErrorCodes.CARE_APPOINTMENT_SLOT_TAKEN;
        } else if (errorMessage.toLowerCase().includes('telemedicine')) {
          errorCode = ErrorCodes.CARE_TELEMEDICINE_CONNECTION_FAILED;
        }
        break;
      case JOURNEY_IDS.PLAN:
        if (errorMessage.toLowerCase().includes('claim')) {
          errorCode = ErrorCodes.PLAN_INVALID_CLAIM_DATA;
        } else if (errorMessage.toLowerCase().includes('coverage') || 
                  errorMessage.toLowerCase().includes('verification')) {
          errorCode = ErrorCodes.PLAN_COVERAGE_VERIFICATION_FAILED;
        }
        break;
    }
  }

  // Create standardized error response
  const errorResponse = {
    statusCode,
    errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(path && { path }),
    ...(journey && { journey }),
    ...(correlationId && { correlationId }),
    ...(details && { details })
  };

  // Log the transformed error with structured context
  logger.debug(
    `Transformed error response: ${JSON.stringify(errorResponse)}`,
    {
      ...logContext,
      transformedError: errorResponse
    }
  );
  
  return errorResponse;
}