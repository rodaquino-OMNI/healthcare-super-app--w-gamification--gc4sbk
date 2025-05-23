/**
 * @file HTTP Test Helpers
 * @description Provides test helper functions for HTTP utilities, including mock Axios instances,
 * request/response simulators, and SSRF testing utilities.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { HttpClientError, HttpErrorType, RetryConfig } from '../../src/http/client';
import { JourneyType } from '../../src/http/internal';
import { SSRFProtectionOptions } from '../../src/http/security';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock response configuration for simulating HTTP responses
 */
export interface MockResponseConfig {
  /** HTTP status code */
  status?: number;
  /** Response data */
  data?: any;
  /** Response headers */
  headers?: Record<string, string>;
  /** Delay in milliseconds before responding */
  delay?: number;
  /** Whether the request should fail with an error */
  shouldFail?: boolean;
  /** Error to throw if shouldFail is true */
  error?: Error | AxiosError;
}

/**
 * Default mock response configuration
 */
export const DEFAULT_MOCK_RESPONSE: MockResponseConfig = {
  status: 200,
  data: {},
  headers: { 'content-type': 'application/json' },
  delay: 0,
  shouldFail: false
};

/**
 * Creates a mock Axios instance with configurable response behavior
 * 
 * @param mockResponses - Map of URL patterns to mock responses
 * @param defaultResponse - Default response for unmatched URLs
 * @returns A mock Axios instance
 * 
 * @example
 * ```typescript
 * const mockAxios = createMockAxios({
 *   '/api/users': { status: 200, data: [{ id: 1, name: 'John' }] },
 *   '/api/error': { status: 500, shouldFail: true }
 * });
 * 
 * const response = await mockAxios.get('/api/users');
 * expect(response.data).toEqual([{ id: 1, name: 'John' }]);
 * ```
 */
export function createMockAxios(
  mockResponses: Record<string, MockResponseConfig> = {},
  defaultResponse: MockResponseConfig = DEFAULT_MOCK_RESPONSE
): AxiosInstance {
  // Create a new Axios instance
  const instance = axios.create();

  // Track interceptors for cleanup
  const interceptors: { request: number[]; response: number[] } = {
    request: [],
    response: []
  };

  // Mock the request method
  const mockRequest = jest.fn().mockImplementation(
    async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
      const url = config.url || '';
      
      // Find matching mock response
      let mockResponse: MockResponseConfig = { ...defaultResponse };
      
      // Check for exact match first
      if (mockResponses[url]) {
        mockResponse = { ...defaultResponse, ...mockResponses[url] };
      } else {
        // Check for pattern matches
        for (const pattern in mockResponses) {
          if (new RegExp(pattern).test(url)) {
            mockResponse = { ...defaultResponse, ...mockResponses[pattern] };
            break;
          }
        }
      }

      // Apply delay if specified
      if (mockResponse.delay && mockResponse.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
      }

      // If shouldFail is true, throw an error
      if (mockResponse.shouldFail) {
        if (mockResponse.error) {
          throw mockResponse.error;
        } else {
          const error = new Error('Request failed') as AxiosError;
          error.isAxiosError = true;
          error.config = config;
          error.response = {
            data: { message: 'Error response' },
            status: mockResponse.status || 500,
            statusText: 'Error',
            headers: mockResponse.headers || {},
            config
          };
          throw error;
        }
      }

      // Return successful response
      return {
        data: mockResponse.data,
        status: mockResponse.status || 200,
        statusText: mockResponse.status === 200 ? 'OK' : 'Custom Status',
        headers: mockResponse.headers || {},
        config
      };
    }
  );

  // Mock all HTTP methods
  ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
    instance[method] = jest.fn().mockImplementation(
      (url: string, configOrData?: any, config?: AxiosRequestConfig) => {
        const requestConfig: AxiosRequestConfig = {
          url,
          method: method.toUpperCase() as any
        };

        // Handle different parameter patterns for different methods
        if (method === 'get' || method === 'delete' || method === 'head' || method === 'options') {
          Object.assign(requestConfig, configOrData);
        } else {
          requestConfig.data = configOrData;
          Object.assign(requestConfig, config);
        }

        return mockRequest(requestConfig);
      }
    );
  });

  // Mock request method
  instance.request = mockRequest;

  // Add helper methods for testing
  (instance as any).mockClear = () => {
    mockRequest.mockClear();
    Object.keys(instance).forEach(key => {
      if (typeof instance[key] === 'function' && instance[key].mockClear) {
        instance[key].mockClear();
      }
    });
  };

  // Add method to update mock responses
  (instance as any).updateMockResponses = (newResponses: Record<string, MockResponseConfig>) => {
    Object.assign(mockResponses, newResponses);
  };

  // Add method to reset interceptors
  (instance as any).resetInterceptors = () => {
    interceptors.request.forEach(id => instance.interceptors.request.eject(id));
    interceptors.response.forEach(id => instance.interceptors.response.eject(id));
    interceptors.request = [];
    interceptors.response = [];
  };

  // Track interceptors
  const originalRequestUse = instance.interceptors.request.use;
  instance.interceptors.request.use = function(...args) {
    const id = originalRequestUse.apply(this, args);
    interceptors.request.push(id);
    return id;
  };

  const originalResponseUse = instance.interceptors.response.use;
  instance.interceptors.response.use = function(...args) {
    const id = originalResponseUse.apply(this, args);
    interceptors.response.push(id);
    return id;
  };

  return instance;
}

/**
 * Creates a mock HTTP client error for testing error handling
 * 
 * @param options - Error options
 * @returns A HttpClientError instance
 * 
 * @example
 * ```typescript
 * const error = createMockHttpClientError({
 *   type: HttpErrorType.SERVER_ERROR,
 *   status: 500,
 *   url: '/api/users'
 * });
 * 
 * expect(error.type).toBe(HttpErrorType.SERVER_ERROR);
 * expect(error.status).toBe(500);
 * ```
 */
export function createMockHttpClientError(options: {
  message?: string;
  type?: HttpErrorType;
  status?: number;
  code?: string;
  requestId?: string;
  url?: string;
  method?: string;
  response?: any;
} = {}): HttpClientError {
  return new HttpClientError({
    message: options.message || 'Mock HTTP error',
    type: options.type || HttpErrorType.UNKNOWN_ERROR,
    status: options.status,
    code: options.code,
    requestId: options.requestId || uuidv4(),
    url: options.url || '/api/mock',
    method: options.method || 'GET',
    response: options.response
  });
}

/**
 * Creates a mock Axios error for testing error handling
 * 
 * @param options - Error options
 * @returns An AxiosError instance
 * 
 * @example
 * ```typescript
 * const error = createMockAxiosError({
 *   status: 404,
 *   url: '/api/users/999',
 *   message: 'User not found'
 * });
 * 
 * expect(error.response.status).toBe(404);
 * ```
 */
export function createMockAxiosError(options: {
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  url?: string;
  method?: string;
  message?: string;
  code?: string;
} = {}): AxiosError {
  const config: AxiosRequestConfig = {
    url: options.url || '/api/mock',
    method: (options.method || 'GET').toUpperCase() as any
  };

  const error = new Error(options.message || 'Request failed') as AxiosError;
  error.isAxiosError = true;
  error.config = config;
  error.code = options.code;

  if (options.status) {
    error.response = {
      data: options.data || { message: options.message || 'Error response' },
      status: options.status,
      statusText: options.statusText || 'Error',
      headers: options.headers || { 'content-type': 'application/json' },
      config
    };
  }

  return error;
}

/**
 * Creates a request interceptor for testing
 * 
 * @param callback - Function to call when intercepting a request
 * @returns A request interceptor function
 * 
 * @example
 * ```typescript
 * const requestInterceptor = createRequestInterceptor(config => {
 *   expect(config.headers['X-API-Key']).toBe('test-key');
 *   return config;
 * });
 * 
 * axios.interceptors.request.use(requestInterceptor);
 * ```
 */
export function createRequestInterceptor(
  callback: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>
) {
  return (config: AxiosRequestConfig) => {
    return callback(config);
  };
}

/**
 * Creates a response interceptor for testing
 * 
 * @param onFulfilled - Function to call when a response is successful
 * @param onRejected - Function to call when a response fails
 * @returns A response interceptor object
 * 
 * @example
 * ```typescript
 * const responseInterceptor = createResponseInterceptor(
 *   response => {
 *     expect(response.status).toBe(200);
 *     return response;
 *   },
 *   error => {
 *     expect(error.response.status).toBe(404);
 *     return Promise.reject(error);
 *   }
 * );
 * 
 * axios.interceptors.response.use(
 *   responseInterceptor.onFulfilled,
 *   responseInterceptor.onRejected
 * );
 * ```
 */
export function createResponseInterceptor(
  onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
  onRejected?: (error: any) => any
) {
  return {
    onFulfilled: onFulfilled || (response => response),
    onRejected: onRejected || (error => Promise.reject(error))
  };
}

/**
 * Creates a mock retry configuration for testing retry logic
 * 
 * @param options - Retry configuration options
 * @returns A RetryConfig object
 * 
 * @example
 * ```typescript
 * const retryConfig = createMockRetryConfig({
 *   maxRetries: 5,
 *   retryStatusCodes: [500, 503]
 * });
 * 
 * expect(retryConfig.maxRetries).toBe(5);
 * ```
 */
export function createMockRetryConfig(options: Partial<RetryConfig> = {}): RetryConfig {
  return {
    maxRetries: options.maxRetries ?? 3,
    initialDelayMs: options.initialDelayMs ?? 100,
    backoffFactor: options.backoffFactor ?? 2,
    maxDelayMs: options.maxDelayMs ?? 5000,
    retryStatusCodes: options.retryStatusCodes ?? [408, 429, 500, 502, 503, 504],
    retryErrorTypes: options.retryErrorTypes ?? [
      HttpErrorType.NETWORK_ERROR,
      HttpErrorType.TIMEOUT_ERROR,
      HttpErrorType.SERVER_ERROR
    ]
  };
}

/**
 * Creates a mock SSRF protection options object for testing
 * 
 * @param options - SSRF protection options
 * @returns An SSRFProtectionOptions object
 * 
 * @example
 * ```typescript
 * const ssrfOptions = createMockSsrfOptions({
 *   allowLocalhost: true,
 *   allowedHostnames: ['trusted-service.internal']
 * });
 * 
 * expect(ssrfOptions.allowLocalhost).toBe(true);
 * ```
 */
export function createMockSsrfOptions(options: Partial<SSRFProtectionOptions> = {}): SSRFProtectionOptions {
  return {
    blockedIPv4Ranges: options.blockedIPv4Ranges ?? [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8'
    ],
    blockedIPv6Ranges: options.blockedIPv6Ranges ?? [
      '::1/128',
      'fc00::/7',
      'fe80::/10'
    ],
    allowLocalhost: options.allowLocalhost ?? false,
    allowPrivateNetworks: options.allowPrivateNetworks ?? false,
    allowedHostnames: options.allowedHostnames ?? [],
    enableDetailedLogging: options.enableDetailedLogging ?? true,
    throwOnViolation: options.throwOnViolation ?? true
  };
}

/**
 * Creates a mock URL for testing SSRF protection
 * 
 * @param type - Type of URL to create
 * @returns A URL string
 * 
 * @example
 * ```typescript
 * const privateUrl = createMockUrl('private-ipv4');
 * const publicUrl = createMockUrl('public');
 * 
 * expect(privateUrl).toContain('192.168');
 * expect(publicUrl).toContain('example.com');
 * ```
 */
export function createMockUrl(type: 'localhost' | 'private-ipv4' | 'private-ipv6' | 'public' | 'malformed'): string {
  switch (type) {
    case 'localhost':
      return 'http://localhost:3000/api';
    case 'private-ipv4':
      return 'http://192.168.1.1/api';
    case 'private-ipv6':
      return 'http://[fc00::1]/api';
    case 'public':
      return 'https://example.com/api';
    case 'malformed':
      return 'http://invalid-url:not-a-port/api';
    default:
      return 'https://example.com/api';
  }
}

/**
 * Creates a mock journey context for testing internal API clients
 * 
 * @param journey - Journey type
 * @param userId - User ID
 * @param correlationId - Correlation ID for distributed tracing
 * @returns A journey context object
 * 
 * @example
 * ```typescript
 * const context = createMockJourneyContext('health', '123');
 * 
 * expect(context.journey).toBe('health');
 * expect(context.userId).toBe('123');
 * ```
 */
export function createMockJourneyContext(journey: JourneyType = 'common', userId?: string, correlationId?: string) {
  return {
    journey,
    userId: userId || `user-${uuidv4().slice(0, 8)}`,
    correlationId: correlationId || uuidv4(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates a mock service-to-service request for testing internal API clients
 * 
 * @param options - Request options
 * @returns An AxiosRequestConfig object
 * 
 * @example
 * ```typescript
 * const request = createMockServiceRequest({
 *   journey: 'health',
 *   endpoint: '/metrics/user/123'
 * });
 * 
 * expect(request.headers['X-Journey-Context']).toBe('health');
 * ```
 */
export function createMockServiceRequest(options: {
  journey?: JourneyType;
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
} = {}): AxiosRequestConfig {
  const journey = options.journey || 'common';
  const correlationId = uuidv4();
  
  return {
    url: options.endpoint || '/api/mock',
    method: (options.method || 'GET').toUpperCase() as any,
    headers: {
      'Content-Type': 'application/json',
      'X-Journey-Context': journey,
      'X-Correlation-ID': correlationId,
      ...options.headers
    },
    data: options.data,
    params: options.params
  };
}

/**
 * Creates a mock service-to-service response for testing internal API clients
 * 
 * @param options - Response options
 * @returns An AxiosResponse object
 * 
 * @example
 * ```typescript
 * const response = createMockServiceResponse({
 *   journey: 'health',
 *   data: { metrics: [{ type: 'steps', value: 10000 }] }
 * });
 * 
 * expect(response.headers['x-journey-context']).toBe('health');
 * ```
 */
export function createMockServiceResponse(options: {
  journey?: JourneyType;
  status?: number;
  data?: any;
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
} = {}): AxiosResponse {
  const journey = options.journey || 'common';
  const correlationId = uuidv4();
  const requestConfig = options.config || createMockServiceRequest({ journey });
  
  return {
    data: options.data || {},
    status: options.status || 200,
    statusText: options.status === 200 ? 'OK' : 'Custom Status',
    headers: {
      'content-type': 'application/json',
      'x-journey-context': journey,
      'x-correlation-id': correlationId,
      ...options.headers
    },
    config: requestConfig
  };
}

/**
 * Creates a mock HTTP client factory for testing
 * 
 * @param mockResponses - Map of URL patterns to mock responses
 * @returns A factory function that creates mock HTTP clients
 * 
 * @example
 * ```typescript
 * const mockClientFactory = createMockHttpClientFactory({
 *   '/api/users': { status: 200, data: [{ id: 1, name: 'John' }] }
 * });
 * 
 * const client = mockClientFactory();
 * const response = await client.get('/api/users');
 * 
 * expect(response.data).toEqual([{ id: 1, name: 'John' }]);
 * ```
 */
export function createMockHttpClientFactory(
  mockResponses: Record<string, MockResponseConfig> = {}
) {
  return (config: any = {}) => {
    const mockAxios = createMockAxios(mockResponses);
    
    // Add any interceptors from the config
    if (config.enableSsrfProtection) {
      mockAxios.interceptors.request.use(createRequestInterceptor(reqConfig => {
        if (!reqConfig.url) return reqConfig;
        
        try {
          const url = new URL(reqConfig.url, reqConfig.baseURL);
          const hostname = url.hostname;
          
          // Simulate SSRF protection
          if (
            /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
            hostname === '::1' ||
            hostname === 'fe80::' ||
            hostname.endsWith('.local')
          ) {
            throw new Error('SSRF Protection: Blocked request to private or local network');
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('SSRF Protection')) {
            throw error;
          }
        }
        
        return reqConfig;
      }));
    }
    
    // Add retry logic if enabled
    if (config.retry) {
      const retryConfig = { ...createMockRetryConfig(), ...config.retry };
      
      mockAxios.interceptors.response.use(undefined, async (error: AxiosError) => {
        if (!error.config) return Promise.reject(error);
        
        // Get current retry attempt from config or initialize to 0
        const currentRetryAttempt = (error.config as any).retryAttempt || 0;
        
        // Check if we should retry based on status
        const shouldRetry = error.response?.status && 
          retryConfig.retryStatusCodes.includes(error.response.status) &&
          currentRetryAttempt < retryConfig.maxRetries;
        
        if (shouldRetry) {
          // Increment retry attempt counter
          (error.config as any).retryAttempt = currentRetryAttempt + 1;
          
          // Retry the request
          return mockAxios(error.config);
        }
        
        return Promise.reject(error);
      });
    }
    
    return mockAxios;
  };
}

/**
 * Creates a test utility for validating SSRF protection
 * 
 * @returns An object with methods for testing SSRF protection
 * 
 * @example
 * ```typescript
 * const ssrfTester = createSsrfTester();
 * 
 * // Test that a request to a private IP is blocked
 * await ssrfTester.expectBlocked(() => {
 *   return axios.get('http://192.168.1.1/api');
 * });
 * 
 * // Test that a request to a public domain is allowed
 * await ssrfTester.expectAllowed(() => {
 *   return axios.get('https://example.com/api');
 * });
 * ```
 */
export function createSsrfTester() {
  return {
    /**
     * Expects a request to be blocked by SSRF protection
     * 
     * @param requestFn - Function that makes the HTTP request
     * @param errorMessagePattern - Expected error message pattern
     */
    expectBlocked: async (requestFn: () => Promise<any>, errorMessagePattern = /SSRF Protection/) => {
      try {
        await requestFn();
        throw new Error('Expected request to be blocked by SSRF protection, but it succeeded');
      } catch (error) {
        if (error instanceof Error) {
          if (!errorMessagePattern.test(error.message)) {
            throw new Error(
              `Expected error message to match ${errorMessagePattern}, but got: ${error.message}`
            );
          }
          // Success - request was blocked as expected
        } else {
          throw new Error('Expected error to be an Error instance');
        }
      }
    },
    
    /**
     * Expects a request to be allowed (not blocked by SSRF protection)
     * 
     * @param requestFn - Function that makes the HTTP request
     */
    expectAllowed: async (requestFn: () => Promise<any>) => {
      try {
        await requestFn();
        // Success - request was allowed as expected
      } catch (error) {
        if (error instanceof Error && /SSRF Protection/.test(error.message)) {
          throw new Error(
            `Expected request to be allowed, but it was blocked by SSRF protection: ${error.message}`
          );
        }
        // If it's some other error, re-throw it
        throw error;
      }
    },
    
    /**
     * Creates a set of test URLs for SSRF testing
     * 
     * @returns An object with various test URLs
     */
    createTestUrls: () => ({
      localhost: 'http://localhost:3000/api',
      loopback: 'http://127.0.0.1:8080/api',
      privateIPv4: 'http://192.168.1.1/api',
      privateIPv6: 'http://[fc00::1]/api',
      linkLocal: 'http://169.254.169.254/api', // AWS metadata service
      publicDomain: 'https://example.com/api',
      allowedCustom: 'https://allowed-service.example.com/api'
    })
  };
}

/**
 * Creates a test utility for validating retry behavior
 * 
 * @returns An object with methods for testing retry logic
 * 
 * @example
 * ```typescript
 * const retryTester = createRetryTester();
 * 
 * // Test that a request is retried the expected number of times
 * await retryTester.testRetryCount({
 *   requestFn: () => client.get('/api/flaky'),
 *   expectedRetries: 3,
 *   mockResponses: [
 *     { status: 503 }, // First attempt fails
 *     { status: 503 }, // Second attempt fails
 *     { status: 503 }, // Third attempt fails
 *     { status: 200, data: { success: true } } // Fourth attempt succeeds
 *   ]
 * });
 * ```
 */
export function createRetryTester() {
  return {
    /**
     * Tests that a request is retried the expected number of times
     * 
     * @param options - Test options
     */
    testRetryCount: async (options: {
      requestFn: () => Promise<any>;
      expectedRetries: number;
      mockResponses: MockResponseConfig[];
      onRetry?: (attempt: number) => void;
    }) => {
      const { requestFn, expectedRetries, mockResponses, onRetry } = options;
      
      let attemptCount = 0;
      
      // Create a mock axios instance that tracks retry attempts
      const originalAxios = axios.create;
      axios.create = jest.fn().mockImplementation(() => {
        const instance = originalAxios();
        
        // Mock the request method
        instance.request = jest.fn().mockImplementation(async (config: AxiosRequestConfig) => {
          const currentAttempt = attemptCount++;
          const mockResponse = mockResponses[currentAttempt] || mockResponses[mockResponses.length - 1];
          
          if (onRetry && currentAttempt > 0) {
            onRetry(currentAttempt);
          }
          
          if (mockResponse.shouldFail || (mockResponse.status && mockResponse.status >= 400)) {
            const error = new Error('Request failed') as AxiosError;
            error.isAxiosError = true;
            error.config = config;
            error.response = {
              data: mockResponse.data || { message: 'Error response' },
              status: mockResponse.status || 500,
              statusText: 'Error',
              headers: mockResponse.headers || {},
              config
            };
            throw error;
          }
          
          return {
            data: mockResponse.data || {},
            status: mockResponse.status || 200,
            statusText: mockResponse.status === 200 ? 'OK' : 'Custom Status',
            headers: mockResponse.headers || {},
            config
          };
        });
        
        // Mock all HTTP methods to use the request method
        ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
          instance[method] = jest.fn().mockImplementation(
            (url: string, configOrData?: any, config?: AxiosRequestConfig) => {
              const requestConfig: AxiosRequestConfig = {
                url,
                method: method.toUpperCase() as any
              };
              
              if (method === 'get' || method === 'delete' || method === 'head' || method === 'options') {
                Object.assign(requestConfig, configOrData);
              } else {
                requestConfig.data = configOrData;
                Object.assign(requestConfig, config);
              }
              
              return instance.request(requestConfig);
            }
          );
        });
        
        return instance;
      });
      
      try {
        // Execute the request function
        await requestFn();
        
        // Verify the number of attempts
        if (attemptCount !== expectedRetries + 1) {
          throw new Error(
            `Expected ${expectedRetries} retries (${expectedRetries + 1} total attempts), but got ${attemptCount} attempts`
          );
        }
      } finally {
        // Restore original axios.create
        axios.create = originalAxios;
      }
    },
    
    /**
     * Creates a mock client that simulates retry behavior
     * 
     * @param options - Client options
     */
    createMockRetryClient: (options: {
      maxRetries?: number;
      responses?: MockResponseConfig[];
      onRetry?: (attempt: number) => void;
    } = {}) => {
      const { maxRetries = 3, responses = [], onRetry } = options;
      let attemptCount = 0;
      
      const mockAxios = createMockAxios();
      
      // Override request method to simulate retries
      mockAxios.request = jest.fn().mockImplementation(async (config: AxiosRequestConfig) => {
        const currentAttempt = attemptCount++;
        const mockResponse = responses[currentAttempt] || responses[responses.length - 1] || DEFAULT_MOCK_RESPONSE;
        
        if (onRetry && currentAttempt > 0) {
          onRetry(currentAttempt);
        }
        
        // If this is a retry attempt and we haven't exceeded max retries
        if (currentAttempt > 0 && currentAttempt <= maxRetries) {
          if (mockResponse.shouldFail || (mockResponse.status && mockResponse.status >= 400)) {
            const error = new Error('Request failed') as AxiosError;
            error.isAxiosError = true;
            error.config = config;
            error.response = {
              data: mockResponse.data || { message: 'Error response' },
              status: mockResponse.status || 500,
              statusText: 'Error',
              headers: mockResponse.headers || {},
              config
            };
            throw error;
          }
        }
        
        return {
          data: mockResponse.data || {},
          status: mockResponse.status || 200,
          statusText: mockResponse.status === 200 ? 'OK' : 'Custom Status',
          headers: mockResponse.headers || {},
          config
        };
      });
      
      // Update HTTP method implementations to use the new request method
      ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
        mockAxios[method] = jest.fn().mockImplementation(
          (url: string, configOrData?: any, config?: AxiosRequestConfig) => {
            const requestConfig: AxiosRequestConfig = {
              url,
              method: method.toUpperCase() as any
            };
            
            if (method === 'get' || method === 'delete' || method === 'head' || method === 'options') {
              Object.assign(requestConfig, configOrData);
            } else {
              requestConfig.data = configOrData;
              Object.assign(requestConfig, config);
            }
            
            return mockAxios.request(requestConfig);
          }
        );
      });
      
      return mockAxios;
    }
  };
}

/**
 * Creates a test utility for validating service-to-service communication
 * 
 * @returns An object with methods for testing service communication
 * 
 * @example
 * ```typescript
 * const serviceTester = createServiceCommunicationTester();
 * 
 * // Test that a request includes the correct journey context
 * await serviceTester.testJourneyContext({
 *   requestFn: () => client.get('/api/health/metrics'),
 *   expectedJourney: 'health'
 * });
 * ```
 */
export function createServiceCommunicationTester() {
  return {
    /**
     * Tests that a request includes the correct journey context
     * 
     * @param options - Test options
     */
    testJourneyContext: async (options: {
      requestFn: () => Promise<any>;
      expectedJourney: JourneyType;
      expectedHeaders?: Record<string, string>;
    }) => {
      const { requestFn, expectedJourney, expectedHeaders = {} } = options;
      
      // Create a mock axios instance that validates headers
      const originalAxios = axios.create;
      axios.create = jest.fn().mockImplementation(() => {
        const instance = originalAxios();
        
        // Add request interceptor to validate headers
        instance.interceptors.request.use(config => {
          // Check journey context header
          const journeyContext = config.headers?.['X-Journey-Context'];
          if (journeyContext !== expectedJourney) {
            throw new Error(
              `Expected X-Journey-Context header to be '${expectedJourney}', but got '${journeyContext}'`
            );
          }
          
          // Check correlation ID header
          const correlationId = config.headers?.['X-Correlation-ID'];
          if (!correlationId) {
            throw new Error('Expected X-Correlation-ID header to be present');
          }
          
          // Check additional expected headers
          for (const [key, value] of Object.entries(expectedHeaders)) {
            const headerValue = config.headers?.[key];
            if (headerValue !== value) {
              throw new Error(
                `Expected ${key} header to be '${value}', but got '${headerValue}'`
              );
            }
          }
          
          return config;
        });
        
        // Mock successful response
        instance.request = jest.fn().mockResolvedValue({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/json',
            'x-journey-context': expectedJourney,
            'x-correlation-id': uuidv4()
          },
          config: {}
        });
        
        return instance;
      });
      
      try {
        // Execute the request function
        await requestFn();
      } finally {
        // Restore original axios.create
        axios.create = originalAxios;
      }
    },
    
    /**
     * Creates a mock service client for testing service communication
     * 
     * @param options - Client options
     */
    createMockServiceClient: (options: {
      journey?: JourneyType;
      baseURL?: string;
      responses?: Record<string, MockResponseConfig>;
    } = {}) => {
      const { journey = 'common', baseURL = 'http://mock-service', responses = {} } = options;
      
      const mockAxios = createMockAxios(responses);
      
      // Set default headers for all requests
      mockAxios.defaults.baseURL = baseURL;
      mockAxios.defaults.headers.common = {
        'Content-Type': 'application/json',
        'X-Journey-Context': journey,
        'X-Correlation-ID': uuidv4()
      };
      
      return mockAxios;
    }
  };
}