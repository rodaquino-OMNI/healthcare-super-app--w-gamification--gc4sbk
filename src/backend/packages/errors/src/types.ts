/**
 * Base error types for the application
 */
export enum ErrorType {
  VALIDATION = 'validation',
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  EXTERNAL = 'external'
}

/**
 * Base error class that all application errors extend
 */
export abstract class BaseError extends Error {
  /**
   * The error type (validation, business, technical, external)
   */
  public readonly type: ErrorType;

  /**
   * The error code (used for client-side error handling)
   */
  public readonly code: string;

  /**
   * Additional error details
   */
  public readonly details?: Record<string, any>;

  /**
   * Create a new BaseError
   */
  constructor(message: string, type: ErrorType, code: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert the error to a JSON object for API responses
   */
  toJSON(): any {
    const error = {
      type: this.type,
      code: this.code,
      message: this.message
    };

    // Only include details in non-production environments or if they don't contain sensitive data
    if (this.details && (process.env.NODE_ENV !== 'production' || !this.containsSensitiveData(this.details))) {
      return {
        error: {
          ...error,
          details: this.sanitizeDetails(this.details)
        }
      };
    }

    return { error };
  }

  /**
   * Check if an object contains sensitive data
   */
  private containsSensitiveData(obj: Record<string, any>): boolean {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'socialSecurity'];
    
    return this.objectContainsKeys(obj, sensitiveKeys);
  }

  /**
   * Recursively check if an object contains any of the specified keys
   */
  private objectContainsKeys(obj: Record<string, any>, keys: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    for (const key in obj) {
      if (keys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        return true;
      }

      if (typeof obj[key] === 'object' && this.objectContainsKeys(obj[key], keys)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sanitize an object by redacting sensitive data
   */
  private sanitizeDetails(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'creditCard', 'ssn', 'socialSecurity'];
    const result: Record<string, any> = {};

    for (const key in obj) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        result[key] = this.sanitizeDetails(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }

    return result;
  }
}