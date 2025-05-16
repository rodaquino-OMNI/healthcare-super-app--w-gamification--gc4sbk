/**
 * @file errors.ts
 * @description Test fixtures for HTTP error scenarios and error objects for testing error handling
 * in HTTP clients and utilities. These fixtures support testing retry mechanisms, backoff strategies,
 * and error classification throughout the HTTP pipeline.
 */

import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for HTTP error test cases
 */
export interface HttpErrorTestCase {
  /** Human-readable name of the error scenario */
  name: string;
  /** Description of the error scenario */
  description: string;
  /** Error object or factory function to create the error */
  error: Error | AxiosError | (() => Error | AxiosError);
  /** Expected error classification */
  classification: 'network' | 'timeout' | 'server' | 'client' | 'parse' | 'unknown';
  /** Whether this error should be retried */
  isRetryable: boolean;
  /** Recommended backoff strategy */
  backoffStrategy?: 'linear' | 'exponential' | 'fixed' | 'none';
  /** Maximum retry attempts recommended */
  maxRetries?: number;
}

/**
 * Helper function to create an Axios error with response
 */
const createAxiosErrorWithResponse = (
  status: number,
  statusText: string,
  data: any,
  config: Partial<AxiosRequestConfig> = {}
): AxiosError => {
  const response: AxiosResponse = {
    status,
    statusText,
    data,
    headers: {},
    config: {
      url: 'https://api.example.com/test',
      method: 'get',
      ...config
    } as AxiosRequestConfig,
  };

  const error = new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    response.config,
    null,
    response
  );

  return error;
};

/**
 * Helper function to create an Axios error without response (network error)
 */
const createAxiosNetworkError = (
  message: string,
  code: string,
  config: Partial<AxiosRequestConfig> = {}
): AxiosError => {
  const error = new AxiosError(
    message,
    code,
    {
      url: 'https://api.example.com/test',
      method: 'get',
      ...config
    } as AxiosRequestConfig
  );

  return error;
};

/**
 * Network-related error test cases
 */
export const networkErrors: Record<string, HttpErrorTestCase> = {
  connectionRefused: {
    name: 'Connection Refused',
    description: 'Server actively refused the connection',
    error: createAxiosNetworkError(
      'connect ECONNREFUSED 127.0.0.1:8080',
      'ECONNREFUSED',
    ),
    classification: 'network',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  connectionReset: {
    name: 'Connection Reset',
    description: 'Connection was reset by the server or network device',
    error: createAxiosNetworkError(
      'socket hang up',
      'ECONNRESET',
    ),
    classification: 'network',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  networkUnreachable: {
    name: 'Network Unreachable',
    description: 'Network is unreachable or DNS resolution failed',
    error: createAxiosNetworkError(
      'getaddrinfo ENOTFOUND api.example.com',
      'ENOTFOUND',
    ),
    classification: 'network',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 5
  },
  
  socketHangUp: {
    name: 'Socket Hang Up',
    description: 'Server closed the connection unexpectedly',
    error: createAxiosNetworkError(
      'socket hang up',
      'ECONNABORTED',
    ),
    classification: 'network',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  networkChanged: {
    name: 'Network Changed',
    description: 'Network interface changed during request',
    error: createAxiosNetworkError(
      'Network error',
      'ERR_NETWORK',
    ),
    classification: 'network',
    isRetryable: true,
    backoffStrategy: 'linear',
    maxRetries: 3
  },
  
  sslError: {
    name: 'SSL Certificate Error',
    description: 'SSL certificate validation failed',
    error: createAxiosNetworkError(
      'self signed certificate in certificate chain',
      'CERT_HAS_EXPIRED',
    ),
    classification: 'network',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  }
};

/**
 * Timeout-related error test cases
 */
export const timeoutErrors: Record<string, HttpErrorTestCase> = {
  requestTimeout: {
    name: 'Request Timeout',
    description: 'Request exceeded the configured timeout',
    error: createAxiosNetworkError(
      'timeout of 10000ms exceeded',
      'ETIMEDOUT',
      { timeout: 10000 }
    ),
    classification: 'timeout',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  slowResponse: {
    name: 'Slow Response',
    description: 'Server response was too slow and client aborted',
    error: createAxiosNetworkError(
      'timeout of 30000ms exceeded',
      'ECONNABORTED',
      { timeout: 30000 }
    ),
    classification: 'timeout',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 2
  },
  
  readTimeout: {
    name: 'Read Timeout',
    description: 'Timeout while reading response data',
    error: createAxiosNetworkError(
      'read ETIMEDOUT',
      'ETIMEDOUT',
    ),
    classification: 'timeout',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  deadlineExceeded: {
    name: 'Deadline Exceeded',
    description: 'Request exceeded the maximum allowed time',
    error: createAxiosNetworkError(
      'deadline exceeded',
      'DEADLINE_EXCEEDED',
      { timeout: 60000 }
    ),
    classification: 'timeout',
    isRetryable: false, // Business deadline, not retryable
    backoffStrategy: 'none',
    maxRetries: 0
  }
};

/**
 * Server error (5xx) test cases
 */
export const serverErrors: Record<string, HttpErrorTestCase> = {
  internalServerError: {
    name: 'Internal Server Error',
    description: 'Generic server error (500)',
    error: createAxiosErrorWithResponse(
      500,
      'Internal Server Error',
      { message: 'An unexpected error occurred' }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  serviceUnavailable: {
    name: 'Service Unavailable',
    description: 'Server temporarily unavailable (503)',
    error: createAxiosErrorWithResponse(
      503,
      'Service Unavailable',
      { message: 'Service is currently unavailable' }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 5
  },
  
  gatewayTimeout: {
    name: 'Gateway Timeout',
    description: 'Gateway or proxy timeout (504)',
    error: createAxiosErrorWithResponse(
      504,
      'Gateway Timeout',
      { message: 'Gateway timeout' }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  badGateway: {
    name: 'Bad Gateway',
    description: 'Invalid response from upstream server (502)',
    error: createAxiosErrorWithResponse(
      502,
      'Bad Gateway',
      { message: 'Invalid response from upstream server' }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  insufficientStorage: {
    name: 'Insufficient Storage',
    description: 'Server has insufficient storage (507)',
    error: createAxiosErrorWithResponse(
      507,
      'Insufficient Storage',
      { message: 'Insufficient storage to complete the request' }
    ),
    classification: 'server',
    isRetryable: false, // Storage issues unlikely to resolve quickly
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  networkAuthenticationRequired: {
    name: 'Network Authentication Required',
    description: 'Network authentication required (511)',
    error: createAxiosErrorWithResponse(
      511,
      'Network Authentication Required',
      { message: 'Network authentication required' }
    ),
    classification: 'server',
    isRetryable: false, // Authentication issues require user intervention
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  serverWithRetryAfter: {
    name: 'Server Error With Retry-After',
    description: 'Server error with Retry-After header',
    error: createAxiosErrorWithResponse(
      503,
      'Service Unavailable',
      { message: 'Service is currently unavailable' },
      { headers: { 'Retry-After': '30' } }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'fixed', // Use the Retry-After header value
    maxRetries: 3
  }
};

/**
 * Client error (4xx) test cases
 */
export const clientErrors: Record<string, HttpErrorTestCase> = {
  badRequest: {
    name: 'Bad Request',
    description: 'Invalid request syntax or parameters (400)',
    error: createAxiosErrorWithResponse(
      400,
      'Bad Request',
      { message: 'Invalid request parameters', errors: [{ field: 'email', message: 'Invalid email format' }] }
    ),
    classification: 'client',
    isRetryable: false, // Client errors generally not retryable
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  unauthorized: {
    name: 'Unauthorized',
    description: 'Authentication required (401)',
    error: createAxiosErrorWithResponse(
      401,
      'Unauthorized',
      { message: 'Authentication required' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  forbidden: {
    name: 'Forbidden',
    description: 'Client lacks permission (403)',
    error: createAxiosErrorWithResponse(
      403,
      'Forbidden',
      { message: 'You do not have permission to access this resource' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  notFound: {
    name: 'Not Found',
    description: 'Resource not found (404)',
    error: createAxiosErrorWithResponse(
      404,
      'Not Found',
      { message: 'The requested resource was not found' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  methodNotAllowed: {
    name: 'Method Not Allowed',
    description: 'HTTP method not allowed (405)',
    error: createAxiosErrorWithResponse(
      405,
      'Method Not Allowed',
      { message: 'Method not allowed' },
      { method: 'POST' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  conflict: {
    name: 'Conflict',
    description: 'Request conflicts with server state (409)',
    error: createAxiosErrorWithResponse(
      409,
      'Conflict',
      { message: 'Resource already exists', conflictingId: '12345' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  preconditionFailed: {
    name: 'Precondition Failed',
    description: 'Precondition in headers failed (412)',
    error: createAxiosErrorWithResponse(
      412,
      'Precondition Failed',
      { message: 'Resource has been modified since last request' },
      { headers: { 'If-Unmodified-Since': 'Wed, 21 Oct 2015 07:28:00 GMT' } }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  tooManyRequests: {
    name: 'Too Many Requests',
    description: 'Rate limit exceeded (429)',
    error: createAxiosErrorWithResponse(
      429,
      'Too Many Requests',
      { message: 'Rate limit exceeded' },
      { headers: { 'Retry-After': '60' } }
    ),
    classification: 'client',
    isRetryable: true, // Special case: retryable client error
    backoffStrategy: 'fixed', // Use the Retry-After header value
    maxRetries: 3
  },
  
  requestHeaderFieldsTooLarge: {
    name: 'Request Header Fields Too Large',
    description: 'Request header fields too large (431)',
    error: createAxiosErrorWithResponse(
      431,
      'Request Header Fields Too Large',
      { message: 'Request header fields too large' }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  }
};

/**
 * Parse error test cases (malformed responses)
 */
export const parseErrors: Record<string, HttpErrorTestCase> = {
  invalidJson: {
    name: 'Invalid JSON',
    description: 'Response contains invalid JSON',
    error: () => {
      const error = new SyntaxError('Unexpected token < in JSON at position 0');
      (error as any).response = {
        status: 200,
        statusText: 'OK',
        data: '<html><body>Error page instead of JSON</body></html>',
        headers: { 'content-type': 'application/json' },
        config: { url: 'https://api.example.com/test', method: 'get' }
      };
      return error;
    },
    classification: 'parse',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  unexpectedContentType: {
    name: 'Unexpected Content Type',
    description: 'Response has unexpected content type',
    error: createAxiosErrorWithResponse(
      200,
      'OK',
      'Plain text instead of JSON',
      { headers: { 'content-type': 'text/plain' } }
    ),
    classification: 'parse',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  incompleteResponse: {
    name: 'Incomplete Response',
    description: 'Response was truncated or incomplete',
    error: () => {
      const error = new Error('Unexpected end of JSON input');
      (error as any).response = {
        status: 200,
        statusText: 'OK',
        data: '{"data":{"user":',
        headers: { 'content-type': 'application/json' },
        config: { url: 'https://api.example.com/test', method: 'get' }
      };
      return error;
    },
    classification: 'parse',
    isRetryable: true, // Might be a transient issue
    backoffStrategy: 'linear',
    maxRetries: 2
  },
  
  malformedXml: {
    name: 'Malformed XML',
    description: 'Response contains malformed XML',
    error: () => {
      const error = new Error('Invalid XML: Unexpected close tag');
      (error as any).response = {
        status: 200,
        statusText: 'OK',
        data: '<root><item>Value</root>',
        headers: { 'content-type': 'application/xml' },
        config: { url: 'https://api.example.com/test', method: 'get' }
      };
      return error;
    },
    classification: 'parse',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  emptyResponse: {
    name: 'Empty Response',
    description: 'Response body is empty when content was expected',
    error: createAxiosErrorWithResponse(
      200,
      'OK',
      '',
      { headers: { 'content-type': 'application/json' } }
    ),
    classification: 'parse',
    isRetryable: true, // Might be a transient issue
    backoffStrategy: 'linear',
    maxRetries: 2
  }
};

/**
 * Miscellaneous error test cases
 */
export const miscErrors: Record<string, HttpErrorTestCase> = {
  canceledRequest: {
    name: 'Canceled Request',
    description: 'Request was canceled by the client',
    error: () => {
      const error = new AxiosError(
        'Request canceled',
        'ERR_CANCELED',
        { url: 'https://api.example.com/test', method: 'get' } as AxiosRequestConfig
      );
      return error;
    },
    classification: 'unknown',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  maxRedirectsExceeded: {
    name: 'Max Redirects Exceeded',
    description: 'Maximum number of redirects exceeded',
    error: createAxiosNetworkError(
      'Maximum number of redirects exceeded',
      'ERR_MAX_REDIRECTS',
      { maxRedirects: 5 }
    ),
    classification: 'unknown',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  unsupportedProtocol: {
    name: 'Unsupported Protocol',
    description: 'URL protocol is not supported',
    error: createAxiosNetworkError(
      'Unsupported protocol ftp:',
      'ERR_UNSUPPORTED_PROTOCOL',
      { url: 'ftp://example.com/file.txt' }
    ),
    classification: 'unknown',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  abortedRequest: {
    name: 'Aborted Request',
    description: 'Request was aborted by the server',
    error: createAxiosNetworkError(
      'Request aborted',
      'ECONNABORTED'
    ),
    classification: 'unknown',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  }
};

/**
 * Journey-specific error test cases
 */
export const journeyErrors: Record<string, HttpErrorTestCase> = {
  // Health Journey errors
  healthMetricsUnavailable: {
    name: 'Health Metrics Unavailable',
    description: 'Health metrics service is temporarily unavailable',
    error: createAxiosErrorWithResponse(
      503,
      'Service Unavailable',
      { 
        message: 'Health metrics service is temporarily unavailable',
        journeyType: 'health',
        errorCode: 'HEALTH_METRICS_UNAVAILABLE'
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  deviceSyncFailed: {
    name: 'Device Sync Failed',
    description: 'Failed to synchronize with health device',
    error: createAxiosErrorWithResponse(
      500,
      'Internal Server Error',
      { 
        message: 'Failed to synchronize with health device',
        journeyType: 'health',
        errorCode: 'DEVICE_SYNC_FAILED',
        deviceId: 'fitbit-12345'
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 5
  },
  
  // Care Journey errors
  appointmentUnavailable: {
    name: 'Appointment Unavailable',
    description: 'Requested appointment slot is no longer available',
    error: createAxiosErrorWithResponse(
      409,
      'Conflict',
      { 
        message: 'Appointment slot is no longer available',
        journeyType: 'care',
        errorCode: 'APPOINTMENT_UNAVAILABLE',
        appointmentId: 'appt-12345'
      }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  providerUnavailable: {
    name: 'Provider Unavailable',
    description: 'Healthcare provider is temporarily unavailable',
    error: createAxiosErrorWithResponse(
      503,
      'Service Unavailable',
      { 
        message: 'Healthcare provider is temporarily unavailable',
        journeyType: 'care',
        errorCode: 'PROVIDER_UNAVAILABLE',
        providerId: 'provider-12345'
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  // Plan Journey errors
  claimValidationFailed: {
    name: 'Claim Validation Failed',
    description: 'Insurance claim validation failed',
    error: createAxiosErrorWithResponse(
      400,
      'Bad Request',
      { 
        message: 'Insurance claim validation failed',
        journeyType: 'plan',
        errorCode: 'CLAIM_VALIDATION_FAILED',
        claimId: 'claim-12345',
        validationErrors: [
          { field: 'serviceDate', message: 'Service date cannot be in the future' },
          { field: 'amount', message: 'Amount exceeds maximum allowed' }
        ]
      }
    ),
    classification: 'client',
    isRetryable: false,
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  insuranceSystemDown: {
    name: 'Insurance System Down',
    description: 'External insurance system is currently down',
    error: createAxiosErrorWithResponse(
      502,
      'Bad Gateway',
      { 
        message: 'External insurance system is currently down',
        journeyType: 'plan',
        errorCode: 'INSURANCE_SYSTEM_DOWN',
        insuranceProvider: 'ACME Insurance'
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 5
  }
};

/**
 * Circuit breaker test cases
 */
export const circuitBreakerErrors: Record<string, HttpErrorTestCase> = {
  consecutiveFailures: {
    name: 'Consecutive Failures',
    description: 'Multiple consecutive failures from the same endpoint',
    error: createAxiosErrorWithResponse(
      500,
      'Internal Server Error',
      { 
        message: 'Internal server error',
        consecutiveFailures: 5
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 3
  },
  
  highErrorRate: {
    name: 'High Error Rate',
    description: 'High error rate from service (>50%)',
    error: createAxiosErrorWithResponse(
      500,
      'Internal Server Error',
      { 
        message: 'Internal server error',
        errorRate: 0.75
      }
    ),
    classification: 'server',
    isRetryable: true,
    backoffStrategy: 'exponential',
    maxRetries: 2
  },
  
  degradedService: {
    name: 'Degraded Service',
    description: 'Service is responding but in a degraded state',
    error: createAxiosErrorWithResponse(
      200,
      'OK',
      { 
        status: 'degraded',
        message: 'Service is operating in a degraded state',
        availableFeatures: ['read'],
        unavailableFeatures: ['write', 'update', 'delete']
      }
    ),
    classification: 'server',
    isRetryable: false, // Don't retry degraded service responses
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  circuitOpen: {
    name: 'Circuit Open',
    description: 'Circuit breaker is open due to previous failures',
    error: () => {
      const error = new Error('Circuit breaker is open');
      error.name = 'CircuitBreakerOpenError';
      return error;
    },
    classification: 'unknown',
    isRetryable: false, // Circuit is open, don't retry
    backoffStrategy: 'none',
    maxRetries: 0
  },
  
  circuitHalfOpen: {
    name: 'Circuit Half-Open',
    description: 'Circuit breaker is half-open and testing the service',
    error: () => {
      const error = new Error('Circuit breaker is half-open');
      error.name = 'CircuitBreakerHalfOpenError';
      return error;
    },
    classification: 'unknown',
    isRetryable: false, // Let the circuit breaker handle this
    backoffStrategy: 'none',
    maxRetries: 0
  }
};

/**
 * Factory functions for generating custom HTTP error test cases
 */
export const errorFactories = {
  /**
   * Creates a custom server error test case
   * 
   * @param status - HTTP status code
   * @param message - Error message
   * @param retryable - Whether the error should be retried
   * @param maxRetries - Maximum retry attempts
   * @returns HttpErrorTestCase
   */
  createServerError: (
    status: number,
    message: string,
    retryable: boolean = true,
    maxRetries: number = 3
  ): HttpErrorTestCase => ({
    name: `Server Error ${status}`,
    description: `Custom server error with status ${status}`,
    error: createAxiosErrorWithResponse(
      status,
      status === 500 ? 'Internal Server Error' : 'Server Error',
      { message }
    ),
    classification: 'server',
    isRetryable: retryable,
    backoffStrategy: retryable ? 'exponential' : 'none',
    maxRetries: retryable ? maxRetries : 0
  }),
  
  /**
   * Creates a custom client error test case
   * 
   * @param status - HTTP status code
   * @param message - Error message
   * @param retryable - Whether the error should be retried
   * @returns HttpErrorTestCase
   */
  createClientError: (
    status: number,
    message: string,
    retryable: boolean = false
  ): HttpErrorTestCase => ({
    name: `Client Error ${status}`,
    description: `Custom client error with status ${status}`,
    error: createAxiosErrorWithResponse(
      status,
      status === 400 ? 'Bad Request' : 'Client Error',
      { message }
    ),
    classification: 'client',
    isRetryable: retryable,
    backoffStrategy: retryable ? 'linear' : 'none',
    maxRetries: retryable ? 1 : 0
  }),
  
  /**
   * Creates a custom network error test case
   * 
   * @param message - Error message
   * @param code - Error code
   * @param retryable - Whether the error should be retried
   * @param maxRetries - Maximum retry attempts
   * @returns HttpErrorTestCase
   */
  createNetworkError: (
    message: string,
    code: string,
    retryable: boolean = true,
    maxRetries: number = 3
  ): HttpErrorTestCase => ({
    name: `Network Error ${code}`,
    description: `Custom network error with code ${code}`,
    error: createAxiosNetworkError(message, code),
    classification: 'network',
    isRetryable: retryable,
    backoffStrategy: retryable ? 'exponential' : 'none',
    maxRetries: retryable ? maxRetries : 0
  }),
  
  /**
   * Creates a custom timeout error test case
   * 
   * @param message - Error message
   * @param timeout - Timeout in milliseconds
   * @param retryable - Whether the error should be retried
   * @param maxRetries - Maximum retry attempts
   * @returns HttpErrorTestCase
   */
  createTimeoutError: (
    message: string,
    timeout: number = 30000,
    retryable: boolean = true,
    maxRetries: number = 3
  ): HttpErrorTestCase => ({
    name: `Timeout Error ${timeout}ms`,
    description: `Custom timeout error after ${timeout}ms`,
    error: createAxiosNetworkError(
      message,
      'ETIMEDOUT',
      { timeout }
    ),
    classification: 'timeout',
    isRetryable: retryable,
    backoffStrategy: retryable ? 'exponential' : 'none',
    maxRetries: retryable ? maxRetries : 0
  }),
  
  /**
   * Creates a custom journey-specific error test case
   * 
   * @param journeyType - Type of journey ('health', 'care', or 'plan')
   * @param errorCode - Journey-specific error code
   * @param message - Error message
   * @param status - HTTP status code
   * @param retryable - Whether the error should be retried
   * @returns HttpErrorTestCase
   */
  createJourneyError: (
    journeyType: 'health' | 'care' | 'plan',
    errorCode: string,
    message: string,
    status: number = 500,
    retryable: boolean = true
  ): HttpErrorTestCase => ({
    name: `${journeyType.charAt(0).toUpperCase() + journeyType.slice(1)} Journey Error`,
    description: `Custom ${journeyType} journey error with code ${errorCode}`,
    error: createAxiosErrorWithResponse(
      status,
      status >= 500 ? 'Server Error' : 'Client Error',
      { 
        message,
        journeyType,
        errorCode
      }
    ),
    classification: status >= 500 ? 'server' : 'client',
    isRetryable: retryable,
    backoffStrategy: retryable ? 'exponential' : 'none',
    maxRetries: retryable ? 3 : 0
  })
};

/**
 * Groups all error test cases for easy access
 */
export const allErrors = {
  network: networkErrors,
  timeout: timeoutErrors,
  server: serverErrors,
  client: clientErrors,
  parse: parseErrors,
  misc: miscErrors,
  journey: journeyErrors,
  circuitBreaker: circuitBreakerErrors,
  factories: errorFactories
};