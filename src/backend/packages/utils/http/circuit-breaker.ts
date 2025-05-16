/**
 * Circuit Breaker pattern implementation for HTTP requests
 * 
 * This module provides a circuit breaker implementation for Axios HTTP clients
 * to prevent cascading failures during service outages. The circuit breaker
 * tracks failure rates and automatically stops sending requests to failing
 * services when thresholds are exceeded, gradually allowing traffic again
 * after a cooling period.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ExternalDependencyUnavailableError } from '@austa/errors';

/**
 * Circuit states
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
  /** Number of failures before opening the circuit (default: 5) */
  failureThreshold?: number;
  /** Time in milliseconds before attempting to close the circuit (default: 30000) */
  resetTimeout?: number;
  /** Time in milliseconds between circuit state checks (default: 5000) */
  monitorInterval?: number;
  /** Custom function to determine if a response is considered a failure */
  isFailure?: (error: any) => boolean;
  /** Optional callback for circuit state changes */
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

/**
 * Circuit breaker statistics
 */
export interface CircuitStats {
  /** Current state of the circuit */
  state: CircuitState;
  /** Number of failures since last reset */
  failures: number;
  /** Total number of requests processed */
  totalRequests: number;
  /** Total number of successful requests */
  successfulRequests: number;
  /** Total number of failed requests */
  failedRequests: number;
  /** Timestamp of last state change */
  lastStateChange: Date;
  /** Timestamp of last failure */
  lastFailure: Date | null;
  /** Timestamp of last success */
  lastSuccess: Date | null;
}

/**
 * Default circuit breaker options
 */
const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitorInterval: 5000, // 5 seconds
  isFailure: (error: any) => !!error,
  onStateChange: () => {}
};

/**
 * Creates an Axios instance wrapped with circuit breaker functionality
 * 
 * @param axiosInstance - The Axios instance to wrap
 * @param options - Circuit breaker configuration options
 * @returns Axios instance with circuit breaker functionality
 */
export function createCircuitBreakerAxios(
  axiosInstance: AxiosInstance,
  options: CircuitBreakerOptions = {}
): AxiosInstance {
  const opts: Required<CircuitBreakerOptions> = { ...DEFAULT_OPTIONS, ...options };
  
  // Circuit state and counters
  let state: CircuitState = CircuitState.CLOSED;
  let failures = 0;
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let lastStateChange = new Date();
  let lastFailure: Date | null = null;
  let lastSuccess: Date | null = null;
  let resetTimer: NodeJS.Timeout | null = null;
  
  // Create monitoring interval
  const monitorInterval = setInterval(() => {
    // If circuit is open and reset timeout has passed, transition to half-open
    if (state === CircuitState.OPEN && 
        lastStateChange && 
        (Date.now() - lastStateChange.getTime() >= opts.resetTimeout)) {
      changeState(CircuitState.HALF_OPEN);
    }
  }, opts.monitorInterval);
  
  /**
   * Changes the circuit state and triggers the onStateChange callback
   */
  function changeState(newState: CircuitState): void {
    const oldState = state;
    state = newState;
    lastStateChange = new Date();
    
    // Reset failure counter when closing the circuit
    if (newState === CircuitState.CLOSED) {
      failures = 0;
    }
    
    // Call the state change callback
    opts.onStateChange(oldState, newState);
  }
  
  /**
   * Records a successful request and updates circuit state if needed
   */
  function recordSuccess(): void {
    successfulRequests++;
    lastSuccess = new Date();
    
    // If in half-open state and request succeeded, close the circuit
    if (state === CircuitState.HALF_OPEN) {
      changeState(CircuitState.CLOSED);
    }
  }
  
  /**
   * Records a failed request and updates circuit state if needed
   */
  function recordFailure(): void {
    failures++;
    failedRequests++;
    lastFailure = new Date();
    
    // If failures exceed threshold, open the circuit
    if (state === CircuitState.CLOSED && failures >= opts.failureThreshold) {
      changeState(CircuitState.OPEN);
    }
    
    // If in half-open state and request failed, reopen the circuit
    if (state === CircuitState.HALF_OPEN) {
      changeState(CircuitState.OPEN);
    }
  }
  
  /**
   * Returns current circuit statistics
   */
  function getStats(): CircuitStats {
    return {
      state,
      failures,
      totalRequests,
      successfulRequests,
      failedRequests,
      lastStateChange,
      lastFailure,
      lastSuccess
    };
  }
  
  // Create a new Axios instance that wraps the provided instance
  const circuitBreakerInstance = axios.create();
  
  // Override the request method to implement circuit breaking
  circuitBreakerInstance.request = async function<T = any, R = AxiosResponse<T>>(
    config: AxiosRequestConfig
  ): Promise<R> {
    totalRequests++;
    
    // If circuit is open, fail fast without making the request
    if (state === CircuitState.OPEN) {
      const error = new ExternalDependencyUnavailableError(
        `Circuit breaker is open for ${config.url}`,
        {
          url: config.url,
          circuitState: state,
          lastStateChange,
          resetTimeout: opts.resetTimeout
        }
      );
      return Promise.reject(error);
    }
    
    try {
      // Forward the request to the wrapped Axios instance
      const response = await axiosInstance.request<T, R>(config);
      recordSuccess();
      return response;
    } catch (error) {
      // Check if this error should count as a failure
      if (opts.isFailure(error)) {
        recordFailure();
      }
      return Promise.reject(error);
    }
  };
  
  // Add circuit breaker methods to the instance
  (circuitBreakerInstance as any).getCircuitBreakerStats = getStats;
  (circuitBreakerInstance as any).resetCircuitBreaker = () => {
    changeState(CircuitState.CLOSED);
  };
  
  // Clean up resources when the instance is no longer needed
  (circuitBreakerInstance as any).destroyCircuitBreaker = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
    if (resetTimer) {
      clearTimeout(resetTimer);
    }
  };
  
  return circuitBreakerInstance;
}

/**
 * Creates an Axios instance with circuit breaker functionality
 * 
 * @param config - Axios configuration
 * @param options - Circuit breaker configuration options
 * @returns Axios instance with circuit breaker functionality
 */
export function createCircuitBreaker(
  config: AxiosRequestConfig = {},
  options: CircuitBreakerOptions = {}
): AxiosInstance {
  const axiosInstance = axios.create(config);
  return createCircuitBreakerAxios(axiosInstance, options);
}