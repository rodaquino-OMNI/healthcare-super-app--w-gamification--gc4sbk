import { HttpStatus } from '@nestjs/common';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { AppException, ErrorType } from '@austa/errors';

/**
 * Interface for structured validation errors by field
 */
export interface ValidationErrorItem {
  field: string;
  messages: string[];
  value?: any;
  children?: ValidationErrorItem[];
}

/**
 * Specialized client exception for handling validation failures in API requests and event payloads.
 * Provides detailed field-specific validation errors to help clients correct their requests
 * while maintaining a consistent error response structure.
 */
export class ValidationException extends AppException {
  /**
   * Creates a new ValidationException instance.
   * 
   * @param message - Human-readable error message
   * @param validationErrors - Detailed validation errors by field
   * @param context - Additional context about the validation failure
   */
  constructor(
    message: string,
    private readonly validationErrors: Record<string, string[]> | ValidationErrorItem[],
    context?: Record<string, any>
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'GAMIFICATION_VALIDATION_ERROR',
      {
        validationErrors,
        ...context
      }
    );

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ValidationException.prototype);
  }

  /**
   * Creates a ValidationException from class-validator ValidationError objects.
   * 
   * @param errors - The validation errors from class-validator
   * @param context - Additional context about the validation failure
   * @returns A new ValidationException with formatted error details
   */
  static fromClassValidator(
    errors: ClassValidatorError[],
    context?: Record<string, any>
  ): ValidationException {
    const formattedErrors = this.formatClassValidatorErrors(errors);
    
    // Create a human-readable error message
    const errorCount = formattedErrors.length;
    const message = errorCount === 1
      ? `Validation failed: ${formattedErrors[0].field} is invalid`
      : `Validation failed with ${errorCount} errors`;

    return new ValidationException(message, formattedErrors, context);
  }

  /**
   * Creates a ValidationException from a Zod validation error.
   * 
   * @param zodError - The Zod validation error
   * @param context - Additional context about the validation failure
   * @returns A new ValidationException with formatted error details
   */
  static fromZodError(zodError: any, context?: Record<string, any>): ValidationException {
    const validationErrors: Record<string, string[]> = {};
    
    // Format Zod validation errors into field-specific messages
    if (zodError.issues && Array.isArray(zodError.issues)) {
      zodError.issues.forEach((issue: any) => {
        const path = issue.path.join('.');
        if (!validationErrors[path]) {
          validationErrors[path] = [];
        }
        validationErrors[path].push(issue.message);
      });
    }

    // Create a human-readable error message
    const errorCount = Object.keys(validationErrors).length;
    const message = errorCount === 1
      ? `Validation failed: ${Object.keys(validationErrors)[0]} is invalid`
      : `Validation failed with ${errorCount} errors`;

    return new ValidationException(message, validationErrors, context);
  }

  /**
   * Creates a ValidationException for a missing required field.
   * 
   * @param fieldName - Name of the required field that is missing
   * @param context - Additional context about the validation failure
   * @returns A new ValidationException for the missing field
   */
  static missingRequiredField(
    fieldName: string,
    context?: Record<string, any>
  ): ValidationException {
    const validationErrors: Record<string, string[]> = {
      [fieldName]: [`${fieldName} is required`],
    };

    return new ValidationException(
      `Validation failed: ${fieldName} is required`,
      validationErrors,
      context
    );
  }

  /**
   * Creates a ValidationException for an invalid field value.
   * 
   * @param fieldName - Name of the field with an invalid value
   * @param expectedType - Expected type or format of the field
   * @param actualValue - The actual value that was provided (optional)
   * @param context - Additional context about the validation failure
   * @returns A new ValidationException for the invalid field
   */
  static invalidFieldValue(
    fieldName: string,
    expectedType: string,
    actualValue?: any,
    context?: Record<string, any>
  ): ValidationException {
    const validationErrors: Record<string, string[]> = {
      [fieldName]: [`${fieldName} must be a valid ${expectedType}`],
    };

    const extendedContext = actualValue !== undefined 
      ? { ...context, value: actualValue }
      : context;

    return new ValidationException(
      `Validation failed: ${fieldName} must be a valid ${expectedType}`,
      validationErrors,
      extendedContext
    );
  }

  /**
   * Creates a ValidationException for an unsupported value.
   * 
   * @param fieldName - Name of the field with an unsupported value
   * @param value - The unsupported value
   * @param supportedValues - List of supported values
   * @param context - Additional context about the validation failure
   * @returns A new ValidationException for the unsupported value
   */
  static unsupportedValue(
    fieldName: string,
    value: any,
    supportedValues: any[],
    context?: Record<string, any>
  ): ValidationException {
    const validationErrors: Record<string, string[]> = {
      [fieldName]: [`Unsupported ${fieldName}: ${value}. Supported values: ${supportedValues.join(', ')}`],
    };

    return new ValidationException(
      `Validation failed: Unsupported ${fieldName}: ${value}`,
      validationErrors,
      context
    );
  }

  /**
   * Formats class-validator ValidationError objects into a standardized structure.
   * 
   * @param errors - The validation errors from class-validator
   * @returns An array of formatted validation error items
   * @private
   */
  private static formatClassValidatorErrors(errors: ClassValidatorError[]): ValidationErrorItem[] {
    return errors.map(error => {
      const messages: string[] = [];
      
      if (error.constraints) {
        Object.values(error.constraints).forEach(message => {
          messages.push(message);
        });
      }

      const item: ValidationErrorItem = {
        field: error.property,
        messages,
        value: error.value
      };

      if (error.children && error.children.length > 0) {
        item.children = this.formatClassValidatorErrors(error.children);
      }

      return item;
    });
  }

  /**
   * Returns the validation errors.
   * 
   * @returns The validation errors by field
   */
  getValidationErrors(): Record<string, string[]> | ValidationErrorItem[] {
    return this.validationErrors;
  }

  /**
   * Converts the exception to an HTTP response object.
   * 
   * @returns A client-friendly HTTP response object
   */
  toResponse(): Record<string, any> {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Validation Error',
      message: this.message,
      validationErrors: this.validationErrors
    };
  }

  /**
   * Serializes the exception to a JSON-compatible object for logging.
   * 
   * @returns A structured representation of the error for logging systems
   */
  toLog(): Record<string, any> {
    return {
      name: this.constructor.name,
      message: this.message,
      type: this.type,
      code: this.code,
      validationErrors: this.validationErrors,
      details: this.details,
      stack: this.stack
    };
  }
}