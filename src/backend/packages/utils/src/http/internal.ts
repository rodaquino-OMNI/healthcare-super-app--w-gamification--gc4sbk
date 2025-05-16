import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createSecureHttpClient } from './security';

/**
 * Represents the journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  NOTIFICATION = 'notification',
  AUTH = 'auth',
}

/**
 * Configuration options for the internal API client
 */
export interface InternalApiClientOptions {
  /**
   * Base URL for the API
   */
  baseURL: string;
  
  /**
   * Additional headers to include with requests
   */
  headers?: Record<string, string>;
  
  /**
   * Request timeout in milliseconds (default: 10000)
   */
  timeout?: number;
  
  /**
   * Journey context for the client
   */
  journeyContext?: {
    /**
     * The journey type this client is associated with
     */
    journeyType: JourneyType;
    
    /**
     * Additional journey-specific context
     */
    context?: Record<string, any>;
  };
  
  /**
   * Retry configuration
   */
  retry?: {
    /**
     * Maximum number of retry attempts (default: 3)
     */
    maxRetries?: number;
    
    /**
     * Base delay in milliseconds for exponential backoff (default: 300)
     */
    baseDelayMs?: number;
    
    /**
     * HTTP status codes that should trigger a retry
     */
    retryStatusCodes?: number[];
    
    /**
     * Whether to retry on network errors (default: true)
     */
    retryNetworkErrors?: boolean;
  };
  
  /**
   * Circuit breaker configuration
   */
  circuitBreaker?: {
    /**
     * Whether to enable circuit breaker (default: true)
     */
    enabled?: boolean;
    
    /**
     * Number of failures before opening the circuit (default: 5)
     */
    failureThreshold?: number;
    
    /**
     * Time in milliseconds to keep the circuit open (default: 30000)
     */
    resetTimeoutMs?: number;
  };
  
  /**
   * Tracing configuration
   */
  tracing?: {
    /**
     * Whether to enable distributed tracing (default: true)
     */
    enabled?: boolean;
    
    /**
     * Name of the service making the request
     */
    serviceName?: string;
  };
}

/**
 * Default retry status codes that should trigger a retry
 */
const DEFAULT_RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Circuit breaker state
 */
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

/**
 * Circuit breaker states for different services
 */
const circuitBreakerStates: Record<string, CircuitBreakerState> = {};

/**
 * Creates a secure axios instance with predefined config for internal API calls
 * with enhanced features for service-to-service communication.
 * 
 * @param options - Configuration options for the internal API client
 * @returns A configured Axios instance with security measures, retry logic, and error handling
 */
export function createInternalApiClient(options: InternalApiClientOptions): AxiosInstance {
  const {
    baseURL,
    headers = {},
    timeout = 10000,
    journeyContext,
    retry = {
      maxRetries: 3,
      baseDelayMs: 300,
      retryStatusCodes: DEFAULT_RETRY_STATUS_CODES,
      retryNetworkErrors: true,
    },
    circuitBreaker = {
      enabled: true,
      failureThreshold: 5,
      resetTimeoutMs: 30000,
    },
    tracing = {
      enabled: true,
      serviceName: 'unknown-service',
    },
  } = options;

  // Create a secure axios instance
  const securityClient = createSecureHttpClient();
  const instance = axios.create();
  
  // Add URL validation interceptor for SSRF protection
  instance.interceptors.request.use(config => {
    if (config.url) {
      securityClient.validateUrl(config.url, config.baseURL);
    }
    return config;
  });
  
  // Set default configuration
  instance.defaults.baseURL = baseURL;
  instance.defaults.timeout = timeout;
  
  // Set default headers with journey context
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add journey context headers if provided
  if (journeyContext) {
    defaultHeaders['X-Journey-Type'] = journeyContext.journeyType;
    
    // Add additional context as headers if provided
    if (journeyContext.context) {
      Object.entries(journeyContext.context).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          defaultHeaders[`X-Journey-${key}`] = String(value);
        }
      });
    }
  }
  
  // Set the default headers
  instance.defaults.headers.common = defaultHeaders;
  
  // Generate a unique identifier for this service endpoint for circuit breaker state
  const serviceKey = `${baseURL}-${journeyContext?.journeyType || 'unknown'}`;
  
  // Initialize circuit breaker state if it doesn't exist
  if (circuitBreaker.enabled && !circuitBreakerStates[serviceKey]) {
    circuitBreakerStates[serviceKey] = {
      failures: 0,
      lastFailureTime: 0,
      isOpen: false,
    };
  }
  
  // Add request interceptor for circuit breaker and tracing
  instance.interceptors.request.use(
    async (config) => {
      // Check if circuit is open
      if (circuitBreaker.enabled && circuitBreakerStates[serviceKey]?.isOpen) {
        const state = circuitBreakerStates[serviceKey];
        const now = Date.now();
        
        // Check if circuit should be reset (half-open)
        if (now - state.lastFailureTime > circuitBreaker.resetTimeoutMs) {
          // Reset to half-open state
          state.isOpen = false;
          state.failures = 0;
        } else {
          // Circuit is still open, reject the request
          return Promise.reject(new Error(`Circuit breaker is open for ${serviceKey}`));
        }
      }
      
      // Add tracing headers if enabled
      if (tracing.enabled) {
        // Add correlation ID if not already present
        if (!config.headers['X-Correlation-ID']) {
          config.headers['X-Correlation-ID'] = generateCorrelationId();
        }
        
        // Add service name
        config.headers['X-Source-Service'] = tracing.serviceName;
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor for retry logic and circuit breaker
  instance.interceptors.response.use(
    // Success handler
    (response) => {
      // Reset circuit breaker on success
      if (circuitBreaker.enabled && circuitBreakerStates[serviceKey]) {
        circuitBreakerStates[serviceKey].failures = 0;
        circuitBreakerStates[serviceKey].isOpen = false;
      }
      
      return response;
    },
    // Error handler
    async (error: AxiosError) => {
      // Get the config and response from the error
      const config = error.config as AxiosRequestConfig & { _retryCount?: number };
      const status = error.response?.status;
      
      // Initialize retry count if not present
      if (config._retryCount === undefined) {
        config._retryCount = 0;
      }
      
      // Check if we should retry the request
      const shouldRetry = (
        // Check if we have retries left
        config._retryCount < retry.maxRetries &&
        // Check if it's a network error or a retryable status code
        ((retry.retryNetworkErrors && !error.response) ||
         (status && retry.retryStatusCodes.includes(status)))
      );
      
      // Update circuit breaker state
      if (circuitBreaker.enabled && circuitBreakerStates[serviceKey]) {
        const state = circuitBreakerStates[serviceKey];
        
        // Increment failure count
        state.failures += 1;
        state.lastFailureTime = Date.now();
        
        // Check if circuit should be opened
        if (state.failures >= circuitBreaker.failureThreshold) {
          state.isOpen = true;
        }
      }
      
      // Retry the request if needed
      if (shouldRetry) {
        config._retryCount += 1;
        
        // Calculate delay with exponential backoff
        const delay = calculateRetryDelay(
          config._retryCount,
          retry.baseDelayMs,
          status === 429 ? getRetryAfterMs(error.response) : undefined
        );
        
        // Wait for the delay
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        // Retry the request
        return instance(config);
      }
      
      // Enhance error with journey context
      if (journeyContext) {
        enhanceErrorWithJourneyContext(error, journeyContext);
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
}

/**
 * Generates a correlation ID for distributed tracing
 * 
 * @returns A unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Calculates the retry delay using exponential backoff
 * 
 * @param retryCount - The current retry attempt number
 * @param baseDelayMs - The base delay in milliseconds
 * @param retryAfterMs - Optional retry-after time from server
 * @returns The delay in milliseconds
 */
function calculateRetryDelay(
  retryCount: number,
  baseDelayMs: number,
  retryAfterMs?: number
): number {
  // If retry-after header is present, use that value
  if (retryAfterMs) {
    return retryAfterMs;
  }
  
  // Calculate exponential backoff with jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, retryCount - 1);
  const jitter = Math.random() * 0.2 * exponentialDelay; // 20% jitter
  
  return exponentialDelay + jitter;
}

/**
 * Extracts retry-after time from response headers
 * 
 * @param response - The Axios response object
 * @returns The retry-after time in milliseconds, or undefined if not present
 */
function getRetryAfterMs(response?: AxiosResponse): number | undefined {
  if (!response || !response.headers) return undefined;
  
  const retryAfter = response.headers['retry-after'];
  if (!retryAfter) return undefined;
  
  // If retry-after is a number, it's in seconds
  if (!isNaN(Number(retryAfter))) {
    return Number(retryAfter) * 1000;
  }
  
  // If it's a date, calculate the difference
  const retryDate = new Date(retryAfter);
  if (!isNaN(retryDate.getTime())) {
    return Math.max(0, retryDate.getTime() - Date.now());
  }
  
  return undefined;
}

/**
 * Enhances an error with journey context information
 * 
 * @param error - The Axios error object
 * @param journeyContext - The journey context
 */
function enhanceErrorWithJourneyContext(
  error: AxiosError,
  journeyContext: InternalApiClientOptions['journeyContext']
): void {
  if (!error || !journeyContext) return;
  
  // Add journey context to the error object
  (error as any).journeyContext = journeyContext;
  
  // Enhance error message with journey information
  if (error.message) {
    error.message = `[${journeyContext.journeyType.toUpperCase()}] ${error.message}`;
  }
}

/**
 * Creates a journey-specific internal API client for the Health journey
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Health journey
 */
export function createHealthJourneyClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.HEALTH,
    },
    ...options,
  });
}

/**
 * Creates a journey-specific internal API client for the Care journey
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Care journey
 */
export function createCareJourneyClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.CARE,
    },
    ...options,
  });
}

/**
 * Creates a journey-specific internal API client for the Plan journey
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Plan journey
 */
export function createPlanJourneyClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.PLAN,
    },
    ...options,
  });
}

/**
 * Creates a journey-specific internal API client for the Gamification engine
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Gamification engine
 */
export function createGamificationClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.GAMIFICATION,
    },
    ...options,
  });
}

/**
 * Creates a journey-specific internal API client for the Notification service
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Notification service
 */
export function createNotificationClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.NOTIFICATION,
    },
    ...options,
  });
}

/**
 * Creates a journey-specific internal API client for the Auth service
 * 
 * @param baseURL - The base URL for the API
 * @param options - Additional configuration options
 * @returns A configured Axios instance for the Auth service
 */
export function createAuthClient(
  baseURL: string,
  options: Omit<InternalApiClientOptions, 'baseURL' | 'journeyContext'> = {}
): AxiosInstance {
  return createInternalApiClient({
    baseURL,
    journeyContext: {
      journeyType: JourneyType.AUTH,
    },
    ...options,
  });
}