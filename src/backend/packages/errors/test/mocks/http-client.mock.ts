import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for configuring mock HTTP client behavior
 */
export interface MockHttpClientConfig {
  /** Determines if requests should fail with network error */
  shouldFailWithNetworkError?: boolean;
  /** Determines if requests should timeout */
  shouldTimeout?: boolean;
  /** Simulated response delay in ms */
  responseDelay?: number;
  /** Status code to return (for error responses) */
  statusCode?: number;
  /** Response data to return */
  responseData?: any;
  /** Custom error message */
  errorMessage?: string;
  /** Number of retries before success (for testing retry mechanisms) */
  retriesBeforeSuccess?: number;
  /** Whether to simulate SSRF protection */
  enableSsrfProtection?: boolean;
}

/**
 * Interface for tracking request history
 */
export interface RequestHistory {
  /** The URL that was requested */
  url: string;
  /** The HTTP method used */
  method: string;
  /** The request configuration */
  config: AxiosRequestConfig;
  /** Timestamp when the request was made */
  timestamp: number;
  /** Number of times this URL was requested (for retry tracking) */
  attemptCount: number;
}

/**
 * Creates a mock HTTP client for testing error handling scenarios
 * 
 * @param config Configuration for the mock client behavior
 * @returns A mock Axios-compatible instance
 */
export function createMockHttpClient(config: MockHttpClientConfig = {}): AxiosInstance & { requestHistory: RequestHistory[] } {
  // Default configuration
  const {
    shouldFailWithNetworkError = false,
    shouldTimeout = false,
    responseDelay = 0,
    statusCode = 200,
    responseData = {},
    errorMessage = 'Network Error',
    retriesBeforeSuccess = 0,
    enableSsrfProtection = false,
  } = config;

  // Track request history for assertions
  const requestHistory: RequestHistory[] = [];
  const requestCounts: Record<string, number> = {};

  // Create request tracking function
  const trackRequest = (url: string, method: string, config: AxiosRequestConfig) => {
    // Increment request count for this URL
    requestCounts[url] = (requestCounts[url] || 0) + 1;
    
    // Add to request history
    requestHistory.push({
      url,
      method,
      config,
      timestamp: Date.now(),
      attemptCount: requestCounts[url],
    });

    return requestCounts[url];
  };

  // Create response handler based on configuration
  const handleRequest = async (url: string, method: string, axiosConfig: AxiosRequestConfig) => {
    // Track this request
    const attemptCount = trackRequest(url, method, axiosConfig);

    // Simulate SSRF protection
    if (enableSsrfProtection) {
      const hostname = new URL(url).hostname;
      if (
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
        hostname === '::1' ||
        hostname === 'fe80::' ||
        hostname.endsWith('.local')
      ) {
        const error = new Error('SSRF Protection: Blocked request to private or local network');
        error.name = 'SSRFProtectionError';
        throw error;
      }
    }

    // Simulate response delay
    if (responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, responseDelay));
    }

    // Simulate timeout
    if (shouldTimeout) {
      const timeoutError = new Error('timeout of 0ms exceeded');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }

    // Simulate network error
    if (shouldFailWithNetworkError) {
      const networkError = new Error(errorMessage);
      networkError.name = 'NetworkError';
      throw networkError;
    }

    // Simulate retry-then-success scenario
    if (retriesBeforeSuccess > 0 && attemptCount <= retriesBeforeSuccess) {
      const retryError = new Error(`Request failed (attempt ${attemptCount} of ${retriesBeforeSuccess + 1})`);
      retryError.name = 'RetryableError';
      throw retryError;
    }

    // Create response object
    const response: AxiosResponse = {
      data: responseData,
      status: statusCode,
      statusText: statusCode >= 200 && statusCode < 300 ? 'OK' : 'Error',
      headers: {},
      config: axiosConfig,
    };

    // Simulate error response
    if (statusCode >= 400) {
      const axiosError = new Error() as AxiosError;
      axiosError.name = 'AxiosError';
      axiosError.message = `Request failed with status code ${statusCode}`;
      axiosError.response = response;
      axiosError.config = axiosConfig;
      axiosError.isAxiosError = true;
      throw axiosError;
    }

    return response;
  };

  // Create mock interceptors
  const interceptors = {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  };

  // Create mock HTTP methods
  const mockMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].reduce(
    (methods, method) => {
      methods[method] = jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => {
        const axiosConfig = { ...config, method, url, data };
        return handleRequest(url, method, axiosConfig);
      });
      return methods;
    },
    {} as Record<string, jest.Mock>
  );

  // Create mock request method
  const request = jest.fn((config: AxiosRequestConfig) => {
    const { url = '', method = 'get' } = config;
    return handleRequest(url, method, config);
  });

  // Create mock create method
  const create = jest.fn(() => mockInstance);

  // Assemble the mock instance
  const mockInstance = {
    ...mockMethods,
    request,
    create,
    interceptors,
    requestHistory,
    defaults: {},
    getUri: jest.fn(),
    isAxiosError: jest.fn(),
    isCancel: jest.fn(),
    all: jest.fn(),
    spread: jest.fn(),
  } as unknown as AxiosInstance & { requestHistory: RequestHistory[] };

  return mockInstance;
}

/**
 * Creates a mock HTTP client that simulates network failures
 * 
 * @param errorMessage Optional custom error message
 * @returns A mock Axios-compatible instance that fails with network errors
 */
export function createNetworkErrorMock(errorMessage = 'Network Error'): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createMockHttpClient({
    shouldFailWithNetworkError: true,
    errorMessage,
  });
}

/**
 * Creates a mock HTTP client that simulates timeout errors
 * 
 * @param delayMs Optional delay before timeout occurs
 * @returns A mock Axios-compatible instance that times out
 */
export function createTimeoutMock(delayMs = 100): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createMockHttpClient({
    shouldTimeout: true,
    responseDelay: delayMs,
  });
}

/**
 * Creates a mock HTTP client that simulates API errors with specific status codes
 * 
 * @param statusCode HTTP status code to return
 * @param responseData Optional response data to include
 * @returns A mock Axios-compatible instance that returns the specified error
 */
export function createApiErrorMock(statusCode = 500, responseData = { message: 'Internal Server Error' }): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createMockHttpClient({
    statusCode,
    responseData,
  });
}

/**
 * Creates a mock HTTP client that simulates successful retry after failures
 * 
 * @param retriesRequired Number of retries before success
 * @param responseData Optional response data to return on success
 * @returns A mock Axios-compatible instance that succeeds after specified retries
 */
export function createRetrySuccessMock(retriesRequired = 2, responseData = { success: true }): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createMockHttpClient({
    retriesBeforeSuccess: retriesRequired,
    responseData,
  });
}

/**
 * Creates a mock HTTP client that simulates SSRF protection
 * 
 * @returns A mock Axios-compatible instance with SSRF protection enabled
 */
export function createSecureMockHttpClient(): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createMockHttpClient({
    enableSsrfProtection: true,
  });
}

/**
 * Creates a mock HTTP client for internal API calls with predefined configuration
 * 
 * @param baseURL Base URL for the client
 * @param headers Optional headers to include
 * @returns A mock Axios-compatible instance configured for internal API calls
 */
export function createMockInternalApiClient(baseURL: string, headers = {}): AxiosInstance & { requestHistory: RequestHistory[] } {
  return createSecureMockHttpClient();
}

export default createMockHttpClient;