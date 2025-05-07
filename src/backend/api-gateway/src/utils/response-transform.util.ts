import { HttpStatus, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ERROR_CODES } from '@austa/errors';
import {
  handleApiGatewayError,
  formatErrorForResponse,
  ErrorResponse,
} from './error-handling.util';

const logger = new Logger('ResponseTransformUtil');

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
 * @param request - Optional request object for context enrichment
 * @returns A standardized error response object
 */
export function transformErrorResponse(error: any, request?: Request): ErrorResponse {
  logger.debug(`Transforming error response using enhanced error handling`);
  
  // Use the new error handling utilities to process the error
  return handleApiGatewayError(error, request);
}

/**
 * Legacy error transformation function for backward compatibility
 * 
 * @deprecated Use transformErrorResponse with request parameter instead
 * @param error - The error to transform
 * @returns A standardized error response object
 */
export function legacyTransformErrorResponse(error: any): { 
  statusCode: number; 
  errorCode: string; 
  message: string;
  timestamp: string;
  path?: string;
  journey?: string;
} {
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';
  let errorCode = ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR;
  let path: string | undefined;
  let journey: string | undefined;

  logger.warn(`Using legacy error transformation. Consider upgrading to the new error handling utilities.`);
  logger.error(`Transforming error response: ${JSON.stringify(error)}`, error.stack);

  // Extract status code and message from error response if available
  if (error.response) {
    // Handle Axios-like error objects
    statusCode = error.response.status || statusCode;
    errorMessage = error.response.data?.message || error.message || errorMessage;
    errorCode = error.response.data?.errorCode || errorCode;
    path = error.response.data?.path || error.config?.url;
    
    // Extract journey from path if available
    if (path) {
      if (path.includes('/health/')) {
        journey = 'health';
      } else if (path.includes('/care/')) {
        journey = 'care';
      } else if (path.includes('/plan/')) {
        journey = 'plan';
      }
    }
  } else if (error.status) {
    // Handle NestJS HttpException or similar error objects
    statusCode = error.status;
    errorMessage = error.message || errorMessage;
    errorCode = error.errorCode || errorCode;
    path = error.path;
    journey = error.journey;
  } else if (error instanceof Error) {
    // Handle standard Error objects
    errorMessage = error.message || errorMessage;
  }

  // Map specific error messages to appropriate error codes if not already set
  if (errorCode === ERROR_CODES.SYSTEM.INTERNAL_SERVER_ERROR) {
    if (errorMessage.toLowerCase().includes('unauthorized') || 
        errorMessage.toLowerCase().includes('unauthenticated')) {
      errorCode = ERROR_CODES.AUTH.UNAUTHORIZED;
      statusCode = HttpStatus.UNAUTHORIZED;
    } else if (errorMessage.toLowerCase().includes('forbidden')) {
      errorCode = ERROR_CODES.AUTH.FORBIDDEN;
      statusCode = HttpStatus.FORBIDDEN;
    } else if (errorMessage.toLowerCase().includes('token expired')) {
      errorCode = ERROR_CODES.AUTH.TOKEN_EXPIRED;
      statusCode = HttpStatus.UNAUTHORIZED;
    } else if (errorMessage.toLowerCase().includes('rate limit')) {
      errorCode = ERROR_CODES.API.RATE_LIMIT_EXCEEDED;
      statusCode = HttpStatus.TOO_MANY_REQUESTS;
    } else if (errorMessage.toLowerCase().includes('invalid input') || 
               errorMessage.toLowerCase().includes('validation failed')) {
      errorCode = ERROR_CODES.API.INVALID_INPUT;
      statusCode = HttpStatus.BAD_REQUEST;
    }
  }

  // Create standardized error response
  const errorResponse = {
    statusCode,
    errorCode,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(path && { path }),
    ...(journey && { journey })
  };

  logger.debug(`Transformed error response: ${JSON.stringify(errorResponse)}`);
  
  return errorResponse;
}