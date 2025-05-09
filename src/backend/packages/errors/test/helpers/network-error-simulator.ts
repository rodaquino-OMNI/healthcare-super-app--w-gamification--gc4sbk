/**
 * @file network-error-simulator.ts
 * @description Provides utilities to simulate various network and external system errors for testing resilience patterns.
 * This module includes functions to generate timeouts, connection failures, malformed responses, and other error conditions
 * that services might encounter when communicating with external systems.
 */

import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import {
  ExternalError,
  ExternalApiError,
  ExternalDependencyUnavailableError,
  ExternalAuthenticationError,
  ExternalResponseFormatError,
  ExternalRateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  JourneyContext,
  ErrorContext
} from '../../src';
import { EXTERNAL_API_RETRY_CONFIG } from '../../src/constants';

/**
 * Configuration options for network error simulation
 */
export interface NetworkErrorSimulatorOptions {
  /**
   * The name of the service to simulate errors for
   */
  serviceName: string;
  
  /**
   * The journey context (health, care, plan) for the simulated errors
   */
  journeyContext?: JourneyContext;
  
  /**
   * Additional context information to include in the errors
   */
  errorContext?: ErrorContext;
  
  /**
   * The probability (0-1) of generating an error for each request
   */
  errorProbability?: number;
  
  /**
   * The types of errors to simulate
   */
  errorTypes?: NetworkErrorType[];
  
  /**
   * Whether to include detailed information in the errors
   */
  includeDetails?: boolean;
}

/**
 * Types of network errors that can be simulated
 */
export enum NetworkErrorType {
  TIMEOUT = 'timeout',
  CONNECTION_ERROR = 'connection_error',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION_ERROR = 'authentication_error',
  SERVER_ERROR = 'server_error',
  MALFORMED_RESPONSE = 'malformed_response',
  SERVICE_UNAVAILABLE = 'service_unavailable'
}

/**
 * Configuration for circuit breaker testing
 */
export interface CircuitBreakerTestConfig {
  /**
   * The number of failures required to trip the circuit breaker
   */
  failureThreshold: number;
  
  /**
   * The time in milliseconds that the circuit breaker stays open
   */
  resetTimeoutMs: number;
  
  /**
   * The types of errors to generate when the circuit is closed
   */
  errorTypes: NetworkErrorType[];
  
  /**
   * The error to generate when the circuit is open
   */
  circuitOpenError?: ExternalError;
}

/**
 * Base class for simulating network errors in tests
 */
export class NetworkErrorSimulator {
  private options: Required<NetworkErrorSimulatorOptions>;
  private requestCount = 0;
  private failureCount = 0;
  
  /**
   * Creates a new NetworkErrorSimulator instance
   * 
   * @param options - Configuration options for the simulator
   */
  constructor(options: NetworkErrorSimulatorOptions) {
    this.options = {
      serviceName: options.serviceName,
      journeyContext: options.journeyContext || JourneyContext.SYSTEM,
      errorContext: options.errorContext || {},
      errorProbability: options.errorProbability ?? 1.0, // Default to always generating errors
      errorTypes: options.errorTypes || Object.values(NetworkErrorType),
      includeDetails: options.includeDetails ?? true
    };
  }
  
  /**
   * Simulates a network error based on the configured options
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @returns A simulated error
   */
  simulateError(requestConfig?: AxiosRequestConfig): Error {
    this.requestCount++;
    
    // Check if we should generate an error based on probability
    if (Math.random() > this.options.errorProbability) {
      return new Error('No error simulated due to probability settings');
    }
    
    this.failureCount++;
    
    // Randomly select an error type from the configured options
    const errorTypes = this.options.errorTypes;
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    
    return this.createErrorByType(errorType, requestConfig);
  }
  
  /**
   * Creates a specific type of network error
   * 
   * @param errorType - The type of error to create
   * @param requestConfig - The Axios request configuration (optional)
   * @returns A simulated error of the specified type
   */
  createErrorByType(errorType: NetworkErrorType, requestConfig?: AxiosRequestConfig): Error {
    const { serviceName, journeyContext, errorContext, includeDetails } = this.options;
    const context = { ...errorContext, journey: journeyContext };
    
    switch (errorType) {
      case NetworkErrorType.TIMEOUT:
        return this.createTimeoutError(requestConfig, context);
        
      case NetworkErrorType.CONNECTION_ERROR:
        return this.createConnectionError(requestConfig, context);
        
      case NetworkErrorType.RATE_LIMIT:
        return this.createRateLimitError(requestConfig, context);
        
      case NetworkErrorType.AUTHENTICATION_ERROR:
        return this.createAuthenticationError(requestConfig, context);
        
      case NetworkErrorType.SERVER_ERROR:
        return this.createServerError(requestConfig, context);
        
      case NetworkErrorType.MALFORMED_RESPONSE:
        return this.createMalformedResponseError(requestConfig, context);
        
      case NetworkErrorType.SERVICE_UNAVAILABLE:
        return this.createServiceUnavailableError(requestConfig, context);
        
      default:
        return new ExternalError(
          `Unhandled error type: ${errorType}`,
          'UNKNOWN_ERROR',
          serviceName,
          context
        );
    }
  }
  
  /**
   * Creates a timeout error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated timeout error
   */
  createTimeoutError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    const url = requestConfig?.url || 'unknown-endpoint';
    const method = requestConfig?.method?.toUpperCase() || 'GET';
    const timeout = requestConfig?.timeout || 30000;
    
    // Create a TimeoutError
    const timeoutError = TimeoutError.apiTimeout(
      serviceName,
      url,
      timeout,
      context
    );
    
    // Create an AxiosError for timeout
    const axiosError = new AxiosError(
      'timeout of ' + timeout + 'ms exceeded',
      'ECONNABORTED',
      requestConfig
    );
    
    // Wrap the Axios error with our custom error
    return timeoutError.withCause(axiosError);
  }
  
  /**
   * Creates a connection error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated connection error
   */
  createConnectionError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    
    // Create an ExternalDependencyUnavailableError
    const connectionError = new ExternalDependencyUnavailableError(
      `Failed to connect to ${serviceName}`,
      serviceName,
      'api',
      context,
      undefined,
      undefined,
      includeDetails ? { request: requestConfig } : undefined
    );
    
    // Create an AxiosError for connection failure
    const axiosError = new AxiosError(
      'connect ECONNREFUSED',
      'ECONNREFUSED',
      requestConfig
    );
    
    // Wrap the Axios error with our custom error
    return connectionError.withCause(axiosError);
  }
  
  /**
   * Creates a rate limit error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated rate limit error
   */
  createRateLimitError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    const retryAfter = Math.floor(Math.random() * 30) + 5; // Random retry-after between 5-35 seconds
    
    // Create a mock response
    const response: Partial<AxiosResponse> = {
      status: HttpStatus.TOO_MANY_REQUESTS,
      statusText: 'Too Many Requests',
      headers: {
        'retry-after': `${retryAfter}`,
        'x-ratelimit-limit': '100',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': `${Math.floor(Date.now() / 1000) + retryAfter}`
      },
      data: {
        error: 'rate_limit_exceeded',
        message: 'API rate limit exceeded',
        retry_after: retryAfter
      }
    };
    
    // Create an ExternalRateLimitError
    const rateLimitError = new ExternalRateLimitError(
      `Rate limit exceeded for ${serviceName}`,
      serviceName,
      retryAfter,
      '100 requests per minute',
      context,
      HttpStatus.TOO_MANY_REQUESTS,
      includeDetails ? response.data : undefined
    );
    
    // Create an AxiosError for rate limiting
    const axiosError = new AxiosError(
      'Request failed with status code 429',
      'ERR_BAD_RESPONSE',
      requestConfig,
      undefined,
      response as AxiosResponse
    );
    
    // Wrap the Axios error with our custom error
    return rateLimitError.withCause(axiosError);
  }
  
  /**
   * Creates an authentication error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated authentication error
   */
  createAuthenticationError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    const authMethods = ['api_key', 'oauth', 'jwt', 'basic'];
    const authMethod = authMethods[Math.floor(Math.random() * authMethods.length)];
    
    // Create a mock response
    const response: Partial<AxiosResponse> = {
      status: HttpStatus.UNAUTHORIZED,
      statusText: 'Unauthorized',
      headers: {},
      data: {
        error: 'invalid_token',
        error_description: 'The access token provided is expired, revoked, or invalid'
      }
    };
    
    // Create an ExternalAuthenticationError
    const authError = new ExternalAuthenticationError(
      `Authentication failed with ${serviceName}`,
      serviceName,
      authMethod,
      context,
      HttpStatus.UNAUTHORIZED,
      includeDetails ? response.data : undefined
    );
    
    // Create an AxiosError for authentication failure
    const axiosError = new AxiosError(
      'Request failed with status code 401',
      'ERR_BAD_RESPONSE',
      requestConfig,
      undefined,
      response as AxiosResponse
    );
    
    // Wrap the Axios error with our custom error
    return authError.withCause(axiosError);
  }
  
  /**
   * Creates a server error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated server error
   */
  createServerError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    const serverErrorCodes = [500, 502, 503, 504];
    const statusCode = serverErrorCodes[Math.floor(Math.random() * serverErrorCodes.length)];
    
    // Create a mock response
    const response: Partial<AxiosResponse> = {
      status: statusCode,
      statusText: getStatusTextForCode(statusCode),
      headers: {},
      data: {
        error: 'server_error',
        message: 'An unexpected error occurred'
      }
    };
    
    // Create an ExternalApiError
    const serverError = new ExternalApiError(
      `${serviceName} returned an error: ${response.statusText}`,
      serviceName,
      context,
      statusCode,
      requestConfig?.method?.toUpperCase() || 'GET',
      requestConfig?.url || 'unknown-endpoint',
      includeDetails ? response.data : undefined
    );
    
    // Create an AxiosError for server error
    const axiosError = new AxiosError(
      `Request failed with status code ${statusCode}`,
      'ERR_BAD_RESPONSE',
      requestConfig,
      undefined,
      response as AxiosResponse
    );
    
    // Wrap the Axios error with our custom error
    return serverError.withCause(axiosError);
  }
  
  /**
   * Creates a malformed response error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated malformed response error
   */
  createMalformedResponseError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    
    // Create a mock response with malformed data
    const response: Partial<AxiosResponse> = {
      status: HttpStatus.OK,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: '{"malformed":JSON"data":true}' // Intentionally malformed JSON
    };
    
    // Create an ExternalResponseFormatError
    const formatError = new ExternalResponseFormatError(
      `Received malformed response from ${serviceName}`,
      serviceName,
      'application/json',
      includeDetails ? 'Invalid JSON format' : undefined,
      context,
      HttpStatus.OK,
      includeDetails ? response.data : undefined
    );
    
    // Create a SyntaxError for JSON parsing
    const syntaxError = new SyntaxError('Unexpected token J in JSON at position 12');
    
    // Wrap the syntax error with our custom error
    return formatError.withCause(syntaxError);
  }
  
  /**
   * Creates a service unavailable error
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param context - Additional context information
   * @returns A simulated service unavailable error
   */
  createServiceUnavailableError(requestConfig?: AxiosRequestConfig, context: ErrorContext = {}): Error {
    const { serviceName, includeDetails } = this.options;
    
    // Create a mock response
    const response: Partial<AxiosResponse> = {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      statusText: 'Service Unavailable',
      headers: {},
      data: {
        error: 'service_unavailable',
        message: 'Service is temporarily unavailable',
        retry_after: 60
      }
    };
    
    // Create a ServiceUnavailableError
    const unavailableError = ServiceUnavailableError.dependencyFailure(
      'client',
      serviceName,
      context,
      new ExternalApiError(
        `${serviceName} is currently unavailable`,
        serviceName,
        context,
        HttpStatus.SERVICE_UNAVAILABLE,
        requestConfig?.method?.toUpperCase() || 'GET',
        requestConfig?.url || 'unknown-endpoint',
        includeDetails ? response.data : undefined
      )
    );
    
    // Create an AxiosError for service unavailable
    const axiosError = new AxiosError(
      'Request failed with status code 503',
      'ERR_BAD_RESPONSE',
      requestConfig,
      undefined,
      response as AxiosResponse
    );
    
    // Wrap the Axios error with our custom error
    return unavailableError.withCause(axiosError);
  }
  
  /**
   * Gets the current request count
   * 
   * @returns The number of requests processed by this simulator
   */
  getRequestCount(): number {
    return this.requestCount;
  }
  
  /**
   * Gets the current failure count
   * 
   * @returns The number of failures generated by this simulator
   */
  getFailureCount(): number {
    return this.failureCount;
  }
  
  /**
   * Resets the request and failure counters
   */
  resetCounters(): void {
    this.requestCount = 0;
    this.failureCount = 0;
  }
}

/**
 * Circuit breaker simulator for testing circuit breaker patterns
 */
export class CircuitBreakerSimulator {
  private failureCount = 0;
  private circuitOpen = false;
  private lastOpenTime: number | null = null;
  private networkErrorSimulator: NetworkErrorSimulator;
  
  /**
   * Creates a new CircuitBreakerSimulator instance
   * 
   * @param config - Configuration for the circuit breaker simulator
   */
  constructor(private config: CircuitBreakerTestConfig) {
    this.networkErrorSimulator = new NetworkErrorSimulator({
      serviceName: 'circuit-breaker-test-service',
      errorTypes: config.errorTypes
    });
  }
  
  /**
   * Simulates a request through the circuit breaker
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @returns A simulated error if the circuit is open or should fail, undefined otherwise
   */
  simulateRequest(requestConfig?: AxiosRequestConfig): Error | undefined {
    // Check if the circuit is open
    if (this.isCircuitOpen()) {
      return this.config.circuitOpenError || new ServiceUnavailableError(
        'Circuit breaker is open',
        'circuit-breaker-test-service',
        'Circuit open due to too many failures',
        { circuitBreaker: true }
      );
    }
    
    // Simulate a failure
    const error = this.networkErrorSimulator.simulateError(requestConfig);
    this.failureCount++;
    
    // Check if we should open the circuit
    if (this.failureCount >= this.config.failureThreshold) {
      this.openCircuit();
    }
    
    return error;
  }
  
  /**
   * Checks if the circuit is currently open
   * 
   * @returns True if the circuit is open, false otherwise
   */
  isCircuitOpen(): boolean {
    // If the circuit is not open, return false
    if (!this.circuitOpen) {
      return false;
    }
    
    // Check if the reset timeout has elapsed
    if (this.lastOpenTime && Date.now() - this.lastOpenTime >= this.config.resetTimeoutMs) {
      this.closeCircuit();
      return false;
    }
    
    return true;
  }
  
  /**
   * Opens the circuit
   */
  openCircuit(): void {
    this.circuitOpen = true;
    this.lastOpenTime = Date.now();
  }
  
  /**
   * Closes the circuit and resets the failure count
   */
  closeCircuit(): void {
    this.circuitOpen = false;
    this.lastOpenTime = null;
    this.failureCount = 0;
  }
  
  /**
   * Manually resets the circuit breaker state
   */
  reset(): void {
    this.closeCircuit();
    this.networkErrorSimulator.resetCounters();
  }
}

/**
 * Retry testing utility for testing retry mechanisms with exponential backoff
 */
export class RetryTestingUtility {
  private attempts: number[] = [];
  private errors: Error[] = [];
  private startTime: number | null = null;
  private networkErrorSimulator: NetworkErrorSimulator;
  
  /**
   * Creates a new RetryTestingUtility instance
   * 
   * @param options - Configuration options for the network error simulator
   */
  constructor(options: NetworkErrorSimulatorOptions) {
    this.networkErrorSimulator = new NetworkErrorSimulator(options);
  }
  
  /**
   * Simulates a request that should be retried
   * 
   * @param requestConfig - The Axios request configuration (optional)
   * @param shouldSucceedOnAttempt - The attempt number that should succeed (0-based), or -1 to always fail
   * @returns A simulated error if the request should fail, undefined if it should succeed
   */
  simulateRequest(requestConfig?: AxiosRequestConfig, shouldSucceedOnAttempt: number = -1): Error | undefined {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
    
    const attemptNumber = this.attempts.length;
    this.attempts.push(Date.now() - (this.startTime || 0));
    
    // Check if this attempt should succeed
    if (shouldSucceedOnAttempt === attemptNumber) {
      return undefined;
    }
    
    // Simulate an error
    const error = this.networkErrorSimulator.simulateError(requestConfig);
    this.errors.push(error);
    return error;
  }
  
  /**
   * Gets the timing information for all retry attempts
   * 
   * @returns An array of timestamps (in milliseconds) for each attempt
   */
  getAttemptTimings(): number[] {
    return this.attempts;
  }
  
  /**
   * Gets the delays between retry attempts
   * 
   * @returns An array of delays (in milliseconds) between retry attempts
   */
  getRetryDelays(): number[] {
    const delays: number[] = [];
    for (let i = 1; i < this.attempts.length; i++) {
      delays.push(this.attempts[i] - this.attempts[i - 1]);
    }
    return delays;
  }
  
  /**
   * Gets all errors generated during retry attempts
   * 
   * @returns An array of errors generated during retry attempts
   */
  getErrors(): Error[] {
    return this.errors;
  }
  
  /**
   * Checks if the retry delays follow an exponential backoff pattern
   * 
   * @param baseDelayMs - The expected base delay in milliseconds
   * @param backoffFactor - The expected backoff factor
   * @param jitterFactor - The maximum allowed jitter as a fraction of the expected delay
   * @returns True if the delays follow an exponential backoff pattern, false otherwise
   */
  hasExponentialBackoff(baseDelayMs: number = EXTERNAL_API_RETRY_CONFIG.INITIAL_DELAY_MS, 
                        backoffFactor: number = EXTERNAL_API_RETRY_CONFIG.BACKOFF_FACTOR, 
                        jitterFactor: number = EXTERNAL_API_RETRY_CONFIG.JITTER_FACTOR): boolean {
    const delays = this.getRetryDelays();
    if (delays.length === 0) {
      return true; // No retries to check
    }
    
    for (let i = 0; i < delays.length; i++) {
      const expectedDelay = baseDelayMs * Math.pow(backoffFactor, i);
      const minDelay = expectedDelay * (1 - jitterFactor);
      const maxDelay = expectedDelay * (1 + jitterFactor);
      
      if (delays[i] < minDelay || delays[i] > maxDelay) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Resets the retry testing utility
   */
  reset(): void {
    this.attempts = [];
    this.errors = [];
    this.startTime = null;
    this.networkErrorSimulator.resetCounters();
  }
}

/**
 * Creates a function that simulates a flaky API that fails intermittently
 * 
 * @param successRate - The probability (0-1) of a successful response
 * @param errorTypes - The types of errors to generate on failure
 * @param serviceName - The name of the service to simulate
 * @returns A function that returns a promise that resolves or rejects based on the success rate
 */
export function createFlakyApiSimulator<T>(
  successRate: number,
  errorTypes: NetworkErrorType[] = [NetworkErrorType.SERVER_ERROR],
  serviceName: string = 'flaky-api'
): () => Promise<T> {
  const simulator = new NetworkErrorSimulator({
    serviceName,
    errorProbability: 1.0,
    errorTypes
  });
  
  return () => {
    return new Promise<T>((resolve, reject) => {
      if (Math.random() < successRate) {
        resolve({} as T);
      } else {
        reject(simulator.simulateError());
      }
    });
  };
}

/**
 * Creates a function that simulates an API with degrading performance over time
 * 
 * @param initialSuccessRate - The initial probability (0-1) of a successful response
 * @param degradationRate - The rate at which the success rate decreases per call
 * @param minSuccessRate - The minimum success rate
 * @param errorTypes - The types of errors to generate on failure
 * @param serviceName - The name of the service to simulate
 * @returns A function that returns a promise that resolves or rejects based on the current success rate
 */
export function createDegradingApiSimulator<T>(
  initialSuccessRate: number = 0.9,
  degradationRate: number = 0.05,
  minSuccessRate: number = 0.1,
  errorTypes: NetworkErrorType[] = [NetworkErrorType.TIMEOUT, NetworkErrorType.SERVER_ERROR],
  serviceName: string = 'degrading-api'
): () => Promise<T> {
  const simulator = new NetworkErrorSimulator({
    serviceName,
    errorProbability: 1.0,
    errorTypes
  });
  
  let currentSuccessRate = initialSuccessRate;
  
  return () => {
    return new Promise<T>((resolve, reject) => {
      if (Math.random() < currentSuccessRate) {
        resolve({} as T);
      } else {
        reject(simulator.simulateError());
      }
      
      // Degrade the success rate for the next call
      currentSuccessRate = Math.max(minSuccessRate, currentSuccessRate - degradationRate);
    });
  };
}

/**
 * Creates a function that simulates an API with a circuit breaker pattern
 * 
 * @param config - Configuration for the circuit breaker simulator
 * @returns A function that returns a promise that resolves or rejects based on the circuit breaker state
 */
export function createCircuitBreakerApiSimulator<T>(
  config: CircuitBreakerTestConfig
): () => Promise<T> {
  const simulator = new CircuitBreakerSimulator(config);
  
  return () => {
    return new Promise<T>((resolve, reject) => {
      const error = simulator.simulateRequest();
      if (error) {
        reject(error);
      } else {
        resolve({} as T);
      }
    });
  };
}

/**
 * Helper function to get the status text for an HTTP status code
 * 
 * @param statusCode - The HTTP status code
 * @returns The corresponding status text
 */
function getStatusTextForCode(statusCode: number): string {
  switch (statusCode) {
    case 200: return 'OK';
    case 201: return 'Created';
    case 204: return 'No Content';
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 502: return 'Bad Gateway';
    case 503: return 'Service Unavailable';
    case 504: return 'Gateway Timeout';
    default: return 'Unknown Status';
  }
}