/**
 * @file Response Helpers
 * @description Utility functions for standardized HTTP response processing across the AUSTA SuperApp backend services.
 */

import { AxiosResponse, AxiosError } from 'axios';
import { z } from 'zod';
import { ErrorCategory, ErrorType, SerializedError } from '@austa/errors/types';

/**
 * Standard pagination metadata structure
 */
export interface PaginationMetadata {
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page available */
  hasNextPage: boolean;
  /** Whether there is a previous page available */
  hasPrevPage: boolean;
}

/**
 * Options for extracting pagination data
 */
export interface PaginationExtractionOptions {
  /** Default page number if not found in response */
  defaultPage?: number;
  /** Default limit if not found in response */
  defaultLimit?: number;
  /** Custom field name for page in the response */
  pageField?: string;
  /** Custom field name for limit in the response */
  limitField?: string;
  /** Custom field name for total items in the response */
  totalItemsField?: string;
  /** Whether to extract pagination from headers instead of response body */
  useHeaders?: boolean;
  /** Custom header name for page */
  pageHeader?: string;
  /** Custom header name for limit */
  limitHeader?: string;
  /** Custom header name for total items */
  totalItemsHeader?: string;
}

/**
 * Options for sanitizing response data
 */
export interface SanitizeOptions {
  /** Whether to allow certain HTML tags */
  allowSomeTags?: boolean;
  /** List of allowed HTML tags if allowSomeTags is true */
  allowedTags?: string[];
  /** Whether to encode all HTML entities */
  encodeEntities?: boolean;
  /** Whether to sanitize URLs in the response */
  sanitizeUrls?: boolean;
  /** Whether to sanitize nested objects recursively */
  recursive?: boolean;
}

/**
 * Options for logging response data
 */
export interface LogResponseOptions {
  /** Whether to include headers in the log */
  includeHeaders?: boolean;
  /** Whether to include the full response body in the log */
  includeBody?: boolean;
  /** Maximum length of the response body to log */
  maxBodyLength?: number;
  /** Whether to mask sensitive data in the log */
  maskSensitiveData?: boolean;
  /** List of fields to mask if maskSensitiveData is true */
  sensitiveFields?: string[];
  /** Custom logger function */
  logger?: (message: string, data?: any) => void;
}

/**
 * Extracts error details from various API error response formats
 * 
 * @param error - The error object from an API request
 * @returns A standardized error object with consistent properties
 */
export function parseErrorResponse(error: AxiosError | Error | unknown): SerializedError {
  // Default error structure
  const defaultError: SerializedError = {
    error: {
      code: 'UNKNOWN_ERROR',
      category: ErrorCategory.TECHNICAL,
      type: ErrorType.UNEXPECTED_ERROR,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    }
  };

  try {
    // Handle Axios errors
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      // If the error has a response with data
      if (axiosError.response?.data) {
        const responseData = axiosError.response.data as any;
        
        // Handle standard error format
        if (responseData.error) {
          return {
            error: {
              code: responseData.error.code || `HTTP_${axiosError.response.status}`,
              category: responseData.error.category || mapHttpStatusToErrorCategory(axiosError.response.status),
              type: responseData.error.type || ErrorType.EXTERNAL_SERVICE_ERROR,
              message: responseData.error.message || axiosError.message,
              detail: responseData.error.detail,
              action: responseData.error.action,
              helpLink: responseData.error.helpLink,
              field: responseData.error.field,
              details: responseData.error.details,
              timestamp: responseData.error.timestamp || new Date().toISOString(),
              correlationId: responseData.error.correlationId || axiosError.response.headers['x-correlation-id'],
            }
          };
        }
        
        // Handle simple message format
        if (responseData.message) {
          return {
            error: {
              code: `HTTP_${axiosError.response.status}`,
              category: mapHttpStatusToErrorCategory(axiosError.response.status),
              type: ErrorType.EXTERNAL_SERVICE_ERROR,
              message: responseData.message,
              timestamp: new Date().toISOString(),
              correlationId: axiosError.response.headers['x-correlation-id'],
            }
          };
        }
        
        // Handle other formats
        return {
          error: {
            code: `HTTP_${axiosError.response.status}`,
            category: mapHttpStatusToErrorCategory(axiosError.response.status),
            type: ErrorType.EXTERNAL_SERVICE_ERROR,
            message: axiosError.message || 'External service error',
            details: responseData,
            timestamp: new Date().toISOString(),
            correlationId: axiosError.response.headers['x-correlation-id'],
          }
        };
      }
      
      // Handle network errors
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return {
          error: {
            code: 'NETWORK_TIMEOUT',
            category: ErrorCategory.TIMEOUT,
            type: ErrorType.REQUEST_TIMEOUT,
            message: 'Request timed out',
            detail: axiosError.message,
            timestamp: new Date().toISOString(),
          }
        };
      }
      
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          error: {
            code: 'SERVICE_UNAVAILABLE',
            category: ErrorCategory.EXTERNAL,
            type: ErrorType.EXTERNAL_SERVICE_UNAVAILABLE,
            message: 'Service is unavailable',
            detail: axiosError.message,
            timestamp: new Date().toISOString(),
          }
        };
      }
      
      // Default Axios error
      return {
        error: {
          code: axiosError.code || 'NETWORK_ERROR',
          category: ErrorCategory.EXTERNAL,
          type: ErrorType.EXTERNAL_SERVICE_ERROR,
          message: axiosError.message || 'Network error',
          timestamp: new Date().toISOString(),
        }
      };
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      return {
        error: {
          code: 'APPLICATION_ERROR',
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.UNEXPECTED_ERROR,
          message: error.message,
          timestamp: new Date().toISOString(),
        }
      };
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      return {
        error: {
          code: 'APPLICATION_ERROR',
          category: ErrorCategory.TECHNICAL,
          type: ErrorType.UNEXPECTED_ERROR,
          message: error,
          timestamp: new Date().toISOString(),
        }
      };
    }
    
    // Handle unknown errors
    return defaultError;
  } catch (parseError) {
    // If error parsing fails, return default error
    return defaultError;
  }
}

/**
 * Maps HTTP status codes to error categories
 * 
 * @param status - HTTP status code
 * @returns The corresponding error category
 */
function mapHttpStatusToErrorCategory(status: number): ErrorCategory {
  if (status >= 400 && status < 500) {
    if (status === 400) return ErrorCategory.VALIDATION;
    if (status === 401) return ErrorCategory.AUTHENTICATION;
    if (status === 403) return ErrorCategory.AUTHORIZATION;
    if (status === 404) return ErrorCategory.NOT_FOUND;
    if (status === 409) return ErrorCategory.CONFLICT;
    if (status === 422) return ErrorCategory.BUSINESS;
    if (status === 429) return ErrorCategory.RATE_LIMIT;
    return ErrorCategory.VALIDATION;
  }
  
  if (status >= 500) {
    if (status === 502 || status === 503 || status === 504) {
      return ErrorCategory.EXTERNAL;
    }
    return ErrorCategory.TECHNICAL;
  }
  
  return ErrorCategory.TECHNICAL;
}

/**
 * Extracts standardized pagination data from API responses
 * 
 * @param response - The API response object
 * @param options - Options for extracting pagination data
 * @returns Standardized pagination metadata
 */
export function extractPaginationData(
  response: AxiosResponse | any,
  options: PaginationExtractionOptions = {}
): PaginationMetadata {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    pageField = 'page',
    limitField = 'limit',
    totalItemsField = 'totalItems',
    useHeaders = false,
    pageHeader = 'X-Page',
    limitHeader = 'X-Limit',
    totalItemsHeader = 'X-Total-Count'
  } = options;

  let page = defaultPage;
  let limit = defaultLimit;
  let totalItems = 0;

  try {
    if (useHeaders && response.headers) {
      // Extract pagination from headers (case-insensitive)
      const headers = response.headers;
      const headerKeys = Object.keys(headers);
      
      // Find headers (case-insensitive)
      const findHeader = (name: string) => {
        const key = headerKeys.find(k => k.toLowerCase() === name.toLowerCase());
        return key ? headers[key] : undefined;
      };
      
      const pageValue = findHeader(pageHeader);
      const limitValue = findHeader(limitHeader);
      const totalValue = findHeader(totalItemsHeader);
      
      // Parse header values
      if (pageValue) page = parseInt(pageValue, 10) || defaultPage;
      if (limitValue) limit = parseInt(limitValue, 10) || defaultLimit;
      if (totalValue) totalItems = parseInt(totalValue, 10) || 0;
      
      // Check for Link header (GitHub API style pagination)
      const linkHeader = findHeader('link');
      if (linkHeader && typeof linkHeader === 'string') {
        // Extract page information from Link header
        const links = linkHeader.split(',');
        const hasNext = links.some(link => link.includes('rel="next"'));
        const hasPrev = links.some(link => link.includes('rel="prev"'));
        
        // If we have link headers but no total, estimate based on current page and links
        if (totalItems === 0) {
          if (!hasNext) {
            // If no next page, we're on the last page
            totalItems = page * limit;
          } else {
            // If there's a next page, we know there are at least this many items
            totalItems = page * limit + 1;
          }
        }
      }
    } else if (response.data) {
      // Extract pagination from response body
      const data = response.data;
      
      // Handle common pagination formats
      if (typeof data[pageField] !== 'undefined') {
        page = parseInt(data[pageField], 10) || defaultPage;
      } else if (typeof data.pagination?.page !== 'undefined') {
        page = parseInt(data.pagination.page, 10) || defaultPage;
      } else if (typeof data.meta?.page !== 'undefined') {
        page = parseInt(data.meta.page, 10) || defaultPage;
      }
      
      if (typeof data[limitField] !== 'undefined') {
        limit = parseInt(data[limitField], 10) || defaultLimit;
      } else if (typeof data.pagination?.limit !== 'undefined') {
        limit = parseInt(data.pagination.limit, 10) || defaultLimit;
      } else if (typeof data.meta?.limit !== 'undefined') {
        limit = parseInt(data.meta.limit, 10) || defaultLimit;
      } else if (typeof data.pagination?.perPage !== 'undefined') {
        limit = parseInt(data.pagination.perPage, 10) || defaultLimit;
      } else if (typeof data.meta?.perPage !== 'undefined') {
        limit = parseInt(data.meta.perPage, 10) || defaultLimit;
      }
      
      if (typeof data[totalItemsField] !== 'undefined') {
        totalItems = parseInt(data[totalItemsField], 10) || 0;
      } else if (typeof data.pagination?.totalItems !== 'undefined') {
        totalItems = parseInt(data.pagination.totalItems, 10) || 0;
      } else if (typeof data.meta?.totalItems !== 'undefined') {
        totalItems = parseInt(data.meta.totalItems, 10) || 0;
      } else if (typeof data.pagination?.total !== 'undefined') {
        totalItems = parseInt(data.pagination.total, 10) || 0;
      } else if (typeof data.meta?.total !== 'undefined') {
        totalItems = parseInt(data.meta.total, 10) || 0;
      } else if (Array.isArray(data.items) && data.items.length < limit) {
        // If we have fewer items than the limit, assume it's the last page
        totalItems = (page - 1) * limit + data.items.length;
      } else if (Array.isArray(data) && data.length < limit) {
        // If the data itself is an array with fewer items than the limit
        totalItems = (page - 1) * limit + data.length;
      }
    }
  } catch (error) {
    // If extraction fails, use defaults
    console.error('Error extracting pagination data:', error);
  }

  // Calculate derived pagination values
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage
  };
}

/**
 * Validates response data against a Zod schema
 * 
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @param options - Options for validation
 * @returns The validated data or throws an error
 */
export function validateResponseSchema<T>(data: unknown, schema: z.ZodType<T>, options?: {
  throwOnError?: boolean;
  errorMessage?: string;
}): T | null {
  const { throwOnError = true, errorMessage = 'Response data validation failed' } = options || {};
  
  try {
    // Parse and validate the data against the schema
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the validation errors
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      // Log the validation errors
      console.error('Schema validation error:', {
        message: errorMessage,
        errors: formattedErrors
      });
      
      // Throw or return null based on options
      if (throwOnError) {
        throw new Error(`${errorMessage}: ${JSON.stringify(formattedErrors)}`);
      }
      
      return null;
    }
    
    // Handle other types of errors
    console.error('Unexpected validation error:', error);
    
    if (throwOnError) {
      throw new Error(errorMessage);
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
export function sanitizeResponseData<T>(data: T, options: SanitizeOptions = {}): T {
  const {
    allowSomeTags = false,
    allowedTags = [],
    encodeEntities = true,
    sanitizeUrls = true,
    recursive = true
  } = options;

  // If data is null or undefined, return as is
  if (data === null || data === undefined) {
    return data;
  }

  // Handle different data types
  if (typeof data === 'string') {
    return sanitizeString(data, { allowSomeTags, allowedTags, encodeEntities, sanitizeUrls }) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => recursive ? sanitizeResponseData(item, options) : item) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      result[key] = recursive ? sanitizeResponseData(value, options) : value;
    }
    
    return result as T;
  }

  // For primitive types (number, boolean, etc.), return as is
  return data;
}

/**
 * Sanitizes a string to prevent XSS attacks
 * 
 * @param str - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
function sanitizeString(str: string, options: {
  allowSomeTags: boolean;
  allowedTags: string[];
  encodeEntities: boolean;
  sanitizeUrls: boolean;
}): string {
  const { allowSomeTags, allowedTags, encodeEntities, sanitizeUrls } = options;
  
  let result = str;
  
  // Encode HTML entities to prevent script execution
  if (encodeEntities) {
    if (!allowSomeTags) {
      // Encode all HTML tags
      result = result.replace(/[&<>"']/g, char => {
        switch (char) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          default: return char;
        }
      });
    } else if (allowedTags.length > 0) {
      // Allow specific tags but encode all others
      // This is a simplified implementation - a production version would use a proper HTML parser
      const allowedTagsPattern = allowedTags.map(tag => tag.toLowerCase()).join('|');
      const regex = new RegExp(`<(?!\/?(?:${allowedTagsPattern})\b)[^>]*>`, 'gi');
      result = result.replace(regex, match => {
        return match.replace(/[<>]/g, char => {
          return char === '<' ? '&lt;' : '&gt;';
        });
      });
    }
  }
  
  // Sanitize URLs to prevent javascript: protocol exploitation
  if (sanitizeUrls) {
    // Find and sanitize URLs in href and src attributes
    result = result.replace(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi, (match, attr, quote, url) => {
      if (/^\s*javascript:/i.test(url)) {
        return `${attr}=${quote}#${quote}`; // Replace javascript: URLs with #
      }
      return match;
    });
    
    // Find and sanitize inline event handlers
    result = result.replace(/\bon\w+\s*=\s*(["'])(.*?)\1/gi, (match, quote, handler) => {
      return ''; // Remove inline event handlers
    });
  }
  
  return result;
}

/**
 * Logs HTTP response data in a standardized format
 * 
 * @param response - The HTTP response to log
 * @param options - Logging options
 */
export function logResponse(response: AxiosResponse | any, options: LogResponseOptions = {}): void {
  const {
    includeHeaders = false,
    includeBody = true,
    maxBodyLength = 1000,
    maskSensitiveData = true,
    sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'auth'],
    logger = console.log
  } = options;

  try {
    // Extract basic response info
    const status = response.status || 'unknown';
    const statusText = response.statusText || '';
    const url = response.config?.url || 'unknown';
    const method = response.config?.method?.toUpperCase() || 'unknown';
    
    // Create log entry
    const logEntry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `HTTP ${method} ${url} - ${status} ${statusText}`,
      status,
      statusText,
      url,
      method,
      responseTime: response.config?.metadata?.responseTime || 'unknown'
    };
    
    // Add headers if requested
    if (includeHeaders && response.headers) {
      logEntry.headers = maskSensitiveData 
        ? maskSensitiveHeaders(response.headers, sensitiveFields)
        : response.headers;
    }
    
    // Add body if requested
    if (includeBody && response.data) {
      let bodyToLog = response.data;
      
      // Stringify if needed
      if (typeof bodyToLog !== 'string') {
        try {
          bodyToLog = JSON.stringify(bodyToLog);
        } catch (e) {
          bodyToLog = '[Complex body that could not be stringified]';
        }
      }
      
      // Truncate if too long
      if (typeof bodyToLog === 'string' && bodyToLog.length > maxBodyLength) {
        bodyToLog = bodyToLog.substring(0, maxBodyLength) + '... [truncated]';
      }
      
      // Mask sensitive data if needed
      if (maskSensitiveData && typeof bodyToLog === 'string') {
        bodyToLog = maskSensitiveData ? maskSensitiveFields(bodyToLog, sensitiveFields) : bodyToLog;
      }
      
      logEntry.body = bodyToLog;
    }
    
    // Log the entry
    logger('Response log', logEntry);
  } catch (error) {
    console.error('Error logging response:', error);
  }
}

/**
 * Masks sensitive values in headers
 * 
 * @param headers - The headers object
 * @param sensitiveFields - List of sensitive field names
 * @returns Headers with masked sensitive values
 */
function maskSensitiveHeaders(headers: Record<string, any>, sensitiveFields: string[]): Record<string, any> {
  const maskedHeaders: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));
    
    maskedHeaders[key] = isSensitive ? '******' : value;
  }
  
  return maskedHeaders;
}

/**
 * Masks sensitive fields in a JSON string
 * 
 * @param jsonString - The JSON string to mask
 * @param sensitiveFields - List of sensitive field names
 * @returns JSON string with masked sensitive values
 */
function maskSensitiveFields(jsonString: string, sensitiveFields: string[]): string {
  let result = jsonString;
  
  // Simple regex-based approach - a production version would use a proper JSON parser
  for (const field of sensitiveFields) {
    const regex = new RegExp(`("${field}"\s*:\s*")(.*?)(")`, 'gi');
    result = result.replace(regex, '$1******$3');
  }
  
  return result;
}