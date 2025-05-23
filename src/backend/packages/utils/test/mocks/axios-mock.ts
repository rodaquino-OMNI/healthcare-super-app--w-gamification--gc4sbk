import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Configuration options for mock Axios instance
 */
export interface MockAxiosConfig {
  /**
   * Default response to return for all requests
   */
  defaultResponse?: any;
  
  /**
   * Map of URL patterns to mock responses
   */
  responseMap?: Record<string, any>;
  
  /**
   * Custom request validator function
   */
  requestValidator?: (config: AxiosRequestConfig) => boolean | Error;
  
  /**
   * Whether to simulate SSRF protection (default: true)
   */
  enableSsrfProtection?: boolean;
  
  /**
   * Delay in ms to simulate network latency (default: 0)
   */
  delay?: number;
  
  /**
   * Whether to throw errors for invalid requests (default: true)
   */
  throwOnInvalid?: boolean;
}

/**
 * Default SSRF protection validator that mimics the behavior of the real implementation
 */
export function defaultSsrfValidator(config: AxiosRequestConfig): boolean | Error {
  if (!config.url) return true;
  
  try {
    const url = new URL(config.url, config.baseURL);
    const hostname = url.hostname;
    
    // Block requests to private IP ranges
    if (
      /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
      hostname === '::1' ||
      hostname === 'fe80::' ||
      hostname.endsWith('.local')
    ) {
      return new Error('SSRF Protection: Blocked request to private or local network');
    }
    
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('SSRF Protection')) {
      return error;
    }
    // If there's an error parsing the URL, allow the request
    return true;
  }
}

/**
 * Creates a mock implementation of the secured Axios instance for testing
 * 
 * @param config - Configuration options for the mock
 * @returns A mock Axios instance with Jest spy functions
 */
export function createMockSecureAxios(config: MockAxiosConfig = {}): AxiosInstance {
  const {
    defaultResponse = { data: {} },
    responseMap = {},
    requestValidator = defaultSsrfValidator,
    enableSsrfProtection = true,
    delay = 0,
    throwOnInvalid = true
  } = config;
  
  // Create a base mock object with all Axios methods as Jest mocks
  const mockAxios: Partial<AxiosInstance> = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    request: jest.fn(),
    defaults: {
      headers: {
        common: {}
      },
      baseURL: '',
      timeout: 0
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn()
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn()
      }
    }
  };
  
  // Helper function to process a request and return appropriate response
  const processRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    // Simulate network delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Apply SSRF protection if enabled
    if (enableSsrfProtection) {
      const validationResult = requestValidator(config);
      if (validationResult !== true) {
        const error = validationResult instanceof Error 
          ? validationResult 
          : new Error('Request validation failed');
        
        if (throwOnInvalid) {
          throw error;
        }
      }
    }
    
    // Determine response based on URL pattern matching
    let responseData = defaultResponse;
    const url = config.url || '';
    
    // Check if URL matches any pattern in responseMap
    for (const pattern in responseMap) {
      if (url.includes(pattern)) {
        responseData = responseMap[pattern];
        break;
      }
    }
    
    // Handle function responses that can simulate dynamic behavior
    if (typeof responseData === 'function') {
      responseData = responseData(config);
    }
    
    // Handle error responses
    if (responseData instanceof Error) {
      throw responseData;
    }
    
    // Create a standard Axios response
    return {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    };
  };
  
  // Implement all HTTP method functions
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
  methods.forEach(method => {
    (mockAxios as any)[method].mockImplementation(
      async (url: string, data?: any, axiosConfig?: AxiosRequestConfig) => {
        const config: AxiosRequestConfig = {
          ...axiosConfig,
          url,
          method,
          data: method === 'get' ? undefined : data,
          params: method === 'get' ? data : axiosConfig?.params
        };
        
        return processRequest(config);
      }
    );
  });
  
  // Implement the generic request method
  mockAxios.request!.mockImplementation(async (config: AxiosRequestConfig) => {
    return processRequest(config);
  });
  
  // Add helper methods for testing
  const mockInstance = mockAxios as AxiosInstance & {
    mockClear: () => void;
    mockResponseOnce: (url: string, response: any) => void;
    mockErrorOnce: (url: string, error: Error) => void;
  };
  
  // Add method to clear all mocks
  mockInstance.mockClear = () => {
    methods.forEach(method => {
      (mockInstance as any)[method].mockClear();
    });
    mockInstance.request.mockClear();
  };
  
  // Add method to mock a response for a single call
  mockInstance.mockResponseOnce = (url: string, response: any) => {
    responseMap[url] = response;
  };
  
  // Add method to mock an error for a single call
  mockInstance.mockErrorOnce = (url: string, error: Error) => {
    responseMap[url] = error;
  };
  
  return mockInstance as AxiosInstance;
}

/**
 * Creates a mock implementation of the internal API client for testing
 * 
 * @param baseURL - The base URL for the API
 * @param headers - Additional headers to include with requests
 * @param mockConfig - Configuration options for the mock
 * @returns A mock Axios instance configured for internal API calls
 */
export function createMockInternalApiClient(
  baseURL: string,
  headers = {},
  mockConfig: MockAxiosConfig = {}
): AxiosInstance {
  const mockInstance = createMockSecureAxios(mockConfig);
  
  // Configure defaults to match the real implementation
  mockInstance.defaults.baseURL = baseURL;
  mockInstance.defaults.headers.common = {
    'Content-Type': 'application/json',
    ...headers
  };
  mockInstance.defaults.timeout = 10000;
  
  return mockInstance;
}

/**
 * Creates a mock response factory for testing different response scenarios
 */
export const mockResponseFactory = {
  /**
   * Creates a successful response with the given data
   * 
   * @param data - The response data
   * @returns A function that returns the response data
   */
  success: (data: any) => (config: AxiosRequestConfig) => data,
  
  /**
   * Creates a network error response
   * 
   * @param message - Optional error message
   * @returns A function that throws a network error
   */
  networkError: (message = 'Network Error') => () => {
    const error = new Error(message);
    error.name = 'NetworkError';
    return error;
  },
  
  /**
   * Creates a timeout error response
   * 
   * @returns A function that throws a timeout error
   */
  timeoutError: () => () => {
    const error = new Error('Timeout of 10000ms exceeded');
    error.name = 'TimeoutError';
    return error;
  },
  
  /**
   * Creates an HTTP error response with the given status code
   * 
   * @param status - HTTP status code
   * @param data - Optional response data
   * @returns A function that throws an HTTP error
   */
  httpError: (status: number, data: any = {}) => () => {
    const error = new Error(`Request failed with status code ${status}`);
    error.name = 'HttpError';
    (error as any).response = {
      status,
      data
    };
    return error;
  },
  
  /**
   * Creates a server error response (500)
   * 
   * @param message - Optional error message
   * @returns A function that throws a server error
   */
  serverError: (message = 'Internal Server Error') => {
    return mockResponseFactory.httpError(500, { message });
  },
  
  /**
   * Creates a client error response (400)
   * 
   * @param message - Optional error message
   * @returns A function that throws a client error
   */
  clientError: (message = 'Bad Request') => {
    return mockResponseFactory.httpError(400, { message });
  },
  
  /**
   * Creates an unauthorized error response (401)
   * 
   * @param message - Optional error message
   * @returns A function that throws an unauthorized error
   */
  unauthorizedError: (message = 'Unauthorized') => {
    return mockResponseFactory.httpError(401, { message });
  },
  
  /**
   * Creates a forbidden error response (403)
   * 
   * @param message - Optional error message
   * @returns A function that throws a forbidden error
   */
  forbiddenError: (message = 'Forbidden') => {
    return mockResponseFactory.httpError(403, { message });
  },
  
  /**
   * Creates a not found error response (404)
   * 
   * @param message - Optional error message
   * @returns A function that throws a not found error
   */
  notFoundError: (message = 'Not Found') => {
    return mockResponseFactory.httpError(404, { message });
  }
};

export default createMockSecureAxios;