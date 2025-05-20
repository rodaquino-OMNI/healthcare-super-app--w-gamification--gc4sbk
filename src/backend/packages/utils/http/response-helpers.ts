import { LoggerService } from '@nestjs/common';
import { TracingService } from '@austa/tracing';

/**
 * Standard error response structure for consistent error handling
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
  path?: string;
  timestamp?: string;
  journeyContext?: {
    journeyType?: 'health' | 'care' | 'plan';
    journeyId?: string;
  };
}

/**
 * Standard pagination metadata structure
 */
export interface PaginationMetadata {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Options for parsing error responses
 */
export interface ParseErrorOptions {
  defaultMessage?: string;
  defaultCode?: string;
  includeStack?: boolean;
  journeyType?: 'health' | 'care' | 'plan';
  journeyId?: string;
}

/**
 * Options for logging responses
 */
export interface LogResponseOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  includeHeaders?: boolean;
  includeBody?: boolean;
  maskSensitiveData?: boolean;
  sensitiveFields?: string[];
  journeyType?: 'health' | 'care' | 'plan';
  journeyId?: string;
  userId?: string;
  requestId?: string;
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
  'cpf',
  'rg',
  'creditCard',
  'cardNumber',
  'cvv',
  'secret'
];

/**
 * Parses error responses from various API formats into a standardized structure.
 * Handles different error formats from REST APIs, GraphQL, and internal services.
 *
 * @param error - The error object to parse
 * @param options - Options for customizing the error parsing
 * @returns A standardized error response object
 */
export function parseErrorResponse(error: any, options: ParseErrorOptions = {}): ErrorResponse {
  const {
    defaultMessage = 'An unexpected error occurred',
    defaultCode = 'UNKNOWN_ERROR',
    includeStack = false,
    journeyType,
    journeyId
  } = options;

  // Initialize the standardized error response
  const errorResponse: ErrorResponse = {
    message: defaultMessage,
    code: defaultCode,
    timestamp: new Date().toISOString(),
    journeyContext: journeyType ? { journeyType, journeyId } : undefined
  };

  // If the error is null or undefined, return the default error
  if (!error) {
    return errorResponse;
  }

  try {
    // Handle Error instances
    if (error instanceof Error) {
      errorResponse.message = error.message || defaultMessage;
      errorResponse.details = includeStack ? { stack: error.stack } : undefined;
      
      // Extract additional properties that might be present on custom error types
      if ('code' in error) {
        errorResponse.code = (error as any).code || defaultCode;
      }
      
      if ('details' in error) {
        errorResponse.details = {
          ...errorResponse.details,
          ...(error as any).details
        };
      }
      
      if ('path' in error) {
        errorResponse.path = (error as any).path;
      }
      
      return errorResponse;
    }
    
    // Handle Axios error responses
    if (error.isAxiosError && error.response) {
      const { data, status, statusText, config } = error.response;
      
      errorResponse.message = data?.message || statusText || defaultMessage;
      errorResponse.code = data?.code || `HTTP_${status}` || defaultCode;
      errorResponse.path = config?.url;
      errorResponse.details = {
        status,
        ...(data?.details || {})
      };
      
      return errorResponse;
    }
    
    // Handle GraphQL errors
    if (Array.isArray(error.errors) && error.errors.length > 0) {
      const graphqlError = error.errors[0];
      
      errorResponse.message = graphqlError.message || defaultMessage;
      errorResponse.code = graphqlError.extensions?.code || defaultCode;
      errorResponse.path = graphqlError.path?.join('.') || undefined;
      errorResponse.details = graphqlError.extensions?.exception || {};
      
      if (error.errors.length > 1) {
        errorResponse.details = {
          ...errorResponse.details,
          additionalErrors: error.errors.slice(1).map((e: any) => ({
            message: e.message,
            code: e.extensions?.code,
            path: e.path?.join('.')
          }))
        };
      }
      
      return errorResponse;
    }
    
    // Handle plain objects with error-like properties
    if (typeof error === 'object') {
      errorResponse.message = error.message || error.error || error.errorMessage || defaultMessage;
      errorResponse.code = error.code || error.errorCode || error.statusCode || defaultCode;
      errorResponse.path = error.path || error.url || undefined;
      errorResponse.details = error.details || error.data || undefined;
      
      return errorResponse;
    }
    
    // Handle string errors
    if (typeof error === 'string') {
      errorResponse.message = error;
      return errorResponse;
    }
    
    // Default case: return the error as a string in the message
    errorResponse.message = String(error) || defaultMessage;
    return errorResponse;
  } catch (parsingError) {
    // If error parsing fails, return a safe default with information about the parsing error
    return {
      message: defaultMessage,
      code: 'ERROR_PARSING_FAILED',
      details: {
        parsingError: parsingError instanceof Error ? parsingError.message : 'Unknown parsing error'
      },
      timestamp: new Date().toISOString(),
      journeyContext: journeyType ? { journeyType, journeyId } : undefined
    };
  }
}

/**
 * Extracts standardized pagination data from various API response formats.
 * Supports different pagination schemes including offset/limit, page/size, and cursor-based pagination.
 *
 * @param response - The API response containing pagination information
 * @param defaultItemsPerPage - Default number of items per page if not specified in the response
 * @returns Standardized pagination metadata
 */
export function extractPaginationData(response: any, defaultItemsPerPage = 10): PaginationMetadata {
  if (!response) {
    return createDefaultPaginationMetadata(defaultItemsPerPage);
  }
  
  try {
    // Handle responses with explicit pagination object
    if (response.pagination) {
      const { pagination } = response;
      
      // If the pagination object already matches our structure, return it directly
      if (
        'totalItems' in pagination &&
        'itemsPerPage' in pagination &&
        'currentPage' in pagination &&
        'totalPages' in pagination
      ) {
        return {
          totalItems: Number(pagination.totalItems),
          itemsPerPage: Number(pagination.itemsPerPage),
          currentPage: Number(pagination.currentPage),
          totalPages: Number(pagination.totalPages),
          hasNextPage: pagination.currentPage < pagination.totalPages,
          hasPreviousPage: pagination.currentPage > 1
        };
      }
      
      // Handle other pagination formats
      const totalItems = pagination.total || pagination.totalCount || pagination.count || 0;
      const itemsPerPage = pagination.limit || pagination.size || pagination.perPage || defaultItemsPerPage;
      const currentPage = pagination.page || pagination.pageNumber || pagination.current || 1;
      const totalPages = pagination.pages || pagination.totalPages || Math.ceil(totalItems / itemsPerPage) || 1;
      
      return {
        totalItems: Number(totalItems),
        itemsPerPage: Number(itemsPerPage),
        currentPage: Number(currentPage),
        totalPages: Number(totalPages),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      };
    }
    
    // Handle responses with pagination fields at the root level
    if (
      ('total' in response || 'totalCount' in response || 'count' in response) &&
      ('limit' in response || 'size' in response || 'perPage' in response || 'itemsPerPage' in response) &&
      ('page' in response || 'pageNumber' in response || 'current' in response || 'currentPage' in response)
    ) {
      const totalItems = response.total || response.totalCount || response.count || 0;
      const itemsPerPage = response.limit || response.size || response.perPage || response.itemsPerPage || defaultItemsPerPage;
      const currentPage = response.page || response.pageNumber || response.current || response.currentPage || 1;
      const totalPages = response.pages || response.totalPages || Math.ceil(totalItems / itemsPerPage) || 1;
      
      return {
        totalItems: Number(totalItems),
        itemsPerPage: Number(itemsPerPage),
        currentPage: Number(currentPage),
        totalPages: Number(totalPages),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      };
    }
    
    // Handle responses with meta object containing pagination info
    if (response.meta && (
      'total' in response.meta ||
      'totalCount' in response.meta ||
      'count' in response.meta ||
      'pagination' in response.meta
    )) {
      const meta = response.meta.pagination || response.meta;
      
      const totalItems = meta.total || meta.totalCount || meta.count || 0;
      const itemsPerPage = meta.limit || meta.size || meta.perPage || meta.itemsPerPage || defaultItemsPerPage;
      const currentPage = meta.page || meta.pageNumber || meta.current || meta.currentPage || 1;
      const totalPages = meta.pages || meta.totalPages || Math.ceil(totalItems / itemsPerPage) || 1;
      
      return {
        totalItems: Number(totalItems),
        itemsPerPage: Number(itemsPerPage),
        currentPage: Number(currentPage),
        totalPages: Number(totalPages),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      };
    }
    
    // Handle cursor-based pagination (hasNextPage, hasPreviousPage, etc.)
    if (
      ('hasNextPage' in response || 'hasNext' in response) ||
      ('hasPreviousPage' in response || 'hasPrevious' in response) ||
      ('startCursor' in response && 'endCursor' in response)
    ) {
      // For cursor-based pagination, we might not have exact page numbers
      // but we can still provide useful pagination metadata
      const hasNextPage = response.hasNextPage || response.hasNext || false;
      const hasPreviousPage = response.hasPreviousPage || response.hasPrevious || false;
      
      // If we have data array, use its length as itemsPerPage
      const itemsPerPage = Array.isArray(response.data) ? response.data.length : defaultItemsPerPage;
      
      return {
        totalItems: response.totalCount || -1, // -1 indicates unknown total
        itemsPerPage,
        currentPage: hasPreviousPage ? 2 : 1, // Approximate
        totalPages: hasNextPage ? 2 : 1, // Approximate
        hasNextPage,
        hasPreviousPage
      };
    }
    
    // If we have a data array but no pagination info, create default pagination
    if (Array.isArray(response.data)) {
      return createDefaultPaginationMetadata(defaultItemsPerPage, response.data.length);
    }
    
    // If the response itself is an array, create default pagination based on array length
    if (Array.isArray(response)) {
      return createDefaultPaginationMetadata(defaultItemsPerPage, response.length);
    }
    
    // Default case: return default pagination metadata
    return createDefaultPaginationMetadata(defaultItemsPerPage);
  } catch (error) {
    // If pagination extraction fails, return default pagination metadata
    return createDefaultPaginationMetadata(defaultItemsPerPage);
  }
}

/**
 * Creates default pagination metadata when extraction fails or is not possible
 *
 * @param itemsPerPage - Number of items per page
 * @param totalItems - Total number of items (optional)
 * @returns Default pagination metadata
 */
function createDefaultPaginationMetadata(itemsPerPage: number, totalItems = 0): PaginationMetadata {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  return {
    totalItems,
    itemsPerPage,
    currentPage: 1,
    totalPages,
    hasNextPage: totalItems > itemsPerPage,
    hasPreviousPage: false
  };
}

/**
 * Validates that a response matches an expected schema.
 * Uses structural validation to ensure the response has the required properties and types.
 *
 * @param response - The response object to validate
 * @param schema - The schema to validate against (object with property paths and optional type checks)
 * @param options - Validation options
 * @returns An object with validation result and any validation errors
 */
export function validateResponseSchema(
  response: any,
  schema: Record<string, { required?: boolean; type?: string }>,
  options: { throwOnError?: boolean; strictTypes?: boolean } = {}
): { valid: boolean; errors?: string[] } {
  const { throwOnError = false, strictTypes = false } = options;
  const errors: string[] = [];
  
  if (!response) {
    const error = 'Response is null or undefined';
    errors.push(error);
    
    if (throwOnError) {
      throw new Error(error);
    }
    
    return { valid: false, errors };
  }
  
  try {
    // Check each property in the schema
    for (const [path, validation] of Object.entries(schema)) {
      const { required = true, type } = validation;
      const pathParts = path.split('.');
      
      // Navigate to the property using the path
      let value = response;
      let currentPath = '';
      
      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part;
        
        if (value === undefined || value === null) {
          if (required) {
            errors.push(`Required property '${currentPath}' is missing`);
          }
          value = undefined;
          break;
        }
        
        value = value[part];
      }
      
      // Skip type checking if the property is not required and is undefined
      if (!required && value === undefined) {
        continue;
      }
      
      // Check the type if specified
      if (type && value !== undefined) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        // Handle special case for arrays with specific item types
        if (type.startsWith('array<') && type.endsWith('>')) {
          if (actualType !== 'array') {
            errors.push(`Property '${path}' should be an array but got ${actualType}`);
          } else {
            const itemType = type.substring(6, type.length - 1);
            
            // Check each item in the array
            for (let i = 0; i < value.length; i++) {
              const item = value[i];
              const itemActualType = Array.isArray(item) ? 'array' : typeof item;
              
              if (itemType === 'object' && itemActualType !== 'object') {
                errors.push(`Item at index ${i} in '${path}' should be an object but got ${itemActualType}`);
              } else if (itemType !== 'any' && itemType !== itemActualType) {
                errors.push(`Item at index ${i} in '${path}' should be of type ${itemType} but got ${itemActualType}`);
              }
            }
          }
        }
        // Handle regular type checking
        else if (strictTypes && type !== 'any' && type !== actualType) {
          errors.push(`Property '${path}' should be of type ${type} but got ${actualType}`);
        }
      }
    }
    
    const valid = errors.length === 0;
    
    if (!valid && throwOnError) {
      throw new Error(`Schema validation failed: ${errors.join(', ')}`);
    }
    
    return { valid, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    
    if (throwOnError) {
      throw error;
    }
    
    return { valid: false, errors: [errorMessage] };
  }
}

/**
 * Sanitizes response data to prevent XSS and injection vulnerabilities.
 * Recursively processes objects and arrays to sanitize string values.
 *
 * @param data - The data to sanitize
 * @param options - Sanitization options
 * @returns Sanitized data
 */
export function sanitizeResponseData<T>(
  data: T,
  options: {
    sanitizeHtml?: boolean;
    sanitizeScripts?: boolean;
    sanitizeAttributes?: boolean;
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  } = {}
): T {
  const {
    sanitizeHtml = true,
    sanitizeScripts = true,
    sanitizeAttributes = true,
    allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes = { a: ['href', 'target'] }
  } = options;
  
  // If data is null or undefined, return it as is
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle different data types
  if (typeof data === 'string') {
    let sanitized = data;
    
    // Sanitize HTML content
    if (sanitizeHtml) {
      // Remove all HTML tags except allowed ones
      const allowedTagsPattern = allowedTags.length > 0
        ? `<(?!\/?(${allowedTags.join('|')})\\b)[^>]+>`
        : '<[^>]+>';
      
      sanitized = sanitized.replace(new RegExp(allowedTagsPattern, 'gi'), '');
    }
    
    // Sanitize script tags and event handlers
    if (sanitizeScripts) {
      // Remove script tags
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove javascript: URLs
      sanitized = sanitized.replace(/javascript\s*:/gi, 'removed:');
      
      // Remove event handlers (on* attributes)
      sanitized = sanitized.replace(/\s+on\w+\s*=\s*(["']).*?\1/gi, '');
    }
    
    // Sanitize attributes
    if (sanitizeAttributes) {
      // Process each allowed tag
      for (const tag of allowedTags) {
        const tagAllowedAttrs = allowedAttributes[tag] || [];
        
        // If no attributes are allowed for this tag, remove all attributes
        if (tagAllowedAttrs.length === 0) {
          sanitized = sanitized.replace(
            new RegExp(`<${tag}\\s+[^>]*>`, 'gi'),
            `<${tag}>`
          );
          continue;
        }
        
        // Replace tags with only allowed attributes
        sanitized = sanitized.replace(
          new RegExp(`<${tag}\\s+[^>]*>`, 'gi'),
          (match) => {
            // Extract all attributes
            const attrMatches = match.matchAll(/\s+(\w+)\s*=\s*(["'])(.*?)\2/gi);
            const attrs: string[] = [];
            
            for (const attrMatch of Array.from(attrMatches)) {
              const [, name, , value] = attrMatch;
              
              // Only keep allowed attributes
              if (tagAllowedAttrs.includes(name)) {
                attrs.push(`${name}="${value}"`);
              }
            }
            
            return `<${tag}${attrs.length > 0 ? ' ' + attrs.join(' ') : ''}>`;
          }
        );
      }
    }
    
    return sanitized as unknown as T;
  }
  
  // Handle arrays recursively
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponseData(item, options)) as unknown as T;
  }
  
  // Handle objects recursively
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      result[key] = sanitizeResponseData(value, options);
    }
    
    return result as T;
  }
  
  // For other types (number, boolean, etc.), return as is
  return data;
}

/**
 * Masks sensitive data in an object by replacing values with asterisks.
 *
 * @param data - The data to mask
 * @param sensitiveFields - Array of field names to mask
 * @returns Data with sensitive fields masked
 */
export function maskSensitiveData<T>(data: T, sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS): T {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const result = Array.isArray(data) ? [...data] : { ...data };
  
  // Process each key in the object
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const value = result[key];
      
      // Check if this is a sensitive field that should be masked
      const isSensitive = sensitiveFields.some(field => {
        // Check for exact match or nested path match
        return key === field || key.toLowerCase() === field.toLowerCase() || 
               key.includes(field) || field.includes(key);
      });
      
      if (isSensitive && value !== null && value !== undefined) {
        // Mask the sensitive value
        if (typeof value === 'string') {
          // For strings, show first and last character with asterisks in between
          const length = value.length;
          if (length <= 2) {
            result[key] = '***' as any;
          } else {
            result[key] = `${value[0]}${'*'.repeat(length - 2)}${value[length - 1]}` as any;
          }
        } else if (typeof value === 'number') {
          // For numbers, replace with asterisks
          result[key] = '*****' as any;
        } else {
          // For other types, replace with a generic masked value
          result[key] = '[MASKED]' as any;
        }
      } else if (value !== null && typeof value === 'object') {
        // Recursively process nested objects and arrays
        result[key] = maskSensitiveData(value, sensitiveFields) as any;
      }
    }
  }
  
  return result as T;
}

/**
 * Logs HTTP response data with consistent formatting and optional masking of sensitive information.
 * Integrates with the LoggerService and TracingService for comprehensive observability.
 *
 * @param response - The HTTP response to log
 * @param logger - The logger service instance
 * @param options - Logging options
 * @param tracingService - Optional tracing service for distributed tracing integration
 */
export function logResponse(
  response: any,
  logger: LoggerService,
  options: LogResponseOptions = {},
  tracingService?: TracingService
): void {
  const {
    level = 'debug',
    includeHeaders = true,
    includeBody = true,
    maskSensitiveData: shouldMaskData = true,
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    journeyType,
    journeyId,
    userId,
    requestId
  } = options;
  
  try {
    // Extract relevant information from the response
    const status = response?.status || response?.statusCode;
    const statusText = response?.statusText;
    const headers = response?.headers;
    const data = response?.data;
    const config = response?.config;
    
    // Create the log context
    const logContext: Record<string, any> = {
      responseStatus: status,
      responseStatusText: statusText,
      requestMethod: config?.method?.toUpperCase(),
      requestUrl: config?.url,
      requestId,
      userId
    };
    
    // Add journey context if available
    if (journeyType) {
      logContext.journeyContext = { journeyType, journeyId };
    }
    
    // Add headers if requested
    if (includeHeaders && headers) {
      logContext.responseHeaders = shouldMaskData
        ? maskSensitiveData(headers, sensitiveFields)
        : headers;
    }
    
    // Add body if requested
    if (includeBody && data) {
      logContext.responseBody = shouldMaskData
        ? maskSensitiveData(data, sensitiveFields)
        : data;
    }
    
    // Create the log message
    const message = `HTTP Response: ${status} ${statusText || ''} - ${config?.method?.toUpperCase() || 'UNKNOWN'} ${config?.url || 'unknown-url'}`;
    
    // Add trace information if tracing service is available
    if (tracingService) {
      const currentSpan = tracingService.getCurrentSpan();
      if (currentSpan) {
        // Add response information to the current span
        tracingService.addAttributesToCurrentSpan({
          'http.response.status_code': status,
          'http.response.status_text': statusText,
          'http.response.headers.count': headers ? Object.keys(headers).length : 0,
          'http.response.body.size': data ? JSON.stringify(data).length : 0
        });
      }
    }
    
    // Log the response with the appropriate log level
    switch (level) {
      case 'info':
        logger.log(message, logContext);
        break;
      case 'warn':
        logger.warn(message, logContext);
        break;
      case 'error':
        logger.error(message, undefined, logContext);
        break;
      case 'debug':
      default:
        logger.debug(message, logContext);
        break;
    }
  } catch (error) {
    // If logging fails, log a simplified error message
    logger.error(
      `Failed to log HTTP response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error.stack : undefined,
      { requestId, userId }
    );
  }
}