/**
 * @file secure-http.ts
 * @description Provides a secure HTTP client implementation with enhanced protections
 * against Server-Side Request Forgery (SSRF) attacks, integration with retry and
 * circuit breaker patterns, and improved error handling.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { HttpStatus } from '@nestjs/common';
import { 
  ExternalApiError, 
  ExternalDependencyUnavailableError,
  ExternalRateLimitError,
  ExternalResponseFormatError,
  ExternalAuthenticationError
} from '../categories/external.errors';
import { 
  EXTERNAL_API_RETRY_CONFIG, 
  RETRYABLE_HTTP_STATUS_CODES 
} from '../constants';

/**
 * Configuration options for the secure HTTP client
 */
export interface SecureHttpClientOptions {
  /**
   * Base URL for all requests
   */
  baseURL?: string;

  /**
   * Default headers to include with all requests
   */
  headers?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;

  /**
   * Whether to allow requests to private IP ranges (not recommended for production)
   */
  allowPrivateIPs?: boolean;

  /**
   * Additional IP ranges to block (in CIDR notation)
   */
  additionalBlockedIPs?: string[];

  /**
   * Retry configuration for failed requests
   */
  retry?: RetryConfig;

  /**
   * Circuit breaker configuration
   */
  circuitBreaker?: CircuitBreakerConfig;

  /**
   * Name of the service being called (for error reporting)
   */
  serviceName?: string;
}

/**
 * Configuration for the retry mechanism
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;

  /**
   * Initial delay in milliseconds before the first retry
   */
  initialDelayMs: number;

  /**
   * Factor by which the delay increases with each retry (exponential backoff)
   */
  backoffFactor: number;

  /**
   * Maximum delay in milliseconds between retries
   */
  maxDelayMs: number;

  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems
   */
  useJitter: boolean;

  /**
   * Maximum jitter percentage (0-1) to apply to the delay
   */
  jitterFactor: number;

  /**
   * HTTP status codes that should trigger a retry
   */
  retryableStatusCodes?: number[];

  /**
   * Custom function to determine if a request should be retried
   */
  retryCondition?: (error: AxiosError) => boolean;
}

/**
 * Configuration for the circuit breaker pattern
 */
export interface CircuitBreakerConfig {
  /**
   * Number of consecutive failures required to open the circuit
   */
  failureThreshold: number;

  /**
   * Time in milliseconds that the circuit stays open before moving to half-open
   */
  resetTimeoutMs: number;

  /**
   * Number of successful requests required to close the circuit when in half-open state
   */
  successThreshold: number;

  /**
   * Maximum number of requests allowed when in half-open state
   */
  halfOpenMaxRequests?: number;

  /**
   * Custom function to determine if a failure should count towards the threshold
   */
  failureCondition?: (error: AxiosError) => boolean;
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'closed',   // Normal operation, requests flow through
  OPEN = 'open',       // Circuit is open, requests fail fast
  HALF_OPEN = 'half-open' // Testing if the service has recovered
}

/**
 * Implementation of the circuit breaker pattern for HTTP requests
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastStateChange: number = Date.now();
  private halfOpenRequests: number = 0;
  private readonly config: CircuitBreakerConfig;

  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param config - Circuit breaker configuration
   */
  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      successThreshold: 2,
      halfOpenMaxRequests: 1,
      ...config
    };
  }

  /**
   * Checks if the circuit is allowing requests
   * 
   * @returns True if requests are allowed, false otherwise
   */
  public isAllowingRequests(): boolean {
    this.updateState();
    
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    
    if (this.state === CircuitState.OPEN) {
      return false;
    }
    
    // Half-open state: allow limited requests
    return this.halfOpenRequests < (this.config.halfOpenMaxRequests || 1);
  }

  /**
   * Records a successful request
   */
  public recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.halfOpenRequests--;
      
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Records a failed request
   * 
   * @param error - The error that occurred
   * @returns True if the failure counts towards the threshold, false otherwise
   */
  public recordFailure(error: AxiosError): boolean {
    // Check if this failure should count towards the threshold
    if (this.config.failureCondition && !this.config.failureCondition(error)) {
      return false;
    }
    
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests--;
      this.transitionTo(CircuitState.OPEN);
    }
    
    return true;
  }

  /**
   * Prepares for a new request in half-open state
   */
  public prepareRequest(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++;
    }
  }

  /**
   * Updates the circuit state based on elapsed time
   */
  private updateState(): void {
    if (this.state === CircuitState.OPEN) {
      const elapsedMs = Date.now() - this.lastStateChange;
      
      if (elapsedMs >= this.config.resetTimeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
  }

  /**
   * Transitions the circuit to a new state
   * 
   * @param newState - The new circuit state
   */
  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChange = Date.now();
    
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
      this.halfOpenRequests = 0;
    }
  }

  /**
   * Gets the current state of the circuit
   * 
   * @returns The current circuit state
   */
  public getState(): CircuitState {
    this.updateState();
    return this.state;
  }
}

/**
 * Enhanced secure HTTP client with SSRF protection, retry mechanism, and circuit breaker
 */
export class SecureHttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly options: SecureHttpClientOptions;
  private readonly circuitBreaker?: CircuitBreaker;
  private readonly retryConfig: RetryConfig;

  /**
   * Creates a new SecureHttpClient instance
   * 
   * @param options - Configuration options for the client
   */
  constructor(options: SecureHttpClientOptions = {}) {
    this.options = options;
    
    // Set up retry configuration
    this.retryConfig = {
      ...EXTERNAL_API_RETRY_CONFIG,
      retryableStatusCodes: RETRYABLE_HTTP_STATUS_CODES,
      ...options.retry
    };
    
    // Create Axios instance
    this.axiosInstance = axios.create({
      baseURL: options.baseURL,
      headers: options.headers,
      timeout: options.timeout || 30000,
    });
    
    // Set up circuit breaker if configured
    if (options.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    }
    
    // Add SSRF protection
    this.setupSSRFProtection();
    
    // Add response interceptor for error transformation
    this.setupErrorTransformation();
  }

  /**
   * Performs an HTTP request with retry and circuit breaker logic
   * 
   * @param config - Axios request configuration
   * @returns Promise resolving to the response
   */
  public async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    // Check if circuit breaker is allowing requests
    if (this.circuitBreaker && !this.circuitBreaker.isAllowingRequests()) {
      throw new ExternalDependencyUnavailableError(
        `Service unavailable: circuit breaker is open`,
        this.options.serviceName || 'unknown',
        'api',
        { url: config.url }
      );
    }
    
    // Prepare for request if in half-open state
    if (this.circuitBreaker) {
      this.circuitBreaker.prepareRequest();
    }
    
    // Attempt the request with retries
    return this.executeWithRetry<T>(config);
  }

  /**
   * Performs a GET request
   * 
   * @param url - Request URL
   * @param config - Additional Axios request configuration
   * @returns Promise resolving to the response
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * Performs a POST request
   * 
   * @param url - Request URL
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise resolving to the response
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * Performs a PUT request
   * 
   * @param url - Request URL
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise resolving to the response
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * Performs a PATCH request
   * 
   * @param url - Request URL
   * @param data - Request body data
   * @param config - Additional Axios request configuration
   * @returns Promise resolving to the response
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * Performs a DELETE request
   * 
   * @param url - Request URL
   * @param config - Additional Axios request configuration
   * @returns Promise resolving to the response
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * Sets up SSRF protection by adding a request interceptor
   */
  private setupSSRFProtection(): void {
    this.axiosInstance.interceptors.request.use(config => {
      const url = new URL(config.url || '', config.baseURL);
      const hostname = url.hostname;
      
      // Skip SSRF protection if explicitly allowed (not recommended for production)
      if (this.options.allowPrivateIPs) {
        return config;
      }
      
      // Block requests to private IP ranges
      if (
        // IPv4 private ranges
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0)/.test(hostname) ||
        // Localhost
        hostname === 'localhost' ||
        // IPv6 loopback
        hostname === '::1' ||
        // IPv6 link-local
        /^fe80:/i.test(hostname) ||
        // IPv6 unique local
        /^f[c-d][0-9a-f][0-9a-f]:/i.test(hostname) ||
        // .local domains
        hostname.endsWith('.local') ||
        // .internal domains
        hostname.endsWith('.internal') ||
        // .localhost domain
        hostname.endsWith('.localhost') ||
        // AWS metadata service
        hostname === '169.254.169.254' ||
        // Azure metadata service
        hostname === '169.254.169.254' ||
        // GCP metadata service
        hostname === 'metadata.google.internal' ||
        // Docker DNS
        hostname === 'host.docker.internal'
      ) {
        throw new Error('SSRF Protection: Blocked request to private or local network');
      }
      
      // Check additional blocked IPs if provided
      if (this.options.additionalBlockedIPs && this.options.additionalBlockedIPs.length > 0) {
        // This is a simplified check - a real implementation would use a CIDR library
        if (this.options.additionalBlockedIPs.includes(hostname)) {
          throw new Error(`SSRF Protection: Blocked request to prohibited IP: ${hostname}`);
        }
      }
      
      return config;
    });
  }

  /**
   * Sets up error transformation by adding a response interceptor
   */
  private setupErrorTransformation(): void {
    this.axiosInstance.interceptors.response.use(
      // Success handler - record success in circuit breaker
      response => {
        if (this.circuitBreaker) {
          this.circuitBreaker.recordSuccess();
        }
        return response;
      },
      // Error handler - transform to application-specific errors
      async error => {
        // Record failure in circuit breaker if applicable
        if (this.circuitBreaker && error.config) {
          this.circuitBreaker.recordFailure(error);
        }
        
        // Rethrow the transformed error
        throw this.transformError(error);
      }
    );
  }

  /**
   * Executes a request with retry logic
   * 
   * @param config - Axios request configuration
   * @param attempt - Current attempt number (for internal use)
   * @returns Promise resolving to the response
   */
  private async executeWithRetry<T = any>(
    config: AxiosRequestConfig,
    attempt: number = 1
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.axiosInstance.request<T>(config);
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Check if we should retry
      if (this.shouldRetry(axiosError, attempt)) {
        // Calculate delay with exponential backoff and jitter
        const delayMs = this.calculateRetryDelay(attempt);
        
        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Retry the request
        return this.executeWithRetry<T>(config, attempt + 1);
      }
      
      // If we shouldn't retry, rethrow the error
      throw error;
    }
  }

  /**
   * Determines if a request should be retried based on the error and attempt number
   * 
   * @param error - The error that occurred
   * @param attempt - Current attempt number
   * @returns True if the request should be retried, false otherwise
   */
  private shouldRetry(error: AxiosError, attempt: number): boolean {
    // Don't retry if we've reached the maximum attempts
    if (attempt >= this.retryConfig.maxAttempts) {
      return false;
    }
    
    // Use custom retry condition if provided
    if (this.retryConfig.retryCondition) {
      return this.retryConfig.retryCondition(error);
    }
    
    // Check if the status code is retryable
    if (error.response && this.retryConfig.retryableStatusCodes) {
      return this.retryConfig.retryableStatusCodes.includes(error.response.status);
    }
    
    // Retry network errors (no response)
    return !error.response && Boolean(error.request);
  }

  /**
   * Calculates the delay before the next retry attempt
   * 
   * @param attempt - Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateRetryDelay(attempt: number): number {
    // Calculate exponential backoff
    const exponentialDelay = this.retryConfig.initialDelayMs * 
      Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    
    // Apply maximum delay limit
    const cappedDelay = Math.min(exponentialDelay, this.retryConfig.maxDelayMs);
    
    // Add jitter if enabled
    if (this.retryConfig.useJitter) {
      const jitterRange = cappedDelay * this.retryConfig.jitterFactor;
      return cappedDelay + (Math.random() * 2 - 1) * jitterRange;
    }
    
    return cappedDelay;
  }

  /**
   * Transforms Axios errors into application-specific errors
   * 
   * @param error - The Axios error to transform
   * @returns Transformed application-specific error
   */
  private transformError(error: AxiosError): Error {
    const serviceName = this.options.serviceName || 'external-service';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown-url';
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Handle rate limit errors (429 Too Many Requests)
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      
      return new ExternalRateLimitError(
        `Rate limit exceeded for ${serviceName}`,
        serviceName,
        retryAfterSeconds,
        undefined,
        { method, url },
        status,
        data,
        undefined,
        error
      );
    }
    
    // Handle authentication errors (401 Unauthorized, 403 Forbidden)
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return new ExternalAuthenticationError(
        `Authentication failed with ${serviceName}`,
        serviceName,
        'api_key', // Assuming API key auth by default
        { method, url },
        status,
        data,
        undefined,
        error
      );
    }
    
    // Handle network errors (no response)
    if (!error.response && error.request) {
      return new ExternalDependencyUnavailableError(
        `Failed to connect to ${serviceName}: ${error.message}`,
        serviceName,
        'api',
        { method, url },
        undefined,
        undefined,
        undefined,
        error
      );
    }
    
    // Handle malformed response errors
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return new ExternalResponseFormatError(
        `Invalid response format from ${serviceName}: ${error.message}`,
        serviceName,
        'json',
        typeof data === 'string' ? data.substring(0, 100) : undefined,
        { method, url },
        status,
        data,
        undefined,
        error
      );
    }
    
    // Default to ExternalApiError for all other cases
    return new ExternalApiError(
      `Error from ${serviceName}: ${error.message}`,
      serviceName,
      { method, url },
      status,
      method,
      url,
      data,
      undefined,
      error
    );
  }
}

/**
 * Creates a secured HTTP client with SSRF protection, retry mechanism, and circuit breaker
 * 
 * @param options - Configuration options for the client
 * @returns A new SecureHttpClient instance
 */
export function createSecureHttpClient(options: SecureHttpClientOptions = {}): SecureHttpClient {
  return new SecureHttpClient(options);
}

/**
 * Creates a secure HTTP client for internal API calls with predefined configuration
 * 
 * @param baseURL - Base URL for the internal API
 * @param serviceName - Name of the service being called
 * @param headers - Additional headers to include with all requests
 * @returns A new SecureHttpClient instance configured for internal API calls
 */
export function createInternalApiClient(
  baseURL: string,
  serviceName: string,
  headers: Record<string, string> = {}
): SecureHttpClient {
  return createSecureHttpClient({
    baseURL,
    serviceName,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    // Internal APIs can use more aggressive retry
    retry: {
      ...EXTERNAL_API_RETRY_CONFIG,
      maxAttempts: 5,
      initialDelayMs: 500
    },
    // Circuit breaker for internal APIs
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      successThreshold: 2,
      // Only count 5xx errors towards failure threshold
      failureCondition: (error: AxiosError) => {
        return error.response ? error.response.status >= 500 : true;
      }
    }
  });
}

/**
 * Creates a secure HTTP client for external API calls with predefined configuration
 * 
 * @param baseURL - Base URL for the external API
 * @param serviceName - Name of the service being called
 * @param headers - Additional headers to include with all requests
 * @returns A new SecureHttpClient instance configured for external API calls
 */
export function createExternalApiClient(
  baseURL: string,
  serviceName: string,
  headers: Record<string, string> = {}
): SecureHttpClient {
  return createSecureHttpClient({
    baseURL,
    serviceName,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    // Standard retry configuration for external APIs
    retry: EXTERNAL_API_RETRY_CONFIG,
    // Circuit breaker for external APIs
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 60000,
      successThreshold: 3,
      // More conservative circuit breaker for external APIs
      failureCondition: (error: AxiosError) => {
        // Don't count 4xx client errors (except 429) towards failure threshold
        if (error.response) {
          const status = error.response.status;
          return status >= 500 || status === 429;
        }
        return true; // Network errors count towards threshold
      }
    }
  });
}

/**
 * Creates a secure HTTP client for health-related external API calls
 * 
 * @param baseURL - Base URL for the health API
 * @param serviceName - Name of the service being called
 * @param headers - Additional headers to include with all requests
 * @returns A new SecureHttpClient instance configured for health API calls
 */
export function createHealthApiClient(
  baseURL: string,
  serviceName: string,
  headers: Record<string, string> = {}
): SecureHttpClient {
  return createSecureHttpClient({
    baseURL,
    serviceName,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    // Health APIs often have specific requirements
    retry: {
      ...EXTERNAL_API_RETRY_CONFIG,
      maxAttempts: 4,
      initialDelayMs: 2000
    },
    // Circuit breaker for health APIs
    circuitBreaker: {
      failureThreshold: 4,
      resetTimeoutMs: 45000,
      successThreshold: 2
    }
  });
}

/**
 * Default export for backward compatibility with secure-axios.ts
 */
export default createSecureHttpClient;