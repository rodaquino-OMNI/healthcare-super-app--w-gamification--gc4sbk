/**
 * @file response-helpers.ts
 * @description Utility functions for standardized HTTP response processing across the AUSTA SuperApp backend services.
 * Provides error parsing, pagination handling, schema validation, data sanitization, and response logging.
 */

import { Logger } from '@austa/logging';
import { BaseError, ErrorType } from '@austa/errors';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a DOM environment for DOMPurify when running in Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Standard error response structure that can be used across all services
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  type?: ErrorType;
  path?: string;
  timestamp?: string;
}

/**
 * Standard pagination metadata structure
 */
export interface PaginationData {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Options for error response parsing
 */
export interface ParseErrorOptions {
  /** Include stack trace in development environments */
  includeStack?: boolean;
  /** Default error code if none is found */
  defaultCode?: string;
  /** Default error message if none is found */
  defaultMessage?: string;
  /** Journey context for error categorization */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Options for response data sanitization
 */
export interface SanitizeOptions {
  /** Allow specific HTML tags (default: false) */
  allowHtml?: boolean;
  /** Specific HTML tags to allow when allowHtml is true */
  allowedTags?: string[];
  /** Specific HTML attributes to allow when allowHtml is true */
  allowedAttributes?: Record<string, string[]>;
  /** Remove all HTML (more aggressive than default sanitization) */
  stripAllHtml?: boolean;
  /** Preserve line breaks as <br> tags */
  preserveLineBreaks?: boolean;
}

/**
 * Default sanitization options
 */
const defaultSanitizeOptions: SanitizeOptions = {
  allowHtml: false,
  stripAllHtml: false,
  preserveLineBreaks: true,
};

/**
 * Extracts error details from various API response formats
 * 
 * @param error - The error object to parse
 * @param options - Options for error parsing
 * @returns Standardized error response object
 */
export function parseErrorResponse(error: any, options: ParseErrorOptions = {}): ErrorResponse {
  const {
    includeStack = process.env.NODE_ENV === 'development',
    defaultCode = 'UNKNOWN_ERROR',
    defaultMessage = 'An unexpected error occurred',
    journeyContext,
  } = options;

  // Handle BaseError from @austa/errors package
  if (error instanceof BaseError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        ...error.context,
        ...(includeStack && error.stack ? { stack: error.stack } : {}),
      },
      type: error.type,
      path: error.path,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      code: defaultCode,
      message: error.message || defaultMessage,
      details: includeStack && error.stack ? { stack: error.stack } : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle Axios error responses
  if (error?.response?.data) {
    const { data } = error.response;
    
    // Handle various API error formats
    if (data.error || data.message || data.code) {
      return {
        code: data.code || data.error?.code || defaultCode,
        message: data.message || data.error?.message || defaultMessage,
        details: data.details || data.error?.details,
        path: error.response.config?.url,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Handle plain objects that might be errors
  if (typeof error === 'object' && error !== null) {
    return {
      code: error.code || error.errorCode || defaultCode,
      message: error.message || error.errorMessage || defaultMessage,
      details: error.details || error.data,
      timestamp: new Date().toISOString(),
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      code: defaultCode,
      message: error || defaultMessage,
      timestamp: new Date().toISOString(),
    };
  }

  // Default fallback
  return {
    code: defaultCode,
    message: defaultMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Extracts and normalizes pagination data from various API response formats
 * 
 * @param response - The API response containing pagination information
 * @param defaultPageSize - Default page size if not specified in response
 * @returns Standardized pagination data
 */
export function extractPaginationData(response: any, defaultPageSize = 10): PaginationData | null {
  if (!response) {
    return null;
  }

  // Handle common pagination formats
  const pagination = response.pagination || response.meta?.pagination || response.page || response;

  // Extract pagination values with fallbacks
  const page = Number(pagination.page || pagination.currentPage || pagination.pageNumber || 1);
  const pageSize = Number(pagination.pageSize || pagination.perPage || pagination.limit || defaultPageSize);
  const totalItems = Number(pagination.totalItems || pagination.total || pagination.count || 0);
  
  // Calculate total pages
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0;
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Validates response data against a Zod schema
 * 
 * @param data - The data to validate
 * @param schema - Zod schema to validate against
 * @param options - Options for validation
 * @returns Validated and typed data or null if validation fails
 */
export function validateResponseSchema<T>(data: any, schema: z.ZodType<T>, options: { throwOnError?: boolean } = {}): T | null {
  try {
    const result = schema.parse(data);
    return result;
  } catch (error) {
    if (options.throwOnError) {
      throw new BaseError({
        message: 'Response schema validation failed',
        code: 'INVALID_RESPONSE_SCHEMA',
        context: {
          zodErrors: (error as z.ZodError).errors,
          receivedData: data,
        },
      });
    }
    return null;
  }
}

/**
 * Sanitizes response data to prevent XSS and injection vulnerabilities
 * 
 * @param data - The data to sanitize
 * @param options - Sanitization options
 * @returns Sanitized data safe for rendering
 */
export function sanitizeResponseData(data: any, options: SanitizeOptions = defaultSanitizeOptions): any {
  if (data === null || data === undefined) {
    return data;
  }

  const sanitizeOptions = { ...defaultSanitizeOptions, ...options };

  // Handle string data
  if (typeof data === 'string') {
    if (sanitizeOptions.stripAllHtml) {
      // Strip all HTML tags
      let sanitized = data.replace(/<[^>]*>/g, '');
      
      // Optionally preserve line breaks
      if (sanitizeOptions.preserveLineBreaks) {
        sanitized = sanitized.replace(/\n/g, '<br>');
      }
      
      return sanitized;
    } else if (sanitizeOptions.allowHtml) {
      // Use DOMPurify with custom configuration
      const purifyConfig: DOMPurify.Config = {};
      
      if (sanitizeOptions.allowedTags) {
        purifyConfig.ALLOWED_TAGS = sanitizeOptions.allowedTags;
      }
      
      if (sanitizeOptions.allowedAttributes) {
        purifyConfig.ALLOWED_ATTR = [];
        Object.values(sanitizeOptions.allowedAttributes).forEach(attrs => {
          purifyConfig.ALLOWED_ATTR = [
            ...(purifyConfig.ALLOWED_ATTR || []),
            ...attrs,
          ];
        });
      }
      
      return purify.sanitize(data, purifyConfig);
    } else {
      // Default: encode all HTML
      return purify.sanitize(data, { ALLOWED_TAGS: [] });
    }
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item, sanitizeOptions));
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeResponseData(value, sanitizeOptions);
    }
    
    return sanitized;
  }

  // Return primitive values as is
  return data;
}

/**
 * Options for response logging
 */
export interface LogResponseOptions {
  /** Include response body in logs (default: false for large responses) */
  includeBody?: boolean;
  /** Maximum response body size to log in bytes */
  maxBodySize?: number;
  /** Include request details in log */
  includeRequest?: boolean;
  /** Journey context for log categorization */
  journeyContext?: 'health' | 'care' | 'plan';
  /** Custom logger instance */
  logger?: Logger;
  /** Additional metadata to include in log */
  metadata?: Record<string, any>;
}

/**
 * Logs HTTP response details in a standardized format
 * 
 * @param response - The HTTP response to log
 * @param options - Logging options
 */
export function logResponse(response: any, options: LogResponseOptions = {}): void {
  const {
    includeBody = false,
    maxBodySize = 1024, // Default to 1KB max
    includeRequest = true,
    journeyContext,
    logger,
    metadata = {},
  } = options;

  // Use provided logger or console as fallback
  const log = logger || console;

  // Extract response details
  const status = response?.status || response?.statusCode;
  const url = response?.config?.url || response?.request?.url;
  const method = response?.config?.method || response?.request?.method;
  const responseTime = response?.config?.metadata?.responseTime;

  // Prepare log data
  const logData: Record<string, any> = {
    status,
    url,
    method,
    responseTime,
    ...metadata,
  };

  // Add journey context if provided
  if (journeyContext) {
    logData.journey = journeyContext;
  }

  // Add request details if enabled
  if (includeRequest && response?.config) {
    logData.request = {
      headers: sanitizeHeaders(response.config.headers),
      params: response.config.params,
      // Don't include request body by default for security
    };
  }

  // Add response body if enabled and not too large
  if (includeBody && response?.data) {
    const responseBody = typeof response.data === 'string'
      ? response.data
      : JSON.stringify(response.data);

    if (responseBody.length <= maxBodySize) {
      logData.responseBody = response.data;
    } else {
      logData.responseBody = '[Response body too large to log]';
      logData.responseBodySize = responseBody.length;
    }
  }

  // Log at appropriate level based on status code
  if (status >= 500) {
    log.error('HTTP Response Error', logData);
  } else if (status >= 400) {
    log.warn('HTTP Response Warning', logData);
  } else {
    log.info('HTTP Response Success', logData);
  }
}

/**
 * Sanitizes headers to remove sensitive information
 * 
 * @param headers - The headers object to sanitize
 * @returns Sanitized headers safe for logging
 */
function sanitizeHeaders(headers: Record<string, any> = {}): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveHeaders.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}