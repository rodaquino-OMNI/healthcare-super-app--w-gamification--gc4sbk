import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

type MockResponse = {
  data?: any;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  config?: AxiosRequestConfig;
};

type MockRequestHandler = (config: AxiosRequestConfig) => MockResponse | Promise<MockResponse>;

type SSRFValidationRule = (url: URL) => boolean;

interface MockAxiosOptions {
  /**
   * Default response to return for all requests
   */
  defaultResponse?: MockResponse;
  
  /**
   * Custom request handlers for specific URLs
   */
  requestHandlers?: Record<string, MockRequestHandler>;
  
  /**
   * Whether to simulate SSRF protection
   * @default true
   */
  enableSSRFProtection?: boolean;
  
  /**
   * Custom SSRF validation rules
   * Return true to block the request (simulating SSRF protection)
   */
  ssrfValidationRules?: SSRFValidationRule[];
  
  /**
   * Whether to track requests for testing
   * @default true
   */
  trackRequests?: boolean;
}

/**
 * Creates a mock Axios instance for testing that simulates the behavior of createSecureAxios
 * without making actual HTTP requests.
 * 
 * @param options - Configuration options for the mock
 * @returns A mock Axios instance with SSRF protection simulation
 */
export function createMockSecureAxios(options: MockAxiosOptions = {}): AxiosInstance {
  const {
    defaultResponse = { status: 200, statusText: 'OK', data: {} },
    requestHandlers = {},
    enableSSRFProtection = true,
    ssrfValidationRules = [],
    trackRequests = true
  } = options;
  
  // Default SSRF validation rule that matches the implementation in secure-axios.ts
  const defaultSSRFRule: SSRFValidationRule = (url) => {
    const hostname = url.hostname;
    return /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
      hostname === '::1' ||
      hostname === 'fe80::' ||
      hostname.endsWith('.local');
  };
  
  // Combine default and custom SSRF rules
  const allSSRFRules = enableSSRFProtection 
    ? [defaultSSRFRule, ...ssrfValidationRules]
    : [];
  
  // Request tracking for tests
  const requestHistory: AxiosRequestConfig[] = [];
  
  // Create a mock Axios instance
  const mockAxios = {
    defaults: {
      baseURL: '',
      headers: {
        common: {}
      },
      timeout: 0
    },
    
    interceptors: {
      request: {
        use: jest.fn((onFulfilled) => {
          // Store the request interceptor
          mockAxios._requestInterceptor = onFulfilled;
          return 0; // Return an ID for the interceptor
        }),
        eject: jest.fn()
      },
      response: {
        use: jest.fn(),
        eject: jest.fn()
      }
    },
    
    // Store the request interceptor function
    _requestInterceptor: null as ((config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>) | null,
    
    // Mock request method
    request: jest.fn(async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
      if (trackRequests) {
        requestHistory.push({ ...config });
      }
      
      // Apply request interceptor if exists
      let processedConfig = config;
      if (mockAxios._requestInterceptor) {
        try {
          processedConfig = await mockAxios._requestInterceptor(config);
        } catch (error) {
          return Promise.reject(error);
        }
      }
      
      // Check for SSRF protection
      if (enableSSRFProtection && processedConfig.url) {
        try {
          const url = new URL(processedConfig.url, processedConfig.baseURL);
          
          // Check if any SSRF rule blocks this URL
          for (const rule of allSSRFRules) {
            if (rule(url)) {
              return Promise.reject(new Error('SSRF Protection: Blocked request to private or local network'));
            }
          }
        } catch (error) {
          // If there's an error parsing the URL and it's not an SSRF error, continue
          if (error instanceof Error && error.message.includes('SSRF Protection')) {
            return Promise.reject(error);
          }
        }
      }
      
      // Check for custom handler for this URL
      const url = processedConfig.url || '';
      if (url in requestHandlers) {
        try {
          const handlerResponse = await requestHandlers[url](processedConfig);
          return {
            ...defaultResponse,
            ...handlerResponse,
            config: processedConfig
          } as AxiosResponse;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      
      // Return default response
      return {
        ...defaultResponse,
        config: processedConfig
      } as AxiosResponse;
    }),
    
    // Helper method to get request history
    getRequestHistory: () => [...requestHistory],
    
    // Helper method to clear request history
    clearRequestHistory: () => {
      requestHistory.length = 0;
    },
    
    // Implement common HTTP methods
    get: jest.fn((url: string, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'get', url });
    }),
    
    post: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'post', url, data });
    }),
    
    put: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'put', url, data });
    }),
    
    patch: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'patch', url, data });
    }),
    
    delete: jest.fn((url: string, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'delete', url });
    }),
    
    head: jest.fn((url: string, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'head', url });
    }),
    
    options: jest.fn((url: string, config?: AxiosRequestConfig) => {
      return mockAxios.request({ ...config, method: 'options', url });
    }),
    
    create: jest.fn(() => createMockSecureAxios(options))
  } as unknown as AxiosInstance & {
    getRequestHistory: () => AxiosRequestConfig[];
    clearRequestHistory: () => void;
  };
  
  return mockAxios;
}

interface InternalApiClientOptions extends MockAxiosOptions {
  /**
   * Custom headers to include with requests
   */
  headers?: Record<string, string>;
  
  /**
   * Custom timeout value
   */
  timeout?: number;
}

/**
 * Creates a mock internal API client for testing that simulates the behavior of createInternalApiClient
 * without making actual HTTP requests.
 * 
 * @param baseURL - The base URL for the API
 * @param options - Configuration options for the mock
 * @returns A mock Axios instance configured for internal API calls
 */
export function createMockInternalApiClient(
  baseURL: string,
  options: InternalApiClientOptions = {}
): AxiosInstance {
  const { headers = {}, timeout = 10000, ...restOptions } = options;
  
  const mockAxios = createMockSecureAxios(restOptions);
  
  // Configure the instance with the provided options
  mockAxios.defaults.baseURL = baseURL;
  mockAxios.defaults.headers.common = {
    'Content-Type': 'application/json',
    ...headers
  };
  mockAxios.defaults.timeout = timeout;
  
  return mockAxios;
}

/**
 * Helper function to create a mock error response for testing error handling
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @param config - Request configuration
 * @returns A mock Axios error object
 */
export function createMockAxiosError(message: string, status = 500, config: AxiosRequestConfig = {}) {
  const error = new Error(message) as any;
  error.isAxiosError = true;
  error.response = {
    status,
    statusText: message,
    data: { message, error: true },
    headers: {},
    config
  };
  error.config = config;
  return error;
}

export default createMockSecureAxios;