/**
 * Utilities for sanitizing sensitive data in logs to ensure compliance with privacy regulations
 * and protect user information. These utilities help prevent accidental logging of PII,
 * credentials, and other sensitive information.
 */

/**
 * Regular expressions for detecting common patterns of sensitive information
 */
const SENSITIVE_PATTERNS = {
  // PII patterns
  EMAIL: /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/gi,
  PHONE: /\b(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\b/g,
  CPF: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, // Brazilian CPF format
  RG: /\b\d{2}\.\d{3}\.\d{3}-[0-9X]\b/g, // Brazilian RG format
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  
  // Credential patterns
  PASSWORD_FIELD: /"?password"?\s*[:=]\s*"([^"]+)"/gi,
  TOKEN_FIELD: /"?(api_?key|auth_?token|access_?token|secret|jwt)"?\s*[:=]\s*"([^"]+)"/gi,
  BASIC_AUTH: /basic\s+[a-zA-Z0-9+/=]+/gi,
  BEARER_TOKEN: /bearer\s+[a-zA-Z0-9\-_\.]+/gi,
};

/**
 * Default list of field names that should be redacted from objects
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'senha',
  'secret',
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'cpf',
  'rg',
  'passportNumber',
  'passport_number',
];

/**
 * Configuration options for sanitization
 */
export interface SanitizationOptions {
  /** Custom list of field names to redact (will be merged with defaults) */
  sensitiveFields?: string[];
  /** Replacement string for masked values */
  maskChar?: string;
  /** Number of characters to preserve at the beginning of masked values */
  preserveStart?: number;
  /** Number of characters to preserve at the end of masked values */
  preserveEnd?: number;
  /** Whether to sanitize nested objects */
  sanitizeNested?: boolean;
  /** Maximum depth for sanitizing nested objects */
  maxDepth?: number;
  /** Whether to detect and mask PII patterns */
  detectPII?: boolean;
  /** Whether to detect and mask credential patterns */
  detectCredentials?: boolean;
}

/**
 * Default sanitization options
 */
const DEFAULT_OPTIONS: SanitizationOptions = {
  sensitiveFields: [],
  maskChar: '*',
  preserveStart: 0,
  preserveEnd: 0,
  sanitizeNested: true,
  maxDepth: 5,
  detectPII: true,
  detectCredentials: true,
};

/**
 * Masks a string value, optionally preserving some characters at the beginning and end
 * @param value The string to mask
 * @param options Sanitization options
 * @returns The masked string
 */
export function maskValue(value: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!value || typeof value !== 'string' || value.length === 0) {
    return value;
  }
  
  const { maskChar, preserveStart, preserveEnd } = opts;
  
  // If the value is too short to mask meaningfully, mask it completely
  if (value.length <= (preserveStart || 0) + (preserveEnd || 0)) {
    return maskChar.repeat(value.length);
  }
  
  const start = value.substring(0, preserveStart || 0);
  const end = value.substring(value.length - (preserveEnd || 0));
  const maskedLength = value.length - (preserveStart || 0) - (preserveEnd || 0);
  const masked = maskChar.repeat(maskedLength);
  
  return `${start}${masked}${end}`;
}

/**
 * Detects and masks PII patterns in a string
 * @param text The text to sanitize
 * @param options Sanitization options
 * @returns The sanitized text with PII masked
 */
export function maskPII(text: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!text || typeof text !== 'string' || text.length === 0 || !opts.detectPII) {
    return text;
  }
  
  let sanitized = text;
  
  // Replace email addresses
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.EMAIL, (match) => {
    const atIndex = match.indexOf('@');
    if (atIndex > 0) {
      const username = match.substring(0, atIndex);
      const domain = match.substring(atIndex);
      return `${maskValue(username, { ...opts, preserveStart: 1, preserveEnd: 0 })}${domain}`;
    }
    return maskValue(match, opts);
  });
  
  // Replace phone numbers
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.PHONE, (match) => {
    return maskValue(match, { ...opts, preserveStart: 0, preserveEnd: 4 });
  });
  
  // Replace CPF (Brazilian ID)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.CPF, (match) => {
    return maskValue(match, { ...opts, preserveStart: 0, preserveEnd: 2 });
  });
  
  // Replace RG (Brazilian ID)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.RG, (match) => {
    return maskValue(match, { ...opts, preserveStart: 0, preserveEnd: 2 });
  });
  
  // Replace credit card numbers
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.CREDIT_CARD, (match) => {
    // Remove spaces and dashes for consistent masking
    const cleaned = match.replace(/[\s-]/g, '');
    return maskValue(cleaned, { ...opts, preserveStart: 0, preserveEnd: 4 });
  });
  
  return sanitized;
}

/**
 * Detects and masks credential patterns in a string
 * @param text The text to sanitize
 * @param options Sanitization options
 * @returns The sanitized text with credentials masked
 */
export function maskCredentials(text: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!text || typeof text !== 'string' || text.length === 0 || !opts.detectCredentials) {
    return text;
  }
  
  let sanitized = text;
  
  // Replace password fields
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.PASSWORD_FIELD, (match, group) => {
    return match.replace(group, maskValue(group, opts));
  });
  
  // Replace token fields
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.TOKEN_FIELD, (match, field, token) => {
    return match.replace(token, maskValue(token, opts));
  });
  
  // Replace Basic Auth headers
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.BASIC_AUTH, (match) => {
    const parts = match.split(' ');
    if (parts.length === 2) {
      return `${parts[0]} ${maskValue(parts[1], opts)}`;
    }
    return match;
  });
  
  // Replace Bearer tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.BEARER_TOKEN, (match) => {
    const parts = match.split(' ');
    if (parts.length === 2) {
      return `${parts[0]} ${maskValue(parts[1], { ...opts, preserveStart: 3, preserveEnd: 3 })}`;
    }
    return match;
  });
  
  return sanitized;
}

/**
 * Sanitizes a string by masking PII and credentials
 * @param text The text to sanitize
 * @param options Sanitization options
 * @returns The sanitized text
 */
export function sanitizeString(text: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = text;
  
  if (opts.detectPII) {
    sanitized = maskPII(sanitized, opts);
  }
  
  if (opts.detectCredentials) {
    sanitized = maskCredentials(sanitized, opts);
  }
  
  return sanitized;
}

/**
 * Sanitizes an object by redacting sensitive fields and optionally detecting PII in string values
 * @param obj The object to sanitize
 * @param options Sanitization options
 * @param currentDepth Current recursion depth (used internally)
 * @returns A sanitized copy of the object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: SanitizationOptions = DEFAULT_OPTIONS,
  currentDepth = 0
): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sensitiveFields = [...DEFAULT_SENSITIVE_FIELDS, ...(opts.sensitiveFields || [])];
  const result = { ...obj };
  
  // Stop recursion if we've reached the maximum depth
  if (currentDepth >= (opts.maxDepth || DEFAULT_OPTIONS.maxDepth)) {
    return result;
  }
  
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const value = result[key];
      
      // Check if this is a sensitive field that should be redacted
      const isSensitiveField = sensitiveFields.some(field => 
        key.toLowerCase() === field.toLowerCase() || 
        key.toLowerCase().includes(field.toLowerCase())
      );
      
      if (isSensitiveField && value !== null && value !== undefined) {
        // Redact sensitive field
        result[key] = typeof value === 'string' 
          ? maskValue(value, opts) 
          : '[REDACTED]';
      } else if (typeof value === 'string') {
        // Sanitize string values for PII and credentials
        result[key] = sanitizeString(value, opts);
      } else if (opts.sanitizeNested && value !== null && typeof value === 'object') {
        // Recursively sanitize nested objects
        if (Array.isArray(value)) {
          result[key] = value.map(item => 
            typeof item === 'object' && item !== null
              ? sanitizeObject(item, opts, currentDepth + 1)
              : typeof item === 'string'
                ? sanitizeString(item, opts)
                : item
          );
        } else {
          result[key] = sanitizeObject(value, opts, currentDepth + 1);
        }
      }
    }
  }
  
  return result;
}

/**
 * Sanitizes HTTP request data for logging, removing sensitive information
 * @param request The HTTP request object to sanitize
 * @param options Sanitization options
 * @returns A sanitized copy of the request object safe for logging
 */
export function sanitizeRequest(
  request: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!request || typeof request !== 'object') {
    return request;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: Record<string, any> = {};
  
  // Copy and sanitize headers
  if (request.headers) {
    result.headers = { ...request.headers };
    
    // Specifically handle common auth headers
    const authHeaders = ['authorization', 'x-api-key', 'api-key', 'x-auth-token'];
    for (const header of authHeaders) {
      if (result.headers[header]) {
        result.headers[header] = maskCredentials(result.headers[header], opts);
      }
    }
    
    // Sanitize all other headers
    result.headers = sanitizeObject(result.headers, opts);
  }
  
  // Copy and sanitize query parameters
  if (request.query) {
    result.query = sanitizeObject(request.query, opts);
  }
  
  // Copy and sanitize request body
  if (request.body) {
    result.body = sanitizeObject(request.body, opts);
  }
  
  // Copy and sanitize URL
  if (request.url) {
    result.url = sanitizeString(request.url, opts);
  }
  
  // Copy non-sensitive fields
  const safeCopyFields = ['method', 'httpVersion', 'ip', 'path', 'route', 'protocol'];
  for (const field of safeCopyFields) {
    if (request[field] !== undefined) {
      result[field] = request[field];
    }
  }
  
  return result;
}

/**
 * Sanitizes HTTP response data for logging, removing sensitive information
 * @param response The HTTP response object to sanitize
 * @param options Sanitization options
 * @returns A sanitized copy of the response object safe for logging
 */
export function sanitizeResponse(
  response: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: Record<string, any> = {};
  
  // Copy and sanitize headers
  if (response.headers) {
    result.headers = sanitizeObject(response.headers, opts);
  }
  
  // Copy and sanitize body/data
  if (response.body) {
    result.body = sanitizeObject(response.body, opts);
  } else if (response.data) {
    result.data = sanitizeObject(response.data, opts);
  }
  
  // Copy non-sensitive fields
  const safeCopyFields = ['statusCode', 'status', 'statusMessage', 'type', 'size'];
  for (const field of safeCopyFields) {
    if (response[field] !== undefined) {
      result[field] = response[field];
    }
  }
  
  return result;
}

/**
 * Sanitizes error objects for logging, removing sensitive information
 * @param error The error object to sanitize
 * @param options Sanitization options
 * @returns A sanitized copy of the error object safe for logging
 */
export function sanitizeError(
  error: Error | Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!error) {
    return error;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result: Record<string, any>;
  
  if (error instanceof Error) {
    // Handle standard Error objects
    result = {
      name: error.name,
      message: sanitizeString(error.message, opts),
      stack: error.stack,
    };
    
    // Copy any additional properties from the error object
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key) && !['name', 'message', 'stack'].includes(key)) {
        const value = (error as any)[key];
        if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value, opts);
        } else if (typeof value === 'string') {
          result[key] = sanitizeString(value, opts);
        } else {
          result[key] = value;
        }
      }
    }
  } else {
    // Handle error-like objects
    result = sanitizeObject(error, opts);
  }
  
  return result;
}

/**
 * Creates a sanitization middleware for Express/NestJS that sanitizes request and response data before logging
 * @param options Sanitization options
 * @returns A middleware function that can be used with Express/NestJS
 */
export function createSanitizationMiddleware(options: SanitizationOptions = DEFAULT_OPTIONS) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return (req: any, res: any, next: () => void) => {
    // Store the original request body for processing
    const originalBody = { ...req.body };
    
    // Override the JSON stringifier to sanitize logs
    const originalSend = res.send;
    res.send = function(body: any) {
      res.locals = res.locals || {};
      res.locals.responseBody = body;
      return originalSend.call(this, body);
    };
    
    // Continue with the request
    next();
  };
}

/**
 * Sanitizes journey-specific data based on the journey type
 * @param data The journey data to sanitize
 * @param journeyType The type of journey ('health', 'care', or 'plan')
 * @param options Sanitization options
 * @returns A sanitized copy of the journey data
 */
export function sanitizeJourneyData(
  data: Record<string, any>,
  journeyType: 'health' | 'care' | 'plan',
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Add journey-specific sensitive fields
  const journeySpecificFields: Record<string, string[]> = {
    health: [
      'medicalRecordNumber',
      'medical_record_number',
      'healthMetric',
      'health_metric',
      'biometricData',
      'biometric_data',
      'deviceId',
      'device_id',
    ],
    care: [
      'diagnosisCode',
      'diagnosis_code',
      'medicationName',
      'medication_name',
      'prescriptionId',
      'prescription_id',
      'providerNotes',
      'provider_notes',
    ],
    plan: [
      'membershipId',
      'membership_id',
      'policyNumber',
      'policy_number',
      'claimId',
      'claim_id',
      'benefitCode',
      'benefit_code',
    ],
  };
  
  // Create a new options object with journey-specific sensitive fields
  const journeyOptions: SanitizationOptions = {
    ...opts,
    sensitiveFields: [
      ...(opts.sensitiveFields || []),
      ...(journeySpecificFields[journeyType] || []),
    ],
  };
  
  return sanitizeObject(data, journeyOptions);
}

/**
 * Sanitizes gamification event data to protect sensitive user information
 * @param eventData The gamification event data to sanitize
 * @param options Sanitization options
 * @returns A sanitized copy of the event data
 */
export function sanitizeGamificationEvent(
  eventData: Record<string, any>,
  options: SanitizationOptions = DEFAULT_OPTIONS
): Record<string, any> {
  if (!eventData || typeof eventData !== 'object') {
    return eventData;
  }
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Add gamification-specific sensitive fields
  const gamificationSensitiveFields = [
    'userId',
    'user_id',
    'profileId',
    'profile_id',
    'achievementData',
    'achievement_data',
    'rewardCode',
    'reward_code',
  ];
  
  // Create a new options object with gamification-specific sensitive fields
  const gamificationOptions: SanitizationOptions = {
    ...opts,
    sensitiveFields: [
      ...(opts.sensitiveFields || []),
      ...gamificationSensitiveFields,
    ],
  };
  
  return sanitizeObject(eventData, gamificationOptions);
}