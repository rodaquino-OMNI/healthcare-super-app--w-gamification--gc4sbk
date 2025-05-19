import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Interface for configuring mock HTTP client behavior
 */
export interface MockHttpClientConfig {
  /** Determines if the request should fail */
  shouldFail?: boolean;
  /** Delay in ms before responding (can be used to simulate timeouts) */
  delay?: number;
  /** Status code to return (for API errors) */
  statusCode?: number;
  /** Response data to return on success */
  responseData?: any;
  /** Error data to return on failure */
  errorData?: any;
  /** Error message for network errors */
  errorMessage?: string;
  /** Custom error type (e.g., 'Network Error', 'Timeout', 'SSRF Protection') */
  errorType?: string;
  /** Whether to simulate SSRF protection behavior */
  enableSsrfProtection?: boolean;
  /** Function to determine if a URL should be blocked by SSRF protection */
  ssrfBlockPredicate?: (url: string, config: AxiosRequestConfig) => boolean;
  /** Number of consecutive failures before success (for testing retry mechanisms) */
  failureCount?: number;
  /** Whether to track request history */
  trackRequests?: boolean;
}

/**
 * Tracked request information for test assertions
 */
export interface TrackedRequest {
  /** Request configuration */
  config: AxiosRequestConfig;
  /** Timestamp when the request was made */
  timestamp: number;
  /** Whether the request succeeded */
  succeeded: boolean;
  /** Response if the request succeeded */
  response?: AxiosResponse;
  /** Error if the request failed */
  error?: AxiosError;
}

/**
 * Mock implementation of AxiosInstance for testing error handling
 */
export class MockHttpClient implements Partial<AxiosInstance> {
  private config: MockHttpClientConfig;
  private requestHistory: TrackedRequest[] = [];
  private requestCount: number = 0;

  constructor(config: MockHttpClientConfig = {}) {
    this.config = {
      shouldFail: false,
      delay: 0,
      statusCode: 200,
      responseData: { success: true },
      errorData: { message: 'Error occurred' },
      errorMessage: 'Request failed',
      errorType: 'Error',
      enableSsrfProtection: false,
      failureCount: 0,
      trackRequests: true,
      ...config,
    };

    // Create request methods
    this.request = this.createRequestMethod();
    this.get = this.createRequestMethod('get');
    this.post = this.createRequestMethod('post');
    this.put = this.createRequestMethod('put');
    this.delete = this.createRequestMethod('delete');
    this.patch = this.createRequestMethod('patch');
    this.head = this.createRequestMethod('head');
    this.options = this.createRequestMethod('options');

    // Create interceptors object
    this.interceptors = {
      request: this.createInterceptorManager(),
      response: this.createInterceptorManager(),
    };
  }

  /**
   * Main request method implementation
   */
  request: any;

  /**
   * HTTP method implementations
   */
  get: any;
  post: any;
  put: any;
  delete: any;
  patch: any;
  head: any;
  options: any;

  /**
   * Mock interceptors implementation
   */
  interceptors: any;

  /**
   * Creates a request method implementation
   */
  private createRequestMethod(method?: string) {
    return async (url: string | AxiosRequestConfig, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
      // Normalize arguments
      let requestConfig: AxiosRequestConfig;
      if (typeof url === 'string') {
        requestConfig = { ...(config || {}), url, method: method || 'get' };
      } else {
        requestConfig = { ...url, method: method || url.method || 'get' };
      }

      this.requestCount++;
      const currentRequestCount = this.requestCount;

      // Check for SSRF protection
      if (this.config.enableSsrfProtection) {
        const urlString = requestConfig.url || '';
        const baseURL = requestConfig.baseURL || '';
        const fullUrl = urlString.startsWith('http') ? urlString : `${baseURL}${urlString}`;

        // Default SSRF protection logic
        const isBlocked = this.config.ssrfBlockPredicate
          ? this.config.ssrfBlockPredicate(fullUrl, requestConfig)
          : this.defaultSsrfCheck(fullUrl);

        if (isBlocked) {
          const error = new Error('SSRF Protection: Blocked request to private or local network') as AxiosError;
          error.config = requestConfig;
          error.isAxiosError = true;
          error.name = 'AxiosError';
          error.code = 'SSRF_PROTECTION';

          if (this.config.trackRequests) {
            this.trackRequest(requestConfig, undefined, error);
          }

          return Promise.reject(error);
        }
      }

      // Determine if this request should fail based on failure count
      const shouldFailThisRequest = this.config.shouldFail || 
        (this.config.failureCount && currentRequestCount <= this.config.failureCount);

      // Simulate network delay
      if (this.config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.delay));
      }

      // Handle success case
      if (!shouldFailThisRequest) {
        const response: AxiosResponse = {
          data: this.config.responseData,
          status: this.config.statusCode || 200,
          statusText: 'OK',
          headers: {},
          config: requestConfig,
        };

        if (this.config.trackRequests) {
          this.trackRequest(requestConfig, response);
        }

        return response;
      }

      // Handle error case
      let error: AxiosError;

      // Create appropriate error based on configuration
      if (this.config.errorType === 'Network Error') {
        // Network error
        error = new Error(this.config.errorMessage || 'Network Error') as AxiosError;
        error.config = requestConfig;
        error.isAxiosError = true;
        error.name = 'AxiosError';
        error.code = 'ENETUNREACH';
      } else if (this.config.errorType === 'Timeout') {
        // Timeout error
        error = new Error(this.config.errorMessage || 'Timeout Error') as AxiosError;
        error.config = requestConfig;
        error.isAxiosError = true;
        error.name = 'AxiosError';
        error.code = 'ECONNABORTED';
      } else {
        // API error with status code
        const response: AxiosResponse = {
          data: this.config.errorData,
          status: this.config.statusCode || 500,
          statusText: this.config.statusCode === 404 ? 'Not Found' : 'Error',
          headers: {},
          config: requestConfig,
        };

        error = new Error(this.config.errorMessage || `Request failed with status code ${response.status}`) as AxiosError;
        error.config = requestConfig;
        error.isAxiosError = true;
        error.name = 'AxiosError';
        error.code = 'ERR_BAD_RESPONSE';
        error.response = response;
      }

      if (this.config.trackRequests) {
        this.trackRequest(requestConfig, undefined, error);
      }

      return Promise.reject(error);
    };
  }

  /**
   * Creates a mock interceptor manager
   */
  private createInterceptorManager() {
    return {
      use: (onFulfilled?: any, onRejected?: any) => {
        // In a real implementation, we would store these handlers
        // and apply them in the request/response chain
        return 0; // Return a handler ID
      },
      eject: (id: number) => {
        // In a real implementation, we would remove the handler
      },
    };
  }

  /**
   * Default SSRF protection check
   */
  private defaultSsrfCheck(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Block requests to private IP ranges
      return (
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
        hostname === '::1' ||
        hostname === 'fe80::' ||
        hostname.endsWith('.local')
      );
    } catch (error) {
      // If URL parsing fails, block the request to be safe
      return true;
    }
  }

  /**
   * Track a request for later assertions
   */
  private trackRequest(config: AxiosRequestConfig, response?: AxiosResponse, error?: AxiosError) {
    this.requestHistory.push({
      config,
      timestamp: Date.now(),
      succeeded: !error,
      response,
      error,
    });
  }

  /**
   * Get the history of tracked requests
   */
  getRequestHistory(): TrackedRequest[] {
    return [...this.requestHistory];
  }

  /**
   * Clear the request history
   */
  clearRequestHistory(): void {
    this.requestHistory = [];
    this.requestCount = 0;
  }

  /**
   * Get the count of requests made
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Update the configuration of this mock client
   */
  updateConfig(config: Partial<MockHttpClientConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Factory function to create a mock HTTP client that simulates network errors
 */
export function createNetworkErrorMock(config: Partial<MockHttpClientConfig> = {}): MockHttpClient {
  return new MockHttpClient({
    shouldFail: true,
    errorType: 'Network Error',
    errorMessage: 'Network Error',
    ...config,
  });
}

/**
 * Factory function to create a mock HTTP client that simulates timeout errors
 */
export function createTimeoutMock(timeoutMs: number = 3000, config: Partial<MockHttpClientConfig> = {}): MockHttpClient {
  return new MockHttpClient({
    shouldFail: true,
    delay: timeoutMs,
    errorType: 'Timeout',
    errorMessage: 'Timeout of ' + timeoutMs + 'ms exceeded',
    ...config,
  });
}

/**
 * Factory function to create a mock HTTP client that simulates API errors
 */
export function createApiErrorMock(
  statusCode: number = 500,
  errorData: any = { message: 'Server Error' },
  config: Partial<MockHttpClientConfig> = {}
): MockHttpClient {
  return new MockHttpClient({
    shouldFail: true,
    statusCode,
    errorData,
    ...config,
  });
}

/**
 * Factory function to create a mock HTTP client that simulates SSRF protection
 */
export function createSsrfProtectionMock(config: Partial<MockHttpClientConfig> = {}): MockHttpClient {
  return new MockHttpClient({
    enableSsrfProtection: true,
    ...config,
  });
}

/**
 * Factory function to create a mock HTTP client that simulates transient failures
 * (fails a certain number of times before succeeding)
 */
export function createTransientErrorMock(
  failureCount: number = 3,
  config: Partial<MockHttpClientConfig> = {}
): MockHttpClient {
  return new MockHttpClient({
    failureCount,
    ...config,
  });
}

/**
 * Factory function to create a mock HTTP client that simulates successful responses
 */
export function createSuccessMock(
  responseData: any = { success: true },
  config: Partial<MockHttpClientConfig> = {}
): MockHttpClient {
  return new MockHttpClient({
    shouldFail: false,
    responseData,
    ...config,
  });
}

/**
 * Creates a mock implementation of the secure axios client
 */
export function createMockSecureAxios(config: Partial<MockHttpClientConfig> = {}): MockHttpClient {
  return new MockHttpClient({
    enableSsrfProtection: true,
    ...config,
  });
}

/**
 * Creates a mock implementation of the internal API client
 */
export function createMockInternalApiClient(
  baseURL: string = 'https://api.internal.austa.com',
  config: Partial<MockHttpClientConfig> = {}
): MockHttpClient {
  return new MockHttpClient({
    enableSsrfProtection: true,
    ...config,
  });
}

export default {
  createNetworkErrorMock,
  createTimeoutMock,
  createApiErrorMock,
  createSsrfProtectionMock,
  createTransientErrorMock,
  createSuccessMock,
  createMockSecureAxios,
  createMockInternalApiClient,
};