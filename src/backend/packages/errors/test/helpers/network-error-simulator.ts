/**
 * Network Error Simulator
 * 
 * Provides utilities to simulate various network and external system errors for testing
 * resilience patterns. This module includes functions to generate timeouts, connection failures,
 * malformed responses, and other error conditions that services might encounter when
 * communicating with external systems.
 * 
 * It enables testing of retry mechanisms, circuit breakers, fallback strategies, and
 * graceful degradation.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { ExternalApiError, ExternalDependencyUnavailableError, ExternalRateLimitError, ExternalAuthenticationError, ExternalResponseFormatError } from '../../src/categories/external.errors';
import { TimeoutError } from '../../src/categories/technical.errors';

/**
 * Configuration options for the network error simulator
 */
export interface NetworkErrorSimulatorConfig {
  /** Delay in ms before responding (simulates latency) */
  delay?: number;
  /** Number of consecutive failures before success */
  failureCount?: number;
  /** Custom status code for error responses */
  statusCode?: number;
  /** Custom error message */
  errorMessage?: string;
  /** Custom headers for responses */
  headers?: Record<string, string>;
  /** Whether to include the original request in error objects */
  includeRequest?: boolean;
}

/**
 * Default configuration for the network error simulator
 */
const DEFAULT_CONFIG: NetworkErrorSimulatorConfig = {
  delay: 0,
  failureCount: 1,
  statusCode: 500,
  errorMessage: 'Simulated network error',
  headers: {},
  includeRequest: true,
};

/**
 * Creates a network error simulator for testing resilience patterns
 * @param axiosInstance Optional axios instance to mock (creates a new one if not provided)
 * @param config Configuration options for the simulator
 * @returns An object with methods to simulate various network errors
 */
export function createNetworkErrorSimulator(axiosInstance?: AxiosInstance, config: NetworkErrorSimulatorConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const instance = axiosInstance || axios.create();
  const mock = new MockAdapter(instance, { delayResponse: mergedConfig.delay });
  
  // Track request counts for simulating intermittent failures
  const requestCounts: Record<string, number> = {};
  
  /**
   * Resets the mock adapter and request counts
   */
  function reset() {
    mock.reset();
    Object.keys(requestCounts).forEach(key => {
      requestCounts[key] = 0;
    });
  }
  
  /**
   * Restores the original axios adapter (removes mocking)
   */
  function restore() {
    mock.restore();
  }
  
  /**
   * Simulates a network timeout for the specified URL pattern
   * @param urlPattern URL pattern to match for timeout simulation
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateTimeout(urlPattern: string, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:timeout`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(config: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (config.failureCount || mergedConfig.failureCount!)) {
        return [0, null, { 'x-simulated-error': 'timeout' }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    // Override axios adapter to simulate timeout
    const originalAdapter = instance.defaults.adapter;
    instance.defaults.adapter = function(config: AxiosRequestConfig) {
      if (new RegExp(urlPattern).test(config.url || '')) {
        if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
          return new Promise((_, reject) => {
            const timeoutDuration = customConfig.delay || mergedConfig.delay || 1000;
            setTimeout(() => {
              const error = new TimeoutError(
                `Request timeout after ${timeoutDuration}ms`,
                { url: config.url, method: config.method, timeout: timeoutDuration }
              );
              reject(error);
            }, timeoutDuration);
          });
        }
      }
      
      // Use the original adapter for non-matching requests
      return originalAdapter ? originalAdapter(config) : Promise.reject(new Error('No adapter available'));
    };
    
    return instance;
  }
  
  /**
   * Simulates a network connection error for the specified URL pattern
   * @param urlPattern URL pattern to match for connection error simulation
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateConnectionError(urlPattern: string, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:connection`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(config: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
        return [0, null, { 'x-simulated-error': 'connection' }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    // Override axios adapter to simulate connection error
    const originalAdapter = instance.defaults.adapter;
    instance.defaults.adapter = function(config: AxiosRequestConfig) {
      if (new RegExp(urlPattern).test(config.url || '')) {
        if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
          return new Promise((_, reject) => {
            setTimeout(() => {
              const error = new ExternalDependencyUnavailableError(
                customConfig.errorMessage || 'Connection refused',
                { url: config.url, method: config.method }
              );
              reject(error);
            }, customConfig.delay || mergedConfig.delay || 0);
          });
        }
      }
      
      // Use the original adapter for non-matching requests
      return originalAdapter ? originalAdapter(config) : Promise.reject(new Error('No adapter available'));
    };
    
    return instance;
  }
  
  /**
   * Simulates an HTTP error response for the specified URL pattern
   * @param urlPattern URL pattern to match for HTTP error simulation
   * @param statusCode HTTP status code to return
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateHttpError(urlPattern: string, statusCode = 500, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:http${statusCode}`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(axiosConfig: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
        const errorBody = {
          error: true,
          message: customConfig.errorMessage || `Simulated ${statusCode} error`,
          code: `ERR_HTTP_${statusCode}`,
          request: config.includeRequest ? {
            url: axiosConfig.url,
            method: axiosConfig.method,
            headers: axiosConfig.headers
          } : undefined
        };
        
        return [statusCode, errorBody, { 'x-simulated-error': 'http', ...config.headers }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    return instance;
  }
  
  /**
   * Simulates a rate limit error for the specified URL pattern
   * @param urlPattern URL pattern to match for rate limit simulation
   * @param retryAfterSeconds Seconds until retry is allowed
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateRateLimitError(urlPattern: string, retryAfterSeconds = 60, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:ratelimit`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(axiosConfig: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
        const errorBody = {
          error: true,
          message: customConfig.errorMessage || 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfterSeconds,
          request: config.includeRequest ? {
            url: axiosConfig.url,
            method: axiosConfig.method,
            headers: axiosConfig.headers
          } : undefined
        };
        
        return [429, errorBody, { 
          'x-simulated-error': 'ratelimit',
          'retry-after': String(retryAfterSeconds),
          ...config.headers 
        }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    // Override axios adapter to throw a proper rate limit error
    const originalAdapter = instance.defaults.adapter;
    instance.defaults.adapter = function(config: AxiosRequestConfig) {
      if (new RegExp(urlPattern).test(config.url || '')) {
        if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
          return originalAdapter ? originalAdapter(config).catch((error) => {
            if (error.response && error.response.status === 429) {
              throw new ExternalRateLimitError(
                customConfig.errorMessage || 'Rate limit exceeded',
                { 
                  url: config.url, 
                  method: config.method,
                  retryAfter: retryAfterSeconds,
                  statusCode: 429
                }
              );
            }
            throw error;
          }) : Promise.reject(new Error('No adapter available'));
        }
      }
      
      // Use the original adapter for non-matching requests
      return originalAdapter ? originalAdapter(config) : Promise.reject(new Error('No adapter available'));
    };
    
    return instance;
  }
  
  /**
   * Simulates an authentication error for the specified URL pattern
   * @param urlPattern URL pattern to match for auth error simulation
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateAuthError(urlPattern: string, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:auth`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(axiosConfig: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
        const errorBody = {
          error: true,
          message: customConfig.errorMessage || 'Authentication failed',
          code: 'AUTHENTICATION_FAILED',
          request: config.includeRequest ? {
            url: axiosConfig.url,
            method: axiosConfig.method,
            headers: axiosConfig.headers
          } : undefined
        };
        
        return [401, errorBody, { 'x-simulated-error': 'auth', ...config.headers }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    // Override axios adapter to throw a proper auth error
    const originalAdapter = instance.defaults.adapter;
    instance.defaults.adapter = function(config: AxiosRequestConfig) {
      if (new RegExp(urlPattern).test(config.url || '')) {
        if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
          return originalAdapter ? originalAdapter(config).catch((error) => {
            if (error.response && error.response.status === 401) {
              throw new ExternalAuthenticationError(
                customConfig.errorMessage || 'Authentication failed',
                { 
                  url: config.url, 
                  method: config.method,
                  statusCode: 401
                }
              );
            }
            throw error;
          }) : Promise.reject(new Error('No adapter available'));
        }
      }
      
      // Use the original adapter for non-matching requests
      return originalAdapter ? originalAdapter(config) : Promise.reject(new Error('No adapter available'));
    };
    
    return instance;
  }
  
  /**
   * Simulates a malformed response for the specified URL pattern
   * @param urlPattern URL pattern to match for malformed response simulation
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function simulateMalformedResponse(urlPattern: string, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:malformed`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(axiosConfig: AxiosRequestConfig) {
      requestCounts[key]++;
      
      if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
        // Return invalid JSON or truncated response
        return [200, '{"data":"incomplete', { 'content-type': 'application/json', 'x-simulated-error': 'malformed', ...config.headers }];
      }
      
      // After failureCount failures, succeed with a 200 response
      return [200, { success: true, recovered: true }, { 'x-simulated-recovery': 'true' }];
    });
    
    // Override axios adapter to throw a proper format error
    const originalAdapter = instance.defaults.adapter;
    instance.defaults.adapter = function(config: AxiosRequestConfig) {
      if (new RegExp(urlPattern).test(config.url || '')) {
        if (requestCounts[key] <= (customConfig.failureCount || mergedConfig.failureCount!)) {
          return originalAdapter ? originalAdapter(config).catch((error) => {
            throw new ExternalResponseFormatError(
              customConfig.errorMessage || 'Malformed response received',
              { 
                url: config.url, 
                method: config.method,
                responseData: '{"data":"incomplete'
              }
            );
          }) : Promise.reject(new Error('No adapter available'));
        }
      }
      
      // Use the original adapter for non-matching requests
      return originalAdapter ? originalAdapter(config) : Promise.reject(new Error('No adapter available'));
    };
    
    return instance;
  }
  
  /**
   * Creates a factory function that generates intermittent failures
   * @param urlPattern URL pattern to match
   * @param failureType Type of failure to simulate
   * @param failureRate Probability of failure (0-1)
   * @param method HTTP method to match (defaults to any method)
   * @param customConfig Custom configuration for this specific simulation
   */
  function createIntermittentFailureFactory(urlPattern: string, failureType: 'timeout' | 'connection' | 'http' | 'ratelimit' | 'auth' | 'malformed', failureRate = 0.5, method = 'any', customConfig: Partial<NetworkErrorSimulatorConfig> = {}) {
    const config = { ...mergedConfig, ...customConfig };
    const key = `${method}:${urlPattern}:intermittent:${failureType}`;
    requestCounts[key] = 0;
    
    mock.onAny(new RegExp(urlPattern)).reply(function(axiosConfig: AxiosRequestConfig) {
      requestCounts[key]++;
      
      // Randomly determine if this request should fail
      const shouldFail = Math.random() < failureRate;
      
      if (shouldFail) {
        switch (failureType) {
          case 'timeout':
            return [0, null, { 'x-simulated-error': 'timeout' }];
          case 'connection':
            return [0, null, { 'x-simulated-error': 'connection' }];
          case 'http':
            return [config.statusCode || 500, { error: true, message: config.errorMessage }, { 'x-simulated-error': 'http' }];
          case 'ratelimit':
            return [429, { error: true, message: 'Rate limit exceeded' }, { 'retry-after': '60', 'x-simulated-error': 'ratelimit' }];
          case 'auth':
            return [401, { error: true, message: 'Authentication failed' }, { 'x-simulated-error': 'auth' }];
          case 'malformed':
            return [200, '{"data":"incomplete', { 'content-type': 'application/json', 'x-simulated-error': 'malformed' }];
          default:
            return [500, { error: true, message: 'Unknown error' }, { 'x-simulated-error': 'unknown' }];
        }
      }
      
      // Success response
      return [200, { success: true }, {}];
    });
    
    return instance;
  }
  
  /**
   * Creates a test helper for retry mechanism testing
   * @param maxRetries Maximum number of retries to simulate
   * @param successOnRetry Which retry attempt should succeed (0-based index)
   * @param errorFactory Function that generates the error for failed attempts
   */
  function createRetryTestHelper(maxRetries: number, successOnRetry: number, errorFactory: (attempt: number) => Error) {
    return {
      /**
       * Executes a function with the simulated retry behavior
       * @param fn Function to execute with retry behavior
       * @returns Promise that resolves when the function succeeds or rejects after max retries
       */
      execute: async <T>(fn: () => Promise<T>): Promise<T> => {
        let attempts = 0;
        
        while (attempts <= maxRetries) {
          try {
            if (attempts === successOnRetry) {
              return await fn();
            }
            throw errorFactory(attempts);
          } catch (error) {
            attempts++;
            if (attempts > maxRetries) {
              throw error;
            }
          }
        }
        
        throw new Error('Max retries exceeded');
      },
      
      /**
       * Gets the current attempt count
       */
      getAttemptCount: () => requestCounts
    };
  }
  
  /**
   * Creates a circuit breaker test helper
   * @param failureThreshold Number of failures before circuit opens
   * @param resetTimeout Time in ms before circuit transitions to half-open
   */
  function createCircuitBreakerTestHelper(failureThreshold: number, resetTimeout: number) {
    let failures = 0;
    let circuitOpen = false;
    let lastFailureTime = 0;
    
    return {
      /**
       * Executes a function with circuit breaker behavior
       * @param fn Function to execute with circuit breaker protection
       * @param fallback Optional fallback function to call when circuit is open
       * @returns Promise that resolves with the function result or fallback result
       */
      execute: async <T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> => {
        // Check if circuit is open
        if (circuitOpen) {
          // Check if we should try half-open state
          const now = Date.now();
          if (now - lastFailureTime >= resetTimeout) {
            // Try half-open state
            try {
              const result = await fn();
              // Success, close the circuit
              circuitOpen = false;
              failures = 0;
              return result;
            } catch (error) {
              // Failed again, keep circuit open and reset timer
              lastFailureTime = now;
              if (fallback) {
                return fallback();
              }
              throw error;
            }
          }
          
          // Circuit is open and not ready for half-open yet
          if (fallback) {
            return fallback();
          }
          throw new Error('Circuit is open');
        }
        
        // Circuit is closed, try to execute
        try {
          const result = await fn();
          // Success, reset failure count
          failures = 0;
          return result;
        } catch (error) {
          // Increment failure count
          failures++;
          lastFailureTime = Date.now();
          
          // Check if we should open the circuit
          if (failures >= failureThreshold) {
            circuitOpen = true;
          }
          
          // If we have a fallback and circuit is now open, use it
          if (circuitOpen && fallback) {
            return fallback();
          }
          
          throw error;
        }
      },
      
      /**
       * Gets the current circuit state
       * @returns Object with circuit state information
       */
      getState: () => ({
        isOpen: circuitOpen,
        failures,
        lastFailureTime,
        halfOpenEligible: circuitOpen && (Date.now() - lastFailureTime >= resetTimeout)
      }),
      
      /**
       * Manually resets the circuit breaker state
       */
      reset: () => {
        failures = 0;
        circuitOpen = false;
        lastFailureTime = 0;
      }
    };
  }
  
  return {
    instance,
    mock,
    reset,
    restore,
    simulateTimeout,
    simulateConnectionError,
    simulateHttpError,
    simulateRateLimitError,
    simulateAuthError,
    simulateMalformedResponse,
    createIntermittentFailureFactory,
    createRetryTestHelper,
    createCircuitBreakerTestHelper,
    getRequestCounts: () => ({ ...requestCounts }),
  };
}

/**
 * Creates a factory for generating external system errors with configurable properties
 */
export function createExternalErrorFactory() {
  return {
    /**
     * Creates a timeout error
     * @param message Custom error message
     * @param context Additional context for the error
     */
    createTimeoutError: (message = 'Request timed out', context = {}) => {
      return new TimeoutError(message, context);
    },
    
    /**
     * Creates a connection error
     * @param message Custom error message
     * @param context Additional context for the error
     */
    createConnectionError: (message = 'Connection failed', context = {}) => {
      return new ExternalDependencyUnavailableError(message, context);
    },
    
    /**
     * Creates an API error
     * @param statusCode HTTP status code
     * @param message Custom error message
     * @param context Additional context for the error
     */
    createApiError: (statusCode = 500, message = 'API request failed', context = {}) => {
      return new ExternalApiError(message, { statusCode, ...context });
    },
    
    /**
     * Creates a rate limit error
     * @param retryAfter Seconds until retry is allowed
     * @param message Custom error message
     * @param context Additional context for the error
     */
    createRateLimitError: (retryAfter = 60, message = 'Rate limit exceeded', context = {}) => {
      return new ExternalRateLimitError(message, { retryAfter, ...context });
    },
    
    /**
     * Creates an authentication error
     * @param message Custom error message
     * @param context Additional context for the error
     */
    createAuthError: (message = 'Authentication failed', context = {}) => {
      return new ExternalAuthenticationError(message, context);
    },
    
    /**
     * Creates a malformed response error
     * @param message Custom error message
     * @param responseData The malformed response data
     * @param context Additional context for the error
     */
    createMalformedResponseError: (message = 'Malformed response', responseData = '{}', context = {}) => {
      return new ExternalResponseFormatError(message, { responseData, ...context });
    }
  };
}

/**
 * Helper function to simulate a successful response after a specified number of failures
 * @param fn Function to execute that may fail
 * @param maxRetries Maximum number of retries
 * @param successOnRetry Which retry attempt should succeed (0-based index)
 * @returns Promise that resolves when the function succeeds or rejects after max retries
 */
export async function simulateSuccessAfterFailures<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  successOnRetry: number
): Promise<T> {
  const retryHelper = createNetworkErrorSimulator().createRetryTestHelper(
    maxRetries,
    successOnRetry,
    (attempt) => new Error(`Simulated failure on attempt ${attempt}`)
  );
  
  return retryHelper.execute(fn);
}

/**
 * Helper function to test exponential backoff retry mechanisms
 * @param fn Function to execute with retry
 * @param maxRetries Maximum number of retries
 * @param baseDelayMs Base delay in milliseconds
 * @param successOnRetry Which retry attempt should succeed (0-based index)
 * @returns Promise that resolves when the function succeeds or rejects after max retries
 */
export async function testExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
  successOnRetry: number
): Promise<{ result: T, attempts: number, totalDelayMs: number }> {
  let attempts = 0;
  let totalDelayMs = 0;
  
  while (attempts <= maxRetries) {
    try {
      if (attempts === successOnRetry) {
        const result = await fn();
        return { result, attempts: attempts + 1, totalDelayMs };
      }
      
      // Simulate failure
      throw new Error(`Simulated failure on attempt ${attempts}`);
    } catch (error) {
      attempts++;
      
      if (attempts > maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delayMs = baseDelayMs * Math.pow(2, attempts - 1);
      totalDelayMs += delayMs;
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Helper function to test circuit breaker patterns
 * @param fn Function to execute with circuit breaker protection
 * @param failureThreshold Number of failures before circuit opens
 * @param resetTimeoutMs Time in ms before circuit transitions to half-open
 * @param fallback Optional fallback function to call when circuit is open
 * @returns Circuit breaker test helper
 */
export function testCircuitBreaker<T>(
  fn: () => Promise<T>,
  failureThreshold: number,
  resetTimeoutMs: number,
  fallback?: () => Promise<T>
) {
  const circuitBreaker = createNetworkErrorSimulator().createCircuitBreakerTestHelper(
    failureThreshold,
    resetTimeoutMs
  );
  
  return {
    execute: () => circuitBreaker.execute(fn, fallback),
    getState: () => circuitBreaker.getState(),
    reset: () => circuitBreaker.reset()
  };
}

export default {
  createNetworkErrorSimulator,
  createExternalErrorFactory,
  simulateSuccessAfterFailures,
  testExponentialBackoff,
  testCircuitBreaker
};