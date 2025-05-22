import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { URL } from 'url';
import CircuitBreaker from 'opossum';
import { backOff } from 'exponential-backoff';
import { ApplicationError } from '../categories/application-error';
import { NetworkError } from '../categories/network-error';
import { SecurityError } from '../categories/security-error';

/**
 * Configuration options for the secure HTTP client
 */
export interface SecureHttpOptions {
  /**
   * Base URL for the HTTP client
   */
  baseURL?: string;
  
  /**
   * Default headers to include with every request
   */
  headers?: Record<string, string>;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to automatically retry failed requests
   */
  retry?: boolean;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Initial delay before first retry (in ms)
   */
  retryDelay?: number;
  
  /**
   * Whether to use circuit breaker pattern
   */
  circuitBreaker?: boolean;
  
  /**
   * Percentage of failures that will trigger circuit open state
   */
  errorThresholdPercentage?: number;
  
  /**
   * Time in milliseconds to wait before trying a single request when circuit is half-open
   */
  resetTimeout?: number;
  
  /**
   * List of allowed domains for requests (SSRF protection)
   */
  allowedDomains?: string[];
  
  /**
   * List of allowed IP ranges for requests (SSRF protection)
   */
  allowedIpRanges?: string[];
}

/**
 * Default configuration for secure HTTP client
 */
const DEFAULT_OPTIONS: SecureHttpOptions = {
  timeout: 10000,
  retry: true,
  maxRetries: 3,
  retryDelay: 300,
  circuitBreaker: true,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

/**
 * Regular expressions for detecting private IP ranges
 */
const PRIVATE_IP_RANGES = [
  // IPv4 private ranges
  /^0\./, // 0.0.0.0/8
  /^10\./, // 10.0.0.0/8
  /^127\./, // 127.0.0.0/8
  /^169\.254\./, // 169.254.0.0/16
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.0\.0\./, // 192.0.0.0/24
  /^192\.0\.2\./, // 192.0.2.0/24
  /^192\.168\./, // 192.168.0.0/16
  /^198\.(1[8-9])\./, // 198.18.0.0/15
  /^198\.51\.100\./, // 198.51.100.0/24
  /^203\.0\.113\./, // 203.0.113.0/24
  /^(22[4-9]|23[0-9])\./, // 224.0.0.0/4 (multicast)
  /^(24[0-9]|25[0-5])\./, // 240.0.0.0/4 (reserved)
  
  // IPv6 private ranges
  /^::1$/, // localhost
  /^fe80::/i, // link-local
  /^fc00::/i, // unique local
  /^fd00::/i, // unique local
  /^fec0::/i, // site-local (deprecated)
  /^ff00::/i, // multicast
];

/**
 * List of suspicious hostnames that could be used for SSRF
 */
const SUSPICIOUS_HOSTNAMES = [
  'localhost',
  'local',
  'intranet',
  'internal',
  'private',
  'corp',
  'corporate',
  'sinatra',
  'localtest.me',
  'test',
  'dev',
  'staging',
  'admin',
  'api',
  'backend',
  'db',
  'database',
  'redis',
  'mongodb',
  'mysql',
  'postgres',
  'elasticsearch',
  'memcached',
  'kafka',
  'zookeeper',
  'consul',
  'vault',
  'docker',
  'kubernetes',
  'k8s',
];

/**
 * HTTP status codes that are considered transient and can be retried
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Error class for SSRF protection violations
 */
export class SSRFProtectionError extends SecurityError {
  constructor(message: string) {
    super(message, 'SSRF_PROTECTION_ERROR');
    this.name = 'SSRFProtectionError';
  }
}

/**
 * Checks if a hostname is potentially unsafe (private IP or suspicious hostname)
 * @param hostname The hostname to check
 * @param allowedDomains Optional list of explicitly allowed domains
 * @returns true if the hostname is potentially unsafe
 */
function isUnsafeHostname(hostname: string, allowedDomains?: string[]): boolean {
  // Allow explicitly whitelisted domains
  if (allowedDomains && allowedDomains.some(domain => {
    // Exact match or subdomain match
    return hostname === domain || hostname.endsWith(`.${domain}`);
  })) {
    return false;
  }

  // Check for suspicious hostnames
  if (SUSPICIOUS_HOSTNAMES.some(name => hostname === name || hostname.includes(name))) {
    return true;
  }

  // Check for IP address format
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    // Check against private IP ranges
    return PRIVATE_IP_RANGES.some(range => range.test(hostname));
  }

  // Check for IPv6 format
  const ipv6Regex = /^\[?([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\]?$/i;
  if (ipv6Regex.test(hostname.replace(/\[|\]/g, ''))) {
    // Check for localhost and private ranges
    const normalizedIPv6 = hostname.replace(/\[|\]/g, '').toLowerCase();
    if (normalizedIPv6 === '::1' || normalizedIPv6.startsWith('fe80:') || 
        normalizedIPv6.startsWith('fc00:') || normalizedIPv6.startsWith('fd00:') || 
        normalizedIPv6.startsWith('fec0:') || normalizedIPv6.startsWith('ff00:')) {
      return true;
    }
  }

  return false;
}

/**
 * Creates a secured Axios instance with enhanced SSRF protection, retry capabilities,
 * circuit breaker pattern, and consistent error handling.
 * 
 * @param options Configuration options for the secure HTTP client
 * @returns A configured Axios instance with additional security and resilience features
 */
export function createSecureHttp(options: SecureHttpOptions = {}): AxiosInstance {
  // Merge default options with provided options
  const config: SecureHttpOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Create base Axios instance
  const instance = axios.create({
    baseURL: config.baseURL,
    headers: config.headers,
    timeout: config.timeout,
  });
  
  // Add request interceptor for SSRF protection
  instance.interceptors.request.use(requestConfig => {
    const url = new URL(requestConfig.url || '', requestConfig.baseURL);
    const hostname = url.hostname;
    
    // Block requests to private IP ranges and suspicious hostnames
    if (isUnsafeHostname(hostname, config.allowedDomains)) {
      throw new SSRFProtectionError(`SSRF Protection: Blocked request to potentially unsafe hostname: ${hostname}`);
    }
    
    return requestConfig;
  });

  // Create a wrapped instance with retry and circuit breaker capabilities
  const wrappedInstance = wrapWithResilience(instance, config);
  
  return wrappedInstance;
}

/**
 * Wraps an Axios instance with retry and circuit breaker capabilities
 * 
 * @param instance The Axios instance to wrap
 * @param options Configuration options
 * @returns A wrapped Axios instance with resilience features
 */
function wrapWithResilience(instance: AxiosInstance, options: SecureHttpOptions): AxiosInstance {
  // Create a proxy to intercept Axios methods
  const proxy = new Proxy(instance, {
    get(target, prop) {
      // Only intercept HTTP method functions
      const httpMethods = ['request', 'get', 'delete', 'head', 'options', 'post', 'put', 'patch'];
      
      if (typeof prop === 'string' && httpMethods.includes(prop)) {
        const originalMethod = target[prop as keyof AxiosInstance] as Function;
        
        // Return a wrapped function that adds resilience features
        return async function(...args: any[]) {
          // Extract URL from arguments for circuit breaker key
          let url = '';
          if (prop === 'request' && args[0] && typeof args[0] === 'object') {
            url = args[0].url || '';
          } else if (args[0] && typeof args[0] === 'string') {
            url = args[0];
          }
          
          // Create a circuit breaker for this URL if enabled
          if (options.circuitBreaker) {
            const breaker = getCircuitBreaker(
              url,
              async () => executeWithRetry(originalMethod.bind(target), args, options),
              options
            );
            
            try {
              return await breaker.fire();
            } catch (error) {
              // Transform error to application-specific error
              throw transformError(error);
            }
          } else {
            // Just use retry without circuit breaker
            try {
              return await executeWithRetry(originalMethod.bind(target), args, options);
            } catch (error) {
              // Transform error to application-specific error
              throw transformError(error);
            }
          }
        };
      }
      
      // Return original property for non-HTTP methods
      return target[prop as keyof AxiosInstance];
    }
  });
  
  return proxy as AxiosInstance;
}

// Cache for circuit breakers to avoid creating new ones for each request
const circuitBreakerCache = new Map<string, CircuitBreaker>();

/**
 * Gets or creates a circuit breaker for a specific URL
 * 
 * @param url The URL to create a circuit breaker for
 * @param fn The function to execute within the circuit breaker
 * @param options Configuration options
 * @returns A circuit breaker instance
 */
function getCircuitBreaker(
  url: string,
  fn: () => Promise<any>,
  options: SecureHttpOptions
): CircuitBreaker {
  // Create a key based on the URL's origin to group similar requests
  let key = url;
  try {
    const urlObj = new URL(url, options.baseURL);
    key = urlObj.origin;
  } catch (error) {
    // If URL parsing fails, use the original URL as key
  }
  
  // Return existing circuit breaker if one exists for this key
  if (circuitBreakerCache.has(key)) {
    return circuitBreakerCache.get(key)!;
  }
  
  // Create new circuit breaker
  const breaker = new CircuitBreaker(fn, {
    errorThresholdPercentage: options.errorThresholdPercentage,
    resetTimeout: options.resetTimeout,
    timeout: options.timeout,
    name: `http-${key}`,
  });
  
  // Add event listeners for logging and monitoring
  breaker.on('open', () => {
    console.warn(`Circuit breaker for ${key} is now OPEN`);
  });
  
  breaker.on('halfOpen', () => {
    console.info(`Circuit breaker for ${key} is now HALF-OPEN`);
  });
  
  breaker.on('close', () => {
    console.info(`Circuit breaker for ${key} is now CLOSED`);
  });
  
  // Cache the circuit breaker
  circuitBreakerCache.set(key, breaker);
  
  return breaker;
}

/**
 * Executes a function with retry capability using exponential backoff
 * 
 * @param fn The function to execute
 * @param args Arguments to pass to the function
 * @param options Configuration options
 * @returns The result of the function execution
 */
async function executeWithRetry(
  fn: Function,
  args: any[],
  options: SecureHttpOptions
): Promise<any> {
  if (!options.retry) {
    // If retry is disabled, just execute the function
    return fn(...args);
  }
  
  // Configure backoff options
  const backOffOptions = {
    startingDelay: options.retryDelay,
    timeMultiple: 2,  // Exponential factor
    numOfAttempts: options.maxRetries! + 1, // +1 because first attempt is not a retry
    maxDelay: 30000, // Maximum delay between retries (30 seconds)
    jitter: 'full', // Add randomness to prevent thundering herd
    retry: (error: any, attemptNumber: number) => {
      // Only retry on network errors or specific HTTP status codes
      if (error.isAxiosError) {
        const axiosError = error as AxiosError;
        
        // Retry on network errors
        if (!axiosError.response) {
          console.warn(`Network error on attempt ${attemptNumber}, retrying...`);
          return true;
        }
        
        // Retry on specific status codes
        if (axiosError.response && RETRYABLE_STATUS_CODES.includes(axiosError.response.status)) {
          console.warn(`Received status ${axiosError.response.status} on attempt ${attemptNumber}, retrying...`);
          return true;
        }
      }
      
      // Don't retry on other errors
      return false;
    }
  };
  
  // Execute with backoff
  return backOff(() => fn(...args), backOffOptions);
}

/**
 * Transforms Axios errors into application-specific error types
 * 
 * @param error The error to transform
 * @returns A transformed error with consistent format
 */
function transformError(error: any): Error {
  // Handle SSRF protection errors
  if (error instanceof SSRFProtectionError) {
    return error;
  }
  
  // Handle Axios errors
  if (error.isAxiosError) {
    const axiosError = error as AxiosError;
    
    // Network errors (no response)
    if (!axiosError.response) {
      return new NetworkError(
        axiosError.message || 'Network error occurred',
        'NETWORK_ERROR',
        { cause: axiosError }
      );
    }
    
    // HTTP errors (with response)
    const status = axiosError.response.status;
    const statusText = axiosError.response.statusText;
    const data = axiosError.response.data;
    
    // Client errors (4xx)
    if (status >= 400 && status < 500) {
      return new ApplicationError(
        `HTTP ${status} ${statusText}: ${JSON.stringify(data)}`,
        'HTTP_CLIENT_ERROR',
        { 
          cause: axiosError,
          statusCode: status,
          responseData: data
        }
      );
    }
    
    // Server errors (5xx)
    if (status >= 500) {
      return new NetworkError(
        `HTTP ${status} ${statusText}: ${JSON.stringify(data)}`,
        'HTTP_SERVER_ERROR',
        { 
          cause: axiosError,
          statusCode: status,
          responseData: data
        }
      );
    }
  }
  
  // Circuit breaker errors
  if (error.name === 'CircuitBreakerOpenError') {
    return new NetworkError(
      'Service unavailable: circuit breaker is open',
      'CIRCUIT_BREAKER_OPEN',
      { cause: error }
    );
  }
  
  // Fallback for unknown errors
  return error instanceof Error 
    ? error 
    : new Error(typeof error === 'string' ? error : 'Unknown error');
}

/**
 * Creates a secure HTTP client for internal API calls with predefined configuration
 * 
 * @param baseURL Base URL for the internal API
 * @param headers Optional headers to include with requests
 * @returns A configured secure HTTP client
 */
export function createInternalApiClient(baseURL: string, headers: Record<string, string> = {}) {
  return createSecureHttp({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    // Internal APIs typically have stricter timeout requirements
    timeout: 5000,
    // More aggressive retry for internal services
    retry: true,
    maxRetries: 2,
    retryDelay: 200,
    // Circuit breaker with lower threshold for internal services
    circuitBreaker: true,
    errorThresholdPercentage: 30,
    resetTimeout: 5000,
    // Allow internal domains
    allowedDomains: ['internal-api', 'service', 'api']
  });
}

export default createSecureHttp;