/**
 * HTTP Response Interfaces
 * 
 * This file defines standardized HTTP response interfaces used across all auth-service endpoints.
 * These interfaces ensure consistent API responses throughout the auth service and provide
 * type safety for response handling.
 */

import { PaginationDto } from '@austa/interfaces/common/dto';

/**
 * Base interface for all HTTP responses
 */
export interface IBaseResponse {
  /**
   * Response status code
   */
  statusCode: number;
  
  /**
   * Response timestamp
   */
  timestamp: string;
  
  /**
   * Request ID for tracing
   */
  requestId?: string;
}

/**
 * Interface for successful HTTP responses
 */
export interface ISuccessResponse<T = any> extends IBaseResponse {
  /**
   * Response status
   */
  status: 'success';
  
  /**
   * Response data
   */
  data: T;
  
  /**
   * Optional message for the response
   */
  message?: string;
}

/**
 * Interface for error HTTP responses
 */
export interface IErrorResponse extends IBaseResponse {
  /**
   * Response status
   */
  status: 'error';
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code for client-side error handling
   */
  errorCode?: string;
  
  /**
   * Detailed error information (only in development)
   */
  details?: any;
  
  /**
   * Stack trace (only in development)
   */
  stack?: string;
}

/**
 * Interface for paginated HTTP responses
 */
export interface IPaginatedResponse<T = any> extends ISuccessResponse<T[]> {
  /**
   * Pagination metadata
   */
  pagination: {
    /**
     * Total number of items
     */
    total: number;
    
    /**
     * Current page number
     */
    page: number;
    
    /**
     * Number of items per page
     */
    limit: number;
    
    /**
     * Total number of pages
     */
    totalPages: number;
    
    /**
     * Has next page
     */
    hasNext: boolean;
    
    /**
     * Has previous page
     */
    hasPrevious: boolean;
  };
}

/**
 * Interface for cursor-based paginated HTTP responses
 */
export interface ICursorPaginatedResponse<T = any> extends ISuccessResponse<T[]> {
  /**
   * Cursor pagination metadata
   */
  pagination: {
    /**
     * Next cursor for pagination
     */
    nextCursor: string | null;
    
    /**
     * Previous cursor for pagination
     */
    prevCursor: string | null;
    
    /**
     * Has more items
     */
    hasMore: boolean;
    
    /**
     * Number of items returned
     */
    count: number;
  };
}

/**
 * Type for creating a paginated response from a PaginationDto
 * @param T The type of data in the response
 */
export type PaginatedResponseFromDto<T = any> = Omit<IPaginatedResponse<T>, 'pagination'> & {
  pagination: PaginationDto & {
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

/**
 * Interface for empty success responses (204 No Content)
 */
export interface INoContentResponse extends Omit<IBaseResponse, 'statusCode'> {
  /**
   * Response status code (always 204)
   */
  statusCode: 204;
  
  /**
   * Response status
   */
  status: 'success';
}

/**
 * Interface for created resource responses (201 Created)
 */
export interface ICreatedResponse<T = any> extends Omit<ISuccessResponse<T>, 'statusCode'> {
  /**
   * Response status code (always 201)
   */
  statusCode: 201;
  
  /**
   * Location header for the created resource
   */
  location?: string;
}

/**
 * Interface for accepted responses (202 Accepted)
 */
export interface IAcceptedResponse extends Omit<IBaseResponse, 'statusCode'> {
  /**
   * Response status code (always 202)
   */
  statusCode: 202;
  
  /**
   * Response status
   */
  status: 'success';
  
  /**
   * Message indicating the request has been accepted
   */
  message: string;
  
  /**
   * Optional tracking ID for the async operation
   */
  trackingId?: string;
}

/**
 * Interface for validation error responses
 */
export interface IValidationErrorResponse extends IErrorResponse {
  /**
   * Response status code (always 400)
   */
  statusCode: 400;
  
  /**
   * Error code for validation errors
   */
  errorCode: 'VALIDATION_ERROR';
  
  /**
   * Validation errors by field
   */
  errors: {
    /**
     * Field name as key, array of error messages as value
     */
    [field: string]: string[];
  };
}

/**
 * Interface for unauthorized error responses
 */
export interface IUnauthorizedResponse extends IErrorResponse {
  /**
   * Response status code (always 401)
   */
  statusCode: 401;
  
  /**
   * Error code for unauthorized errors
   */
  errorCode: 'UNAUTHORIZED';
}

/**
 * Interface for forbidden error responses
 */
export interface IForbiddenResponse extends IErrorResponse {
  /**
   * Response status code (always 403)
   */
  statusCode: 403;
  
  /**
   * Error code for forbidden errors
   */
  errorCode: 'FORBIDDEN';
  
  /**
   * Required permissions that the user doesn't have
   */
  requiredPermissions?: string[];
}

/**
 * Interface for not found error responses
 */
export interface INotFoundResponse extends IErrorResponse {
  /**
   * Response status code (always 404)
   */
  statusCode: 404;
  
  /**
   * Error code for not found errors
   */
  errorCode: 'NOT_FOUND';
  
  /**
   * Resource type that was not found
   */
  resourceType?: string;
  
  /**
   * Resource ID that was not found
   */
  resourceId?: string | number;
}

/**
 * Interface for conflict error responses
 */
export interface IConflictResponse extends IErrorResponse {
  /**
   * Response status code (always 409)
   */
  statusCode: 409;
  
  /**
   * Error code for conflict errors
   */
  errorCode: 'CONFLICT';
  
  /**
   * Conflicting field
   */
  field?: string;
  
  /**
   * Conflicting value
   */
  value?: any;
}

/**
 * Interface for too many requests error responses
 */
export interface ITooManyRequestsResponse extends IErrorResponse {
  /**
   * Response status code (always 429)
   */
  statusCode: 429;
  
  /**
   * Error code for rate limit errors
   */
  errorCode: 'RATE_LIMIT_EXCEEDED';
  
  /**
   * Retry after seconds
   */
  retryAfter: number;
  
  /**
   * Rate limit information
   */
  rateLimit?: {
    /**
     * Limit per time window
     */
    limit: number;
    
    /**
     * Remaining requests in current window
     */
    remaining: number;
    
    /**
     * Time window reset timestamp
     */
    reset: number;
  };
}

/**
 * Interface for internal server error responses
 */
export interface IInternalServerErrorResponse extends IErrorResponse {
  /**
   * Response status code (always 500)
   */
  statusCode: 500;
  
  /**
   * Error code for internal server errors
   */
  errorCode: 'INTERNAL_SERVER_ERROR';
}

/**
 * Interface for service unavailable error responses
 */
export interface IServiceUnavailableResponse extends IErrorResponse {
  /**
   * Response status code (always 503)
   */
  statusCode: 503;
  
  /**
   * Error code for service unavailable errors
   */
  errorCode: 'SERVICE_UNAVAILABLE';
  
  /**
   * Retry after seconds
   */
  retryAfter?: number;
}

/**
 * Type for all possible HTTP response types
 */
export type HttpResponse<T = any> =
  | ISuccessResponse<T>
  | IErrorResponse
  | IPaginatedResponse<T>
  | ICursorPaginatedResponse<T>
  | INoContentResponse
  | ICreatedResponse<T>
  | IAcceptedResponse
  | IValidationErrorResponse
  | IUnauthorizedResponse
  | IForbiddenResponse
  | INotFoundResponse
  | IConflictResponse
  | ITooManyRequestsResponse
  | IInternalServerErrorResponse
  | IServiceUnavailableResponse;