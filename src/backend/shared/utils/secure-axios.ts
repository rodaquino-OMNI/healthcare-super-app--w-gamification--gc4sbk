import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TechnicalError, ExternalApiError, SecurityError } from '@austa/errors/categories';
import { HttpRequestOptions, HttpResponse } from '@austa/interfaces/common/http';

/**
 * Configuration options for creating a secure Axios instance
 */
export interface SecureAxiosOptions extends AxiosRequestConfig {
  /**
   * Default timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;
  
  /**
   * Additional private IP ranges to block beyond the standard ones
   * @example ['192.168.10.', '172.20.']
   */
  additionalBlockedRanges?: string[];
  
  /**
   * Whether to retry failed requests
   * @default false
   */
  enableRetry?: boolean;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Base delay in milliseconds for exponential backoff
   * @default 300
   */
  retryDelay?: number;
}

/**
 * Default secure Axios configuration
 */
const DEFAULT_OPTIONS: SecureAxiosOptions = {
  timeout: 30000, // 30 seconds
  enableRetry: false,
  maxRetries: 3,
  retryDelay: 300,
};

/**
 * Regular expression to match private IP ranges and localhost
 * Covers:
 * - 10.0.0.0/8
 * - 172.16.0.0/12
 * - 192.168.0.0/16
 * - 127.0.0.0/8 (localhost)
 * - 0.0.0.0
 * - localhost
 * - IPv6 loopback (::1)
 * - IPv6 link-local (fe80::)
 * - .local domains
 * - .internal domains
 * - .localhost domains
 */
const PRIVATE_IP_REGEX = /^(
  (10\.)|
  (172\.(1[6-9]|2[0-9]|3[0-1])\.)|
  (192\.168\.)|
  (127\.)|
  (0\.0\.0\.0)|
  (localhost)|
  (::1)|
  (fe80::)|
  ([^.]*\.(local|internal|localhost|example|test|invalid)$)
)/i;

/**
 * Creates a secured Axios instance with protections against SSRF attacks.
 * 
 * This implementation includes:
 * - Blocking requests to private IP ranges and localhost
 * - Configurable timeouts and retry policies
 * - Integration with the @austa/errors framework for standardized error handling
 * - Type-safe request and response handling
 * 
 * @param options Configuration options for the Axios instance
 * @returns A configured Axios instance with additional security measures
 * 
 * @example
 * // Basic usage
 * const secureClient = createSecureAxios();
 * 
 * // With custom configuration
 * const customClient = createSecureAxios({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 *   headers: { 'Authorization': 'Bearer token' },
 *   enableRetry: true
 * });
 */
export function createSecureAxios(options: SecureAxiosOptions = {}): AxiosInstance {
  // Merge default options with provided options
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Create Axios instance with merged config
  const instance = axios.create(config);
  
  // Add request interceptor to block private IP ranges
  instance.interceptors.request.use(config => {
    if (!config.url) {
      throw new SecurityError('URL is required for the request', {
        code: 'SECURE_AXIOS_MISSING_URL',
        statusCode: 400,
      });
    }
    
    try {
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Check against private IP regex
      if (PRIVATE_IP_REGEX.test(hostname)) {
        throw new SecurityError('SSRF Protection: Blocked request to private or local network', {
          code: 'SECURE_AXIOS_SSRF_BLOCKED',
          statusCode: 403,
          metadata: { blockedHost: hostname }
        });
      }
      
      // Check against additional blocked ranges if provided
      if (config.additionalBlockedRanges) {
        for (const range of config.additionalBlockedRanges) {
          if (hostname.startsWith(range)) {
            throw new SecurityError('SSRF Protection: Blocked request to restricted IP range', {
              code: 'SECURE_AXIOS_CUSTOM_RANGE_BLOCKED',
              statusCode: 403,
              metadata: { blockedHost: hostname, blockedRange: range }
            });
          }
        }
      }
      
      return config;
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      
      // Handle URL parsing errors
      throw new SecurityError('SSRF Protection: Invalid URL format', {
        code: 'SECURE_AXIOS_INVALID_URL',
        statusCode: 400,
        cause: error
      });
    }
  });
  
  // Add response interceptor for standardized error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        throw new ExternalApiError('Network error or service unavailable', {
          code: 'EXTERNAL_API_NETWORK_ERROR',
          statusCode: 503,
          cause: error,
          metadata: {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
          }
        });
      }
      
      // Handle API errors with standardized format
      throw new ExternalApiError(`External API error: ${error.message}`, {
        code: 'EXTERNAL_API_ERROR',
        statusCode: error.response.status,
        cause: error,
        metadata: {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response.status,
          statusText: error.response.statusText,
          responseData: error.response.data,
        }
      });
    }
  );
  
  // Implement retry logic if enabled
  if (config.enableRetry) {
    let retryCount = 0;
    
    instance.interceptors.response.use(undefined, async (error: AxiosError) => {
      const { config } = error;
      
      // Only retry on network errors or 5xx responses
      const shouldRetry = (
        !error.response || 
        (error.response.status >= 500 && error.response.status < 600)
      );
      
      if (!shouldRetry || !config || retryCount >= (config.maxRetries || DEFAULT_OPTIONS.maxRetries!)) {
        return Promise.reject(error);
      }
      
      // Implement exponential backoff
      retryCount++;
      const delay = (config.retryDelay || DEFAULT_OPTIONS.retryDelay!) * Math.pow(2, retryCount - 1);
      
      return new Promise(resolve => {
        setTimeout(() => resolve(instance(config)), delay);
      });
    });
  }
  
  return instance;
}

/**
 * Creates a secure axios instance with predefined config for internal API calls
 * 
 * @param baseURL The base URL for the API
 * @param options Additional configuration options
 * @returns A configured Axios instance for internal API communication
 * 
 * @example
 * // Basic usage with just a base URL
 * const apiClient = createInternalApiClient('https://api.example.com');
 * 
 * // With additional options
 * const apiClient = createInternalApiClient('https://api.example.com', {
 *   headers: { 'X-API-Key': 'your-api-key' },
 *   timeout: 5000
 * });
 */
export function createInternalApiClient<T = any>(baseURL: string, options: HttpRequestOptions = {}): {
  get: <R = T>(url: string, config?: AxiosRequestConfig) => Promise<HttpResponse<R>>;
  post: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => Promise<HttpResponse<R>>;
  put: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => Promise<HttpResponse<R>>;
  patch: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => Promise<HttpResponse<R>>;
  delete: <R = T>(url: string, config?: AxiosRequestConfig) => Promise<HttpResponse<R>>;
} {
  const instance = createSecureAxios({
    baseURL,
    timeout: options.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    enableRetry: options.enableRetry || false,
    maxRetries: options.maxRetries || 3,
    retryDelay: options.retryDelay || 300,
  });
  
  // Create type-safe wrapper methods
  return {
    get: <R = T>(url: string, config?: AxiosRequestConfig) => 
      instance.get<R>(url, config).then(response => response.data),
    
    post: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => 
      instance.post<R>(url, data, config).then(response => response.data),
    
    put: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => 
      instance.put<R>(url, data, config).then(response => response.data),
    
    patch: <R = T, D = any>(url: string, data?: D, config?: AxiosRequestConfig) => 
      instance.patch<R>(url, data, config).then(response => response.data),
    
    delete: <R = T>(url: string, config?: AxiosRequestConfig) => 
      instance.delete<R>(url, config).then(response => response.data),
  };
}

export default createSecureAxios;