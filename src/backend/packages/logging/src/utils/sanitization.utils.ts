/**
 * Sanitization utilities for logging
 * 
 * This module provides utilities for sanitizing sensitive data in logs to ensure
 * compliance with privacy regulations and protect user information.
 */

/**
 * Regular expressions for detecting common patterns of sensitive information
 */
const SENSITIVE_PATTERNS = {
  // Credit card numbers (major card formats)
  CREDIT_CARD: /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
  // Email addresses
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  // Social security numbers (Brazilian CPF format)
  CPF: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  // Phone numbers (Brazilian format)
  PHONE: /\b\(?\d{2}\)?[- ]?\d{4,5}[- ]?\d{4}\b/g,
  // Passwords in various formats (password=X, pwd=X, etc.)
  PASSWORD: /\b(?:password|pwd|passwd|secret)\s*[=:]\s*[^\s,;]{1,}/gi,
  // Authentication tokens (Bearer, JWT, etc.)
  AUTH_TOKEN: /\b(?:bearer|jwt|token|api[-_]?key)\s+[A-Za-z0-9._~+/=-]+/gi,
  // Brazilian healthcare ID (CNS - Cartão Nacional de Saúde)
  CNS: /\b\d{15}\b/g,
};

/**
 * Default fields that should be redacted in objects
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'senha',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'credential',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'ssn',
  'cpf',
  'rg',
  'cns',
  'healthCardId',
  'health_card_id',
];

/**
 * Configuration options for sanitization
 */
export interface SanitizationOptions {
  /** Fields to redact in objects (in addition to defaults) */
  sensitiveFields?: string[];
  /** Character to use for masking sensitive data */
  maskChar?: string;
  /** Whether to preserve a portion of the sensitive data for debugging */
  preserveLength?: boolean;
  /** Number of characters to show at the beginning of masked data */
  showFirstN?: number;
  /** Number of characters to show at the end of masked data */
  showLastN?: number;
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  sensitiveFields: [],
  maskChar: '*',
  preserveLength: true,
  showFirstN: 0,
  showLastN: 0,
};

/**
 * Masks a string with the specified character while optionally preserving some characters
 * 
 * @param value - The string to mask
 * @param options - Sanitization options
 * @returns The masked string
 */
export function maskString(value: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  const { maskChar, preserveLength, showFirstN, showLastN } = opts;
  
  // Handle empty strings
  if (value.length === 0) {
    return value;
  }
  
  // If we're showing parts of the string
  if (showFirstN > 0 || showLastN > 0) {
    const firstPart = showFirstN > 0 ? value.substring(0, showFirstN) : '';
    const lastPart = showLastN > 0 ? value.substring(value.length - showLastN) : '';
    
    // Calculate how many characters to mask
    const maskLength = preserveLength 
      ? Math.max(0, value.length - firstPart.length - lastPart.length)
      : 6; // Default mask length if not preserving
    
    const maskedPart = maskChar.repeat(maskLength);
    return `${firstPart}${maskedPart}${lastPart}`;
  }
  
  // Simple full masking
  return preserveLength ? maskChar.repeat(value.length) : `${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}${maskChar}`;
}

/**
 * Detects and masks PII (Personally Identifiable Information) in a string
 * 
 * @param text - The text to sanitize
 * @param options - Sanitization options
 * @returns The sanitized text with PII masked
 */
export function maskPII(text: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let sanitized = text;
  
  // Apply each pattern and mask matches
  Object.values(SENSITIVE_PATTERNS).forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match) => maskString(match, options));
  });
  
  return sanitized;
}

/**
 * Redacts sensitive fields from an object
 * 
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns A new object with sensitive fields redacted
 */
export function redactSensitiveFields<T extends Record<string, any>>(
  obj: T, 
  options: SanitizationOptions = DEFAULT_OPTIONS
): T {
  if (!obj || typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const allSensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...(opts.sensitiveFields || [])];
  
  // Create a new object to avoid mutating the original
  const result = Array.isArray(obj) ? [...obj] as any : { ...obj };
  
  // Process each property
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const value = result[key];
      
      // Check if this is a sensitive field name (case insensitive)
      const isSensitiveField = allSensitiveFields.some(
        field => key.toLowerCase() === field.toLowerCase()
      );
      
      if (isSensitiveField && typeof value === 'string') {
        // Mask the sensitive value
        result[key] = maskString(value, opts);
      } else if (value && typeof value === 'object') {
        // Recursively process nested objects and arrays
        result[key] = redactSensitiveFields(value, opts);
      }
    }
  }
  
  return result;
}

/**
 * Sanitizes HTTP request data for logging
 * 
 * @param requestData - The request data to sanitize
 * @param options - Sanitization options
 * @returns Sanitized request data safe for logging
 */
export function sanitizeRequestData(
  requestData: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!requestData || typeof requestData !== 'object') {
    return requestData;
  }
  
  // Create a sanitized copy of the request data
  const sanitized = { ...requestData };
  
  // Sanitize headers if present
  if (sanitized.headers && typeof sanitized.headers === 'object') {
    sanitized.headers = sanitizeHeaders(sanitized.headers, options);
  }
  
  // Sanitize body if present
  if (sanitized.body && typeof sanitized.body === 'object') {
    sanitized.body = redactSensitiveFields(sanitized.body, options);
  } else if (sanitized.body && typeof sanitized.body === 'string') {
    // Try to parse JSON strings and sanitize them
    try {
      const parsedBody = JSON.parse(sanitized.body);
      sanitized.body = JSON.stringify(redactSensitiveFields(parsedBody, options));
    } catch (e) {
      // If not valid JSON, treat as text and mask PII
      sanitized.body = maskPII(sanitized.body, options);
    }
  }
  
  // Sanitize query parameters if present
  if (sanitized.query && typeof sanitized.query === 'object') {
    sanitized.query = redactSensitiveFields(sanitized.query, options);
  }
  
  // Sanitize params if present (route parameters)
  if (sanitized.params && typeof sanitized.params === 'object') {
    sanitized.params = redactSensitiveFields(sanitized.params, options);
  }
  
  return sanitized;
}

/**
 * Sanitizes HTTP headers for logging
 * 
 * @param headers - The headers object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized headers safe for logging
 */
export function sanitizeHeaders(
  headers: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }
  
  const sanitizedHeaders = { ...headers };
  const sensitiveHeaderNames = [
    'authorization',
    'x-api-key',
    'api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
    'x-forwarded-for',
    'x-real-ip',
  ];
  
  // Process each header
  for (const key in sanitizedHeaders) {
    if (Object.prototype.hasOwnProperty.call(sanitizedHeaders, key)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveHeaderNames.includes(lowerKey)) {
        sanitizedHeaders[key] = maskString(String(sanitizedHeaders[key]), options);
      }
      
      // Special handling for cookies
      if (lowerKey === 'cookie' || lowerKey === 'set-cookie') {
        sanitizedHeaders[key] = sanitizeCookies(String(sanitizedHeaders[key]), options);
      }
    }
  }
  
  return sanitizedHeaders;
}

/**
 * Sanitizes cookie strings for logging
 * 
 * @param cookieString - The cookie string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized cookie string safe for logging
 */
export function sanitizeCookies(
  cookieString: string,
  options: SanitizationOptions = DEFAULT_OPTIONS
): string {
  if (!cookieString || typeof cookieString !== 'string') {
    return cookieString;
  }
  
  const sensitiveNames = [
    'auth',
    'token',
    'jwt',
    'session',
    'id',
    'sid',
    'remember',
    'connect.sid',
  ];
  
  // Split cookies and process each one
  return cookieString
    .split(';')
    .map(cookie => {
      const [name, ...rest] = cookie.split('=');
      const cookieName = name.trim();
      const isSensitive = sensitiveNames.some(sensitive => 
        cookieName.toLowerCase().includes(sensitive.toLowerCase())
      );
      
      if (isSensitive) {
        return `${cookieName}=${maskString(rest.join('='), options)}`;
      }
      
      return cookie;
    })
    .join(';');
}

/**
 * Sanitizes an error object for logging
 * 
 * @param error - The error object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized error object safe for logging
 */
export function sanitizeError(
  error: Error | Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!error) {
    return error;
  }
  
  // Convert Error to plain object if needed
  const errorObj = error instanceof Error 
    ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error as any), // Include any custom properties
      }
    : { ...error };
  
  // Sanitize the error message for PII
  if (errorObj.message && typeof errorObj.message === 'string') {
    errorObj.message = maskPII(errorObj.message, options);
  }
  
  // Sanitize the stack trace
  if (errorObj.stack && typeof errorObj.stack === 'string') {
    errorObj.stack = maskPII(errorObj.stack, options);
  }
  
  // Sanitize any other properties that might contain sensitive data
  return redactSensitiveFields(errorObj, options);
}

/**
 * Sanitizes a log message and its context for sensitive information
 * 
 * @param message - The log message to sanitize
 * @param context - The log context to sanitize
 * @param options - Sanitization options
 * @returns An object containing the sanitized message and context
 */
export function sanitizeLogEntry(
  message: string,
  context?: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): { message: string; context?: Record<string, any> } {
  // Sanitize the message for PII
  const sanitizedMessage = maskPII(message, options);
  
  // If no context, just return the sanitized message
  if (!context) {
    return { message: sanitizedMessage };
  }
  
  // Sanitize the context object
  const sanitizedContext = redactSensitiveFields(context, options);
  
  return {
    message: sanitizedMessage,
    context: sanitizedContext,
  };
}

/**
 * Creates a sanitization middleware for Express/NestJS
 * 
 * @param options - Sanitization options
 * @returns Middleware function that sanitizes request and response objects
 */
export function createSanitizationMiddleware(options: SanitizationOptions = DEFAULT_OPTIONS) {
  return (req: any, res: any, next: () => void) => {
    // Store original methods that we'll wrap
    const originalReqToJSON = req.toJSON;
    const originalResToJSON = res.toJSON;
    
    // Override request toJSON method to sanitize data
    req.toJSON = function() {
      const json = originalReqToJSON ? originalReqToJSON.call(this) : { ...this };
      return sanitizeRequestData(json, options);
    };
    
    // Override response toJSON method to sanitize data
    res.toJSON = function() {
      const json = originalResToJSON ? originalResToJSON.call(this) : { ...this };
      
      // Sanitize response body if present
      if (json.body) {
        json.body = redactSensitiveFields(json.body, options);
      }
      
      return json;
    };
    
    next();
  };
}

/**
 * Creates a sanitized logger wrapper that automatically sanitizes all log entries
 * 
 * @param logger - The original logger instance
 * @param options - Sanitization options
 * @returns A wrapped logger that sanitizes log entries
 */
export function createSanitizedLogger(logger: any, options: SanitizationOptions = DEFAULT_OPTIONS) {
  // Create a proxy to intercept all logger method calls
  return new Proxy(logger, {
    get(target, prop) {
      // Get the original property
      const originalMethod = target[prop];
      
      // If it's not a function or not a logging method, return it as is
      if (typeof originalMethod !== 'function' || 
          !['log', 'info', 'warn', 'error', 'debug', 'verbose'].includes(prop as string)) {
        return originalMethod;
      }
      
      // Return a wrapped function that sanitizes inputs
      return function(...args: any[]) {
        // First argument is typically the message
        let sanitizedArgs = [...args];
        
        if (args.length > 0) {
          // Sanitize the first argument (message) if it's a string
          if (typeof args[0] === 'string') {
            sanitizedArgs[0] = maskPII(args[0], options);
          } else if (typeof args[0] === 'object' && args[0] !== null) {
            // If first arg is an object, sanitize it
            sanitizedArgs[0] = redactSensitiveFields(args[0], options);
          }
          
          // Sanitize additional arguments if they exist
          for (let i = 1; i < args.length; i++) {
            if (args[i] instanceof Error) {
              sanitizedArgs[i] = sanitizeError(args[i], options);
            } else if (typeof args[i] === 'object' && args[i] !== null) {
              sanitizedArgs[i] = redactSensitiveFields(args[i], options);
            } else if (typeof args[i] === 'string') {
              sanitizedArgs[i] = maskPII(args[i], options);
            }
          }
        }
        
        // Call the original method with sanitized arguments
        return originalMethod.apply(target, sanitizedArgs);
      };
    }
  });
}