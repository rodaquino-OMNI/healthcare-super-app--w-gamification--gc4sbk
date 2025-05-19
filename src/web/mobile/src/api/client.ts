import { ApolloClient, InMemoryCache, from } from '@apollo/client'; // Version 3.0+
import { createUploadLink } from 'apollo-upload-client'; // Version 17.0.0
import axios, { AxiosInstance, AxiosError } from 'axios'; // Version 1.6.8
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onError } from '@apollo/client/link/error';

// Import types from @austa/interfaces
import { 
  ApiConfig, 
  RequestConfig, 
  ErrorClassification,
  ApiErrorCode,
  ApiErrorResponse
} from '@austa/interfaces/api/request.types';
import { isUrlSafeConfig } from '@austa/interfaces/api/rest.types';
import { GraphQLErrorResponse } from '@austa/interfaces/api/graphql.types';
import { JourneyType } from '@austa/interfaces/common';

// Define __DEV__ if it's not already defined by React Native
declare const __DEV__: boolean;

/**
 * API configuration
 * Note: In a production environment, these values should be loaded from environment variables
 * or a configuration service rather than being hardcoded.
 */
const API_CONFIG: ApiConfig = {
  baseUrl: 'https://api.austa.com.br',
  graphqlEndpoint: 'https://api.austa.com.br/graphql',
  timeout: 30000, // 30 seconds
  allowedDomains: [
    'api.austa.com.br',
    'cdn.austa.com.br',
    'auth.austa.com.br',
    'storage.googleapis.com'
  ],
  // Connection pooling configuration
  connectionPool: {
    maxSockets: 20,
    maxFreeSockets: 10,
    timeout: 60000, // 60 seconds
    keepAlive: true,
    keepAliveMsecs: 30000 // 30 seconds
  },
  // Retry configuration for transient errors
  retry: {
    retries: 3,
    initialDelay: 300, // 300ms
    maxDelay: 5000, // 5 seconds
    factor: 2, // Exponential backoff factor
    statusCodes: [408, 429, 500, 502, 503, 504] // Retry on these status codes
  }
};

/**
 * Error classification based on error type and status code
 * Used to determine appropriate handling strategy
 */
const classifyError = (error: any): ErrorClassification => {
  // Default classification
  const classification: ErrorClassification = {
    type: 'UNKNOWN',
    isTransient: false,
    shouldRetry: false,
    code: ApiErrorCode.UNKNOWN_ERROR,
    context: {}
  };

  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status;

    // Add response data to context if available
    if (axiosError.response?.data) {
      classification.context.responseData = axiosError.response.data;
    }

    // Classify based on status code
    if (status) {
      classification.context.statusCode = status;

      if (status === 401) {
        classification.type = 'AUTH';
        classification.code = ApiErrorCode.UNAUTHORIZED;
      } else if (status === 403) {
        classification.type = 'AUTH';
        classification.code = ApiErrorCode.FORBIDDEN;
      } else if (status === 404) {
        classification.type = 'CLIENT';
        classification.code = ApiErrorCode.NOT_FOUND;
      } else if (status === 400 || status === 422) {
        classification.type = 'CLIENT';
        classification.code = ApiErrorCode.INVALID_INPUT;
      } else if (status >= 500) {
        classification.type = 'SERVER';
        classification.isTransient = true;
        classification.shouldRetry = API_CONFIG.retry.statusCodes.includes(status);
        classification.code = ApiErrorCode.SERVER_ERROR;
      } else if (status === 429) {
        classification.type = 'RATE_LIMIT';
        classification.isTransient = true;
        classification.shouldRetry = true;
        classification.code = ApiErrorCode.RATE_LIMITED;
      }
    } else if (axiosError.code === 'ECONNABORTED') {
      classification.type = 'TIMEOUT';
      classification.isTransient = true;
      classification.shouldRetry = true;
      classification.code = ApiErrorCode.TIMEOUT;
    } else if (!axiosError.response) {
      classification.type = 'NETWORK';
      classification.isTransient = true;
      classification.shouldRetry = true;
      classification.code = ApiErrorCode.NETWORK_ERROR;
    }
  } else if (error.graphQLErrors && Array.isArray(error.graphQLErrors)) {
    // GraphQL errors
    classification.type = 'GRAPHQL';
    classification.context.graphQLErrors = error.graphQLErrors;
    
    // Check if any of the GraphQL errors have a code that indicates a transient issue
    const hasTransientError = error.graphQLErrors.some(
      (gqlError: GraphQLErrorResponse) => {
        const errorCode = gqlError.extensions?.code;
        return [
          'INTERNAL_SERVER_ERROR',
          'SERVICE_UNAVAILABLE',
          'GATEWAY_TIMEOUT',
          'RATE_LIMITED'
        ].includes(errorCode);
      }
    );
    
    if (hasTransientError) {
      classification.isTransient = true;
      classification.shouldRetry = true;
      classification.code = ApiErrorCode.GRAPHQL_SERVER_ERROR;
    } else {
      classification.code = ApiErrorCode.GRAPHQL_ERROR;
    }
  } else if (error.networkError) {
    // Network error from Apollo
    classification.type = 'NETWORK';
    classification.isTransient = true;
    classification.shouldRetry = true;
    classification.code = ApiErrorCode.NETWORK_ERROR;
    classification.context.networkError = error.networkError;
  }

  return classification;
};

/**
 * Security function to validate URLs against SSRF attacks
 * This prevents requests to unauthorized domains or internal network addresses
 * 
 * @param url The URL to validate
 * @returns boolean indicating whether the URL is safe
 */
function isUrlSafe(url: string): boolean {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Check if the hostname is in the allowed domains list
    const isAllowedDomain = API_CONFIG.allowedDomains.some(domain => 
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );
    
    // Check if the URL uses http or https protocol
    const isAllowedProtocol = parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
    
    // Check if it's not accessing localhost or private IPs
    const isNotPrivateIP = !parsedUrl.hostname.match(/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1)/);
    
    return isAllowedDomain && isAllowedProtocol && isNotPrivateIP;
  } catch (error) {
    // If URL parsing fails, consider it unsafe
    console.error('URL validation error:', error);
    return false;
  }
}

/**
 * Create a security-enhanced axios instance with protection against:
 * 1. SSRF via Absolute URLs (CVE-2023-45857)
 * 2. Server-Side Request Forgery (CVE-2024-28849)
 * 3. Cross-Site Request Forgery
 */
const createSecureAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.baseUrl,
    timeout: API_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Helps prevent CSRF
      'User-Agent': `AustaHealthApp/${Platform.OS}`, // Identify the app
      'X-App-Version': process.env.APP_VERSION || '1.0.0', // App version for debugging
      'X-Platform': Platform.OS, // Platform information
      'X-Content-Type-Options': 'nosniff', // Prevent MIME type sniffing
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Enforce HTTPS
    },
    withCredentials: true, // Ensures cookies are sent with requests
    // Configure connection pooling for better performance
    ...(API_CONFIG.connectionPool && {
      httpAgent: new (require('http').Agent)(API_CONFIG.connectionPool),
      httpsAgent: new (require('https').Agent)(API_CONFIG.connectionPool),
    }),
  });
  
  // Add request interceptor to validate URLs before sending requests
  instance.interceptors.request.use(
    async (config: RequestConfig) => {
      // Generate and add anti-CSRF token
      const csrfToken = `austa-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
      
      // Add journey context if available
      if (config.journeyContext) {
        config.headers['X-Journey-Type'] = config.journeyContext.journeyType || JourneyType.NONE;
        if (config.journeyContext.journeyId) {
          config.headers['X-Journey-ID'] = config.journeyContext.journeyId;
        }
      }
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }
      
      // SSRF protection for URL validation
      let urlToCheck = config.url || '';
      if (!urlToCheck.startsWith('http')) {
        // Relative URL, prepend baseURL
        urlToCheck = `${config.baseURL || ''}${urlToCheck}`;
      }
      
      if (!isUrlSafe(urlToCheck)) {
        throw new Error(`Security warning: URL not allowed - ${urlToCheck}`);
      }
      
      // Ensure all URLs are normalized to prevent URL manipulation attacks
      if (config.url?.startsWith('http')) {
        // If absolute URL is provided, validate and normalize it
        const normalizedUrl = new URL(config.url);
        if (!isUrlSafe(normalizedUrl.toString())) {
          throw new Error(`Security warning: Absolute URL not allowed - ${config.url}`);
        }
        
        // Replace the absolute URL with path only to force using baseURL
        config.url = normalizedUrl.pathname + normalizedUrl.search;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for error handling
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError) => {
      // Classify the error
      const errorClassification = classifyError(error);
      
      // Enhanced structured error logging
      if (error.response) {
        console.error('API Response Error:', {
          type: errorClassification.type,
          code: errorClassification.code,
          isTransient: errorClassification.isTransient,
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
          method: error.config?.method
        });
      } else if (error.request) {
        console.error('API Request Error:', {
          type: errorClassification.type,
          code: errorClassification.code,
          isTransient: errorClassification.isTransient,
          request: error.request,
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        console.error('API Error:', {
          type: errorClassification.type,
          code: errorClassification.code,
          isTransient: errorClassification.isTransient,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        });
      }
      
      // Implement retry for transient errors if configured
      if (errorClassification.shouldRetry && error.config) {
        const config = error.config as any;
        
        // Initialize retry count if not present
        config.__retryCount = config.__retryCount || 0;
        
        // Check if we've reached max retries
        if (config.__retryCount < API_CONFIG.retry.retries) {
          // Increment retry count
          config.__retryCount += 1;
          
          // Calculate delay with exponential backoff
          const delay = Math.min(
            API_CONFIG.retry.initialDelay * Math.pow(API_CONFIG.retry.factor, config.__retryCount - 1),
            API_CONFIG.retry.maxDelay
          );
          
          // Create a new promise to retry after delay
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log(`Retrying request (${config.__retryCount}/${API_CONFIG.retry.retries})`, {
                url: config.url,
                method: config.method
              });
              resolve(instance(config));
            }, delay);
          });
        }
      }
      
      // Attach error classification to the error object for consumers
      (error as any).classification = errorClassification;
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

/**
 * Create Apollo error link for handling GraphQL errors
 */
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Classify and log GraphQL errors
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
        { extensions }
      );
    });
    
    // Create error classification
    const errorClassification = classifyError({ graphQLErrors });
    
    // Retry operation if it's a transient error and should be retried
    if (errorClassification.shouldRetry) {
      // Get retry attempt from context or initialize to 0
      const retryAttempt = operation.getContext().retryAttempt || 0;
      
      // Check if we've reached max retries
      if (retryAttempt < API_CONFIG.retry.retries) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          API_CONFIG.retry.initialDelay * Math.pow(API_CONFIG.retry.factor, retryAttempt),
          API_CONFIG.retry.maxDelay
        );
        
        // Set retry attempt in context for next attempt
        operation.setContext({
          retryAttempt: retryAttempt + 1
        });
        
        // Retry after delay
        return new Promise(resolve => {
          setTimeout(() => {
            console.log(`Retrying GraphQL operation (${retryAttempt + 1}/${API_CONFIG.retry.retries})`, {
              operationName: operation.operationName
            });
            resolve(forward(operation));
          }, delay);
        });
      }
    }
  }
  
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Classify network error
    const errorClassification = classifyError({ networkError });
    
    // Retry on network errors if configured
    if (errorClassification.shouldRetry) {
      // Similar retry logic as above
      const retryAttempt = operation.getContext().retryAttempt || 0;
      
      if (retryAttempt < API_CONFIG.retry.retries) {
        const delay = Math.min(
          API_CONFIG.retry.initialDelay * Math.pow(API_CONFIG.retry.factor, retryAttempt),
          API_CONFIG.retry.maxDelay
        );
        
        operation.setContext({
          retryAttempt: retryAttempt + 1
        });
        
        return new Promise(resolve => {
          setTimeout(() => {
            console.log(`Retrying GraphQL operation after network error (${retryAttempt + 1}/${API_CONFIG.retry.retries})`, {
              operationName: operation.operationName
            });
            resolve(forward(operation));
          }, delay);
        });
      }
    }
  }
});

/**
 * Create upload link for GraphQL file uploads
 */
const uploadLink = createUploadLink({
  uri: API_CONFIG.graphqlEndpoint,
  credentials: 'include',
  headers: {
    'X-App-Version': process.env.APP_VERSION || '1.0.0',
    'X-Platform': Platform.OS,
  }
});

/**
 * Apollo Client instance for GraphQL API requests.
 * Configured with upload capability for file transfers and appropriate caching.
 */
const graphQLClient = new ApolloClient({
  link: from([errorLink, uploadLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Add field policies for caching as needed
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all', // Return partial data and errors when available
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    }
  },
  // Enable dev tools in development environment
  connectToDevTools: __DEV__,
});

/**
 * Secure Axios instance for REST API requests.
 * Enhanced with protections against SSRF, CSRF, and other vulnerabilities.
 */
const restClient = createSecureAxiosInstance();

export { graphQLClient, restClient, API_CONFIG, classifyError };