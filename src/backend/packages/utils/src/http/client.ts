import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * HTTP client error types for better error classification and handling
 */
export enum HttpErrorType {
  CLIENT_ERROR = 'CLIENT_ERROR',       // 4xx errors - client-side issues
  SERVER_ERROR = 'SERVER_ERROR',       // 5xx errors - server-side issues
  NETWORK_ERROR = 'NETWORK_ERROR',     // Network connectivity issues
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',     // Request timeout
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Response validation failed
  SSRF_ERROR = 'SSRF_ERROR',           // Server-side request forgery attempt
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'      // Unclassified errors
}

/**
 * Extended HTTP error with additional context for better debugging and handling
 */
export class HttpClientError extends Error {
  public readonly type: HttpErrorType;
  public readonly status?: number;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly url?: string;
  public readonly method?: string;
  public readonly originalError?: Error;
  public readonly response?: any;

  constructor({
    message,
    type = HttpErrorType.UNKNOWN_ERROR,
    status,
    code,
    requestId,
    url,
    method,
    originalError,
    response
  }: {
    message: string;
    type?: HttpErrorType;
    status?: number;
    code?: string;
    requestId?: string;
    url?: string;
    method?: string;
    originalError?: Error;
    response?: any;
  }) {
    super(message);
    this.name = 'HttpClientError';
    this.type = type;
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.url = url;
    this.method = method;
    this.originalError = originalError;
    this.response = response;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, HttpClientError.prototype);
  }

  /**
   * Creates a structured error object for logging or serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      status: this.status,
      code: this.code,
      requestId: this.requestId,
      url: this.url,
      method: this.method,
      response: this.response,
      stack: this.stack
    };
  }

  /**
   * Factory method to create an HttpClientError from an AxiosError
   */
  static fromAxiosError(error: AxiosError, requestId?: string): HttpClientError {
    const { config, response, code, message } = error;
    const status = response?.status;
    const url = config?.url;
    const method = config?.method?.toUpperCase();
    
    // Determine error type based on status code and error code
    let type = HttpErrorType.UNKNOWN_ERROR;
    let errorMessage = message;

    if (error.code === 'ECONNABORTED') {
      type = HttpErrorType.TIMEOUT_ERROR;
      errorMessage = `Request timeout exceeded (${config?.timeout}ms)`;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      type = HttpErrorType.NETWORK_ERROR;
      errorMessage = `Network error: ${error.code} - ${message}`;
    } else if (status) {
      if (status >= 400 && status < 500) {
        type = HttpErrorType.CLIENT_ERROR;
        errorMessage = `Client error (${status}): ${response?.data?.message || message}`;
      } else if (status >= 500) {
        type = HttpErrorType.SERVER_ERROR;
        errorMessage = `Server error (${status}): ${response?.data?.message || message}`;
      }
    }

    return new HttpClientError({
      message: errorMessage,
      type,
      status,
      code: error.code || response?.data?.code,
      requestId,
      url,
      method,
      originalError: error,
      response: response?.data
    });
  }
}

/**
 * Retry configuration options for failed requests
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds before the first retry */
  initialDelayMs: number;
  /** Factor by which the delay increases with each retry attempt */
  backoffFactor: number;
  /** Maximum delay in milliseconds between retries */
  maxDelayMs: number;
  /** HTTP status codes that should trigger a retry */
  retryStatusCodes: number[];
  /** Error types that should trigger a retry */
  retryErrorTypes: HttpErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 300,
  backoffFactor: 2,
  maxDelayMs: 10000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  retryErrorTypes: [HttpErrorType.NETWORK_ERROR, HttpErrorType.TIMEOUT_ERROR, HttpErrorType.SERVER_ERROR]
};

/**
 * Configuration options for the HTTP client
 */
export interface HttpClientConfig extends AxiosRequestConfig {
  /** Enable SSRF protection to block requests to private IP ranges */
  enableSsrfProtection?: boolean;
  /** Enable request and response logging */
  enableLogging?: boolean;
  /** Custom logger function */
  logger?: (message: string, data?: any) => void;
  /** Enable automatic response validation */
  enableResponseValidation?: boolean;
  /** Custom response validator function */
  responseValidator?: (response: AxiosResponse) => boolean | Promise<boolean>;
  /** Retry configuration for failed requests */
  retry?: Partial<RetryConfig>;
}

/**
 * Default HTTP client configuration
 */
export const DEFAULT_HTTP_CLIENT_CONFIG: HttpClientConfig = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  enableSsrfProtection: true,
  enableLogging: false,
  enableResponseValidation: false,
  retry: DEFAULT_RETRY_CONFIG
};

/**
 * Creates an HTTP client with enhanced features including error handling, logging, and retry mechanisms
 * 
 * @param config - Configuration options for the HTTP client
 * @returns A configured Axios instance with additional features
 */
export function createHttpClient(config: HttpClientConfig = {}): AxiosInstance {
  // Merge default config with provided config
  const mergedConfig: HttpClientConfig = {
    ...DEFAULT_HTTP_CLIENT_CONFIG,
    ...config,
    retry: {
      ...DEFAULT_RETRY_CONFIG,
      ...(config.retry || {})
    },
    headers: {
      ...DEFAULT_HTTP_CLIENT_CONFIG.headers,
      ...(config.headers || {})
    }
  };

  // Create axios instance
  const instance = axios.create(mergedConfig);
  
  // Default logger function
  const logger = mergedConfig.logger || ((message: string, data?: any) => {
    if (data) {
      console.log(`[HttpClient] ${message}`, data);
    } else {
      console.log(`[HttpClient] ${message}`);
    }
  });

  // Add request interceptor for SSRF protection
  if (mergedConfig.enableSsrfProtection) {
    instance.interceptors.request.use(reqConfig => {
      if (!reqConfig.url) return reqConfig;
      
      try {
        const url = new URL(reqConfig.url, reqConfig.baseURL);
        const hostname = url.hostname;
        
        // Block requests to private IP ranges
        if (
          /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
          hostname === '::1' ||
          hostname === 'fe80::' ||
          hostname.endsWith('.local')
        ) {
          throw new HttpClientError({
            message: 'SSRF Protection: Blocked request to private or local network',
            type: HttpErrorType.SSRF_ERROR,
            url: reqConfig.url,
            method: reqConfig.method?.toUpperCase()
          });
        }
      } catch (error) {
        if (error instanceof HttpClientError) {
          throw error;
        }
        // If there's an error parsing the URL, continue with the request
      }
      
      return reqConfig;
    });
  }

  // Add request ID and logging
  instance.interceptors.request.use(reqConfig => {
    // Generate a unique request ID for tracing
    const requestId = uuidv4();
    reqConfig.headers = reqConfig.headers || {};
    reqConfig.headers['X-Request-ID'] = requestId;
    
    // Store request ID in config for later use
    (reqConfig as any).requestId = requestId;
    
    // Log request if logging is enabled
    if (mergedConfig.enableLogging) {
      const logData = {
        requestId,
        method: reqConfig.method?.toUpperCase(),
        url: reqConfig.url,
        headers: { ...reqConfig.headers },
        params: reqConfig.params,
        // Don't log sensitive data like auth tokens
        data: reqConfig.data ? '(request data)' : undefined
      };
      
      logger('Request sent', logData);
    }
    
    return reqConfig;
  });

  // Add response validation, logging and error handling
  instance.interceptors.response.use(
    async (response) => {
      const requestId = (response.config as any).requestId;
      
      // Log response if logging is enabled
      if (mergedConfig.enableLogging) {
        const logData = {
          requestId,
          status: response.status,
          statusText: response.statusText,
          headers: { ...response.headers },
          // Don't log potentially large response data
          data: '(response data)'
        };
        
        logger('Response received', logData);
      }
      
      // Validate response if enabled
      if (mergedConfig.enableResponseValidation && mergedConfig.responseValidator) {
        try {
          const isValid = await mergedConfig.responseValidator(response);
          if (!isValid) {
            throw new HttpClientError({
              message: 'Response validation failed',
              type: HttpErrorType.VALIDATION_ERROR,
              status: response.status,
              requestId,
              url: response.config.url,
              method: response.config.method?.toUpperCase(),
              response: response.data
            });
          }
        } catch (error) {
          if (error instanceof HttpClientError) {
            throw error;
          }
          throw new HttpClientError({
            message: `Response validation error: ${(error as Error).message}`,
            type: HttpErrorType.VALIDATION_ERROR,
            status: response.status,
            requestId,
            url: response.config.url,
            method: response.config.method?.toUpperCase(),
            originalError: error as Error,
            response: response.data
          });
        }
      }
      
      return response;
    },
    async (error: AxiosError) => {
      // Get request ID from config if available
      const requestId = (error.config as any)?.requestId;
      
      // Convert to HttpClientError for better error handling
      const httpError = HttpClientError.fromAxiosError(error, requestId);
      
      // Log error if logging is enabled
      if (mergedConfig.enableLogging) {
        logger('Request error', httpError.toJSON());
      }
      
      // Implement retry logic for certain errors
      if (error.config && mergedConfig.retry) {
        const { maxRetries, initialDelayMs, backoffFactor, maxDelayMs, retryStatusCodes, retryErrorTypes } = 
          mergedConfig.retry as RetryConfig;
        
        // Get current retry attempt from config or initialize to 0
        const currentRetryAttempt = (error.config as any).retryAttempt || 0;
        
        // Check if we should retry based on error type and status
        const shouldRetryStatus = error.response?.status && retryStatusCodes.includes(error.response.status);
        const shouldRetryErrorType = retryErrorTypes.includes(httpError.type);
        
        if ((shouldRetryStatus || shouldRetryErrorType) && currentRetryAttempt < maxRetries) {
          // Calculate delay with exponential backoff
          const delay = Math.min(
            initialDelayMs * Math.pow(backoffFactor, currentRetryAttempt),
            maxDelayMs
          );
          
          // Log retry attempt
          if (mergedConfig.enableLogging) {
            logger(`Retrying request (attempt ${currentRetryAttempt + 1}/${maxRetries}) after ${delay}ms`, {
              requestId,
              url: error.config.url,
              method: error.config.method?.toUpperCase(),
              errorType: httpError.type,
              status: error.response?.status
            });
          }
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Increment retry attempt counter
          (error.config as any).retryAttempt = currentRetryAttempt + 1;
          
          // Retry the request
          return instance(error.config);
        }
      }
      
      // If we shouldn't retry or have exceeded max retries, throw the error
      throw httpError;
    }
  );

  return instance;
}

/**
 * Creates a secure HTTP client with SSRF protection and standard configuration
 * 
 * @returns A configured HTTP client with security measures
 */
export function createSecureHttpClient(): AxiosInstance {
  return createHttpClient({
    enableSsrfProtection: true,
    timeout: 30000
  });
}

/**
 * Creates an HTTP client configured for internal API communication
 * 
 * @param baseURL - The base URL for the API
 * @param headers - Additional headers to include with requests
 * @param options - Additional configuration options
 * @returns A configured HTTP client for internal API communication
 */
export function createInternalApiClient(
  baseURL: string,
  headers: Record<string, string> = {},
  options: Partial<HttpClientConfig> = {}
): AxiosInstance {
  return createHttpClient({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    timeout: 10000,
    enableSsrfProtection: true,
    enableLogging: process.env.NODE_ENV !== 'production',
    retry: {
      maxRetries: 2,
      initialDelayMs: 200,
      backoffFactor: 2,
      maxDelayMs: 2000,
      retryStatusCodes: [408, 429, 500, 502, 503, 504],
      retryErrorTypes: [HttpErrorType.NETWORK_ERROR, HttpErrorType.TIMEOUT_ERROR]
    },
    ...options
  });
}

export default createHttpClient;