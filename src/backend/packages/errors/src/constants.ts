/**
 * @file Centralizes all error-related constants, including error codes, error messages,
 * HTTP status code mappings, and retry configuration parameters.
 */

// Re-export journey-specific error codes
import { HealthErrorCodes, HealthRetryOptions } from './journey/health/constants';

/**
 * Consolidated error codes from all journeys.
 */
export const ErrorCodes = {
  // Health journey error codes
  ...HealthErrorCodes,
  
  // Common error codes
  VALIDATION_ERROR: 'COMMON_001',
  INTERNAL_SERVER_ERROR: 'COMMON_002',
  UNAUTHORIZED: 'COMMON_003',
  FORBIDDEN: 'COMMON_004',
  NOT_FOUND: 'COMMON_005',
  CONFLICT: 'COMMON_006',
  SERVICE_UNAVAILABLE: 'COMMON_007',
  TIMEOUT: 'COMMON_008'
};

/**
 * Consolidated retry options from all journeys.
 */
export const RetryOptions = {
  // Health journey retry options
  ...HealthRetryOptions,
  
  // Common retry options
  DEFAULT: {
    MAX_RETRIES: 3,
    BACKOFF_FACTOR: 2,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
  },
  DATABASE: {
    MAX_RETRIES: 3,
    BACKOFF_FACTOR: 1.5,
    INITIAL_DELAY: 500, // 0.5 seconds
    MAX_DELAY: 5000, // 5 seconds
  },
  API_CALL: {
    MAX_RETRIES: 2,
    BACKOFF_FACTOR: 2,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 8000, // 8 seconds
  }
};

/**
 * Maps error codes to HTTP status codes.
 */
export const HTTP_STATUS_MAP: Record<string, number> = {
  // Health journey error codes
  [ErrorCodes.HEALTH_CONNECTION_FAILED]: 503, // Service Unavailable
  [ErrorCodes.HEALTH_CONNECTION_TIMEOUT]: 504, // Gateway Timeout
  [ErrorCodes.HEALTH_SERVICE_UNAVAILABLE]: 503, // Service Unavailable
  [ErrorCodes.HEALTH_METRICS_RETRIEVAL_FAILED]: 500, // Internal Server Error
  [ErrorCodes.HEALTH_METRICS_VALIDATION_FAILED]: 400, // Bad Request
  [ErrorCodes.HEALTH_METRICS_PROCESSING_FAILED]: 500, // Internal Server Error
  [ErrorCodes.HEALTH_DEVICE_NOT_FOUND]: 404, // Not Found
  [ErrorCodes.HEALTH_DEVICE_UNSUPPORTED]: 400, // Bad Request
  [ErrorCodes.HEALTH_DISCONNECTION_FAILED]: 500, // Internal Server Error
  [ErrorCodes.HEALTH_GOAL_CREATION_FAILED]: 500, // Internal Server Error
  [ErrorCodes.HEALTH_GOAL_UPDATE_FAILED]: 500, // Internal Server Error
  [ErrorCodes.HEALTH_GOAL_NOT_FOUND]: 404, // Not Found
  [ErrorCodes.HEALTH_VALIDATION_ERROR]: 400, // Bad Request
  [ErrorCodes.HEALTH_INTERNAL_ERROR]: 500, // Internal Server Error
  
  // Common error codes
  [ErrorCodes.VALIDATION_ERROR]: 400, // Bad Request
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 500, // Internal Server Error
  [ErrorCodes.UNAUTHORIZED]: 401, // Unauthorized
  [ErrorCodes.FORBIDDEN]: 403, // Forbidden
  [ErrorCodes.NOT_FOUND]: 404, // Not Found
  [ErrorCodes.CONFLICT]: 409, // Conflict
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503, // Service Unavailable
  [ErrorCodes.TIMEOUT]: 504 // Gateway Timeout
};

/**
 * Default error messages for common error codes.
 */
export const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  // Common error codes
  [ErrorCodes.VALIDATION_ERROR]: 'Validation error occurred',
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error occurred',
  [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
  [ErrorCodes.FORBIDDEN]: 'Access denied',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource conflict',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCodes.TIMEOUT]: 'Request timed out'
};