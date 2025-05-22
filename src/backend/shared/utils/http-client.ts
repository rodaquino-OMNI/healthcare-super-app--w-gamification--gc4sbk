import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';
import { createSecureAxios } from '../../packages/utils/src/http/security';
import { BaseError, ErrorType } from '@austa/errors';

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  /**
   * Base URL for all requests
   */
  baseURL?: string;
  
  /**
   * Default headers to include with all requests
   */
  headers?: Record<string, string>;
  
  /**
   * Default timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Circuit breaker configuration
   */
  circuitBreaker?: {
    /**
     * Maximum number of failures before opening the circuit
     * @default 5
     */
    failureThreshold?: number;
    
    /**
     * Number of successful calls required to close the circuit
     * @default 3
     */
    successThreshold?: number;
    
    /**
     * Time in milliseconds that the circuit stays open before moving to half-open
     * @default 10000 (10 seconds)
     */
    resetTimeout?: number;
    
    /**
     * Request timeout in milliseconds
     * @default 3000 (3 seconds)
     */
    timeout?: number;
    
    /**
     * Maximum number of requests allowed when the circuit is half-open
     * @default 1
     */
    rollingCountBuckets?: number;
    
    /**
     * Time window in milliseconds for failure rate calculation
     * @default 10000 (10 seconds)
     */
    rollingCountTimeout?: number;
    
    /**
     * Percentage of failures that will trip the circuit
     * @default 50
     */
    errorThresholdPercentage?: number;
  };
  
  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Number of retry attempts
     * @default 3
     */
    retries?: number;
    
    /**
     * HTTP methods that should be retried
     * @default ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT']
     */
    httpMethodsToRetry?: string[];
    
    /**
     * Status codes that should trigger a retry
     * @default [[100, 199], [429, 429], [500, 599]]
     */
    statusCodesToRetry?: number[][];
    
    /**
     * Whether to use exponential backoff
     * @default true
     */
    useExponentialBackoff?: boolean;
    
    /**
     * Initial retry delay in milliseconds (for exponential backoff)
     * @default 1000 (1 second)
     */
    initialRetryDelay?: number;
  };
  
  /**
   * Journey context for error reporting
   */
  journeyContext?: {
    /**
     * Journey identifier (health, care, plan)
     */
    journey: 'health' | 'care' | 'plan';
    
    /**
     * Additional context information
     */
    context?: Record<string, any>;
  };
}

/**
 * Default HTTP client configuration
 */
const DEFAULT_CONFIG: HttpClientConfig = {
  timeout: 30000, // 30 seconds
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    resetTimeout: 10000, // 10 seconds
    timeout: 3000, // 3 seconds
    rollingCountBuckets: 10,
    rollingCountTimeout: 10000, // 10 seconds
    errorThresholdPercentage: 50,
  },
  retry: {
    retries: 3,
    httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT'],
    statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
    useExponentialBackoff: true,
    initialRetryDelay: 1000, // 1 second
  },
};

/**
 * Error class for HTTP client errors
 */
export class HttpClientError extends BaseError {
  constructor(
    message: string,
    originalError: Error,
    metadata?: Record<string, any>,
    journeyContext?: HttpClientConfig['journeyContext'],
  ) {
    super(
      message,
      {
        type: ErrorType.EXTERNAL,
        cause: originalError,
        metadata: {
          ...metadata,
          journey: journeyContext?.journey,
          journeyContext: journeyContext?.context,
        },
      },
    );
  }
}

/**
 * Creates a circuit breaker for the given axios instance and configuration
 * 
 * @param axiosInstance - The axios instance to wrap with a circuit breaker
 * @param config - Circuit breaker configuration
 * @param journeyContext - Journey context for error reporting
 * @returns A function that executes requests through the circuit breaker
 */
function createCircuitBreaker(
  axiosInstance: AxiosInstance,
  config: Required<HttpClientConfig>['circuitBreaker'],
  journeyContext?: HttpClientConfig['journeyContext'],
): (request: AxiosRequestConfig) => Promise<AxiosResponse> {
  // Function to execute within the circuit breaker
  const requestFn = async (request: AxiosRequestConfig): Promise<AxiosResponse> => {
    try {
      return await axiosInstance(request);
    } catch (error) {
      // Transform axios errors to our standard error format
      if (axios.isAxiosError(error)) {
        throw new HttpClientError(
          `HTTP request failed: ${error.message}`,
          error,
          {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data,
          },
          journeyContext,
        );
      }
      throw error;
    }
  };

  // Create the circuit breaker
  const breaker = new CircuitBreaker(requestFn, {
    failureThreshold: config.failureThreshold,
    successThreshold: config.successThreshold,
    timeout: config.timeout,
    resetTimeout: config.resetTimeout,
    rollingCountBuckets: config.rollingCountBuckets,
    rollingCountTimeout: config.rollingCountTimeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
  });

  // Add event listeners for monitoring
  breaker.on('open', () => {
    console.warn(`Circuit breaker opened for service: ${journeyContext?.journey || 'unknown'}`);
  });

  breaker.on('halfOpen', () => {
    console.info(`Circuit breaker half-opened for service: ${journeyContext?.journey || 'unknown'}`);
  });

  breaker.on('close', () => {
    console.info(`Circuit breaker closed for service: ${journeyContext?.journey || 'unknown'}`);
  });

  // Return a function that executes requests through the circuit breaker
  return (request: AxiosRequestConfig): Promise<AxiosResponse> => {
    return breaker.fire(request);
  };
}

/**
 * Creates an HTTP client with circuit breaker and retry capabilities
 * 
 * @param config - HTTP client configuration
 * @returns An axios instance with circuit breaker and retry capabilities
 */
export function createHttpClient(config: HttpClientConfig = {}): AxiosInstance {
  // Merge default config with provided config
  const mergedConfig: HttpClientConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    circuitBreaker: {
      ...DEFAULT_CONFIG.circuitBreaker,
      ...config.circuitBreaker,
    },
    retry: {
      ...DEFAULT_CONFIG.retry,
      ...config.retry,
    },
  };

  // Create secure axios instance
  const axiosInstance = createSecureAxios();

  // Configure base settings
  if (mergedConfig.baseURL) {
    axiosInstance.defaults.baseURL = mergedConfig.baseURL;
  }

  if (mergedConfig.headers) {
    axiosInstance.defaults.headers.common = {
      ...axiosInstance.defaults.headers.common,
      ...mergedConfig.headers,
    };
  }

  if (mergedConfig.timeout) {
    axiosInstance.defaults.timeout = mergedConfig.timeout;
  }

  // Configure retry mechanism
  if (mergedConfig.retry) {
    const retryConfig = mergedConfig.retry;
    
    axiosRetry(axiosInstance, {
      retries: retryConfig.retries,
      retryDelay: retryConfig.useExponentialBackoff
        ? (retryCount: number) => {
            // Implement exponential backoff with jitter
            const delay = retryConfig.initialRetryDelay! * Math.pow(2, retryCount);
            const jitter = delay * 0.2 * Math.random(); // Add up to 20% jitter
            return delay + jitter;
          }
        : axiosRetry.exponentialDelay,
      retryCondition: (error: AxiosError) => {
        // Don't retry if circuit is open
        if (error.message.includes('Circuit breaker is open')) {
          return false;
        }

        // Check if method should be retried
        if (
          error.config?.method &&
          !retryConfig.httpMethodsToRetry?.includes(error.config.method.toUpperCase())
        ) {
          return false;
        }

        // Check if status code should be retried
        if (error.response?.status) {
          return retryConfig.statusCodesToRetry?.some(
            ([min, max]) => error.response!.status >= min && error.response!.status <= max
          ) || false;
        }

        // Retry network errors
        return !error.response && Boolean(error.code) && error.code !== 'ECONNABORTED';
      },
      onRetry: (retryCount: number, error: AxiosError) => {
        console.warn(
          `Retrying request to ${error.config?.url} (attempt ${retryCount}/${retryConfig.retries})`,
          {
            journey: mergedConfig.journeyContext?.journey,
            error: error.message,
            status: error.response?.status,
          }
        );
      },
    });
  }

  // Apply circuit breaker if configured
  if (mergedConfig.circuitBreaker) {
    const circuitBreakerConfig = mergedConfig.circuitBreaker as Required<HttpClientConfig>['circuitBreaker'];
    const executeWithCircuitBreaker = createCircuitBreaker(
      axiosInstance,
      circuitBreakerConfig,
      mergedConfig.journeyContext
    );

    // Create a new axios instance that uses the circuit breaker
    const axiosWithCircuitBreaker = axios.create();

    // Proxy all methods through the circuit breaker
    axiosWithCircuitBreaker.request = <T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> => {
      return executeWithCircuitBreaker(config) as Promise<R>;
    };

    // Copy all properties from the original instance
    axiosWithCircuitBreaker.defaults = axiosInstance.defaults;
    axiosWithCircuitBreaker.interceptors = axiosInstance.interceptors;

    // Add helper methods
    ['get', 'delete', 'head', 'options', 'post', 'put', 'patch'].forEach((method) => {
      axiosWithCircuitBreaker[method] = (...args: any[]) => {
        return (axiosInstance[method] as Function)(...args);
      };
    });

    return axiosWithCircuitBreaker;
  }

  return axiosInstance;
}

/**
 * Creates an HTTP client specifically for internal service-to-service communication
 * 
 * @param serviceName - Name of the service being called
 * @param baseURL - Base URL for the service
 * @param journeyContext - Journey context for error reporting
 * @returns An axios instance configured for internal service communication
 */
export function createInternalServiceClient(
  serviceName: string,
  baseURL: string,
  journeyContext?: HttpClientConfig['journeyContext'],
): AxiosInstance {
  return createHttpClient({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Name': serviceName,
    },
    timeout: 5000, // 5 seconds for internal communication
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 5000, // 5 seconds
      timeout: 2000, // 2 seconds
    },
    retry: {
      retries: 2, // Fewer retries for internal services
      httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'], // Include POST for internal APIs
      useExponentialBackoff: true,
      initialRetryDelay: 500, // 500ms initial delay
    },
    journeyContext,
  });
}

/**
 * Creates an HTTP client for external API communication with appropriate defaults
 * 
 * @param baseURL - Base URL for the external API
 * @param journeyContext - Journey context for error reporting
 * @returns An axios instance configured for external API communication
 */
export function createExternalApiClient(
  baseURL: string,
  journeyContext?: HttpClientConfig['journeyContext'],
): AxiosInstance {
  return createHttpClient({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds for external APIs
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
    },
    retry: {
      retries: 3,
      httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE'], // Don't retry POST for external APIs
      useExponentialBackoff: true,
      initialRetryDelay: 1000, // 1 second initial delay
    },
    journeyContext,
  });
}

export default {
  createHttpClient,
  createInternalServiceClient,
  createExternalApiClient,
  HttpClientError,
};