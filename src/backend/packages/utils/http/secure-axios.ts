import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Error thrown when a request is blocked by SSRF protection
 */
export class SSRFProtectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFProtectionError';
  }
}

/**
 * Creates a secured Axios instance with protections against Server-Side Request Forgery (SSRF) attacks.
 * 
 * This function configures an Axios instance with interceptors that prevent requests to:
 * - Private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
 * - Loopback addresses (127.x.x.x, ::1)
 * - Unspecified addresses (0.0.0.0)
 * - Link-local IPv6 addresses (fe80::)
 * - Localhost and .local domains
 * 
 * @example
 * ```typescript
 * // Create a secure Axios instance
 * const secureClient = createSecureAxios();
 * 
 * // Use it to make requests
 * try {
 *   const response = await secureClient.get('https://api.example.com/data');
 *   console.log(response.data);
 * } catch (error) {
 *   if (error instanceof SSRFProtectionError) {
 *     console.error('Request blocked by SSRF protection:', error.message);
 *   } else {
 *     console.error('Request failed:', error);
 *   }
 * }
 * ```
 * 
 * @returns A configured Axios instance with SSRF protection measures
 */
export function createSecureAxios(): AxiosInstance {
  const instance = axios.create();
  
  // Add request interceptor to block private IP ranges and other restricted targets
  instance.interceptors.request.use(config => {
    if (!config.url) return config;
    
    try {
      // Handle protocol-relative URLs that could be used to bypass protection
      if (config.url.startsWith('//')) {
        throw new SSRFProtectionError('SSRF Protection: Protocol-relative URLs are not allowed');
      }
      
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Block requests to private IP ranges, loopback, unspecified addresses, and local domains
      if (
        // Private IPv4 ranges
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(hostname) ||
        // Loopback addresses
        /^127\./.test(hostname) ||
        // Unspecified address
        hostname === '0.0.0.0' ||
        // IPv6 loopback
        hostname === '::1' ||
        // IPv6 link-local
        /^fe80:/i.test(hostname) ||
        // Localhost
        hostname === 'localhost' ||
        // .local domains (mDNS)
        hostname.endsWith('.local')
      ) {
        throw new SSRFProtectionError('SSRF Protection: Blocked request to private or local network');
      }
    } catch (error) {
      // If it's already our custom error, rethrow it
      if (error instanceof SSRFProtectionError) {
        throw error;
      }
      
      // If there's an error parsing the URL, log it and continue with the request
      // This allows relative URLs to work correctly with baseURL
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        // Only continue if there's a baseURL, otherwise it could be an attack
        if (!config.baseURL) {
          throw new SSRFProtectionError('SSRF Protection: Invalid URL without baseURL');
        }
      }
    }
    
    return config;
  });

  // Add response interceptor for better error handling
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        // Add additional context to the error
        const enhancedError = error as AxiosError & { isSSRFError?: boolean };
        
        // Check if this was an SSRF protection error
        if (error.message.includes('SSRF Protection')) {
          enhancedError.isSSRFError = true;
        }
        
        return Promise.reject(enhancedError);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

/**
 * Configuration options for internal API client
 */
export interface InternalApiClientConfig extends AxiosRequestConfig {
  /**
   * Custom timeout in milliseconds
   * @default 10000 (10 seconds)
   */
  timeout?: number;
}

/**
 * Creates a secure axios instance with predefined configuration for internal API calls.
 * 
 * This function builds on top of createSecureAxios() to provide a standardized client
 * for service-to-service communication with consistent timeout, content type, and headers.
 * 
 * @example
 * ```typescript
 * // Create a client for the auth service
 * const authClient = createInternalApiClient('http://auth-service:3000/api', {
 *   'X-Service-Name': 'health-service'
 * });
 * 
 * // Use it to make authenticated requests
 * try {
 *   const userData = await authClient.get('/users/me', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 *   console.log(userData.data);
 * } catch (error) {
 *   console.error('Auth service request failed:', error);
 * }
 * ```
 * 
 * @param baseURL - The base URL for the API
 * @param headers - Additional headers to include with requests
 * @param config - Additional axios configuration options
 * @returns A configured Axios instance with security measures and standardized settings
 */
export function createInternalApiClient(
  baseURL: string, 
  headers: Record<string, string> = {},
  config: InternalApiClientConfig = {}
): AxiosInstance {
  const instance = createSecureAxios();
  
  // Set default configuration
  instance.defaults.baseURL = baseURL;
  instance.defaults.timeout = config.timeout || 10000; // Default 10 second timeout
  
  // Merge headers with defaults
  instance.defaults.headers.common = {
    'Content-Type': 'application/json',
    ...headers
  };
  
  // Apply any additional configuration
  if (config) {
    // Don't override the properties we've already set
    const { baseURL: _, headers: __, timeout: ___, ...restConfig } = config;
    Object.assign(instance.defaults, restConfig);
  }
  
  return instance;
}

export default createSecureAxios;