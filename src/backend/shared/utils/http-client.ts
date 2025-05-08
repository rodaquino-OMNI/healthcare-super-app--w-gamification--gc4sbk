import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSecureAxios } from './secure-axios';
import { Logger } from '@nestjs/common';
import { retry, RetryOptions, DEFAULT_RETRY_OPTIONS } from '@austa/errors/utils/retry';
import { BaseError } from '@austa/errors/base';
import { ExternalApiError, ExternalDependencyUnavailableError, ExternalRateLimitError, ExternalResponseFormatError } from '@austa/errors/categories/external.errors';
import { TimeoutError } from '@austa/errors/categories/technical.errors';

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation, requests flow through
  OPEN = 'OPEN',       // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back online
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold: number;
  
  /**
   * Time in milliseconds to keep the circuit open before moving to half-open
   */
  resetTimeout: number;
  
  /**
   * Number of successful requests in half-open state to close the circuit
   */
  successThreshold: number;
  
  /**
   * Optional callback when circuit state changes
   */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2
};

/**
 * Circuit breaker implementation to prevent cascading failures
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private nextAttempt: number = Date.now();
  private readonly options: CircuitBreakerOptions;
  
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
  }
  
  /**
   * Executes a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new ExternalDependencyUnavailableError(
          'Circuit breaker is open',
          { circuitState: this.state }
        );
      }
      
      this.toState(CircuitState.HALF_OPEN);
    }
    
    try {
      const result = await fn();
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      if (this.successes >= this.options.successThreshold) {
        this.toState(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failures on success in closed state
      this.failures = 0;
    }
  }
  
  /**
   * Handles execution failure
   */
  private onFailure(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.toState(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      this.failures++;
      
      if (this.failures >= this.options.failureThreshold) {
        this.toState(CircuitState.OPEN);
      }
    }
  }
  
  /**
   * Transitions the circuit to a new state
   */
  private toState(state: CircuitState): void {
    if (state === this.state) return;
    
    const previousState = this.state;
    this.state = state;
    
    if (state === CircuitState.HALF_OPEN) {
      this.successes = 0;
    } else if (state === CircuitState.CLOSED) {
      this.failures = 0;
      this.successes = 0;
    } else if (state === CircuitState.OPEN) {
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
    
    if (this.options.onStateChange) {
      this.options.onStateChange(previousState, state);
    }
  }
  
  /**
   * Gets the current state of the circuit
   */
  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Journey type for context-aware error handling
 */
export type JourneyType = 'health' | 'care' | 'plan' | 'auth' | 'gamification' | 'notification';

/**
 * HTTP client configuration options
 */
export interface HttpClientOptions {
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
   * Retry options for failed requests
   */
  retry?: Partial<RetryOptions>;
  
  /**
   * Circuit breaker options
   */
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  
  /**
   * Journey type for context-aware error handling
   */
  journey?: JourneyType;
  
  /**
   * Logger instance
   */
  logger?: Logger;
}

/**
 * Default HTTP client options
 */
export const DEFAULT_HTTP_CLIENT_OPTIONS: HttpClientOptions = {
  timeout: 10000, // 10 seconds
  retry: DEFAULT_RETRY_OPTIONS,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_OPTIONS
};

/**
 * Enhanced HTTP client with resilience patterns
 */
export class HttpClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly options: HttpClientOptions;
  private readonly logger?: Logger;
  
  /**
   * Creates a new HTTP client with resilience patterns
   */
  constructor(options: HttpClientOptions = {}) {
    this.options = { ...DEFAULT_HTTP_CLIENT_OPTIONS, ...options };
    this.logger = this.options.logger;
    
    // Create secure axios instance
    this.axiosInstance = createSecureAxios();
    
    // Configure axios instance
    if (this.options.baseURL) {
      this.axiosInstance.defaults.baseURL = this.options.baseURL;
    }
    
    if (this.options.headers) {
      this.axiosInstance.defaults.headers.common = {
        ...this.axiosInstance.defaults.headers.common,
        ...this.options.headers
      };
    }
    
    if (this.options.timeout) {
      this.axiosInstance.defaults.timeout = this.options.timeout;
    }
    
    // Create circuit breaker
    this.circuitBreaker = new CircuitBreaker(this.options.circuitBreaker);
    
    // Add response interceptor for error transformation
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => this.handleAxiosError(error)
    );
  }
  
  /**
   * Performs a GET request with resilience patterns
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config
    });
  }
  
  /**
   * Performs a POST request with resilience patterns
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }
  
  /**
   * Performs a PUT request with resilience patterns
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }
  
  /**
   * Performs a PATCH request with resilience patterns
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config
    });
  }
  
  /**
   * Performs a DELETE request with resilience patterns
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }
  
  /**
   * Performs an HTTP request with resilience patterns
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const retryOptions: Partial<RetryOptions> = {
      ...this.options.retry,
      logger: this.logger,
      shouldRetry: (error) => this.shouldRetryError(error)
    };
    
    try {
      // Execute request with circuit breaker and retry
      return await this.circuitBreaker.execute(() => 
        retry<T>(
          async () => {
            try {
              const response = await this.axiosInstance.request<T>(config);
              return response.data;
            } catch (error) {
              // This will be caught by the retry mechanism
              throw error;
            }
          },
          retryOptions
        )
      );
    } catch (error) {
      // Transform error if it's not already a BaseError
      if (!(error instanceof BaseError)) {
        throw this.transformError(error, config);
      }
      throw error;
    }
  }
  
  /**
   * Determines if an error should be retried
   */
  private shouldRetryError(error: Error): boolean {
    // Don't retry client errors (4xx)
    if (error instanceof ExternalApiError && error.metadata?.statusCode) {
      const statusCode = error.metadata.statusCode as number;
      return statusCode >= 500 || statusCode === 429;
    }
    
    // Retry network errors and timeouts
    return error instanceof TimeoutError || 
           (error instanceof ExternalApiError && error.message.includes('network')) ||
           error instanceof ExternalDependencyUnavailableError;
  }
  
  /**
   * Transforms Axios errors into application-specific errors
   */
  private handleAxiosError(error: AxiosError): never {
    throw this.transformError(error, error.config);
  }
  
  /**
   * Transforms errors into application-specific errors
   */
  private transformError(error: any, config?: AxiosRequestConfig): BaseError {
    // Create context with journey information
    const context = {
      url: config?.url,
      method: config?.method,
      journey: this.options.journey
    };
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new TimeoutError(
        `Request timed out after ${config?.timeout || this.options.timeout}ms`,
        context
      );
    }
    
    // Handle Axios errors
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      // Handle rate limiting
      if (axiosError.response?.status === 429) {
        const retryAfter = axiosError.response.headers['retry-after'];
        return new ExternalRateLimitError(
          'Rate limit exceeded',
          {
            ...context,
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
            statusCode: 429
          }
        );
      }
      
      // Handle response errors
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        
        return new ExternalApiError(
          `API error: ${axiosError.message}`,
          {
            ...context,
            statusCode: status,
            responseData: data
          }
        );
      }
      
      // Handle request errors (network issues)
      if (axiosError.request) {
        return new ExternalDependencyUnavailableError(
          `Network error: ${axiosError.message}`,
          context
        );
      }
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return new ExternalResponseFormatError(
        `Invalid response format: ${error.message}`,
        context
      );
    }
    
    // Handle unknown errors
    return new ExternalApiError(
      `Unknown error: ${error.message || 'No error message'}`,
      context
    );
  }
  
  /**
   * Gets the underlying Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
  
  /**
   * Gets the circuit breaker instance
   */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }
}

/**
 * Creates a new HTTP client with resilience patterns
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  return new HttpClient(options);
}

/**
 * Creates a journey-specific HTTP client
 */
export function createJourneyHttpClient(
  journey: JourneyType,
  options: HttpClientOptions = {}
): HttpClient {
  return new HttpClient({
    ...options,
    journey
  });
}

export default createHttpClient;