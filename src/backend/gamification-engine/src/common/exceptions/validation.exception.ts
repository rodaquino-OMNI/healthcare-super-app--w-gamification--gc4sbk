import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Interface for field validation errors
 */
export interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
  constraints?: Record<string, string>;
}

/**
 * Specialized client exception for handling validation failures in API requests and event payloads.
 * Provides detailed field-specific validation errors to help clients correct their requests
 * while maintaining a consistent error response structure.
 */
export class ValidationException extends ClientException {
  public readonly fieldErrors: FieldValidationError[];
  
  /**
   * Creates a new ValidationException instance
   * 
   * @param message Human-readable error message
   * @param fieldErrors Array of field-specific validation errors
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    message: string,
    fieldErrors: FieldValidationError[] = [],
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    super(
      message,
      ErrorType.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      undefined,
      metadata,
      context,
    );
    
    this.fieldErrors = fieldErrors;
    
    // Add field errors to metadata
    this.addMetadata('fieldErrors', fieldErrors);
  }
  
  /**
   * Creates a ValidationException from a class-validator error array
   * 
   * @param errors Array of validation errors from class-validator
   * @param message Custom error message (optional)
   * @returns ValidationException instance
   */
  static fromClassValidatorErrors(
    errors: any[],
    message: string = 'Validation failed',
  ): ValidationException {
    const fieldErrors: FieldValidationError[] = errors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
      value: error.value,
      constraints: error.constraints,
    }));
    
    return new ValidationException(message, fieldErrors);
  }
  
  /**
   * Creates a ValidationException from a Zod error
   * 
   * @param zodError Zod validation error
   * @param message Custom error message (optional)
   * @returns ValidationException instance
   */
  static fromZodError(
    zodError: any,
    message: string = 'Validation failed',
  ): ValidationException {
    const fieldErrors: FieldValidationError[] = zodError.errors.map((error: any) => ({
      field: error.path.join('.'),
      message: error.message,
      value: error.input,
    }));
    
    return new ValidationException(message, fieldErrors);
  }
  
  /**
   * Creates a ValidationException for a specific field
   * 
   * @param field Field name
   * @param message Error message
   * @param value Field value
   * @returns ValidationException instance
   */
  static forField(
    field: string,
    message: string,
    value?: any,
  ): ValidationException {
    const fieldError: FieldValidationError = {
      field,
      message,
      value,
    };
    
    return new ValidationException(
      `Validation failed: ${message}`,
      [fieldError],
    );
  }
  
  /**
   * Creates a ValidationException for multiple fields
   * 
   * @param errors Object mapping field names to error messages
   * @returns ValidationException instance
   */
  static forFields(
    errors: Record<string, string>,
  ): ValidationException {
    const fieldErrors: FieldValidationError[] = Object.entries(errors).map(
      ([field, message]) => ({
        field,
        message,
      }),
    );
    
    return new ValidationException(
      'Validation failed for multiple fields',
      fieldErrors,
    );
  }
  
  /**
   * Gets safe metadata for client responses
   * For validation errors, we include detailed field errors
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    return {
      fieldErrors: this.fieldErrors.map(error => ({
        field: error.field,
        message: error.message,
        // Don't include the actual value in responses for security/privacy
      })),
    };
  }
  
  /**
   * Gets a client-friendly error message
   * 
   * @returns Client-friendly error message
   */
  getClientMessage(): string {
    if (this.fieldErrors.length === 1) {
      return `Validation error: ${this.fieldErrors[0].message}`;
    }
    
    return `Validation failed with ${this.fieldErrors.length} errors`;
  }
}