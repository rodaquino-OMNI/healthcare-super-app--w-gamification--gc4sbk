/**
 * @file circuit-breaker.ts
 * @description Implements the circuit breaker pattern for HTTP requests to prevent cascading failures during service outages.
 * 
 * The circuit breaker pattern is a design pattern used to detect failures and encapsulates the logic
 * of preventing a failure from constantly recurring during maintenance, temporary external system failure,
 * or unexpected system difficulties.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ExternalDependencyUnavailableError, ExternalTimeoutError } from '@austa/errors/categories';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Circuit is closed and requests flow normally */
  CLOSED = 'CLOSED',
  /** Circuit is open and requests are blocked */
  OPEN = 'OPEN',
  /** Circuit is testing if the service has recovered */
  HALF_OPEN = 'HALF_OPEN'
}

/**
 * Configuration options for the circuit breaker
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before trying to close the circuit */
  resetTimeout: number;
  /** Time in milliseconds between health checks when the circuit is open */
  monitorInterval?: number;
  /** Function to determine if an error should count as a failure */
  isFailure?: (error: any) => boolean;
  /** Function called when the circuit state changes */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
  /** Function called when a request fails */
  onFailure?: (error: any, requestConfig: AxiosRequestConfig) => void;
  /** Function called when a request succeeds */
  onSuccess?: (response: AxiosResponse, requestConfig: AxiosRequestConfig) => void;
  /** Name of the service for logging and error messages */
  serviceName?: string;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitorInterval: 5000, // 5 seconds
  isFailure: (error: any) => true, // By default, all errors count as failures
  serviceName: 'external-service'
};

/**
 * Circuit breaker state information
 */
interface CircuitBreakerState {
  /** Current state of the circuit */
  state: CircuitState;
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp when the circuit was opened */
  openedAt: number | null;
  /** Timestamp of the last state change */
  lastStateChange: number;
  /** Timestamp of the last failure */
  lastFailure: number | null;
  /** Timestamp of the last success */
  lastSuccess: number | null;
  /** Total number of successful requests */
  successCount: number;
  /** Total number of failed requests */
  totalFailureCount: number;
  /** Total number of rejected requests (when circuit is open) */
  rejectedCount: number;
}

/**
 * Circuit breaker implementation for Axios HTTP requests
 */
class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private state: CircuitBreakerState;
  private monitorTimer: NodeJS.Timeout | null = null;

  /**
   * Creates a new CircuitBreaker instance
   * 
   * @param options - Configuration options for the circuit breaker
   */
  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
    this.state = {
      state: CircuitState.CLOSED,
      failureCount: 0,
      openedAt: null,
      lastStateChange: Date.now(),
      lastFailure: null,
      lastSuccess: null,
      successCount: 0,
      totalFailureCount: 0,
      rejectedCount: 0
    };
  }

  /**
   * Gets the current state of the circuit breaker
   * 
   * @returns The current circuit state
   */
  public getState(): CircuitState {
    return this.state.state;
  }

  /**
   * Gets detailed state information about the circuit breaker
   * 
   * @returns Detailed circuit breaker state information
   */
  public getStateDetails(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  /**
   * Executes a function with circuit breaker protection
   * 
   * @param request - The function to execute
   * @param requestConfig - The original request configuration
   * @returns The result of the function
   * @throws Error if the circuit is open or the function throws
   */
  public async execute<T>(
    request: () => Promise<T>,
    requestConfig?: AxiosRequestConfig
  ): Promise<T> {
    // Check if the circuit is open
    if (this.state.state === CircuitState.OPEN) {
      // Check if it's time to try half-open state
      if (this.shouldAttemptReset()) {
        this.transitionToState(CircuitState.HALF_OPEN);
      } else {
        // Circuit is open, reject the request
        this.state.rejectedCount++;
        throw new ExternalDependencyUnavailableError(
          this.options.serviceName || 'external-service',
          `Circuit breaker is open for ${this.options.serviceName}`,
          'CIRCUIT_OPEN',
          { circuitBreaker: this.getStateDetails() }
        );
      }
    }

    try {
      // Execute the request
      const result = await request();
      
      // Handle success
      this.handleSuccess(result, requestConfig);
      return result;
    } catch (error) {
      // Handle failure
      this.handleFailure(error, requestConfig);
      throw error;
    }
  }

  /**
   * Handles a successful request
   * 
   * @param result - The result of the request
   * @param requestConfig - The original request configuration
   */
  private handleSuccess(result: any, requestConfig?: AxiosRequestConfig): void {
    this.state.lastSuccess = Date.now();
    this.state.successCount++;

    // If the circuit is half-open and the request succeeded, close the circuit
    if (this.state.state === CircuitState.HALF_OPEN) {
      this.transitionToState(CircuitState.CLOSED);
    }

    // Reset failure count on success
    if (this.state.failureCount > 0) {
      this.state.failureCount = 0;
    }

    // Call the onSuccess callback if provided
    if (this.options.onSuccess && requestConfig) {
      try {
        this.options.onSuccess(result, requestConfig);
      } catch (callbackError) {
        console.error('Error in circuit breaker onSuccess callback:', callbackError);
      }
    }
  }

  /**
   * Handles a failed request
   * 
   * @param error - The error that occurred
   * @param requestConfig - The original request configuration
   */
  private handleFailure(error: any, requestConfig?: AxiosRequestConfig): void {
    // Check if this error should count as a failure
    if (this.options.isFailure && !this.options.isFailure(error)) {
      return;
    }

    this.state.lastFailure = Date.now();
    this.state.totalFailureCount++;

    // Call the onFailure callback if provided
    if (this.options.onFailure && requestConfig) {
      try {
        this.options.onFailure(error, requestConfig);
      } catch (callbackError) {
        console.error('Error in circuit breaker onFailure callback:', callbackError);
      }
    }

    // Handle failure based on current state
    if (this.state.state === CircuitState.CLOSED) {
      this.state.failureCount++;
      
      // If we've reached the failure threshold, open the circuit
      if (this.state.failureCount >= this.options.failureThreshold) {
        this.transitionToState(CircuitState.OPEN);
      }
    } else if (this.state.state === CircuitState.HALF_OPEN) {
      // If a request fails while in half-open state, go back to open
      this.transitionToState(CircuitState.OPEN);
    }
  }

  /**
   * Transitions the circuit breaker to a new state
   * 
   * @param newState - The new state to transition to
   */
  private transitionToState(newState: CircuitState): void {
    if (this.state.state === newState) {
      return;
    }

    const previousState = this.state.state;
    const now = Date.now();

    // Update state
    this.state.state = newState;
    this.state.lastStateChange = now;

    // Handle state-specific actions
    if (newState === CircuitState.OPEN) {
      this.state.openedAt = now;
      this.state.failureCount = 0;
      this.startMonitoring();
    } else if (newState === CircuitState.CLOSED) {
      this.state.openedAt = null;
      this.state.failureCount = 0;
      this.stopMonitoring();
    } else if (newState === CircuitState.HALF_OPEN) {
      // Keep monitoring in half-open state
      this.startMonitoring();
    }

    // Call the onStateChange callback if provided
    if (this.options.onStateChange) {
      try {
        this.options.onStateChange(previousState, newState);
      } catch (callbackError) {
        console.error('Error in circuit breaker onStateChange callback:', callbackError);
      }
    }

    // Log the state change
    console.log(`Circuit breaker for ${this.options.serviceName} transitioned from ${previousState} to ${newState}`);
  }

  /**
   * Checks if it's time to attempt resetting the circuit
   * 
   * @returns True if the circuit should attempt to reset
   */
  private shouldAttemptReset(): boolean {
    if (this.state.state !== CircuitState.OPEN || !this.state.openedAt) {
      return false;
    }

    const now = Date.now();
    return now - this.state.openedAt >= this.options.resetTimeout;
  }

  /**
   * Starts the monitoring timer for checking circuit state
   */
  private startMonitoring(): void {
    // Clear any existing timer
    this.stopMonitoring();

    // Start a new timer
    const interval = this.options.monitorInterval || 5000;
    this.monitorTimer = setInterval(() => this.monitor(), interval);
  }

  /**
   * Stops the monitoring timer
   */
  private stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * Monitors the circuit state and attempts to reset if needed
   */
  private monitor(): void {
    if (this.state.state === CircuitState.OPEN && this.shouldAttemptReset()) {
      this.transitionToState(CircuitState.HALF_OPEN);
    }
  }

  /**
   * Manually resets the circuit breaker to closed state
   */
  public reset(): void {
    this.transitionToState(CircuitState.CLOSED);
  }

  /**
   * Manually opens the circuit breaker
   */
  public trip(): void {
    this.transitionToState(CircuitState.OPEN);
  }
}

/**
 * Creates an Axios instance wrapped with circuit breaker functionality
 * 
 * @param axiosInstance - The Axios instance to wrap
 * @param options - Circuit breaker configuration options
 * @returns A wrapped Axios instance with circuit breaker functionality
 */
export function createCircuitBreakerAxios(
  axiosInstance: AxiosInstance,
  options: Partial<CircuitBreakerOptions> = {}
): AxiosInstance {
  const circuitBreaker = new CircuitBreaker(options);
  
  // Create a new Axios instance
  const wrappedAxios = axios.create();
  
  // Copy all properties from the original instance
  Object.assign(wrappedAxios, axiosInstance);
  
  // Override the request method with circuit breaker protection
  const originalRequest = axiosInstance.request.bind(axiosInstance);
  wrappedAxios.request = async function<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return circuitBreaker.execute<AxiosResponse<T>>(
      () => originalRequest(config),
      config
    );
  };
  
  // Add circuit breaker methods to the Axios instance
  (wrappedAxios as any).circuitBreaker = {
    getState: () => circuitBreaker.getState(),
    getStateDetails: () => circuitBreaker.getStateDetails(),
    reset: () => circuitBreaker.reset(),
    trip: () => circuitBreaker.trip()
  };
  
  return wrappedAxios;
}

/**
 * Default implementation of isFailure that categorizes errors as failures
 * based on common patterns
 * 
 * @param error - The error to check
 * @returns True if the error should count as a failure for circuit breaking
 */
export function isFailureByDefault(error: any): boolean {
  // If it's an Axios error
  if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
    const axiosError = error as AxiosError;
    
    // Network errors should count as failures
    if (!axiosError.response) {
      return true;
    }
    
    // Server errors (5xx) should count as failures
    if (axiosError.response.status >= 500) {
      return true;
    }
    
    // Rate limiting (429) should count as a failure
    if (axiosError.response.status === 429) {
      return true;
    }
    
    // Other client errors (4xx) generally shouldn't count as circuit breaker failures
    // as they're likely due to bad requests, not service health issues
    return false;
  }
  
  // Timeout errors should count as failures
  if (error instanceof ExternalTimeoutError) {
    return true;
  }
  
  // Dependency unavailable errors should count as failures
  if (error instanceof ExternalDependencyUnavailableError) {
    return true;
  }
  
  // For other types of errors, check if they have timeout-related properties
  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, any>;
    if (
      errorObj.code === 'ECONNABORTED' ||
      errorObj.code === 'ETIMEDOUT' ||
      errorObj.code === 'ECONNREFUSED' ||
      errorObj.code === 'ECONNRESET' ||
      errorObj.message?.includes('timeout') ||
      errorObj.message?.includes('timed out')
    ) {
      return true;
    }
  }
  
  // By default, count unknown errors as failures
  return true;
}

/**
 * Creates an Axios instance with circuit breaker functionality and default configuration
 * 
 * @param baseURL - The base URL for the Axios instance
 * @param options - Circuit breaker configuration options
 * @returns An Axios instance with circuit breaker functionality
 */
export function createServiceWithCircuitBreaker(
  baseURL: string,
  options: Partial<CircuitBreakerOptions> = {}
): AxiosInstance {
  // Extract the service name from the URL if not provided
  if (!options.serviceName) {
    try {
      const url = new URL(baseURL);
      options.serviceName = url.hostname;
    } catch (e) {
      // If URL parsing fails, use a default name
      options.serviceName = 'external-service';
    }
  }
  
  // Create a base Axios instance
  const axiosInstance = axios.create({ baseURL });
  
  // Set default isFailure function if not provided
  if (!options.isFailure) {
    options.isFailure = isFailureByDefault;
  }
  
  // Wrap with circuit breaker
  return createCircuitBreakerAxios(axiosInstance, options);
}

/**
 * Type definition for an Axios instance with circuit breaker functionality
 */
export interface CircuitBreakerAxiosInstance extends AxiosInstance {
  circuitBreaker: {
    /** Gets the current state of the circuit breaker */
    getState: () => CircuitState;
    /** Gets detailed state information about the circuit breaker */
    getStateDetails: () => Readonly<CircuitBreakerState>;
    /** Manually resets the circuit breaker to closed state */
    reset: () => void;
    /** Manually opens the circuit breaker */
    trip: () => void;
  };
}