import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * Creates a secured Axios instance with protections against SSRF attacks.
 * 
 * This utility helps prevent Server-Side Request Forgery (SSRF) attacks by blocking
 * requests to private IP ranges, loopback addresses, and local domains.
 * 
 * @returns A configured Axios instance with additional security measures
 */
export function createSecureAxios(): AxiosInstance {
  const instance = axios.create();
  
  // Add request interceptor to block private IP ranges
  instance.interceptors.request.use(config => {
    if (!config.url) return config;
    
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
        throw new Error('SSRF Protection: Blocked request to private or local network');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('SSRF Protection')) {
        throw error;
      }
      // If there's an error parsing the URL, continue with the request
    }
    
    return config;
  });

  return instance;
}

/**
 * Creates a secure axios instance with predefined config for internal API calls
 * between AUSTA SuperApp services.
 * 
 * @param baseURL - The base URL for the API
 * @param headers - Additional headers to include with requests
 * @returns A configured Axios instance with security measures and standardized settings
 */
export function createInternalApiClient(baseURL: string, headers: Record<string, string> = {}): AxiosInstance {
  const instance = createSecureAxios();
  
  instance.defaults.baseURL = baseURL;
  instance.defaults.headers.common = {
    'Content-Type': 'application/json',
    ...headers
  };
  instance.defaults.timeout = 10000; // Standardized 10 second timeout for all internal API calls
  
  return instance;
}

export default createSecureAxios;