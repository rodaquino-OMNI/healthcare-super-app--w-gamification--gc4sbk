/**
 * @file Request Helpers
 * @description Utility functions for standardizing HTTP request operations across the AUSTA SuperApp backend services.
 * These utilities enhance security, provide consistent logging, and enable cross-journey context propagation.
 */

import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as path from 'path';
import { URL } from 'url';
import { JourneyType, JourneyContext } from '@austa/logging/dist/context/journey-context.interface';
import { LoggerService } from '@austa/logging';

/**
 * Interface for authentication token information
 */
interface AuthToken {
  token: string;
  type: 'Bearer' | 'Basic' | string;
}

/**
 * Interface for request parameters validation options
 */
interface ValidationOptions {
  required?: string[];
  allowedValues?: Record<string, any[]>;
  minLength?: Record<string, number>;
  maxLength?: Record<string, number>;
  pattern?: Record<string, RegExp>;
  custom?: (params: Record<string, any>) => { valid: boolean; message?: string };
}

/**
 * Interface for journey context information to be attached to requests
 */
export interface RequestJourneyContext {
  journeyType: JourneyType;
  journeySessionId?: string;
  currentStep?: string;
  previousStep?: string;
  crossJourneyFlowId?: string;
  [key: string]: any;
}

/**
 * Interface for request logging options
 */
export interface RequestLogOptions {
  includeHeaders?: boolean;
  includeBody?: boolean;
  maskSensitiveData?: boolean;
  sensitiveFields?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default sensitive fields that should be masked in logs
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'secret',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'cpf',
];

/**
 * Adds authentication header to the request configuration
 * 
 * @param config - The Axios request configuration
 * @param token - The authentication token information
 * @returns The updated Axios request configuration
 */
export function addAuthHeader(config: AxiosRequestConfig, token: AuthToken): AxiosRequestConfig {
  if (!config.headers) {
    config.headers = {};
  }

  if (!token || !token.token) {
    throw new Error('Authentication token is required');
  }

  const tokenType = token.type || 'Bearer';
  config.headers['Authorization'] = `${tokenType} ${token.token}`;
  
  return config;
}

/**
 * Adds journey context information to the request
 * 
 * @param config - The Axios request configuration
 * @param journeyContext - The journey context information
 * @returns The updated Axios request configuration
 */
export function addJourneyContext(config: AxiosRequestConfig, journeyContext: RequestJourneyContext): AxiosRequestConfig {
  if (!config.headers) {
    config.headers = {};
  }

  if (!journeyContext || !journeyContext.journeyType) {
    throw new Error('Journey type is required in journey context');
  }

  // Add journey context as custom headers
  config.headers['X-Journey-Type'] = journeyContext.journeyType;
  
  if (journeyContext.journeySessionId) {
    config.headers['X-Journey-Session-ID'] = journeyContext.journeySessionId;
  }
  
  if (journeyContext.crossJourneyFlowId) {
    config.headers['X-Cross-Journey-Flow-ID'] = journeyContext.crossJourneyFlowId;
  }

  // Add full journey context as metadata in the request
  if (!config.metadata) {
    config.metadata = {};
  }
  
  config.metadata.journeyContext = journeyContext;
  
  return config;
}

/**
 * Sanitizes a URL to prevent path traversal and other URL-based attacks
 * 
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 * @throws Error if the URL is invalid or contains path traversal attempts
 */
export function sanitizeRequestUrl(url: string): string {
  if (!url) {
    throw new Error('URL is required');
  }

  try {
    // Check if it's a full URL with protocol
    if (url.includes('://')) {
      const parsedUrl = new URL(url);
      
      // Normalize the path to prevent path traversal
      const normalizedPath = path.normalize(parsedUrl.pathname).replace(/\\/g, '/');
      
      // Check for path traversal attempts
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected in URL');
      }
      
      // Reconstruct the URL with the normalized path
      parsedUrl.pathname = normalizedPath;
      return parsedUrl.toString();
    } else {
      // It's a relative path
      const normalizedPath = path.normalize(url).replace(/\\/g, '/');
      
      // Check for path traversal attempts
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        throw new Error('Path traversal detected in URL');
      }
      
      return normalizedPath;
    }
  } catch (error) {
    if (error.message === 'Path traversal detected in URL') {
      throw error;
    }
    throw new Error(`Invalid URL: ${error.message}`);
  }
}

/**
 * Validates request parameters against specified validation rules
 * 
 * @param params - The parameters to validate
 * @param options - The validation options
 * @returns Object with validation result and optional error message
 */
export function validateRequestParams(
  params: Record<string, any>,
  options: ValidationOptions
): { valid: boolean; message?: string } {
  if (!params) {
    return { valid: false, message: 'Request parameters are required' };
  }

  // Check required fields
  if (options.required && options.required.length > 0) {
    for (const field of options.required) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        return { valid: false, message: `Required field '${field}' is missing` };
      }
    }
  }

  // Check allowed values
  if (options.allowedValues) {
    for (const [field, allowedValues] of Object.entries(options.allowedValues)) {
      if (params[field] !== undefined && !allowedValues.includes(params[field])) {
        return {
          valid: false,
          message: `Field '${field}' has invalid value. Allowed values: ${allowedValues.join(', ')}`
        };
      }
    }
  }

  // Check minimum length
  if (options.minLength) {
    for (const [field, minLength] of Object.entries(options.minLength)) {
      if (
        params[field] !== undefined && 
        typeof params[field] === 'string' && 
        params[field].length < minLength
      ) {
        return {
          valid: false,
          message: `Field '${field}' must be at least ${minLength} characters long`
        };
      }
    }
  }

  // Check maximum length
  if (options.maxLength) {
    for (const [field, maxLength] of Object.entries(options.maxLength)) {
      if (
        params[field] !== undefined && 
        typeof params[field] === 'string' && 
        params[field].length > maxLength
      ) {
        return {
          valid: false,
          message: `Field '${field}' must be at most ${maxLength} characters long`
        };
      }
    }
  }

  // Check pattern
  if (options.pattern) {
    for (const [field, pattern] of Object.entries(options.pattern)) {
      if (
        params[field] !== undefined && 
        typeof params[field] === 'string' && 
        !pattern.test(params[field])
      ) {
        return {
          valid: false,
          message: `Field '${field}' does not match the required pattern`
        };
      }
    }
  }

  // Run custom validation if provided
  if (options.custom) {
    return options.custom(params);
  }

  return { valid: true };
}

/**
 * Masks sensitive data in an object for logging purposes
 * 
 * @param data - The data object to mask
 * @param sensitiveFields - Array of field names to mask
 * @returns A new object with sensitive data masked
 */
function maskSensitiveData(data: Record<string, any>, sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const maskedData = { ...data };

  // Recursively process the object
  for (const [key, value] of Object.entries(maskedData)) {
    // Check if this key should be masked
    const shouldMask = sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (shouldMask && value) {
      // Mask the value based on its type
      if (typeof value === 'string') {
        maskedData[key] = value.length > 0 ? '********' : '';
      } else if (typeof value === 'number') {
        maskedData[key] = 0;
      } else if (typeof value === 'boolean') {
        maskedData[key] = false;
      } else {
        maskedData[key] = '[REDACTED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      if (Array.isArray(value)) {
        maskedData[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? maskSensitiveData(item, sensitiveFields) 
            : item
        );
      } else {
        maskedData[key] = maskSensitiveData(value, sensitiveFields);
      }
    }
  }

  return maskedData;
}

/**
 * Logs HTTP request details in a standardized format
 * 
 * @param logger - The logger service instance
 * @param config - The Axios request configuration
 * @param options - The logging options
 */
export function logRequest(
  logger: LoggerService,
  config: AxiosRequestConfig,
  options: RequestLogOptions = {}
): void {
  const {
    includeHeaders = true,
    includeBody = true,
    maskSensitiveData: shouldMaskData = true,
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    logLevel = 'info'
  } = options;

  try {
    // Create the log data object
    const logData: Record<string, any> = {
      url: config.url,
      method: config.method?.toUpperCase() || 'GET',
      baseURL: config.baseURL,
      timeout: config.timeout,
    };

    // Add headers if requested
    if (includeHeaders && config.headers) {
      logData.headers = shouldMaskData 
        ? maskSensitiveData(config.headers, sensitiveFields)
        : config.headers;
    }

    // Add request body if requested
    if (includeBody && config.data) {
      logData.data = shouldMaskData 
        ? maskSensitiveData(config.data, sensitiveFields)
        : config.data;
    }

    // Add journey context if available
    if (config.metadata?.journeyContext) {
      logData.journeyContext = config.metadata.journeyContext;
    }

    // Log the request with the appropriate log level
    const message = `HTTP ${logData.method} Request to ${logData.url}`;
    switch (logLevel) {
      case 'debug':
        logger.debug(message, logData);
        break;
      case 'warn':
        logger.warn(message, logData);
        break;
      case 'error':
        logger.error(message, logData);
        break;
      case 'info':
      default:
        logger.log(message, logData);
        break;
    }
  } catch (error) {
    // If logging fails, log a simplified message
    logger.error(`Failed to log HTTP request: ${error.message}`, {
      url: config.url,
      method: config.method?.toUpperCase() || 'GET',
    });
  }
}

/**
 * Logs HTTP response details in a standardized format
 * 
 * @param logger - The logger service instance
 * @param response - The Axios response object
 * @param options - The logging options
 */
export function logResponse(
  logger: LoggerService,
  response: AxiosResponse,
  options: RequestLogOptions = {}
): void {
  const {
    includeHeaders = true,
    includeBody = true,
    maskSensitiveData: shouldMaskData = true,
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    logLevel = 'info'
  } = options;

  try {
    // Create the log data object
    const logData: Record<string, any> = {
      url: response.config.url,
      method: response.config.method?.toUpperCase() || 'GET',
      status: response.status,
      statusText: response.statusText,
      responseTime: response.config.metadata?.responseTime,
    };

    // Add headers if requested
    if (includeHeaders && response.headers) {
      logData.headers = shouldMaskData 
        ? maskSensitiveData(response.headers, sensitiveFields)
        : response.headers;
    }

    // Add response data if requested
    if (includeBody && response.data) {
      logData.data = shouldMaskData 
        ? maskSensitiveData(response.data, sensitiveFields)
        : response.data;
    }

    // Add journey context if available
    if (response.config.metadata?.journeyContext) {
      logData.journeyContext = response.config.metadata.journeyContext;
    }

    // Log the response with the appropriate log level
    const message = `HTTP ${logData.status} Response from ${logData.method} ${logData.url}`;
    switch (logLevel) {
      case 'debug':
        logger.debug(message, logData);
        break;
      case 'warn':
        logger.warn(message, logData);
        break;
      case 'error':
        logger.error(message, logData);
        break;
      case 'info':
      default:
        logger.log(message, logData);
        break;
    }
  } catch (error) {
    // If logging fails, log a simplified message
    logger.error(`Failed to log HTTP response: ${error.message}`, {
      url: response.config.url,
      method: response.config.method?.toUpperCase() || 'GET',
      status: response.status,
    });
  }
}

/**
 * Logs HTTP error details in a standardized format
 * 
 * @param logger - The logger service instance
 * @param error - The Axios error object
 * @param options - The logging options
 */
export function logRequestError(
  logger: LoggerService,
  error: AxiosError,
  options: RequestLogOptions = {}
): void {
  const {
    includeHeaders = true,
    includeBody = false,
    maskSensitiveData: shouldMaskData = true,
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    logLevel = 'error'
  } = options;

  try {
    // Create the log data object
    const logData: Record<string, any> = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase() || 'GET',
      code: error.code,
      message: error.message,
    };

    // Add response details if available
    if (error.response) {
      logData.status = error.response.status;
      logData.statusText = error.response.statusText;
      
      // Add response headers if requested
      if (includeHeaders && error.response.headers) {
        logData.responseHeaders = shouldMaskData 
          ? maskSensitiveData(error.response.headers, sensitiveFields)
          : error.response.headers;
      }
      
      // Add response data if requested
      if (includeBody && error.response.data) {
        logData.responseData = shouldMaskData 
          ? maskSensitiveData(error.response.data, sensitiveFields)
          : error.response.data;
      }
    }

    // Add request headers if requested
    if (includeHeaders && error.config?.headers) {
      logData.requestHeaders = shouldMaskData 
        ? maskSensitiveData(error.config.headers, sensitiveFields)
        : error.config.headers;
    }

    // Add request data if requested
    if (includeBody && error.config?.data) {
      logData.requestData = shouldMaskData 
        ? maskSensitiveData(error.config.data, sensitiveFields)
        : error.config.data;
    }

    // Add journey context if available
    if (error.config?.metadata?.journeyContext) {
      logData.journeyContext = error.config.metadata.journeyContext;
    }

    // Log the error with the appropriate log level
    const message = error.response
      ? `HTTP ${error.response.status} Error from ${logData.method} ${logData.url}: ${error.message}`
      : `HTTP Request Error for ${logData.method} ${logData.url}: ${error.message}`;
    
    switch (logLevel) {
      case 'debug':
        logger.debug(message, logData);
        break;
      case 'warn':
        logger.warn(message, logData);
        break;
      case 'info':
        logger.log(message, logData);
        break;
      case 'error':
      default:
        logger.error(message, logData, error);
        break;
    }
  } catch (loggingError) {
    // If logging fails, log a simplified message
    logger.error(`Failed to log HTTP error: ${loggingError.message}`, {
      originalError: error.message,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase() || 'GET',
      status: error.response?.status,
    }, loggingError);
  }
}

/**
 * Creates Axios request interceptors for consistent request handling
 * 
 * @param logger - The logger service instance
 * @param logOptions - The logging options
 * @returns Object with request and response interceptors
 */
export function createRequestInterceptors(logger: LoggerService, logOptions: RequestLogOptions = {}) {
  return {
    /**
     * Request interceptor to handle outgoing requests
     */
    requestInterceptor: (config: AxiosRequestConfig) => {
      try {
        // Start timing the request
        const startTime = Date.now();
        if (!config.metadata) {
          config.metadata = {};
        }
        config.metadata.requestStartTime = startTime;
        
        // Sanitize the URL
        if (config.url) {
          config.url = sanitizeRequestUrl(config.url);
        }
        
        // Log the request
        logRequest(logger, config, logOptions);
        
        return config;
      } catch (error) {
        logger.error(`Request interceptor error: ${error.message}`, { config }, error);
        return config;
      }
    },
    
    /**
     * Request error interceptor
     */
    requestErrorInterceptor: (error: any) => {
      logRequestError(logger, error, logOptions);
      return Promise.reject(error);
    },
    
    /**
     * Response interceptor to handle incoming responses
     */
    responseInterceptor: (response: AxiosResponse) => {
      try {
        // Calculate response time
        if (response.config?.metadata?.requestStartTime) {
          const endTime = Date.now();
          const startTime = response.config.metadata.requestStartTime;
          if (!response.config.metadata) {
            response.config.metadata = {};
          }
          response.config.metadata.responseTime = endTime - startTime;
        }
        
        // Log the response
        logResponse(logger, response, logOptions);
        
        return response;
      } catch (error) {
        logger.error(`Response interceptor error: ${error.message}`, { response }, error);
        return response;
      }
    },
    
    /**
     * Response error interceptor
     */
    responseErrorInterceptor: (error: AxiosError) => {
      logRequestError(logger, error, logOptions);
      return Promise.reject(error);
    }
  };
}