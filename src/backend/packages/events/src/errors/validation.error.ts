/**
 * Validation error class for type conversion and validation failures.
 * 
 * This module provides a specialized error class for validation failures
 * during type conversion and data validation. It includes context about
 * the validation failure to aid in debugging and error reporting.
 * 
 * @module validation.error
 */

/**
 * Context information for validation errors
 */
export interface ValidationErrorContext {
  /** The value that failed validation */
  value: any;
  /** The target type or validation rule that failed */
  targetType?: string;
  /** The property path in the object being validated */
  property?: string;
  /** The journey context (health, care, plan) */
  journeyContext?: string;
  /** Additional context specific to the validation failure */
  [key: string]: any;
}

/**
 * Error class for validation failures during type conversion and data validation
 */
export class ValidationError extends Error {
  /** The context of the validation failure */
  public readonly context: ValidationErrorContext;
  
  /**
   * Creates a new ValidationError instance
   * @param message The error message
   * @param context The validation error context
   */
  constructor(message: string, context: ValidationErrorContext) {
    super(message);
    this.name = 'ValidationError';
    this.context = context;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
  
  /**
   * Creates a formatted error message with context
   * @returns Formatted error message
   */
  public getFormattedMessage(): string {
    const { value, targetType, property, journeyContext } = this.context;
    
    let formattedMessage = this.message;
    
    if (property) {
      formattedMessage += `\nProperty: ${property}`;
    }
    
    if (targetType) {
      formattedMessage += `\nTarget Type: ${targetType}`;
    }
    
    if (journeyContext) {
      formattedMessage += `\nJourney: ${journeyContext}`;
    }
    
    formattedMessage += `\nValue: ${formatValue(value)}`;
    
    return formattedMessage;
  }
  
  /**
   * Converts the error to a plain object for serialization
   * @returns Plain object representation of the error
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      formattedMessage: this.getFormattedMessage(),
      context: this.context,
    };
  }
}

/**
 * Formats a value for display in error messages
 * @param value The value to format
 * @returns Formatted string representation of the value
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (typeof value === 'string') {
    return `"${value.length > 50 ? value.substring(0, 47) + '...' : value}"`;
  }
  
  if (typeof value === 'object') {
    try {
      const json = JSON.stringify(value);
      return json.length > 100 ? json.substring(0, 97) + '...' : json;
    } catch {
      return Object.prototype.toString.call(value);
    }
  }
  
  return String(value);
}