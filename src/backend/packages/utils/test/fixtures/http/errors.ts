/**
 * HTTP Error Fixtures for Testing
 * 
 * This file provides mock HTTP error scenarios and error objects for testing error handling
 * in HTTP clients and utilities. It includes network errors, timeout errors, server errors
 * with different status codes, and malformed response scenarios to ensure robust error
 * handling throughout the HTTP pipeline.
 */

import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * HTTP Status Codes Enum
 */
export enum HttpStatusCode {
  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418,
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_ENTITY = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510,
  NETWORK_AUTHENTICATION_REQUIRED = 511
}

/**
 * Error Category Enum
 */
export enum ErrorCategory {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  CLIENT = 'client',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  MALFORMED_RESPONSE = 'malformed_response',
  CORS = 'cors',
  UNKNOWN = 'unknown'
}

/**
 * HTTP Error Response Interface
 */
export interface HttpErrorResponse {
  status: number;
  statusText: string;
  data?: any;
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
}

/**
 * Network Error Interface
 */
export interface NetworkErrorData {
  code: string;
  message: string;
  errno?: string;
  syscall?: string;
  hostname?: string;
  port?: number;
  stack?: string;
}

/**
 * Validation Error Interface
 */
export interface ValidationErrorData {
  message: string;
  errors: Record<string, string[]>;
  code?: string;
  path?: string;
  value?: any;
}

/**
 * Rate Limit Error Interface
 */
export interface RateLimitErrorData {
  message: string;
  retryAfter: number; // seconds
  limit: number;
  remaining: number;
  reset: number; // timestamp
}

/**
 * Factory function to create a mock Axios error
 */
export function createAxiosError<T = any, D = any>(
  message: string,
  code: string,
  config: AxiosRequestConfig,
  request?: any,
  response?: AxiosResponse<T, D>
): AxiosError<T, D> {
  const error = new AxiosError<T, D>(
    message,
    code,
    config,
    request,
    response
  );
  
  return error;
}

/**
 * Factory function to create a mock HTTP error response
 */
export function createHttpErrorResponse(
  status: number,
  statusText: string,
  data?: any,
  headers?: Record<string, string>,
  config?: AxiosRequestConfig
): HttpErrorResponse {
  return {
    status,
    statusText,
    data,
    headers,
    config
  };
}

/**
 * Factory function to create a network error
 */
export function createNetworkError(
  code: string,
  message: string,
  details?: Partial<NetworkErrorData>
): AxiosError {
  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const error = createAxiosError(
    message,
    code,
    config,
    { path: '/resource' },
    undefined
  );

  // Add network-specific properties
  if (details) {
    Object.assign(error, details);
  }

  return error;
}

/**
 * Factory function to create a timeout error
 */
export function createTimeoutError(
  timeoutMs: number = 30000,
  url: string = 'https://api.example.com/resource'
): AxiosError {
  const config: AxiosRequestConfig = {
    url,
    method: 'GET',
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' }
  };

  return createAxiosError(
    `timeout of ${timeoutMs}ms exceeded`,
    'ECONNABORTED',
    config,
    { path: new URL(url).pathname },
    undefined
  );
}

/**
 * Factory function to create a server error
 */
export function createServerError(
  status: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
  message: string = 'Internal Server Error',
  data?: any
): AxiosError {
  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const response: AxiosResponse = {
    data: data || { message, error: true },
    status,
    statusText: message,
    headers: {
      'content-type': 'application/json',
      'x-request-id': '12345678-1234-1234-1234-123456789012'
    },
    config,
    request: {}
  };

  return createAxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    config,
    { path: '/resource' },
    response
  );
}

/**
 * Factory function to create a client error
 */
export function createClientError(
  status: number = HttpStatusCode.BAD_REQUEST,
  message: string = 'Bad Request',
  data?: any
): AxiosError {
  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const response: AxiosResponse = {
    data: data || { message, error: true },
    status,
    statusText: message,
    headers: {
      'content-type': 'application/json',
      'x-request-id': '12345678-1234-1234-1234-123456789012'
    },
    config,
    request: {}
  };

  return createAxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    config,
    { path: '/resource' },
    response
  );
}

/**
 * Factory function to create a validation error
 */
export function createValidationError(
  fields: Record<string, string[]>,
  message: string = 'Validation failed'
): AxiosError<ValidationErrorData> {
  const data: ValidationErrorData = {
    message,
    errors: fields
  };

  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { /* invalid data that caused validation error */ }
  };

  const response: AxiosResponse<ValidationErrorData> = {
    data,
    status: HttpStatusCode.UNPROCESSABLE_ENTITY,
    statusText: 'Unprocessable Entity',
    headers: {
      'content-type': 'application/json',
      'x-request-id': '12345678-1234-1234-1234-123456789012'
    },
    config,
    request: {}
  };

  return createAxiosError<ValidationErrorData>(
    `Request failed with status code ${HttpStatusCode.UNPROCESSABLE_ENTITY}`,
    'ERR_BAD_REQUEST',
    config,
    { path: '/resource' },
    response
  );
}

/**
 * Factory function to create a rate limit error
 */
export function createRateLimitError(
  retryAfter: number = 60,
  limit: number = 100,
  remaining: number = 0
): AxiosError<RateLimitErrorData> {
  const resetTime = Math.floor(Date.now() / 1000) + retryAfter;
  
  const data: RateLimitErrorData = {
    message: 'Rate limit exceeded',
    retryAfter,
    limit,
    remaining,
    reset: resetTime
  };

  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const response: AxiosResponse<RateLimitErrorData> = {
    data,
    status: HttpStatusCode.TOO_MANY_REQUESTS,
    statusText: 'Too Many Requests',
    headers: {
      'content-type': 'application/json',
      'x-ratelimit-limit': String(limit),
      'x-ratelimit-remaining': String(remaining),
      'x-ratelimit-reset': String(resetTime),
      'retry-after': String(retryAfter)
    },
    config,
    request: {}
  };

  return createAxiosError<RateLimitErrorData>(
    `Request failed with status code ${HttpStatusCode.TOO_MANY_REQUESTS}`,
    'ERR_BAD_REQUEST',
    config,
    { path: '/resource' },
    response
  );
}

/**
 * Factory function to create a malformed response error
 */
export function createMalformedResponseError(
  invalidJson: string = '{"data":"incomplete',
  contentType: string = 'application/json'
): AxiosError {
  const config: AxiosRequestConfig = {
    url: 'https://api.example.com/resource',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const response: AxiosResponse = {
    data: invalidJson,
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': contentType,
      'x-request-id': '12345678-1234-1234-1234-123456789012'
    },
    config,
    request: {}
  };

  return createAxiosError(
    'Unexpected end of JSON input',
    'ERR_BAD_RESPONSE',
    config,
    { path: '/resource' },
    response
  );
}

/**
 * Factory function to create a CORS error
 */
export function createCorsError(
  origin: string = 'https://app.example.com',
  target: string = 'https://api.example.com/resource'
): AxiosError {
  const config: AxiosRequestConfig = {
    url: target,
    method: 'GET',
    headers: { 
      'Content-Type': 'application/json',
      'Origin': origin
    }
  };

  return createAxiosError(
    'Network Error',
    'ERR_NETWORK',
    config,
    { path: new URL(target).pathname },
    undefined
  );
}

/**
 * Common error scenarios for testing
 */
export const ErrorScenarios = {
  // Network errors
  NETWORK_CONNECTION_REFUSED: createNetworkError(
    'ECONNREFUSED', 
    'Connection refused',
    { errno: 'ECONNREFUSED', syscall: 'connect', hostname: 'api.example.com', port: 443 }
  ),
  
  NETWORK_CONNECTION_RESET: createNetworkError(
    'ECONNRESET', 
    'Connection reset by peer',
    { errno: 'ECONNRESET', syscall: 'read' }
  ),
  
  NETWORK_DNS_NOT_FOUND: createNetworkError(
    'ENOTFOUND', 
    'getaddrinfo ENOTFOUND api.example.com',
    { errno: 'ENOTFOUND', syscall: 'getaddrinfo', hostname: 'api.example.com' }
  ),
  
  NETWORK_INTERNET_DISCONNECTED: createNetworkError(
    'ERR_INTERNET_DISCONNECTED', 
    'Internet connection lost'
  ),
  
  // Timeout errors
  TIMEOUT_REQUEST: createTimeoutError(30000),
  TIMEOUT_LONG_RUNNING: createTimeoutError(120000, 'https://api.example.com/long-running-process'),
  
  // Server errors
  SERVER_INTERNAL_ERROR: createServerError(),
  SERVER_BAD_GATEWAY: createServerError(HttpStatusCode.BAD_GATEWAY, 'Bad Gateway'),
  SERVER_SERVICE_UNAVAILABLE: createServerError(
    HttpStatusCode.SERVICE_UNAVAILABLE, 
    'Service Unavailable',
    { message: 'Service temporarily unavailable due to maintenance', retryAfter: 3600 }
  ),
  SERVER_GATEWAY_TIMEOUT: createServerError(HttpStatusCode.GATEWAY_TIMEOUT, 'Gateway Timeout'),
  
  // Client errors
  CLIENT_BAD_REQUEST: createClientError(),
  CLIENT_UNAUTHORIZED: createClientError(HttpStatusCode.UNAUTHORIZED, 'Unauthorized'),
  CLIENT_FORBIDDEN: createClientError(HttpStatusCode.FORBIDDEN, 'Forbidden'),
  CLIENT_NOT_FOUND: createClientError(HttpStatusCode.NOT_FOUND, 'Not Found'),
  CLIENT_METHOD_NOT_ALLOWED: createClientError(HttpStatusCode.METHOD_NOT_ALLOWED, 'Method Not Allowed'),
  
  // Validation errors
  VALIDATION_REQUIRED_FIELDS: createValidationError({
    'email': ['Email is required'],
    'password': ['Password is required', 'Password must be at least 8 characters']
  }),
  
  VALIDATION_INVALID_FORMAT: createValidationError({
    'email': ['Invalid email format'],
    'phone': ['Invalid phone number format']
  }),
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: createRateLimitError(),
  RATE_LIMIT_LONG_WAIT: createRateLimitError(3600, 1000, 0), // 1 hour wait
  
  // Malformed response errors
  MALFORMED_JSON: createMalformedResponseError(),
  MALFORMED_CONTENT_TYPE: createMalformedResponseError(
    '{"data":"complete but wrong content type"}', 
    'text/plain'
  ),
  
  // CORS errors
  CORS_ORIGIN_MISMATCH: createCorsError()
};

/**
 * Utility function to check if an error is a network error
 */
export function isNetworkError(error: AxiosError): boolean {
  return !error.response && !!error.request;
}

/**
 * Utility function to check if an error is a timeout error
 */
export function isTimeoutError(error: AxiosError): boolean {
  return error.code === 'ECONNABORTED' && error.message.includes('timeout');
}

/**
 * Utility function to check if an error is a server error (5xx)
 */
export function isServerError(error: AxiosError): boolean {
  return !!error.response && error.response.status >= 500 && error.response.status < 600;
}

/**
 * Utility function to check if an error is a client error (4xx)
 */
export function isClientError(error: AxiosError): boolean {
  return !!error.response && error.response.status >= 400 && error.response.status < 500;
}

/**
 * Utility function to check if an error is a validation error
 */
export function isValidationError(error: AxiosError): boolean {
  return (
    !!error.response &&
    error.response.status === HttpStatusCode.UNPROCESSABLE_ENTITY &&
    !!error.response.data &&
    typeof error.response.data === 'object' &&
    'errors' in error.response.data
  );
}

/**
 * Utility function to check if an error is a rate limit error
 */
export function isRateLimitError(error: AxiosError): boolean {
  return (
    !!error.response &&
    error.response.status === HttpStatusCode.TOO_MANY_REQUESTS &&
    !!error.response.headers &&
    ('retry-after' in error.response.headers || 'x-ratelimit-reset' in error.response.headers)
  );
}

/**
 * Utility function to get retry delay from rate limit error
 */
export function getRetryDelay(error: AxiosError): number | null {
  if (!isRateLimitError(error) || !error.response) {
    return null;
  }
  
  const { headers } = error.response;
  
  if ('retry-after' in headers) {
    const retryAfter = headers['retry-after'];
    if (typeof retryAfter === 'string') {
      // Could be seconds or a date
      if (/^\d+$/.test(retryAfter)) {
        return parseInt(retryAfter, 10) * 1000; // Convert to ms
      } else {
        const date = new Date(retryAfter);
        return date.getTime() - Date.now();
      }
    }
  }
  
  if ('x-ratelimit-reset' in headers) {
    const resetTime = headers['x-ratelimit-reset'];
    if (typeof resetTime === 'string') {
      const resetTimestamp = parseInt(resetTime, 10) * 1000; // Convert to ms
      return resetTimestamp - Date.now();
    }
  }
  
  return null;
}

/**
 * Utility function to categorize an error
 */
export function categorizeError(error: AxiosError): ErrorCategory {
  if (isNetworkError(error)) {
    return ErrorCategory.NETWORK;
  }
  
  if (isTimeoutError(error)) {
    return ErrorCategory.TIMEOUT;
  }
  
  if (isServerError(error)) {
    return ErrorCategory.SERVER;
  }
  
  if (isRateLimitError(error)) {
    return ErrorCategory.RATE_LIMIT;
  }
  
  if (isValidationError(error)) {
    return ErrorCategory.VALIDATION;
  }
  
  if (isClientError(error)) {
    if (error.response?.status === HttpStatusCode.UNAUTHORIZED) {
      return ErrorCategory.AUTHENTICATION;
    }
    
    if (error.response?.status === HttpStatusCode.FORBIDDEN) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    return ErrorCategory.CLIENT;
  }
  
  // Check for malformed response
  if (error.response && 
      error.response.status >= 200 && 
      error.response.status < 300 && 
      error.message.includes('JSON')) {
    return ErrorCategory.MALFORMED_RESPONSE;
  }
  
  // CORS errors typically manifest as network errors without response
  if (!error.response && error.message === 'Network Error' && 
      error.config?.headers && 'Origin' in error.config.headers) {
    return ErrorCategory.CORS;
  }
  
  return ErrorCategory.UNKNOWN;
}