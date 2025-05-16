import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { BaseError } from '@austa/errors/base';
import { ErrorType } from '@austa/errors/types';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';

/**
 * HTTP client error types for categorizing different kinds of failures
 */
export enum HttpClientErrorType {
  /** Network-related errors (connection refused, timeout, etc.) */
  NETWORK = 'NETWORK',
  /** Client errors (4xx status codes) */
  CLIENT = 'CLIENT',
  /** Server errors (5xx status codes) */
  SERVER = 'SERVER',
  /** Request cancellation */
  CANCELLED = 'CANCELLED',
  /** Unknown or uncategorized errors */
  UNKNOWN = 'UNKNOWN'
}

/**
 * HTTP client error that extends BaseError with additional HTTP-specific context
 */
export class HttpClientError extends BaseError {
  /** The original Axios error that caused this error */
  public readonly originalError: AxiosError;
  /** The HTTP status code if available */
  public readonly statusCode?: number;
  /** The HTTP client error type category */
  public readonly httpErrorType: HttpClientErrorType;
  /** The URL that was being accessed when the error occurred */
  public readonly url: string;
  /** The HTTP method that was being used */
  public readonly method: string;

  /**
   * Creates a new HttpClientError
   * 
   * @param message - Error message
   * @param originalError - The original Axios error
   */
  constructor(message: string, originalError: AxiosError) {
    const statusCode = originalError.response?.status;
    const url = originalError.config?.url || 'unknown';
    const method = originalError.config?.method?.toUpperCase() || 'UNKNOWN';
    const httpErrorType = HttpClientError.categorizeError(originalError);
    
    super(message, {
      cause: originalError,
      errorType: HttpClientError.mapToBaseErrorType(httpErrorType),
      metadata: {
        statusCode,
        url,
        method,
        httpErrorType,
        code: originalError.code,
        isAxiosError: originalError.isAxiosError
      }
    });

    this.originalError = originalError;
    this.statusCode = statusCode;
    this.httpErrorType = httpErrorType;
    this.url = url;
    this.method = method;
  }

  /**
   * Categorizes an Axios error into an HttpClientErrorType
   * 
   * @param error - The Axios error to categorize
   * @returns The appropriate HttpClientErrorType
   */
  private static categorizeError(error: AxiosError): HttpClientErrorType {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return HttpClientErrorType.NETWORK;
    }

    if (error.code === 'ERR_CANCELED') {
      return HttpClientErrorType.CANCELLED;
    }

    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) {
        return HttpClientErrorType.CLIENT;
      }
      if (status >= 500) {
        return HttpClientErrorType.SERVER;
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || 
        error.code === 'EAI_AGAIN' || error.code === 'ECONNRESET') {
      return HttpClientErrorType.NETWORK;
    }

    return HttpClientErrorType.UNKNOWN;
  }

  /**
   * Maps an HttpClientErrorType to a base ErrorType
   * 
   * @param httpErrorType - The HTTP client error type
   * @returns The corresponding base ErrorType
   */
  private static mapToBaseErrorType(httpErrorType: HttpClientErrorType): ErrorType {
    switch (httpErrorType) {
      case HttpClientErrorType.CLIENT:
        return ErrorType.VALIDATION;
      case HttpClientErrorType.SERVER:
        return ErrorType.TECHNICAL;
      case HttpClientErrorType.NETWORK:
      case HttpClientErrorType.CANCELLED:
        return ErrorType.EXTERNAL;
      default:
        return ErrorType.TECHNICAL;
    }
  }

  /**
   * Creates a user-friendly error message based on the error details
   * 
   * @param error - The Axios error
   * @returns A user-friendly error message
   */
  public static createErrorMessage(error: AxiosError): string {
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      return `HTTP ${status} error occurred while ${method} ${url}: ${error.message}`;
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return `Request timeout: ${error.message}`;
    }

    if (error.code === 'ERR_CANCELED') {
      return `Request cancelled: ${error.message}`;
    }

    if (error.code === 'ECONNREFUSED') {
      return `Connection refused: ${error.message}`;
    }

    if (error.code === 'ENOTFOUND') {
      return `Host not found: ${error.message}`;
    }

    return `HTTP request failed: ${error.message}`;
  }
}

/**
 * Retry strategy function type for determining delay between retry attempts
 */
export type RetryDelayStrategy = (retryCount: number, error?: AxiosError) => number;

/**
 * Retry condition function type for determining if a request should be retried
 */
export type RetryCondition = (error: AxiosError) => boolean;

/**
 * Configuration options for HTTP client retry mechanism
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  retries: number;
  /** Strategy for determining delay between retries */
  retryDelay: RetryDelayStrategy;
  /** Function to determine if a request should be retried */
  retryCondition?: RetryCondition;
  /** HTTP methods that should be retried */
  httpMethodsToRetry?: string[];
  /** HTTP status codes that should trigger a retry */
  statusCodesToRetry?: number[][];
  /** Maximum timeout for a single request attempt */
  timeout?: number;
  /** Whether to respect the Retry-After header if present */
  respectRetryAfter?: boolean;
}

/**
 * Configuration options for HTTP client
 */
export interface HttpClientConfig extends AxiosRequestConfig {
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Logger service for request/response logging */
  logger?: LoggerService;
  /** Tracing service for distributed tracing */
  tracer?: TracingService;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: exponentialDelay,
  httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT'],
  statusCodesToRetry: [[408, 408], [429, 429], [500, 599]],
  timeout: 10000,
  respectRetryAfter: true
};

/**
 * Implements an exponential backoff delay strategy
 * 
 * @param retryCount - The current retry attempt number (starting from 1)
 * @param error - The error that triggered the retry
 * @returns The delay in milliseconds before the next retry
 */
export function exponentialDelay(retryCount: number, error?: AxiosError): number {
  const delay = Math.pow(2, retryCount) * 100;
  const randomSum = delay * 0.2 * Math.random(); // 0-20% jitter
  
  // If we have a Retry-After header and respectRetryAfter is true, use that
  if (error?.response?.headers['retry-after'] && DEFAULT_RETRY_CONFIG.respectRetryAfter) {
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter && /^\d+$/.test(retryAfter)) {
      return parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
    }
  }
  
  return delay + randomSum;
}

/**
 * Implements a linear delay strategy
 * 
 * @param baseDelay - The base delay in milliseconds
 * @returns A function that calculates linear delay based on retry count
 */
export function linearDelay(baseDelay = 300): RetryDelayStrategy {
  return (retryCount: number): number => {
    return retryCount * baseDelay;
  };
}

/**
 * No delay strategy - retries immediately
 * 
 * @returns Always returns 0 (no delay)
 */
export function noDelay(): number {
  return 0;
}

/**
 * Default retry condition that determines if a request should be retried
 * 
 * @param error - The error that occurred
 * @param config - The retry configuration
 * @returns True if the request should be retried, false otherwise
 */
function defaultRetryCondition(error: AxiosError, config: RetryConfig): boolean {
  // Don't retry if we don't have a config object
  if (!error.config) {
    return false;
  }

  // Don't retry if the request method is not in the allowed list
  const method = error.config.method?.toUpperCase() || '';
  if (config.httpMethodsToRetry && !config.httpMethodsToRetry.includes(method)) {
    return false;
  }

  // Retry on network errors
  if (!error.response) {
    return true;
  }

  // Don't retry if the status code is not in the allowed list
  const status = error.response.status;
  if (config.statusCodesToRetry) {
    return config.statusCodesToRetry.some(([min, max]) => {
      return status >= min && status <= max;
    });
  }

  return false;
}

/**
 * Creates an HTTP client with enhanced error handling and retry capabilities
 * 
 * @param config - Configuration options for the HTTP client
 * @returns An Axios instance with enhanced capabilities
 */
export function createHttpClient(config: HttpClientConfig = {}): AxiosInstance {
  const { retry, logger, tracer, ...axiosConfig } = config;
  
  // Create the Axios instance
  const instance = axios.create(axiosConfig);
  
  // Configure retry mechanism if enabled
  if (retry) {
    const retryConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retry
    };

    // Add request interceptor for timeout
    instance.interceptors.request.use((config) => {
      // Set timeout if specified in retry config and not already set
      if (retryConfig.timeout && !config.timeout) {
        config.timeout = retryConfig.timeout;
      }
      return config;
    });

    // Add response interceptor for retries
    instance.interceptors.response.use(undefined, async (error: AxiosError) => {
      // Extract request config and create retry state if not exists
      const config = error.config;
      if (!config) {
        return Promise.reject(error);
      }

      // Initialize retry count if not exists
      config.headers = config.headers || {};
      const retryCount = parseInt(config.headers['x-retry-count'] as string, 10) || 0;

      // Check if we should retry the request
      const shouldRetry = retryConfig.retryCondition 
        ? retryConfig.retryCondition(error)
        : defaultRetryCondition(error, retryConfig);

      if (shouldRetry && retryCount < retryConfig.retries) {
        // Increment retry count
        const nextRetryCount = retryCount + 1;
        config.headers['x-retry-count'] = nextRetryCount.toString();

        // Calculate delay before next retry
        const delay = retryConfig.retryDelay(nextRetryCount, error);

        // Log retry attempt
        if (logger) {
          logger.debug(
            `Retrying request to ${config.url} (attempt ${nextRetryCount}/${retryConfig.retries}) after ${delay}ms`,
            {
              url: config.url,
              method: config.method,
              retryCount: nextRetryCount,
              maxRetries: retryConfig.retries,
              delay,
              errorCode: error.code,
              statusCode: error.response?.status
            }
          );
        }

        // Wait for the delay and then retry the request
        await new Promise(resolve => setTimeout(resolve, delay));
        return instance(config);
      }

      // If we shouldn't retry or have exceeded max retries, reject with enhanced error
      const errorMessage = HttpClientError.createErrorMessage(error);
      return Promise.reject(new HttpClientError(errorMessage, error));
    });
  }

  // Add request interceptor for tracing
  if (tracer) {
    instance.interceptors.request.use((config) => {
      const span = tracer.startSpan('HTTP Request');
      span.setAttributes({
        'http.method': config.method?.toUpperCase() || 'UNKNOWN',
        'http.url': config.url || 'unknown',
        'http.request.headers': JSON.stringify(config.headers || {})
      });

      // Store span in request config for later use
      config.headers = config.headers || {};
      config.headers['x-trace-id'] = span.spanContext().traceId;
      config.headers['x-span-id'] = span.spanContext().spanId;

      // Store span in request for later retrieval
      (config as any).__span = span;

      return config;
    });

    // Add response interceptor for tracing
    instance.interceptors.response.use(
      (response) => {
        const config = response.config;
        const span = (config as any).__span;

        if (span) {
          span.setAttributes({
            'http.status_code': response.status,
            'http.response.headers': JSON.stringify(response.headers || {}),
            'http.response.size': JSON.stringify(response.data || '').length
          });
          span.end();
        }

        return response;
      },
      (error: AxiosError) => {
        const config = error.config;
        const span = config && (config as any).__span;

        if (span) {
          span.setAttributes({
            'http.status_code': error.response?.status,
            'error': true,
            'error.message': error.message,
            'error.code': error.code
          });
          span.end();
        }

        return Promise.reject(error);
      }
    );
  }

  // Add request/response logging
  if (logger) {
    // Add request logging interceptor
    instance.interceptors.request.use((config) => {
      logger.debug(`HTTP ${config.method?.toUpperCase() || 'UNKNOWN'} request to ${config.url}`, {
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.params,
        // Don't log request body for security reasons unless explicitly configured
        ...(config.data && config.logRequestBody ? { body: config.data } : {})
      });
      return config;
    });

    // Add response logging interceptor
    instance.interceptors.response.use(
      (response) => {
        logger.debug(`HTTP ${response.status} response from ${response.config.url}`, {
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          // Don't log response body for security reasons unless explicitly configured
          ...(response.data && response.config.logResponseBody ? { body: response.data } : {})
        });
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          logger.error(`HTTP ${error.response.status} error from ${error.config?.url}`, {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            // Don't log response body for security reasons unless explicitly configured
            ...(error.response.data && error.config?.logResponseBody ? { body: error.response.data } : {})
          });
        } else {
          logger.error(`HTTP request error: ${error.message}`, {
            url: error.config?.url,
            method: error.config?.method,
            code: error.code,
            message: error.message
          });
        }
        return Promise.reject(error);
      }
    );
  }

  return instance;
}

/**
 * Creates a simple HTTP client with default configuration
 * 
 * @returns An Axios instance with default configuration
 */
export function createSimpleHttpClient(): AxiosInstance {
  return createHttpClient({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export default createHttpClient;