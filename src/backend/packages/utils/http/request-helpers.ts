/**
 * @file request-helpers.ts
 * @description Utility functions for standardizing HTTP request operations across the AUSTA SuperApp backend services.
 * Provides functions for authentication, journey context propagation, URL sanitization, parameter validation, and request logging.
 */

import { URL } from 'url';
import { JourneyId } from '@austa/interfaces/journey';
import { ITokenPayload } from '@austa/interfaces/auth';

/**
 * Interface for journey context that can be attached to requests
 */
export interface JourneyContext {
  journeyId: JourneyId;
  userId?: string;
  correlationId: string;
  sessionId?: string;
  timestamp: number;
  [key: string]: unknown;
}

/**
 * Interface for request validation options
 */
export interface ValidationOptions {
  required?: string[];
  optional?: string[];
  numeric?: string[];
  boolean?: string[];
  maxLength?: Record<string, number>;
  minLength?: Record<string, number>;
  pattern?: Record<string, RegExp>;
}

/**
 * Interface for request logging options
 */
export interface LogRequestOptions {
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeTiming?: boolean;
  sensitiveHeaders?: string[];
  sensitiveBodyFields?: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Adds authentication header to a request
 * @param headers - Headers object to add the authentication header to
 * @param token - JWT token or token payload
 * @param scheme - Authentication scheme (default: 'Bearer')
 * @returns The updated headers object
 */
export function addAuthHeader(
  headers: Record<string, string>,
  token: string | ITokenPayload,
  scheme = 'Bearer'
): Record<string, string> {
  // If token is an object (ITokenPayload), we need to extract the actual token
  const tokenString = typeof token === 'string' ? token : token.accessToken;
  
  if (!tokenString) {
    throw new Error('Invalid token provided to addAuthHeader');
  }

  // Create a new headers object to avoid mutating the original
  const updatedHeaders = { ...headers };
  updatedHeaders['Authorization'] = `${scheme} ${tokenString}`;
  
  return updatedHeaders;
}

/**
 * Adds journey context to request headers
 * @param headers - Headers object to add the journey context to
 * @param context - Journey context to add
 * @returns The updated headers object
 */
export function addJourneyContext(
  headers: Record<string, string>,
  context: JourneyContext
): Record<string, string> {
  // Create a new headers object to avoid mutating the original
  const updatedHeaders = { ...headers };
  
  // Add journey context as a JSON string in a custom header
  updatedHeaders['X-Journey-Context'] = JSON.stringify(context);
  
  // Add individual context properties as separate headers for services that might not parse the full context
  updatedHeaders['X-Journey-ID'] = context.journeyId;
  updatedHeaders['X-Correlation-ID'] = context.correlationId;
  
  if (context.userId) {
    updatedHeaders['X-User-ID'] = context.userId;
  }
  
  if (context.sessionId) {
    updatedHeaders['X-Session-ID'] = context.sessionId;
  }
  
  return updatedHeaders;
}

/**
 * Extracts journey context from request headers
 * @param headers - Headers object to extract the journey context from
 * @returns The extracted journey context or null if not found
 */
export function extractJourneyContext(
  headers: Record<string, string>
): JourneyContext | null {
  const contextHeader = headers['X-Journey-Context'] || headers['x-journey-context'];
  
  if (contextHeader) {
    try {
      return JSON.parse(contextHeader) as JourneyContext;
    } catch (error) {
      console.error('Failed to parse journey context from headers:', error);
    }
  }
  
  // If the full context header is not available, try to construct from individual headers
  const journeyId = headers['X-Journey-ID'] || headers['x-journey-id'];
  const correlationId = headers['X-Correlation-ID'] || headers['x-correlation-id'];
  
  if (journeyId && correlationId) {
    const context: JourneyContext = {
      journeyId: journeyId as JourneyId,
      correlationId,
      timestamp: Date.now()
    };
    
    const userId = headers['X-User-ID'] || headers['x-user-id'];
    if (userId) {
      context.userId = userId;
    }
    
    const sessionId = headers['X-Session-ID'] || headers['x-session-id'];
    if (sessionId) {
      context.sessionId = sessionId;
    }
    
    return context;
  }
  
  return null;
}

/**
 * Sanitizes a URL to prevent path traversal and other vulnerabilities
 * @param url - URL to sanitize
 * @param allowedProtocols - List of allowed protocols (default: ['http:', 'https:'])
 * @returns Sanitized URL string
 * @throws Error if URL is invalid or uses a disallowed protocol
 */
export function sanitizeRequestUrl(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:']
): string {
  try {
    // Parse the URL to validate and normalize it
    const parsedUrl = new URL(url);
    
    // Check if the protocol is allowed
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      throw new Error(`Protocol not allowed: ${parsedUrl.protocol}`);
    }
    
    // Normalize the path to prevent path traversal attacks
    // This removes sequences like '../' that could be used to access parent directories
    const path = parsedUrl.pathname
      .split('/')
      .filter(segment => segment !== '..' && segment !== '.')
      .join('/');
    
    // Reconstruct the URL with the sanitized path
    parsedUrl.pathname = path.startsWith('/') ? path : `/${path}`;
    
    return parsedUrl.toString();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
    throw new Error('Invalid URL');
  }
}

/**
 * Validates request parameters against expected schema
 * @param params - Parameters to validate (can be query params, body, etc.)
 * @param options - Validation options
 * @returns Object with validation result and any validation errors
 */
export function validateRequestParams(
  params: Record<string, unknown>,
  options: ValidationOptions
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required parameters
  if (options.required) {
    for (const param of options.required) {
      if (params[param] === undefined || params[param] === null || params[param] === '') {
        errors.push(`Required parameter '${param}' is missing`);
      }
    }
  }
  
  // Check numeric parameters
  if (options.numeric) {
    for (const param of options.numeric) {
      if (params[param] !== undefined && params[param] !== null) {
        const value = params[param];
        if (typeof value !== 'number' && (typeof value !== 'string' || isNaN(Number(value)))) {
          errors.push(`Parameter '${param}' must be numeric`);
        }
      }
    }
  }
  
  // Check boolean parameters
  if (options.boolean) {
    for (const param of options.boolean) {
      if (params[param] !== undefined && params[param] !== null) {
        const value = params[param];
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push(`Parameter '${param}' must be a boolean`);
        }
      }
    }
  }
  
  // Check max length constraints
  if (options.maxLength) {
    for (const [param, maxLength] of Object.entries(options.maxLength)) {
      if (params[param] !== undefined && params[param] !== null) {
        const value = String(params[param]);
        if (value.length > maxLength) {
          errors.push(`Parameter '${param}' exceeds maximum length of ${maxLength}`);
        }
      }
    }
  }
  
  // Check min length constraints
  if (options.minLength) {
    for (const [param, minLength] of Object.entries(options.minLength)) {
      if (params[param] !== undefined && params[param] !== null) {
        const value = String(params[param]);
        if (value.length < minLength) {
          errors.push(`Parameter '${param}' is shorter than minimum length of ${minLength}`);
        }
      }
    }
  }
  
  // Check pattern constraints
  if (options.pattern) {
    for (const [param, pattern] of Object.entries(options.pattern)) {
      if (params[param] !== undefined && params[param] !== null) {
        const value = String(params[param]);
        if (!pattern.test(value)) {
          errors.push(`Parameter '${param}' does not match required pattern`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Logs request details in a standardized format
 * @param method - HTTP method
 * @param url - Request URL
 * @param headers - Request headers
 * @param body - Request body (optional)
 * @param options - Logging options
 */
export function logRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown,
  options: LogRequestOptions = {}
): void {
  const {
    includeHeaders = true,
    includeBody = false,
    includeTiming = true,
    sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'],
    sensitiveBodyFields = ['password', 'token', 'secret', 'apiKey'],
    logLevel = 'info'
  } = options;
  
  // Extract journey context if available
  const journeyContext = extractJourneyContext(headers);
  
  // Create log object
  const logObject: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    method,
    url: sanitizeRequestUrl(url),
  };
  
  // Add journey context if available
  if (journeyContext) {
    logObject.journeyId = journeyContext.journeyId;
    logObject.correlationId = journeyContext.correlationId;
    if (journeyContext.userId) {
      logObject.userId = journeyContext.userId;
    }
  }
  
  // Add headers if requested (with sensitive data masked)
  if (includeHeaders) {
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveHeaders.includes(lowerKey)) {
        sanitizedHeaders[key] = '******';
      } else {
        sanitizedHeaders[key] = value;
      }
    }
    logObject.headers = sanitizedHeaders;
  }
  
  // Add body if requested (with sensitive data masked)
  if (includeBody && body) {
    if (typeof body === 'object' && body !== null) {
      const sanitizedBody = JSON.parse(JSON.stringify(body));
      for (const field of sensitiveBodyFields) {
        if (field in sanitizedBody) {
          sanitizedBody[field] = '******';
        }
      }
      logObject.body = sanitizedBody;
    } else {
      logObject.body = body;
    }
  }
  
  // Add timing information if requested
  if (includeTiming) {
    logObject.timestamp = Date.now();
  }
  
  // Log with appropriate level
  switch (logLevel) {
    case 'debug':
      console.debug(`REQUEST: ${method} ${url}`, logObject);
      break;
    case 'warn':
      console.warn(`REQUEST: ${method} ${url}`, logObject);
      break;
    case 'error':
      console.error(`REQUEST: ${method} ${url}`, logObject);
      break;
    case 'info':
    default:
      console.info(`REQUEST: ${method} ${url}`, logObject);
      break;
  }
}

/**
 * Creates a standardized error response object
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns Standardized error response object
 */
export function createErrorResponse(
  message: string,
  statusCode = 500,
  details?: unknown
): { error: { message: string; statusCode: number; details?: unknown } } {
  return {
    error: {
      message,
      statusCode,
      ...(details ? { details } : {})
    }
  };
}