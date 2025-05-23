/**
 * @file Internal API Client
 * @description Specialized HTTP client utilities for internal service-to-service communication
 * within the microservice architecture.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { createSecureHttpClient } from './security';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@austa/logging';

// Initialize logger
const logger = new Logger({ service: 'internal-api-client' });

/**
 * Journey types supported by the AUSTA SuperApp
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'common';

/**
 * Extended Axios request config with retry information
 */
export interface InternalRequestConfig extends AxiosRequestConfig {
  /**
   * Current retry attempt count
   */
  retryCount?: number;
}

/**
 * Configuration options for internal API client
 */
export interface InternalApiClientOptions {
  /**
   * Base URL for the API
   */
  baseURL: string;
  
  /**
   * Additional headers to include with requests
   */
  headers?: Record<string, string>;
  
  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
  
  /**
   * Journey context for the client
   * @default 'common'
   */
  journey?: JourneyType;
  
  /**
   * Whether to enable automatic retries for failed requests
   * @default true
   */
  enableRetry?: boolean;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Base delay between retries in milliseconds
   * @default 300
   */
  retryDelay?: number;
  
  /**
   * Whether to enable distributed tracing
   * @default true
   */
  enableTracing?: boolean;
}

/**
 * Default configuration for internal API clients
 */
const DEFAULT_OPTIONS: Partial<InternalApiClientOptions> = {
  timeout: 10000,
  journey: 'common',
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 300,
  enableTracing: true
};

/**
 * HTTP methods that are safe to retry
 */
export const RETRYABLE_METHODS = ['get', 'head', 'options', 'delete', 'put'];

/**
 * Status codes that should trigger a retry
 */
export const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504  // Gateway Timeout
];

/**
 * Determines if an error is retryable based on its type and status code
 * 
 * @param error - The error to check
 * @param config - The request configuration
 * @returns Whether the request should be retried
 */
export function isRetryableError(error: AxiosError, config: AxiosRequestConfig): boolean {
  // Don't retry if the request method is not retryable
  if (config.method && !RETRYABLE_METHODS.includes(config.method.toLowerCase())) {
    return false;
  }
  
  // Retry network errors (no response)
  if (!error.response) {
    return true;
  }
  
  // Retry specific status codes
  return RETRYABLE_STATUS_CODES.includes(error.response.status);
}

/**
 * Calculate exponential backoff delay with jitter
 * 
 * @param retryCount - Current retry attempt number
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay in milliseconds before next retry
 */
export function calculateBackoffDelay(retryCount: number, baseDelay: number): number {
  // Exponential backoff: baseDelay * 2^retryCount
  const exponentialDelay = baseDelay * Math.pow(2, retryCount);
  
  // Add jitter (±20%) to prevent retry storms
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
  
  return exponentialDelay + jitter;
}

/**
 * Creates a secure axios instance with predefined config for internal API calls
 * with journey-specific configuration, retry logic, and distributed tracing.
 * 
 * @param options - Configuration options for the internal API client
 * @returns A configured Axios instance with security measures and retry logic
 */
export function createInternalApiClient(options: InternalApiClientOptions): AxiosInstance {
  // Merge default options with provided options
  const config: InternalApiClientOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };
  
  // Create a secure HTTP client
  const instance = createSecureHttpClient();
  
  // Configure base URL and default headers
  instance.defaults.baseURL = config.baseURL;
  instance.defaults.headers.common = {
    'Content-Type': 'application/json',
    'X-Journey-Context': config.journey,
    ...config.headers
  };
  
  // Set timeout
  instance.defaults.timeout = config.timeout;
  
  // Add request interceptor for distributed tracing
  if (config.enableTracing) {
    instance.interceptors.request.use(request => {
      // Generate correlation ID if not already present
      if (!request.headers['X-Correlation-ID']) {
        request.headers['X-Correlation-ID'] = uuidv4();
      }
      
      // Add journey context if not already present
      if (!request.headers['X-Journey-Context'] && config.journey) {
        request.headers['X-Journey-Context'] = config.journey;
      }
      
      return request;
    });
  }
  
  // Add retry logic
  if (config.enableRetry) {
    // Add retry count to request config
    instance.interceptors.request.use(request => {
      (request as InternalRequestConfig).retryCount = (request as InternalRequestConfig).retryCount || 0;
      return request;
    });
    
    // Add response interceptor for retry logic
    instance.interceptors.response.use(undefined, async (error: AxiosError) => {
      const { config: requestConfig } = error;
      
      // If there's no config, we can't retry
      if (!requestConfig) {
        return Promise.reject(error);
      }
      
      // Get current retry count
      const retryCount = (requestConfig as InternalRequestConfig).retryCount || 0;
      
      // Check if we should retry
      if (retryCount >= (config.maxRetries || 3) || !isRetryableError(error, requestConfig)) {
        // Log failed request after all retries
        if (retryCount > 0) {
          logger.warn(`Request to ${requestConfig.url} failed after ${retryCount} retries`, {
            journey: config.journey,
            correlationId: requestConfig.headers?.['X-Correlation-ID'],
            status: error.response?.status,
            errorMessage: error.message
          });
        }
        return Promise.reject(error);
      }
      
      // Increment retry count
      (requestConfig as InternalRequestConfig).retryCount = retryCount + 1;
      
      // Calculate delay with exponential backoff
      const delay = calculateBackoffDelay(retryCount, config.retryDelay || 300);
      
      // Log retry attempt
      logger.info(`Retrying request to ${requestConfig.url}`, {
        attempt: retryCount + 1,
        maxRetries: config.maxRetries,
        delay,
        journey: config.journey,
        correlationId: requestConfig.headers?.['X-Correlation-ID']
      });
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry the request
      return instance(requestConfig);
    });
  }
  
  // Add error context enhancement
  instance.interceptors.response.use(undefined, (error: AxiosError) => {
    if (error.response) {
      // Create enhanced error object with journey context
      const enhancedError = error as AxiosError & {
        journeyContext?: JourneyType;
        correlationId?: string;
        retryCount?: number;
      };
      
      // Add journey context
      enhancedError.journeyContext = config.journey;
      
      // Add correlation ID from response headers if available
      const correlationId = error.response.headers['x-correlation-id'] || 
                           error.config?.headers?.['X-Correlation-ID'];
      if (correlationId) {
        enhancedError.correlationId = correlationId as string;
      }
      
      // Add retry count if available
      if (error.config) {
        enhancedError.retryCount = (error.config as InternalRequestConfig).retryCount;
      }
      
      // Log error with context
      logger.error(`Service communication error: ${error.message}`, {
        journey: config.journey,
        correlationId: enhancedError.correlationId,
        status: error.response.status,
        url: error.config?.url,
        method: error.config?.method,
        retryCount: enhancedError.retryCount
      });
    }
    
    return Promise.reject(error);
  });
  
  return instance;
}