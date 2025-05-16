/**
 * HTTP Test Helpers
 * 
 * This module provides test helper functions for HTTP utilities, including mock Axios instances,
 * request/response simulators, and SSRF testing utilities. These helpers facilitate testing of
 * HTTP client creation, security validation, and service-to-service communication across all
 * journey services.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { jest } from '@jest/globals';

// Types for the mock helpers
export interface MockAxiosInstanceOptions {
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  defaultResponseData?: any;
  defaultStatus?: number;
  defaultStatusText?: string;
  interceptors?: boolean;
  throwNetworkError?: boolean;
  throwTimeoutError?: boolean;
}

export interface MockRequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

export interface MockJourneyConfig {
  journeyType: 'health' | 'care' | 'plan';
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  customHeaders?: Record<string, string>;
}

/**
 * ==========================================
 * Mock Axios Factory
 * ==========================================
 */

/**
 * Creates a mock Axios instance with configurable response behavior
 * 
 * @param options Configuration options for the mock Axios instance
 * @returns A mocked Axios instance for testing
 */
export const createMockAxiosInstance = (options: MockAxiosInstanceOptions = {}): jest.Mocked<AxiosInstance> => {
  const {
    baseURL = 'https://api.example.com',
    defaultHeaders = { 'Content-Type': 'application/json' },
    defaultResponseData = {},
    defaultStatus = 200,
    defaultStatusText = 'OK',
    interceptors = true,
    throwNetworkError = false,
    throwTimeoutError = false
  } = options;

  // Create a mock response
  const mockResponse: AxiosResponse = {
    data: defaultResponseData,
    status: defaultStatus,
    statusText: defaultStatusText,
    headers: {},
    config: { headers: defaultHeaders } as AxiosRequestConfig
  };

  // Create the mock instance
  const mockAxios = {
    defaults: {
      baseURL,
      headers: { common: { ...defaultHeaders } }
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
        handlers: []
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        handlers: []
      }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    request: jest.fn(),
    create: jest.fn().mockReturnThis(),
    getUri: jest.fn(),
    isCancel: jest.fn(),
    isAxiosError: jest.fn(),
    all: jest.fn(),
    spread: jest.fn()
  } as unknown as jest.Mocked<AxiosInstance>;

  // Configure default behavior for HTTP methods
  if (throwNetworkError) {
    const networkError = new Error('Network Error');
    mockAxios.get.mockRejectedValue(networkError);
    mockAxios.post.mockRejectedValue(networkError);
    mockAxios.put.mockRejectedValue(networkError);
    mockAxios.patch.mockRejectedValue(networkError);
    mockAxios.delete.mockRejectedValue(networkError);
    mockAxios.head.mockRejectedValue(networkError);
    mockAxios.options.mockRejectedValue(networkError);
    mockAxios.request.mockRejectedValue(networkError);
  } else if (throwTimeoutError) {
    const timeoutError = createMockAxiosError({
      code: 'ECONNABORTED',
      message: 'timeout of 30000ms exceeded',
      config: { timeout: 30000 } as AxiosRequestConfig
    });
    mockAxios.get.mockRejectedValue(timeoutError);
    mockAxios.post.mockRejectedValue(timeoutError);
    mockAxios.put.mockRejectedValue(timeoutError);
    mockAxios.patch.mockRejectedValue(timeoutError);
    mockAxios.delete.mockRejectedValue(timeoutError);
    mockAxios.head.mockRejectedValue(timeoutError);
    mockAxios.options.mockRejectedValue(timeoutError);
    mockAxios.request.mockRejectedValue(timeoutError);
  } else {
    mockAxios.get.mockResolvedValue(mockResponse);
    mockAxios.post.mockResolvedValue(mockResponse);
    mockAxios.put.mockResolvedValue(mockResponse);
    mockAxios.patch.mockResolvedValue(mockResponse);
    mockAxios.delete.mockResolvedValue(mockResponse);
    mockAxios.head.mockResolvedValue(mockResponse);
    mockAxios.options.mockResolvedValue(mockResponse);
    mockAxios.request.mockResolvedValue(mockResponse);
  }

  return mockAxios;
};

/**
 * Creates a mock Axios error response
 * 
 * @param options Error configuration options
 * @returns A mocked Axios error for testing
 */
export const createMockAxiosError = (options: {
  status?: number;
  statusText?: string;
  data?: any;
  code?: string;
  message?: string;
  config?: AxiosRequestConfig;
}): AxiosError => {
  const {
    status = 500,
    statusText = 'Internal Server Error',
    data = { message: 'An error occurred' },
    code = 'ERR_BAD_RESPONSE',
    message = 'Request failed with status code 500',
    config = { url: 'https://api.example.com/test', method: 'get' }
  } = options;

  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.config = config;
  error.code = code;
  error.response = {
    data,
    status,
    statusText,
    headers: {},
    config
  };
  error.toJSON = () => ({
    message,
    name: 'AxiosError',
    code,
    status,
    config
  });

  return error;
};

/**
 * Mocks Axios interceptors for testing request/response interception
 * 
 * @param mockAxios The mock Axios instance to configure interceptors for
 * @param requestInterceptor Optional request interceptor function
 * @param responseInterceptor Optional response interceptor function
 * @param requestErrorInterceptor Optional request error interceptor function
 * @param responseErrorInterceptor Optional response error interceptor function
 */
export const mockAxiosInterceptors = (
  mockAxios: jest.Mocked<AxiosInstance>,
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>,
  responseInterceptor?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
  requestErrorInterceptor?: (error: any) => any,
  responseErrorInterceptor?: (error: any) => any
): void => {
  // Mock request interceptor
  if (requestInterceptor || requestErrorInterceptor) {
    mockAxios.interceptors.request.use.mockImplementation((onFulfilled, onRejected) => {
      const id = Math.random();
      mockAxios.interceptors.request.handlers.push({
        fulfilled: onFulfilled || ((config) => config),
        rejected: onRejected || ((error) => Promise.reject(error)),
        id
      });
      return id;
    });
  }

  // Mock response interceptor
  if (responseInterceptor || responseErrorInterceptor) {
    mockAxios.interceptors.response.use.mockImplementation((onFulfilled, onRejected) => {
      const id = Math.random();
      mockAxios.interceptors.response.handlers.push({
        fulfilled: onFulfilled || ((response) => response),
        rejected: onRejected || ((error) => Promise.reject(error)),
        id
      });
      return id;
    });
  }

  // Implement the interceptor execution logic
  const originalGet = mockAxios.get.getMockImplementation();
  mockAxios.get.mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
    let mergedConfig = { ...config, url, method: 'get' } as AxiosRequestConfig;
    
    // Apply request interceptors
    for (const handler of mockAxios.interceptors.request.handlers) {
      try {
        mergedConfig = await handler.fulfilled(mergedConfig);
      } catch (error) {
        for (const errorHandler of mockAxios.interceptors.request.handlers) {
          if (errorHandler.rejected) {
            try {
              await errorHandler.rejected(error);
            } catch (e) {
              // Continue with the next error handler
            }
          }
        }
        throw error;
      }
    }

    // Execute the original request
    try {
      const response = await originalGet!(url, mergedConfig);
      
      // Apply response interceptors
      let interceptedResponse = response;
      for (const handler of mockAxios.interceptors.response.handlers) {
        interceptedResponse = await handler.fulfilled(interceptedResponse);
      }
      
      return interceptedResponse;
    } catch (error) {
      // Apply response error interceptors
      for (const handler of mockAxios.interceptors.response.handlers) {
        if (handler.rejected) {
          try {
            return await handler.rejected(error);
          } catch (e) {
            // Continue with the next error handler
            error = e;
          }
        }
      }
      throw error;
    }
  });

  // Implement similar logic for other HTTP methods if needed
};

/**
 * ==========================================
 * SSRF Testing Utilities
 * ==========================================
 */

/**
 * Creates a mock request with a specific URL for testing SSRF protection
 * 
 * @param url The URL to use in the mock request
 * @param method The HTTP method to use (default: 'get')
 * @param headers Optional headers to include
 * @returns A mock request configuration for testing
 */
export const createMockRequestWithUrl = (
  url: string,
  method: string = 'get',
  headers: Record<string, string> = {}
): MockRequestConfig => {
  return {
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
};

/**
 * Returns a list of IP ranges that should be blocked by SSRF protection
 * 
 * @returns An array of IP ranges that should be blocked
 */
export const getBlockedIpRanges = (): string[] => {
  return [
    // Private IPv4 ranges
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    // Link-local addresses
    '169.254.0.0/16',
    // Private IPv6 ranges
    'fc00::/7',
    'fe80::/10',
    // Loopback
    '::1/128'
  ];
};

/**
 * Returns a list of domains that should be blocked by SSRF protection
 * 
 * @returns An array of domains that should be blocked
 */
export const getBlockedDomains = (): string[] => {
  return [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '.local',
    '.internal',
    '.localhost',
    'example.test',
    'example.invalid',
    'example.localhost'
  ];
};

/**
 * ==========================================
 * Request/Response Simulators
 * ==========================================
 */

/**
 * Simulates a successful HTTP request
 * 
 * @param mockAxios The mock Axios instance to configure
 * @param url The URL to simulate a request to
 * @param responseData The data to include in the response
 * @param status The HTTP status code to return (default: 200)
 * @param headers Optional response headers
 */
export const simulateSuccessfulRequest = (
  mockAxios: jest.Mocked<AxiosInstance>,
  url: string,
  responseData: any,
  status: number = 200,
  headers: Record<string, string> = {}
): void => {
  const response: AxiosResponse = {
    data: responseData,
    status,
    statusText: status === 200 ? 'OK' : 'Success',
    headers,
    config: { url, method: 'get', headers: {} } as AxiosRequestConfig
  };

  mockAxios.get.mockImplementation((requestUrl) => {
    if (requestUrl === url) {
      return Promise.resolve(response);
    }
    return Promise.reject(createMockAxiosError({
      status: 404,
      statusText: 'Not Found',
      message: `Request failed with status code 404: ${requestUrl} not found`
    }));
  });
};

/**
 * Simulates a failed HTTP request with different error types
 * 
 * @param mockAxios The mock Axios instance to configure
 * @param url The URL to simulate a request to
 * @param errorType The type of error to simulate ('client', 'server', 'network', 'timeout')
 * @param status The HTTP status code to return (default based on errorType)
 * @param errorData Optional error data to include in the response
 */
export const simulateFailedRequest = (
  mockAxios: jest.Mocked<AxiosInstance>,
  url: string,
  errorType: 'client' | 'server' | 'network' | 'timeout',
  status?: number,
  errorData: any = { message: 'An error occurred' }
): void => {
  let error: AxiosError;

  switch (errorType) {
    case 'client':
      error = createMockAxiosError({
        status: status || 400,
        statusText: 'Bad Request',
        data: errorData,
        message: `Request failed with status code ${status || 400}`,
        config: { url, method: 'get' }
      });
      break;
    case 'server':
      error = createMockAxiosError({
        status: status || 500,
        statusText: 'Internal Server Error',
        data: errorData,
        message: `Request failed with status code ${status || 500}`,
        config: { url, method: 'get' }
      });
      break;
    case 'network':
      error = new Error('Network Error') as AxiosError;
      error.isAxiosError = true;
      error.config = { url, method: 'get' } as AxiosRequestConfig;
      error.code = 'ERR_NETWORK';
      break;
    case 'timeout':
      error = createMockAxiosError({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        config: { url, method: 'get', timeout: 30000 }
      });
      break;
    default:
      error = createMockAxiosError({
        status: status || 500,
        data: errorData,
        config: { url, method: 'get' }
      });
  }

  mockAxios.get.mockImplementation((requestUrl) => {
    if (requestUrl === url) {
      return Promise.reject(error);
    }
    return Promise.resolve({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: requestUrl, method: 'get' } as AxiosRequestConfig
    });
  });
};

/**
 * Simulates a network error
 * 
 * @param mockAxios The mock Axios instance to configure
 * @param url Optional specific URL to fail (if not provided, all requests will fail)
 */
export const simulateNetworkError = (
  mockAxios: jest.Mocked<AxiosInstance>,
  url?: string
): void => {
  const networkError = new Error('Network Error') as AxiosError;
  networkError.isAxiosError = true;
  networkError.code = 'ERR_NETWORK';
  networkError.config = { url: url || 'https://api.example.com', method: 'get' } as AxiosRequestConfig;

  if (url) {
    mockAxios.get.mockImplementation((requestUrl) => {
      if (requestUrl === url) {
        return Promise.reject(networkError);
      }
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: requestUrl, method: 'get' } as AxiosRequestConfig
      });
    });
  } else {
    mockAxios.get.mockRejectedValue(networkError);
    mockAxios.post.mockRejectedValue(networkError);
    mockAxios.put.mockRejectedValue(networkError);
    mockAxios.patch.mockRejectedValue(networkError);
    mockAxios.delete.mockRejectedValue(networkError);
  }
};

/**
 * Simulates a timeout error
 * 
 * @param mockAxios The mock Axios instance to configure
 * @param url Optional specific URL to timeout (if not provided, all requests will timeout)
 * @param timeoutMs The timeout duration in milliseconds
 */
export const simulateTimeoutError = (
  mockAxios: jest.Mocked<AxiosInstance>,
  url?: string,
  timeoutMs: number = 30000
): void => {
  const timeoutError = createMockAxiosError({
    code: 'ECONNABORTED',
    message: `timeout of ${timeoutMs}ms exceeded`,
    config: { timeout: timeoutMs } as AxiosRequestConfig
  });

  if (url) {
    mockAxios.get.mockImplementation((requestUrl) => {
      if (requestUrl === url) {
        return Promise.reject(timeoutError);
      }
      return Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: requestUrl, method: 'get' } as AxiosRequestConfig
      });
    });
  } else {
    mockAxios.get.mockRejectedValue(timeoutError);
    mockAxios.post.mockRejectedValue(timeoutError);
    mockAxios.put.mockRejectedValue(timeoutError);
    mockAxios.patch.mockRejectedValue(timeoutError);
    mockAxios.delete.mockRejectedValue(timeoutError);
  }
};

/**
 * ==========================================
 * Service-to-Service Communication Testing
 * ==========================================
 */

/**
 * Creates a mock internal API client for testing service-to-service communication
 * 
 * @param journeyConfig Journey-specific configuration
 * @param baseURL The base URL for the internal API
 * @returns A mocked Axios instance configured for internal API communication
 */
export const createMockInternalApiClient = (
  journeyConfig: MockJourneyConfig,
  baseURL: string = 'https://internal-api.austa.local'
): jest.Mocked<AxiosInstance> => {
  const { journeyType, correlationId, userId, sessionId, customHeaders } = journeyConfig;
  
  // Create standard headers for internal communication
  const headers = {
    'Content-Type': 'application/json',
    'X-Journey-Type': journeyType,
    'X-Correlation-ID': correlationId || `test-correlation-${Date.now()}`,
    'X-User-ID': userId || 'test-user-id',
    'X-Session-ID': sessionId || `test-session-${Date.now()}`,
    ...customHeaders
  };

  // Create the mock instance with the appropriate configuration
  const mockAxios = createMockAxiosInstance({
    baseURL,
    defaultHeaders: headers,
    interceptors: true
  });

  // Add journey-specific behavior if needed
  switch (journeyType) {
    case 'health':
      // Add health journey specific behavior
      break;
    case 'care':
      // Add care journey specific behavior
      break;
    case 'plan':
      // Add plan journey specific behavior
      break;
  }

  return mockAxios;
};

/**
 * Creates mock journey-specific configuration for internal API clients
 * 
 * @param journeyType The type of journey ('health', 'care', 'plan')
 * @returns Journey-specific configuration for testing
 */
export const mockJourneySpecificConfig = (
  journeyType: 'health' | 'care' | 'plan'
): MockJourneyConfig => {
  const correlationId = `test-correlation-${journeyType}-${Date.now()}`;
  const userId = `test-user-${journeyType}`;
  const sessionId = `test-session-${journeyType}-${Date.now()}`;
  
  const config: MockJourneyConfig = {
    journeyType,
    correlationId,
    userId,
    sessionId,
    customHeaders: {}
  };

  // Add journey-specific headers
  switch (journeyType) {
    case 'health':
      config.customHeaders = {
        'X-Health-Device-ID': 'test-device-id',
        'X-Health-Metric-Type': 'steps'
      };
      break;
    case 'care':
      config.customHeaders = {
        'X-Care-Provider-ID': 'test-provider-id',
        'X-Care-Appointment-ID': 'test-appointment-id'
      };
      break;
    case 'plan':
      config.customHeaders = {
        'X-Plan-ID': 'test-plan-id',
        'X-Plan-Member-ID': 'test-member-id'
      };
      break;
  }

  return config;
};

/**
 * Verifies that trace headers are correctly propagated in requests
 * 
 * @param mockAxios The mock Axios instance to verify
 * @param expectedHeaders The expected headers that should be present
 * @returns Boolean indicating whether all expected headers are present
 */
export const verifyTraceHeaders = (
  mockAxios: jest.Mocked<AxiosInstance>,
  expectedHeaders: string[] = ['X-Correlation-ID', 'X-Journey-Type', 'X-User-ID', 'X-Session-ID']
): boolean => {
  // Get the most recent call to any HTTP method
  const getMockCalls = mockAxios.get.mock.calls;
  const postMockCalls = mockAxios.post.mock.calls;
  const putMockCalls = mockAxios.put.mock.calls;
  const patchMockCalls = mockAxios.patch.mock.calls;
  const deleteMockCalls = mockAxios.delete.mock.calls;

  // Find the most recent call with a config object
  const allCalls = [
    ...getMockCalls,
    ...postMockCalls,
    ...putMockCalls,
    ...patchMockCalls,
    ...deleteMockCalls
  ];

  if (allCalls.length === 0) {
    return false;
  }

  // Find the first call with a config object that has headers
  for (const call of allCalls) {
    const config = call.find(arg => arg && typeof arg === 'object' && arg.headers);
    if (config && config.headers) {
      // Check if all expected headers are present
      return expectedHeaders.every(header => {
        return Object.keys(config.headers).some(key => 
          key.toLowerCase() === header.toLowerCase() && config.headers[key]
        );
      });
    }
  }

  return false;
};