import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ExternalApiError, ExternalResponseFormatError } from '@austa/errors/categories';
import { ErrorType } from '@austa/errors/types';

/**
 * Configuration options for creating a secure Axios instance
 */
export interface SecureAxiosConfig extends AxiosRequestConfig {
  /**
   * Default timeout in milliseconds
   * @default 30000 (30 seconds)
   */
  timeout?: number;
  
  /**
   * Whether to retry failed requests
   * @default false
   */
  retry?: boolean;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Base delay for exponential backoff in milliseconds
   * @default 300
   */
  retryDelay?: number;
}

/**
 * Default configuration for secure Axios instances
 */
const DEFAULT_CONFIG: SecureAxiosConfig = {
  timeout: 30000, // 30 seconds
  retry: false,
  maxRetries: 3,
  retryDelay: 300,
};

/**
 * Enhanced regex pattern for detecting private IP ranges and local addresses
 * Covers:
 * - IPv4 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Loopback addresses (127.0.0.0/8)
 * - Link-local addresses (169.254.0.0/16)
 * - Reserved addresses (0.0.0.0/8)
 * - IPv6 loopback (::1)
 * - IPv6 link-local (fe80::)
 * - .local domains
 * - localhost
 */
const PRIVATE_IP_REGEX = /^(
  (10\.)|(172\.(1[6-9]|2[0-9]|3[0-1])\.)|  # Private IPv4 ranges
  (192\.168\.)|(127\.)|(169\.254\.)|(0\.)| # More private/reserved IPv4
  (::1$)|(fe80::)|(fc00::)|                  # IPv6 loopback and link-local
  (localhost)|(.*\.local$)                   # localhost and .local domains
)/x;

/**
 * Creates a secured Axios instance with protections against SSRF attacks.
 * 
 * This utility provides a secure HTTP client that prevents server-side request forgery
 * by blocking requests to private IP ranges, localhost, and internal networks.
 * 
 * Security features:
 * - Blocks requests to private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Blocks requests to loopback addresses (127.0.0.0/8)
 * - Blocks requests to link-local addresses (169.254.0.0/16)
 * - Blocks requests to reserved addresses (0.0.0.0/8)
 * - Blocks requests to IPv6 loopback (::1) and link-local (fe80::)
 * - Blocks requests to .local domains and localhost
 * 
 * @param config - Optional Axios configuration options
 * @returns A configured Axios instance with additional security measures
 * 
 * @example
 * // Create a basic secure Axios instance
 * const client = createSecureAxios();
 * 
 * @example
 * // Create a secure Axios instance with custom configuration
 * const client = createSecureAxios({
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 */
export function createSecureAxios(config: SecureAxiosConfig = {}): AxiosInstance {
  // Merge provided config with defaults
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create Axios instance with merged config
  const instance = axios.create(mergedConfig);
  
  // Add request interceptor to block private IP ranges
  instance.interceptors.request.use(config => {
    if (!config.url) {
      throw new ExternalApiError(
        'Missing URL in request configuration',
        { context: { config } }
      );
    }
    
    try {
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Block requests to private IP ranges using enhanced regex
      if (PRIVATE_IP_REGEX.test(hostname)) {
        throw new ExternalApiError(
          'SSRF Protection: Blocked request to private or local network',
          { 
            context: { url: url.toString(), hostname },
            errorType: ErrorType.EXTERNAL
          }
        );
      }
      
      return config;
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }
      
      throw new ExternalApiError(
        'Invalid URL in request configuration',
        { 
          context: { url: config.url, baseURL: config.baseURL },
          cause: error instanceof Error ? error : new Error(String(error))
        }
      );
    }
  });

  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        
        // Create a more descriptive error with proper classification
        throw new ExternalApiError(
          error.message || 'External API request failed',
          {
            context: {
              status,
              url: error.config?.url,
              method: error.config?.method?.toUpperCase(),
              data: error.response?.data,
            },
            cause: error
          }
        );
      }
      
      throw error;
    }
  );

  return instance;
}

/**
 * Configuration options for internal API clients
 */
export interface InternalApiClientConfig extends SecureAxiosConfig {
  /**
   * Service name for tracing and logging
   */
  serviceName?: string;
  
  /**
   * Journey context for request tracking
   */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Creates a secure axios instance with predefined config for internal API calls
 * between microservices.
 * 
 * @param baseURL - Base URL for the internal service
 * @param config - Additional configuration options
 * @returns Configured Axios instance for internal service communication
 * 
 * @example
 * // Create a client for the auth service
 * const authClient = createInternalApiClient('http://auth-service:3000', {
 *   serviceName: 'auth-service',
 *   timeout: 5000
 * });
 * 
 * @example
 * // Create a client for a journey-specific service
 * const healthClient = createInternalApiClient('http://health-service:3000', {
 *   journeyContext: 'health',
 *   headers: { 'x-correlation-id': correlationId }
 * });
 */
export function createInternalApiClient(
  baseURL: string,
  config: InternalApiClientConfig = {}
): AxiosInstance {
  const { serviceName, journeyContext, headers = {}, ...restConfig } = config;
  
  // Set up default headers for internal communication
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Add service name header if provided
  if (serviceName) {
    defaultHeaders['x-service-name'] = serviceName;
  }
  
  // Add journey context header if provided
  if (journeyContext) {
    defaultHeaders['x-journey-context'] = journeyContext;
  }
  
  // Create secure axios instance with internal defaults
  return createSecureAxios({
    baseURL,
    // Default timeout for internal calls (shorter than external)
    timeout: 10000,
    // Enable retries for internal service calls
    retry: true,
    // Merge provided headers with defaults
    headers: { ...defaultHeaders, ...headers },
    // Spread remaining config
    ...restConfig
  });
}

export default createSecureAxios;