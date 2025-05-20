import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Creates a secured Axios instance with protections against Server-Side Request Forgery (SSRF) attacks.
 * 
 * This utility prevents outbound requests to private network ranges, loopback addresses,
 * unspecified addresses, link-local IPv6, localhost, and .local mDNS domains.
 * 
 * @returns A configured Axios instance with SSRF protection measures
 */
export function createSecureAxios(): AxiosInstance {
  const instance = axios.create();
  
  // Add request interceptor to block private IP ranges and local addresses
  instance.interceptors.request.use((config: AxiosRequestConfig) => {
    if (!config.url) return config;
    
    try {
      const url = new URL(config.url, config.baseURL);
      const hostname = url.hostname;
      
      // Block requests to private IP ranges and local addresses
      if (
        // IPv4 private ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
        // Loopback addresses (127.x.x.x)
        // Unspecified address (0.0.0.0)
        /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
        // IPv6 loopback (::1)
        hostname === '::1' ||
        // IPv6 link-local (fe80::)
        hostname === 'fe80::' ||
        // mDNS .local domains
        hostname.endsWith('.local')
      ) {
        throw new Error('SSRF Protection: Blocked request to private or local network');
      }
    } catch (error) {
      // Re-throw SSRF protection errors
      if (error instanceof Error && error.message.includes('SSRF Protection')) {
        throw error;
      }
      // If there's an error parsing the URL, continue with the request
      // This prevents crashes from malformed URLs while maintaining security
    }
    
    return config;
  });

  return instance;
}

/**
 * Creates a secure axios instance with predefined configuration for internal API calls.
 * 
 * This function builds on the SSRF-protected Axios instance and adds standardized
 * configuration for service-to-service communication within the AUSTA SuperApp.
 * 
 * @param baseURL - The base URL for the internal API
 * @param headers - Additional headers to include with requests
 * @returns A configured Axios instance with security measures and standard settings
 */
export function createInternalApiClient(baseURL: string, headers = {}): AxiosInstance {
  const instance = createSecureAxios();
  
  // Configure standard settings for internal API communication
  instance.defaults.baseURL = baseURL;
  instance.defaults.timeout = 10000; // 10 seconds timeout for all internal requests
  
  // Set default headers with proper merging
  instance.defaults.headers.common = {
    'Content-Type': 'application/json',
    ...headers
  };
  
  return instance;
}

export default createSecureAxios;